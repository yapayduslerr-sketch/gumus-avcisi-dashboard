type Request = { method?: string };
type Response = { status: (code: number) => { json: (body: unknown) => void } };

type SourceKey = "KAP_REST" | "BIST_MARKET";
type ProbeState = "READY" | "LICENSE_REQUIRED" | "CONFIG_REQUIRED" | "ERROR";

const definitions: Record<SourceKey, { label: string; prefix: string; requiredEnv: string[] }> = {
  KAP_REST: { label: "KAP lisanslı bildirim adapteri", prefix: "KAP_API", requiredEnv: ["KAP_API_BASE_URL", "KAP_API_KEY"] },
  BIST_MARKET: { label: "Tarihli BIST fiyat-hacim adapteri", prefix: "BIST_MARKET_API", requiredEnv: ["BIST_MARKET_API_BASE_URL", "BIST_MARKET_API_KEY"] },
};

async function probe(sourceKey: SourceKey) {
  const definition = definitions[sourceKey];
  const missing = definition.requiredEnv.filter((key) => !process.env[key]?.trim());
  if (missing.length) return { sourceKey, label: definition.label, state: "LICENSE_REQUIRED" as ProbeState, detail: `Eksik: ${missing.join(", ")}`, checkedAt: new Date().toISOString() };
  const healthUrl = process.env[`${definition.prefix}_HEALTH_URL`]?.trim();
  const headerName = process.env[`${definition.prefix}_AUTH_HEADER_NAME`]?.trim();
  const apiKey = process.env[`${definition.prefix}_KEY`]?.trim();
  if (!healthUrl || !headerName || !apiKey) return { sourceKey, label: definition.label, state: "CONFIG_REQUIRED" as ProbeState, detail: "Sağlayıcının belgelenmiş sağlık URL’si ve auth header adı bekleniyor.", checkedAt: new Date().toISOString() };
  try {
    const response = await fetch(healthUrl, { headers: { [headerName]: apiKey } });
    return { sourceKey, label: definition.label, state: response.ok ? "READY" as ProbeState : "ERROR" as ProbeState, detail: response.ok ? "Sağlayıcı sağlık çağrısı başarılı." : `Sağlayıcı sağlık çağrısı HTTP ${response.status} döndü.`, checkedAt: new Date().toISOString() };
  } catch (error) {
    return { sourceKey, label: definition.label, state: "ERROR" as ProbeState, detail: error instanceof Error ? error.message : "Sağlayıcı erişim hatası.", checkedAt: new Date().toISOString() };
  }
}

export default async function handler(request: Request, response: Response) {
  if (request.method !== "GET") return response.status(405).json({ error: "method not allowed" });
  const probes = await Promise.all([probe("KAP_REST"), probe("BIST_MARKET")]);
  return response.status(200).json({
    mode: "phased",
    capabilities: probes,
  });
}
