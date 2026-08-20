import type { XProDataQuality, XProSymbolObservation } from "./xproContracts";

export function evaluateXProDataQuality(observation: XProSymbolObservation, options: { expectedSymbol?: string; now?: string; maxStaleMinutes?: number } = {}): XProDataQuality {
  const checkedAt = options.now ?? new Date().toISOString();
  if (observation.dataMode === "DEMO") return { score: 0, state: "NOT_APPLICABLE", issues: ["DEMO / SENTETİK kayıt canlı veri kalite puanına dahil edilmez."], checkedAt };
  const issues: string[] = [];
  const candles = observation.candles;
  const expectedSymbol = options.expectedSymbol?.trim().toUpperCase();
  if (expectedSymbol && observation.symbol !== expectedSymbol) issues.push("Sembol eşleşmiyor.");
  if (!candles.length) issues.push("Eksik fiyat: mum verisi yok.");
  const timestamps = new Set<string>();
  candles.forEach((candle) => {
    if (!Number.isFinite(candle.close) || candle.close <= 0) issues.push("Eksik veya geçersiz kapanış fiyatı.");
    if (!Number.isFinite(candle.volume)) issues.push("Eksik hacim.");
    if (candle.volume < 0) issues.push("Negatif hacim.");
    if (candle.low > Math.min(candle.open, candle.close) || candle.high < Math.max(candle.open, candle.close) || candle.low > candle.high) issues.push("İmkânsız OHLC aralığı.");
    if (timestamps.has(candle.timestamp)) issues.push("Tekrar eden mum zaman damgası.");
    timestamps.add(candle.timestamp);
  });
  const observedAt = new Date(observation.observedAt).getTime();
  const lastTimestamp = candles.at(-1) ? new Date(candles.at(-1)!.timestamp).getTime() : Number.NaN;
  if (!Number.isFinite(observedAt) || !Number.isFinite(lastTimestamp) || lastTimestamp > observedAt) issues.push("Gözlem zamanı ile mum zamanı uyuşmuyor.");
  const maxStaleMinutes = options.maxStaleMinutes ?? (observation.delayMinutes ?? 15) + 30;
  if (Number.isFinite(observedAt) && new Date(checkedAt).getTime() - observedAt > maxStaleMinutes * 60_000) issues.push("Veri eski; güncelleme eşiğini aştı.");
  if (candles.some((candle) => candle.adjusted === null)) issues.push("Kurumsal eylem/split ayarlaması sağlayıcı tarafından teyit edilmedi.");
  const distinctIssues = Array.from(new Set(issues));
  const score = Math.max(0, 100 - distinctIssues.length * 15);
  return { score, state: score < 55 ? "REJECTED" : distinctIssues.length ? "WARNING" : "READY", issues: distinctIssues, checkedAt };
}
