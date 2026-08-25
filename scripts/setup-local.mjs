import { spawnSync } from "child_process";
import { copyFileSync, existsSync } from "fs";
import { config } from "dotenv";
import { MongoClient } from "mongodb";

const checkOnly = process.argv.includes("--check");

function isPlaceholderSecret(value) {
  const compact = String(value || "")
    .replace(/^\uFEFF/, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\s+/g, "");
  const key = compact.match(/AIza[0-9A-Za-z_\-]{20,}/)?.[0] || compact;
  if (!key) return true;
  if (/^AIza[0-9A-Za-z_\-]{20,}$/.test(key)) return false;
  return key.length < 20 || /your-google-api-key|api-key-here|changeme|placeholder/i.test(key);
}

async function pingMongo(uri, dbName) {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 4000 });
  try {
    await client.connect();
    await client.db(dbName).command({ ping: 1 });
    return true;
  } finally {
    await client.close().catch(() => {});
  }
}

function startDockerMongo() {
  const result = spawnSync("docker", ["compose", "up", "-d"], {
    stdio: "inherit",
  });
  return result.status === 0;
}

async function waitForMongo(uri, dbName) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      if (await pingMongo(uri, dbName)) return true;
    } catch {
      // Keep waiting while Mongo starts.
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

async function main() {
  if (!existsSync(".env.local") && existsSync(".env.example")) {
    copyFileSync(".env.example", ".env.local");
    console.log("Created .env.local from .env.example");
  }

  config({ path: ".env.local" });

  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
  const dbName = process.env.MONGODB_DB || "agrismart_local";
  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  const geminiReady = !isPlaceholderSecret(geminiKey);

  let mongoOk = false;
  try {
    mongoOk = await pingMongo(uri, dbName);
  } catch {
    mongoOk = false;
  }

  if (!mongoOk && !checkOnly) {
    console.log("Starting MongoDB with Docker Compose...");
    if (startDockerMongo()) {
      mongoOk = await waitForMongo(uri, dbName);
    }
  }

  if (!mongoOk) {
    console.error("MongoDB is not running.");
    console.error("Start it with: docker compose up -d");
    console.error("Then run: pnpm setup:local");
    process.exit(1);
  }

  console.log(`MongoDB is connected (${dbName}).`);

  if (!checkOnly) {
    const seed = spawnSync(process.execPath, ["scripts/seed-local.mjs"], {
      stdio: "inherit",
    });
    if (seed.status !== 0) {
      process.exit(seed.status || 1);
    }
  }

  if (geminiReady) {
    console.log("Gemini key is set in .env.local.");
  } else {
    console.log(`
Gemini key is not set yet.
1. Open https://aistudio.google.com/apikey
2. Create an API key
3. Put it in .env.local as:
   GOOGLE_GENERATIVE_AI_API_KEY="AIza..."
4. Stop pnpm dev if it is running (Ctrl+C), then start it with pnpm dev
   If the browser shows "module factory is not available", run: pnpm dev:clean
`);
  }

  console.log(`
Local checklist
- MongoDB: ready
- Gemini: ${geminiReady ? "ready" : "add your key, stop pnpm dev, then start it again"}
- App: pnpm dev → http://localhost:3001
- Login: farmer / FarmDemo123
- Status: http://localhost:3001/api/health
`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
