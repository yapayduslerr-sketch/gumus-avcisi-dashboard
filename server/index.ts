import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { getSourceStatuses, runScheduledUpdate } from "./dataPipeline";
import { authenticateScheduledRequest } from "./scheduledAuth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.use(express.json({ limit: "32kb" }));

  app.get("/api/health", (_req, res) => res.json({ ok: true, service: "gumus-avcisi", now: new Date().toISOString() }));

  app.get("/api/source-status", async (_req, res) => {
    try {
      res.json({ updatedAt: new Date().toISOString(), sources: await getSourceStatuses() });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // This endpoint is deliberately idempotent and ignores request-body fields.
  // It only probes public source pages and writes the resulting health state.
  app.post("/api/scheduled/update-market-data", async (req, res) => {
    const auth = authenticateScheduledRequest(req);
    if (!auth.ok) {
      return res.status(403).json({ error: "cron-only endpoint", reason: auth.reason });
    }
    try {
      const sources = await runScheduledUpdate();
      res.json({ ok: true, updatedAt: new Date().toISOString(), sources });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error), timestamp: new Date().toISOString() });
    }
  });

  if (process.env.NODE_ENV === "development") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const staticPath = path.resolve(__dirname, "public");
    app.use(express.static(staticPath));
    app.get("*", (_req, res) => res.sendFile(path.join(staticPath, "index.html")));
  }

  const port = process.env.PORT || 3000;
  server.listen(port, () => console.log(`Server running on http://localhost:${port}/`));
}

startServer().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
