import { describe, expect, it } from "vitest";
import { getXProProviderRegistry, getXProProviderStatus } from "./xproProviderRegistry";

describe("X Pro provider kayıt sistemi", () => {
  it("anahtar olmadan açık demo provider ile güvenli biçimde çalışır", () => {
    const registry = getXProProviderRegistry({ XPRO_DATA_PROVIDER: "forinvest" });
    expect(registry.requestedProviderId).toBe("forinvest");
    expect(registry.activeProvider).toMatchObject({ id: "mock", state: "DEMO_ACTIVE", mode: "DEMO" });
    expect(registry.fallbackApplied).toBe(true);
  });

  it("demo providerin canlı BIST verisi iddiası taşımadığını açıkça bildirir", () => {
    const status = getXProProviderStatus("mock", {});
    expect(status.detail).toContain("SENTETİK");
    expect(status.detail).toContain("CANLI VERİ BAĞLI DEĞİL");
  });

  it("sağlayıcı anahtarını istemciye değil yalnızca gerekli çevre değişkenleri listesine bağlar", () => {
    const status = getXProProviderStatus("dxfeed", {});
    expect(status.state).toBe("LICENSE_REQUIRED");
    expect(status.missingEnv).toEqual(["DXFEED_API_BASE_URL", "DXFEED_API_KEY", "DXFEED_AUTH_HEADER_NAME"]);
  });
});
