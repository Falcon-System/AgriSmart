import { google } from "@ai-sdk/google";
import { streamText, type UIMessage, convertToModelMessages } from "ai";
import { NextResponse } from "next/server";
import { getGeminiApiKey, isGeminiConfigured } from "@/lib/runtime-config";
import {
  buildAdvisorSystemPrompt,
  loadScanForAdvisor,
  readScanIdFromBody,
} from "@/lib/scan-advisor";

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!isGeminiConfigured()) {
    return NextResponse.json(
      { error: "Ask AI is not available yet. Add a Gemini key to .env.local and restart the app." },
      { status: 503 }
    );
  }

  process.env.GOOGLE_GENERATIVE_AI_API_KEY = getGeminiApiKey();

  const body = (await req.json()) as Record<string, unknown>;
  const messages = (body.messages as UIMessage[]) || [];
  const scanId = readScanIdFromBody(body);

  const scan = scanId ? await loadScanForAdvisor(scanId) : null;
  if (scanId && !scan) {
    console.warn("Ask AI: scan was not found in MongoDB", scanId);
  }

  try {
    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: buildAdvisorSystemPrompt(scan),
      temperature: 0.4,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Ask AI error", error);
    return NextResponse.json(
      { error: "Could not get an answer. Please try again." },
      { status: 500 }
    );
  }
}
