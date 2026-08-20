import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Database,
  Filter,
  Gauge,
  History,
  Radar,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  Star,
  XCircle,
} from "lucide-react";
import { TechnicalChartPanel } from "@/components/TechnicalChartPanel";
import { readXProFavorites, toggleXProFavorite, writeXProFavorites, type XProFavorite } from "@/lib/xproFavorites";

type ScoreFactor = { key: string; label: string; points: number; maximumPoints: number; detail: string; direction: "BOOST" | "DRAG" | "NEUTRAL" };
type ScoreProfile = { qualityScore: number | null; earlyScore: number | null; opportunityScore: number | null; riskScore: number | null; riskLevel: string; isEarlyCandidate: boolean; qualityFactors: ScoreFactor[]; earlyFactors: ScoreFactor[]; riskFactors: ScoreFactor[]; blockers: string[]; indicators: { close: number | null; sma20: number | null; sma50: number | null; sma200: number | null; rsi14: number | null; relativeVolume: number | null; atrPercent: number | null; momentum20Percent: number | null; distanceTo52WeekHighPercent: number | null } };
type XProRow = { symbol: string; companyName: string; sector: string; dataMode: "DEMO" | "LIVE"; sourceLabel: string; observedAt: string; price: number; changePercent: number; volume: number; candles: { timestamp: string; open: number; high: number; low: number; close: number; volume: number }[]; metrics: { marketCap: number | null; freeFloatPercent: number | null; pe: number | null; pb: number | null; evEbitda: number | null; revenueGrowthPercent: number | null; ebitdaGrowthPercent: number | null; netProfitGrowthPercent: number | null; roePercent: number | null; roicPercent: number | null; netDebtToEbitda: number | null; freeCashFlow: number | null }; kapEvents: { subject: string; dataMode: "DEMO" | "LIVE" }[]; scores: ScoreProfile };
type Overview = { provider: { id: string; label: string; state: string; mode: "DEMO" | "LIVE"; detail: string }; requestedProviderId: string; fallbackApplied: boolean; generatedAt: string; dataQualityScore: number; qualityIssues: string[]; observations: XProRow[] };

const number = (value: number | null | undefined, digits = 0) => value === null || value === undefined ? "—" : new Intl.NumberFormat("tr-TR", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
const scoreTone = (score: number | null) => score === null ? "text-[#9ca79c]" : score >= 70 ? "text-[#86e49a]" : score >= 50 ? "text-[#ecd68e]" : "text-[#f29b98]";
const badge = (value: string) => value === "DEMO" ? "border-[#edca72]/40 bg-[#edca72]/[.09] text-[#f0d486]" : "border-[#88dfa0]/40 bg-[#88dfa0]/[.09] text-[#b8efc2]";

export default function XProDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [minimumQuality, setMinimumQuality] = useState(60);
  const [minimumEarly, setMinimumEarly] = useState(45);
  const [maximumRisk, setMaximumRisk] = useState(65);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [factorTab, setFactorTab] = useState<"quality" | "early" | "risk">("quality");
  const [chartRange, setChartRange] = useState<"1D" | "5D" | "1M" | "3M" | "6M" | "1Y" | "5Y">("1Y");
  const [favorites, setFavorites] = useState<XProFavorite[]>(() => readXProFavorites());

  const loadOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/xpro-overview");
      if (!response.ok) throw new Error(`X Pro overview HTTP ${response.status}`);
      const next = await response.json() as Overview;
      setOverview(next);
      setSelectedSymbol((current) => current ?? next.observations[0]?.symbol ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "X Pro demo verisi alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadOverview(); }, []);

  const rows = overview?.observations ?? [];
  const filteredRows = useMemo(() => rows.filter((row) => {
    const term = search.trim().toLocaleUpperCase("tr-TR");
    const matchesSearch = !term || `${row.symbol} ${row.companyName} ${row.sector}`.toLocaleUpperCase("tr-TR").includes(term);
    const profile = row.scores;
    const passes = (profile.qualityScore ?? -1) >= minimumQuality && (profile.earlyScore ?? -1) >= minimumEarly && (profile.riskScore ?? 101) <= maximumRisk;
    return matchesSearch && passes;
  }), [rows, search, minimumQuality, minimumEarly, maximumRisk]);
  const selected = rows.find((row) => row.symbol === selectedSymbol) ?? rows[0] ?? null;
  const factors = selected ? factorTab === "quality" ? selected.scores.qualityFactors : factorTab === "early" ? selected.scores.earlyFactors : selected.scores.riskFactors : [];
  const earlyRows = rows.filter((row) => row.scores.isEarlyCandidate);
  const excludedRows = rows.filter((row) => !filteredRows.some((candidate) => candidate.symbol === row.symbol));
  const chartBarsByRange = { "1D": 1, "5D": 5, "1M": 21, "3M": 63, "6M": 126, "1Y": 252, "5Y": 1260 } as const;
  const selectedChartBars = selected ? selected.candles.slice(-chartBarsByRange[chartRange]) : [];
  const isFavorite = selected ? favorites.some((item) => item.symbol === selected.symbol) : false;
  const toggleFavorite = () => {
    if (!selected) return;
    const next = toggleXProFavorite(favorites, selected);
    setFavorites(next);
    writeXProFavorites(next);
  };

  return <main className="min-h-screen bg-[#0b100d] text-[#eef4ed] selection:bg-[#86e49a]/25">
    <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <a href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-[#aeb8ae] transition hover:text-white"><ArrowLeft size={15}/> Araştırma masasına dön</a>
        <div className="flex items-center gap-2"><a href="/x-pro/methodology" className="hidden rounded-lg border border-white/12 bg-white/[.04] px-3 py-2 text-xs font-semibold text-[#dbe5db] transition hover:bg-white/[.1] sm:inline-flex">Metodoloji</a><span className="mono rounded-full border border-[#edca72]/35 bg-[#edca72]/[.08] px-3 py-1.5 text-[10px] tracking-[.12em] text-[#f1d688]">DEMO / SENTETİK</span><button onClick={() => void loadOverview()} className="inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/[.04] px-3 py-2 text-xs font-semibold text-[#dbe5db] transition hover:bg-white/[.1]"><RefreshCw size={14} className={loading ? "animate-spin" : ""}/> Yenile</button></div>
      </header>

      <section className="grid gap-5 py-8 lg:grid-cols-[1.3fr_.7fr]">
        <div><p className="mono text-[10px] tracking-[.2em] text-[#8de69e]">GÜMÜŞ AVCISI X PRO · BIST EARLY DETECTION ENGINE</p><h1 className="serif-title mt-4 max-w-4xl text-4xl leading-[.95] text-white sm:text-6xl">Veriyi ayırın.<br/><em className="text-[#a9cdb0]">İddiayı açıklayın.</em></h1><p className="mt-5 max-w-2xl text-sm leading-6 text-[#aeb9ae]">Bu çalışma alanı, sağlayıcı bağımsız skor ve risk mimarisinin sentetik demo görünümüdür. Ekrandaki semboller, fiyatlar, hacimler ve olaylar gerçek BIST kaydı ya da yatırım görüşü değildir.</p></div>
        <aside className="rounded-2xl border border-[#edca72]/30 bg-[#201b10] p-5"><div className="flex items-start justify-between gap-3"><div><p className="data-label text-[#f0d486]">VERİ DURUMU</p><h2 className="mt-2 text-xl font-semibold text-white">Canlı bağlantı yok</h2></div><Database className="h-5 w-5 text-[#f0d486]"/></div><p className="mt-4 text-xs leading-5 text-[#dccb96]">{overview?.provider.detail ?? "Demo provider yükleniyor."}</p><div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#edca72]/15 pt-4 text-[10px]"><span className="text-[#aa9d76]">Aktif sağlayıcı</span><span className="mono text-right text-white">{overview?.provider.label ?? "—"}</span><span className="text-[#aa9d76]">Gözlem</span><span className="mono text-right text-white">{overview ? new Date(overview.generatedAt).toLocaleString("tr-TR") : "—"}</span></div></aside>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Taranan demo senaryo" value={loading ? "…" : String(rows.length)} detail="Kurgusal sembol" icon={Radar}/>
        <Metric label="Erken aday" value={loading ? "…" : String(earlyRows.length)} detail="Eşikler birlikte sağlanır" icon={Sparkles}/>
        <Metric label="Provider modu" value={overview?.provider.mode ?? "—"} detail={overview?.fallbackApplied ? "Canlı provider hazır değil → demo" : "Aktif adapter"} icon={Database}/>
        <Metric label="Veri kalite puanı" value={overview ? `${overview.dataQualityScore}/100` : "—"} detail="Demo canlı kalite puanı taşımaz" icon={ShieldAlert}/>
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section id="xpro-screen" className="rounded-2xl border border-white/12 bg-[#111713] p-4 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="data-label">X PRO TARAMA LABORATUVARI</p><h2 className="serif-title mt-2 text-3xl text-white">Adaylar & erken hareketler</h2></div><span className="mono text-[10px] text-[#9ca89c]">SONUÇLAR · DEMO / SENTETİK</span></div>
            <div className="mt-5 grid gap-3 rounded-xl border border-white/8 bg-black/15 p-3 lg:grid-cols-[1.3fr_.7fr_.7fr_.7fr]"><label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829082]"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Demo sembol veya senaryo ara" className="h-10 w-full rounded-lg border border-white/10 bg-[#161d18] pl-9 pr-3 text-xs text-white outline-none placeholder:text-[#718071] focus:border-[#86e49a]/45"/></label><RangeControl label="Kalite min." value={minimumQuality} setValue={setMinimumQuality}/><RangeControl label="Early min." value={minimumEarly} setValue={setMinimumEarly}/><RangeControl label="Risk max." value={maximumRisk} setValue={setMaximumRisk}/></div>
            <div className="mt-4 overflow-x-auto rounded-xl border border-white/10"><table className="min-w-[760px] w-full text-left text-xs"><thead className="bg-white/[.035] text-[9px] uppercase tracking-[.12em] text-[#8e998e]"><tr><th className="px-4 py-3">Sembol</th><th className="px-3 py-3 text-center">Kalite</th><th className="px-3 py-3 text-center">Early</th><th className="px-3 py-3 text-center">Risk</th><th className="px-3 py-3 text-right">Demo fiyat</th><th className="px-4 py-3 text-right">Durum</th></tr></thead><tbody>{filteredRows.length ? filteredRows.map((row) => <tr key={row.symbol} onClick={() => setSelectedSymbol(row.symbol)} className={`cursor-pointer border-t border-white/7 transition hover:bg-white/[.04] ${selected?.symbol === row.symbol ? "bg-[#86e49a]/[.045]" : ""}`}><td className="px-4 py-3"><p className="mono font-semibold text-white">{row.symbol}</p><p className="mt-1 text-[10px] text-[#8e9a8e]">{row.sector}</p></td><td className={`px-3 py-3 text-center mono font-semibold ${scoreTone(row.scores.qualityScore)}`}>{number(row.scores.qualityScore)}</td><td className={`px-3 py-3 text-center mono font-semibold ${scoreTone(row.scores.earlyScore)}`}>{number(row.scores.earlyScore)}</td><td className={`px-3 py-3 text-center mono font-semibold ${scoreTone(100 - (row.scores.riskScore ?? 100))}`}>{number(row.scores.riskScore)}</td><td className="px-3 py-3 text-right"><p className="mono text-white">{number(row.price, 2)}</p><p className={row.changePercent >= 0 ? "mt-1 text-[10px] text-[#86e49a]" : "mt-1 text-[10px] text-[#f19b98]"}>{row.changePercent >= 0 ? "+" : ""}{number(row.changePercent, 2)}%</p></td><td className="px-4 py-3 text-right"><span className={`rounded-md border px-2 py-1 mono text-[9px] ${badge(row.dataMode)}`}>{row.scores.isEarlyCandidate ? "ERKEN ADAY" : "İZLEME"}</span></td></tr>) : <tr><td colSpan={6} className="px-4 py-10 text-center text-[#aab5aa]"><Filter className="mx-auto mb-3 h-5 w-5 text-[#849184]"/>Bu eşiklerde demo satırı yok. Eşikler değiştirildiğinde filtre yeniden çalışır; gerçek veri sonucu üretilmez.</td></tr>}</tbody></table></div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2"><Panel title="Yeni erken adaylar" icon={Sparkles} accent="green"><CandidateList rows={earlyRows} empty="Demo eşikleriyle erken aday oluşmadı. Early Score ile kalite skoru birbirinden ayrıdır."/></Panel><Panel title="Hacim & trend hareketleri" icon={TrendingUp} accent="blue"><CandidateList rows={[...rows].sort((a, b) => (b.scores.earlyScore ?? 0) - (a.scores.earlyScore ?? 0)).slice(0, 3)} empty="Yükleniyor"/></Panel><Panel title="KAP hareketleri" icon={CircleAlert} accent="yellow"><p className="text-xs leading-5 text-[#d4c89e]">Demo olayları gerçek KAP bildirimi değildir ve skora katkı vermez. Lisanslı KAP akışı geldiğinde kaynak URL’si, yayın zamanı ve kategori zorunlu olur.</p><p className="mono mt-4 text-[10px] text-[#f0d486]">DEMO OLAYI · SKOR KATKISI 0</p></Panel><Panel title="Riskli hareketler" icon={AlertTriangle} accent="red"><CandidateList rows={[...rows].sort((a, b) => (b.scores.riskScore ?? 0) - (a.scores.riskScore ?? 0)).slice(0, 3)} empty="Yükleniyor" risk/></Panel></section>

          <section className="rounded-2xl border border-[#edca72]/20 bg-[#edca72]/[.04] p-5"><div className="flex items-start justify-between gap-3"><div><p className="data-label text-[#f0d486]">X PRO FAVORİLER</p><h2 className="serif-title mt-2 text-2xl text-white">Başlangıç anı saklanır</h2></div><Star className="h-5 w-5 text-[#f0d486]"/></div>{favorites.length ? <div className="mt-4 grid gap-2 sm:grid-cols-2">{favorites.map((favorite) => { const row = rows.find((item) => item.symbol === favorite.symbol); return <button key={favorite.symbol} onClick={() => setSelectedSymbol(favorite.symbol)} className="rounded-xl border border-[#edca72]/15 bg-black/15 p-3 text-left transition hover:bg-white/[.04]"><div className="flex items-center justify-between"><span className="mono text-xs font-semibold text-white">{favorite.symbol}</span><span className="text-[9px] text-[#f0d486]">{favorite.dataMode}</span></div><p className="mt-2 text-[10px] leading-5 text-[#c8b887]">Başlangıç: Q {number(favorite.baseline.qualityScore)} · E {number(favorite.baseline.earlyScore)} · R {number(favorite.baseline.riskScore)}</p><p className="text-[9px] text-[#9c906e]">Δ skor / fiyat / hacim: tarihsel ikinci gözlem bekliyor</p>{row ? <p className="mt-1 text-[9px] text-[#aeb9ae]">Güncel demo görünümü: Q {number(row.scores.qualityScore)} · fiyat {number(row.price, 2)}</p> : null}</button>; })}</div> : <p className="mt-3 text-xs leading-5 text-[#c8b887]">Bir demo sembolünü sağdaki detay panelinden favoriye ekleyin. Demo modunda değişim metrikleri ikinci tarihsel gözlem olmadan üretilmez.</p>}</section>

          <section id="xpro-excluded" className="rounded-2xl border border-white/12 bg-[#141714] p-5"><div className="flex items-start justify-between gap-3"><div><p className="data-label">ELENENLER / NEDEN SEÇİLMEDİ?</p><h2 className="serif-title mt-2 text-2xl text-white">Kural görünürlüğü</h2></div><XCircle className="h-5 w-5 text-[#ee9c98]"/></div><div className="mt-4 space-y-2">{excludedRows.length ? excludedRows.map((row) => <div key={row.symbol} className="rounded-xl border border-white/8 bg-black/15 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><span className="mono text-xs font-semibold text-white">{row.symbol}</span><span className="text-[10px] text-[#eeaaa5]">Eşikler karşılanmadı</span></div><p className="mt-2 text-[11px] leading-5 text-[#aeb8ae]">Kalite {number(row.scores.qualityScore)} / {minimumQuality} · Early {number(row.scores.earlyScore)} / {minimumEarly} · Risk {number(row.scores.riskScore)} / {maximumRisk}. Bu açıklama demo kural motorudur; gerçek yatırım sonucu değildir.</p></div>) : <p className="text-xs text-[#aeb8ae]">Tüm görünen satırlar seçili eşikleri geçti.</p>}</div></section>

          <section id="xpro-backtest" className="rounded-2xl border border-[#8ab5e3]/20 bg-[#8ab5e3]/[.045] p-5"><div className="flex items-start justify-between gap-3"><div><p className="data-label text-[#bcdcf4]">BACKTEST & MODEL VALIDATION</p><h2 className="serif-title mt-2 text-2xl text-white">Hazır sözleşme, sonuç yok</h2></div><History className="h-5 w-5 text-[#bcdcf4]"/></div><div className="mt-4 grid gap-2 sm:grid-cols-4">{["5D", "20D", "60D", "120D"].map((period) => <div key={period} className="rounded-xl border border-[#8ab5e3]/15 bg-[#0f171c] p-3"><p className="mono text-xs text-[#cfe8fa]">{period}</p><p className="mt-2 text-[10px] leading-4 text-[#97b4c8]">Forward getiri, benchmark ve başarı alanı canlı tarihçe bekliyor.</p></div>)}</div><p className="mt-4 text-[10px] leading-5 text-[#a9c6d9]">Demo veride win rate, Sharpe, maksimum düşüş veya performans sonucu hesaplanmaz. Canlı sağlayıcıda split/kurumsal eylem düzeltmesi doğrulanmadan validation yayımlanmaz.</p></section>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
          <section className="rounded-2xl border border-white/12 bg-[#131914] p-5"><p className="data-label">SEMBOL DETAYI</p>{selected ? <><div className="mt-4 flex items-start justify-between gap-3"><div><h2 className="mono text-2xl text-white">{selected.symbol}</h2><p className="mt-1 text-[11px] text-[#9da89d]">{selected.companyName}</p></div><button onClick={toggleFavorite} aria-label={`${selected.symbol} favorisini değiştir`} className={`rounded-md border p-2 transition ${isFavorite ? "border-[#edca72]/45 bg-[#edca72]/[.12] text-[#f0d486]" : "border-white/12 text-[#aab5aa] hover:bg-white/[.06]"}`}><Star size={14} fill={isFavorite ? "currentColor" : "none"}/></button></div><div className="mt-5 grid grid-cols-2 gap-2"><ScoreTile label="Quality" value={selected.scores.qualityScore}/><ScoreTile label="Early" value={selected.scores.earlyScore}/><ScoreTile label="Risk" value={selected.scores.riskScore}/><ScoreTile label="Opportunity" value={selected.scores.opportunityScore}/></div><div className="mt-5 flex gap-1 overflow-x-auto rounded-lg bg-black/20 p-1">{(["1D", "5D", "1M", "3M", "6M", "1Y", "5Y"] as const).map((range) => <button key={range} onClick={() => setChartRange(range)} className={`shrink-0 rounded-md px-2 py-2 text-[9px] font-semibold transition ${chartRange === range ? "bg-[#8ab5e3] text-[#0d171c]" : "text-[#a7b2a7] hover:bg-white/[.06]"}`}>{range}</button>)}</div><div className="mt-3">{selectedChartBars.length >= 20 ? <TechnicalChartPanel symbol={selected.symbol} bars={selectedChartBars} sourceLabel={`${selected.sourceLabel} · ${chartRange}`} observedAt={selected.observedAt} lastSuccessfulAt={selected.observedAt} delayMinutes={null} errorMessage={null} /> : <div className="rounded-xl border border-dashed border-[#8ab5e3]/25 bg-[#8ab5e3]/[.04] p-4 text-[10px] leading-5 text-[#a9c6d9]">{chartRange} görünümü için demo tarihçesi yetersiz. Grafik, yalnızca seçili zaman diliminde yeterli mum bulunduğunda çizilir; gerçek sağlayıcı bağlandığında tarihçe kapsamı source contract içinde belirtilir.</div>}</div><DetailMetricGroup title="Teknik" entries={[["RSI(14)", number(selected.scores.indicators.rsi14, 1)], ["SMA20", number(selected.scores.indicators.sma20, 2)], ["SMA50", number(selected.scores.indicators.sma50, 2)], ["SMA200", number(selected.scores.indicators.sma200, 2)], ["Göreli hacim", `${number(selected.scores.indicators.relativeVolume, 2)}x`], ["ATR / close", `${number(selected.scores.indicators.atrPercent, 2)}%`], ["20B momentum", `${number(selected.scores.indicators.momentum20Percent, 2)}%`], ["52H zirve mesafe", `${number(selected.scores.indicators.distanceTo52WeekHighPercent, 2)}%`]]}/><DetailMetricGroup title="Finansal" entries={[["Gelir büyümesi", `${number(selected.metrics.revenueGrowthPercent, 1)}%`], ["FAVÖK büyümesi", `${number(selected.metrics.ebitdaGrowthPercent, 1)}%`], ["Net kâr büyümesi", `${number(selected.metrics.netProfitGrowthPercent, 1)}%`], ["ROE", `${number(selected.metrics.roePercent, 1)}%`], ["ROIC", `${number(selected.metrics.roicPercent, 1)}%`], ["Net borç/FAVÖK", number(selected.metrics.netDebtToEbitda, 2)], ["Serbest nakit akışı", number(selected.metrics.freeCashFlow, 0)]]}/><DetailMetricGroup title="Değerleme" entries={[["F/K", number(selected.metrics.pe, 1)], ["PD/DD", number(selected.metrics.pb, 1)], ["FD/FAVÖK", number(selected.metrics.evEbitda, 1)], ["Piyasa değeri", number(selected.metrics.marketCap, 0)], ["Fiili dolaşım", `${number(selected.metrics.freeFloatPercent, 1)}%`]]}/><div className="mt-4 rounded-xl border border-[#edca72]/20 bg-[#edca72]/[.045] p-3"><p className="data-label text-[#f0d486]">KAP / OLAY AKIŞI</p><p className="mt-2 text-[10px] leading-5 text-[#d9c98f]">{selected.kapEvents[0]?.subject ?? "Olay kaydı yok."}</p></div><div className="mt-5 grid grid-cols-3 gap-1 rounded-lg bg-black/20 p-1">{(["quality", "early", "risk"] as const).map((tab) => <button key={tab} onClick={() => setFactorTab(tab)} className={`rounded-md px-2 py-2 text-[10px] font-semibold transition ${factorTab === tab ? "bg-[#86e49a] text-[#0d120e]" : "text-[#a7b2a7] hover:bg-white/[.06]"}`}>{tab === "quality" ? "Quality" : tab === "early" ? "Early" : "Risk"}</button>)}</div><div className="mt-3 space-y-2">{factors.map((item) => <div key={item.key} className="rounded-lg border border-white/8 bg-black/15 p-2.5"><div className="flex items-center justify-between gap-2"><span className="text-[11px] text-white">{item.label}</span><span className={`mono text-[10px] ${item.direction === "BOOST" ? "text-[#86e49a]" : item.direction === "DRAG" ? "text-[#ee9c98]" : "text-[#dfcf98]"}`}>{number(item.points, 1)} / {item.maximumPoints}</span></div><p className="mt-1 text-[9px] leading-4 text-[#99a499]">{item.detail}</p></div>)}</div><div className="mt-5 border-t border-white/10 pt-4"><p className="data-label">DEMO VERİ UYARISI</p><p className="mt-2 text-[10px] leading-5 text-[#d9c98f]">Bu detay panelindeki teknik, finansal ve değerleme değerleri sentetiktir. Gerçek BIST, KAP veya şirket verisi değildir.</p></div></> : <p className="mt-4 text-xs text-[#aab5aa]">Demo satırı seçin.</p>}</section>
          <section id="xpro-provider" className="rounded-2xl border border-[#8ab5e3]/20 bg-[#0e1518] p-5"><p className="data-label text-[#bcdcf4]">DATA PROVIDER</p><div className="mt-4 space-y-2">{[["mock", "Demo", "Aktif"], ["forinvest", "Forinvest", "Provider unavailable"], ["dxfeed", "dxFeed", "Provider unavailable"]].map(([id, label, state]) => <div key={id} className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${id === overview?.provider.id ? "border-[#86e49a]/35 bg-[#86e49a]/[.07]" : "border-white/8 bg-white/[.02]"}`}><span className="text-xs text-white">{label}</span><span className={`mono text-[9px] ${id === overview?.provider.id ? "text-[#aef0b9]" : "text-[#99a99a]"}`}>{state}</span></div>)}</div><p className="mt-4 text-[10px] leading-5 text-[#97b4c8]">Anahtarlar yalnızca sunucu ortamında tutulur. API tabanı, anahtar ve auth header olmadan Forinvest/dxFeed seçimi demo moda geri döner.</p></section>
        </aside>
      </section>
    </div>
  </main>;
}

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof Gauge }) { return <article className="rounded-xl border border-white/10 bg-[#111713] p-4"><div className="flex items-center justify-between"><p className="data-label">{label}</p><Icon className="h-4 w-4 text-[#87d99a]"/></div><p className="mono mt-4 text-2xl text-white">{value}</p><p className="mt-2 text-[10px] leading-4 text-[#95a195]">{detail}</p></article>; }
function ScoreTile({ label, value }: { label: string; value: number | null }) { return <div className="rounded-lg border border-white/8 bg-black/15 p-2.5"><p className="text-[9px] uppercase tracking-[.08em] text-[#95a095]">{label}</p><p className={`mono mt-1 text-lg ${scoreTone(value)}`}>{number(value, 1)}</p></div>; }
function RangeControl({ label, value, setValue }: { label: string; value: number; setValue: (value: number) => void }) { return <label className="rounded-lg border border-white/8 bg-[#161d18] px-3 py-2"><span className="flex items-center justify-between text-[9px] uppercase tracking-[.08em] text-[#91a091]">{label}<b className="mono text-[#dfe7df]">{value}</b></span><input aria-label={label} type="range" min={0} max={100} value={value} onChange={(event) => setValue(Number(event.target.value))} className="mt-1.5 w-full accent-[#86e49a]"/></label>; }
function Panel({ title, icon: Icon, accent, children }: { title: string; icon: typeof BarChart3; accent: "green" | "blue" | "yellow" | "red"; children: React.ReactNode }) { const tone = accent === "green" ? "text-[#86e49a]" : accent === "blue" ? "text-[#bcdcf4]" : accent === "yellow" ? "text-[#f0d486]" : "text-[#ee9c98]"; return <article className="rounded-2xl border border-white/10 bg-[#111713] p-5"><div className="flex items-center gap-2"><Icon className={`h-4 w-4 ${tone}`}/><h3 className="text-sm font-semibold text-white">{title}</h3></div><div className="mt-4">{children}</div></article>; }
function CandidateList({ rows, empty, risk = false }: { rows: XProRow[]; empty: string; risk?: boolean }) { return rows.length ? <div className="space-y-2">{rows.map((row) => <div key={row.symbol} className="flex items-center justify-between rounded-lg border border-white/8 bg-black/15 px-3 py-2.5"><div><p className="mono text-xs text-white">{row.symbol}</p><p className="mt-1 text-[9px] text-[#8f9a8f]">{risk ? `Risk ${number(row.scores.riskScore)}` : `Early ${number(row.scores.earlyScore)} · Quality ${number(row.scores.qualityScore)}`}</p></div><ChevronRight className="h-4 w-4 text-[#7f8a7f]"/></div>)}</div> : <p className="text-xs leading-5 text-[#9fac9f]">{empty}</p>; }
function DetailMetricGroup({ title, entries }: { title: string; entries: [string, string][] }) { return <div className="mt-4 rounded-xl border border-white/8 bg-black/15 p-3"><p className="data-label">{title}</p><div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">{entries.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-2 border-b border-white/[.04] py-1"><span className="text-[9px] text-[#9da89d]">{label}</span><span className="mono text-[9px] text-white">{value}</span></div>)}</div></div>; }
