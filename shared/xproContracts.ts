export type XProProviderId = "mock" | "forinvest" | "dxfeed";

export type XProDataMode = "DEMO" | "LIVE";

export type XProProviderState = "DEMO_ACTIVE" | "READY" | "LICENSE_REQUIRED" | "CONFIG_REQUIRED" | "ERROR";

export type XProProviderStatus = {
  id: XProProviderId;
  label: string;
  state: XProProviderState;
  mode: XProDataMode;
  detail: string;
  requiredEnv: string[];
  missingEnv: string[];
  checkedAt: string;
};

export type XProCandle = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjusted: boolean | null;
};

export type XProKapEvent = {
  id: string;
  publishedAt: string;
  category: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "UNKNOWN";
  subject: string;
  sourceUrl: string | null;
  dataMode: XProDataMode;
};

export type XProSymbolObservation = {
  symbol: string;
  companyName: string;
  sector: string;
  dataMode: XProDataMode;
  sourceLabel: string;
  sourceUrl: string | null;
  observedAt: string;
  delayMinutes: number | null;
  candles: XProCandle[];
  metrics: {
    marketCap: number | null;
    freeFloatPercent: number | null;
    pe: number | null;
    pb: number | null;
    evEbitda: number | null;
    revenueGrowthPercent: number | null;
    ebitdaGrowthPercent: number | null;
    netProfitGrowthPercent: number | null;
    roePercent: number | null;
    roicPercent: number | null;
    netDebtToEbitda: number | null;
    freeCashFlow: number | null;
  };
  kapEvents: XProKapEvent[];
};

export type XProSnapshot = {
  provider: XProProviderStatus;
  generatedAt: string;
  observations: XProSymbolObservation[];
  dataQualityScore: number;
  qualityIssues: string[];
};

export type XProScoreFactor = {
  key: string;
  label: string;
  points: number;
  maximumPoints: number;
  detail: string;
  direction: "BOOST" | "DRAG" | "NEUTRAL";
};

export type XProScoreProfile = {
  qualityScore: number | null;
  earlyScore: number | null;
  opportunityScore: number | null;
  riskScore: number | null;
  riskLevel: "DÜŞÜK" | "ORTA" | "YÜKSEK" | "ÇOK YÜKSEK" | "VERİ EKSİK";
  isEarlyCandidate: boolean;
  qualityFactors: XProScoreFactor[];
  earlyFactors: XProScoreFactor[];
  riskFactors: XProScoreFactor[];
  blockers: string[];
  indicators: {
    close: number | null;
    sma20: number | null;
    sma50: number | null;
    sma200: number | null;
    rsi14: number | null;
    relativeVolume: number | null;
    atrPercent: number | null;
    momentum20Percent: number | null;
    distanceTo52WeekHighPercent: number | null;
  };
};

export type XProDataQuality = {
  score: number;
  state: "READY" | "WARNING" | "REJECTED" | "NOT_APPLICABLE";
  issues: string[];
  checkedAt: string;
};
