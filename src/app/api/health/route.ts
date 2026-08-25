import { NextResponse } from "next/server";
import { isGeminiConfigured } from "@/lib/runtime-config";
import { getMongoStatus } from "@/lib/supabase";

export async function GET() {
  const mongo = await getMongoStatus();
  const gemini = { configured: isGeminiConfigured() };

  return NextResponse.json({
    ok: mongo.connected && gemini.configured,
    mongo,
    gemini,
  });
}
