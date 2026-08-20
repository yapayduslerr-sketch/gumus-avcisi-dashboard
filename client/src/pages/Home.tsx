/**
 * Design system: Analist Masası — source-first BIST research terminal with a graphite workspace.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clipboard,
  Download,
  ExternalLink,
  FileCheck2,
  Filter,
  Globe2,
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
import { TechnicalChartPanel } from "@/components/TechnicalChartPanel";
import { QUALITY_SCORE_PARTS } from "@/lib/screeningModel";
import { clearPersonalResearchData, createPersonalResearchBackup, defaultAlertPreferences, loadAlertPreferences, loadWatchlist, parsePersonalResearchBackup, persistAlertPreferences, removeWatchlistItem, restorePersonalResearchBackup, type DeviceAlertPreferences, type WatchlistItem, upsertWatchlistItem } from "@/lib/personalResearch";
import { TECHNICAL_SCANNER_MODELS, type ScannerModelId } from "@/lib/technicalScanner";
import { downloadScannerSchema } from "@/lib/scannerExport";

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

type ResearchCapability = {
  sourceKey: string;
  label: string;
  state: "READY" | "LICENSE_REQUIRED" | "CONFIG_REQUIRED" | "ERROR";
  detail: string;
};

type MultiAssetQuote = {
  assetKey: "USD_TRY" | "BRENT" | "XAU_USD" | "BTC_USD";
  symbol: string;
  label: string;
  price: number;
  percentChange: number | null;
  observedAt: string;
  sourceLabel: string;
  sourceUrl: string;
  delayMinutes: number | null;
};

type MultiAssetContext = {
  state: "READY" | "LICENSE_REQUIRED" | "CONFIG_REQUIRED" | "ERROR";
  checkedAt: string;
  detail: string;
  quotes: MultiAssetQuote[];
  unavailableAssetKeys: MultiAssetQuote["assetKey"][];
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

type ResearchLens = "Kalite 100" | "Bebek V2" | "Proje";
type ResearchRecord = {
  code: string;
  lens: ResearchLens;
  score?: number;
  label: string;
  thesis: string;
  metrics: { label: string; value: string }[];
  dataState: "Tarih teyidi gerekli" | "Kaynak teyidi gerekli" | "Belge kuyruğu";
  risk: string;
};

const researchRecords: ResearchRecord[] = [
  { code: "INDES", lens: "Kalite 100", score: 86, label: "Üst sıra · kullanıcı çalışma notu", thesis: "Satış, FAVÖK ve net kâr trendi ile net nakit ve değerleme alanlarının birlikte incelendiği çalışma kaydı.", metrics: [{ label: "ROIC", value: "%26,4" }, { label: "F/K", value: "8,3" }, { label: "FD/FAVÖK", value: "1,5" }, { label: "Net nakit", value: "644 mn TL" }], dataState: "Tarih teyidi gerekli", risk: "Paylaşılan notta rakamların dönem sonu, konsolidasyon kapsamı ve tek seferlik kalemlerden arındırma durumu belirtilmemiştir." },
  { code: "FONET", lens: "Kalite 100", score: 85, label: "Üst sıra · kullanıcı çalışma notu", thesis: "Paylaşılan çalışmada satış, FAVÖK, net kâr ve faaliyet nakit akışının birlikte büyümesi ile net nakit konumu öne çıkarılmıştır.", metrics: [{ label: "Satış büyümesi", value: "%40" }, { label: "Kâr büyümesi", value: "%47" }, { label: "ROE", value: "%16,6" }, { label: "Net borç", value: "-104 mn TL" }], dataState: "Tarih teyidi gerekli", risk: "Büyümenin hangi raporlama dönemine ait olduğu ve nakit akışının sürdürülebilirliği KAP finansallarıyla ayrıca doğrulanmalıdır." },
  { code: "SAYAS", lens: "Kalite 100", score: 84, label: "Üst sıra · kullanıcı çalışma notu", thesis: "Paylaşılan 100 puanlık çalışma listesinde ilk üçte yer alır; metrik kırılımı henüz kaynak belgesiyle eşlenmemiştir.", metrics: [{ label: "Skor", value: "84 / 100" }, { label: "Metrik kırılımı", value: "TBD" }, { label: "KAP eşleşmesi", value: "TBD" }], dataState: "Kaynak teyidi gerekli", risk: "Skorun dayanakları, finansal dönem ve değerleme tarihi görünür hale gelmeden karşılaştırılabilir kabul edilmemelidir." },
  { code: "FRMPL", lens: "Bebek V2", score: 90, label: "V2 ekranı · kullanıcı çalışma notu", thesis: "Fiili dolaşım ve dolaşımdaki piyasa değeri merceğiyle ele alınan çalışma kaydı.", metrics: [{ label: "Piyasa değeri", value: "5,36 mr TL" }, { label: "Fiili dolaşım", value: "%25,0" }, { label: "Dolaşım PD", value: "1,34 mr TL" }, { label: "F/K", value: "22,6" }], dataState: "Tarih teyidi gerekli", risk: "Fiili dolaşım verisi ve çarpanlar zamanla değişir; güncel kaynak tarihi olmadan canlı filtre sonucu gibi okunmamalıdır." },
  { code: "MOPAS", lens: "Bebek V2", score: 89, label: "V2 ekranı · kullanıcı çalışma notu", thesis: "Mağaza büyümesi ve net nakit notuyla izleme havuzuna alınmış çalışma kaydı.", metrics: [{ label: "Piyasa değeri", value: "7,81 mr TL" }, { label: "Fiili dolaşım", value: "%21,0" }, { label: "Dolaşım PD", value: "1,64 mr TL" }, { label: "F/K", value: "22,6" }], dataState: "Tarih teyidi gerekli", risk: "Büyüme yatırımı, marj ve net nakit ifadesi finansal dönem ile açıklama kaynağına bağlanmalıdır." },
  { code: "EBEBK", lens: "Bebek V2", score: 87, label: "V2 ekranı · kullanıcı çalışma notu", thesis: "Operasyon ve e-ticaret büyümesi notuyla izleme havuzuna alınmış çalışma kaydı.", metrics: [{ label: "Piyasa değeri", value: "12,89 mr TL" }, { label: "Fiili dolaşım", value: "%26,1" }, { label: "Dolaşım PD", value: "3,36 mr TL" }, { label: "FD/FAVÖK", value: "2,8" }], dataState: "Tarih teyidi gerekli", risk: "İşletme sermayesi, stok dönüşümü ve dönemsel marj değişimleri ayrıca değerlendirilmelidir." },
  { code: "PKART", lens: "Bebek V2", score: 84, label: "V2 ekranı · kullanıcı çalışma notu", thesis: "Güçlü kâr dönüşümü ve ROIC notuyla izleme havuzuna alınmış çalışma kaydı.", metrics: [{ label: "Piyasa değeri", value: "2,91 mr TL" }, { label: "Fiili dolaşım", value: "%33,7" }, { label: "Dolaşım PD", value: "0,98 mr TL" }, { label: "ROIC", value: "%25,7" }], dataState: "Tarih teyidi gerekli", risk: "Likidite, sürdürülebilir nakit üretimi ve proje bazlı gelir görünürlüğü ayrı belge kontrolleri gerektirir." },
  ...["KRSTL", "SAYAS", "ORZAX", "SAFKR", "LILAK", "CWENE"].map((code) => ({ code, lens: "Proje" as const, label: "Proje/katalizör kuyruğu", thesis: "Somut yatırım, kapasite artışı, yeni pazar veya büyük proje potansiyeli için belge taramasına alınmış kod.", metrics: [{ label: "Katalizör belgesi", value: "TBD" }, { label: "Ölçek etkisi", value: "TBD" }, { label: "Likidite kontrolü", value: "TBD" }], dataState: "Belge kuyruğu" as const, risk: "Katalizörün şirket ölçeğine etkisi, finansman kaynağı ve gerçekleşme takvimi KAP/IR belgesi olmadan puanlanmaz." })),
];

const scoreParts = QUALITY_SCORE_PARTS;

const babyScreenPolicy = [
  ["Piyasa değeri", "1–15 mr TL", "Ölçek filtresi"],
  ["Likidite", "20 gün ort. ≥40 mn TL", "İşlem hacmi"],
  ["TTM satış", "Son 4 dönemde artış", "Dönem bazlı"],
  ["TTM net kâr", "Son 4 dönemde artış", "Dönem bazlı"],
  ["FAVÖK", "Pozitif", "Faaliyet kârlılığı"],
  ["Faaliyet nakit akışı", "Pozitif", "CFO"],
] as const;

const marketBlankPanels = [
  ["Artanlar", "Gün içi fiyat değişimi", "Tarih/saatli BIST fiyat akışı bağlı değil"],
  ["Azalanlar", "Gün içi fiyat değişimi", "Tarih/saatli BIST fiyat akışı bağlı değil"],
  ["Hacim liderleri", "20 gün / gün içi hacim", "Hacim adapteri bağlı değil"],
  ["İzleme listesi", "Belge + finansal dönem + risk", "Kullanıcı listesi oturumu bağlı değil"],
] as const;

const multiAssetCards = [
  { symbol: "USD/TRY", label: "Döviz", detail: "USD karşılığı Türk lirası", source: "Twelve Data · beklemede" },
  { symbol: "BRENT", label: "Enerji", detail: "Brent spot petrol", source: "Twelve Data · beklemede" },
  { symbol: "XAU/USD", label: "Kıymetli maden", detail: "Ons altın spot", source: "Twelve Data · beklemede" },
  { symbol: "BTC/USD", label: "Kripto", detail: "Bitcoin referans paritesi", source: "Twelve Data · beklemede" },
] as const;

function recordCriteria(record: ResearchRecord) {
  if (record.code === "FONET") return [["Piyasa değeri", "Notta var · tarih TBD"], ["TTM satış", "Notta var · dönem TBD"], ["TTM net kâr", "Notta var · dönem TBD"], ["FAVÖK", "Notta var · kaynak TBD"], ["CFO", "Notta var · kaynak TBD"], ["20 gün hacim", "TBD"]] as const;
  if (record.lens === "Bebek V2") return [["Piyasa değeri", "Notta var · tarih TBD"], ["20 gün hacim", "TBD"], ["TTM satış", "TBD"], ["TTM net kâr", "TBD"], ["FAVÖK", "TBD"], ["CFO", "TBD"]] as const;
  if (record.lens === "Kalite 100") return scoreParts.map(([label]) => [label, "Alt kırılım TBD"] as const);
  return [["Katalizör belgesi", "TBD"], ["Finansman", "TBD"], ["Ölçek etkisi", "TBD"]] as const;
}

const navItems = [
  ["#radar", "Radar"],
  ["#tarama", "Tarama"],
  ["#model-masasi", "Teknik modeller"],
  ["#piyasalar", "Piyasalar"],
  ["#izleme", "İzleme"],
  ["#sinyaller", "KAP belgeleri"],
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

function ResearchStateBadge({ state }: { state: ResearchRecord["dataState"] }) {
  const styles: Record<ResearchRecord["dataState"], string> = {
    "Tarih teyidi gerekli": "border-[#d9c27d]/30 bg-[#d9c27d]/10 text-[#ead38e]",
    "Kaynak teyidi gerekli": "border-[#e6a987]/30 bg-[#e6a987]/10 text-[#efb795]",
    "Belge kuyruğu": "border-[#8ab5e3]/30 bg-[#8ab5e3]/10 text-[#aad0ef]",
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 font-mono text-[9px] uppercase tracking-[.08em] ${styles[state]}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{state}</span>;
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"Tümü" | Signal["kind"]>("Tümü");
  const [openCode, setOpenCode] = useState<string | null>("TUPRS");
  const [menuOpen, setMenuOpen] = useState(false);
  const [sourceStatuses, setSourceStatuses] = useState<SourceStatus[]>([]);
  const [researchLens, setResearchLens] = useState<ResearchLens | "Tümü">("Tümü");
  const [researchSearch, setResearchSearch] = useState("");
  const [selectedResearchCode, setSelectedResearchCode] = useState("INDES");
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [personalNote, setPersonalNote] = useState("");
  const [alertPreferences, setAlertPreferences] = useState<DeviceAlertPreferences>(defaultAlertPreferences);
  const [capabilities, setCapabilities] = useState<ResearchCapability[]>([]);
  const [isRefreshingResearchStatus, setIsRefreshingResearchStatus] = useState(false);
  const [selectedTechnicalModels, setSelectedTechnicalModels] = useState<ScannerModelId[]>(["rsi-momentum", "macd-cross"]);
  const [technicalSearch, setTechnicalSearch] = useState("");
  const [technicalSort, setTechnicalSort] = useState<"match" | "symbol" | "observed">("match");
  const [multiAssetContext, setMultiAssetContext] = useState<MultiAssetContext | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/source-status")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Kaynak durumları alınamadı")))
      .then((payload: { sources?: SourceStatus[] }) => { if (active) setSourceStatuses(payload.sources ?? []); })
      .catch(() => { if (active) setSourceStatuses([]); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setWatchlist(loadWatchlist());
    setAlertPreferences(loadAlertPreferences());
    fetch("/api/research-capabilities")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Adapter durumları alınamadı")))
      .then((payload: { capabilities?: ResearchCapability[] }) => setCapabilities(payload.capabilities ?? []))
      .catch(() => setCapabilities([]));
    fetch("/api/market-context")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Piyasa bağlamı alınamadı")))
      .then((payload: MultiAssetContext) => setMultiAssetContext(payload))
      .catch(() => setMultiAssetContext(null));
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

  const filteredResearch = useMemo(() => researchRecords.filter((record) => {
    const query = researchSearch.trim().toLocaleLowerCase("tr-TR");
    const lensMatch = researchLens === "Tümü" || record.lens === researchLens;
    const queryMatch = !query || `${record.code} ${record.thesis} ${record.label}`.toLocaleLowerCase("tr-TR").includes(query);
    return lensMatch && queryMatch;
  }), [researchLens, researchSearch]);
  const multiAssetQuotes = useMemo(() => new Map((multiAssetContext?.quotes ?? []).map((quote) => [quote.assetKey, quote])), [multiAssetContext]);
  const selectedResearch = researchRecords.find((record) => record.code === selectedResearchCode) ?? researchRecords[0];

  useEffect(() => {
    setPersonalNote(watchlist.find((item) => item.symbol === selectedResearch?.code)?.note ?? "");
  }, [selectedResearch?.code, watchlist]);

  const isOnWatchlist = Boolean(selectedResearch && watchlist.some((item) => item.symbol === selectedResearch.code));
  const saveWatchlist = () => {
    if (!selectedResearch) return;
    setWatchlist(upsertWatchlistItem(watchlist, selectedResearch.code, personalNote));
    toast.success(`${selectedResearch.code} bu cihazdaki izleme listesine kaydedildi.`);
  };
  const removeFromWatchlist = (symbol = selectedResearch?.code) => {
    if (!symbol) return;
    setWatchlist(removeWatchlistItem(watchlist, symbol));
    toast.message(`${symbol} izleme listesinden çıkarıldı.`);
  };
  const updateAlertPreference = (key: keyof DeviceAlertPreferences, value: boolean) => {
    const next = { ...alertPreferences, [key]: value };
    setAlertPreferences(next);
    persistAlertPreferences(next);
    toast.success("Uyarı tercihi bu cihazda kaydedildi.");
  };
  const refreshResearchStatus = async () => {
    setIsRefreshingResearchStatus(true);
    try {
      const [sourcesResponse, capabilitiesResponse, marketResponse] = await Promise.all([fetch("/api/source-status"), fetch("/api/research-capabilities"), fetch("/api/market-context")]);
      if (!sourcesResponse.ok || !capabilitiesResponse.ok || !marketResponse.ok) throw new Error("Kaynak durumu güncellenemedi.");
      const [sourcesPayload, capabilitiesPayload, marketPayload] = await Promise.all([sourcesResponse.json() as Promise<{ sources?: SourceStatus[] }>, capabilitiesResponse.json() as Promise<{ capabilities?: ResearchCapability[] }>, marketResponse.json() as Promise<MultiAssetContext>]);
      setSourceStatuses(sourcesPayload.sources ?? []);
      setCapabilities(capabilitiesPayload.capabilities ?? []);
      setMultiAssetContext(marketPayload);
      toast.success("Kaynak ve adapter durumu yenilendi.");
    } catch {
      toast.error("Kaynak durumunu yenilemek için bağlantı kurulamadı.");
    } finally {
      setIsRefreshingResearchStatus(false);
    }
  };
  const exportPersonalResearch = () => {
    const backup = createPersonalResearchBackup(watchlist, alertPreferences);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `gumus-avcisi-arastirma-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Cihazdaki araştırma yedeği indirildi.");
  };
  const importPersonalResearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const backup = parsePersonalResearchBackup(await file.text());
      restorePersonalResearchBackup(backup);
      setWatchlist(backup.watchlist);
      setAlertPreferences(backup.alertPreferences);
      toast.success(`${backup.watchlist.length} izleme kaydı içe aktarıldı.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Yedek dosyası okunamadı.");
    } finally {
      event.target.value = "";
    }
  };
  const clearDeviceResearch = () => {
    if (!window.confirm("Bu cihazdaki tüm izleme kayıtları, notlar ve uyarı tercihleri silinsin mi?")) return;
    clearPersonalResearchData();
    setWatchlist([]);
    setAlertPreferences(defaultAlertPreferences);
    setPersonalNote("");
    toast.message("Bu cihazdaki kişisel araştırma verileri silindi.");
  };

  const toggleTechnicalModel = (modelId: ScannerModelId) => {
    setSelectedTechnicalModels((current) => {
      if (current.includes(modelId)) return current.filter((id) => id !== modelId);
      if (current.length >= 3) {
        toast.message("Aynı anda en fazla üç teknik model karşılaştırılabilir.");
        return current;
      }
      return [...current, modelId];
    });
  };

  const exportScannerCsv = () => {
    if (!selectedTechnicalModels.length) {
      toast.message("Önce en az bir teknik model seçin.");
      return;
    }
    downloadScannerSchema(selectedTechnicalModels);
    toast.success("Seçili modellerin CSV şeması indirildi; gerçek sonuç satırları yalnızca tarihli BIST OHLCV bağlandığında eklenir.");
  };

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
              <div className="brand-seal flex items-center gap-3"><img src={LOGO} alt="Gümüş Avcısı radar simgesi" className="h-11 w-11 rounded-xl border border-white/12 bg-[#121513]/60 p-1.5 object-contain" /><div><p className="serif-title brand-wordmark text-xl leading-none text-white">Gümüş Avcısı</p><p className="mono mt-1.5 text-[9px] tracking-[.19em] text-[#aeb8af]">BIST ARAŞTIRMA MASASI</p></div></div>
              <div className="flex flex-wrap items-center gap-3"><span className="eyebrow flex items-center gap-2"><Radar size={14} />Radar aktif</span><span className="h-px w-8 bg-[#8ee19b]/45" /><span className="data-label text-[#b6beb6]">{bistSource ? <SourceStatusBadge status={bistSource.status} /> : "BIST durum kontrolü bekleniyor"}</span></div>
            </div>
            <div className="grid gap-10 pt-9 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
              <div className="intro-rise-delay max-w-[740px]">
                <h1 className="serif-title max-w-[700px] text-5xl leading-[.92] tracking-[-.045em] text-[#f2f3ee] sm:text-6xl md:text-7xl">BIST’te sinyali<br/><em className="text-[#b6c0b7]">kanıttan</em> ayırın.</h1>
                <p className="mt-7 max-w-[585px] text-[15px] leading-7 text-[#c1c8c1] sm:text-base">Gümüş Avcısı; Borsa İstanbul, KAP ve şirket yatırımcı ilişkileri kaynaklarını araştırma notlarına dönüştüren, veri eksiklerini görünür bırakan bir inceleme masasıdır.</p>
                <div className="mt-9 flex flex-wrap gap-3">
                  <a href="#sinyaller" className="inline-flex items-center gap-2 rounded-xl bg-[#8ee19b] px-4 py-3 text-sm font-bold text-[#182019] transition hover:-translate-y-0.5 hover:bg-[#b6efbe] active:scale-[.97]">Doğrulama kuyruğunu incele <ArrowDownRight size={17}/></a>
                  <a href="#metodoloji" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition hover:border-white/30 hover:bg-white/10 active:scale-[.97]">Yöntemi görün <BookOpen size={16}/></a>
                  <a href="/x-pro" className="inline-flex items-center gap-2 rounded-xl border border-[#edca72]/35 bg-[#edca72]/[.08] px-4 py-3 text-sm font-semibold text-[#f0d486] backdrop-blur transition hover:border-[#edca72]/60 hover:bg-[#edca72]/[.15] active:scale-[.97]">X Pro demo laboratuvarı <ArrowUpRight size={16}/></a>
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

        <section id="tarama" className="bg-[#0f1311] px-5 py-20 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-[1240px]">
            <div className="flex flex-col justify-between gap-7 border-b border-white/12 pb-8 lg:flex-row lg:items-end">
              <div className="max-w-2xl"><p className="eyebrow">01 / Tarama çalışma alanı</p><h2 className="serif-title mt-3 text-4xl leading-none tracking-[-.035em] text-white sm:text-5xl">Sıralama değil,<br/><em className="text-[#aeb8af]">izlenebilir araştırma.</em></h2><p className="mt-5 text-sm leading-7 text-[#adb7ad]">Paylaştığınız 100 puan, Bebek V2 ve proje notları tek ekranda tutulur. Her kartın yanında veri durumu gösterilir; tarihli KAP/IR belgesi olmayan satırlar canlı tarama sonucu gibi sunulmaz.</p></div>
              <div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f8a80]"/><input value={researchSearch} onChange={(event) => setResearchSearch(event.target.value)} placeholder="Kod veya araştırma notu ara" className="h-10 w-full rounded-xl border border-white/12 bg-[#171c19] pl-9 pr-3 text-sm text-white outline-none placeholder:text-[#687168] focus:border-[#8ee19b]/55 sm:w-[220px]" /></label></div>
            </div>

            <div className="mt-6 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Tarama türü">
              {(["Tümü", "Kalite 100", "Bebek V2", "Proje"] as const).map((lens) => <button key={lens} onClick={() => setResearchLens(lens)} className={`whitespace-nowrap rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition ${researchLens === lens ? "border-[#8ee19b]/45 bg-[#8ee19b]/12 text-[#b7efbf]" : "border-white/10 bg-white/[.035] text-[#aeb7ae] hover:border-white/25 hover:text-white"}`}>{lens === "Tümü" ? "Tüm çalışma notları" : lens}</button>)}
            </div>

            <div className="data-rail mt-6 grid gap-4 px-4 py-4 lg:grid-cols-[170px_minmax(0,1fr)]">
              <div><p className="data-label">Bebek hisse V1 filtresi</p><p className="mt-2 text-xs leading-5 text-[#c9d1c9]">Kural seti görünürdür; her uygulamada veri tarihi ve finansal dönem kaydedilmelidir.</p></div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{babyScreenPolicy.map(([label, rule, basis]) => <div key={label} className="rounded-xl border border-white/10 bg-white/[.025] px-3 py-2.5"><p className="text-[10px] text-[#9da89d]">{label}</p><p className="mt-1 text-xs font-semibold text-[#ecf0eb]">{rule}</p><p className="mt-1 mono text-[9px] text-[#7e8a7e]">{basis}</p></div>)}</div>
            </div>

            <div className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="grid gap-3 md:grid-cols-2">
                {filteredResearch.length ? filteredResearch.map((record) => <button key={`${record.lens}-${record.code}`} onClick={() => setSelectedResearchCode(record.code)} className={`group rounded-2xl border p-5 text-left transition ${selectedResearchCode === record.code ? "border-[#8ee19b]/45 bg-[#8ee19b]/[.09] shadow-[0_0_0_1px_rgba(142,225,155,.08)]" : "border-white/12 bg-[#161b18] hover:-translate-y-0.5 hover:border-white/25 hover:bg-[#1a201d]"}`}>
                  <div className="flex items-start justify-between gap-3"><div><p className="mono text-lg tracking-[.08em] text-white">{record.code}</p><p className="mt-1 text-[11px] text-[#8ee19b]">{record.lens}</p></div>{typeof record.score === "number" ? <div className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-right"><p className="mono text-sm text-white">{record.score}</p><p className="text-[8px] uppercase tracking-[.12em] text-[#8f9a8f]">/100 not</p></div> : <Layers3 className="h-5 w-5 text-[#8ab5e3]" />}</div>
                  <p className="mt-5 min-h-[40px] text-xs leading-5 text-[#c7cec7]">{record.thesis}</p>
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-3"><ResearchStateBadge state={record.dataState}/><ChevronRight className={`h-4 w-4 shrink-0 text-[#8ee19b] transition-transform ${selectedResearchCode === record.code ? "rotate-90" : "group-hover:translate-x-1"}`} /></div>
                </button>) : <div className="rounded-2xl border border-dashed border-white/15 bg-white/[.025] p-10 text-center md:col-span-2"><Search className="mx-auto h-6 w-6 text-[#6f796f]"/><p className="mt-3 text-sm text-[#bdc5bd]">Bu mercekte eşleşen çalışma notu yok.</p></div>}
              </div>

              {selectedResearch && <aside className="sticky top-[88px] h-fit overflow-hidden rounded-2xl border border-white/12 bg-[#1a201c] p-6">
                <div className="flex items-start justify-between gap-4"><div><p className="data-label">Araştırma kartı</p><h3 className="mono mt-3 text-3xl tracking-[.08em] text-white">{selectedResearch.code}</h3><p className="mt-1 text-xs text-[#8ee19b]">{selectedResearch.label}</p></div>{typeof selectedResearch.score === "number" && <div className="rounded-xl border border-[#8ee19b]/20 bg-[#8ee19b]/[.08] px-3 py-2 text-right"><p className="mono text-xl text-[#b7efbf]">{selectedResearch.score}<span className="text-xs">/100</span></p><p className="mt-1 text-[8px] uppercase tracking-[.13em] text-[#a3b2a4]">çalışma notu</p></div>}</div>
                <p className="mt-6 text-sm leading-6 text-[#c8d0c8]">{selectedResearch.thesis}</p>
                <div className="mt-5 grid grid-cols-2 gap-2">{selectedResearch.metrics.map((metric) => <div key={metric.label} className="rounded-xl border border-white/10 bg-black/15 p-3"><p className="text-[10px] leading-4 text-[#9aa59a]">{metric.label}</p><p className="mono mt-1 text-sm text-white">{metric.value}</p></div>)}</div>
                <div className="mt-5 border-t border-white/10 pt-4"><p className="data-label">Kriter kanıtı</p><div className="mt-3 grid grid-cols-2 gap-2">{recordCriteria(selectedResearch).map(([label, state]) => <div key={label} className="rounded-lg border border-white/8 bg-white/[.025] px-2.5 py-2"><p className="text-[9px] text-[#a7b0a7]">{label}</p><p className={`mt-1 text-[10px] ${state.includes("TBD") ? "text-[#d9c27d]" : "text-[#b6c2b6]"}`}>{state}</p></div>)}</div></div>
                <div className="mt-5 border-t border-white/10 pt-4"><ResearchStateBadge state={selectedResearch.dataState}/><p className="mt-3 text-xs leading-5 text-[#d5b278]"><span className="font-semibold text-[#ead38e]">Kontrol notu: </span>{selectedResearch.risk}</p></div>
                <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4"><a href="#model-masasi" className="rounded-lg border border-[#8ee19b]/25 bg-[#8ee19b]/[.07] px-2.5 py-2 text-[10px] font-semibold text-[#b7efbf] transition hover:bg-[#8ee19b]/15">Teknik modele bağla →</a><a href="#piyasalar" className="rounded-lg border border-white/10 bg-white/[.025] px-2.5 py-2 text-[10px] font-semibold text-[#cdd5cd] transition hover:bg-white/[.08]">Piyasa bağlamı →</a></div>
                <p className="mt-5 border-t border-white/10 pt-4 text-[10px] leading-4 text-[#8e998e]">Bu kartlar kullanıcının paylaştığı tarihsiz çalışma notlarından oluşturulmuştur. Güncel kaynak/raporlama dönemi bağlanana kadar tarama sonucu veya yatırım önerisi değildir.</p>
              </aside>}
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {marketBlankPanels.map(([title, metric, note], index) => <article key={title} className="relative overflow-hidden rounded-2xl border border-white/12 bg-[#151a17] p-5"><div className="flex items-center justify-between gap-3"><p className="data-label">{title}</p><span className="mono rounded-md border border-white/10 bg-black/15 px-2 py-1 text-[9px] text-[#9fa99f]">BAĞLI DEĞİL</span></div><p className="mt-5 text-sm font-semibold text-white">{metric}</p><p className="mt-2 min-h-[40px] text-xs leading-5 text-[#a8b2a8]">{note}</p><div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-3 text-[10px] text-[#7f8a7f]"><Layers3 size={13}/>{index === 3 ? "Liste ≠ alım listesi" : "Tarih/saatli veri bekleniyor"}</div></article>)}
            </div>
            <div className="mt-3 flex items-start gap-3 rounded-xl border border-[#d9c27d]/20 bg-[#d9c27d]/[.055] px-4 py-3 text-xs leading-5 text-[#d8cfb3]"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#ead38e]"/><p><span className="font-semibold text-[#f0ddac]">Kâr kalitesi filtresi:</span> yatırım faaliyeti, varlık satışı veya benzeri tek seferlik gelirler; FAVÖK, faaliyet nakit akışı ve tekrarlayan operasyonel performanstan ayrıştırılmadan puanlamaya olumlu katkı yapmaz.</p></div>
          </div>
        </section>

        <section id="model-masasi" className="relative overflow-hidden bg-[#121713] px-5 py-20 sm:px-8 lg:px-10">
          <div className="absolute inset-0 terminal-grid opacity-20" />
          <div className="relative mx-auto max-w-[1240px]">
            <div className="flex flex-col justify-between gap-6 border-b border-white/12 pb-8 lg:flex-row lg:items-end">
              <div className="max-w-2xl"><p className="eyebrow">02 / Teknik model masası</p><h2 className="serif-title mt-3 text-4xl leading-none tracking-[-.035em] text-white sm:text-5xl">Modeli seçin,<br/><em className="text-[#aeb8af]">kanıtı görün.</em></h2><p className="mt-5 text-sm leading-7 text-[#adb7ad]">Her model yalnızca kaynak URL’si, gözlem zamanı ve yeterli OHLCV geçmişi varsa çalışır. Eşleşme, teknik bir araştırma bulgusudur; alım-satım talimatı değildir.</p></div>
              <div className="rounded-2xl border border-[#8ee19b]/20 bg-[#8ee19b]/[.06] px-4 py-3"><p className="data-label text-[#b7efbf]">Seçili model</p><p className="mono mt-1 text-xl text-white">{selectedTechnicalModels.length} / 3</p></div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {TECHNICAL_SCANNER_MODELS.map((model) => {
                const selected = selectedTechnicalModels.includes(model.id);
                return <button key={model.id} onClick={() => toggleTechnicalModel(model.id)} aria-pressed={selected} className={`group min-h-[174px] rounded-2xl border p-5 text-left transition ${selected ? "border-[#8ee19b]/45 bg-[#8ee19b]/[.09] shadow-[0_0_0_1px_rgba(142,225,155,.08)]" : "border-white/12 bg-[#161b18] hover:-translate-y-0.5 hover:border-white/25 hover:bg-[#1a201d]"}`}><div className="flex items-start justify-between gap-4"><span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${selected ? "border-[#8ee19b]/35 bg-[#8ee19b]/15 text-[#b7efbf]" : "border-white/10 bg-black/15 text-[#a8b4a8]"}`}>{model.id === "macd-cross" ? <Activity size={18}/> : model.id === "volume-breakout" ? <BarChart3 size={18}/> : <Layers3 size={18}/>}</span><span className={`mono rounded-md border px-2 py-1 text-[9px] ${selected ? "border-[#8ee19b]/30 text-[#b7efbf]" : "border-white/10 text-[#899389]"}`}>{selected ? "SEÇİLİ" : "MODEL"}</span></div><h3 className="mt-5 text-sm font-bold text-white">{model.name}</h3><p className="mt-2 min-h-[38px] text-xs leading-5 text-[#a9b3a9]">{model.description}</p><div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3"><span className="mono text-[9px] text-[#8ee19b]">{model.parameters}</span><span className="mono text-right text-[9px] text-[#7d897d]">{model.defaultTimeframe}<br/>min. {model.minimumBars} bar</span></div></button>;
              })}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
              <article className="rounded-2xl border border-white/12 bg-[#101411] p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="data-label">Teknik sonuç çizelgesi</p><h3 className="serif-title mt-2 text-3xl text-white">OHLCV doğrulaması bekleniyor</h3></div><button onClick={exportScannerCsv} className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[.035] px-3.5 py-2.5 text-xs font-semibold text-[#d7ddd7] transition hover:bg-white/10"><Download size={15}/> CSV yapısı</button></div><div className="mt-5 flex flex-col gap-2 sm:flex-row"><label className="relative grow"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7f8a80]"/><input value={technicalSearch} onChange={(event) => setTechnicalSearch(event.target.value.toLocaleUpperCase("tr-TR"))} placeholder="Sembol ara (veri bağlandığında)" className="h-10 w-full rounded-xl border border-white/12 bg-[#161b18] pl-8 pr-3 text-xs text-white outline-none placeholder:text-[#718071] focus:border-[#8ee19b]/45" /></label><select value={technicalSort} onChange={(event) => setTechnicalSort(event.target.value as typeof technicalSort)} className="h-10 rounded-xl border border-white/12 bg-[#161b18] px-3 text-xs text-[#d7ddd7] outline-none focus:border-[#8ee19b]/45"><option value="match">Model uyumu</option><option value="symbol">Sembol</option><option value="observed">Gözlem zamanı</option></select></div><div className="mt-4 overflow-hidden rounded-xl border border-white/10"><div className="grid grid-cols-[1fr_1.2fr_.9fr] gap-3 bg-white/[.035] px-3 py-2.5 text-[9px] uppercase tracking-[.1em] text-[#8d978d] sm:grid-cols-[.7fr_1fr_1.2fr_.8fr]"><span>Sembol</span><span>Model</span><span className="hidden sm:block">Kaynak / gözlem</span><span className="text-right">Durum</span></div><div className="px-4 py-7 text-center"><p className="text-xs font-semibold text-[#d4e5f2]">Henüz yayımlanabilir teknik sonuç yok.</p><p className="mx-auto mt-2 max-w-[500px] text-[11px] leading-5 text-[#9eb2c1]">{technicalSearch ? `${technicalSearch} için arama kaydı bulunamadı; BIST OHLCV evreni henüz bağlı değil.` : "Lisanslı sağlayıcı bağlandığında satırlar; sembol, seçili model, kaynak URL’si, bar kapanışı, gözlem zamanı, gecikme ve eşleşme durumuyla burada sıralanır."}</p></div></div><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2">{selectedTechnicalModels.length ? selectedTechnicalModels.map((id) => <span key={id} className="rounded-lg border border-[#8ee19b]/25 bg-[#8ee19b]/[.08] px-2.5 py-1.5 text-[10px] font-semibold text-[#b7efbf]">{TECHNICAL_SCANNER_MODELS.find((model) => model.id === id)?.shortName}</span>) : <span className="text-xs text-[#929d92]">Karşılaştırmak için model seçin.</span>}</div><span className="mono text-[9px] text-[#7d897d]">SIRALAMA · {technicalSort === "match" ? "MODEL UYUMU" : technicalSort === "symbol" ? "SEMBOL" : "GÖZLEM ZAMANI"}</span></div></article>
              <article className="rounded-2xl border border-[#d9c27d]/20 bg-[#17150f] p-6"><p className="data-label text-[#ead38e]">Sonuç yayın protokolü</p><div className="mt-5 space-y-3 text-xs leading-5 text-[#c8c2ad]"><p><span className="font-semibold text-white">01 · Kaynak</span> Sağlayıcı adı ve kaynak URL’si kaydedilir.</p><p><span className="font-semibold text-white">02 · Zaman</span> Bar kapanışı, gözlem anı ve veri gecikmesi ayrı yazılır.</p><p><span className="font-semibold text-white">03 · Hesap</span> Model parametreleri her sonuçla birlikte gösterilir.</p><p><span className="font-semibold text-white">04 · Sınır</span> Sonuç teknik araştırma bağlamıdır; kişisel öneri değildir.</p></div></article>
            </div>
            <div className="mt-4 rounded-2xl border border-[#8ab5e3]/20 bg-[#8ab5e3]/[.045] p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="data-label text-[#b8d8ef]">Favori sembol · teknik bağlam</p><h3 className="mono mt-2 text-2xl tracking-[.08em] text-white">{isOnWatchlist && selectedResearch ? selectedResearch.code : "FAVORİ SEÇİLMEDİ"}</h3></div><span className={`rounded-md border px-2 py-1 mono text-[9px] ${isOnWatchlist ? "border-[#8ee19b]/25 bg-[#8ee19b]/[.08] text-[#b7efbf]" : "border-white/10 bg-white/[.03] text-[#aeb8ae]"}`}>{isOnWatchlist ? "CİHAZ FAVORİSİ" : "FAVORİ BEKLER"}</span></div>{isOnWatchlist && selectedResearch ? <><p className="mt-3 text-xs leading-5 text-[#c4d8e7]">{selectedResearch.code} için seçili model seti aşağıdadır. Tarihli BIST OHLCV gelmeden eşleşme, fiyat veya indikatör değeri gösterilmez.</p><div className="mt-4 flex flex-wrap gap-2">{selectedTechnicalModels.map((id) => <span key={id} className="rounded-lg border border-[#8ab5e3]/25 bg-[#0f1820] px-2.5 py-1.5 text-[10px] font-semibold text-[#c7e0f2]">{TECHNICAL_SCANNER_MODELS.find((model) => model.id === id)?.shortName}</span>)}</div><div className="mt-4 grid gap-2 border-t border-[#8ab5e3]/15 pt-3 text-[10px] sm:grid-cols-3"><p className="text-[#9eb4c2]">Kaynak: <span className="text-white">{bistSource?.label ?? "Lisanslı OHLCV bekleniyor"}</span></p><p className="text-[#9eb4c2]">Gözlem: <span className="text-white">{formatSourceTime(bistSource?.observedAt ?? null)}</span></p><p className="text-[#9eb4c2]">Durum: <span className="text-[#ead38e]">SONUÇ YOK · VERİ BEKLER</span></p></div></> : <p className="mt-3 text-xs leading-5 text-[#9eb4c2]">Tarama veya araştırma alanından bir sembolü cihaz favorilerine eklediğinizde, teknik model bağlamı bu panelde ayrı izlenir.</p>}</div>
            <div className="mt-4"><TechnicalChartPanel symbol={selectedResearch?.code ?? "SEMBOL"} bars={[]} sourceLabel={bistSource?.label ?? "BIST OHLCV adapteri · lisanslı kaynak bekleniyor"} sourceUrl={bistSource?.sourceUrl} observedAt={bistSource?.observedAt ?? null} lastSuccessfulAt={bistSource?.lastSuccessAt ?? null} delayMinutes={15} errorMessage={bistSource?.errorMessage ?? null} /></div>
          </div>
        </section>

        <section id="piyasalar" className="relative overflow-hidden bg-[#101411] px-5 py-20 sm:px-8 lg:px-10">
          <div className="absolute inset-0 noise opacity-60" />
          <div className="relative mx-auto max-w-[1240px]">
            <div className="flex flex-col justify-between gap-6 border-b border-white/12 pb-8 md:flex-row md:items-end"><div className="max-w-2xl"><p className="eyebrow">Piyasa bağlamı</p><h2 className="serif-title mt-3 text-4xl leading-none tracking-[-.035em] text-white sm:text-5xl">Tek varlık değil,<br/><em className="text-[#aeb8af]">veri rejimini izleyin.</em></h2><p className="mt-5 text-sm leading-7 text-[#adb7ad]">Döviz, Brent, ons altın ve kripto kartları API anahtarı bağlandığında kaynak, gözlem zamanı ve gecikme etiketiyle yenilenir.</p></div><Globe2 className="hidden h-10 w-10 text-[#8ab5e3] md:block"/></div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <article className="relative overflow-hidden rounded-2xl border border-white/12 bg-[#161b18] p-5"><div className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-[#8ee19b]/10 blur-2xl"/><div className="relative flex items-start justify-between gap-3"><div><p className="data-label">Pay piyasası</p><p className="mono mt-4 text-2xl text-white">XU100</p></div>{bistSource ? <SourceStatusBadge status={bistSource.status} /> : <span className="rounded-md border border-[#8ab5e3]/25 bg-[#8ab5e3]/[.08] px-2 py-1 mono text-[9px] text-[#aad0ef]">KONTROL BEKLER</span>}</div><p className="relative mt-4 text-xs text-[#c7cec7]">BIST 100 endeks bağlamı</p><div className="relative mt-5 flex items-end justify-between gap-3"><p className="mono text-xl text-white">—</p><p className="mono text-[9px] text-[#d9c27d]">FİYAT BAĞLI DEĞİL</p></div><div className="relative mt-4 border-t border-white/10 pt-3"><p className="text-[10px] leading-4 text-[#8d9d8d]">{bistSource?.label ?? "Borsa İstanbul kamu kaynak kontrolü"}</p><p className="mt-1 mono text-[9px] text-[#697669]">GÖZLEM · {formatSourceTime(bistSource?.observedAt ?? null)}</p>{bistSource?.sourceUrl && <a href={bistSource.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[9px] text-[#8ee19b] hover:underline">Kaynak URL <ExternalLink size={10}/></a>}</div></article>
              {multiAssetCards.map((asset) => {
              const assetKey = asset.symbol === "USD/TRY" ? "USD_TRY" : asset.symbol === "XAU/USD" ? "XAU_USD" : asset.symbol === "BTC/USD" ? "BTC_USD" : "BRENT";
              const quote = multiAssetQuotes.get(assetKey);
              const ready = multiAssetContext?.state === "READY" && quote;
              const unavailable = multiAssetContext?.unavailableAssetKeys.includes(assetKey);
                return <article key={asset.symbol} className="relative overflow-hidden rounded-2xl border border-white/12 bg-[#161b18] p-5"><div className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-[#8ab5e3]/10 blur-2xl"/><div className="relative flex items-start justify-between gap-3"><div><p className="data-label">{asset.label}</p><p className="mono mt-4 text-2xl text-white">{asset.symbol}</p></div><span className={`rounded-md border px-2 py-1 mono text-[9px] ${ready ? "border-[#8ee19b]/25 bg-[#8ee19b]/[.08] text-[#b7efbf]" : unavailable ? "border-[#d9c27d]/25 bg-[#d9c27d]/[.08] text-[#ead38e]" : "border-[#8ab5e3]/25 bg-[#8ab5e3]/[.08] text-[#aad0ef]"}`}>{ready ? "KAYNAKLI" : unavailable ? "KAPSAM BEKLER" : "API BEKLEMEDE"}</span></div><p className="relative mt-4 text-xs text-[#c7cec7]">{asset.detail}</p><div className="relative mt-5 flex items-end justify-between gap-3"><p className="mono text-xl text-white">{ready ? quote.price.toLocaleString("tr-TR", { maximumFractionDigits: 4 }) : "—"}</p>{ready && quote.percentChange !== null && <p className={`mono text-xs ${quote.percentChange >= 0 ? "text-[#8ee19b]" : "text-[#f0aaaa]"}`}>{quote.percentChange >= 0 ? "+" : ""}{quote.percentChange.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}%</p>}</div><div className="relative mt-4 border-t border-white/10 pt-3"><p className="text-[10px] leading-4 text-[#8d9d8d]">{ready ? quote.sourceLabel : asset.source}</p><p className="mt-1 mono text-[9px] text-[#697669]">{ready ? `GÖZLEM · ${formatSourceTime(quote.observedAt)}` : unavailable ? "DURUM · PLAN/EŞLEME" : `DURUM · ${multiAssetContext?.state ?? "BAĞLI DEĞİL"}`}</p></div></article>;
              })}
            </div>
            <article className="mt-4 rounded-2xl border border-white/12 bg-[#161b18] p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="data-label">Favori sembol · piyasa detay akışı</p><p className="mono mt-2 text-xl tracking-[.08em] text-white">{isOnWatchlist && selectedResearch ? selectedResearch.code : "SEMBOL SEÇİLMEDİ"}</p></div><span className={`rounded-md border px-2 py-1 mono text-[9px] ${isOnWatchlist ? "border-[#8ee19b]/25 bg-[#8ee19b]/[.08] text-[#b7efbf]" : "border-white/10 bg-white/[.03] text-[#aeb8ae]"}`}>{isOnWatchlist ? "İZLEMEDE" : "FAVORİ BEKLER"}</span></div>{isOnWatchlist && selectedResearch ? <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3"><div className="rounded-xl border border-white/8 bg-black/15 p-3"><p className="text-[#98a398]">Son fiyat</p><p className="mono mt-1 text-sm text-white">—</p><p className="mt-1 text-[10px] text-[#d9c27d]">Lisanslı BIST OHLCV bekleniyor</p></div><div className="rounded-xl border border-white/8 bg-black/15 p-3"><p className="text-[#98a398]">Kaynak/gözlem</p><p className="mt-1 text-[10px] text-white">{bistSource?.label ?? "BIST adapteri"}</p><p className="mt-1 text-[10px] text-[#9aa59a]">{formatSourceTime(bistSource?.observedAt ?? null)}</p></div><div className="rounded-xl border border-white/8 bg-black/15 p-3"><p className="text-[#98a398]">Cihaz notu</p><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-white">{personalNote || "Bu favori için not eklenmedi."}</p><p className="mt-1 text-[9px] text-[#8d998d]">Yalnızca cihazda saklanır</p></div></div> : <p className="mt-3 text-xs leading-5 text-[#a7b2a7]">İzleme listesine eklediğiniz sembolün fiyat, kaynak, gözlem ve kişisel notu burada bir arada görünür. Hesap-bazlı senkronizasyon B aşamasında ayrıca etkinleştirilir.</p>}</article>
            <p className="mt-5 text-[10px] leading-4 text-[#859085]">{multiAssetContext?.detail ?? "Kartlar, sağlayıcı kullanım koşulları doğrulanıp güvenli sunucu anahtarı eklendiğinde sayısal değer üretir. Kaynak veya zaman yoksa boş durum korunur."}</p>
          </div>
        </section>

        <section id="izleme" className="relative overflow-hidden bg-[#101411] px-5 py-20 sm:px-8 lg:px-10">
          <div className="absolute inset-0 terminal-grid opacity-20" />
          <div className="relative mx-auto max-w-[1240px]">
            <div className="flex flex-col justify-between gap-6 border-b border-white/12 pb-8 md:flex-row md:items-end"><div className="max-w-2xl"><p className="eyebrow">03 / Kişisel araştırma alanı</p><h2 className="serif-title mt-3 text-4xl leading-none tracking-[-.035em] text-white sm:text-5xl">İzleyin, not alın,<br/><em className="text-[#aeb8af]">kaynağı bekleyin.</em></h2><p className="mt-5 text-sm leading-7 text-[#adb7ad]">Aşama A bu tarayıcıdaki izleme listenizi, notlarınızı ve uyarı tercihlerinizi saklar. Hesap-bazlı senkronizasyon ile bildirim teslimi, üretim veri erişimi bağlandığında aynı sözleşmeye taşınır.</p></div><div className="rounded-xl border border-white/12 bg-white/[.035] px-4 py-3 text-xs text-[#b7c0b7]"><p className="data-label">Seçili araştırma</p><p className="mono mt-1 text-base text-white">{selectedResearch?.code ?? "—"}</p></div></div>

            <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[.025] p-3"><button onClick={refreshResearchStatus} disabled={isRefreshingResearchStatus} className="rounded-lg border border-[#8ee19b]/30 bg-[#8ee19b]/10 px-3 py-2 text-[11px] font-semibold text-[#b7efbf] transition hover:bg-[#8ee19b]/20 disabled:cursor-wait disabled:opacity-60">{isRefreshingResearchStatus ? "Kontrol ediliyor…" : "Kaynak durumunu yenile"}</button><button onClick={exportPersonalResearch} className="rounded-lg border border-white/12 px-3 py-2 text-[11px] font-semibold text-[#dce3dc] transition hover:bg-white/10">Yedeği indir</button><button onClick={() => importInputRef.current?.click()} className="rounded-lg border border-white/12 px-3 py-2 text-[11px] font-semibold text-[#dce3dc] transition hover:bg-white/10">Yedeği içe aktar</button><button onClick={clearDeviceResearch} className="ml-auto rounded-lg px-2 py-2 text-[11px] text-[#aeb8ae] transition hover:bg-white/10 hover:text-[#f0aaaa]">Cihaz verisini sil</button><input ref={importInputRef} type="file" accept="application/json,.json" onChange={importPersonalResearch} className="hidden" /><span className="basis-full text-[10px] leading-4 text-[#879187]">Yedek dosyası yalnızca izleme listesi, notlar ve uyarı tercihlerini içerir; fiyat veya KAP verisi içermez. Yeni cihazda “Yedeği içe aktar” seçeneğini kullanın.</span></div>

            <div className="mt-8 grid gap-4 xl:grid-cols-[.94fr_1.06fr]">
              <div className="rounded-2xl border border-white/12 bg-[#161b18] p-6"><div className="flex items-center justify-between gap-4"><div><p className="data-label">İzleme listesi</p><p className="mt-2 text-sm font-semibold text-white">Bu cihazda {watchlist.length} kayıt</p></div><button onClick={isOnWatchlist ? () => removeFromWatchlist() : saveWatchlist} className={`rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition ${isOnWatchlist ? "border-[#e5c982]/30 bg-[#e5c982]/10 text-[#ead38e]" : "border-[#8ee19b]/40 bg-[#8ee19b]/10 text-[#b7efbf]"}`}>{isOnWatchlist ? "Seçili kaydı çıkar" : "Seçili kaydı ekle"}</button></div>
                <label className="mt-5 block"><span className="data-label">{selectedResearch?.code ?? "Seçili kayıt"} için not</span><textarea value={personalNote} onChange={(event) => setPersonalNote(event.target.value)} placeholder="Hangi belgeyi, dönemi veya riski takip edeceğinizi yazın…" className="mt-2 min-h-[92px] w-full resize-y rounded-xl border border-white/12 bg-black/15 p-3 text-xs leading-5 text-white outline-none placeholder:text-[#758075] focus:border-[#8ee19b]/45" /></label><button onClick={saveWatchlist} className="mt-3 text-xs font-semibold text-[#b7efbf] hover:text-white">Notu ve seçili kaydı kaydet →</button>
                <div className="mt-5 rounded-xl border border-[#8ab5e3]/20 bg-[#8ab5e3]/[.05] p-3"><p className="data-label text-[#b8d8ef]">Bağlı çalışma alanları</p><div className="mt-2 flex flex-wrap gap-1.5">{selectedTechnicalModels.length ? selectedTechnicalModels.map((id) => <span key={id} className="rounded-md border border-[#8ab5e3]/20 px-2 py-1 text-[9px] text-[#c7e0f2]">{TECHNICAL_SCANNER_MODELS.find((model) => model.id === id)?.shortName}</span>) : <span className="text-[10px] text-[#93a9b9]">Teknik model seçilmedi.</span>}</div><div className="mt-3 flex flex-wrap gap-2"><a href="#model-masasi" className="text-[10px] font-semibold text-[#b7efbf] hover:text-white">Teknik sonucu aç →</a><a href="#piyasalar" className="text-[10px] font-semibold text-[#c7e0f2] hover:text-white">Piyasa kartlarını aç →</a></div><p className="mt-2 text-[9px] leading-4 text-[#8ea4b3]">Seçili modeller bu oturumdaki analiz bağlamıdır; cihaz yedeğinde saklanan kişisel kayıt yalnızca sembol ve nottur.</p></div>
                <div className="mt-4 border-t border-white/10 pt-4">{watchlist.length ? <div className="space-y-2">{watchlist.map((item) => <div key={item.symbol} className="flex items-start justify-between gap-3 rounded-xl border border-white/8 bg-white/[.025] px-3 py-3"><button onClick={() => setSelectedResearchCode(item.symbol)} className="text-left"><p className="mono text-sm text-white">{item.symbol}</p><p className="mt-1 line-clamp-1 text-[10px] text-[#9da89d]">{item.note || "Not eklenmedi"}</p></button><button onClick={() => removeFromWatchlist(item.symbol)} aria-label={`${item.symbol} kaydını çıkar`} className="rounded-md p-1.5 text-[#9fa99f] transition hover:bg-white/10 hover:text-white"><X size={14}/></button></div>)}</div> : <div className="rounded-xl border border-dashed border-white/15 bg-white/[.02] p-5 text-center"><Layers3 className="mx-auto h-5 w-5 text-[#788478]"/><p className="mt-2 text-xs text-[#aeb7ae]">Henüz kişisel izleme kaydı yok.</p></div>}</div>
                <p className="mt-4 text-[10px] leading-4 text-[#7e897e]">Bu aşamada kayıtlar yalnızca bu tarayıcının yerel saklama alanında tutulur. Ortak cihazlarda kişisel not saklamayın.</p></div>

              <div className="grid gap-4"><div className="rounded-2xl border border-white/12 bg-[#161b18] p-6"><div className="flex items-center justify-between"><div><p className="data-label">Uyarı tercihleri</p><p className="mt-2 text-sm font-semibold text-white">Kaynak olayı temelli, fiyat hedefi değil</p></div><CircleAlert className="h-5 w-5 text-[#d9c27d]"/></div><div className="mt-5 space-y-3">{[["sourceStatusChanges", "Kaynak durumu değişirse", "BIST/KAP adapteri hata, gecikme veya hazır durumuna geçerse"], ["verifiedCatalysts", "Doğrulanmış katalizör olayı", "Yalnızca lisanslı KAP akışı veya tarihli kaynak belgesi bağlandığında"], ["inAppEnabled", "Araştırma ekranı uyarıları", "Uyarıları bu cihazdaki araştırma alanında tut"]].map(([key, title, detail]) => <label key={key} className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-white/8 bg-white/[.025] p-3"><span><span className="block text-xs font-semibold text-[#e1e6e1]">{title}</span><span className="mt-1 block text-[10px] leading-4 text-[#939e93]">{detail}</span></span><input type="checkbox" checked={alertPreferences[key as keyof DeviceAlertPreferences]} onChange={(event) => updateAlertPreference(key as keyof DeviceAlertPreferences, event.target.checked)} className="mt-1 h-4 w-4 accent-[#8ee19b]" /></label>)}</div></div>
                <div className="rounded-2xl border border-[#8ab5e3]/20 bg-[#8ab5e3]/[.055] p-6"><p className="data-label text-[#b8d8ef]">B aşaması · veri adapterleri</p><div className="mt-4 space-y-3">{capabilities.length ? capabilities.map((capability) => <div key={capability.sourceKey} className="rounded-xl border border-white/10 bg-[#101311]/60 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-white">{capability.label}</p><p className="mt-1 text-[10px] leading-4 text-[#a4b7c5]">{capability.detail}</p></div><span className={`mono shrink-0 rounded-md border px-2 py-1 text-[9px] ${capability.state === "READY" ? "border-[#8ee19b]/30 text-[#b7efbf]" : capability.state === "ERROR" ? "border-[#e98282]/30 text-[#f0aaaa]" : "border-[#8ab5e3]/25 text-[#aad0ef]"}`}>{capability.state === "READY" ? "HAZIR" : capability.state === "ERROR" ? "ERİŞİM HATASI" : capability.state === "CONFIG_REQUIRED" ? "AYAR BEKLİYOR" : "LİSANS GEREKİR"}</span></div></div>) : <p className="text-xs leading-5 text-[#a4b7c5]">Adapter durumu alınamadı; kaynaklar bu aşamada kapalı kabul edilir.</p>}</div><p className="mt-4 text-[10px] leading-4 text-[#90a5b4]">Anahtarlar tanımlanana kadar bu alanlar fiyat, hacim, bildirim veya sinyal üretmez. Sağlayıcı anahtarları geldikten sonra yalnızca sunucu tarafında güvenli ortam değişkeni olarak eklenir.</p></div></div>
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

        <section id="teknik" className="relative overflow-hidden bg-[#151917] px-5 py-20 sm:px-8 lg:px-10">
          <div className="absolute inset-0 terminal-grid opacity-25" />
          <div className="relative mx-auto max-w-[1240px]">
            <div className="max-w-2xl"><p className="eyebrow">03 / Bağlam ve veri rehberi</p><h2 className="serif-title mt-3 text-4xl leading-none tracking-[-.035em] text-white sm:text-5xl">Etiketi okuyun,<br/><em className="text-[#aeb8af]">veriyi değil varsayımı</em> takip edin.</h2><p className="mt-5 text-sm leading-7 text-[#adb7ad]">BIST ve KAP etiketleri “hangi veri bugün kullanıma hazır?” sorusunu yanıtlar. Teknik zaman dilimleri ise karar değil; belge ve finansal araştırmanın piyasa bağlamıdır.</p></div>

            <div className="mt-10 grid gap-4 lg:grid-cols-2">
              <article className="rounded-2xl border border-[#8ee19b]/20 bg-[#111713] p-6"><div className="flex items-center justify-between gap-4"><div><p className="data-label text-[#b7efbf]">BIST kaynak durumu</p><h3 className="serif-title mt-2 text-3xl text-white">{bistSource ? <SourceStatusBadge status={bistSource.status} /> : "Kontrol bekleniyor"}</h3></div><ShieldCheck className="h-7 w-7 text-[#8ee19b]" /></div><div className="mt-6 space-y-3 border-t border-white/10 pt-4 text-xs leading-5 text-[#bcc6bc]"><p><span className="font-semibold text-white">Ne kontrol ediliyor?</span> Her istek Borsa İstanbul’un herkese açık piyasa veri sayfasına ulaşılabildiğini sınar. Başarılı yanıt, sayfanın erişilebilir olduğunu gösterir; fiyat serisinin gerçek zamanlı olduğu anlamına gelmez.</p><p><span className="font-semibold text-white">“15 dk gecikmeli” neden var?</span> Herkese açık BIST ekranı gecikmeli veri rejimindedir. Bu yüzden arayüz, gecikmeyi açıkça yazar ve doğrulanmış canlı fiyat/hacim yokken rakam üretmez.</p><p className="mono text-[10px] text-[#8ee19b]">GÖZLEM · {formatSourceTime(bistSource?.observedAt ?? null)}</p></div></article>
              <article className="rounded-2xl border border-[#d9c27d]/20 bg-[#17150f] p-6"><div className="flex items-center justify-between gap-4"><div><p className="data-label text-[#ead38e]">KAP veri durumu</p><h3 className="serif-title mt-2 text-3xl text-white">{kapSource ? <SourceStatusBadge status={kapSource.status} /> : "KAP API beklemede"}</h3></div><FileCheck2 className="h-7 w-7 text-[#d9c27d]" /></div><div className="mt-6 space-y-3 border-t border-white/10 pt-4 text-xs leading-5 text-[#c8c2ad]"><p><span className="font-semibold text-white">Ne anlama geliyor?</span> KAP’ın ayrıntılı, makinece işlenebilir bildirim akışı için lisanslı REST API erişimi gerekir. Bu anahtar yokken bildirim metni otomatik taranmaz ve yeni katalizör puanı üretilmez.</p><p><span className="font-semibold text-white">Mevcut kartlar ne?</span> Dashboarddaki KAP kartları tarihli kaynak URL’si bulunan araştırma notlarıdır. KAP API etkinleşene kadar yeni bildirim akışı veya “anlık KAP taraması” iddiası yoktur.</p><p className="text-[10px] leading-4 text-[#ead38e]">DURUM NOTU · {kapSource?.errorMessage ?? "Lisanslı API erişimi bekleniyor."}</p></div></article>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
              <article className="rounded-2xl border border-white/12 bg-[#101311] p-6"><p className="data-label">100 puan modelinin taslağı</p><div className="mt-5 space-y-3">{scoreParts.map(([title, detail, weight]) => <div key={title} className="grid grid-cols-[1fr_auto] gap-4 rounded-xl border border-white/8 bg-white/[.025] px-4 py-3"><div><p className="text-sm font-semibold text-[#edf0eb]">{title}</p><p className="mt-1 text-[11px] leading-4 text-[#9ba59b]">{detail}</p></div><div className="mono text-lg text-[#8ee19b]">{weight}</div></div>)}</div><p className="mt-5 text-[10px] leading-4 text-[#838f83]">Bu ağırlıklar ürün taslağıdır. Hesaplanan skor ancak her alt metriğin dönem tarihi, kaynak URL’si ve formülü kaydedildiğinde aktif olur.</p></article>
              <article className="rounded-2xl border border-white/12 bg-[#101311] p-6"><p className="data-label">Zaman dilimi bağlamı</p><div className="mt-5 overflow-hidden rounded-xl border border-white/10"><div className="grid grid-cols-[1fr_1fr] border-b border-white/10 bg-white/[.035] px-4 py-2.5 text-[10px] uppercase tracking-[.12em] text-[#899389]"><span>Üst bağlam</span><span>Alt inceleme</span></div>{[["Haftalık", "Günlük / 4 saatlik"], ["Günlük", "4 saatlik / 1 saatlik"], ["4 saatlik", "30 / 15 dakikalık"], ["1 saatlik", "15 / 5 dakikalık"]].map(([higher, lower]) => <div key={higher} className="grid grid-cols-[1fr_1fr] border-b border-white/8 px-4 py-3 text-xs text-[#c4ccc4] last:border-0"><span>{higher}</span><span className="text-[#9da99d]">{lower}</span></div>)}</div><div className="mt-5 rounded-xl border border-[#8ab5e3]/20 bg-[#8ab5e3]/[.06] p-4 text-xs leading-5 text-[#b8cde0]"><p className="font-semibold text-[#d5e6f6]">Kullanım sınırı</p><p className="mt-1">Üst zaman dilimi bağlamı, alt zaman dilimi ise teyit dili içindir. Sistem CRT/CISD/OTE/MSS gibi etiketleri kesin giriş-çıkış sinyali olarak üretmez.</p></div></article>
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
