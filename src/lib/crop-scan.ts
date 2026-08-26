import { z } from "zod";

export const CROP_CATEGORIES = [
  "Root & Tuber",
  "Solanaceous",
  "Tree Fruit",
  "Unknown",
] as const;

export const SEVERITY_GRADES = [
  "None",
  "Low",
  "Moderate",
  "Severe",
  "Critical",
] as const;

export type CropCategory = (typeof CROP_CATEGORIES)[number];
export type SeverityGrade = (typeof SEVERITY_GRADES)[number];

function coerceCropCategory(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const normalized = value.toLowerCase();
  if (normalized.includes("root") || normalized.includes("tuber") || normalized.includes("cassava")) {
    return "Root & Tuber";
  }
  if (normalized.includes("solan") || normalized.includes("tomato") || normalized.includes("pepper") || normalized.includes("potato")) {
    return "Solanaceous";
  }
  if (normalized.includes("fruit") || normalized.includes("tree") || normalized.includes("mango") || normalized.includes("citrus")) {
    return "Tree Fruit";
  }
  if (normalized.includes("unknown") || normalized.includes("veget")) return "Unknown";
  return value;
}

function coerceSeverityGrade(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const normalized = value.trim().toLowerCase();
  const map: Record<string, SeverityGrade> = {
    none: "None",
    healthy: "None",
    low: "Low",
    mild: "Low",
    medium: "Moderate",
    moderate: "Moderate",
    high: "Severe",
    severe: "Severe",
    "very high": "Critical",
    critical: "Critical",
  };
  return map[normalized] ?? value;
}

export const treatmentPlanSchema = z.object({
  chemical_control: z
    .array(z.string())
    .describe("Fungicides, insecticides, or chemical controls. No invented product names or dosages."),
  organic_biological: z.array(z.string()).describe("Biopesticides or natural remedies."),
  cultural_practices: z
    .array(z.string())
    .describe("Field management actions like pruning, rogueing, or sanitation."),
});

/** Strict schema sent to Gemini structured output. Keep this JSON-schema friendly. */
export const cropScanResultSchema = z.object({
  crop_category: z.enum(CROP_CATEGORIES).describe("Broad crop group. Use Unknown if the image is not a plant."),
  detected_crop: z.string().min(1).describe("The specific crop identified, e.g. Cassava, Tomato, Mango."),
  disease_detected: z.string().min(1).describe("Common name of the disease or Healthy."),
  is_healthy: z.boolean().describe("True only when no disease symptoms are visible."),
  confidence_score: z.number().min(0).max(1).describe("Model confidence from 0.0 to 1.0."),
  severity_grade: z
    .enum(SEVERITY_GRADES)
    .describe("Visual lesion coverage: None, Low, Moderate, Severe, or Critical."),
  symptoms_observed: z.array(z.string()).describe("Visual evidence observed on leaves, fruits, roots, or stems."),
  treatment: treatmentPlanSchema,
});

const cropScanResultInputSchema = cropScanResultSchema.extend({
  crop_category: z.preprocess(coerceCropCategory, z.enum(CROP_CATEGORIES)),
  severity_grade: z.preprocess(coerceSeverityGrade, z.enum(SEVERITY_GRADES)),
  confidence_score: z
    .number()
    .transform((value) => (value > 1 ? value / 100 : value))
    .pipe(z.number().min(0).max(1)),
});

export type CropScanResult = z.infer<typeof cropScanResultSchema>;
export type TreatmentPlan = z.infer<typeof treatmentPlanSchema>;

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item ?? "").trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function asBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const text = String(value ?? "").trim().toLowerCase();
  return ["true", "yes", "healthy", "1"].includes(text);
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value ?? "").replace("%", "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function asTreatment(value: unknown) {
  const plan = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    chemical_control: asStringArray(plan.chemical_control),
    organic_biological: asStringArray(plan.organic_biological),
    cultural_practices: asStringArray(plan.cultural_practices),
  };
}

export function parseCropScanResult(value: unknown): CropScanResult {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const disease = String(raw.disease_detected || raw.disease || "Unknown").trim() || "Unknown";
  return cropScanResultInputSchema.parse({
    crop_category: raw.crop_category ?? "Unknown",
    detected_crop: String(raw.detected_crop || raw.crop || "Unknown").trim() || "Unknown",
    disease_detected: disease,
    is_healthy: raw.is_healthy == null ? /healthy/i.test(disease) : asBoolean(raw.is_healthy),
    confidence_score: asNumber(raw.confidence_score ?? raw.confidence),
    severity_grade: raw.severity_grade ?? raw.severity ?? "None",
    symptoms_observed: asStringArray(raw.symptoms_observed ?? raw.symptoms),
    treatment: asTreatment(raw.treatment),
  });
}

export function joinAdvice(items?: string[] | null) {
  return (items ?? []).map((item) => item.trim()).filter(Boolean).join(". ");
}

export function isCassavaCrop(crop?: string | null, category?: string | null) {
  if (crop && /cassava/i.test(crop)) return true;
  if (category === "Root & Tuber" && (!crop || /unknown|cassava/i.test(crop))) return true;
  return false;
}

export function gradeFromSeverity(severity: number, isHealthy = false): SeverityGrade {
  if (isHealthy || severity <= 0) return "None";
  if (severity < 30) return "Low";
  if (severity < 60) return "Moderate";
  if (severity < 85) return "Severe";
  return "Critical";
}
