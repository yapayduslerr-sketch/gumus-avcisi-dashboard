import mysql from "mysql2/promise";

export type SourceState = "DELAYED" | "PENDING_API" | "OK" | "STALE" | "ERROR";

export type SourceStatus = {
  sourceKey: string;
  label: string;
  status: SourceState;
  sourceUrl: string;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  observedAt: string | null;
  errorMessage: string | null;
};

type SourceAdapter = {
  sourceKey: string;
  label: string;
  sourceUrl: string;
  probe: () => Promise<{ ok: boolean; observedAt: string; errorMessage: string | null }>;
  resolveStatus: (probe: { ok: boolean; errorMessage: string | null }, previous?: SourceStatus) => SourceState;
  pendingMessage?: string;
};

const BIST_URL = process.env.BIST_PUBLIC_SOURCE_URL ?? "https://www.borsaistanbul.com/en/market-data";
const KAP_URL = process.env.KAP_PUBLIC_SOURCE_URL ?? "https://kap.org.tr/en/";
const KAP_PENDING_MESSAGE = "KAP REST API anahtarı bekleniyor; kamu ekranı ayrıntılı veri adapteri olarak kullanılmıyor.";

async function probe(url: string): Promise<{ ok: boolean; observedAt: string; errorMessage: string | null }> {
  const observedAt = new Date().toISOString();
  try {
    const response = await fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(12_000), headers: { "user-agent": "Gumus-Avcisi-Source-Health/1.0" } });
    return { ok: response.ok, observedAt, errorMessage: response.ok ? null : `HTTP ${response.status}` };
  } catch (error) {
    return { ok: false, observedAt, errorMessage: error instanceof Error ? error.message : String(error) };
  }
}

const adapters: SourceAdapter[] = [
  {
    sourceKey: "BIST_PUBLIC",
    label: "BIST herkese açık veri ekranı",
    sourceUrl: BIST_URL,
    probe: () => probe(BIST_URL),
    resolveStatus: ({ ok }) => ok ? "DELAYED" : "ERROR",
  },
  {
    sourceKey: "KAP_PUBLIC",
    label: "KAP kamuya açık bildirim ekranı",
    sourceUrl: KAP_URL,
    probe: async () => ({ ok: true, observedAt: new Date().toISOString(), errorMessage: null }),
    resolveStatus: () => "PENDING_API",
    pendingMessage: KAP_PENDING_MESSAGE,
  },
];

let pool: mysql.Pool | null = null;
const memoryStatuses = new Map<string, SourceStatus>();

function getPool() {
  if (!process.env.DATABASE_URL) return null;
  pool ??= mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 3, enableKeepAlive: true });
  return pool;
}

async function saveStatus(status: SourceStatus) {
  memoryStatuses.set(status.sourceKey, status);
  const database = getPool();
  if (!database) return;
  await database.execute(
    `INSERT INTO source_statuses (sourceKey, label, status, sourceUrl, lastAttemptAt, lastSuccessAt, observedAt, errorMessage)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE label=VALUES(label), status=VALUES(status), sourceUrl=VALUES(sourceUrl), lastAttemptAt=VALUES(lastAttemptAt), lastSuccessAt=VALUES(lastSuccessAt), observedAt=VALUES(observedAt), errorMessage=VALUES(errorMessage)`,
    [status.sourceKey, status.label, status.status, status.sourceUrl, status.lastAttemptAt, status.lastSuccessAt, status.observedAt, status.errorMessage],
  );
}

export async function refreshSourceStatuses() {
  const now = new Date().toISOString();
  const statuses: SourceStatus[] = [];
  for (const adapter of adapters) {
    const result = await adapter.probe();
    const previous = memoryStatuses.get(adapter.sourceKey);
    const status: SourceStatus = {
      sourceKey: adapter.sourceKey,
      label: adapter.label,
      status: adapter.resolveStatus(result, previous),
      sourceUrl: adapter.sourceUrl,
      lastAttemptAt: now,
      lastSuccessAt: result.ok && adapter.sourceKey === "BIST_PUBLIC" ? now : previous?.lastSuccessAt ?? null,
      observedAt: result.observedAt,
      errorMessage: adapter.pendingMessage ?? result.errorMessage,
    };
    await saveStatus(status);
    statuses.push(status);
  }
  return statuses;
}

export async function getSourceStatuses(): Promise<SourceStatus[]> {
  const database = getPool();
  if (database) {
    const [rows] = await database.query<mysql.RowDataPacket[]>("SELECT sourceKey, label, status, sourceUrl, lastAttemptAt, lastSuccessAt, observedAt, errorMessage FROM source_statuses ORDER BY sourceKey");
    if (rows.length) return rows as SourceStatus[];
  }
  return adapters.map((adapter) => memoryStatuses.get(adapter.sourceKey) ?? {
    sourceKey: adapter.sourceKey,
    label: adapter.label,
    status: adapter.sourceKey === "KAP_PUBLIC" ? "PENDING_API" : "STALE",
    sourceUrl: adapter.sourceUrl,
    lastAttemptAt: null,
    lastSuccessAt: null,
    observedAt: null,
    errorMessage: adapter.pendingMessage ?? null,
  });
}

export async function runScheduledUpdate() {
  return refreshSourceStatuses();
}
