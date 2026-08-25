import { NextResponse } from "next/server";
import { getGeminiKeyStatus } from "@/lib/runtime-config";
import { getMongoStatus } from "@/lib/supabase";

export async function GET() {
  const mongo = await getMongoStatus();
  const gemini = getGeminiKeyStatus();

  return NextResponse.json({
    ok: mongo.connected && gemini.configured,
    mongo,
    gemini,
  });
}
