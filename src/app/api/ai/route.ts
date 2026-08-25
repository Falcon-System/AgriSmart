import { google } from "@ai-sdk/google";
import { streamText, type UIMessage, convertToModelMessages } from "ai";

export const maxDuration = 60;

type ScanContext = {
  crop?: string;
  category?: string;
  disease?: string;
  severity?: string;
  isHealthy?: string;
  symptoms?: string;
};

const systemPrompt = `You are AgriSmart AI, an expert plant pathologist and horticultural advisor for smallholder farmers.

You help with crop health for these groups:
- Root & Tuber (especially cassava, also potato)
- Solanaceous (tomato, potato, bell pepper)
- Tree Fruit (mango, citrus, avocado, apple, peach)

Stay inside crop health, cultivation, pests, and disease management for those groups. If asked about politics, programming, or anything unrelated to farming, say you can only help with crop health.

Be practical, supportive, and use simple language. Do not invent pesticide product names or dosages. Remind farmers to follow local regulations and consult a local agronomist before applying chemicals.`;

function withScanContext(context?: ScanContext) {
  if (!context?.disease) return systemPrompt;

  const lines = [
    systemPrompt,
    "",
    "The farmer just completed a leaf/plant scan. Use this diagnosis as context, but say if the photo-based result looks uncertain:",
    `- Crop: ${context.crop || "Unknown"}`,
    `- Category: ${context.category || "Unknown"}`,
    `- Diagnosis: ${context.disease}`,
    `- Severity: ${context.severity || "Unknown"}`,
    `- Healthy: ${context.isHealthy || "unknown"}`,
  ];
  if (context.symptoms) {
    lines.push(`- Symptoms: ${context.symptoms}`);
  }
  return lines.join("\n");
}

export async function POST(req: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GEMINI_API_KEY) {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
  }

  const { messages, scanContext }: { messages: UIMessage[]; scanContext?: ScanContext } = await req.json();

  const result = streamText({
    model: google("gemini-flash-latest"),
    system: withScanContext(scanContext),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
