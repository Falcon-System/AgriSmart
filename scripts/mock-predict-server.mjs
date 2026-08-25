/**
 * Local stand-in for the Python prediction server.
 * Use when the real ML service is not running:
 *   node scripts/mock-predict-server.mjs
 */
import http from "node:http";

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method !== "POST" || req.url !== "/predict") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ detail: "Not found" }));
    return;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const predicted_class = "cassava_mosaic_disease";
  const confidence = 0.91;

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ predicted_class, confidence, disease: predicted_class }));
});

server.listen(8000, "127.0.0.1", () => {
  console.log("Mock cassava prediction server listening on http://127.0.0.1:8000/predict");
});
