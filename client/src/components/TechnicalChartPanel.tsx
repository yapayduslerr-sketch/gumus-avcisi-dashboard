import type { OhlcvBar } from "@/lib/technicalScanner";
import { BarChart3, ExternalLink, Info } from "lucide-react";

type TechnicalChartPanelProps = {
  symbol: string;
  bars: OhlcvBar[];
  sourceLabel: string;
  sourceUrl?: string;
  observedAt?: string | null;
  delayMinutes?: number | null;
  errorMessage?: string | null;
};

function formatObservedAt(value?: string | null) {
  if (!value) return "Henüz yok";
  return new Date(value).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
}

export function TechnicalChartPanel({ symbol, bars, sourceLabel, sourceUrl, observedAt, delayMinutes, errorMessage }: TechnicalChartPanelProps) {
  const visibleBars = bars.slice(-80);
  const hasBars = visibleBars.length > 1;
  const chartWidth = 700;
  const chartHeight = 300;
  const priceBottom = 242;
  const volumeTop = 258;
  const volumeBottom = 292;
  const lows = visibleBars.map((bar) => bar.low);
  const highs = visibleBars.map((bar) => bar.high);
  const low = hasBars ? Math.min(...lows) : 0;
  const high = hasBars ? Math.max(...highs) : 0;
  const padding = Math.max((high - low) * 0.08, 0.0001);
  const priceRange = high - low + padding * 2;
  const maxVolume = hasBars ? Math.max(...visibleBars.map((bar) => bar.volume), 1) : 1;
  const step = chartWidth / Math.max(visibleBars.length, 1);
  const candleWidth = Math.max(2, Math.min(8, step * 0.62));
  const priceY = (value: number) => priceBottom - ((value - (low - padding)) / priceRange) * (priceBottom - 12);
  const volumeY = (value: number) => volumeBottom - (value / maxVolume) * (volumeBottom - volumeTop);

  return <article className="overflow-hidden rounded-2xl border border-white/12 bg-[#101411] p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="data-label">Sembol grafiği</p><h3 className="mono mt-2 text-2xl tracking-[.08em] text-white">{symbol}</h3></div>
      <div className="text-right"><p className="mono text-[9px] text-[#8ee19b]">{delayMinutes === null || delayMinutes === undefined ? "GECİKME BİLİNMİYOR" : `${delayMinutes} DK GECİKMELİ`}</p><p className="mt-1 text-[10px] text-[#8e9a8e]">Gözlem · {formatObservedAt(observedAt)}</p></div>
    </div>

    {hasBars ? <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-[#0b0e0c] p-2">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label={`${symbol} mum ve hacim grafiği`} className="h-auto w-full">
        {[0, 1, 2, 3, 4].map((index) => <line key={index} x1="0" x2={chartWidth} y1={12 + index * 57} y2={12 + index * 57} stroke="rgba(255,255,255,.09)" strokeWidth="1" />)}
        <line x1="0" x2={chartWidth} y1={250} y2={250} stroke="rgba(255,255,255,.13)" strokeWidth="1" />
        {visibleBars.map((bar, index) => {
          const x = index * step + step / 2;
          const up = bar.close >= bar.open;
          const color = up ? "#8ee19b" : "#e98282";
          const bodyTop = Math.min(priceY(bar.open), priceY(bar.close));
          const bodyHeight = Math.max(1.5, Math.abs(priceY(bar.open) - priceY(bar.close)));
          return <g key={bar.timestamp}><line x1={x} x2={x} y1={priceY(bar.high)} y2={priceY(bar.low)} stroke={color} strokeWidth="1.2" opacity=".9"/><rect x={x - candleWidth / 2} y={bodyTop} width={candleWidth} height={bodyHeight} fill={color} opacity=".9" rx=".6"/><rect x={x - candleWidth / 2} y={volumeY(bar.volume)} width={candleWidth} height={volumeBottom - volumeY(bar.volume)} fill={color} opacity=".28" rx=".6"/></g>;
        })}
      </svg>
    </div> : <div className="mt-5 flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-[#8ab5e3]/30 bg-[#8ab5e3]/[.04] px-6 text-center"><BarChart3 className="h-8 w-8 text-[#8ab5e3]"/><p className="mt-4 text-sm font-semibold text-[#d4e5f2]">Tarihli mum-hacim verisi bekleniyor.</p><p className="mt-2 max-w-[440px] text-xs leading-5 text-[#a7bdcf]">Grafik, doğrulanmış OHLCV barları geldiğinde mumları ve hacmi gösterir. Kaynak, gözlem zamanı veya yeterli bar geçmişi olmadan görsel veri üretilmez.</p></div>}

    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3"><div className="flex items-center gap-2 text-[10px] text-[#9ca79c]"><Info size={13} className="text-[#8ee19b]"/><span>{sourceLabel}</span></div>{sourceUrl ? <a href={sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-[#8ee19b] hover:underline">Kaynak URL <ExternalLink size={11}/></a> : <span className="mono text-[9px] text-[#d9c27d]">KAYNAK URL BEKLEMEDE</span>}</div>
    {errorMessage && <p className="mt-3 text-[10px] leading-4 text-[#f0aaaa]">Veri durumu: {errorMessage}</p>}
  </article>;
}
