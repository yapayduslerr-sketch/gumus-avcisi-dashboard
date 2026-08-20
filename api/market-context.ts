type Request = { method?: string };
type Response = { status: (code: number) => { json: (body: unknown) => void } };

type AssetKey = "USD_TRY" | "BRENT" | "XAU_USD" | "BTC_USD";
type TwelveQuote = { symbol?: string; close?: string | number; price?: string | number; percent_change?: string | number; timestamp?: number | string; datetime?: string; status?: string };

const definitions: Record<AssetKey, { label: string; symbol: string }> = {
  USD_TRY: { label: "USD/TRY", symbol: "USD/TRY" },
  BRENT: { label: "Brent spot", symbol: "BRENT" },
  XAU_USD: { label: "Ons altın", symbol: "XAU/USD" },
  BTC_USD: { label: "Bitcoin", symbol: "BTC/USD" },
};

const cacheTtlMs = 60_000;
let cache: { expiresAt: number; payload: unknown } | null = null;

const numeric = (value: unknown) => {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
};

export default async function handler(request: Request, response: Response) {
  if (request.method !== "GET") return response.status(405).json({ error: "method not allowed" });
  const checkedAt = new Date().toISOString();
  const apiKey = process.env.TWELVE_DATA_API_KEY?.trim();
  if (!apiKey) return response.status(200).json({ state: "LICENSE_REQUIRED", checkedAt, detail: "Eksik: TWELVE_DATA_API_KEY", quotes: [], unavailableAssetKeys: [] });
  if (cache && cache.expiresAt > Date.now()) return response.status(200).json(cache.payload);

  const assets = (Object.keys(definitions) as AssetKey[]).map((assetKey) => ({ assetKey, label: definitions[assetKey].label, symbol: process.env[`TWELVE_DATA_SYMBOL_${assetKey}`]?.trim() || definitions[assetKey].symbol }));
  const url = new URL("/quote", process.env.TWELVE_DATA_API_BASE_URL?.trim() || "https://api.twelvedata.com");
  url.searchParams.set("symbol", assets.map((asset) => asset.symbol).join(","));

  try {
    const upstream = await fetch(url.toString(), { headers: { Authorization: `apikey ${apiKey}` } });
    if (!upstream.ok) return response.status(200).json({ state: "ERROR", checkedAt, detail: `Twelve Data çağrısı HTTP ${upstream.status} döndü.`, quotes: [], unavailableAssetKeys: [] });
    const raw = await upstream.json();
    const collection: Record<string, TwelveQuote> = Array.isArray(raw) ? Object.fromEntries(raw.map((item: TwelveQuote) => [item.symbol ?? "", item])) : typeof raw === "object" && raw !== null ? raw as Record<string, TwelveQuote> : {};
    const quotes = assets.flatMap((asset) => {
      const item = collection[asset.symbol] ?? (collection.symbol === asset.symbol ? collection : undefined);
      const price = numeric(item?.close ?? item?.price);
      if (!item || item.status === "error" || price === null) return [];
      const timestamp = numeric(item.timestamp);
      return [{ assetKey: asset.assetKey, symbol: asset.symbol, label: asset.label, price, percentChange: numeric(item.percent_change), observedAt: timestamp ? new Date(timestamp * 1000).toISOString() : item.datetime ? new Date(item.datetime).toISOString() : checkedAt, sourceLabel: "Twelve Data", sourceUrl: "https://twelvedata.com/", delayMinutes: null }];
    });
    const unavailableAssetKeys = assets.filter((asset) => !quotes.some((quote) => quote.assetKey === asset.assetKey)).map((asset) => asset.assetKey);
    const payload = quotes.length ? { state: "READY", checkedAt, detail: unavailableAssetKeys.length ? `Twelve Data kartları kısmen güncellendi; ${unavailableAssetKeys.join(", ")} için sembol eşlemesi veya plan kapsamı gerekli.` : "Twelve Data çoklu-varlık kartları güncellendi.", quotes, unavailableAssetKeys } : { state: "CONFIG_REQUIRED", checkedAt, detail: "Sağlayıcı yanıtında kullanılabilir sembol bulunamadı; sembol eşlemesini ve plan kapsamını doğrulayın.", quotes: [], unavailableAssetKeys: assets.map((asset) => asset.assetKey) };
    if (payload.state === "READY") cache = { expiresAt: Date.now() + cacheTtlMs, payload };
    return response.status(200).json(payload);
  } catch (error) {
    return response.status(200).json({ state: "ERROR", checkedAt, detail: error instanceof Error ? error.message : "Twelve Data erişim hatası.", quotes: [], unavailableAssetKeys: [] });
  }
}
