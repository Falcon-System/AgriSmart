import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const PLACEHOLDER_SECRET =
  /your-google-api-key|api-key-here|changeme|placeholder|example\.com|^your-|^changeme|^placeholder|^xxx$/i;

const GEMINI_ENV_NAMES = [
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "GEMINI_API_KEY",
  "GOOGLE_API_KEY",
] as const;

export type GeminiKeyStatus = {
  configured: boolean;
  reason: "ok" | "missing" | "placeholder" | "too_short";
  source: (typeof GEMINI_ENV_NAMES)[number] | ".env.local" | null;
  keyLength: number;
  looksLikeGoogleKey: boolean;
  hint: string;
};

function sanitizeSecret(value?: string | null) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}

function extractGoogleApiKey(value: string) {
  const compact = value.replace(/\s+/g, "");
  const match = compact.match(/AIza[0-9A-Za-z_\-]{20,}/);
  return match?.[0] || compact;
}

export function isPlaceholderSecret(value?: string | null) {
  const key = extractGoogleApiKey(sanitizeSecret(value));
  if (!key) return true;
  if (/^AIza[0-9A-Za-z_\-]{20,}$/.test(key)) return false;
  return key.length < 20 || PLACEHOLDER_SECRET.test(key);
}

function parseEnvFile(filePath: string) {
  const values: Record<string, string> = {};
  if (!existsSync(filePath)) return values;

  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    values[match[1]] = sanitizeSecret(match[2]);
  }
  return values;
}

function fileEnvValues() {
  return {
    ...parseEnvFile(resolve(process.cwd(), ".env")),
    ...parseEnvFile(resolve(process.cwd(), ".env.local")),
  };
}

function inspectCandidate(name: string, value: string, source: GeminiKeyStatus["source"]): GeminiKeyStatus {
  const key = extractGoogleApiKey(sanitizeSecret(value));
  const looksLikeGoogleKey = /^AIza[0-9A-Za-z_\-]{20,}$/.test(key);

  if (!key) {
    return {
      configured: false,
      reason: "missing",
      source,
      keyLength: 0,
      looksLikeGoogleKey: false,
      hint: `No value found for ${name}. Add GOOGLE_GENERATIVE_AI_API_KEY to .env.local.`,
    };
  }

  if (looksLikeGoogleKey) {
    return {
      configured: true,
      reason: "ok",
      source,
      keyLength: key.length,
      looksLikeGoogleKey: true,
      hint: "Gemini key is loaded.",
    };
  }

  if (PLACEHOLDER_SECRET.test(key) || /your-google-api-key-here/i.test(key)) {
    return {
      configured: false,
      reason: "placeholder",
      source,
      keyLength: key.length,
      looksLikeGoogleKey: false,
      hint: "The value in .env.local is still the example placeholder. Replace it with the key from Google AI Studio.",
    };
  }

  if (key.length < 20) {
    return {
      configured: false,
      reason: "too_short",
      source,
      keyLength: key.length,
      looksLikeGoogleKey: false,
      hint: "The Gemini key looks too short. Paste the full key from https://aistudio.google.com/apikey",
    };
  }

  return {
    configured: true,
    reason: "ok",
    source,
    keyLength: key.length,
    looksLikeGoogleKey: false,
    hint: "A key is loaded. If Ask AI still fails, create a new Google AI Studio key.",
  };
}

export function getGeminiKeyStatus(): GeminiKeyStatus {
  const fileValues = fileEnvValues();
  const candidates: Array<{ name: (typeof GEMINI_ENV_NAMES)[number]; value: string; source: GeminiKeyStatus["source"] }> = [];

  for (const name of GEMINI_ENV_NAMES) {
    if (process.env[name]) {
      candidates.push({ name, value: process.env[name] as string, source: name });
    }
    if (fileValues[name]) {
      candidates.push({ name, value: fileValues[name], source: ".env.local" });
    }
  }

  for (const candidate of candidates) {
    const status = inspectCandidate(candidate.name, candidate.value, candidate.source);
    if (status.configured) return status;
  }

  if (candidates.length > 0) {
    return inspectCandidate(candidates[0].name, candidates[0].value, candidates[0].source);
  }

  return {
    configured: false,
    reason: "missing",
    source: null,
    keyLength: 0,
    looksLikeGoogleKey: false,
    hint: "No Gemini key found. Add GOOGLE_GENERATIVE_AI_API_KEY to .env.local and run pnpm dev:clean.",
  };
}

export function getGeminiApiKey() {
  const status = getGeminiKeyStatus();
  if (!status.configured) return "";

  const fileValues = fileEnvValues();
  for (const name of GEMINI_ENV_NAMES) {
    const value = extractGoogleApiKey(sanitizeSecret(process.env[name] || fileValues[name] || ""));
    if (value && !isPlaceholderSecret(value)) {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = value;
      return value;
    }
  }
  return "";
}

export function isGeminiConfigured() {
  return getGeminiKeyStatus().configured;
}

export function friendlyGeminiError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");

  if (/API_KEY_INVALID|API key not valid|invalid api key|API key not found/i.test(message)) {
    return "The Gemini API key is not valid. Put a real key in .env.local as GOOGLE_GENERATIVE_AI_API_KEY, then run pnpm dev:clean.";
  }
  if (/quota|RESOURCE_EXHAUSTED|429|rate.?limit/i.test(message)) {
    return "Gemini is busy or over quota. Wait a minute and try again.";
  }
  if (/Fetch|ENOTFOUND|ECONNREFUSED|network|Failed to fetch/i.test(message)) {
    return "Could not reach Gemini. Check your internet connection and try again.";
  }
  if (/model|not found|404/i.test(message)) {
    return "This Gemini model is not enabled for your key. Open Google AI Studio and enable the Gemini API.";
  }
  return message.replace(/GOOGLE_GENERATIVE_AI_API_KEY|GEMINI_API_KEY/g, "API key") ||
    "Could not get an answer from Gemini. Try again.";
}
