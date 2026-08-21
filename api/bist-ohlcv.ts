type Env = Record<string, string | undefined>;
type FetchLike = (input: string, init?: RequestInit) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;
type ApiRequest = { method?: string; query?: Record<string, unknown> };
type ApiResponse = { status: (code: number) => { json: (payload: unknown) => void } };

type TwelveValue = { datetime?: string; open?: string | number; high?: string | number; low?: string | number; close?: string | number; volume?: string | number };
type TwelvePayload = { status?: string; message?: string; meta?: { symbol?: string; interval?: string; exchange?: string; mic_code?: string; exchange_timezone?: string }; values?: TwelveValue[] };

export type BistOhlcvBar = { timestamp: string; open: number; high: number; low: number; close: number; volume: number };
export type BistOhlcvResult = {
  state: "READY" | "LICENSE_REQUIRED" | "CONFIG_REQUIRED" | "ERROR";
  detail: string;
  checkedAt: string;
  data: null | { symbol: string; interval: "15min"; bars: BistOhlcvBar[]; asOf: string; sourceLabel: string; sourceUrl: string; delayMinutes: null };
};

const CACHE_TTL_MS = 120_000;
const responseCache = new Map<string, { expiresAt: number; result: BistOhlcvResult }>();

function numeric(value: unknown) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizedSymbol(value: unknown) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const symbol = typeof candidate === "string" ? candidate.trim().toLocaleUpperCase("tr-TR") : "";
  return /^[A-Z0-9.]{1,12}$/.test(symbol) ? symbol : null;
}

function isoFromIstanbulDatetime(value: string) {
  const candidate = value.includes("T") ? value : value.replace(" ", "T");
  const instant = new Date(`${candidate}+03:00`);
  return Number.isNaN(instant.getTime()) ? null : instant.toISOString();
}

function normalizeBars(values: TwelveValue[]) {
  return values.flatMap((value) => {
    if (!value.datetime) return [];
    const timestamp = isoFromIstanbulDatetime(value.datetime);
    const open = numeric(value.open);
    const high = numeric(value.high);
    const low = numeric(value.low);
    const close = numeric(value.close);
    const volume = numeric(value.volume);
    if (!timestamp || open === null || high === null || low === null || close === null || volume === null || low > Math.min(open, close) || high < Math.max(open, close) || volume < 0) return [];
    return [{ timestamp, open, high, low, close, volume } satisfies BistOhlcvBar];
  }).sort((left, right) => left.timestamp.localeCompare(right.timestamp));
}

export async function fetchBistOhlcv(symbolInput: string, env: Env = process.env, fetcher: FetchLike = fetch): Promise<BistOhlcvResult> {
  const checkedAt = new Date().toISOString();
  const symbol = normalizedSymbol(symbolInput);
  if (!symbol) return { state: "CONFIG_REQUIRED", detail: "Geçerli bir BIST sembolü girin; yalnızca harf, sayı ve nokta kullanılabilir.", checkedAt, data: null };
  const apiKey = env.TWELVE_DATA_API_KEY?.trim();
  if (!apiKey) return { state: "LICENSE_REQUIRED", detail: "Twelve Data API anahtarı sunucuda yapılandırılmadı.", checkedAt, data: null };
  const cached = responseCache.get(symbol);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  const baseUrl = env.TWELVE_DATA_API_BASE_URL?.trim() || "https://api.twelvedata.com";
  const url = new URL("/time_series", baseUrl);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("mic_code", "XIST");
  url.searchParams.set("interval", "15min");
  url.searchParams.set("outputsize", "300");
  url.searchParams.set("order", "asc");
  url.searchParams.set("timezone", "Europe/Istanbul");

  try {
    const response = await fetcher(url.toString(), { headers: { Authorization: `apikey ${apiKey}` } });
    if (!response.ok) return { state: "ERROR", detail: `Twelve Data OHLCV çağrısı HTTP ${response.status} döndü.`, checkedAt, data: null };
    const payload = await response.json() as TwelvePayload;
    if (payload.status === "error") return { state: "CONFIG_REQUIRED", detail: payload.message || "Sağlayıcı bu sembol veya 15 dakikalık seri için veri döndürmedi.", checkedAt, data: null };
    const bars = normalizeBars(Array.isArray(payload.values) ? payload.values : []);
    if (bars.length < 15) return { state: "CONFIG_REQUIRED", detail: "Bu sembol için teknik hesaplamaya yetecek 15 dakikalık OHLCV barı alınamadı.", checkedAt, data: null };
    const result: BistOhlcvResult = {
      state: "READY",
      detail: `${symbol} için ${bars.length} adet 15 dakikalık OHLCV barı kaynaklı biçimde alındı. Sağlayıcı gecikme süresini yanıtta belirtmediği için gecikme değeri üretilmez.`,
      checkedAt,
      data: {
        symbol,
        interval: "15min",
        bars,
        asOf: bars.at(-1)?.timestamp ?? checkedAt,
        sourceLabel: "Twelve Data · BIST XIST · 15 dk bar",
        sourceUrl: "https://twelvedata.com/exchanges/xist",
        delayMinutes: null,
      },
    };
    responseCache.set(symbol, { expiresAt: Date.now() + CACHE_TTL_MS, result });
    return result;
  } catch (error) {
    return { state: "ERROR", detail: error instanceof Error ? error.message : "Twelve Data OHLCV erişim hatası.", checkedAt, data: null };
  }
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method && request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }
  const result = await fetchBistOhlcv(normalizedSymbol(request.query?.symbol) ?? "");
  response.status(result.state === "ERROR" ? 502 : 200).json(result);
}
