import { db } from "@/lib/db";

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
===========================`;
}

export async function loadScanForAdvisor(scanId?: string | null): Promise<ScanAdvisorRecord | null> {
  if (!scanId || typeof scanId !== "string") return null;

  const { data, error } = await db.from("Scan").select("*").eq("id", scanId).single();
  if (error || !data) return null;
  return data as ScanAdvisorRecord;
}
