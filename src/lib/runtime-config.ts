import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { parse as parseDotenv } from "dotenv";

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
  source: string | null;
  keyLength: number;
  looksLikeGoogleKey: boolean;
  hint: string;
  cwd: string;
  filesFound: string[];
  keyNamesFound: string[];
};

function sanitizeSecret(value?: string | null) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
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

function isGeminiEnvName(name: string) {
  const normalized = name.trim().replace(/[-\s]/g, "_").toUpperCase();
  if ((GEMINI_ENV_NAMES as readonly string[]).includes(normalized)) return true;
  return (
    (normalized.includes("GEMINI") && normalized.includes("KEY")) ||
    (normalized.includes("GENERATIVE") && normalized.includes("KEY"))
  );
}

function readEnvFile(filePath: string) {
  const values: Record<string, string> = {};
  if (!existsSync(filePath)) return values;

  const buffer = readFileSync(filePath);
  const text =
    buffer[0] === 0xff && buffer[1] === 0xfe
      ? buffer.toString("utf16le")
      : buffer.toString("utf8").replace(/^\uFEFF/, "");

  const parsed = parseDotenv(text);
  for (const [rawName, rawValue] of Object.entries(parsed)) {
    const name = rawName.trim().replace(/^\uFEFF/, "");
    if (!name) continue;
    values[name] = sanitizeSecret(rawValue);
  }
  return values;
}

function discoverEnvFiles() {
  const files: string[] = [];
  const seen = new Set<string>();
  const add = (filePath: string) => {
    if (existsSync(filePath) && !seen.has(filePath)) {
      seen.add(filePath);
      files.push(filePath);
    }
  };

  const dirs = [process.cwd()];
  let dir = process.cwd();
  for (let i = 0; i < 5; i += 1) {
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
    dirs.push(dir);
  }
  for (const extra of ["frontend", "web", "AgriSmart", "cassava_frontend", "app"]) {
    dirs.push(join(process.cwd(), extra));
  }

  for (const folder of dirs) {
    add(join(folder, ".env.local"));
    add(join(folder, ".env.local.txt"));
    add(join(folder, ".env"));
  }
  return files;
}

function mergedFileEnv() {
  const files = discoverEnvFiles();
  const values: Record<string, string> = {};
  for (const file of files) {
    Object.assign(values, readEnvFile(file));
  }
  return { files, values };
}

function inspectCandidate(name: string, value: string, source: string): Omit<GeminiKeyStatus, "cwd" | "filesFound" | "keyNamesFound"> {
  const key = extractGoogleApiKey(sanitizeSecret(value));
  const looksLikeGoogleKey = /^AIza[0-9A-Za-z_\-]{20,}$/.test(key);

  if (!key) {
    return {
      configured: false,
      reason: "missing",
      source,
      keyLength: 0,
      looksLikeGoogleKey: false,
      hint: `Found ${name}, but it is empty.`,
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
      hint: "The value is still the example placeholder. Replace it with the key from Google AI Studio.",
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

function withFileMeta(
  status: Omit<GeminiKeyStatus, "cwd" | "filesFound" | "keyNamesFound">,
  files: string[],
  values: Record<string, string>
): GeminiKeyStatus {
  return {
    ...status,
    cwd: process.cwd(),
    filesFound: files,
    keyNamesFound: Object.keys(values).filter((name) => /key|gemini|google|mongo|jwt/i.test(name)),
  };
}

export function getGeminiKeyStatus(): GeminiKeyStatus {
  const { files, values } = mergedFileEnv();
  const candidates: Array<{ name: string; value: string; source: string }> = [];

  for (const name of Object.keys(process.env)) {
    if (!isGeminiEnvName(name) || !process.env[name]) continue;
    candidates.push({ name, value: process.env[name] as string, source: `process:${name}` });
  }

  for (const name of Object.keys(values)) {
    if (!isGeminiEnvName(name) || !values[name]) continue;
    candidates.push({ name, value: values[name], source: `file:${name}` });
  }

  for (const candidate of candidates) {
    const status = inspectCandidate(candidate.name, candidate.value, candidate.source);
    if (status.configured) return withFileMeta(status, files, values);
  }

  if (candidates.length > 0) {
    return withFileMeta(inspectCandidate(candidates[0].name, candidates[0].value, candidates[0].source), files, values);
  }

  if (files.length === 0) {
    return withFileMeta(
      {
        configured: false,
        reason: "missing",
        source: null,
        keyLength: 0,
        looksLikeGoogleKey: false,
        hint: `No .env.local file found. Create it next to package.json in ${process.cwd()}`,
      },
      files,
      values
    );
  }

  return withFileMeta(
    {
      configured: false,
      reason: "missing",
      source: null,
      keyLength: 0,
      looksLikeGoogleKey: false,
      hint: "Found an env file, but it has no GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY line. Put the key next to package.json, not in a backend folder.",
    },
    files,
    values
  );
}

export function getGeminiApiKey() {
  const status = getGeminiKeyStatus();
  if (!status.configured) return "";

  const { values } = mergedFileEnv();
  const pool = { ...values, ...process.env };
  for (const name of Object.keys(pool)) {
    if (!isGeminiEnvName(name)) continue;
    const value = extractGoogleApiKey(sanitizeSecret(pool[name]));
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
