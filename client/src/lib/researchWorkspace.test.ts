import { describe, expect, it } from "vitest";
import { filterWorkspaceRecords, resolveSelectedWorkspaceRecord, technicalRunMessage, type WorkspaceRecord } from "./researchWorkspace";

const records: WorkspaceRecord[] = [
  { key: "Kalite 100:ALFA", code: "ALFA", lens: "Kalite 100", label: "Arşiv notu", thesis: "Kalite notu" },
  { key: "Bebek V2:BETA", code: "BETA", lens: "Bebek V2", label: "Arşiv notu", thesis: "Büyüme notu" },
  { key: "Proje:GAMA", code: "GAMA", lens: "Proje", label: "Belge kuyruğu", thesis: "Kapasite projesi" },
];

describe("araştırma çalışma alanı", () => {
  it("mercek ve arama metniyle kartları gerçekten filtreler", () => {
    expect(filterWorkspaceRecords(records, "Bebek V2", "beta").map((record) => record.key)).toEqual(["Bebek V2:BETA"]);
    expect(filterWorkspaceRecords(records, "Proje", "kalite")).toEqual([]);
  });

  it("filtre sonrasında geçersiz seçimi ilk görünür karta taşır", () => {
    expect(resolveSelectedWorkspaceRecord(records.filter((record) => record.lens === "Proje"), "Kalite 100:ALFA")?.key).toBe("Proje:GAMA");
  });

  it("OHLCV erişimi yokken yanlışlıkla teknik sinyal üretmez", () => {
    const state = technicalRunMessage({ selectedModelCount: 2, symbolQuery: "thyao", liveOhlcvReady: false });
    expect(state.tone).toBe("blocked");
    expect(state.detail).toContain("THYAO");
    expect(state.detail).toContain("sinyal üretilmedi");
  });
});
