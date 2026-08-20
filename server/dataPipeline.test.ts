import { describe, expect, it } from "vitest";
import { getSourceStatuses } from "./dataPipeline";

describe("source status contract", () => {
  it("exposes explicit BIST and KAP source states without inventing market values", async () => {
    const statuses = await getSourceStatuses();
    const bist = statuses.find((source) => source.sourceKey === "BIST_PUBLIC");
    const kap = statuses.find((source) => source.sourceKey === "KAP_PUBLIC");

    expect(bist?.sourceUrl).toContain("borsaistanbul.com");
    expect(["DELAYED", "STALE", "ERROR"]).toContain(bist?.status);
    expect(kap?.status).toBe("PENDING_API");
    expect(kap?.lastSuccessAt).toBeNull();
  });
});
