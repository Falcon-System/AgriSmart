import { NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { enrichPrediction, severityToNumber } from "@/lib/diseases";
import { getGeminiApiKey, isGeminiConfigured } from "@/lib/runtime-config";
import {
  cropScanResultSchema,
  gradeFromSeverity,
  isCassavaCrop,
  joinAdvice,
  parseCropScanResult,
  type CropScanResult,
} from "@/lib/crop-scan";

export const maxDuration = 60;

function predictionEndpoint() {
  const configured = process.env.PREDICTION_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  const base = configured.replace(/\/$/, "");
  return base.endsWith("/predict") ? base : `${base}/predict`;
}

function hasGeminiKey() {
  const key = getGeminiApiKey();
  if (key) {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = key;
  }
  return isGeminiConfigured();
}

async function predictWithPython(imageFile: File) {
  const endpoint = predictionEndpoint();
  const formData = new FormData();
  formData.append("file", imageFile);

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
    signal: AbortSignal.timeout(30000),
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
    if (response.status === 404) {
      throw new Error("Prediction service is currently unavailable. Please try again later.");
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

async function predictWithGemini(imageBuffer: Buffer, selectedCategory: string): Promise<CropScanResult> {
  const google = createGoogleGenerativeAI({ apiKey: getGeminiApiKey() });
  const run = async (modelId: string) => {
    const result = await generateText({
      model: google(modelId),
      temperature: 0.2,
      abortSignal: AbortSignal.timeout(45000),
      output: Output.object({
        schema: cropScanResultSchema,
        name: "CropScanResult",
        description: "Structured crop health diagnosis from a plant image.",
      }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert plant pathologist and horticultural AI advisor.
The user selected the crop category: '${selectedCategory}'.

Examine the provided image of the plant part (leaf, fruit, root, or stem):
1. Identify the specific crop (e.g., Cassava, Tomato, Potato, Bell Pepper, Mango, Apple, Citrus, Avocado, Peach).
2. Diagnose any disease present, or classify it as Healthy.
3. Determine a confidence score from 0.00 to 1.00 and a severity grade based on visual lesion coverage.
4. Provide actionable treatment protocols tailored to this crop. Prefer field-practical advice. Do not invent pesticide product names or dosages. Farmers must follow local regulations.
5. If the image is not a plant, set crop_category to Unknown, detected_crop to Unknown, and disease_detected to Unknown.`,
            },
            { type: "image", image: imageBuffer },
          ],
        },
      ],
    });

    if (!result.output) {
      throw new Error("Gemini returned no structured crop scan result.");
    }
    return parseCropScanResult(result.output);
  };

  try {
    return await run("gemini-2.5-flash");
  } catch (error) {
    console.warn("gemini-2.5-flash unavailable, trying gemini-flash-latest:", error);
    return await run("gemini-flash-latest");
  }
}

function fromGeminiScan(scan: CropScanResult, selectedCategory: string) {
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
    source: "gemini" as const,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, cropCategory } = body;
    const selectedCategory = typeof cropCategory === "string" && cropCategory ? cropCategory : "Root & Tuber";

    if (!image) {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 });
    }

    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    const buffer = Buffer.from(base64Data, "base64");
    const file = new File([buffer], "leaf.jpg", { type: "image/jpeg" });

    let lastError: unknown;

    if (hasGeminiKey()) {
      try {
        const scan = await predictWithGemini(buffer, selectedCategory);
        return NextResponse.json(fromGeminiScan(scan, selectedCategory));
      } catch (error) {
        lastError = error;
        console.warn("Gemini structured scan failed, trying local model:", error);
      }
    }

    try {
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
      lastError = error;
      console.warn("Python prediction unavailable:", error);
    }

    const message =
      lastError instanceof Error && lastError.message.includes("Invalid image")
        ? lastError.message
        : "Prediction service is currently unavailable. Set GOOGLE_GENERATIVE_AI_API_KEY (or GEMINI_API_KEY) or start pnpm predict:server.";
    const statusCode = message.includes("Invalid image") ? 400 : 503;
    return NextResponse.json({ error: message }, { status: statusCode });
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
