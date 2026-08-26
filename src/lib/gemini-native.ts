import { parseCropScanResult, type CropScanResult } from "@/lib/crop-scan";
import { friendlyGeminiError } from "@/lib/runtime-config";

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest",
  "gemini-3.6-flash",
];

const CROP_SCAN_SCHEMA = {
  type: "OBJECT",
  properties: {
    crop_category: {
      type: "STRING",
      enum: ["Root & Tuber", "Solanaceous", "Tree Fruit", "Unknown"],
    },
    detected_crop: { type: "STRING" },
    disease_detected: { type: "STRING" },
    is_healthy: { type: "BOOLEAN" },
    confidence_score: { type: "NUMBER" },
    severity_grade: {
      type: "STRING",
      enum: ["None", "Low", "Moderate", "Severe", "Critical"],
    },
    symptoms_observed: { type: "ARRAY", items: { type: "STRING" } },
    treatment: {
      type: "OBJECT",
      properties: {
        chemical_control: { type: "ARRAY", items: { type: "STRING" } },
        organic_biological: { type: "ARRAY", items: { type: "STRING" } },
        cultural_practices: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: ["chemical_control", "organic_biological", "cultural_practices"],
    },
  },
  required: [
    "crop_category",
    "detected_crop",
    "disease_detected",
    "is_healthy",
    "confidence_score",
    "severity_grade",
    "symptoms_observed",
    "treatment",
  ],
};

export function pythonFallbackUrl() {
  const configured = (process.env.PREDICTION_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "").trim();
  if (!configured) return "";
  const base = configured.replace(/\/$/, "");
  const url = base.endsWith("/predict") ? base : `${base}/predict`;
  const isLocal = /localhost|127\.0\.0\.1|::1/i.test(url);
  if (process.env.VERCEL && isLocal) return "";
  return url;
}

function mimeTypeFromDataUrl(image: string) {
  const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
  return match?.[1] || "image/jpeg";
}

function extractJsonObject(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced?.[1] || text).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("Gemini returned no JSON crop scan result.");
  }
  return JSON.parse(raw.slice(start, end + 1));
}

function googleErrorMessage(payload: unknown, status: number) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: { message?: string; status?: string } }).error;
    const message = [error?.status, error?.message].filter(Boolean).join(": ");
    if (message) return message;
  }
  return `Gemini HTTP ${status}`;
}

export function isInvalidGeminiKeyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  return /API_KEY_INVALID|API key not valid|invalid api key|invalid authentication|UNAUTHENTICATED|401/i.test(
    message
  );
}

let probeCache: { key: string; at: number; result: { accepted: boolean; error: string | null } } | null = null;

export async function probeGeminiKey(apiKey: string) {
  if (probeCache && probeCache.key === apiKey && Date.now() - probeCache.at < 60_000) {
    return probeCache.result;
  }

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1", {
      headers: { "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(8000),
    });
    const body = await response.text();
    const result = response.ok
      ? { accepted: true as const, error: null }
      : /API_KEY_INVALID|API key not valid|invalid authentication|UNAUTHENTICATED/i.test(body)
        ? {
            accepted: false as const,
            error:
              "Google rejected this API key. Create a Gemini Auth key at https://aistudio.google.com/apikey (it starts with AQ.), then set GEMINI_API_KEY in Vercel and Redeploy.",
          }
        : {
            accepted: false as const,
            error: `Google did not accept this key (HTTP ${response.status}).`,
          };
    probeCache = { key: apiKey, at: Date.now(), result };
    return result;
  } catch (error) {
    const result = {
      accepted: false as const,
      error: friendlyGeminiError(error),
    };
    probeCache = { key: apiKey, at: Date.now(), result };
    return result;
  }
}

async function generateContentJson(options: {
  apiKey: string;
  modelId: string;
  prompt: string;
  imageBase64: string;
  mimeType: string;
}) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${options.modelId}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": options.apiKey,
      },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: options.prompt },
              { inlineData: { mimeType: options.mimeType, data: options.imageBase64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: CROP_SCAN_SCHEMA,
        },
      }),
    }
  );

  const payload = (await response.json().catch(() => null)) as
    | {
        error?: { message?: string; status?: string };
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      }
    | null;

  if (!response.ok) {
    throw new Error(googleErrorMessage(payload, response.status));
  }

  const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
  if (!text.trim()) {
    throw new Error("Gemini returned an empty crop scan result.");
  }

  return extractJsonObject(text);
}

export async function predictCropScanWithGemini(options: {
  apiKey: string;
  image: string;
  selectedCategory: string;
}): Promise<CropScanResult> {
  const imageBase64 = options.image.includes(",") ? options.image.split(",")[1] : options.image;
  const mimeType = mimeTypeFromDataUrl(options.image);
  const prompt = `You are an expert plant pathologist and horticultural AI advisor.
The user selected the crop category: '${options.selectedCategory}'.

Examine the provided image of the plant part (leaf, fruit, root, or stem):
1. Identify the specific crop (e.g., Cassava, Tomato, Potato, Bell Pepper, Mango, Apple, Citrus, Avocado, Peach).
2. Diagnose any disease present, or classify it as Healthy.
3. Determine a confidence score from 0.00 to 1.00 and a severity grade based on visual lesion coverage.
4. Provide actionable treatment protocols tailored to this crop. Prefer field-practical advice. Do not invent pesticide product names or dosages. Farmers must follow local regulations.
5. If the image is not a plant, set crop_category to Unknown, detected_crop to Unknown, and disease_detected to Unknown.

Return JSON only.`;

  let lastError: unknown;
  for (const modelId of GEMINI_MODELS) {
    try {
      const raw = await generateContentJson({
        apiKey: options.apiKey,
        modelId,
        prompt,
        imageBase64,
        mimeType,
      });
      return parseCropScanResult(raw);
    } catch (error) {
      lastError = error;
      if (isInvalidGeminiKeyError(error)) {
        throw new Error(friendlyGeminiError(error));
      }
    }
  }

  throw new Error(friendlyGeminiError(lastError));
}

export function vercelGeminiSetupMessage() {
  return "Leaf scan uses Gemini Vision on Vercel. Set GEMINI_API_KEY and GOOGLE_GENERATIVE_AI_API_KEY in Vercel to the same Auth key from https://aistudio.google.com/apikey, then Redeploy. The local Python predictor is not available on Vercel.";
}
