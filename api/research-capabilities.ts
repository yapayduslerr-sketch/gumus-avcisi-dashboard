import { probeLicensedAdapter } from "../server/licensedAdapters";

type Request = { method?: string };
type Response = { status: (code: number) => { json: (body: unknown) => void } };

export default async function handler(request: Request, response: Response) {
  if (request.method !== "GET") return response.status(405).json({ error: "method not allowed" });
  const labels = { KAP_REST: "KAP lisanslı bildirim adapteri", BIST_MARKET: "Tarihli BIST fiyat-hacim adapteri" } as const;
  const probes = await Promise.all([probeLicensedAdapter("KAP_REST"), probeLicensedAdapter("BIST_MARKET")]);
  return response.status(200).json({
    mode: "phased",
    capabilities: probes.map((probe) => ({ sourceKey: probe.sourceKey, label: labels[probe.sourceKey], state: probe.state, detail: probe.detail, checkedAt: probe.checkedAt })),
  });
}
