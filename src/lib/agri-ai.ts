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

export async function diagnoseCropScan(options: {
  image: string;
  selectedCategory: string;
}): Promise<{ scan: CropScanResult; source: AgriAiSource }> {
  const groqKey = getGroqApiKey();
  if (groqKey) {
    try {
      const scan = await predictCropScanWithGroq({
        apiKey: groqKey,
        image: options.image,
        selectedCategory: options.selectedCategory,
      });
      return { scan, source: "groq" };
    } catch (error) {
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

  throw new Error("AgriSmart AI is not configured for this site yet. Please try again later.");
}

export async function answerAdvisorQuestion(options: {
  system: string;
  messages: Array<{ role: "user" | "model"; text: string }>;
}) {
  const groqKey = getGroqApiKey();
  if (groqKey) {
    try {
      return await generateAdvisorTextWithGroq({
        apiKey: groqKey,
        system: options.system,
        messages: options.messages,
      });
    } catch (error) {
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

  throw new Error("AgriSmart AI is not configured for this site yet. Please try again later.");
}
