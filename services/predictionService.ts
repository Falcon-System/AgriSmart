
import { PredictionResponse } from '../types';

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
      throw new Error(`Backend Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Extract confidence - handle both 0-1 and 0-100 formats
    let confidence = data.confidence !== undefined ? data.confidence : 1.0;
    if (confidence > 1 && confidence <= 100) {
      confidence = confidence / 100;
    }

    return {
      label: data.predicted_class || data.label || data.prediction || 'Unknown',
      confidence: confidence,
      allPredictions: data.probabilities || data.all_predictions || null,
      metadata: data.metadata || data
    };
  } catch (error) {
    console.error("Prediction Service Error:", error);
    // For demonstration if the server doesn't exist, we can return a mock or throw
    // In a real app, we throw to handle it in UI
    throw error;
  }
};
