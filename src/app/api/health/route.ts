import { NextResponse } from "next/server";
import { getGeminiApiKey, getGeminiKeyStatus } from "@/lib/runtime-config";
import { probeGeminiKey } from "@/lib/gemini-native";
import { getMongoStatus } from "@/lib/supabase";

export async function GET() {
  const mongo = await getMongoStatus();
  const gemini = getGeminiKeyStatus();
  const apiKey = getGeminiApiKey();
  const probe = apiKey ? await probeGeminiKey(apiKey) : { accepted: false, error: gemini.hint };

  return NextResponse.json({
    ok: mongo.connected && gemini.configured && probe.accepted,
    runtime: {
      vercel: Boolean(process.env.VERCEL),
    },
    mongo,
    gemini: {
      ...gemini,
      googleAccepted: probe.accepted,
      googleError: probe.accepted ? null : probe.error,
      hint: probe.accepted ? gemini.hint : probe.error || gemini.hint,
    },
  });
}
