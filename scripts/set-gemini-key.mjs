import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const key = String(process.argv[2] || "")
  .replace(/^\uFEFF/, "")
  .replace(/[\u200B-\u200D\uFEFF]/g, "")
  .trim()
  .replace(/^["']|["']$/g, "")
  .replace(/\s+/g, "");

const extracted = key.match(/AIza[0-9A-Za-z_\-]{20,}/)?.[0] || key;

if (!extracted || extracted.length < 20 || /your-google-api-key|placeholder|changeme/i.test(extracted)) {
  console.error(`Usage: pnpm set:gemini-key AIzaYourKeyFromGoogleAIStudio

Create a key at https://aistudio.google.com/apikey
Do not put the key on a second line. Pass it as one argument.`);
  process.exit(1);
}

const filePath = join(process.cwd(), ".env.local");
let text = existsSync(filePath) ? readFileSync(filePath, "utf8").replace(/^\uFEFF/, "") : "";
const updates = {
  GOOGLE_GENERATIVE_AI_API_KEY: extracted,
  GEMINI_API_KEY: extracted,
};

for (const [name, value] of Object.entries(updates)) {
  const line = `${name}="${value}"`;
  const pattern = new RegExp(`^\\s*(?:export\\s+|set\\s+)?${name}\\s*=.*$`, "im");
  if (pattern.test(text)) text = text.replace(pattern, line);
  else text = `${text.replace(/\s*$/, "")}\n${line}\n`;
}

writeFileSync(filePath, text.endsWith("\n") ? text : `${text}\n`, { encoding: "utf8" });
console.log(`Wrote UTF-8 Gemini key to ${filePath}`);
console.log("Restart the app with: pnpm dev:clean");
