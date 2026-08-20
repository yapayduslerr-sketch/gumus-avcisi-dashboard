import { afterEach, describe, expect, it } from "vitest";
import handler from "../api/market-context";

function responseCapture() {
  let statusCode = 0;
  let body: unknown;
  return {
    response: { status: (code: number) => ({ json: (value: unknown) => { statusCode = code; body = value; } }) },
    read: () => ({ statusCode, body }),
  };
}

describe("Vercel piyasa bağlamı fonksiyonu", () => {
  const originalApiKey = process.env.TWELVE_DATA_API_KEY;

  afterEach(() => {
    if (originalApiKey) process.env.TWELVE_DATA_API_KEY = originalApiKey;
    else delete process.env.TWELVE_DATA_API_KEY;
  });

  it("anahtar yokken veri uydurmadan LICENSE_REQUIRED döndürür", async () => {
    delete process.env.TWELVE_DATA_API_KEY;
    const capture = responseCapture();
    await handler({ method: "GET" }, capture.response);
    expect(capture.read()).toMatchObject({ statusCode: 200, body: { state: "LICENSE_REQUIRED", quotes: [], unavailableAssetKeys: [] } });
  });

  it("GET dışındaki istekleri reddeder", async () => {
    const capture = responseCapture();
    await handler({ method: "POST" }, capture.response);
    expect(capture.read()).toEqual({ statusCode: 405, body: { error: "method not allowed" } });
  });
});
