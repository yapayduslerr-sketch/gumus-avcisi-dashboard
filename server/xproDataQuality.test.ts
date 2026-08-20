import { describe, expect, it } from "vitest";
import { createXProDemoSnapshot } from "./xproMockProvider";
import { evaluateXProDataQuality } from "../shared/xproDataQuality";

describe("X Pro veri kalitesi", () => {
  it("demo kaydını canlı kalite puanı üretmeden açıkça ayırır", () => {
    const observation = createXProDemoSnapshot().observations[0]!;
    expect(evaluateXProDataQuality(observation).state).toBe("NOT_APPLICABLE");
  });

  it("canlı kayıtta tekrar mum, imkânsız OHLC, negatif hacim ve sembol uyumsuzluğunu reddeder", () => {
    const observation = createXProDemoSnapshot().observations[0]!;
    const live = { ...observation, dataMode: "LIVE" as const, observedAt: "2026-01-02T12:00:00.000Z", candles: [...observation.candles.slice(-2), { ...observation.candles.at(-1)!, low: 999, high: 1, volume: -1 }] };
    const quality = evaluateXProDataQuality(live, { expectedSymbol: "DEMO-BETA", now: "2026-01-02T12:05:00.000Z" });
    expect(quality.state).toBe("REJECTED");
    expect(quality.issues.join(" ")).toContain("Sembol");
    expect(quality.issues.join(" ")).toContain("Negatif");
    expect(quality.issues.join(" ")).toContain("İmkânsız");
  });
});
