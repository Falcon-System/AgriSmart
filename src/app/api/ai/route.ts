import { NextResponse } from "next/server";
import { friendlyGeminiError, getGeminiApiKey, isGeminiConfigured } from "@/lib/runtime-config";
import { generateAdvisorText } from "@/lib/gemini-native";
import {
  buildAdvisorSystemPrompt,
  loadScanForAdvisor,
  readScanIdFromBody,
} from "@/lib/scan-advisor";

export const maxDuration = 60;

type ChatPart = { type?: string; text?: string };
type ChatMessage = { role?: string; parts?: ChatPart[]; content?: string };

function turnsFromMessages(messages: ChatMessage[]) {
  return messages
    .map((message) => {
      const text = Array.isArray(message.parts)
        ? message.parts
            .filter((part) => part?.type === "text")
            .map((part) => String(part.text || ""))
            .join("")
            .trim()
        : String(message.content || "").trim();
      const role = message.role === "assistant" || message.role === "model" ? "model" : "user";
      return { role: role as "user" | "model", text };
    })
    .filter((message) => message.text);
}

function uiMessageStream(text: string) {
  const chunks = [
    { type: "start" },
    { type: "text-start", id: "text-1" },
    { type: "text-delta", id: "text-1", delta: text },
    { type: "text-end", id: "text-1" },
    { type: "finish" },
  ];
  const body = `${chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join("")}data: [DONE]\n\n`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "x-vercel-ai-ui-message-stream": "v1",
    },
  });
}

export async function POST(req: Request) {
  if (!isGeminiConfigured()) {
    return NextResponse.json(
      {
        error: "AgriSmart AI is not ready yet. Please try again in a moment.",
      },
      { status: 503 }
    );
  }

  const apiKey = getGeminiApiKey();
  const body = (await req.json()) as Record<string, unknown>;
  const messages = ((body.messages as ChatMessage[]) || []);
  const scanId = readScanIdFromBody(body);
  const turns = turnsFromMessages(messages);

  if (turns.length === 0) {
    return NextResponse.json({ error: "Could not read that question. Try sending it again." }, { status: 400 });
  }

  const scan = scanId ? await loadScanForAdvisor(scanId) : null;
  if (scanId && !scan) {
    console.warn("Ask AI: scan was not found in MongoDB", scanId);
  }

  try {
    const text = await generateAdvisorText({
      apiKey,
      system: buildAdvisorSystemPrompt(scan),
      messages: turns,
    });
    return uiMessageStream(text);
  } catch (error) {
    console.error("Ask AI Gemini error", error);
    return NextResponse.json({ error: friendlyGeminiError(error) }, { status: 502 });
  }
}
