import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { getSourceStatuses, runScheduledUpdate } from "./dataPipeline";
import { authenticateRequest } from "./_core/sdk";
import { probeLicensedAdapter } from "./licensedAdapters";
import { fetchMultiAssetQuotes, getMultiAssetReadiness } from "./multiAssetAdapter";
import xProOverviewHandler from "../api/xpro-overview";
import xProProviderStatusHandler from "../api/xpro-provider-status";

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

  app.get("/api/research-capabilities", async (_req, res) => {
    const labels = {
      KAP_REST: "KAP lisanslı bildirim adapteri",
      BIST_MARKET: "Tarihli BIST fiyat-hacim adapteri",
    } as const;
    const probes = await Promise.all([probeLicensedAdapter("KAP_REST"), probeLicensedAdapter("BIST_MARKET")]);
    const capabilities: { sourceKey: string; label: string; state: "READY" | "LICENSE_REQUIRED" | "CONFIG_REQUIRED" | "ERROR"; detail: string; checkedAt: string }[] = probes.map((probe) => ({ sourceKey: probe.sourceKey, label: labels[probe.sourceKey], state: probe.state, detail: probe.detail, checkedAt: probe.checkedAt }));
    const multiAsset = getMultiAssetReadiness();
    capabilities.push({ sourceKey: "TWELVE_DATA", label: "Döviz, Brent, ons altın ve kripto adapteri", state: multiAsset.ready ? "CONFIG_REQUIRED" : "LICENSE_REQUIRED", detail: multiAsset.ready ? "Twelve Data anahtarı var; sembol eşlemesi ve canlı çağrı doğrulaması bekleniyor." : `Eksik: ${multiAsset.missingEnv.join(", ")}`, checkedAt: new Date().toISOString() });
    res.json({ mode: "phased", capabilities });
  });

  app.get("/api/market-context", async (_req, res) => {
    res.json(await fetchMultiAssetQuotes());
  });

  app.get("/api/xpro-overview", async (req, res) => {
    await xProOverviewHandler(req, res);
  });

  app.get("/api/xpro-provider-status", async (req, res) => {
    await xProProviderStatusHandler(req, res);
  });

  // This endpoint is deliberately idempotent and ignores request-body fields.
  // It only probes public source pages and writes the resulting health state.
  app.post("/api/scheduled/update-market-data", async (req, res) => {
    let user;
    try {
      user = await authenticateRequest(req);
    } catch (error) {
      return res.status(403).json({ error: "cron-only endpoint", reason: error instanceof Error ? error.message : String(error) });
    }
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only endpoint" });
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
