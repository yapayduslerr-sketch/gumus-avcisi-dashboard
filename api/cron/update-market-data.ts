type Request = { method?: string; headers: Record<string, string | string[] | undefined> };
type Response = { status: (code: number) => { json: (body: unknown) => void } };

const BIST_URL = process.env.BIST_PUBLIC_SOURCE_URL ?? "https://www.borsaistanbul.com/en/market-data";
const KAP_URL = process.env.KAP_PUBLIC_SOURCE_URL ?? "https://kap.org.tr/en/";

export default async function handler(request: Request, response: Response) {
  if (request.method !== "GET") return response.status(405).json({ error: "method not allowed" });
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.authorization !== `Bearer ${cronSecret}`) {
    return response.status(401).json({ error: "unauthorized cron request" });
  }

  const observedAt = new Date().toISOString();
  try {
    const bist = await fetch(BIST_URL, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(12_000), headers: { "user-agent": "Gumus-Avcisi-Source-Health/1.0" } });
    return response.status(200).json({
      ok: true,
      updatedAt: observedAt,
      updateMode: "daily Vercel Hobby cron",
      sources: [
        { sourceKey: "BIST_PUBLIC", status: bist.ok ? "DELAYED" : "ERROR", sourceUrl: BIST_URL, observedAt, errorMessage: bist.ok ? null : `HTTP ${bist.status}` },
        { sourceKey: "KAP_PUBLIC", status: "PENDING_API", sourceUrl: KAP_URL, observedAt, errorMessage: "KAP REST API anahtarı bekleniyor; kamu ekranı ayrıntılı veri adapteri olarak kullanılmıyor." },
      ],
    });
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : String(error), timestamp: observedAt });
  }
}

