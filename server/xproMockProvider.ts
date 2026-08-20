import type { XProCandle, XProSnapshot, XProSymbolObservation } from "../shared/xproContracts";
import { getXProProviderStatus } from "./xproProviderRegistry";

type DemoDefinition = {
  symbol: string;
  companyName: string;
  sector: string;
  basePrice: number;
  drift: number;
  volatility: number;
  baseVolume: number;
};

const definitions: DemoDefinition[] = [
  { symbol: "DEMO-ALFA", companyName: "Alfa Endüstri Demo A.Ş.", sector: "Sentetik sanayi senaryosu", basePrice: 42, drift: 0.075, volatility: 0.38, baseVolume: 1_300_000 },
  { symbol: "DEMO-BETA", companyName: "Beta Teknoloji Demo A.Ş.", sector: "Sentetik teknoloji senaryosu", basePrice: 68, drift: 0.035, volatility: 0.62, baseVolume: 920_000 },
  { symbol: "DEMO-GAMA", companyName: "Gama Tüketim Demo A.Ş.", sector: "Sentetik tüketim senaryosu", basePrice: 27, drift: -0.012, volatility: 0.44, baseVolume: 1_750_000 },
];

function generatedCandle(definition: DemoDefinition, index: number, endAt: Date): XProCandle {
  const seasonal = Math.sin(index * 0.22 + definition.basePrice) * definition.volatility;
  const priorSeasonal = Math.sin((index - 1) * 0.22 + definition.basePrice) * definition.volatility;
  const close = Number((definition.basePrice + index * definition.drift + seasonal).toFixed(2));
  const open = Number((definition.basePrice + Math.max(index - 1, 0) * definition.drift + priorSeasonal).toFixed(2));
  const spread = 0.34 + Math.abs(Math.cos(index * 0.17)) * definition.volatility;
  const date = new Date(endAt);
  date.setUTCDate(date.getUTCDate() - (259 - index));
  return {
    timestamp: date.toISOString(),
    open,
    high: Number((Math.max(open, close) + spread).toFixed(2)),
    low: Number((Math.min(open, close) - spread).toFixed(2)),
    close,
    volume: Math.round(definition.baseVolume * (0.72 + Math.abs(Math.sin(index * 0.11)) * 0.58)),
    adjusted: null,
  };
}

function toObservation(definition: DemoDefinition, observedAt: string): XProSymbolObservation {
  const endAt = new Date(observedAt);
  const candles = Array.from({ length: 260 }, (_, index) => generatedCandle(definition, index, endAt));
  return {
    symbol: definition.symbol,
    companyName: definition.companyName,
    sector: definition.sector,
    dataMode: "DEMO",
    sourceLabel: "Gümüş Avcısı Demo Provider · sentetik",
    sourceUrl: null,
    observedAt,
    delayMinutes: null,
    candles,
    metrics: {
      marketCap: definition.basePrice * 1_000_000,
      freeFloatPercent: 28,
      pe: 14.2,
      pb: 2.1,
      evEbitda: 7.8,
      revenueGrowthPercent: 18,
      ebitdaGrowthPercent: 14,
      netProfitGrowthPercent: 11,
      roePercent: 21,
      roicPercent: 18,
      netDebtToEbitda: 0.7,
      freeCashFlow: 1_200_000,
    },
    kapEvents: [{ id: `${definition.symbol}-DEMO-EVENT-01`, publishedAt: observedAt, category: "UNKNOWN", subject: "DEMO OLAYI — gerçek KAP bildirimi değildir.", sourceUrl: null, dataMode: "DEMO" }],
  };
}

export function createXProDemoSnapshot(observedAt = "2026-01-02T12:00:00.000Z"): XProSnapshot {
  return {
    provider: getXProProviderStatus("mock", {}),
    generatedAt: observedAt,
    observations: definitions.map((definition) => toObservation(definition, observedAt)),
    dataQualityScore: 0,
    qualityIssues: ["DEMO / SENTETİK — CANLI VERİ BAĞLI DEĞİL.", "Gerçek BIST fiyatı, hacmi veya KAP olayı değildir; yatırım araştırmasında kullanılmamalıdır."],
  };
}
