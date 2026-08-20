import { describe, expect, it } from "vitest";
import { buildScannerSchemaCsv } from "./scannerExport";

describe("tarama CSV şeması", () => {
  it("seçilen modeller için parametre, zaman dilimi ve sonuç sözleşmesini içeren CSV üretir", () => {
    const csv = buildScannerSchemaCsv(["rsi-momentum", "trend-regime"], "2026-08-20T18:00:00.000Z");
    expect(csv.split("\n")).toHaveLength(3);
    expect(csv).toContain('"rsi-momentum"');
    expect(csv).toContain('"trend-regime"');
    expect(csv).toContain('"symbol, source_url, observed_at, bar_close_at, delay_minutes, state, matched, evidence"');
  });
});
