import catalog from "../../cassava_diseases.json";

export type DiseaseCatalogEntry = (typeof catalog)[keyof typeof catalog] & {
  key: string;
};

const DISEASES: DiseaseCatalogEntry[] = Object.entries(catalog).map(([key, info]) => ({
  key,
  ...info,
}));

function normalizeLabel(value: string) {
  return value
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/cassava/g, " ")
    .replace(/disease/g, " ")
    .replace(/leaf/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value: string) {
  return normalizeLabel(value).replace(/\s+/g, "");
}

export function findDisease(label?: string | null): DiseaseCatalogEntry | null {
  if (!label) return null;

  const compactLabel = compact(label);
  if (!compactLabel) return null;

  for (const disease of DISEASES) {
    const candidates = [disease.key, disease.name, disease.short_name];
    if (candidates.some((candidate) => compact(candidate) === compactLabel)) {
      return disease;
    }
  }

  for (const disease of DISEASES) {
    const tokens = [compact(disease.key), compact(disease.short_name)].filter((token) => token.length >= 3);
    if (tokens.some((token) => compactLabel.includes(token) || token.includes(compactLabel))) {
      return disease;
    }
  }

  return null;
}

export function isPlaceholderAdvice(value?: string | null) {
  if (!value) return true;
  return /^no (treatment|prevention) suggestions provided by ai\.?$/i.test(value.trim());
}

function asText(value: unknown): string | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    const parts = value.map((item) => String(item).trim()).filter(Boolean);
    return parts.length > 0 ? parts.join(". ") : undefined;
  }
  const text = String(value).trim();
  if (!text || isPlaceholderAdvice(text)) {
    return undefined;
  }
  return text;
}

export function severityToNumber(severity: unknown, fallback = 50): number {
  if (typeof severity === "number" && Number.isFinite(severity)) {
    return Math.min(100, Math.max(0, Math.round(severity)));
  }

  if (typeof severity === "string") {
    const numericValue = parseFloat(severity);
    if (!Number.isNaN(numericValue)) {
      return Math.min(100, Math.max(0, Math.round(numericValue)));
    }

    const severityMap: Record<string, number> = {
      none: 0,
      low: 25,
      medium: 50,
      moderate: 50,
      high: 75,
      "very high": 90,
    };
    const mapped = severityMap[severity.trim().toLowerCase()];
    if (mapped !== undefined) return mapped;
  }

  return fallback;
}

export function reliabilityFromConfidence(confidence: number) {
  if (confidence >= 80) return { label: "Excellent", bars: 5 };
  if (confidence >= 65) return { label: "Good", bars: 4 };
  if (confidence >= 45) return { label: "Fair", bars: 3 };
  return { label: "Low", bars: 2 };
}

export function enrichPrediction(input: {
  label?: string;
  confidence?: number;
  severity?: unknown;
  treatment?: unknown;
  prevention?: unknown;
  symptoms?: unknown;
}) {
  const disease = findDisease(input.label);
  const confidence = Math.round(Math.min(100, Math.max(0, input.confidence ?? 0)));
  const severity = input.severity != null
    ? severityToNumber(input.severity)
    : severityToNumber(disease?.severity, 50);

  const catalogSymptoms = disease?.symptoms ?? [];
  const incomingSymptoms = Array.isArray(input.symptoms)
    ? input.symptoms.map((item) => String(item)).filter(Boolean)
    : [];

  return {
    disease: disease?.name ?? (input.label ? input.label.replace(/_/g, " ") : "Unknown"),
    diseaseId: disease?.key ?? (input.label || "unknown").toLowerCase().replace(/\s+/g, "-"),
    shortName: disease?.short_name,
    confidence,
    severity,
    treatment: asText(input.treatment) || asText(disease?.treatment) || "No treatment suggestions provided by AI.",
    prevention: asText(input.prevention) || asText(disease?.prevention) || "No prevention suggestions provided by AI.",
    symptoms: incomingSymptoms.length > 0 ? incomingSymptoms : catalogSymptoms,
    recommendation: disease?.recommendation,
    catalogMatched: Boolean(disease),
  };
}
