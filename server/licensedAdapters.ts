export type AdapterSourceKey = "KAP_REST" | "BIST_MARKET";
export type AdapterState = "READY" | "LICENSE_REQUIRED" | "CONFIG_REQUIRED" | "ERROR";

export type AdapterReadiness = {
  sourceKey: AdapterSourceKey;
  ready: boolean;
  requiredEnv: string[];
  missingEnv: string[];
};

export type AdapterProbe = {
  sourceKey: AdapterSourceKey;
  state: AdapterState;
  detail: string;
  checkedAt: string;
};

type Env = Record<string, string | undefined>;
type FetchLike = (input: string, init?: RequestInit) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

const settings: Record<AdapterSourceKey, { prefix: string; requiredEnv: string[] }> = {
  KAP_REST: { prefix: "KAP_API", requiredEnv: ["KAP_API_BASE_URL", "KAP_API_KEY"] },
  BIST_MARKET: { prefix: "BIST_MARKET_API", requiredEnv: ["BIST_MARKET_API_BASE_URL", "BIST_MARKET_API_KEY"] },
};

function readiness(sourceKey: AdapterSourceKey, env: Env): AdapterReadiness {
  const requiredEnv = settings[sourceKey].requiredEnv;
  const missingEnv = requiredEnv.filter((key) => !env[key]?.trim());
  return { sourceKey, ready: missingEnv.length === 0, requiredEnv, missingEnv };
}

export function getLicensedAdapterReadiness(env: Env = process.env): AdapterReadiness[] {
  return (Object.keys(settings) as AdapterSourceKey[]).map((sourceKey) => readiness(sourceKey, env));
}

export function canIngestLicensedData(env: Env = process.env) {
  return getLicensedAdapterReadiness(env).every((adapter) => adapter.ready);
}

function configuredHealthRequest(sourceKey: AdapterSourceKey, env: Env) {
  const prefix = settings[sourceKey].prefix;
  const healthUrl = env[`${prefix}_HEALTH_URL`]?.trim();
  const headerName = env[`${prefix}_AUTH_HEADER_NAME`]?.trim();
  const apiKey = env[`${prefix}_KEY`]?.trim();
  if (!healthUrl || !headerName || !apiKey) return null;
  return { healthUrl, headers: { [headerName]: apiKey } };
}

/**
 * Sağlayıcıya özel URL ve auth header açıkça yapılandırılmadan ağ isteği yapmaz.
 * Böylece farklı KAP/piyasa sağlayıcılarının belgesiz endpoint veya auth şeması tahmin edilmez.
 */
export async function probeLicensedAdapter(sourceKey: AdapterSourceKey, env: Env = process.env, fetcher: FetchLike = fetch): Promise<AdapterProbe> {
  const checkedAt = new Date().toISOString();
  const state = readiness(sourceKey, env);
  if (!state.ready) return { sourceKey, state: "LICENSE_REQUIRED", detail: `Eksik: ${state.missingEnv.join(", ")}`, checkedAt };
  const request = configuredHealthRequest(sourceKey, env);
  if (!request) return { sourceKey, state: "CONFIG_REQUIRED", detail: "Sağlayıcının belgelenmiş sağlık URL’si ve auth header adı bekleniyor.", checkedAt };
  try {
    const response = await fetcher(request.healthUrl, { headers: request.headers });
    if (!response.ok) return { sourceKey, state: "ERROR", detail: `Sağlayıcı sağlık çağrısı HTTP ${response.status} döndü.`, checkedAt };
    return { sourceKey, state: "READY", detail: "Sağlayıcı sağlık çağrısı başarılı.", checkedAt };
  } catch (error) {
    return { sourceKey, state: "ERROR", detail: error instanceof Error ? error.message : "Sağlayıcı erişim hatası.", checkedAt };
  }
}

/** Sağlayıcı sözleşmesi belirlendiğinde tarihli belge veya snapshot çekmek için ortak, şeffaf HTTP katmanı. */
export async function fetchLicensedJson<T>(sourceKey: AdapterSourceKey, endpointUrl: string, env: Env = process.env, fetcher: FetchLike = fetch): Promise<T> {
  const state = readiness(sourceKey, env);
  if (!state.ready) throw new Error(`${sourceKey} adapteri lisanslı erişim yapılandırması bekliyor: ${state.missingEnv.join(", ")}`);
  const prefix = settings[sourceKey].prefix;
  const headerName = env[`${prefix}_AUTH_HEADER_NAME`]?.trim();
  const apiKey = env[`${prefix}_KEY`]?.trim();
  if (!headerName || !apiKey) throw new Error(`${sourceKey} adapteri sağlayıcıya özgü auth header yapılandırması bekliyor.`);
  const response = await fetcher(endpointUrl, { headers: { [headerName]: apiKey } });
  if (!response.ok) throw new Error(`${sourceKey} veri çağrısı HTTP ${response.status} döndü.`);
  return response.json() as Promise<T>;
}

export type LicensedKapDisclosure = { disclosureId: string; symbol: string; publishedAt: string; periodEnd: string | null; subject: string; sourceUrl: string };
export type LicensedMarketSnapshot = { symbol: string; price: number; changePercent: number | null; volumeTry: number | null; observedAt: string; sourceUrl: string };
