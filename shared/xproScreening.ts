import type { XProScoreProfile, XProSymbolObservation } from "./xproContracts";

export type XProScreeningFilters = {
  minimumQualityScore: number;
  minimumEarlyScore: number;
  maximumRiskScore: number;
  minimumRelativeVolume: number;
};

export type XProScreeningDecision = {
  symbol: string;
  status: "ADAY" | "ELENDİ" | "VERİ_EKSİK";
  reasons: string[];
  filters: XProScreeningFilters;
};

export const DEFAULT_XPRO_FILTERS: XProScreeningFilters = {
  minimumQualityScore: 70,
  minimumEarlyScore: 70,
  maximumRiskScore: 60,
  minimumRelativeVolume: 1,
};

function relativeVolume(observation: XProSymbolObservation) {
  if (observation.candles.length < 21) return null;
  const last = observation.candles.at(-1)?.volume;
  const average = observation.candles.slice(-21, -1).reduce((sum, candle) => sum + candle.volume, 0) / 20;
  return last && average ? last / average : null;
}

export function explainXProScreening(observation: XProSymbolObservation, score: XProScoreProfile, filters: XProScreeningFilters = DEFAULT_XPRO_FILTERS): XProScreeningDecision {
  if (score.qualityScore === null || score.earlyScore === null || score.riskScore === null) {
    return { symbol: observation.symbol, status: "VERİ_EKSİK", filters, reasons: [...score.blockers, "Taranabilir skor için tarihli ve doğrulanmış veri gerekir."] };
  }
  const reasons: string[] = [];
  const relative = relativeVolume(observation);
  if (score.qualityScore < filters.minimumQualityScore) reasons.push(`Kalite Score ${score.qualityScore} / ${filters.minimumQualityScore} eşiğinin altında.`);
  if (score.earlyScore < filters.minimumEarlyScore) reasons.push(`Early Score ${score.earlyScore} / ${filters.minimumEarlyScore} eşiğinin altında.`);
  if (score.riskScore > filters.maximumRiskScore) reasons.push(`Risk Score ${score.riskScore} / ${filters.maximumRiskScore} üstünde.`);
  if (relative === null) reasons.push("Göreli hacim hesaplamak için yeterli geçmiş yok.");
  else if (relative < filters.minimumRelativeVolume) reasons.push(`Göreli hacim ${relative.toFixed(2)}x / ${filters.minimumRelativeVolume.toFixed(2)}x eşiğinin altında.`);
  if (!reasons.length) reasons.push("Tüm kural eşikleri sağlandı; sonuç araştırma adayıdır, yatırım tavsiyesi değildir.");
  return { symbol: observation.symbol, status: reasons.length === 1 && reasons[0].includes("Tüm kural") ? "ADAY" : "ELENDİ", reasons, filters };
}
