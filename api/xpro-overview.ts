type Request = { method?: string };
type Response = { status: (code: number) => { json: (body: unknown) => void } };
type Candle = { timestamp: string; open: number; high: number; low: number; close: number; volume: number };

const definitions = [
  { symbol: "DEMO-ALFA", companyName: "Alfa Endüstri Demo A.Ş.", sector: "Sentetik sanayi senaryosu", basePrice: 42, drift: 0.075, volatility: 0.38, baseVolume: 1_300_000 },
  { symbol: "DEMO-BETA", companyName: "Beta Teknoloji Demo A.Ş.", sector: "Sentetik teknoloji senaryosu", basePrice: 68, drift: 0.035, volatility: 0.62, baseVolume: 920_000 },
  { symbol: "DEMO-GAMA", companyName: "Gama Tüketim Demo A.Ş.", sector: "Sentetik tüketim senaryosu", basePrice: 27, drift: -0.012, volatility: 0.44, baseVolume: 1_750_000 },
] as const;

const round = (value: number) => Math.round(value * 10) / 10;
const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const sma = (values: number[], period: number) => values.length >= period ? average(values.slice(-period)) : null;
const point = (key: string, label: string, points: number, maximumPoints: number, detail: string, direction: "BOOST" | "DRAG" | "NEUTRAL") => ({ key, label, points: round(points), maximumPoints, detail, direction });

function createCandles(definition: typeof definitions[number], observedAt: string): Candle[] {
  const endAt = new Date(observedAt);
  return Array.from({ length: 260 }, (_, index) => {
    const seasonal = Math.sin(index * 0.22 + definition.basePrice) * definition.volatility;
    const previousSeasonal = Math.sin((index - 1) * 0.22 + definition.basePrice) * definition.volatility;
    const close = Number((definition.basePrice + index * definition.drift + seasonal).toFixed(2));
    const open = Number((definition.basePrice + Math.max(index - 1, 0) * definition.drift + previousSeasonal).toFixed(2));
    const spread = 0.34 + Math.abs(Math.cos(index * 0.17)) * definition.volatility;
    const date = new Date(endAt);
    date.setUTCDate(date.getUTCDate() - (259 - index));
    return { timestamp: date.toISOString(), open, high: Number((Math.max(open, close) + spread).toFixed(2)), low: Number((Math.min(open, close) - spread).toFixed(2)), close, volume: Math.round(definition.baseVolume * (0.72 + Math.abs(Math.sin(index * 0.11)) * 0.58)) };
  });
}

function rsi(closes: number[]) {
  const changes = closes.slice(-15).slice(1).map((close, index) => close - closes.slice(-15)[index]);
  const gain = average(changes.map((change) => Math.max(change, 0)));
  const loss = average(changes.map((change) => Math.max(-change, 0)));
  return loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
}

function score(candles: Candle[]) {
  const closes = candles.map((candle) => candle.close);
  const volumes = candles.map((candle) => candle.volume);
  const close = closes[closes.length - 1]!;
  const sma20 = sma(closes, 20)!;
  const sma50 = sma(closes, 50)!;
  const sma200 = sma(closes, 200)!;
  const rsi14 = rsi(closes);
  const relativeVolume = volumes[volumes.length - 1]! / sma(volumes, 20)!;
  const momentum20 = close / closes[closes.length - 21]! - 1;
  const high252 = Math.max(...closes.slice(-252));
  const distanceToHigh = 1 - close / high252;
  const atr = average(candles.slice(-14).map((candle, index) => { const prior = candles[candles.length - 15 + index]?.close ?? candle.close; return Math.max(candle.high - candle.low, Math.abs(candle.high - prior), Math.abs(candle.low - prior)); })) / close * 100;
  const trend = close > sma20 && sma20 > sma50 && sma50 > sma200 ? 15 : close > sma50 ? 9 : 3;
  const momentum = rsi14 >= 55 && rsi14 <= 72 && momentum20 > 0 ? 15 : rsi14 >= 45 && momentum20 > -0.03 ? 8 : 2;
  const volume = relativeVolume >= 1.5 ? 15 : relativeVolume >= 1 ? 9 : 3;
  const financial = 15, growth = 10, valuation = 10, story = 0;
  const volatilityRisk = atr <= 2.2 ? 2 : atr <= 4.5 ? 10 : 20;
  const liquidityRisk = relativeVolume >= 0.8 ? 1 : 10;
  const floatRisk = 2, debtRisk = 2, valuationRisk = 1, anomalyRisk = relativeVolume <= 3 ? 1 : 8;
  const riskScore = round(Math.min(100, volatilityRisk + liquidityRisk + floatRisk + debtRisk + valuationRisk + anomalyRisk));
  const riskAdjustment = round(10 - riskScore / 10);
  const qualityScore = round(Math.min(100, trend + momentum + volume + financial + growth + valuation + story + riskAdjustment));
  const volumeAcceleration = relativeVolume >= 1.5 ? 15 : relativeVolume >= 1 ? 8 : 2;
  const momentumAcceleration = momentum20 >= 0.08 ? 15 : momentum20 >= 0.02 ? 9 : 2;
  const trendTurn = close > sma20 && sma20 > sma50 ? 15 : close > sma20 ? 7 : 1;
  const breakout = distanceToHigh <= 0.03 ? 15 : distanceToHigh <= 0.1 ? 9 : 3;
  const highContext = distanceToHigh >= 0.02 && distanceToHigh <= 0.2 ? 10 : 4;
  const rsiPosition = rsi14 >= 55 && rsi14 <= 70 ? 10 : 3;
  const volatility = atr <= 3.5 ? 10 : 4;
  const priceVolume = momentum20 > 0 && relativeVolume >= 1 ? 10 : 2;
  const earlyScore = round(Math.min(100, volumeAcceleration + momentumAcceleration + trendTurn + breakout + highContext + rsiPosition + volatility + priceVolume));
  const opportunityScore = round(Math.min(100, qualityScore * 0.45 + earlyScore * 0.45 + (100 - riskScore) * 0.1));
  return {
    qualityScore, earlyScore, opportunityScore, riskScore,
    riskLevel: riskScore <= 25 ? "DÜŞÜK" : riskScore <= 50 ? "ORTA" : riskScore <= 75 ? "YÜKSEK" : "ÇOK YÜKSEK",
    isEarlyCandidate: qualityScore >= 70 && earlyScore >= 70 && riskScore < 60,
    indicators: { close, sma20, sma50, sma200, rsi14, relativeVolume, atrPercent: atr, momentum20Percent: momentum20 * 100, distanceTo52WeekHighPercent: distanceToHigh * 100 },
    qualityFactors: [point("trend", "Trend", trend, 15, "Kapanış ile SMA20/SMA50/SMA200 ilişkisi.", trend >= 10 ? "BOOST" : "DRAG"), point("momentum", "Momentum", momentum, 15, `RSI(14) ${round(rsi14)}; 20 bar momentum ${round(momentum20 * 100)}%.`, momentum >= 10 ? "BOOST" : "DRAG"), point("volume", "Hacim", volume, 15, `Göreli hacim ${round(relativeVolume)}x.`, volume >= 10 ? "BOOST" : "DRAG"), point("financial", "Finansal kalite", financial, 15, "Sentetik demo metrikleri.", "NEUTRAL"), point("growth", "Büyüme", growth, 10, "Sentetik demo metrikleri.", "NEUTRAL"), point("valuation", "Değerleme", valuation, 10, "Sentetik demo metrikleri.", "NEUTRAL"), point("kap", "KAP / öykü", story, 10, "Demo olayları puana katkı yapmaz.", "NEUTRAL"), point("risk-adjustment", "Risk ayarlaması", riskAdjustment, 10, `Risk skoru ${riskScore}/100.`, riskAdjustment >= 6 ? "BOOST" : "DRAG")],
    earlyFactors: [point("volume-acceleration", "Hacim ivmesi", volumeAcceleration, 15, `Göreli hacim ${round(relativeVolume)}x.`, volumeAcceleration >= 10 ? "BOOST" : "DRAG"), point("momentum-acceleration", "Momentum ivmesi", momentumAcceleration, 15, `20 bar momentum ${round(momentum20 * 100)}%.`, momentumAcceleration >= 10 ? "BOOST" : "DRAG"), point("trend-turn", "Trend dönüşü", trendTurn, 15, "Kapanış ile kısa/orta vadeli ortalama ilişkisi.", trendTurn >= 10 ? "BOOST" : "DRAG"), point("breakout", "Kırılım yakınlığı", breakout, 15, `252 bar zirvesine mesafe ${round(distanceToHigh * 100)}%.`, breakout >= 10 ? "BOOST" : "DRAG"), point("high-context", "52 hafta bağlamı", highContext, 10, `252 bar zirvesine mesafe ${round(distanceToHigh * 100)}%.`, highContext >= 8 ? "BOOST" : "DRAG"), point("rsi-position", "RSI konumu", rsiPosition, 10, `RSI(14) ${round(rsi14)}.`, rsiPosition >= 8 ? "BOOST" : "DRAG"), point("volatility", "Volatilite", volatility, 10, `ATR/Close ${round(atr)}%.`, volatility >= 8 ? "BOOST" : "DRAG"), point("price-volume", "Fiyat/hacim teyidi", priceVolume, 10, `20 bar momentum ${round(momentum20 * 100)}% ve göreli hacim ${round(relativeVolume)}x.`, priceVolume >= 8 ? "BOOST" : "DRAG")],
    riskFactors: [point("volatility-risk", "Volatilite", volatilityRisk, 20, `ATR/Close ${round(atr)}%.`, volatilityRisk > 10 ? "DRAG" : "NEUTRAL"), point("liquidity-risk", "Likidite", liquidityRisk, 10, `Göreli hacim ${round(relativeVolume)}x.`, liquidityRisk > 5 ? "DRAG" : "NEUTRAL"), point("float-risk", "Fiili dolaşım", floatRisk, 10, "Fiili dolaşım demo varsayımı %28.", "NEUTRAL"), point("debt-risk", "Borç", debtRisk, 15, "Net Borç/FAVÖK demo varsayımı 0,7.", "NEUTRAL"), point("valuation-risk", "Değerleme", valuationRisk, 10, "F/K demo varsayımı 14,2.", "NEUTRAL"), point("anomaly-risk", "Hacim anomalisi", anomalyRisk, 10, `Göreli hacim ${round(relativeVolume)}x.`, anomalyRisk > 5 ? "DRAG" : "NEUTRAL")],
    blockers: [],
  };
}

export function getXProOverview(env: Record<string, string | undefined> = process.env) {
  const requestedProviderId = (env.XPRO_DATA_PROVIDER ?? "mock").trim().toLowerCase();
  const supportedProvider = requestedProviderId === "forinvest" || requestedProviderId === "dxfeed" ? requestedProviderId : "mock";
  const provider = { id: "mock", label: "Demo Provider", state: "DEMO_ACTIVE", mode: "DEMO", detail: "DEMO / SENTETİK — CANLI VERİ BAĞLI DEĞİL. Demo kayıtları gerçek BIST fiyatı veya KAP olayı değildir." };
  const observedAt = "2026-01-02T12:00:00.000Z";
  return {
    provider,
    requestedProviderId: supportedProvider,
    fallbackApplied: supportedProvider !== "mock",
    generatedAt: observedAt,
    dataQualityScore: 0,
    qualityIssues: ["DEMO / SENTETİK — CANLI VERİ BAĞLI DEĞİL.", "Gerçek BIST fiyatı, hacmi veya KAP olayı değildir; yatırım araştırmasında kullanılmamalıdır."],
    observations: definitions.map((definition) => {
      const candles = createCandles(definition, observedAt);
      const latest = candles[candles.length - 1]!;
      const previous = candles[candles.length - 2]!;
      return { symbol: definition.symbol, companyName: definition.companyName, sector: definition.sector, dataMode: "DEMO", sourceLabel: "Gümüş Avcısı Demo Provider · sentetik", sourceUrl: null, observedAt, price: latest.close, changePercent: Number(((latest.close / previous.close - 1) * 100).toFixed(2)), volume: latest.volume, candles, metrics: { marketCap: definition.basePrice * 1_000_000, freeFloatPercent: 28, pe: 14.2, pb: 2.1, evEbitda: 7.8, revenueGrowthPercent: 18, ebitdaGrowthPercent: 14, netProfitGrowthPercent: 11, roePercent: 21, roicPercent: 18, netDebtToEbitda: 0.7, freeCashFlow: 1_200_000 }, kapEvents: [{ id: `${definition.symbol}-DEMO-EVENT-01`, publishedAt: observedAt, category: "UNKNOWN", subject: "DEMO OLAYI — gerçek KAP bildirimi değildir.", sourceUrl: null, dataMode: "DEMO" }], scores: score(candles) };
    }),
  };
}

export default async function handler(request: Request, response: Response) {
  if (request.method !== "GET") return response.status(405).json({ error: "method not allowed" });
  return response.status(200).json(getXProOverview());
}
