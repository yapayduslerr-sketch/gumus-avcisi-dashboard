import { describe, expect, it } from "vitest";
import handler, { getXProOverview } from "../api/xpro-overview";

async function call(method = "GET") {
  let statusCode = 0;
  let body: unknown;
  await handler({ method }, { status: (code) => { statusCode = code; return { json: (payload) => { body = payload; } }; } });
  return { statusCode, body: body as Record<string, unknown> };
}

describe("X Pro overview endpoint", () => {
  it("anahtar olmadan açık demo provider ve sentetik gözlemler döndürür", async () => {
    const result = await call();
    expect(result.statusCode).toBe(200);
    expect(result.body.provider).toMatchObject({ id: "mock", state: "DEMO_ACTIVE", mode: "DEMO" });
    expect(result.body.qualityIssues).toEqual(expect.arrayContaining([expect.stringContaining("SENTETİK")]));
    expect(result.body.observations).toEqual(expect.arrayContaining([expect.objectContaining({ symbol: "DEMO-ALFA", dataMode: "DEMO" })]));
  });

  it("serverless bağımsız overview üreticisinde canlı provider seçimi demo geri dönüşüne düşer", () => {
    const result = getXProOverview({ XPRO_DATA_PROVIDER: "dxfeed" });
    expect(result.fallbackApplied).toBe(true);
    expect(result.observations).toHaveLength(3);
  });

  it("GET dışındaki yöntemleri reddeder", async () => {
    const result = await call("POST");
    expect(result.statusCode).toBe(405);
  });
});
