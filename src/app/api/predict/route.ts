import { NextResponse } from 'next/server';
import type { PredictionResponse } from '../../../../types';
import cassavaDiseases from '../../../../cassava_diseases.json';

/**
 * Convert string severity to numeric value (0-100)
 */
function convertSeverityToNumber(severity: string): number {
  const severityMap: Record<string, number> = {
    'None': 0,
    'Low': 25,
    'Medium': 50,
    'High': 75,
    'Very High': 90
  };

  // If it's already a number, return it
  if (typeof severity === 'number') {
    return Math.min(100, Math.max(0, severity));
  }

  // If it's a string, try to map it or parse it
  if (typeof severity === 'string') {
    // Check if it's a numeric string
    const numericValue = parseFloat(severity);
    if (!isNaN(numericValue)) {
      return Math.min(100, Math.max(0, numericValue));
    }

    // Try to map from severity string
    const mappedValue = severityMap[severity.trim()];
    if (mappedValue !== undefined) {
      return mappedValue;
    }
  }

  // Default fallback
  return 50;
}

/**
 * Get default severity based on disease name
 */
function getDefaultSeverity(diseaseName: string): number {
  // Look up the disease in cassava_diseases.json
  const diseaseKey = Object.keys(cassavaDiseases).find(key =>
    cassavaDiseases[key as keyof typeof cassavaDiseases].name.toLowerCase() === diseaseName.toLowerCase()
  );

  if (diseaseKey) {
    const diseaseInfo = cassavaDiseases[diseaseKey as keyof typeof cassavaDiseases];
    return convertSeverityToNumber(diseaseInfo.severity);
  }

  // Default severities for common diseases
  const defaultSeverities: Record<string, number> = {
    'healthy': 0,
    'cassava_healthy': 0,
    'bacterial': 75,
    'mosaic': 90,
    'brown streak': 90,
    'green mottle': 50,
    'unknown': 50
  };

  const lowerDiseaseName = diseaseName.toLowerCase();
  for (const [key, severity] of Object.entries(defaultSeverities)) {
    if (lowerDiseaseName.includes(key)) {
      return severity;
    }
  }

  return 50; // Default medium severity
}

/**
 * Executes the core prediction request using the user-provided code logic.
 */
export const predictImage = async (imageFile: File, endpoint: string): Promise<PredictionResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', imageFile);

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      let errorMessage = `Backend Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        const rawError = errorData.detail || errorData.error || errorData.message;
        if (rawError) {
          errorMessage = typeof rawError === 'object' ? JSON.stringify(rawError) : String(rawError);
        }
      } catch (e) {
        // Response might not be JSON
      }

      // Ensure errorMessage is a string for comparisons
      const errorStr = String(errorMessage);

      // Provide human-friendly message for common status codes
      if (response.status === 400 && errorStr.includes('Bad Request')) {
        errorMessage = "Invalid image. Please ensure you've captured a clear photo of a cassava leaf.";
      } else if (response.status === 404) {
        errorMessage = "Prediction service is currently unavailable. Please try again later.";
      }

      throw new Error(String(errorMessage));
    }

    const data = await response.json();

    // Extract confidence - handle both 0-1 and 0-100 formats
    let confidence = data.confidence !== undefined ? data.confidence : (data.score || 1.0);
    if (confidence > 1 && confidence <= 100) {
      confidence = confidence / 100;
    }

    // Return the data in the PredictionResponse format, including all original fields in metadata
    return {
      label: data.disease || data.predicted_class || data.label || data.prediction || 'Unknown',
      confidence: confidence,
      allPredictions: data.probabilities || data.all_predictions || null,
      metadata: { ...data }
    };
  } catch (error) {
    console.error("Prediction Service Error:", error);
    throw error;
  }
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 });
    }

    // Handle base64 image
    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    const file = new File([blob], 'leaf.jpg', { type: 'image/jpeg' });

    // Call the local Python server
    const result = await predictImage(file, 'http://localhost:8000/predict');

    // Bridge the PredictionResponse to the PredictionResult format expected by CameraScanner
    // We only use data directly from the AI model response (result.metadata)
    const mappedResult = {
      ...result.metadata, // Include all original data from the Python server
      disease: result.label,
      diseaseId: result.metadata?.diseaseId || result.label.toLowerCase().replace(/\s+/g, '-'),
      confidence: Math.round(result.confidence * 100),
      // Convert string severity to numeric value (0-100)
      severity: result.metadata?.severity ?
        convertSeverityToNumber(result.metadata.severity) :
        getDefaultSeverity(result.label),
      // Only include these if they actually exist in the response
      // Convert arrays to strings if needed
      treatment: result.metadata?.treatment ?
        Array.isArray(result.metadata.treatment) ?
          result.metadata.treatment.join('. ') :
          result.metadata.treatment :
        undefined,
      prevention: result.metadata?.prevention ?
        Array.isArray(result.metadata.prevention) ?
          result.metadata.prevention.join('. ') :
          result.metadata.prevention :
        undefined,
      symptoms: result.metadata?.symptoms,
    };

    // Ensure all required fields are present and valid
    const validatedResult = {
      ...mappedResult,
      // Ensure severity is always a number
      severity: typeof mappedResult.severity === 'number' ?
        mappedResult.severity :
        getDefaultSeverity(mappedResult.disease),
      // Ensure treatment and prevention are strings or undefined
      treatment: mappedResult.treatment || undefined,
      prevention: mappedResult.prevention || undefined,
      // Ensure symptoms is an array or undefined
      symptoms: Array.isArray(mappedResult.symptoms) ? mappedResult.symptoms : undefined,
    };

    return NextResponse.json(validatedResult);
  } catch (error: any) {
    console.error('API Route Error:', error);

    // Determine status code - if it's a "known" error message we set earlier, it's likely a 400
    const statusCode = error.message.includes('Invalid image') || error.message.includes('No image') ? 400 : 500;

    return NextResponse.json(
      { error: error.message || 'Internal server error during prediction' },
      { status: statusCode }
    );
  }
}
