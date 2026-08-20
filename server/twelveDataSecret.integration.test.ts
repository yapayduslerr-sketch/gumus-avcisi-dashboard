import { describe, expect, it } from "vitest";

const apiKey = process.env.TWELVE_DATA_API_KEY;
const runSecretIntegration = process.env.RUN_SECRET_INTEGRATION_TESTS === "true";

describe("Twelve Data anahtar doğrulaması", () => {
  it.skipIf(!apiKey || !runSecretIntegration)("sunucu tarafındaki anahtarla hafif USD/TRY fiyat çağrısı yapar", async () => {
    const response = await fetch("https://api.twelvedata.com/price?symbol=USD/TRY", { headers: { Authorization: `apikey ${apiKey}` } });
    expect(response.ok).toBe(true);
    const payload = await response.json() as { price?: string | number; status?: string; message?: string };
    expect(payload.status).not.toBe("error");
    expect(Number(payload.price)).toBeGreaterThan(0);
  }, 15_000);
});
