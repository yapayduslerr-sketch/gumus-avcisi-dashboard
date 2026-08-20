import type { XProCandle, XProDataMode } from "./xproContracts";

export type XProValidationRecord = {
  symbol: string;
  dataMode: XProDataMode;
  predictionDate: string;
  signalDate: string;
  entryPrice: number | null;
  price5d: number | null;
  price20d: number | null;
  price60d: number | null;
  price120d: number | null;
  return5d: number | null;
  return20d: number | null;
  return60d: number | null;
  return120d: number | null;
  benchmarkReturn20d: number | null;
  signalSuccess: boolean | null;
  status: "READY" | "NOT_AVAILABLE" | "INSUFFICIENT_HISTORY";
  detail: string;
};

export type XProBacktestSummary = {
  status: "READY" | "NOT_AVAILABLE" | "INSUFFICIENT_HISTORY";
  observations: number;
  winRate: number | null;
  averageGain: number | null;
  averageLoss: number | null;
  maxDrawdown: number | null;
  sharpe: number | null;
  benchmarkComparison: number | null;
  detail: string;
};

const percentageReturn = (entry: number, exit: number | undefined) => exit === undefined ? null : (exit / entry - 1) * 100;

export function createXProValidationRecord(symbol: string, dataMode: XProDataMode, candles: XProCandle[], signalIndex: number, benchmarkCandles: XProCandle[] = []): XProValidationRecord {
  if (dataMode !== "LIVE") {
    return { symbol, dataMode, predictionDate: candles[signalIndex]?.timestamp ?? "", signalDate: candles[signalIndex]?.timestamp ?? "", entryPrice: null, price5d: null, price20d: null, price60d: null, price120d: null, return5d: null, return20d: null, return60d: null, return120d: null, benchmarkReturn20d: null, signalSuccess: null, status: "NOT_AVAILABLE", detail: "DEMO / SENTETİK veriyle backtest veya başarı iddiası üretilmez." };
  }
  const entry = candles[signalIndex];
  if (!entry || candles.length <= signalIndex + 120) {
    return { symbol, dataMode, predictionDate: entry?.timestamp ?? "", signalDate: entry?.timestamp ?? "", entryPrice: entry?.close ?? null, price5d: null, price20d: null, price60d: null, price120d: null, return5d: null, return20d: null, return60d: null, return120d: null, benchmarkReturn20d: null, signalSuccess: null, status: "INSUFFICIENT_HISTORY", detail: "5/20/60/120 gün forward doğrulaması için yeterli canlı tarihçe yok." };
  }
  const return5d = percentageReturn(entry.close, candles[signalIndex + 5]?.close);
  const return20d = percentageReturn(entry.close, candles[signalIndex + 20]?.close);
  const return60d = percentageReturn(entry.close, candles[signalIndex + 60]?.close);
  const return120d = percentageReturn(entry.close, candles[signalIndex + 120]?.close);
  const benchmarkEntry = benchmarkCandles[signalIndex]?.close;
  const benchmarkReturn20d = benchmarkEntry ? percentageReturn(benchmarkEntry, benchmarkCandles[signalIndex + 20]?.close) : null;
  return { symbol, dataMode, predictionDate: entry.timestamp, signalDate: entry.timestamp, entryPrice: entry.close, price5d: candles[signalIndex + 5]?.close ?? null, price20d: candles[signalIndex + 20]?.close ?? null, price60d: candles[signalIndex + 60]?.close ?? null, price120d: candles[signalIndex + 120]?.close ?? null, return5d, return20d, return60d, return120d, benchmarkReturn20d, signalSuccess: return20d === null ? null : return20d > 0, status: "READY", detail: "Canlı tarihli OHLCV ile hesaplandı; kurumsal eylem/split ayarlaması sağlayıcıdan doğrulanmalıdır." };
}

export function summarizeXProBacktest(records: XProValidationRecord[]): XProBacktestSummary {
  const ready = records.filter((record) => record.status === "READY" && record.return20d !== null);
  if (!ready.length) return { status: records.some((record) => record.status === "INSUFFICIENT_HISTORY") ? "INSUFFICIENT_HISTORY" : "NOT_AVAILABLE", observations: 0, winRate: null, averageGain: null, averageLoss: null, maxDrawdown: null, sharpe: null, benchmarkComparison: null, detail: "Yalnızca yeterli canlı tarihli OHLCV ile doğrulanmış kayıtlar özetlenebilir." };
  const returns = ready.map((record) => record.return20d!);
  const gains = returns.filter((value) => value > 0);
  const losses = returns.filter((value) => value <= 0);
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
  const benchmarkValues = ready.map((record) => record.benchmarkReturn20d).filter((value): value is number => value !== null);
  return { status: "READY", observations: ready.length, winRate: gains.length / ready.length * 100, averageGain: gains.length ? gains.reduce((sum, value) => sum + value, 0) / gains.length : null, averageLoss: losses.length ? losses.reduce((sum, value) => sum + value, 0) / losses.length : null, maxDrawdown: Math.min(...returns), sharpe: variance > 0 ? mean / Math.sqrt(variance) : null, benchmarkComparison: benchmarkValues.length ? mean - benchmarkValues.reduce((sum, value) => sum + value, 0) / benchmarkValues.length : null, detail: "Özet, 20 gün forward getiri temelindedir; forward periodu, benchmark ve kurumsal eylem düzeltmesi kayıtta ayrıca belirtilmelidir." };
}
