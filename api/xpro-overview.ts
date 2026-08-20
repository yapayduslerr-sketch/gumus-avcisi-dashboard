import { createXProDemoSnapshot } from "../server/xproMockProvider";
import { getXProProviderRegistry } from "../server/xproProviderRegistry";
import { scoreXProObservation } from "../shared/xproScoring";

type Request = { method?: string };
type Response = { status: (code: number) => { json: (body: unknown) => void } };

export default async function handler(request: Request, response: Response) {
  if (request.method !== "GET") return response.status(405).json({ error: "method not allowed" });
  const registry = getXProProviderRegistry(process.env);
  const snapshot = createXProDemoSnapshot();
  const observations = snapshot.observations.map((observation) => {
    const latest = observation.candles.at(-1)!;
    const previous = observation.candles.at(-2)!;
    const scores = scoreXProObservation(observation);
    return {
      symbol: observation.symbol,
      companyName: observation.companyName,
      sector: observation.sector,
      dataMode: observation.dataMode,
      sourceLabel: observation.sourceLabel,
      sourceUrl: observation.sourceUrl,
      observedAt: observation.observedAt,
      price: latest.close,
      changePercent: Number(((latest.close / previous.close - 1) * 100).toFixed(2)),
      volume: latest.volume,
      candles: observation.candles,
      metrics: observation.metrics,
      kapEvents: observation.kapEvents,
      scores,
    };
  });
  return response.status(200).json({
    provider: registry.activeProvider,
    requestedProviderId: registry.requestedProviderId,
    fallbackApplied: registry.fallbackApplied,
    generatedAt: snapshot.generatedAt,
    dataQualityScore: snapshot.dataQualityScore,
    qualityIssues: snapshot.qualityIssues,
    observations,
  });
}
