export type WatchlistItem = {
  symbol: string;
  note: string;
  updatedAt: string;
};

export type DeviceAlertPreferences = {
  sourceStatusChanges: boolean;
  verifiedCatalysts: boolean;
  inAppEnabled: boolean;
};

const WATCHLIST_KEY = "gumus-avcisi.watchlist.v1";
const ALERTS_KEY = "gumus-avcisi.alert-preferences.v1";

export const defaultAlertPreferences: DeviceAlertPreferences = {
  sourceStatusChanges: false,
  verifiedCatalysts: false,
  inAppEnabled: true,
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadWatchlist() {
  return read<WatchlistItem[]>(WATCHLIST_KEY, []);
}

export function persistWatchlist(items: WatchlistItem[]) {
  write(WATCHLIST_KEY, items);
}

export function upsertWatchlistItem(items: WatchlistItem[], symbol: string, note = "") {
  const normalized = symbol.trim().toLocaleUpperCase("tr-TR");
  const existing = items.find((item) => item.symbol === normalized);
  const next = existing
    ? items.map((item) => item.symbol === normalized ? { ...item, note, updatedAt: new Date().toISOString() } : item)
    : [{ symbol: normalized, note, updatedAt: new Date().toISOString() }, ...items];
  persistWatchlist(next);
  return next;
}

export function removeWatchlistItem(items: WatchlistItem[], symbol: string) {
  const next = items.filter((item) => item.symbol !== symbol);
  persistWatchlist(next);
  return next;
}

export function loadAlertPreferences() {
  return { ...defaultAlertPreferences, ...read<Partial<DeviceAlertPreferences>>(ALERTS_KEY, {}) };
}

export function persistAlertPreferences(preferences: DeviceAlertPreferences) {
  write(ALERTS_KEY, preferences);
}
