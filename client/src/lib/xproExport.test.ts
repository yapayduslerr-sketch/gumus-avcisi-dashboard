import { describe, expect, it } from "vitest";
import { buildXProResultsCsv } from "./xproExport";

describe("X Pro sonuç CSV aktarımı", () => {
  it("demo kaydını açık sentetik açıklaması ve kaynak zamanı ile dışa aktarır", () => {
    const csv = buildXProResultsCsv([{ symbol: "DEMO-ALFA", dataMode: "DEMO", sourceLabel: "Demo Provider", observedAt: "2026-01-01T00:00:00.000Z", qualityScore: 70, earlyScore: 60, riskScore: 30, opportunityScore: 65 }]);
    expect(csv).toContain("SENTETIK_DEMO_CANLI_BIST_SINYALI_DEGIL");
    expect(csv).toContain("GUMUS_AVCISI_XPRO_V1");
    expect(csv).toContain("2026-01-01T00:00:00.000Z");
  });
});
