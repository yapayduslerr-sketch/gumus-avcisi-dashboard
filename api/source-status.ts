import { getSourceStatuses, refreshSourceStatuses } from "../server/dataPipeline";

export default async function handler(request: { method?: string }, response: { status: (code: number) => { json: (body: unknown) => void } }) {
  if (request.method !== "GET") {
    return response.status(405).json({ error: "method not allowed" });
  }

  try {
    const existing = await getSourceStatuses();
    const hasRecordedAttempt = existing.some((source) => source.lastAttemptAt);
    const sources = hasRecordedAttempt ? existing : await refreshSourceStatuses();
    return response.status(200).json({ updatedAt: new Date().toISOString(), sources });
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}
