import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";
import { getGeminiApiKey, getGeminiKeyStatus, isPlaceholderSecret } from "@/lib/runtime-config";

function isLocalHost(req: Request) {
  const host = (req.headers.get("host") || "").split(":")[0];
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.startsWith("192.168.") ||
    host.startsWith("10.")
  );
}

function extractKey(value: string) {
  const compact = String(value || "")
    .replace(/^\uFEFF/, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\s+/g, "");
  return compact.match(/AIza[0-9A-Za-z_\-]{20,}/)?.[0] || compact;
}

function upsertEnvLocal(updates: Record<string, string>) {
  const filePath = join(process.cwd(), ".env.local");
  let text = existsSync(filePath) ? readFileSync(filePath, "utf8").replace(/^\uFEFF/, "") : "";

  for (const [name, value] of Object.entries(updates)) {
    const line = `${name}="${value.replace(/"/g, "")}"`;
    const pattern = new RegExp(`^\\s*(?:export\\s+|set\\s+)?${name}\\s*=.*$`, "im");
    if (pattern.test(text)) {
      text = text.replace(pattern, line);
    } else {
      text = `${text.replace(/\s*$/, "")}\n${line}\n`;
    }
  }

  writeFileSync(filePath, text.endsWith("\n") ? text : `${text}\n`, { encoding: "utf8" });
}

export async function POST(req: Request) {
  if (!isLocalHost(req)) {
    return NextResponse.json({ error: "Gemini key setup is only allowed on your local computer." }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { key?: string };
  const key = extractKey(body.key || "");

  if (!key || isPlaceholderSecret(key)) {
    return NextResponse.json(
      { error: "Paste a real Google AI Studio key. It usually starts with AIza." },
      { status: 400 }
    );
  }

  upsertEnvLocal({
    GOOGLE_GENERATIVE_AI_API_KEY: key,
    GEMINI_API_KEY: key,
  });

  process.env.GOOGLE_GENERATIVE_AI_API_KEY = key;
  process.env.GEMINI_API_KEY = key;
  process.env.GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || key;

  return NextResponse.json({
    ok: Boolean(getGeminiApiKey()),
    gemini: getGeminiKeyStatus(),
  });
}
