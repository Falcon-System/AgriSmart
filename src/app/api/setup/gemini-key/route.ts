import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";
import { getGeminiApiKey, getGeminiKeyStatus, isPlaceholderSecret } from "@/lib/runtime-config";
import { isGroqConfigured, looksLikeGroqApiKey } from "@/lib/groq";

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
  return compact.match(/gsk_[A-Za-z0-9]{20,}/)?.[0]
    || compact.match(/AQ\.[A-Za-z0-9._\-]{20,}/)?.[0]
    || compact.match(/AIza[0-9A-Za-z_\-]{20,}/)?.[0]
    || compact;
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

async function verifyGroqKey(key: string) {
  const response = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(12000),
  });
  if (response.ok) return { ok: true as const };
  const body = await response.text();
  if (/invalid.?api.?key|unauthorized|401/i.test(body) || response.status === 401) {
    return {
      ok: false as const,
      error: "This AgriSmart AI key was rejected. Create a new Groq key at https://console.groq.com/keys.",
    };
  }
  return {
    ok: false as const,
    error: "Groq did not accept this key. Check the key at https://console.groq.com/keys and try again.",
  };
}

async function verifyGeminiKey(key: string) {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1", {
    headers: { "x-goog-api-key": key },
  });
  if (response.ok) return { ok: true as const };
  const body = await response.text();
  if (/API_KEY_INVALID|API key not valid/i.test(body)) {
    return {
      ok: false as const,
      error:
        "This AgriSmart AI key was rejected. Try a new key from aistudio.google.com/apikey.",
    };
  }
  return {
    ok: false as const,
    error: "Google did not accept this key. Check that Generative Language API is enabled for the project.",
  };
}

export async function POST(req: Request) {
  if (!isLocalHost(req)) {
    return NextResponse.json({ error: "AgriSmart AI key setup is only allowed on your local computer." }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { key?: string };
  const key = extractKey(body.key || "");

  if (!key || isPlaceholderSecret(key)) {
    return NextResponse.json(
      { error: "Paste a Groq key (gsk_...) or a Google AI Studio key." },
      { status: 400 }
    );
  }

  if (looksLikeGroqApiKey(key)) {
    const verified = await verifyGroqKey(key);
    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: 400 });
    }

    upsertEnvLocal({ GROQ_API_KEY: key });
    process.env.GROQ_API_KEY = key;

    return NextResponse.json({
      ok: isGroqConfigured(),
      groq: { configured: isGroqConfigured() },
      gemini: getGeminiKeyStatus(),
    });
  }

  const verified = await verifyGeminiKey(key);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: 400 });
  }

  upsertEnvLocal({
    GOOGLE_GENERATIVE_AI_API_KEY: key,
    GEMINI_API_KEY: key,
  });

  process.env.GOOGLE_GENERATIVE_AI_API_KEY = key;
  process.env.GEMINI_API_KEY = key;
  process.env.GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || key;

  return NextResponse.json({
    ok: Boolean(getGeminiApiKey()) || isGroqConfigured(),
    groq: { configured: isGroqConfigured() },
    gemini: getGeminiKeyStatus(),
  });
}
