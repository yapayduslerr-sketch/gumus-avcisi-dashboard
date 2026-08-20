/**
 * Design system: Analist Masası — source-first BIST research terminal with a graphite workspace.
 */
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clipboard,
  ExternalLink,
  FileCheck2,
  Filter,
  Layers3,
  Menu,
  Radar,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

const LOGO = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663900533458/LxcWrYHZKAOGmzoL.png";
const HERO = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663900533458/FrUzDFqDENVuvgun.jpg";
const RADAR_VISUAL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663900533458/bMJsBOnwZiqmPCeR.jpg";
const SOURCE_VISUAL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663900533458/LIjEqXdkRNrpgZMV.jpg";

type SourceStatus = {
  sourceKey: string;
  label: string;
  status: "DELAYED" | "PENDING_API" | "OK" | "STALE" | "ERROR";
  sourceUrl: string;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  observedAt: string | null;
  errorMessage: string | null;
};

type Signal = {
  code: string;
  company: string;
  kind: "KAP doğrulandı" | "Teyit gerekli" | "İzleme notu";
  source: "KAP" | "Şirket IR";
  date: string;
  title: string;
  summary: string;
  risk: string;
  url: string;
  accent: "positive" | "neutral" | "watch";
};

const signals: Signal[] = [
  {
    code: "TUPRS",
    company: "Tüpraş — Türkiye Petrol Rafinerileri A.Ş.",
    kind: "KAP doğrulandı",
    source: "KAP",
    date: "04 Ağu 2026",
    title: "2026 ileriye dönük değerlendirmeler revize edildi",
    summary: "KAP bildiriminde net rafineri marjı rehberliği USD 13–15/varil; kapasite kullanımı %95–100 olarak yer aldı. Bu, yönetim rehberliğidir; gerçekleşmiş sonuç değildir.",
    risk: "Rehberliğin operasyonel sonuca dönüşmesi ayrıca takip edilmeli.",
    url: "https://kap.org.tr/en/Bildirim/1643118",
    accent: "positive",
  },
  {
    code: "RGYAS",
    company: "Rönesans Gayrimenkul Yatırım A.Ş.",
    kind: "KAP doğrulandı",
    source: "KAP",
    date: "12 May 2026",
    title: "Hızlandırılmış talep toplama fiyatı belirlendi",
    summary: "Nitelikli kurumsal yatırımcılara yönelik hızlandırılmış talep toplama fiyatını konu alan bildirim, 11 Mayıs tarihli önceki açıklamanın güncellemesidir.",
    risk: "Sermaye piyasası işlemi, tekrarlayan operasyonel büyüme kanıtı sayılmaz.",
    url: "https://kap.org.tr/en/Bildirim/1605884",
    accent: "neutral",
  },
  {
    code: "ATATP",
    company: "ATP Yazılım ve Teknoloji A.Ş.",
    kind: "Teyit gerekli",
    source: "Şirket IR",
    date: "18 Ağu 2026",
    title: "IR rotası bulunuyor; detaylı duyuru metni çekilemedi",
    summary: "Şirketin yatırımcı ilişkileri sayfası erişilebilir durumdadır. Bu çalışmada tarihli katalizör içeriği güvenilir biçimde elde edilemediği için sinyal nötr kabul edilmelidir.",
    risk: "KAP/IR birincil belge teyidi olmadan katalizör çıkarımı yapılmamalı.",
    url: "https://www.atptech.com/yatirimci-iliskileri/?lang",
    accent: "watch",
  },
];

const sources = [
  { tag: "Borsa İstanbul", name: "BIST 100 endeks tanımı", detail: "Piyasa değeri ağırlıklı, üst sınırı olmayan fiyat endeksi. Başlangıç: 01.01.1986.", url: "https://www.borsaistanbul.com/en/index/xu100" },
  { tag: "Borsa İstanbul", name: "Güncel endeks veri yolları", detail: "Resmî endeks dosyaları ve geçmiş veri yolu tanımları.", url: "https://www.borsaistanbul.com/en/index/index-data" },
  { tag: "KAP", name: "Finansal kalem karşılaştırma", detail: "Son yayımlanan tabloların mevcut dönem sütununu sunar; gecikme ve önceki dönem düzeltmesi notları vardır.", url: "https://kap.org.tr/en/kalem-karsilastirma" },
  { tag: "KAP", name: "BIST şirket dizini", detail: "İncelenen görüntüde 748 şirketlik birincil şirket dizini bulunur; güvenlik türü ayrıca filtrelenmelidir.", url: "https://kap.org.tr/en/bist-sirketler" },
];

const navItems = [
  ["#radar", "Radar"],
  ["#sinyaller", "Sinyaller"],
  ["#metodoloji", "Metodoloji"],
  ["#kaynaklar", "Kaynaklar"],
] as const;

function StatusBadge({ kind }: { kind: Signal["kind"] }) {
  const style = kind === "KAP doğrulandı"
    ? "border-[#8ee19b]/30 bg-[#8ee19b]/10 text-[#a7edb0]"
    : kind === "Teyit gerekli"
      ? "border-[#e5c982]/30 bg-[#e5c982]/10 text-[#ead38e]"
      : "border-white/15 bg-white/5 text-[#cad0ca]";
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[.11em] ${style}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{kind}</span>;
}

function SideRail({ mobile = false, close }: { mobile?: boolean; close?: () => void }) {
  const handleNav = () => close?.();
  return (
    <aside className={mobile ? "h-full w-full bg-[#151917] px-5 py-6" : "fixed inset-y-0 left-0 z-30 hidden w-[220px] border-r border-white/10 bg-[#121513] px-5 py-7 lg:flex lg:flex-col"}>
      <div className="flex items-center justify-between">
        <a href="#top" onClick={handleNav} className="group flex items-center gap-3">
          <img src={LOGO} alt="Gümüş Avcısı" className="h-10 w-10 rounded-xl object-contain transition-transform duration-200 group-hover:scale-105" />
          <div>
            <div className="serif-title text-[22px] leading-5 text-[#f0f1ed]">Gümüş</div>
            <div className="mono mt-1 text-[9px] tracking-[.24em] text-[#8ee19b]">AVCISI</div>
          </div>
        </a>
        {mobile && <button onClick={close} aria-label="Menüyü kapat" className="rounded-lg border border-white/10 p-2 text-white"><X size={18} /></button>}
      </div>
      <div className="mt-12">
        <p className="data-label mb-3">Araştırma Masası</p>
        <nav className="space-y-1">
          {navItems.map(([href, label], index) => <a onClick={handleNav} href={href} key={href} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${index === 0 ? "bg-white/[.07] text-white" : "text-[#aab3aa] hover:bg-white/[.05] hover:text-white"}`}><span className={`font-mono text-[10px] ${index === 0 ? "text-[#8ee19b]" : "text-[#778277]"}`}>0{index + 1}</span>{label}<ChevronRight className="ml-auto h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" /></a>)}
        </nav>
      </div>
      <div className="mt-auto border-t border-white/10 pt-5">
        <div className="rounded-xl border border-[#8ee19b]/15 bg-[#8ee19b]/[.06] p-3.5">
          <div className="flex items-center gap-2 text-[#b7efbf]"><ShieldCheck size={15}/><span className="data-label text-[#b7efbf]">Kaynak disiplini</span></div>
          <p className="mt-2 text-[11px] leading-relaxed text-[#b8c1b8]">Sayı uydurulmaz. Eksik alan, eksik olarak işaretlenir.</p>
        </div>
        <p className="mt-5 mono text-[9px] leading-5 tracking-wide text-[#667066]">VERİ NOTU<br/>18.08.2026 · GMT+3</p>
      </div>
    </aside>
  );
}

function SourceStatusBadge({ status }: { status: SourceStatus["status"] }) {
  const labels: Record<SourceStatus["status"], string> = {
    DELAYED: "15 dk gecikmeli",
    PENDING_API: "KAP API beklemede",
    OK: "Güncel",
    STALE: "Son başarılı güncelleme eski",
    ERROR: "Güncelleme hatası",
  };
  const colors: Record<SourceStatus["status"], string> = {
    DELAYED: "border-[#8ee19b]/30 bg-[#8ee19b]/10 text-[#a7edb0]",
    PENDING_API: "border-[#d9c27d]/30 bg-[#d9c27d]/10 text-[#ead38e]",
    OK: "border-[#8ee19b]/30 bg-[#8ee19b]/10 text-[#a7edb0]",
    STALE: "border-white/15 bg-white/5 text-[#cad0ca]",
    ERROR: "border-[#e98282]/30 bg-[#e98282]/10 text-[#f0aaaa]",
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-[.05em] ${colors[status]}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{labels[status]}</span>;
}

function formatSourceTime(value: string | null) {
  if (!value) return "Henüz yok";
  return new Date(value).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"Tümü" | Signal["kind"]>("Tümü");
  const [openCode, setOpenCode] = useState<string | null>("TUPRS");
  const [menuOpen, setMenuOpen] = useState(false);
  const [sourceStatuses, setSourceStatuses] = useState<SourceStatus[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/source-status")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Kaynak durumları alınamadı")))
      .then((payload: { sources?: SourceStatus[] }) => { if (active) setSourceStatuses(payload.sources ?? []); })
      .catch(() => { if (active) setSourceStatuses([]); });
    return () => { active = false; };
  }, []);

  const bistSource = sourceStatuses.find((source) => source.sourceKey === "BIST_PUBLIC");
  const kapSource = sourceStatuses.find((source) => source.sourceKey === "KAP_PUBLIC");
  const lastSuccessfulUpdate = sourceStatuses.map((source) => source.lastSuccessAt).filter(Boolean).sort().at(-1) ?? null;

  const filteredSignals = useMemo(() => signals.filter((signal) => {
    const query = search.trim().toLocaleLowerCase("tr-TR");
    const matchQuery = !query || `${signal.code} ${signal.company} ${signal.title}`.toLocaleLowerCase("tr-TR").includes(query);
    const matchFilter = filter === "Tümü" || signal.kind === filter;
    return matchQuery && matchFilter;
  }), [search, filter]);

  const copyResearchNote = async () => {
    const text = "Gümüş Avcısı | Araştırma notu\nReferans: 18.08.2026 GMT+3\nBIST 100: piyasa değeri ağırlıklı fiyat endeksi\nKAP verileri için bildirim tarihi, finansal dönem ve gecikme ayrı tutulur.\nBu içerik yatırım tavsiyesi değildir.";
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Araştırma notu panoya kopyalandı.");
    } catch {
      toast.message("Kopyalama için tarayıcınızın pano izni gerekli.");
    }
  };

  return (
    <div id="top" className="min-h-screen overflow-x-hidden bg-[#121513] text-[#f0f1ed]">
      <SideRail />
      {menuOpen && <div className="fixed inset-0 z-[60] lg:hidden"><div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMenuOpen(false)} /><div className="absolute inset-y-0 left-0 w-[290px] shadow-2xl"><SideRail mobile close={() => setMenuOpen(false)} /></div></div>}

      <main className="lg:ml-[220px]">
        <header className="sticky top-0 z-40 flex h-[70px] items-center justify-between border-b border-white/10 bg-[#121513]/90 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
          <button onClick={() => setMenuOpen(true)} className="rounded-lg border border-white/10 p-2 text-white lg:hidden" aria-label="Araştırma menüsünü aç"><Menu size={19} /></button>
          <div className="hidden items-center gap-2 sm:flex"><span className="h-2 w-2 rounded-full bg-[#8ee19b] signal-pulse"/><span className="mono text-[10px] tracking-[.13em] text-[#a7b1a7]">MASA AÇIK · KAYNAK TARAMASI</span></div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span className="hidden data-label sm:inline">Rapor sürümü / 01</span>
            <button onClick={copyResearchNote} className="group inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[.045] px-3 py-2 text-xs text-[#d9ddd8] transition hover:border-[#8ee19b]/35 hover:bg-[#8ee19b]/10 hover:text-white"><Clipboard size={14} /><span className="hidden sm:inline">Notu kopyala</span></button>
          </div>
        </header>

        <section id="radar" className="relative isolate min-h-[610px] overflow-hidden px-5 pb-16 pt-12 sm:px-8 lg:px-10 lg:pt-16">
          <img src={HERO} alt="Soyut piyasa araştırma masası" className="absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-75" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(18,21,19,.98)_0%,rgba(18,21,19,.92)_35%,rgba(18,21,19,.45)_75%,rgba(18,21,19,.68)_100%)]" />
          <div className="absolute inset-0 -z-10 terminal-grid opacity-40" />
          <div className="coordinate-lens absolute -right-16 top-[118px] -z-10 h-[340px] w-[340px] opacity-80" />
          <div className="noise absolute inset-0 -z-10" />
          <div className="mx-auto max-w-[1240px]">
            <div className="intro-rise flex flex-wrap items-center justify-between gap-4 border-b border-white/12 pb-5">
              <div className="flex items-center gap-3"><img src={LOGO} alt="Gümüş Avcısı radar simgesi" className="h-11 w-11 rounded-xl border border-white/12 bg-[#121513]/60 p-1.5 object-contain" /><div><p className="serif-title text-xl leading-none text-white">Gümüş Avcısı</p><p className="mono mt-1.5 text-[9px] tracking-[.19em] text-[#8ee19b]">BIST ARAŞTIRMA MASASI</p></div></div>
              <div className="flex flex-wrap items-center gap-3"><span className="eyebrow flex items-center gap-2"><Radar size={14} />Radar aktif</span><span className="h-px w-8 bg-[#8ee19b]/45" /><span className="data-label text-[#b6beb6]">{bistSource ? <SourceStatusBadge status={bistSource.status} /> : "BIST durum kontrolü bekleniyor"}</span></div>
            </div>
            <div className="grid gap-10 pt-9 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
              <div className="intro-rise-delay max-w-[740px]">
                <h1 className="serif-title max-w-[700px] text-5xl leading-[.92] tracking-[-.045em] text-[#f2f3ee] sm:text-6xl md:text-7xl">BIST’te sinyali<br/><em className="text-[#b6c0b7]">kanıttan</em> ayırın.</h1>
                <p className="mt-7 max-w-[585px] text-[15px] leading-7 text-[#c1c8c1] sm:text-base">Gümüş Avcısı; Borsa İstanbul, KAP ve şirket yatırımcı ilişkileri kaynaklarını araştırma notlarına dönüştüren, veri eksiklerini görünür bırakan bir inceleme masasıdır.</p>
                <div className="mt-9 flex flex-wrap gap-3">
                  <a href="#sinyaller" className="inline-flex items-center gap-2 rounded-xl bg-[#8ee19b] px-4 py-3 text-sm font-bold text-[#182019] transition hover:-translate-y-0.5 hover:bg-[#b6efbe] active:scale-[.97]">Doğrulama kuyruğunu incele <ArrowDownRight size={17}/></a>
                  <a href="#metodoloji" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition hover:border-white/30 hover:bg-white/10 active:scale-[.97]">Yöntemi görün <BookOpen size={16}/></a>
                </div>
              </div>
              <div className="source-strip relative overflow-hidden rounded-2xl border border-white/15 bg-[#161b18]/80 p-5 shadow-2xl backdrop-blur-md">
                <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-[#8ee19b]/10 blur-2xl" />
                <p className="data-label">Araştırma statüsü</p>
                <div className="mt-4 flex items-end justify-between"><div><p className="mono text-3xl font-medium text-[#8ee19b]">03</p><p className="mt-1 text-sm text-[#d8ddd8]">izlenen kaynak notu</p></div><Sparkles size={24} className="text-[#8ee19b]" /></div>
                <div className="my-5 h-px silver-rule" />
                <div className="space-y-3 text-xs"><div className="flex justify-between text-[#cfd5ce]"><span>KAP birincil doğrulama</span><span className="mono text-[#8ee19b]">02 / 03</span></div><div className="flex justify-between text-[#cfd5ce]"><span>Kaynak katmanı</span><span className="mono text-white">KAP · BIST · IR</span></div><div className="flex justify-between text-[#cfd5ce]"><span>Eksik alan etiketi</span><span className="mono text-[#d9c27d]">AÇIK</span></div><div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3"><span className="text-[#cfd5ce]">KAP durumu</span>{kapSource ? <SourceStatusBadge status={kapSource.status} /> : <span className="mono text-[#d9c27d]">BEKLEMEDE</span>}</div><div className="flex justify-between gap-3 text-[#9fa99f]"><span>BIST kaynak zamanı</span><span className="mono text-right text-white">{formatSourceTime(bistSource?.observedAt ?? null)}</span></div><div className="flex justify-between gap-3 text-[#9fa99f]"><span>Otomatik kontrol</span><span className="mono text-right text-white">Günlük · 03:00 UTC</span></div><div className="flex justify-between gap-3 text-[#9fa99f]"><span>Son başarılı güncelleme</span><span className="mono text-right text-white">{formatSourceTime(lastSuccessfulUpdate)}</span></div>{kapSource?.errorMessage && <p className="border-t border-[#d9c27d]/20 pt-3 text-[10px] leading-4 text-[#d9c27d]">Durum notu: {kapSource.errorMessage}</p>}</div>
              </div>
            </div>
            <div className="mt-16 grid border-y border-white/12 sm:grid-cols-2 xl:grid-cols-4">
              {[['XU100','Piyasa değeri ağırlıklı fiyat endeksi'],['TRY','Resmî endeks para birimi'],['748','KAP dizin görüntüsündeki şirket sayısı'],['TBD','Eksik veri, eksik olarak kalır']].map(([value,label], index) => <div key={value} className={`py-5 ${index ? 'sm:border-l sm:border-white/12 sm:pl-6 xl:pl-8' : ''}`}><p className={`mono text-xl ${value === 'TBD' ? 'text-[#d9c27d]' : 'text-[#f0f1ed]'}`}>{value}</p><p className="mt-1 max-w-[180px] text-xs leading-5 text-[#b5bdb5]">{label}</p></div>)}
            </div>
          </div>
        </section>

        <section id="sinyaller" className="relative bg-[#151917] px-5 py-20 sm:px-8 lg:px-10">
          <div className="absolute inset-0 terminal-grid opacity-25" />
          <div className="relative mx-auto max-w-[1240px]">
            <div className="flex flex-col justify-between gap-6 border-b border-white/12 pb-7 md:flex-row md:items-end">
              <div className="max-w-xl"><p className="eyebrow">01 / Doğrulama kuyruğu</p><h2 className="serif-title mt-3 text-4xl tracking-[-.035em] text-white sm:text-5xl">İddia değil, belge.</h2><p className="mt-4 text-sm leading-6 text-[#adb6ad]">KAP veya şirket IR rotası açıkça belirtilmeden, katalizör doğrudan yatırım tezi olarak kullanılmaz.</p></div>
              <div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f8a80]"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Kod veya şirket ara" className="h-10 w-full rounded-xl border border-white/12 bg-[#101311] pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-[#687168] focus:border-[#8ee19b]/55 sm:w-[190px]" /></label><div className="relative"><Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8ee19b]"/><select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="h-10 appearance-none rounded-xl border border-white/12 bg-[#101311] py-0 pl-9 pr-8 text-sm text-[#d9ddd8] outline-none focus:border-[#8ee19b]/55"><option>Tümü</option><option>KAP doğrulandı</option><option>Teyit gerekli</option><option>İzleme notu</option></select><ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f8a80]" /></div></div>
            </div>
            <div className="mt-8 grid gap-4 xl:grid-cols-[112px_minmax(0,1fr)_440px]">
              <aside className="source-strip hidden rounded-2xl border border-white/12 bg-[#101311]/75 p-4 xl:block"><p className="data-label">Tarama</p><div className="mt-7 space-y-5"><div><p className="mono text-lg text-[#8ee19b]">01</p><p className="mt-1 text-[10px] leading-4 text-[#a6b0a6]">Kodu seç</p></div><div><p className="mono text-lg text-[#8ee19b]">02</p><p className="mt-1 text-[10px] leading-4 text-[#a6b0a6]">Kaynağı kontrol et</p></div><div><p className="mono text-lg text-[#d9c27d]">03</p><p className="mt-1 text-[10px] leading-4 text-[#a6b0a6]">Risk notunu oku</p></div></div><div className="mt-10 border-t border-white/10 pt-3"><p className="mono text-[9px] leading-4 text-[#7c867c]">KANIT<br/>ÖNCELİKLİ</p></div></aside>
              <div className="overflow-hidden rounded-2xl border border-white/12 bg-[#101311]/80">
                <div className="hidden grid-cols-[100px_minmax(0,1fr)_135px_32px] gap-4 border-b border-white/10 px-5 py-3 md:grid"><p className="data-label">Kod / Tarih</p><p className="data-label">Kanıt kaynağı / Araştırma notu</p><p className="data-label">Doğrulama</p><span /></div>
                {filteredSignals.length ? filteredSignals.map((signal) => {
                  const selected = openCode === signal.code;
                  return <button key={signal.code} onClick={() => setOpenCode(selected ? null : signal.code)} className={`group grid w-full gap-3 border-b border-white/8 p-5 text-left transition last:border-0 md:grid-cols-[100px_minmax(0,1fr)_135px_32px] md:items-center ${selected ? 'bg-[#8ee19b]/[.07]' : 'hover:bg-white/[.035]'}`}>
                    <div><p className="mono text-base text-white">{signal.code}</p><p className="mt-1 font-mono text-[10px] text-[#8ee19b]">{signal.source}</p><p className="mt-1 text-[10px] text-[#778277]">{signal.date}</p><p className="mt-2 text-[9px] text-[#d9c27d]">{signal.source === "KAP" ? kapSource ? (kapSource.status === "PENDING_API" ? "KAP API beklemede" : kapSource.status) : "KAP durum bekleniyor" : "IR kaynak kaydı"}</p><p className="mt-1 text-[9px] text-[#778277]">Gözlem: {formatSourceTime(signal.source === "KAP" ? kapSource?.observedAt ?? null : null)}</p><a href={signal.url} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="mt-1 inline-flex items-center gap-1 text-[9px] text-[#8ee19b] hover:underline">Kaynak URL <ExternalLink size={10}/></a>{signal.source === "KAP" && kapSource?.errorMessage && <p className="mt-1 line-clamp-2 text-[9px] leading-3 text-[#d9c27d]">{kapSource.errorMessage}</p>}</div>
                    <div><p className="text-sm font-bold leading-5 text-[#edf0eb]">{signal.title}</p><p className="mt-1 line-clamp-1 text-xs text-[#9da89f]">{signal.company}</p></div>
                    <div><StatusBadge kind={signal.kind}/></div><ChevronRight className={`hidden h-4 w-4 text-[#8ee19b] transition-transform md:block ${selected ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                  </button>;
                }) : <div className="px-5 py-12 text-center"><Search className="mx-auto h-6 w-6 text-[#607060]"/><p className="mt-3 text-sm text-[#a7afa7]">Bu aramaya uyan kayıt yok.</p></div>}
              </div>
              <div className="min-h-[340px] overflow-hidden rounded-2xl border border-white/12 bg-[#1a201c] p-6">
                {openCode ? (() => { const item = signals.find((signal) => signal.code === openCode); if (!item) return null; return <div className="flex h-full flex-col"><div className="flex items-start justify-between gap-3"><StatusBadge kind={item.kind}/><a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-[#8ee19b] hover:underline">Birincil kaynağa git <ExternalLink size={12}/></a></div><p className="mono mt-6 text-[11px] tracking-[.14em] text-[#9ba69b]">{item.code} · {item.source} · {item.date}</p><h3 className="serif-title mt-3 text-3xl leading-[1.02] text-white">{item.title}</h3><p className="mt-5 text-sm leading-6 text-[#c5cdc5]">{item.summary}</p><div className="mt-5 grid gap-2 border-t border-white/10 pt-4 text-[11px] text-[#9fa99f]"><div className="flex justify-between gap-3"><span>Kaynak zamanı</span><span className="mono text-right text-white">{item.date}</span></div><div className="flex justify-between gap-3"><span>Son başarılı güncelleme</span><span className="mono text-right text-white">{formatSourceTime(kapSource?.lastSuccessAt ?? null)}</span></div><div className="flex justify-between gap-3"><span>Kaynak durumu</span><span className="text-right">{kapSource ? <SourceStatusBadge status={kapSource.status} /> : <span className="mono text-[#d9c27d]">KAP API beklemede</span>}</span></div>{kapSource?.errorMessage && <p className="text-[10px] leading-4 text-[#d9c27d]">Hata/durum notu: {kapSource.errorMessage}</p>}<a href={item.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[#8ee19b] hover:underline">Kaynak URL’sini aç <ExternalLink size={12}/></a></div><div className="mt-4 border-t border-white/10 pt-4"><p className="data-label flex items-center gap-2 text-[#d9c27d]"><CircleAlert size={13}/> İzleme notu</p><p className="mt-2 text-xs leading-5 text-[#bec6be]">{item.risk}</p></div></div>; })() : <div className="flex h-full flex-col items-center justify-center text-center"><Layers3 className="h-8 w-8 text-[#8ee19b]"/><p className="mt-4 text-sm font-semibold text-white">Bir bildirime odaklanın</p><p className="mt-2 max-w-[230px] text-xs leading-5 text-[#9ca69c]">Soldaki kayıtlardan birini seçerek kaynak notunu ve risk etiketini görün.</p></div>}
              </div>
            </div>
          </div>
        </section>

        <section id="metodoloji" className="bg-[#121513] px-5 py-20 sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-[1240px] gap-12 lg:grid-cols-[.86fr_1.14fr] lg:items-center">
            <div className="relative overflow-hidden rounded-[26px] border border-white/12 bg-[#1a201d]"><img src={RADAR_VISUAL} alt="Araştırma sinyallerini çağrıştıran soyut radar görseli" className="aspect-[4/3] w-full object-cover opacity-85"/><div className="absolute inset-0 bg-gradient-to-tr from-[#111512] via-transparent to-transparent"/><div className="absolute bottom-5 left-5 right-5 rounded-xl border border-white/12 bg-[#121513]/80 p-4 backdrop-blur"><p className="data-label">Katmanlı tarama</p><p className="mt-1 text-sm text-[#d7ded7]">Evren → kaynak → zaman → kanıt → risk</p></div></div>
            <div><p className="eyebrow">02 / Metodoloji</p><h2 className="serif-title mt-3 text-4xl leading-none tracking-[-.035em] text-white sm:text-5xl">Bir sinyalin<br/><em className="text-[#aeb8af]">iz sürme protokolü.</em></h2><p className="mt-6 max-w-[600px] text-sm leading-7 text-[#adb7ad]">Araştırma akışı, aynı bilgiyi farklı tarih ve kaynaklarda karıştırmamak için tasarlanmıştır. Piyasa verisi, finansal tablo dönemi ve bildirim tarihi ayrı tutulur.</p>
              <div className="mt-8 space-y-0">{[["01","Evreni resmî kaynaktan sabitle","BIST endeks sayfaları ve KAP şirket dizini, güncel listeleme statüsü için ilk referanstır."],["02","Dönemi bildirimden ayır","KAP finansal kalem aramasında ‘current period’ verisi, şirket finansal raporundaki tarih ve düzeltmelerle ayrıca okunur."],["03","Eksik alanı görünür bırak","Bildirim satırı veya güvenilir finansal alan yoksa, sistem bunu olumlu/olumsuz puana zorlamaz; TBD olarak tutar."],["04","Katalizörü birincil kaynakla teyit et","KAP bildirim türü, tarihi ve özet bilgisi görülmeden katalizör iddiası kesinleşmez."]].map(([number,title,copy]) => <div key={number} className="grid grid-cols-[38px_1fr] gap-4 border-t border-white/10 py-5"><span className="mono pt-0.5 text-xs text-[#8ee19b]">{number}</span><div><h3 className="text-sm font-bold text-[#edf0eb]">{title}</h3><p className="mt-1 text-xs leading-5 text-[#9fa99f]">{copy}</p></div></div>)}</div>
            </div>
          </div>
        </section>

        <section id="kaynaklar" className="relative overflow-hidden bg-[#1a201c] px-5 py-20 sm:px-8 lg:px-10">
          <img src={SOURCE_VISUAL} alt="Katmanlı araştırma kaynaklarını çağrıştıran soyut belge görseli" className="absolute inset-y-0 right-0 h-full w-full object-cover object-left opacity-[.18] lg:w-1/2 lg:opacity-40"/><div className="absolute inset-0 bg-[linear-gradient(90deg,#1a201c_0%,#1a201c_44%,rgba(26,32,28,.83)_70%,rgba(26,32,28,.78)_100%)]"/>
          <div className="relative mx-auto max-w-[1240px]"><div className="max-w-[650px]"><p className="eyebrow">03 / Kaynak protokolü</p><h2 className="serif-title mt-3 text-4xl leading-none tracking-[-.035em] text-white sm:text-5xl">Kaynak görünürse,<br/>soru da görünür.</h2><p className="mt-5 text-sm leading-7 text-[#b7c0b7]">Bu masa, resmî kaynağın yanında veri kısıtını da saklamaz. Aşağıdaki bağlantılar, ekran üzerindeki araştırma notlarının başlangıç noktalarıdır.</p></div>
            <div className="mt-10 grid gap-3 md:grid-cols-2">{sources.map((source) => <a key={source.name} href={source.url} target="_blank" rel="noreferrer" className="group rounded-2xl border border-white/12 bg-[#101311]/75 p-5 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-[#8ee19b]/35 hover:bg-[#101311]"><div className="flex items-center justify-between"><span className="data-label text-[#8ee19b]">{source.tag}</span><ArrowUpRight className="h-4 w-4 text-[#7f8a7f] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#8ee19b]"/></div><h3 className="mt-6 text-sm font-bold text-[#edf0eb]">{source.name}</h3><p className="mt-2 text-xs leading-5 text-[#a9b3a9]">{source.detail}</p></a>)}</div>
          </div>
        </section>

        <footer className="border-t border-white/10 bg-[#0e100f] px-5 py-8 sm:px-8 lg:px-10"><div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-5 sm:flex-row sm:items-end"><div className="flex items-center gap-3"><img src={LOGO} alt="" className="h-9 w-9 object-contain"/><div><p className="serif-title text-xl text-white">Gümüş Avcısı</p><p className="mono mt-0.5 text-[9px] tracking-[.13em] text-[#758075]">BIST ARAŞTIRMA MASASI</p></div></div><div className="max-w-[540px] text-left sm:text-right"><p className="text-xs leading-5 text-[#98a198]">Bu site araştırma ve analiz içindir; kişiselleştirilmiş yatırım tavsiyesi veya getiri garantisi değildir. Finansal risk ve karar sorumluluğu kullanıcıdadır.</p><p className="mt-2 mono text-[9px] tracking-wide text-[#606960]">SON BAŞARILI GÜNCELLEME · {formatSourceTime(lastSuccessfulUpdate)} · GMT+3</p></div></div></footer>
      </main>
    </div>
  );
}
