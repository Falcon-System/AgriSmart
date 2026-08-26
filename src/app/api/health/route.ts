import { NextResponse } from "next/server";
import { getGeminiApiKey, getGeminiKeyStatus } from "@/lib/runtime-config";
import { probeGeminiKey } from "@/lib/gemini-native";
import { isGroqConfigured } from "@/lib/groq";
import { getMongoStatus } from "@/lib/supabase";

export async function GET() {
  const mongo = await getMongoStatus();
  const gemini = getGeminiKeyStatus();
  const apiKey = getGeminiApiKey();
  const probe = apiKey ? await probeGeminiKey(apiKey) : { accepted: false, error: gemini.hint };
  const groq = { configured: isGroqConfigured() };
  const aiReady = groq.configured || (gemini.configured && probe.accepted);

  return NextResponse.json({
    ok: mongo.connected && aiReady,
    runtime: {
      vercel: Boolean(process.env.VERCEL),
    },
    mongo,
    groq,
    gemini: {
      ...gemini,
      googleAccepted: probe.accepted,
      googleError: probe.accepted ? null : probe.error,
      hint: groq.configured
        ? "AgriSmart AI is ready."
        : probe.accepted
          ? gemini.hint
          : probe.error || gemini.hint,
    },
  });
}
