import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import cassavaDiseases from "../../../../cassava_diseases.json";
import { enrichPrediction } from "@/lib/diseases";

const DISEASE_KEYS = Object.keys(cassavaDiseases) as [string, ...string[]];

function predictionEndpoint() {
  const configured = process.env.PREDICTION_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  const base = configured.replace(/\/$/, "");
  return base.endsWith("/predict") ? base : `${base}/predict`;
}

function hasGeminiKey() {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
  return key.length > 20 && !key.includes("your-google-api-key");
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

async function predictWithGemini(imageBuffer: Buffer) {
  const result = await generateObject({
    model: google("gemini-flash-latest"),
    schema: z.object({
      diseaseKey: z.enum(DISEASE_KEYS),
      confidence: z.number().min(0).max(1),
    }),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Classify this cassava leaf image into exactly one of the provided disease keys. Use cassava_healthy only if the leaf looks healthy.",
          },
          { type: "image", image: imageBuffer },
        ],
      },
    ],
  });

  return {
    label: result.object.diseaseKey,
    confidence: result.object.confidence,
    metadata: result.object,
    source: "gemini" as const,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 });
    }

    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    const buffer = Buffer.from(base64Data, "base64");
    const file = new File([buffer], "leaf.jpg", { type: "image/jpeg" });

    let prediction: {
      label: string;
      confidence: number;
      metadata: Record<string, any>;
      source: "model" | "gemini";
    } | null = null;
    let lastError: unknown;

    try {
      prediction = await predictWithPython(file);
    } catch (error) {
      lastError = error;
      console.warn("Python prediction unavailable, trying fallback:", error);
    }

    if (!prediction && hasGeminiKey()) {
      try {
        prediction = await predictWithGemini(buffer);
      } catch (error) {
        lastError = error;
        console.warn("Gemini prediction unavailable:", error);
      }
    }

    if (!prediction) {
      const message =
        lastError instanceof Error && lastError.message.includes("Invalid image")
          ? lastError.message
          : "Prediction service is currently unavailable. Start the Python backend on port 8000 or configure GOOGLE_GENERATIVE_AI_API_KEY.";
      const statusCode = message.includes("Invalid image") ? 400 : 503;
      return NextResponse.json({ error: message }, { status: statusCode });
    }

    const enriched = enrichPrediction({
      label: prediction.label,
      confidence: prediction.confidence * 100,
      severity: prediction.metadata?.severity,
      treatment: prediction.metadata?.treatment,
      prevention: prediction.metadata?.prevention,
      symptoms: prediction.metadata?.symptoms,
    });

    return NextResponse.json({
      ...prediction.metadata,
      ...enriched,
      source: prediction.source,
    });
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
