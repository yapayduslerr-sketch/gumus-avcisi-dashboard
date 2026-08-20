import { describe, expect, it, vi } from "vitest";
import { canIngestLicensedData, fetchLicensedJson, getLicensedAdapterReadiness, probeLicensedAdapter } from "./licensedAdapters";

const completeEnv = {
  KAP_API_BASE_URL: "https://kap.example", KAP_API_KEY: "secret", KAP_API_HEALTH_URL: "https://kap.example/health", KAP_API_AUTH_HEADER_NAME: "X-API-Key",
  BIST_MARKET_API_BASE_URL: "https://bist.example", BIST_MARKET_API_KEY: "secret", BIST_MARKET_API_HEALTH_URL: "https://bist.example/health", BIST_MARKET_API_AUTH_HEADER_NAME: "X-API-Key",
};

describe("lisanslı veri adapterleri", () => {
  it("anahtar veya endpoint eksikse adapteri hazır saymaz", () => {
    const status = getLicensedAdapterReadiness({ KAP_API_BASE_URL: "https://kap.example" });
    expect(status.find((item) => item.sourceKey === "KAP_REST")).toMatchObject({ ready: false, missingEnv: ["KAP_API_KEY"] });
    expect(canIngestLicensedData({})).toBe(false);
  });

  it("sağlayıcı sağlık çağrısında özel auth header kullanır ve hatayı ayırır", async () => {
    const success = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    await expect(probeLicensedAdapter("KAP_REST", completeEnv, success)).resolves.toMatchObject({ state: "READY" });
    expect(success).toHaveBeenCalledWith("https://kap.example/health", { headers: { "X-API-Key": "secret" } });
    await expect(probeLicensedAdapter("BIST_MARKET", completeEnv, vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) }))).resolves.toMatchObject({ state: "ERROR" });
  });

  it("örnek JSON çağrısını yalnızca yapılandırılmış adapter üzerinden yapar", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ symbol: "INDES" }) });
    await expect(fetchLicensedJson<{ symbol: string }>("KAP_REST", "https://kap.example/disclosures", completeEnv, fetcher)).resolves.toEqual({ symbol: "INDES" });
  });
});
