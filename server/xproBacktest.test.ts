import { describe, expect, it } from "vitest";
import { createXProDemoSnapshot } from "./xproMockProvider";
import { createXProValidationRecord, summarizeXProBacktest } from "../shared/xproBacktest";

describe("X Pro backtest sözleşmesi", () => {
  it("demo verisinde performans veya başarı sonucu üretmez", () => {
    const observation = createXProDemoSnapshot().observations[0]!;
    const record = createXProValidationRecord(observation.symbol, "DEMO", observation.candles, 100);
    expect(record.status).toBe("NOT_AVAILABLE");
    expect(record.return20d).toBeNull();
  });

  it("yeterli canlı tarihçede forward alanlarını hesaplamaya hazırdır", () => {
    const observation = createXProDemoSnapshot().observations[0]!;
    const record = createXProValidationRecord(observation.symbol, "LIVE", observation.candles, 10, observation.candles);
    expect(record).toMatchObject({ status: "READY", entryPrice: expect.any(Number), return20d: expect.any(Number) });
    expect(summarizeXProBacktest([record]).status).toBe("READY");
  });
});
