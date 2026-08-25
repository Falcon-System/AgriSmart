import { google } from "@ai-sdk/google";
import { streamText, type UIMessage, convertToModelMessages } from "ai";
import { NextResponse } from "next/server";
import { buildAdvisorSystemPrompt, loadScanForAdvisor } from "@/lib/scan-advisor";

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GEMINI_API_KEY) {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
  }

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

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: buildAdvisorSystemPrompt(scan),
    temperature: 0.4,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
