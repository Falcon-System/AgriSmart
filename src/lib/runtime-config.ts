const PLACEHOLDER_SECRET =
  /your-google-api-key|api-key-here|changeme|placeholder|example\.com|^your-|^changeme|^placeholder|^xxx$/i;

export function isPlaceholderSecret(value?: string | null) {
  const trimmed = value?.trim().replace(/^["']|["']$/g, "") ?? "";
  if (!trimmed) return true;
  if (/^AIza[0-9A-Za-z_\-]{20,}$/.test(trimmed)) return false;
  return trimmed.length < 20 || PLACEHOLDER_SECRET.test(trimmed);
}

export function getGeminiApiKey() {
  const candidates = [
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.GEMINI_API_KEY,
  ];

  for (const candidate of candidates) {
    const key = candidate?.trim().replace(/^["']|["']$/g, "") || "";
    if (!isPlaceholderSecret(key)) {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = key;
      return key;
    }
  }

  return "";
}

export function isGeminiConfigured() {
  return Boolean(getGeminiApiKey());
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
