import type { XProDataMode, XProProviderId, XProProviderState, XProProviderStatus } from "../shared/xproContracts";

type Env = Record<string, string | undefined>;

type ProviderDefinition = {
  id: XProProviderId;
  label: string;
  mode: XProDataMode;
  requiredEnv: string[];
};

const providerDefinitions: Record<XProProviderId, ProviderDefinition> = {
  mock: { id: "mock", label: "Demo Provider", mode: "DEMO", requiredEnv: [] },
  forinvest: { id: "forinvest", label: "Forinvest", mode: "LIVE", requiredEnv: ["FORINVEST_API_BASE_URL", "FORINVEST_API_KEY", "FORINVEST_AUTH_HEADER_NAME"] },
  dxfeed: { id: "dxfeed", label: "dxFeed", mode: "LIVE", requiredEnv: ["DXFEED_API_BASE_URL", "DXFEED_API_KEY", "DXFEED_AUTH_HEADER_NAME"] },
};

export const XPRO_PROVIDER_IDS = Object.keys(providerDefinitions) as XProProviderId[];

function normalizedRequestedProvider(env: Env): XProProviderId {
  const requested = env.XPRO_DATA_PROVIDER?.trim().toLowerCase();
  return requested && requested in providerDefinitions ? requested as XProProviderId : "mock";
}

export function getXProProviderStatus(providerId: XProProviderId, env: Env = process.env): XProProviderStatus {
  const provider = providerDefinitions[providerId];
  const checkedAt = new Date().toISOString();
  if (providerId === "mock") {
    return {
      id: provider.id,
      label: provider.label,
      state: "DEMO_ACTIVE",
      mode: "DEMO",
      detail: "DEMO / SENTETİK — CANLI VERİ BAĞLI DEĞİL. Demo kayıtları gerçek BIST fiyatı veya KAP olayı değildir.",
      requiredEnv: [],
      missingEnv: [],
      checkedAt,
    };
  }
  const missingEnv = provider.requiredEnv.filter((key) => !env[key]?.trim());
  const state: XProProviderState = missingEnv.length ? "LICENSE_REQUIRED" : "CONFIG_REQUIRED";
  return {
    id: provider.id,
    label: provider.label,
    state,
    mode: "LIVE",
    detail: missingEnv.length
      ? `Eksik: ${missingEnv.join(", ")}. Sağlayıcı erişimi olmadan demo provider çalışmaya devam eder.`
      : "Sağlayıcı kimlik bilgileri var; endpoint sözleşmesi, sağlık yolu ve sembol eşlemesi doğrulanmalıdır.",
    requiredEnv: provider.requiredEnv,
    missingEnv,
    checkedAt,
  };
}

export function getXProProviderRegistry(env: Env = process.env) {
  const requestedProviderId = normalizedRequestedProvider(env);
  const requested = getXProProviderStatus(requestedProviderId, env);
  const active = requested.state === "DEMO_ACTIVE" || requested.state === "READY" ? requested : getXProProviderStatus("mock", env);
  return {
    requestedProviderId,
    activeProvider: active,
    providers: XPRO_PROVIDER_IDS.map((providerId) => getXProProviderStatus(providerId, env)),
    fallbackApplied: active.id !== requestedProviderId,
  };
}
