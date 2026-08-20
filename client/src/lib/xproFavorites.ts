export type XProFavoriteCandidate = {
  symbol: string;
  dataMode: "DEMO" | "LIVE";
  price: number;
  volume: number;
  scores: { qualityScore: number | null; earlyScore: number | null; riskScore: number | null };
};

export type XProFavorite = {
  symbol: string;
  dataMode: "DEMO" | "LIVE";
  addedAt: string;
  baseline: {
    qualityScore: number | null;
    earlyScore: number | null;
    riskScore: number | null;
    price: number;
    volume: number;
  };
};

export const XPRO_FAVORITES_STORAGE_KEY = "gumus-avcisi.xpro-favorites.v1";

export function createXProFavorite(candidate: XProFavoriteCandidate, addedAt = new Date().toISOString()): XProFavorite {
  return { symbol: candidate.symbol, dataMode: candidate.dataMode, addedAt, baseline: { qualityScore: candidate.scores.qualityScore, earlyScore: candidate.scores.earlyScore, riskScore: candidate.scores.riskScore, price: candidate.price, volume: candidate.volume } };
}

export function toggleXProFavorite(current: XProFavorite[], candidate: XProFavoriteCandidate, addedAt?: string) {
  return current.some((item) => item.symbol === candidate.symbol) ? current.filter((item) => item.symbol !== candidate.symbol) : [...current, createXProFavorite(candidate, addedAt)];
}

export function readXProFavorites(storage: Pick<Storage, "getItem"> | null = typeof window === "undefined" ? null : window.localStorage): XProFavorite[] {
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(XPRO_FAVORITES_STORAGE_KEY) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is XProFavorite => typeof item === "object" && item !== null && typeof (item as XProFavorite).symbol === "string" && typeof (item as XProFavorite).addedAt === "string") : [];
  } catch { return []; }
}

export function writeXProFavorites(favorites: XProFavorite[], storage: Pick<Storage, "setItem"> | null = typeof window === "undefined" ? null : window.localStorage) {
  if (storage) storage.setItem(XPRO_FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
}
