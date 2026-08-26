import { looksLikeGeminiApiKey, isPlaceholderSecret } from "@/lib/runtime-config";
import { pythonFallbackUrl } from "@/lib/gemini-native";
import { looksLikeGroqApiKey } from "@/lib/groq";

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
});
