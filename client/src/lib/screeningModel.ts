export const QUALITY_SCORE_PARTS = [
  ["Büyüme", "Satış · FAVÖK · net kâr trendi", 25],
  ["Kalite", "Tekrarlayan kâr · marj · ROE/ROIC", 20],
  ["Nakit & borç", "CFO · net borç · işletme sermayesi", 20],
  ["Değerleme", "F/K · FD/FAVÖK · tarihli baz", 20],
  ["Piyasa doğrulaması", "Likidite · fiili dolaşım · teknik bağlam", 15],
] as const;

export type ScreeningEvidence = {
  asOfDate?: string | null;
  sourceUrl?: string | null;
  financialPeriod?: string | null;
};

export function totalQualityWeight() {
  return QUALITY_SCORE_PARTS.reduce((total, [, , weight]) => total + weight, 0);
}

export function researchPublicationState(evidence: ScreeningEvidence) {
  if (!evidence.asOfDate || !evidence.financialPeriod) return "Tarih teyidi gerekli" as const;
  if (!evidence.sourceUrl) return "Kaynak teyidi gerekli" as const;
  return "Yayımlanabilir" as const;
}
