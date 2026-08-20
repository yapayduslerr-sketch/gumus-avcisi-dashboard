import { describe, expect, it } from "vitest";
import handler, { getXProProviderStatus } from "../api/xpro-provider-status";

async function call(method = "GET") {
  let statusCode = 0;
  let body: unknown;
  await handler({ method }, { status: (code) => { statusCode = code; return { json: (payload) => { body = payload; } }; } });
  return { statusCode, body: body as Record<string, unknown> };
}

describe("X Pro provider durum endpointi", () => {
  it("anahtarları ifşa etmeden demo ile eksik canlı providerları ayırır", () => {
    const status = getXProProviderStatus({ XPRO_DATA_PROVIDER: "forinvest" });
    expect(status.activeProviderId).toBe("forinvest");
    expect(status.fallbackToDemo).toBe(true);
    expect(status.providers).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "mock", state: "DEMO_ACTIVE" }),
      expect.objectContaining({ id: "forinvest", state: "CONFIG_REQUIRED", missingVariables: expect.arrayContaining(["FORINVEST_API_KEY"]) }),
    ]));
    expect(JSON.stringify(status)).not.toContain("secret-value");
  });

  it("tam canlı yapılandırmayı yalnızca hazır olarak bildirir; veri üretmez", () => {
    const status = getXProProviderStatus({ XPRO_DATA_PROVIDER: "dxfeed", DXFEED_API_BASE_URL: "https://api.example.test", DXFEED_API_KEY: "secret-value", DXFEED_AUTH_HEADER_NAME: "Authorization" });
    const dxfeed = status.providers.find((provider) => provider.id === "dxfeed");
    expect(status.fallbackToDemo).toBe(false);
    expect(dxfeed).toMatchObject({ state: "CONFIGURED", credentialsReady: true });
    expect(JSON.stringify(status)).not.toContain("secret-value");
  });

  it("GET dışındaki istekleri reddeder", async () => {
    const result = await call("POST");
    expect(result.statusCode).toBe(405);
    expect(result.body).toMatchObject({ error: "Method not allowed" });
  });
});
