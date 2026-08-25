
export interface PredictionResponse {
  label: string;
  confidence: number;
  allPredictions?: Record<string, number>;
  metadata?: Record<string, any>;
  error?: string;
}

export interface GeminiInsight {
  summary: string;
  context: string;
  recommendations: string[];
}

export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PREDICTING = 'PREDICTING',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface AppState {
  imageFile: File | null;
  imagePreview: string | null;
  prediction: PredictionResponse | null;
  insight: GeminiInsight | null;
  status: AppStatus;
  errorMsg: string | null;
  backendUrl: string;
}
