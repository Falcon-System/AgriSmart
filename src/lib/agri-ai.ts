import { getGeminiApiKey, isGeminiConfigured } from "@/lib/runtime-config";
import {
  generateAdvisorText as generateAdvisorTextWithGemini,
  predictCropScanWithGemini,
} from "@/lib/gemini-native";
import {
  generateAdvisorTextWithGroq,
  getGroqApiKey,
  isGroqConfigured,
  predictCropScanWithGroq,
} from "@/lib/groq";
import type { CropScanResult } from "@/lib/crop-scan";

export type AgriAiSource = "groq" | "gemini";

export function isAgriAiConfigured() {
  return isGroqConfigured() || isGeminiConfigured();
}

function localAiSetupMessage() {
  if (process.env.VERCEL) {
    return "AgriSmart AI is not configured for this site yet. Please try again later.";
  }
  return "AgriSmart AI is not ready. Paste a Groq key (gsk_...) in Settings, or add GROQ_API_KEY to .env.local and restart pnpm dev.";
}

export async function diagnoseCropScan(options: {
  image: string;
  selectedCategory: string;
}): Promise<{ scan: CropScanResult; source: AgriAiSource }> {
  const groqKey = getGroqApiKey();
  let groqError: unknown;
  if (groqKey) {
    try {
      const scan = await predictCropScanWithGroq({
        apiKey: groqKey,
        image: options.image,
        selectedCategory: options.selectedCategory,
      });
      return { scan, source: "groq" };
    } catch (error) {
      groqError = error;
      console.warn("Groq scan failed, trying Gemini:", error);
    }
  }

  const geminiKey = getGeminiApiKey();
  if (geminiKey) {
    const scan = await predictCropScanWithGemini({
      apiKey: geminiKey,
      image: options.image,
      selectedCategory: options.selectedCategory,
    });
    return { scan, source: "gemini" };
  }

  if (groqError) throw groqError;
  throw new Error(localAiSetupMessage());
}

export async function answerAdvisorQuestion(options: {
  system: string;
  messages: Array<{ role: "user" | "model"; text: string }>;
}) {
  const groqKey = getGroqApiKey();
  let groqError: unknown;
  if (groqKey) {
    try {
      return await generateAdvisorTextWithGroq({
        apiKey: groqKey,
        system: options.system,
        messages: options.messages,
      });
    } catch (error) {
      groqError = error;
      console.warn("Groq chat failed, trying Gemini:", error);
    }
  }

  const geminiKey = getGeminiApiKey();
  if (geminiKey) {
    return generateAdvisorTextWithGemini({
      apiKey: geminiKey,
      system: options.system,
      messages: options.messages,
    });
  }

  if (groqError) throw groqError;
  throw new Error(localAiSetupMessage());
}
