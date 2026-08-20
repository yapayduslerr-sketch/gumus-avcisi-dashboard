import { fetchMultiAssetQuotes } from "../server/multiAssetAdapter";

type Request = { method?: string };
type Response = { status: (code: number) => { json: (body: unknown) => void } };

export default async function handler(request: Request, response: Response) {
  if (request.method !== "GET") return response.status(405).json({ error: "method not allowed" });
  const result = await fetchMultiAssetQuotes();
  return response.status(200).json(result);
}
