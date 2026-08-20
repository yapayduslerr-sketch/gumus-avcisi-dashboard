import { TECHNICAL_SCANNER_MODELS, type ScannerModelId } from "./technicalScanner";

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function buildScannerSchemaCsv(selectedModels: ScannerModelId[], generatedAt = new Date().toISOString()) {
  const header = ["record_type", "generated_at", "model_id", "model_name", "parameters", "default_timeframe", "minimum_bars", "result_contract"];
  const rows = selectedModels.map((modelId) => {
    const model = TECHNICAL_SCANNER_MODELS.find((item) => item.id === modelId);
    if (!model) return null;
    return ["MODEL_CONFIGURATION", generatedAt, model.id, model.name, model.parameters, model.defaultTimeframe, model.minimumBars, "symbol, source_url, observed_at, bar_close_at, delay_minutes, state, matched, evidence"];
  }).filter((row): row is (string | number)[] => row !== null);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export function downloadScannerSchema(selectedModels: ScannerModelId[]) {
  const csv = buildScannerSchemaCsv(selectedModels);
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "gumus-avcisi-teknik-tarama-semasi.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}
