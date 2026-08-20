import type { XProScoreFactor, XProScoreProfile, XProSymbolObservation } from "./xproContracts";

const clamp = (value: number, lower = 0, upper = 100) => Math.max(lower, Math.min(upper, value));
const round = (value: number) => Math.round(value * 10) / 10;
const factor = (key: string, label: string, points: number, maximumPoints: number, detail: string, direction: XProScoreFactor["direction"]): XProScoreFactor => ({ key, label, points: round(points), maximumPoints, detail, direction });

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sma(values: number[], period: number) {
  if (values.length < period) return null;
  return average(values.slice(-period));
}

function rsi(values: number[], period = 14) {
  if (values.length < period + 1) return null;
  const changes = values.slice(-(period + 1)).slice(1).map((value, index) => value - values.slice(-(period + 1))[index]);
  const gains = changes.map((change) => Math.max(change, 0));
  const losses = changes.map((change) => Math.max(-change, 0));
  const avgGain = average(gains);
  const avgLoss = average(losses);
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function atrPercent(observation: XProSymbolObservation) {
  const candles = observation.candles;
  if (candles.length < 15) return null;
  const ranges = candles.slice(-14).map((candle, index) => {
    const previous = candles[candles.length - 15 + index]?.close ?? candle.close;
    return Math.max(candle.high - candle.low, Math.abs(candle.high - previous), Math.abs(candle.low - previous));
  });
  const close = candles.at(-1)?.close;
  return close ? average(ranges) / close * 100 : null;
}

function riskLevel(score: number | null): XProScoreProfile["riskLevel"] {
  if (score === null) return "VERİ EKSİK";
  if (score <= 25) return "DÜŞÜK";
  if (score <= 50) return "ORTA";
  if (score <= 75) return "YÜKSEK";
  return "ÇOK YÜKSEK";
}

export function scoreXProObservation(observation: XProSymbolObservation): XProScoreProfile {
  const blockers: string[] = [];
  if (observation.candles.length < 200) blockers.push("SMA200 ve 52 hafta bağlamı için en az 200 doğrulanmış bar gerekir.");
  const close = observation.candles.at(-1)?.close;
  if (!close) blockers.push("Geçerli kapanış fiyatı yok.");
  const closes = observation.candles.map((candle) => candle.close);
  const volumes = observation.candles.map((candle) => candle.volume);
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const sma200 = sma(closes, 200);
  const rsi14 = rsi(closes, 14);
  const volume20 = sma(volumes, 20);
  const relativeVolume = volume20 && volumes.at(-1) ? volumes.at(-1)! / volume20 : null;
  const momentum20 = closes.length >= 21 && close ? close / closes.at(-21)! - 1 : null;
  const highest252 = closes.length >= 252 ? Math.max(...closes.slice(-252)) : null;
  const distanceToHigh = highest252 && close ? 1 - close / highest252 : null;
  const atr = atrPercent(observation);

  const indicators = {
    close: close ?? null,
    sma20,
    sma50,
    sma200,
    rsi14,
    relativeVolume,
    atrPercent: atr,
    momentum20Percent: momentum20 === null ? null : momentum20 * 100,
    distanceTo52WeekHighPercent: distanceToHigh === null ? null : distanceToHigh * 100,
  };
  if (blockers.length) return { qualityScore: null, earlyScore: null, opportunityScore: null, riskScore: null, riskLevel: "VERİ EKSİK", isEarlyCandidate: false, qualityFactors: [], earlyFactors: [], riskFactors: [], blockers, indicators };

  const trend = close! > sma20! && sma20! > sma50! && sma50! > sma200! ? 15 : close! > sma50! ? 9 : 3;
  const momentum = rsi14! >= 55 && rsi14! <= 72 && momentum20! > 0 ? 15 : rsi14! >= 45 && momentum20! > -0.03 ? 8 : 2;
  const volume = relativeVolume! >= 1.5 ? 15 : relativeVolume! >= 1 ? 9 : 3;
  const metrics = observation.metrics;
  const financial = (metrics.roePercent ?? 0) >= 15 && (metrics.roicPercent ?? 0) >= 12 && (metrics.netDebtToEbitda ?? 9) <= 2 ? 15 : 6;
  const growth = (metrics.revenueGrowthPercent ?? 0) >= 15 && (metrics.ebitdaGrowthPercent ?? 0) >= 10 && (metrics.netProfitGrowthPercent ?? 0) >= 8 ? 10 : 4;
  const valuation = (metrics.pe ?? 99) <= 18 && (metrics.evEbitda ?? 99) <= 10 ? 10 : 4;
  const story = observation.kapEvents.some((event) => event.category === "POSITIVE") ? 10 : 0;
  const volatilityRisk = atr! <= 2.2 ? 2 : atr! <= 4.5 ? 10 : 20;
  const liquidityRisk = relativeVolume! >= 0.8 ? 1 : 10;
  const floatRisk = (metrics.freeFloatPercent ?? 0) >= 20 ? 2 : 10;
  const debtRisk = (metrics.netDebtToEbitda ?? 9) <= 2 ? 2 : 15;
  const valuationRisk = (metrics.pe ?? 99) <= 25 ? 1 : 10;
  const anomalyRisk = relativeVolume! <= 3 ? 1 : 8;
  const riskScore = round(clamp(volatilityRisk + liquidityRisk + floatRisk + debtRisk + valuationRisk + anomalyRisk));
  const riskAdjustment = round(10 - riskScore / 10);
  const qualityScore = round(clamp(trend + momentum + volume + financial + growth + valuation + story + riskAdjustment));

  const volumeAcceleration = relativeVolume! >= 1.5 ? 15 : relativeVolume! >= 1 ? 8 : 2;
  const momentumAcceleration = momentum20! >= 0.08 ? 15 : momentum20! >= 0.02 ? 9 : 2;
  const trendTurn = close! > sma20! && sma20! > sma50! ? 15 : close! > sma20! ? 7 : 1;
  const breakout = distanceToHigh! <= 0.03 ? 15 : distanceToHigh! <= 0.1 ? 9 : 3;
  const highContext = distanceToHigh! >= 0.02 && distanceToHigh! <= 0.2 ? 10 : 4;
  const rsiPosition = rsi14! >= 55 && rsi14! <= 70 ? 10 : 3;
  const volatility = atr! <= 3.5 ? 10 : 4;
  const priceVolume = momentum20! > 0 && relativeVolume! >= 1 ? 10 : 2;
  const earlyScore = round(clamp(volumeAcceleration + momentumAcceleration + trendTurn + breakout + highContext + rsiPosition + volatility + priceVolume));
  const opportunityScore = round(clamp(qualityScore * 0.45 + earlyScore * 0.45 + (100 - riskScore) * 0.1));
  const isEarlyCandidate = qualityScore >= 70 && earlyScore >= 70 && riskScore < 60;

  return {
    qualityScore,
    earlyScore,
    opportunityScore,
    riskScore,
    riskLevel: riskLevel(riskScore),
    isEarlyCandidate,
    qualityFactors: [
      factor("trend", "Trend", trend, 15, `Kapanış ${round(close!)}; SMA20/SMA50/SMA200 ilişkisi.`, trend >= 10 ? "BOOST" : "DRAG"),
      factor("momentum", "Momentum", momentum, 15, `RSI(14) ${round(rsi14!)}; 20 bar momentum ${round(momentum20! * 100)}%.`, momentum >= 10 ? "BOOST" : "DRAG"),
      factor("volume", "Hacim", volume, 15, `Göreli hacim ${round(relativeVolume!)}x.`, volume >= 10 ? "BOOST" : "DRAG"),
      factor("financial", "Finansal kalite", financial, 15, "ROE, ROIC ve Net Borç/FAVÖK birlikte değerlendirilir.", financial >= 10 ? "BOOST" : "DRAG"),
      factor("growth", "Büyüme", growth, 10, "Gelir, FAVÖK ve net kâr büyümesi değerlendirilir.", growth >= 8 ? "BOOST" : "DRAG"),
      factor("valuation", "Değerleme", valuation, 10, "F/K ve FD/FAVÖK eşikleri değerlendirilir.", valuation >= 8 ? "BOOST" : "DRAG"),
      factor("kap", "KAP / öykü", story, 10, observation.dataMode === "DEMO" ? "Demo olayları puana katkı yapmaz." : "Doğrulanmış olay sınıflaması gerekir.", "NEUTRAL"),
      factor("risk-adjustment", "Risk ayarlaması", riskAdjustment, 10, `Risk skoru ${riskScore}/100.`, riskAdjustment >= 6 ? "BOOST" : "DRAG"),
    ],
    earlyFactors: [
      factor("volume-acceleration", "Hacim ivmesi", volumeAcceleration, 15, `Göreli hacim ${round(relativeVolume!)}x.`, volumeAcceleration >= 10 ? "BOOST" : "DRAG"),
      factor("momentum-acceleration", "Momentum ivmesi", momentumAcceleration, 15, `20 bar momentum ${round(momentum20! * 100)}%.`, momentumAcceleration >= 10 ? "BOOST" : "DRAG"),
      factor("trend-turn", "Trend dönüşü", trendTurn, 15, "Kapanış ile kısa/orta vadeli ortalama ilişkisi.", trendTurn >= 10 ? "BOOST" : "DRAG"),
      factor("breakout", "Kırılım yakınlığı", breakout, 15, `252 bar zirvesine mesafe ${round(distanceToHigh! * 100)}%.`, breakout >= 10 ? "BOOST" : "DRAG"),
      factor("high-context", "52 hafta bağlamı", highContext, 10, `252 bar zirvesine mesafe ${round(distanceToHigh! * 100)}%.`, highContext >= 8 ? "BOOST" : "DRAG"),
      factor("rsi-position", "RSI konumu", rsiPosition, 10, `RSI(14) ${round(rsi14!)}.`, rsiPosition >= 8 ? "BOOST" : "DRAG"),
      factor("volatility", "Volatilite", volatility, 10, `ATR/Close ${round(atr!)}%.`, volatility >= 8 ? "BOOST" : "DRAG"),
      factor("price-volume", "Fiyat/hacim teyidi", priceVolume, 10, `20 bar momentum ${round(momentum20! * 100)}% ve göreli hacim ${round(relativeVolume!)}x.`, priceVolume >= 8 ? "BOOST" : "DRAG"),
    ],
    riskFactors: [
      factor("volatility-risk", "Volatilite", volatilityRisk, 20, `ATR/Close ${round(atr!)}%.`, volatilityRisk > 10 ? "DRAG" : "NEUTRAL"),
      factor("liquidity-risk", "Likidite", liquidityRisk, 10, `Göreli hacim ${round(relativeVolume!)}x.`, liquidityRisk > 5 ? "DRAG" : "NEUTRAL"),
      factor("float-risk", "Fiili dolaşım", floatRisk, 10, `Fiili dolaşım ${metrics.freeFloatPercent ?? "—"}%.`, floatRisk > 5 ? "DRAG" : "NEUTRAL"),
      factor("debt-risk", "Borç", debtRisk, 15, `Net Borç/FAVÖK ${metrics.netDebtToEbitda ?? "—"}.`, debtRisk > 7 ? "DRAG" : "NEUTRAL"),
      factor("valuation-risk", "Değerleme", valuationRisk, 10, `F/K ${metrics.pe ?? "—"}.`, valuationRisk > 5 ? "DRAG" : "NEUTRAL"),
      factor("anomaly-risk", "Hacim anomalisi", anomalyRisk, 10, `Göreli hacim ${round(relativeVolume!)}x.`, anomalyRisk > 5 ? "DRAG" : "NEUTRAL"),
    ],
    blockers,
    indicators,
  };
}
