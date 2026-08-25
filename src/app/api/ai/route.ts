import { google } from "@ai-sdk/google";
import { streamText, type UIMessage, convertToModelMessages } from "ai";
import { NextResponse } from "next/server";
import { getGeminiApiKey, isGeminiConfigured } from "@/lib/runtime-config";
import { buildAdvisorSystemPrompt, loadScanForAdvisor } from "@/lib/scan-advisor";

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!isGeminiConfigured()) {
    return NextResponse.json(
      { error: "Ask AI is not available yet. Please try again later." },
      { status: 503 }
    );
  }

  process.env.GOOGLE_GENERATIVE_AI_API_KEY = getGeminiApiKey();

  const body = await req.json();
  const messages = body.messages as UIMessage[];
  const scanId = typeof body.scanId === "string" ? body.scanId : undefined;

  let scan = null;
  if (scanId) {
    scan = await loadScanForAdvisor(scanId);
    if (!scan) {
      return NextResponse.json({ error: "Scan record not found." }, { status: 404 });
    }
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
