type ProviderId = "mock" | "forinvest" | "dxfeed";

type Environment = Record<string, string | undefined>;

type ProviderStatus = {
  id: ProviderId;
  label: string;
  mode: "DEMO" | "LIVE";
  active: boolean;
  state: "DEMO_ACTIVE" | "CONFIG_REQUIRED" | "CONFIGURED";
  detail: string;
  requiredVariables: string[];
  missingVariables: string[];
  credentialsReady: boolean;
};

const liveProviderSpec: Record<Exclude<ProviderId, "mock">, { label: string; variables: string[] }> = {
  forinvest: {
    label: "Forinvest",
    variables: ["FORINVEST_API_BASE_URL", "FORINVEST_API_KEY", "FORINVEST_AUTH_HEADER_NAME"],
  },
  dxfeed: {
    label: "dxFeed",
    variables: ["DXFEED_API_BASE_URL", "DXFEED_API_KEY", "DXFEED_AUTH_HEADER_NAME"],
  },
};

function normalizeProvider(value: string | undefined): ProviderId {
  return value === "forinvest" || value === "dxfeed" ? value : "mock";
}

function hasValue(value: string | undefined) {
  return Boolean(value?.trim());
}

export function getXProProviderStatus(environment: Environment = process.env): { activeProviderId: ProviderId; fallbackToDemo: boolean; providers: ProviderStatus[]; checkedAt: string; safetyNote: string } {
  const requestedProviderId = normalizeProvider(environment.XPRO_DATA_PROVIDER);
  const providers: ProviderStatus[] = [{
    id: "mock",
    label: "Demo Provider",
    mode: "DEMO",
    active: requestedProviderId === "mock",
    state: "DEMO_ACTIVE",
    detail: "Sentetik sandbox aktiftir; gerçek BIST fiyatı, hacmi veya KAP bildirimi üretmez.",
    requiredVariables: [],
    missingVariables: [],
    credentialsReady: true,
  }];

  (Object.keys(liveProviderSpec) as Exclude<ProviderId, "mock">[]).forEach((id) => {
    const spec = liveProviderSpec[id];
    const missingVariables = spec.variables.filter((key) => !hasValue(environment[key]));
    const credentialsReady = missingVariables.length === 0;
    providers.push({
      id,
      label: spec.label,
      mode: "LIVE",
      active: requestedProviderId === id,
      state: credentialsReady ? "CONFIGURED" : "CONFIG_REQUIRED",
      detail: credentialsReady
        ? "Sunucu yapılandırması bulundu. Canlı veri ancak sözleşmedeki gecikme, sembol kapsamı ve webde gösterim hakkı doğrulandıktan sonra etkinleştirilir."
        : "Gerekli sunucu ortam değişkenleri eksik. Sistem canlı fiyat üretmez ve demo moda geri döner.",
      requiredVariables: spec.variables,
      missingVariables,
      credentialsReady,
    });
  });

  const activeLive = providers.find((provider) => provider.id === requestedProviderId);
  const fallbackToDemo = requestedProviderId !== "mock" && !activeLive?.credentialsReady;
  return {
    activeProviderId: requestedProviderId,
    fallbackToDemo,
    providers,
    checkedAt: new Date().toISOString(),
    safetyNote: "Bu kontrol yalnızca yapılandırma varlığını bildirir; anahtar, auth header değeri veya sağlayıcı ham yanıtı asla istemciye gönderilmez.",
  };
}

export default function handler(request: { method?: string }, response: { status: (code: number) => { json: (payload: unknown) => void } }) {
  if (request.method && request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }
  response.status(200).json(getXProProviderStatus());
}
