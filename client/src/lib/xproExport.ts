export type XProExportRow = {
  symbol: string;
  dataMode: "DEMO" | "LIVE";
  sourceLabel: string;
  observedAt: string;
  qualityScore: number | null;
  earlyScore: number | null;
  riskScore: number | null;
  opportunityScore: number | null;
};

const escapeCsv = (value: string | number | null) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export function buildXProResultsCsv(rows: XProExportRow[]) {
  const header = ["data_mode", "model", "symbol", "quality_score", "early_score", "risk_score", "opportunity_score", "source_label", "observed_at", "disclaimer"];
  const body = rows.map((row) => [row.dataMode, "GUMUS_AVCISI_XPRO_V1", row.symbol, row.qualityScore, row.earlyScore, row.riskScore, row.opportunityScore, row.sourceLabel, row.observedAt, row.dataMode === "DEMO" ? "SENTETIK_DEMO_CANLI_BIST_SINYALI_DEGIL" : "KAYNAKLI_ARASTIRMA_SONUCU_YATIRIM_TAVSIYESI_DEGIL"].map(escapeCsv).join(","));
  return [header.map(escapeCsv).join(","), ...body].join("\n");
}
