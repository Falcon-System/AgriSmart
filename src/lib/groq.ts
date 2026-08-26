import { parseCropScanResult, type CropScanResult } from "@/lib/crop-scan";

const GROQ_CHAT_MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
const GROQ_VISION_MODELS = [
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "meta-llama/llama-4-maverick-17b-128e-instruct",
];

export function looksLikeGroqApiKey(key: string) {
  return /^gsk_[A-Za-z0-9]{20,}$/.test(String(key || "").trim());
}

export function getGroqApiKey() {
  return String(process.env.GROQ_API_KEY || process.env.GROK_API_KEY || "").trim();
}

export function isGroqConfigured() {
  return getGroqApiKey().length >= 20;
}

function extractJsonObject(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced?.[1] || text).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("AgriSmart AI returned no JSON crop scan result.");
  }
  return JSON.parse(raw.slice(start, end + 1));
}

function groqErrorMessage(payload: unknown, status: number) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: { message?: string; type?: string } }).error;
    if (error?.message) return error.message;
  }
  return `Groq HTTP ${status}`;
}

async function groqChatCompletions(options: {
  apiKey: string;
  model: string;
  messages: unknown[];
  json?: boolean;
  maxTokens?: number;
  timeoutMs?: number;
}) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.apiKey}`,
    },
    signal: AbortSignal.timeout(options.timeoutMs ?? 20000),
    body: JSON.stringify({
      model: options.model,
      temperature: 0.2,
      max_tokens: options.maxTokens ?? 640,
      messages: options.messages,
      ...(options.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  const payload = (await response.json().catch(() => null)) as
    | { error?: { message?: string }; choices?: Array<{ message?: { content?: string } }> }
    | null;
  if (!response.ok) {
    throw new Error(groqErrorMessage(payload, response.status));
  }
  const text = payload?.choices?.[0]?.message?.content?.trim() || "";
  if (!text) throw new Error("AgriSmart AI returned an empty answer.");
  return text;
}

export async function predictCropScanWithGroq(options: {
  apiKey: string;
  image: string;
  selectedCategory: string;
}): Promise<CropScanResult> {
  const dataUrl = options.image.startsWith("data:")
    ? options.image
    : `data:image/jpeg;base64,${options.image}`;
  const prompt = `Diagnose this plant photo quickly for AgriSmart.
Crop category: ${options.selectedCategory}.
Return JSON with keys crop_category, detected_crop, disease_detected, is_healthy, confidence_score (0-1), severity_grade (None|Low|Moderate|Severe|Critical), symptoms_observed (array of short strings), and treatment { chemical_control, organic_biological, cultural_practices } each an array of 2 short field actions.
No product names or dosages. If it is not a plant, set crop_category to Unknown.`;

  let lastError: unknown;
  for (const model of GROQ_VISION_MODELS) {
    try {
      const text = await groqChatCompletions({
        apiKey: options.apiKey,
        model,
        json: true,
        timeoutMs: 18000,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      });
      return parseCropScanResult(extractJsonObject(text));
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Groq vision scan failed.");
}

export async function generateAdvisorTextWithGroq(options: {
  apiKey: string;
  system: string;
  messages: Array<{ role: "user" | "model"; text: string }>;
}) {
  const messages = [
    { role: "system", content: options.system },
    ...options.messages.map((message) => ({
      role: message.role === "model" ? "assistant" : "user",
      content: message.text,
    })),
  ];

  let lastError: unknown;
  for (const model of GROQ_CHAT_MODELS) {
    try {
      return await groqChatCompletions({
        apiKey: options.apiKey,
        model,
        timeoutMs: 15000,
        messages,
      });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Groq chat failed.");
}
