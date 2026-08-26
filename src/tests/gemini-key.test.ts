import { looksLikeGeminiApiKey, isPlaceholderSecret } from "@/lib/runtime-config";
import { pythonFallbackUrl } from "@/lib/gemini-native";
import { looksLikeGroqApiKey } from "@/lib/groq";
import { parseCropScanResult } from "@/lib/crop-scan";

describe("Gemini Auth keys", () => {
  const authKey = `AQ.${"Ab12".repeat(13)}`;

  it("accepts AQ. Auth keys and AIza Studio keys", () => {
    expect(looksLikeGeminiApiKey(authKey)).toBe(true);
    expect(looksLikeGeminiApiKey("AIzaSyDummyKeyValueForTestsOnly1234567")).toBe(true);
    expect(looksLikeGeminiApiKey("not-a-key")).toBe(false);
  });

  it("does not treat Auth keys as placeholders", () => {
    expect(isPlaceholderSecret(authKey)).toBe(false);
    expect(isPlaceholderSecret("your-google-api-key-here")).toBe(true);
  });
});

describe("Groq keys", () => {
  it("accepts Groq gsk_ keys", () => {
    expect(looksLikeGroqApiKey(`gsk_${"A".repeat(48)}`)).toBe(true);
    expect(looksLikeGroqApiKey("AIzaSyDummyKeyValueForTestsOnly1234567")).toBe(false);
    expect(looksLikeGroqApiKey("not-a-key")).toBe(false);
  });
});

describe("crop scan JSON", () => {
  it("accepts messy Groq scan JSON", () => {
    const scan = parseCropScanResult({
      crop_category: "Vegetable",
      detected_crop: "Cassava",
      disease: "Cassava mosaic",
      is_healthy: "false",
      confidence: "87",
      severity: "moderate",
      symptoms: "Yellow mosaic on leaves",
      treatment: {
        chemical_control: "Remove infected plants",
        organic_biological: [],
      },
    });
    expect(scan.crop_category).toBe("Unknown");
    expect(scan.detected_crop).toBe("Cassava");
    expect(scan.disease_detected).toBe("Cassava mosaic");
    expect(scan.is_healthy).toBe(false);
    expect(scan.confidence_score).toBe(0.87);
    expect(scan.severity_grade).toBe("Moderate");
    expect(scan.symptoms_observed).toEqual(["Yellow mosaic on leaves"]);
    expect(scan.treatment.chemical_control).toEqual(["Remove infected plants"]);
  });
});

describe("Python predict fallback", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it("skips localhost on Vercel", () => {
    process.env.VERCEL = "1";
    process.env.PREDICTION_API_URL = "http://localhost:8000/predict";
    expect(pythonFallbackUrl()).toBe("");
  });

  it("keeps an explicit remote predictor", () => {
    delete process.env.VERCEL;
    process.env.PREDICTION_API_URL = "https://predict.example.com";
    expect(pythonFallbackUrl()).toBe("https://predict.example.com/predict");
  });

  it("skips localhost python unless explicitly enabled", () => {
    delete process.env.VERCEL;
    delete process.env.USE_LOCAL_PYTHON_PREDICT;
    process.env.PREDICTION_API_URL = "http://localhost:8000/predict";
    expect(pythonFallbackUrl()).toBe("");
  });

  it("keeps localhost python when opted in", () => {
    delete process.env.VERCEL;
    process.env.USE_LOCAL_PYTHON_PREDICT = "1";
    process.env.PREDICTION_API_URL = "http://localhost:8000/predict";
    expect(pythonFallbackUrl()).toBe("http://localhost:8000/predict");
  });
});
