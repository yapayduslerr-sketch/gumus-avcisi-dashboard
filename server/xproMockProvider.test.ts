import { describe, expect, it } from "vitest";
import { createXProDemoSnapshot } from "./xproMockProvider";

describe("X Pro demo provider", () => {
  it("canlı BIST iddiası taşımayan açık sentetik bir snapshot üretir", () => {
    const snapshot = createXProDemoSnapshot();
    expect(snapshot.provider).toMatchObject({ id: "mock", mode: "DEMO", state: "DEMO_ACTIVE" });
    expect(snapshot.qualityIssues.join(" ")).toContain("CANLI VERİ BAĞLI DEĞİL");
    expect(snapshot.observations.map((item) => item.symbol)).toEqual(["DEMO-ALFA", "DEMO-BETA", "DEMO-GAMA"]);
  });

  it("teknik model altyapısı için kronolojik, geçerli OHLC ve 252 bardan uzun sentetik tarihçe sağlar", () => {
    const observation = createXProDemoSnapshot().observations[0];
    expect(observation?.candles).toHaveLength(260);
    expect(observation?.candles.every((bar, index, bars) => bar.low <= Math.min(bar.open, bar.close) && bar.high >= Math.max(bar.open, bar.close) && (index === 0 || bar.timestamp > bars[index - 1].timestamp))).toBe(true);
  });

  it("demo KAP olayını gerçek kaynak URL’si olmadan ve açık demo ayrımıyla verir", () => {
    const event = createXProDemoSnapshot().observations[0]?.kapEvents[0];
    expect(event).toMatchObject({ dataMode: "DEMO", sourceUrl: null });
    expect(event?.subject).toContain("gerçek KAP bildirimi değildir");
  });
});
