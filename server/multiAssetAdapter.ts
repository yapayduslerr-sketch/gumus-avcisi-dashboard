export type MultiAssetKey = "USD_TRY" | "BRENT" | "XAU_USD" | "BTC_USD";
export type MultiAssetState = "READY" | "LICENSE_REQUIRED" | "CONFIG_REQUIRED" | "ERROR";

export type MultiAssetQuote = {
  assetKey: MultiAssetKey;
  symbol: string;
  label: string;
  price: number;
  percentChange: number | null;
  observedAt: string;
  sourceLabel: string;
  sourceUrl: string;
  delayMinutes: number | null;
};

export type MultiAssetResult = {
  state: MultiAssetState;
  checkedAt: string;
  detail: string;
  quotes: MultiAssetQuote[];
  unavailableAssetKeys: MultiAssetKey[];
};

type Env = Record<string, string | undefined>;
type FetchLike = (input: string, init?: RequestInit) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

const definitions: Record<MultiAssetKey, { label: string; defaultSymbol: string }> = {
  USD_TRY: { label: "USD/TRY", defaultSymbol: "USD/TRY" },
  BRENT: { label: "Brent spot", defaultSymbol: "BRENT" },
  XAU_USD: { label: "Ons altın", defaultSymbol: "XAU/USD" },
  BTC_USD: { label: "Bitcoin", defaultSymbol: "BTC/USD" },
};

type TwelveDataQuote = {
  symbol?: string;
  close?: string | number;
  price?: string | number;
  percent_change?: string | number;
  timestamp?: number | string;
  datetime?: string;
  status?: string;
  message?: string;
};

const QUOTE_CACHE_TTL_MS = 60_000;
let quoteCache: { expiresAt: number; result: MultiAssetResult } | null = null;

function numeric(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function configuredSymbols(env: Env) {
  return (Object.keys(definitions) as MultiAssetKey[]).map((assetKey) => ({
    assetKey,
    ...definitions[assetKey],
    symbol: env[`TWELVE_DATA_SYMBOL_${assetKey}`]?.trim() || definitions[assetKey].defaultSymbol,
  }));
}

export function getMultiAssetReadiness(env: Env = process.env) {
  const missingEnv = ["TWELVE_DATA_API_KEY"].filter((key) => !env[key]?.trim());
  return { ready: missingEnv.length === 0, missingEnv, baseUrl: env.TWELVE_DATA_API_BASE_URL?.trim() || "https://api.twelvedata.com" };
}

/**
 * Twelve Data anahtarı yokken veya sağlayıcı açık biçimde yapılandırılmadığında
 * hiç ağ isteği yapmaz. Bu adapter ham sağlayıcı gövdesini istemciye döndürmez.
 */
export async function fetchMultiAssetQuotes(env: Env = process.env, fetcher: FetchLike = fetch): Promise<MultiAssetResult> {
  const checkedAt = new Date().toISOString();
  const readiness = getMultiAssetReadiness(env);
  if (!readiness.ready) return { state: "LICENSE_REQUIRED", checkedAt, detail: `Eksik: ${readiness.missingEnv.join(", ")}`, quotes: [], unavailableAssetKeys: [] };
  if (quoteCache && quoteCache.expiresAt > Date.now()) return quoteCache.result;
  const apiKey = env.TWELVE_DATA_API_KEY?.trim();
  if (!apiKey) return { state: "LICENSE_REQUIRED", checkedAt, detail: "Twelve Data API anahtarı bekleniyor.", quotes: [], unavailableAssetKeys: [] };
  const symbols = configuredSymbols(env);
  const quoteUrl = new URL("/quote", readiness.baseUrl);
  quoteUrl.searchParams.set("symbol", symbols.map((item) => item.symbol).join(","));

  try {
    const response = await fetcher(quoteUrl.toString(), { headers: { Authorization: `apikey ${apiKey}` } });
    if (!response.ok) return { state: "ERROR", checkedAt, detail: `Twelve Data çağrısı HTTP ${response.status} döndü.`, quotes: [], unavailableAssetKeys: [] };
    const raw = await response.json();
    const collection: Record<string, TwelveDataQuote> = Array.isArray(raw) ? Object.fromEntries(raw.map((item: TwelveDataQuote) => [item.symbol ?? "", item])) : typeof raw === "object" && raw !== null ? raw as Record<string, TwelveDataQuote> : {};
    const quotes = symbols.flatMap(({ assetKey, label, symbol }) => {
      const payload = collection[symbol] ?? (collection.symbol === symbol ? collection : undefined);
      const price = numeric(payload?.close ?? payload?.price);
      if (!payload || payload.status === "error" || price === null) return [];
      const timestamp = numeric(payload.timestamp);
      return [{ assetKey, symbol, label, price, percentChange: numeric(payload.percent_change), observedAt: timestamp ? new Date(timestamp * 1000).toISOString() : payload.datetime ? new Date(payload.datetime).toISOString() : checkedAt, sourceLabel: "Twelve Data", sourceUrl: "https://twelvedata.com/", delayMinutes: null } satisfies MultiAssetQuote];
    });
    const unavailableAssetKeys = symbols.filter((item) => !quotes.some((quote) => quote.assetKey === item.assetKey)).map((item) => item.assetKey);
    if (!quotes.length) return { state: "CONFIG_REQUIRED", checkedAt, detail: "Sağlayıcı yanıtında kullanılabilir sembol bulunamadı; sembol eşlemesini ve plan kapsamını doğrulayın.", quotes: [], unavailableAssetKeys: symbols.map((item) => item.assetKey) };
    const result = { state: "READY" as const, checkedAt, detail: unavailableAssetKeys.length ? `Twelve Data kartları kısmen güncellendi; ${unavailableAssetKeys.join(", ")} için sembol eşlemesi veya plan kapsamı gerekli.` : "Twelve Data çoklu-varlık kartları güncellendi.", quotes, unavailableAssetKeys };
    quoteCache = { expiresAt: Date.now() + QUOTE_CACHE_TTL_MS, result };
    return result;
  } catch (error) {
    return { state: "ERROR", checkedAt, detail: error instanceof Error ? error.message : "Twelve Data erişim hatası.", quotes: [], unavailableAssetKeys: [] };
  }
}
