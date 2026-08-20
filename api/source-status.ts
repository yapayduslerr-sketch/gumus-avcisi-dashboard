type SourceStatus = {
  sourceKey: string;
  label: string;
  status: "DELAYED" | "PENDING_API" | "ERROR";
  sourceUrl: string;
  lastAttemptAt: string;
  lastSuccessAt: string | null;
  observedAt: string;
  errorMessage: string | null;
};

type Request = { method?: string };
type Response = { status: (code: number) => { json: (body: unknown) => void } };

const BIST_URL = process.env.BIST_PUBLIC_SOURCE_URL ?? "https://www.borsaistanbul.com/en/market-data";
const KAP_URL = process.env.KAP_PUBLIC_SOURCE_URL ?? "https://kap.org.tr/en/";
const KAP_MESSAGE = "KAP REST API anahtarı bekleniyor; kamu ekranı ayrıntılı veri adapteri olarak kullanılmıyor.";

async function collectStatuses(): Promise<SourceStatus[]> {
  const now = new Date().toISOString();
  let bistStatus: SourceStatus["status"] = "ERROR";
  let bistError: string | null = null;
  try {
    const result = await fetch(BIST_URL, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
      headers: { "user-agent": "Gumus-Avcisi-Source-Health/1.0" },
    });
    if (result.ok) bistStatus = "DELAYED";
    else bistError = `HTTP ${result.status}`;
  } catch (error) {
    bistError = error instanceof Error ? error.message : String(error);
  }
  return [
    { sourceKey: "BIST_PUBLIC", label: "BIST herkese açık veri ekranı", status: bistStatus, sourceUrl: BIST_URL, lastAttemptAt: now, lastSuccessAt: bistStatus === "DELAYED" ? now : null, observedAt: now, errorMessage: bistError },
    { sourceKey: "KAP_PUBLIC", label: "KAP kamuya açık bildirim ekranı", status: "PENDING_API", sourceUrl: KAP_URL, lastAttemptAt: now, lastSuccessAt: null, observedAt: now, errorMessage: KAP_MESSAGE },
  ];
}

export default async function handler(request: Request, response: Response) {
  if (request.method !== "GET") return response.status(405).json({ error: "method not allowed" });
  try {
    const sources = await collectStatuses();
    return response.status(200).json({ updatedAt: new Date().toISOString(), sources, updateMode: "on-demand public source health check" });
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}
