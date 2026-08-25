import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { NextResponse } from "next/server";
import { getGeminiApiKey, isGeminiConfigured, friendlyGeminiError } from "@/lib/runtime-config";
import {
  buildAdvisorSystemPrompt,
  loadScanForAdvisor,
  readScanIdFromBody,
} from "@/lib/scan-advisor";

export const maxDuration = 60;

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"];

export async function POST(req: Request) {
  if (!isGeminiConfigured()) {
    return NextResponse.json(
      {
        error:
          "Gemini is not ready. Add GOOGLE_GENERATIVE_AI_API_KEY to .env.local, then stop the app and run pnpm dev:clean.",
      },
      { status: 503 }
    );
  }

  const apiKey = getGeminiApiKey();
  const google = createGoogleGenerativeAI({ apiKey });

  const body = (await req.json()) as Record<string, unknown>;
  const messages = (body.messages as UIMessage[]) || [];
  const scanId = readScanIdFromBody(body);

  const scan = scanId ? await loadScanForAdvisor(scanId) : null;
  if (scanId && !scan) {
    console.warn("Ask AI: scan was not found in MongoDB", scanId);
  }

  let modelMessages;
  try {
    modelMessages = await convertToModelMessages(messages);
  } catch (error) {
    console.error("Ask AI message parse error", error);
    return NextResponse.json(
      { error: "Could not read that question. Try sending it again." },
      { status: 400 }
    );
  }

  let lastError: unknown;
  for (const modelId of GEMINI_MODELS) {
    try {
      const result = streamText({
        model: google(modelId),
        system: buildAdvisorSystemPrompt(scan),
        temperature: 0.4,
        messages: modelMessages,
      });

      return result.toUIMessageStreamResponse({
        onError: (error) => friendlyGeminiError(error),
      });
    } catch (error) {
      lastError = error;
      console.warn(`Ask AI model ${modelId} failed:`, error);
    }
  }

  return NextResponse.json(
    { error: friendlyGeminiError(lastError) },
    { status: 502 }
  );
}
