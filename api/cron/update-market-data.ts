import { refreshSourceStatuses } from "../../server/dataPipeline";

export default async function handler(request: { method?: string; headers: Record<string, string | string[] | undefined> }, response: { status: (code: number) => { json: (body: unknown) => void } }) {
  if (request.method !== "GET") {
    return response.status(405).json({ error: "method not allowed" });
  }

  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.authorization;
  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return response.status(401).json({ error: "unauthorized cron request" });
  }

  try {
    const sources = await refreshSourceStatuses();
    return response.status(200).json({ ok: true, updatedAt: new Date().toISOString(), sources });
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : String(error), timestamp: new Date().toISOString() });
  }
}
