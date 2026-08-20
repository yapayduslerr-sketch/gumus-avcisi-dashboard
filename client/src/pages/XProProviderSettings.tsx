import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, CircleAlert, Database, KeyRound, RefreshCw, ServerCog, ShieldCheck } from "lucide-react";

type Provider = {
  id: "mock" | "forinvest" | "dxfeed";
  label: string;
  mode: "DEMO" | "LIVE";
  active: boolean;
  state: "DEMO_ACTIVE" | "CONFIG_REQUIRED" | "CONFIGURED";
  detail: string;
  requiredVariables: string[];
  missingVariables: string[];
  credentialsReady: boolean;
};

type ProviderStatus = {
  activeProviderId: Provider["id"];
  fallbackToDemo: boolean;
  providers: Provider[];
  checkedAt: string;
  safetyNote: string;
};

function stateStyle(state: Provider["state"]) {
  if (state === "DEMO_ACTIVE") return "border-[#edca72]/35 bg-[#edca72]/[.08] text-[#f0d486]";
  if (state === "CONFIGURED") return "border-[#86e49a]/35 bg-[#86e49a]/[.08] text-[#aef0b9]";
  return "border-[#ee9c98]/30 bg-[#ee9c98]/[.07] text-[#f3b6b1]";
}

function stateLabel(state: Provider["state"]) {
  if (state === "DEMO_ACTIVE") return "DEMO AKTİF";
  if (state === "CONFIGURED") return "YAPILANDIRILDI";
  return "YAPILANDIRMA BEKLİYOR";
}

export default function XProProviderSettings() {
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/xpro-provider-status");
      if (!response.ok) throw new Error(`Provider durum isteği HTTP ${response.status}`);
      setStatus(await response.json() as ProviderStatus);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Provider durumu alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  return <main className="min-h-screen bg-[#0b100d] text-[#e7eee7]">
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
        <a href="/x-pro" className="inline-flex items-center gap-2 text-xs font-semibold text-[#dce8dc] transition hover:text-white"><ArrowLeft size={15}/> X Pro laboratuvarına dön</a>
        <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/[.04] px-3 py-2 text-xs font-semibold text-[#dbe5db] transition hover:bg-white/[.1] disabled:opacity-60"><RefreshCw size={14} className={loading ? "animate-spin" : ""}/> Durumu yenile</button>
      </header>

      <section className="grid gap-5 py-9 lg:grid-cols-[1.25fr_.75fr]">
        <div><p className="mono text-[10px] tracking-[.2em] text-[#8de69e]">X PRO · VERİ KAYNAĞI AYARLARI</p><h1 className="serif-title mt-4 text-4xl leading-[.95] text-white sm:text-6xl">Sağlayıcıyı görün.<br/><em className="text-[#a9cdb0]">Anahtarı göstermeyin.</em></h1><p className="mt-5 max-w-2xl text-sm leading-6 text-[#aeb9ae]">Bu sayfa yalnızca sunucu yapılandırmasının varlığını denetler. Buraya API anahtarı yazılmaz, tarayıcıda saklanmaz ve ham sağlayıcı yanıtı gösterilmez.</p></div>
        <aside className="rounded-2xl border border-[#8ab5e3]/25 bg-[#0e1518] p-5"><div className="flex items-start justify-between gap-3"><div><p className="data-label text-[#bcdcf4]">AKTİF MOD</p><h2 className="mt-2 text-xl font-semibold text-white">{status?.fallbackToDemo ? "Demo geri dönüşü" : status?.activeProviderId === "mock" ? "Demo sandbox" : "Canlı provider seçili"}</h2></div><Database className="h-5 w-5 text-[#bcdcf4]"/></div><p className="mt-4 text-xs leading-5 text-[#9dbad0]">{status?.fallbackToDemo ? "Canlı provider seçilmiş ancak zorunlu ortam değişkenleri eksik olduğundan sentetik demo verisi korunuyor." : "Her kayıt, sağlayıcı bağlandıktan sonra dahi kaynak ve gözlem zamanı ile gösterilir."}</p><p className="mono mt-4 border-t border-[#8ab5e3]/15 pt-4 text-[10px] text-[#c4dcec]">Son kontrol · {status ? new Date(status.checkedAt).toLocaleString("tr-TR") : "—"}</p></aside>
      </section>

      {error ? <section role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-[#ee9c98]/35 bg-[#ee9c98]/[.08] p-4 text-xs leading-5 text-[#f2c3c0]"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0"/><div><b className="text-white">Provider durumuna erişilemedi.</b><br/>{error} Bu durumda canlı provider veya sonuç varsayılmaz.</div></section> : null}

      <section className="grid gap-4 lg:grid-cols-3">{loading && !status ? [0, 1, 2].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl border border-white/8 bg-white/[.03]"/>) : status?.providers.map((provider) => <article key={provider.id} className={`rounded-2xl border p-5 ${provider.active ? "border-[#86e49a]/35 bg-[#86e49a]/[.045]" : "border-white/10 bg-[#111713]"}`}><div className="flex items-start justify-between gap-3"><div><p className="data-label">{provider.mode} PROVIDER</p><h2 className="mt-2 text-xl font-semibold text-white">{provider.label}</h2></div><span className={`rounded-full border px-2.5 py-1 mono text-[9px] ${stateStyle(provider.state)}`}>{stateLabel(provider.state)}</span></div><p className="mt-4 min-h-16 text-xs leading-5 text-[#aeb9ae]">{provider.detail}</p><div className="mt-4 border-t border-white/8 pt-4"><p className="text-[10px] font-semibold uppercase tracking-[.09em] text-[#94a394]">Gerekli sunucu değişkenleri</p>{provider.requiredVariables.length ? <ul className="mt-2 space-y-1.5">{provider.requiredVariables.map((variable) => <li key={variable} className="flex items-center justify-between gap-2 rounded-md bg-black/15 px-2 py-1.5 mono text-[9px]"><span className="text-[#c9d6c9]">{variable}</span><span className={provider.missingVariables.includes(variable) ? "text-[#f2aaa5]" : "text-[#aef0b9]"}>{provider.missingVariables.includes(variable) ? "EKSİK" : "MEVCUT"}</span></li>)}</ul> : <p className="mt-2 text-[10px] leading-5 text-[#d9c98f]">Sentetik mod için anahtar gerekmez. Bu mod gerçek BIST/KAP verisi üretmez.</p>}</div>{provider.active ? <div className="mt-4 flex items-center gap-2 text-[10px] text-[#aef0b9]"><CheckCircle2 size={13}/> Seçili yapılandırma</div> : null}</article>)}</section>

      <section className="mt-6 grid gap-5 lg:grid-cols-2"><article className="rounded-2xl border border-[#edca72]/25 bg-[#edca72]/[.045] p-5"><div className="flex items-start gap-3"><KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-[#f0d486]"/><div><p className="data-label text-[#f0d486]">GÜVENLİ YAPILANDIRMA</p><h2 className="serif-title mt-2 text-2xl text-white">Tarayıcıda anahtar yok</h2><p className="mt-3 text-xs leading-6 text-[#d8c78d]">API tabanı, anahtar ve kimlik doğrulama başlığı yalnızca dağıtım ortamı değişkeni olarak eklenmelidir. Bu kullanıcı arayüzü anahtar girişi, görüntüleme veya saklama işlevi sunmaz.</p></div></div></article><article className="rounded-2xl border border-[#8ab5e3]/25 bg-[#8ab5e3]/[.045] p-5"><div className="flex items-start gap-3"><ServerCog className="mt-0.5 h-5 w-5 shrink-0 text-[#bcdcf4]"/><div><p className="data-label text-[#bcdcf4]">CANLIYA GEÇİŞ SÖZLEŞMESİ</p><h2 className="serif-title mt-2 text-2xl text-white">Önce izin, sonra veri</h2><p className="mt-3 text-xs leading-6 text-[#abc9de]">Forinvest veya dxFeed seçimi; BIST sembol kapsamı, en az 15 dakika gecikme, tarihsel OHLCV, webde yeniden gösterim hakkı ve KAP kaynağının yazılı doğrulamasından sonra etkinleşir. Aksi halde X Pro demo modunda kalır.</p></div></div></article></section>

      <section className="mt-5 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[.03] p-4 text-xs leading-5 text-[#aeb9ae]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#8de69e]"/>{status?.safetyNote ?? "Durum verisi yükleniyor."}</section>
      <p className="mt-6 text-center text-[10px] text-[#7e8c7e]">Tarama çalışmasıdır, yatırım tavsiyesi değildir.</p>
    </div>
  </main>;
}
