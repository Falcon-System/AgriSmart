import { NextResponse } from "next/server";
import { enrichPrediction, severityToNumber } from "@/lib/diseases";
import { friendlyGeminiError, getGeminiApiKey } from "@/lib/runtime-config";
import {
  gradeFromSeverity,
  isCassavaCrop,
  joinAdvice,
  type CropScanResult,
} from "@/lib/crop-scan";
import { pythonFallbackUrl, vercelGeminiSetupMessage } from "@/lib/gemini-native";
import { diagnoseCropScan, isAgriAiConfigured } from "@/lib/agri-ai";

export const maxDuration = 60;

async function predictWithPython(imageFile: File) {
  const endpoint = pythonFallbackUrl();
  if (!endpoint) {
    throw new Error("Python prediction is not configured.");
  }

  const formData = new FormData();
  formData.append("file", imageFile);

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) {
    let errorMessage = `Backend Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      const rawError = errorData.detail || errorData.error || errorData.message;
      if (rawError) {
        errorMessage = typeof rawError === "object" ? JSON.stringify(rawError) : String(rawError);
      }
    } catch {
      // Response might not be JSON
    }

    const errorStr = String(errorMessage);
    if (response.status === 400 && errorStr.includes("Bad Request")) {
      throw new Error("Invalid image. Please ensure you've captured a clear photo of a cassava leaf.");
    }
    throw new Error(errorStr);
  }

  const data = await response.json();
  let confidence = data.confidence !== undefined ? data.confidence : data.score || 1.0;
  if (confidence > 1 && confidence <= 100) {
    confidence = confidence / 100;
  }

  return {
    label: data.disease || data.predicted_class || data.label || data.prediction || "Unknown",
    confidence,
    metadata: data as Record<string, any>,
    source: "model" as const,
  };
}

function fromGeminiScan(scan: CropScanResult, selectedCategory: string, source: "groq" | "gemini" = "gemini") {
  const treatmentPlan = {
    chemical_control: scan.treatment?.chemical_control ?? [],
    organic_biological: scan.treatment?.organic_biological ?? [],
    cultural_practices: scan.treatment?.cultural_practices ?? [],
  };
  const treatmentText = joinAdvice([
    ...treatmentPlan.chemical_control,
    ...treatmentPlan.organic_biological,
  ]);
  const preventionText = joinAdvice(treatmentPlan.cultural_practices);
  const cassava = isCassavaCrop(scan.detected_crop, selectedCategory);
  const base = cassava
    ? enrichPrediction({
        label: scan.disease_detected,
        confidence: scan.confidence_score * 100,
        severity: scan.severity_grade,
        treatment: treatmentText || undefined,
        prevention: preventionText || undefined,
        symptoms: scan.symptoms_observed,
      })
    : {
        disease: scan.disease_detected,
        diseaseId: scan.disease_detected.toLowerCase().replace(/\s+/g, "-"),
        shortName: undefined,
        confidence: Math.round(scan.confidence_score * 100),
        severity: severityToNumber(scan.severity_grade, scan.is_healthy ? 0 : 50),
        treatment: treatmentText || "No treatment suggestions provided by AI.",
        prevention: preventionText || "No prevention suggestions provided by AI.",
        symptoms: scan.symptoms_observed ?? [],
        recommendation: undefined,
        catalogMatched: false,
      };

  return {
    ...base,
    cropCategory: scan.crop_category,
    detectedCrop: scan.detected_crop,
    isHealthy: scan.is_healthy,
    severityGrade: scan.severity_grade,
    treatmentPlan,
    source,
  };
}

function publicPredictError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error || "");
  if (/Invalid image|could not be read/i.test(raw)) {
    return raw;
  }
  if (isAgriAiConfigured()) {
    return friendlyGeminiError(error);
  }
  return process.env.VERCEL ? vercelGeminiSetupMessage() : friendlyGeminiError(error);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, cropCategory } = body;
    const selectedCategory = typeof cropCategory === "string" && cropCategory ? cropCategory : "Root & Tuber";

    if (!image) {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 });
    }

    const geminiKey = getGeminiApiKey();
    if (geminiKey) {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = geminiKey;
    }

    if (isAgriAiConfigured()) {
      try {
        const { scan, source } = await diagnoseCropScan({
          image,
          selectedCategory,
        });
        return NextResponse.json(fromGeminiScan(scan, selectedCategory, source));
      } catch (error) {
        console.warn("AgriSmart AI scan failed:", error);
        if (!pythonFallbackUrl()) {
          const message = publicPredictError(error);
          const statusCode = /Invalid image|could not be read/i.test(message) ? 400 : 503;
          return NextResponse.json({ error: message }, { status: statusCode });
        }
      }
    }

    const fallbackUrl = pythonFallbackUrl();
    if (fallbackUrl) {
      try {
        const base64Data = image.includes(",") ? image.split(",")[1] : image;
        const buffer = Buffer.from(base64Data, "base64");
        const file = new File([buffer], "leaf.jpg", { type: "image/jpeg" });
        const prediction = await predictWithPython(file);
        const enriched = enrichPrediction({
          label: prediction.label,
          confidence: prediction.confidence * 100,
          severity: prediction.metadata?.severity,
          treatment: prediction.metadata?.treatment,
          prevention: prediction.metadata?.prevention,
          symptoms: prediction.metadata?.symptoms,
        });
        const isHealthy = /healthy/i.test(enriched.disease);
        return NextResponse.json({
          ...prediction.metadata,
          ...enriched,
          cropCategory: selectedCategory,
          detectedCrop: "Cassava",
          isHealthy,
          severityGrade: gradeFromSeverity(enriched.severity, isHealthy),
          source: "model",
        });
      } catch (error) {
        console.warn("Python prediction unavailable:", error);
        const message = publicPredictError(error);
        const statusCode = message.includes("Invalid image") ? 400 : 503;
        return NextResponse.json({ error: message }, { status: statusCode });
      }
    }

    const message = isAgriAiConfigured()
      ? publicPredictError(new Error("AgriSmart AI scan failed"))
      : process.env.VERCEL
        ? vercelGeminiSetupMessage()
        : "AgriSmart AI is not ready yet. Please try again in a moment.";
    return NextResponse.json({ error: message }, { status: 503 });
  } catch (error: any) {
    console.error("API Route Error:", error);
    const statusCode =
      error.message?.includes("Invalid image") || error.message?.includes("No image") ? 400 : 500;
    return NextResponse.json(
      { error: error.message || "Internal server error during prediction" },
      { status: statusCode }
    );
  }
}
