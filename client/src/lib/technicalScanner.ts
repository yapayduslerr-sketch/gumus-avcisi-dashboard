export type OhlcvBar = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type TechnicalDataSet = {
  symbol: string;
  bars: OhlcvBar[];
  asOf: string;
  sourceUrl: string;
  sourceLabel: string;
  delayMinutes: number | null;
};

export type ScannerModelId =
  | "rsi-momentum"
  | "macd-cross"
  | "bollinger-squeeze"
  | "volume-breakout"
  | "sma-10-50-cross"
  | "golden-cross"
  | "fifty-two-week-breakout"
  | "trend-regime"
  | "range-breakout";

export type ScannerModel = {
  id: ScannerModelId;
  name: string;
  shortName: string;
  description: string;
  minimumBars: number;
  parameters: string;
  defaultTimeframe: string;
};

export type TechnicalEvidence = {
  rsi14: number | null;
  macd: number | null;
  macdSignal: number | null;
  sma10: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  volumeMultiple20: number | null;
  high52w: number | null;
  prior20High: number | null;
};

export type ChartOverlayPoint = {
  timestamp: string;
  sma10: number | null;
  sma20: number | null;
  sma50: number | null;
};

export type ScannerFinding = {
  modelId: ScannerModelId;
  modelName: string;
  matched: boolean;
  state: "MATCH" | "NO_MATCH" | "INSUFFICIENT_DATA" | "INVALID_SOURCE";
  explanation: string;
  evidence: TechnicalEvidence;
};

export const TECHNICAL_SCANNER_MODELS: ScannerModel[] = [
  { id: "rsi-momentum", name: "RSI Momentum", shortName: "RSI", description: "RSI(14) 55–75 aralığında ve aşırı alım eşiğinin altında kalır.", minimumBars: 15, parameters: "RSI(14): 55–75", defaultTimeframe: "Günlük" },
  { id: "macd-cross", name: "MACD Kesişimi", shortName: "MACD", description: "MACD çizgisinin sinyal çizgisini son barda aşağıdan yukarı kesmesi.", minimumBars: 35, parameters: "EMA(12,26), sinyal(9)", defaultTimeframe: "Günlük / 4s" },
  { id: "bollinger-squeeze", name: "Bollinger Sıkışması", shortName: "Bollinger", description: "Bant genişliğinin son 20 gözlem içindeki en düşük çeyrekte olması.", minimumBars: 40, parameters: "SMA(20), ±2σ, genişlik yüzdelik dilimi", defaultTimeframe: "Günlük" },
  { id: "volume-breakout", name: "Hacim Eşiği", shortName: "Hacim", description: "Güncel hacmin önceki 20 bar ortalamasının en az iki katına ulaşması.", minimumBars: 21, parameters: "Hacim ≥ 2,0× SMA(20)", defaultTimeframe: "Günlük" },
  { id: "sma-10-50-cross", name: "10/50 Ort. Kesişimi", shortName: "10/50", description: "SMA(10) çizgisinin SMA(50) çizgisini son barda aşağıdan yukarı kesmesi.", minimumBars: 51, parameters: "SMA(10) × SMA(50)", defaultTimeframe: "Günlük" },
  { id: "golden-cross", name: "Golden Cross", shortName: "50/200", description: "SMA(50) çizgisinin SMA(200) çizgisinin üzerinde bulunması; kesişim anı ayrıca belirtilir.", minimumBars: 200, parameters: "SMA(50) ve SMA(200)", defaultTimeframe: "Günlük / Haftalık" },
  { id: "fifty-two-week-breakout", name: "52 Hafta Zirve Bağlamı", shortName: "52H", description: "Kapanışın son 252 barın en yüksek değerinin %1 içinde olması.", minimumBars: 252, parameters: "252 bar en yüksek, %1 tolerans", defaultTimeframe: "Günlük" },
  { id: "trend-regime", name: "Trend Rejimi", shortName: "Trend", description: "Kapanışın SMA(50) üzerinde ve SMA(50)’nin SMA(200) üzerinde olması.", minimumBars: 200, parameters: "Kapanış > SMA(50) > SMA(200)", defaultTimeframe: "Günlük / Haftalık" },
  { id: "range-breakout", name: "20 Bar Kırılımı", shortName: "Kırılım", description: "Kapanışın önceki 20 barın en yüksek seviyesini aşması ve hacmin ortalamanın üzerinde kalması.", minimumBars: 21, parameters: "Kapanış ≥ 20B zirve, hacim ≥ 1,2×", defaultTimeframe: "Günlük / 4s" },
];

const round = (value: number | null, digits = 2) => value === null || !Number.isFinite(value) ? null : Number(value.toFixed(digits));

function average(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function simpleMovingAverage(values: number[], period: number, offset = 0): number | null {
  const end = values.length - offset;
  const start = end - period;
  if (start < 0) return null;
  return average(values.slice(start, end));
}

export function buildChartOverlays(bars: OhlcvBar[]): ChartOverlayPoint[] {
  const closes = bars.map((bar) => bar.close);
  return bars.map((bar, index) => {
    const window = closes.slice(0, index + 1);
    return {
      timestamp: bar.timestamp,
      sma10: round(simpleMovingAverage(window, 10), 4),
      sma20: round(simpleMovingAverage(window, 20), 4),
      sma50: round(simpleMovingAverage(window, 50), 4),
    };
  });
}

function exponentialMovingAverage(values: number[], period: number): number[] {
  if (values.length < period) return [];
  const multiplier = 2 / (period + 1);
  const output: number[] = [];
  let current = average(values.slice(0, period));
  if (current === null) return output;
  output.push(current);
  for (let index = period; index < values.length; index += 1) {
    current = (values[index] - current) * multiplier + current;
    output.push(current);
  }
  return output;
}

function relativeStrengthIndex(values: number[], period = 14): number | null {
  if (values.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let index = 1; index <= period; index += 1) {
    const change = values[index] - values[index - 1];
    gains += Math.max(change, 0);
    losses += Math.max(-change, 0);
  }
  let averageGain = gains / period;
  let averageLoss = losses / period;
  for (let index = period + 1; index < values.length; index += 1) {
    const change = values[index] - values[index - 1];
    averageGain = (averageGain * (period - 1) + Math.max(change, 0)) / period;
    averageLoss = (averageLoss * (period - 1) + Math.max(-change, 0)) / period;
  }
  if (averageLoss === 0) return 100;
  const rs = averageGain / averageLoss;
  return 100 - 100 / (1 + rs);
}

function macdSeries(values: number[]) {
  if (values.length < 35) return { macd: null, signal: null, previousMacd: null, previousSignal: null };
  const fast = exponentialMovingAverage(values, 12);
  const slow = exponentialMovingAverage(values, 26);
  const alignedFast = fast.slice(fast.length - slow.length);
  const macd = alignedFast.map((value, index) => value - slow[index]);
  const signal = exponentialMovingAverage(macd, 9);
  if (signal.length < 2) return { macd: null, signal: null, previousMacd: null, previousSignal: null };
  const alignedMacd = macd.slice(macd.length - signal.length);
  return {
    macd: alignedMacd.at(-1) ?? null,
    signal: signal.at(-1) ?? null,
    previousMacd: alignedMacd.at(-2) ?? null,
    previousSignal: signal.at(-2) ?? null,
  };
}

function bollingerWidth(values: number[], period = 20, offset = 0): number | null {
  const end = values.length - offset;
  const window = values.slice(end - period, end);
  const mean = average(window);
  if (!mean || window.length < period) return null;
  const variance = average(window.map((value) => (value - mean) ** 2));
  if (variance === null) return null;
  return (4 * Math.sqrt(variance)) / mean;
}

export function validateTechnicalDataSet(data: TechnicalDataSet): string | null {
  if (!data.sourceUrl || !/^https:\/\//.test(data.sourceUrl)) return "Kaynak URL’si geçerli değil.";
  if (!data.asOf || Number.isNaN(new Date(data.asOf).getTime())) return "Gözlem zamanı geçerli değil.";
  if (!data.bars.length) return "OHLCV barı yok.";
  const invalidBar = data.bars.some((bar) => !bar.timestamp || ![bar.open, bar.high, bar.low, bar.close, bar.volume].every(Number.isFinite) || bar.low > bar.high || bar.volume < 0);
  return invalidBar ? "OHLCV verisi doğrulama kurallarını geçmiyor." : null;
}

export function calculateTechnicalEvidence(data: TechnicalDataSet): TechnicalEvidence {
  const closes = data.bars.map((bar) => bar.close);
  const volumes = data.bars.map((bar) => bar.volume);
  const latestVolume = volumes.at(-1) ?? null;
  const priorVolumeAverage = simpleMovingAverage(volumes, 20, 1);
  const macd = macdSeries(closes);
  return {
    rsi14: round(relativeStrengthIndex(closes)),
    macd: round(macd.macd, 4),
    macdSignal: round(macd.signal, 4),
    sma10: round(simpleMovingAverage(closes, 10)),
    sma20: round(simpleMovingAverage(closes, 20)),
    sma50: round(simpleMovingAverage(closes, 50)),
    sma200: round(simpleMovingAverage(closes, 200)),
    volumeMultiple20: latestVolume !== null && priorVolumeAverage ? round(latestVolume / priorVolumeAverage) : null,
    high52w: closes.length >= 252 ? round(Math.max(...closes.slice(-252))) : null,
    prior20High: data.bars.length >= 21 ? round(Math.max(...data.bars.slice(-21, -1).map((bar) => bar.high))) : null,
  };
}

function blankFinding(model: ScannerModel, state: ScannerFinding["state"], explanation: string, evidence: TechnicalEvidence): ScannerFinding {
  return { modelId: model.id, modelName: model.name, matched: false, state, explanation, evidence };
}

export function evaluateTechnicalModel(data: TechnicalDataSet, modelId: ScannerModelId): ScannerFinding {
  const model = TECHNICAL_SCANNER_MODELS.find((item) => item.id === modelId);
  if (!model) throw new Error("Bilinmeyen teknik tarama modeli.");
  const validationError = validateTechnicalDataSet(data);
  const evidence = calculateTechnicalEvidence(data);
  if (validationError) return blankFinding(model, "INVALID_SOURCE", validationError, evidence);
  if (data.bars.length < model.minimumBars) return blankFinding(model, "INSUFFICIENT_DATA", `Bu model için en az ${model.minimumBars} tarihli OHLCV barı gerekir.`, evidence);

  const closes = data.bars.map((bar) => bar.close);
  const latest = closes.at(-1) ?? 0;
  const previousSma10 = simpleMovingAverage(closes, 10, 1);
  const previousSma50 = simpleMovingAverage(closes, 50, 1);
  const currentSma10 = evidence.sma10;
  const currentSma50 = evidence.sma50;
  const currentMacd = macdSeries(closes);
  const latestWidth = bollingerWidth(closes);
  const widths = Array.from({ length: Math.min(20, closes.length - 19) }, (_, index) => bollingerWidth(closes, 20, index)).filter((value): value is number => value !== null);
  const squeezeCutoff = [...widths].sort((a, b) => a - b)[Math.max(0, Math.floor(widths.length * 0.25) - 1)] ?? null;
  const checks: Record<ScannerModelId, { matched: boolean; explanation: string }> = {
    "rsi-momentum": { matched: evidence.rsi14 !== null && evidence.rsi14 >= 55 && evidence.rsi14 <= 75, explanation: `RSI(14) ${evidence.rsi14 ?? "hesaplanamadı"}; ölçüt 55–75 aralığı.` },
    "macd-cross": { matched: currentMacd.previousMacd !== null && currentMacd.previousSignal !== null && currentMacd.macd !== null && currentMacd.signal !== null && currentMacd.previousMacd <= currentMacd.previousSignal && currentMacd.macd > currentMacd.signal, explanation: "MACD ve sinyal çizgisinin son iki bar kesişimi kontrol edildi." },
    "bollinger-squeeze": { matched: latestWidth !== null && squeezeCutoff !== null && latestWidth <= squeezeCutoff, explanation: "Bollinger bant genişliği son 20 gözlem içindeki alt çeyrekle karşılaştırıldı." },
    "volume-breakout": { matched: evidence.volumeMultiple20 !== null && evidence.volumeMultiple20 >= 2, explanation: `Güncel hacim / önceki 20 bar ortalaması: ${evidence.volumeMultiple20 ?? "hesaplanamadı"}×.` },
    "sma-10-50-cross": { matched: currentSma10 !== null && currentSma50 !== null && previousSma10 !== null && previousSma50 !== null && previousSma10 <= previousSma50 && currentSma10 > currentSma50, explanation: "SMA(10) ve SMA(50) için son iki bar kesişimi kontrol edildi." },
    "golden-cross": { matched: evidence.sma50 !== null && evidence.sma200 !== null && evidence.sma50 > evidence.sma200, explanation: "SMA(50) ile SMA(200) güncel konumu kontrol edildi; kesişim tarihi ayrıca hesaplanmaz." },
    "fifty-two-week-breakout": { matched: evidence.high52w !== null && latest >= evidence.high52w * 0.99, explanation: `Kapanış ${round(latest)}; 252 bar en yüksek ${evidence.high52w ?? "hesaplanamadı"}.` },
    "trend-regime": { matched: evidence.sma50 !== null && evidence.sma200 !== null && latest > evidence.sma50 && evidence.sma50 > evidence.sma200, explanation: "Kapanış, SMA(50) ve SMA(200) göreli trend rejimi kontrol edildi." },
    "range-breakout": { matched: evidence.prior20High !== null && latest >= evidence.prior20High && evidence.volumeMultiple20 !== null && evidence.volumeMultiple20 >= 1.2, explanation: `Kapanış ${round(latest)}; önceki 20 bar zirvesi ${evidence.prior20High ?? "hesaplanamadı"}; hacim çarpanı ${evidence.volumeMultiple20 ?? "hesaplanamadı"}.` },
  };
  const check = checks[modelId];
  return { modelId, modelName: model.name, matched: check.matched, state: check.matched ? "MATCH" : "NO_MATCH", explanation: check.explanation, evidence };
}

export function evaluateTechnicalModels(data: TechnicalDataSet, selectedModels: ScannerModelId[]) {
  return selectedModels.map((modelId) => evaluateTechnicalModel(data, modelId));
}

export function summarizeModelIntersection(findings: ScannerFinding[]) {
  const validFindings = findings.filter((finding) => finding.state === "MATCH" || finding.state === "NO_MATCH");
  const matchedModelCount = validFindings.filter((finding) => finding.matched).length;
  return {
    eligibleModelCount: validFindings.length,
    matchedModelCount,
    state: validFindings.length === 0 ? "INSUFFICIENT_DATA" as const : matchedModelCount >= 2 ? "MULTI_MODEL_MATCH" as const : matchedModelCount === 1 ? "SINGLE_MODEL_MATCH" as const : "NO_MATCH" as const,
  };
}
