const PLACEHOLDER_SECRET = /your-|changeme|placeholder|example|xxx/i;

export function isPlaceholderSecret(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length < 20 || PLACEHOLDER_SECRET.test(trimmed);
}

export function applyGeminiEnv() {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GEMINI_API_KEY) {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
  }
}

export function getGeminiApiKey() {
  applyGeminiEnv();
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || "";
  return isPlaceholderSecret(key) ? "" : key;
}

export function isGeminiConfigured() {
  return Boolean(getGeminiApiKey());
}
