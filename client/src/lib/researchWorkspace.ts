export type WorkspaceLens = "Kalite 100" | "Bebek V2" | "Proje";

export type WorkspaceRecord = {
  key: string;
  code: string;
  lens: WorkspaceLens;
  label: string;
  thesis: string;
};

export function filterWorkspaceRecords<T extends WorkspaceRecord>(records: T[], lens: WorkspaceLens | "Tümü", query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");
  return records.filter((record) => {
    const lensMatches = lens === "Tümü" || record.lens === lens;
    const textMatches = !normalizedQuery || `${record.code} ${record.label} ${record.thesis}`.toLocaleLowerCase("tr-TR").includes(normalizedQuery);
    return lensMatches && textMatches;
  });
}

export function resolveSelectedWorkspaceRecord<T extends WorkspaceRecord>(records: T[], selectedKey: string | null) {
  return records.find((record) => record.key === selectedKey) ?? records[0] ?? null;
}

export function technicalRunMessage(input: { selectedModelCount: number; symbolQuery: string; liveOhlcvReady: boolean }) {
  const symbol = input.symbolQuery.trim().toLocaleUpperCase("tr-TR");
  if (!input.selectedModelCount) return { tone: "warning" as const, title: "Model seçilmedi", detail: "Tarama için en az bir teknik model seçin." };
  if (!input.liveOhlcvReady) return {
    tone: "blocked" as const,
    title: "Tarama isteği kaydedildi; kaynak erişimi bekleniyor",
    detail: symbol
      ? `${symbol} için seçili modeller hazır. Tarihli BIST OHLCV kaynağı bağlı olmadığı için eşleşme, fiyat veya sinyal üretilmedi.`
      : "Seçili modeller hazır. Tarihli BIST OHLCV evreni bağlı olmadığı için eşleşme, fiyat veya sinyal üretilmedi.",
  };
  return { tone: "ready" as const, title: "Tarama çalıştırılabilir", detail: symbol ? `${symbol} için seçili modeller kaynaklı OHLCV üzerinde hesaplanacaktır.` : "Seçili modeller kaynaklı OHLCV evreninde hesaplanacaktır." };
}
