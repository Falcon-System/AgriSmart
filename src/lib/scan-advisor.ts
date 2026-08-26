import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { getMongoDb } from "@/lib/supabase";

export type ScanAdvisorRecord = {
  id?: string;
  cropCategory?: string;
  detectedCrop?: string;
  disease?: string;
  isHealthy?: boolean;
  confidence?: number;
  severity?: number;
  severityGrade?: string;
  symptoms?: string[];
  treatment?: string;
  prevention?: string;
  treatmentPlan?: {
    chemical_control?: string[];
    organic_biological?: string[];
    cultural_practices?: string[];
  };
  source?: string;
};

const baseSystemPrompt = `You are AgriSmart AI, an expert agricultural extensions agent and horticultural advisor for smallholder and commercial growers.

You help with crop health for these groups:
- Root & Tuber (especially cassava, also potato)
- Solanaceous (tomato, potato, bell pepper)
- Tree Fruit (mango, citrus, avocado, apple, peach)

Stay inside crop health, cultivation, pests, and disease management for those groups. If asked about politics, programming, or anything unrelated to farming, say you can only help with crop health.

Be practical, empathetic, and clear. Use short sentences and everyday words a farmer can follow in the field. Focus on the next 1–3 steps. Do not invent pesticide product names or dosages. Remind farmers to follow local regulations and consult a local agronomist before applying chemicals.`;

function asString(value: unknown) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => asString(item)).filter(Boolean);
  }
  const text = asString(value);
  return text ? [text] : [];
}

function joinList(items?: string[] | null) {
  return (items ?? []).map((item) => String(item).trim()).filter(Boolean).join("; ") || "None recorded";
}

function formatTreatments(scan: ScanAdvisorRecord) {
  const plan = scan.treatmentPlan;
  const sections = [
    plan?.chemical_control?.length ? `Chemical control: ${joinList(plan.chemical_control)}` : null,
    plan?.organic_biological?.length ? `Organic / biological: ${joinList(plan.organic_biological)}` : null,
    plan?.cultural_practices?.length ? `Cultural practices: ${joinList(plan.cultural_practices)}` : null,
  ].filter(Boolean);

  if (sections.length > 0) return sections.join(" | ");
  return scan.treatment?.trim() || "None recorded";
}

export function normalizeScan(raw: Record<string, unknown> | null | undefined): ScanAdvisorRecord | null {
  if (!raw || typeof raw !== "object") return null;

  const treatmentValue = raw.treatment ?? raw.treatmentProtocols;
  const treatmentPlan =
    (raw.treatmentPlan as ScanAdvisorRecord["treatmentPlan"] | undefined) ||
    (treatmentValue && typeof treatmentValue === "object" && !Array.isArray(treatmentValue)
      ? (treatmentValue as ScanAdvisorRecord["treatmentPlan"])
      : undefined);

  const disease = asString(raw.disease || raw.diseaseDetected || raw.disease_detected);
  if (!disease) return null;

  return {
    id: asString(raw.id) || undefined,
    cropCategory: asString(raw.cropCategory || raw.crop_category) || undefined,
    detectedCrop: asString(raw.detectedCrop || raw.detected_crop) || undefined,
    disease,
    isHealthy: Boolean(raw.isHealthy),
    confidence: typeof raw.confidence === "number" ? raw.confidence : Number(raw.confidenceScore || raw.confidence_score || 0) || undefined,
    severity: typeof raw.severity === "number" ? raw.severity : undefined,
    severityGrade: asString(raw.severityGrade || raw.severity_grade) || undefined,
    symptoms: asStringList(raw.symptoms || raw.symptomsObserved || raw.symptoms_observed),
    treatment: Array.isArray(treatmentValue) ? treatmentValue.map(asString).filter(Boolean).join("; ") : asString(treatmentValue) || undefined,
    prevention: asString(raw.prevention) || undefined,
    treatmentPlan,
    source: asString(raw.source) || undefined,
  };
}

export function buildAdvisorSystemPrompt(scan?: ScanAdvisorRecord | null) {
  if (!scan?.disease) return baseSystemPrompt;

  return `${baseSystemPrompt}

You are assisting a farmer who previously ran a disease scan on their crop. Use this MongoDB diagnosis as context. If the result looks uncertain, say so.

=== DIAGNOSTIC CONTEXT ===
Crop Category: ${scan.cropCategory || "Unknown"}
Detected Crop: ${scan.detectedCrop || "Unknown"}
Diagnosis: ${scan.disease} (Is Healthy: ${scan.isHealthy ?? "unknown"})
Confidence Score: ${scan.confidence ?? "Unknown"}
Severity Grade: ${scan.severityGrade || scan.severity || "Unknown"}
Observed Symptoms: ${joinList(scan.symptoms)}
Recommended Treatments: ${formatTreatments(scan)}
Prevention: ${scan.prevention?.trim() || "None recorded"}
Scan Source: ${scan.source || "Unknown"}
==========================

Answer follow-up questions using that scan first. If the farmer asks about a different crop, say so and still give safe general advice.`;
}

async function findScanByMongoId(scanId: string) {
  if (!ObjectId.isValid(scanId)) return null;
  const mongo = await getMongoDb();
  if (!mongo) return null;

  for (const name of ["Scan", "scans"]) {
    const doc = await mongo.collection(name).findOne({ _id: new ObjectId(scanId) });
    if (doc) {
      const { _id, ...rest } = doc as Record<string, unknown> & { _id?: unknown };
      return normalizeScan({ ...rest, id: asString(rest.id) || String(_id) });
    }
  }
  return null;
}

export async function loadScanForAdvisor(scanId?: string | null): Promise<ScanAdvisorRecord | null> {
  if (!scanId || typeof scanId !== "string") return null;

  const { data } = await db.from("Scan").select("*").eq("id", scanId).single();
  const normalized = normalizeScan(data as Record<string, unknown> | null);
  if (normalized) return normalized;

  return findScanByMongoId(scanId);
}

export function readScanIdFromBody(body: Record<string, unknown> | null | undefined) {
  const value = body?.scanId ?? body?.scan_id;
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
