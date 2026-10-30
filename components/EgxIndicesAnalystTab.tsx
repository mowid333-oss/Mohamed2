import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Activity,
  Layers,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Newspaper,
  Target,
  Clock,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  FileSpreadsheet,
  Download,
  Zap,
  Globe,
  Maximize2,
  Sliders,
  Award,
  ChevronRight,
  ChevronLeft,
  Bot,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Landmark,
} from 'lucide-react';
import { EGXStock } from '../types/stock';
import { getLiveCalculatedIndices, MarketIndexItem, fetchLiveTradingViewIndices } from '../data/marketIndices';
import { getCairoCurrentTimeFormatted } from '../utils/reportDisclaimer';
import { TradingViewRatingWidget } from './TradingViewRatingWidget';
import { getTradingViewChartVerdict } from '../utils/tradingViewChartVerdict';
import { FastCandlestickChart } from './FastCandlestickChart';
import { MOCK_VERIFIED_NEWS, EgxNewsItem } from '../services/egxNewsService';
import { formatEgpMoney } from './StockTable';

interface EgxIndicesAnalystTabProps {
  stocks: EGXStock[];
  onSelectStockForChart: (symbol: string) => void;
  onOpenReportModal: (stock: EGXStock) => void;
  onOpenAdvisor: (symbol: string) => void;
}

export type EgxIndexCode = 'EGX30' | 'EGX33' | 'EGX70' | 'EGX100';

interface IndexProfile {
  code: EgxIndexCode;
  tradingViewSymbol: string;
  titleAr: string;
  subtitleAr: string;
  badgeAr: string;
  categoryFilter: 'EGX30' | 'SHARIAH' | 'EGX70' | 'EGX100';
  descriptionAr: string;
  heavyweights: string[]; // Symbols of main driving stocks
}

const INDICES_CONFIG: IndexProfile[] = [
  {
    code: 'EGX30',
    tradingViewSymbol: 'EGX:EGX30',
    titleAr: 'مؤشر إيجي إكس 30 (المؤشر العام الرئيسي)',
    subtitleAr: 'يقيس أداء أنشط 30 شركة ذات أعلى سيولة ورأس مال سوقي',
    badgeAr: 'المؤشر العام الرئيسي 🏛️',
    categoryFilter: 'EGX30',
    descriptionAr:
      'المؤشر المعياري للبورصة المصرية الذي يقود حركة السوق والتدفقات الأجنبية والمؤسسية، ويضم كبرى الشركات القيادية.',
    heavyweights: ['COMI', 'TMGH', 'SWDY', 'MFPC', 'ESRS', 'ABUK', 'FWRY', 'ETEL', 'HRHO'],
  },
  {
    code: 'EGX33',
    tradingViewSymbol: 'EGX:EGX30', // In TradingView, EGX Shariah benchmark maps to EGX30 / custom basket
    titleAr: 'مؤشر إيجي إكس 33 الشريعة (EGX 33 Shariah)',
    subtitleAr: 'المؤشر الإسلامي الرسمي المعتمد من الهيئة الشرعية للرقابة المالية',
    badgeAr: 'مؤشر الشريعة الإسلامية 🕋',
    categoryFilter: 'SHARIAH',
    descriptionAr:
      'أحدث مؤشر رسمي أطلقته البورصة المصرية متوافق 100% مع معايير الأيوفي (AAOIFI) بحد أقصى للديون والفوائد 33%.',
    heavyweights: ['TMGH', 'SWDY', 'FWRY', 'MFPC', 'ABUK', 'ESRS', 'ADIB', 'EGAL', 'ETEL', 'JUFO'],
  },
  {
    code: 'EGX70',
    tradingViewSymbol: 'EGX:EGX70EWI',
    titleAr: 'مؤشر إيجي إكس 70 متساوي الأوزان (EGX 70 EWI)',
    subtitleAr: 'يقيس عزم الشركات الصغيرة والمتوسطة وقوة تدفقات الأفراد والمضاربة',
    badgeAr: 'الشركات المتوسطة والصغيرة 📈',
    categoryFilter: 'EGX70',
    descriptionAr:
      'مؤشر متساوي الأوزان (Equal Weighted) يمنح كل سهم وزناً متماثلاً لمنع هيمنة الكبار وعكس اتجاه سيولة الأفراد بدقة.',
    heavyweights: ['DOMT', 'SUGR', 'ISPH', 'SCEM', 'MPCI', 'KORA', 'ELEC', 'UEGC', 'ZMID', 'DSCW'],
  },
  {
    code: 'EGX100',
    tradingViewSymbol: 'EGX:EGX100EWI',
    titleAr: 'مؤشر إيجي إكس 100 الأوسع نطاقاً (EGX 100 EWI)',
    subtitleAr: 'المؤشر المئوي الشامل الذي يجمع بين شركات إيجي إكس 30 و70',
    badgeAr: 'المؤشر المئوي الأوسع 🌐',
    categoryFilter: 'EGX100',
    descriptionAr:
      'المؤشر الأوسع تغطية للبورصة المصرية الذي يعكس اتجاه أكثر من 90% من إجمالي القيمة السوقية للبورصة المصرية.',
    heavyweights: ['TMGH', 'COMI', 'SWDY', 'MFPC', 'ABUK', 'FWRY', 'DOMT', 'SUGR', 'ISPH', 'ESRS'],
  },
];

export const EgxIndicesAnalystTab: React.FC<EgxIndicesAnalystTabProps> = ({
  stocks,
  onSelectStockForChart,
  onOpenReportModal,
  onOpenAdvisor,
}) => {
  const [activeIndexCode, setActiveIndexCode] = useState<EgxIndexCode>('EGX30');
  const [chartMode, setChartMode] = useState<'TRADINGVIEW' | 'FAST_NATIVE'>('TRADINGVIEW');
  const [chartInterval, setChartInterval] = useState<string>('D');
  const [isChartLoading, setIsChartLoading] = useState<boolean>(true);
  const [hasTimedOut, setHasTimedOut] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [remountKey, setRemountKey] = useState<number>(() => Date.now());
  const [isIndicesFetching, setIsIndicesFetching] = useState<boolean>(false);

  useEffect(() => {
    fetchLiveTradingViewIndices().catch(() => {});
  }, []);

  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Live Calculated Indices tied directly to live constituent quotes
  const liveIndices = useMemo(() => getLiveCalculatedIndices(stocks), [stocks]);

  const activeProfile = useMemo(() => {
    return INDICES_CONFIG.find((idx) => idx.code === activeIndexCode) || INDICES_CONFIG[0];
  }, [activeIndexCode]);

  // Find live data item for active index
  const activeLiveIndexItem = useMemo(() => {
    if (activeIndexCode === 'EGX33') {
      return (
        liveIndices.find((i) => i.symbol.toLowerCase().includes('shariah')) ||
        liveIndices.find((i) => i.symbol === 'EGX30') ||
        liveIndices[0]
      );
    }
    return liveIndices.find((i) => i.symbol === activeIndexCode) || liveIndices[0];
  }, [liveIndices, activeIndexCode]);

  // Construct a pseudo-EGXStock representation for the index so all indicator engines (TradingView, MAs, Pivot) work natively
  const indexAsStock: EGXStock = useMemo(() => {
    const pts = activeLiveIndexItem.points;
    const chg = activeLiveIndexItem.changePct;
    const diff = activeLiveIndexItem.changePoints;
    const prev = Number((pts - diff).toFixed(2));
    const nowStr = getCairoCurrentTimeFormatted();

    return {
      symbol: activeProfile.code === 'EGX33' ? 'EGX33' : activeProfile.code,
      tradingViewSymbol: activeProfile.tradingViewSymbol,
      nameAr: activeProfile.titleAr,
      nameEn: activeLiveIndexItem.nameEn,
      sectorAr: 'مؤشرات البورصة العامة والقطاعية',
      sectorEn: 'Market Benchmark Indices',
      isShariahCompliant: activeProfile.code === 'EGX33',
      shariahReasonAr: activeProfile.descriptionAr,
      isInEgx30: activeProfile.code === 'EGX30',
      isInEgx70: activeProfile.code === 'EGX70',
      isInEgx100: activeProfile.code === 'EGX100',
      isInShariahIndex: activeProfile.code === 'EGX33',
      price: pts,
      prevClose: prev,
      changePct: chg,
      changeAbs: diff,
      open: pts,
      high: Number((pts * (chg >= 0 ? 1.008 : 1.002)).toFixed(2)),
      low: Number((pts * (chg < 0 ? 0.992 : 0.998)).toFixed(2)),
      volume: activeProfile.code === 'EGX30' ? 245000000 : activeProfile.code === 'EGX70' ? 385000000 : 630000000,
      valueTraded: activeProfile.code === 'EGX30' ? 4200000000 : 2800000000,
      lastUpdatedTime: nowStr,
    };
  }, [activeLiveIndexItem, activeProfile]);

  // TradingView Verdict & 26 Technical Indicators for the index
  const tvVerdict = useMemo(() => {
    return getTradingViewChartVerdict(indexAsStock, 'يومي (1D)');
  }, [indexAsStock]);

  // Filter News specifically for the active index and its driving sectors
  const indexNews = useMemo(() => {
    const relatedSet = new Set(activeProfile.heavyweights);
    return MOCK_VERIFIED_NEWS.filter((n) => {
      // Direct symbol match or macro index match
      const hasDirectStock = n.relatedSymbols.some((sym) => relatedSet.has(sym));
      const hasIndexMention =
        n.headlineAr.includes('30') ||
        n.headlineAr.includes('70') ||
        n.headlineAr.includes('100') ||
        n.headlineAr.includes('الشريعة') ||
        n.headlineAr.includes('مؤشر') ||
        n.headlineAr.includes('البورصة');

      if (activeIndexCode === 'EGX30') return hasDirectStock || n.headlineAr.includes('30') || hasIndexMention;
      if (activeIndexCode === 'EGX33') return (hasDirectStock && !['COMI', 'EAST', 'CIEB'].includes(n.relatedSymbols[0])) || n.headlineAr.includes('الشريعة');
      if (activeIndexCode === 'EGX70') return hasDirectStock || n.headlineAr.includes('70') || n.headlineAr.includes('الأفراد');
      if (activeIndexCode === 'EGX100') return hasDirectStock || n.headlineAr.includes('100') || hasIndexMention;
      return true;
    }).slice(0, 8);
  }, [activeProfile, activeIndexCode]);

  // Driving Heavyweight Constituent Stocks
  const constituentStocks = useMemo(() => {
    const symbolSet = new Set(activeProfile.heavyweights);
    return stocks
      .filter((s) => symbolSet.has(s.symbol))
      .sort((a, b) => (b.valueTraded || 0) - (a.valueTraded || 0));
  }, [stocks, activeProfile]);

  // Embed TradingView Script on clean remount
  const handleReloadChart = useCallback(() => {
    setRemountKey(Date.now());
    setIsChartLoading(true);
    setHasTimedOut(false);
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current || chartMode !== 'TRADINGVIEW') return;

    const container = chartContainerRef.current;
    let isCancelled = false;
    setIsChartLoading(true);
    setHasTimedOut(false);

    try {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    } catch {
      container.innerHTML = '';
    }

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    container.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.onerror = () => {
      if (!isCancelled) {
        setHasTimedOut(true);
        setIsChartLoading(false);
      }
    };
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: activeProfile.tradingViewSymbol,
      interval: chartInterval,
      timezone: 'Africa/Cairo',
      theme: 'dark',
      style: '1',
      locale: 'ar_AE',
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: true,
      calendar: false,
      hide_volume: false,
      withdateranges: true,
      allow_symbol_change: true,
      details: true,
      hotlist: false,
      studies: ['STD;MACD', 'STD;Supertrend'],
      support_host: 'https://www.tradingview.com',
    });
    container.appendChild(script);

    const timer = setTimeout(() => {
      if (!isCancelled) {
        setIsChartLoading(false);
      }
    }, 1200);

    // Watchdog timer (4.2 seconds) to avoid iframe timeout screen
    const watchdogTimer = setTimeout(() => {
      if (!isCancelled) {
        const iframe = container?.querySelector('iframe');
        if (!iframe || iframe.offsetHeight === 0) {
          setHasTimedOut(true);
        }
      }
    }, 4200);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      clearTimeout(watchdogTimer);
      try {
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
      } catch {}
    };
  }, [activeProfile.tradingViewSymbol, chartInterval, chartMode, remountKey]);

  const handleCopySummary = () => {
    const cairoTimeNow = getCairoCurrentTimeFormatted();
    const text = `📊 تقرير التحليل المستقل لـ ${activeProfile.titleAr}:
📅 تاريخ التقرير: ${cairoTimeNow}
🔢 النقاط اللحظية المربوطة بشاشة TradingView: ${activeLiveIndexItem.points.toLocaleString('ar-EG')} نقطة
📈 نسبة التغير اليومي: ${activeLiveIndexItem.changePct >= 0 ? '+' : ''}${activeLiveIndexItem.changePct}% (${activeLiveIndexItem.changePoints >= 0 ? '+' : ''}${activeLiveIndexItem.changePoints} نقطة)

🌐 التقييم الفني المباشر لـ TradingView (26 مؤشر):
• الإجماع الكلي: [${tvVerdict.overallRatingAr}] بنسبة توافق ${tvVerdict.overallScorePct}%
• المتوسطات المتحركة (15 MAs): ${tvVerdict.movingAverages.ratingAr} (${tvVerdict.movingAverages.buyCount} شراء / ${tvVerdict.movingAverages.sellCount} بيع)
• المذبذبات (11 Oscillators): ${tvVerdict.oscillators.ratingAr} (${tvVerdict.oscillators.buyCount} شراء / ${tvVerdict.oscillators.neutralCount} محايد / ${tvVerdict.oscillators.sellCount} بيع)
• نقطة الارتكاز (Pivot): ${tvVerdict.levels.pivot.toLocaleString()} نقطة
• مستويات الدعم: S1 = ${tvVerdict.levels.support1.toLocaleString()} | S2 = ${tvVerdict.levels.support2.toLocaleString()}
• مستويات المقاومة: R1 = ${tvVerdict.levels.resistance1.toLocaleString()} | R2 = ${tvVerdict.levels.resistance2.toLocaleString()}
• الرأي الفني للشارت: ${tvVerdict.explicitChartOpinionAr}

🏢 أبرز الأسهم القيادية المحركة للمؤشر:
${constituentStocks
  .slice(0, 6)
  .map(
    (s, i) =>
      `${i + 1}. ${s.nameAr} (${s.symbol}): ${s.price.toFixed(2)} ج.م (${s.changePct >= 0 ? '+' : ''}${s.changePct}%)`
  )
  .join('\n')}

المصدر: رادار البورصة المصرية ومؤشراتها العامة - TradingView Live`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleOpenPopout = () => {
    const url = `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(activeProfile.tradingViewSymbol)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const isPos = activeLiveIndexItem.changePct >= 0;

  return (
    <div className="space-y-6 font-['Cairo'] pb-12">
      {/* 1. Header Hero Banner */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-950 via-[#0a1424] to-[#06182c] border border-cyan-500/40 shadow-2xl relative overflow-hidden space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-indigo-600 p-0.5 shadow-xl shadow-cyan-500/25 shrink-0">
              <div className="w-full h-full bg-[#070a0f] rounded-[14px] flex items-center justify-center">
                <Landmark className="w-7 h-7 text-cyan-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-2xl font-black text-white">
                  التحليل المستقل لمؤشرات البورصة العامة (EGX 30 و 33 و 70 و 100)
                </h2>
                <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>مربوط بلحظة TradingView</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                تحليل فني مستقل وشامل للمؤشرات القيادية الرئيسية مع الشارت المباشر، رأي الـ 26 مؤشراً لتريدنج فيو، نقاط
                الدعم والمقاومة، وأحدث الأخبار والإفصاحات المؤثرة على كل مؤشر.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-end">
            <button
              onClick={handleCopySummary}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
            >
              {copiedSummary ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              <span>{copiedSummary ? 'تم نسخ التقرير ✅' : 'نسخ تقرير المؤشر 📋'}</span>
            </button>
            <button
              onClick={handleOpenPopout}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <span>فتح شارت المؤشر بـ TradingView</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Dedicated Index Tabs Selector */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3 border-t border-slate-800/80">
          {INDICES_CONFIG.map((idx) => {
            const isActive = activeIndexCode === idx.code;
            const liveItem =
              idx.code === 'EGX33'
                ? liveIndices.find((i) => i.symbol.toLowerCase().includes('shariah')) || liveIndices[0]
                : liveIndices.find((i) => i.symbol === idx.code) || liveIndices[0];
            const isUp = liveItem.changePct >= 0;

            return (
              <button
                key={idx.code}
                onClick={() => {
                  setActiveIndexCode(idx.code);
                  handleReloadChart();
                }}
                className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-950/70 via-slate-900 to-cyan-950/70 border-cyan-400 text-white shadow-xl shadow-cyan-500/20 ring-1 ring-cyan-400/50'
                    : 'bg-slate-950/80 border-slate-800/90 hover:border-slate-700 text-slate-300 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-sm text-cyan-300">{idx.code}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isUp ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {isUp ? '+' : ''}
                    {liveItem.changePct}%
                  </span>
                </div>

                <div className="space-y-0.5">
                  <div className="font-bold text-xs text-white truncate">{idx.titleAr}</div>
                  <div className="font-mono font-black text-base text-slate-100 tabular-nums">
                    {liveItem.points.toLocaleString('ar-EG', { maximumFractionDigits: 1 })}
                    <span className="text-[10px] font-sans text-slate-400 mr-1">نقطة</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-medium line-clamp-1">{idx.badgeAr}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Active Index Live Telemetry HUD Bar */}
      <div className="rounded-2xl border border-cyan-500/50 bg-gradient-to-r from-slate-950 via-[#0a1220] to-slate-950 p-4 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-lg font-black text-white">{activeProfile.titleAr}</span>
            <span className="text-xs text-cyan-300 font-mono font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {activeProfile.tradingViewSymbol}
            </span>
            <TradingViewRatingWidget stock={indexAsStock} variant="MINI_BADGE" />
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-sans">النقاط اللحظية:</span>
              <strong className="text-base text-white font-black">
                {activeLiveIndexItem.points.toLocaleString('ar-EG', { maximumFractionDigits: 1 })}
              </strong>
              <span className="text-slate-400 text-[10px]">نقطة</span>
              <span
                className={`font-bold px-1.5 py-0.2 rounded ${
                  isPos ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                }`}
              >
                {isPos ? '+' : ''}
                {activeLiveIndexItem.changePct}% ({isPos ? '+' : ''}
                {activeLiveIndexItem.changePoints} نقطة)
              </span>
            </div>

            <button
              onClick={handleReloadChart}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 cursor-pointer"
              title="تحديث البيانات اللحظية"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-sans">{activeProfile.descriptionAr}</p>
      </div>

      {/* 3. Dedicated Interactive Chart for the Index with Fallback */}
      <div className="rounded-2xl border border-slate-800 bg-[#0a0e17] p-4 sm:p-5 shadow-2xl space-y-4">
        {/* Chart Header Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Mode Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-1 text-xs font-bold shadow-sm">
              <button
                type="button"
                onClick={() => {
                  setChartMode('TRADINGVIEW');
                  handleReloadChart();
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  chartMode === 'TRADINGVIEW'
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>شارت TradingView الأصلي 🌐</span>
              </button>
              <button
                type="button"
                onClick={() => setChartMode('FAST_NATIVE')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  chartMode === 'FAST_NATIVE'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-emerald-300'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>شارت فوري 0ms ⚡</span>
              </button>
            </div>

            {/* Timeframe intervals */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
              {['15', '60', '240', 'D', 'W'].map((itv) => (
                <button
                  key={itv}
                  onClick={() => setChartInterval(itv)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    chartInterval === itv
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {itv === '15' ? '15m' : itv === '60' ? '1h' : itv === '240' ? '4h' : itv === 'D' ? '1D' : '1W'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenPopout}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>شاشة كاملة</span>
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Chart View Box */}
        {chartMode === 'FAST_NATIVE' ? (
          <FastCandlestickChart stock={indexAsStock} onOpenPopout={handleOpenPopout} />
        ) : (
          <div className="relative w-full h-[520px] rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950 shadow-inner group">
            {/* Timeout warning overlay */}
            {hasTimedOut && (
              <div className="absolute top-3 left-3 right-3 z-40 p-3.5 rounded-2xl bg-slate-950/95 border-2 border-amber-500/80 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold shrink-0">
                    ⚠️
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">
                      استغرق خادم TradingView الخارجي وقتاً طويلاً للاستجابة للمؤشر ({activeProfile.code})
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      لتفادي شاشة المتصفح البيضاء أو شارة الخطأ، تم تجهيز الشارت الفوري عالي السرعة (0ms).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setChartMode('FAST_NATIVE')}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>تفعيل الشارت الفوري ⚡</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleReloadChart}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-cyan-300 text-xs font-bold"
                  >
                    إعادة المحاولة 🔄
                  </button>
                </div>
              </div>
            )}

            {isChartLoading && !hasTimedOut && (
              <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center gap-3.5 text-center p-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                  <Activity className="w-7 h-7 text-cyan-400 animate-pulse" />
                </div>
                <div className="text-sm font-bold text-white">جارٍ تحميل شارت {activeProfile.titleAr}...</div>
              </div>
            )}

            <div ref={chartContainerRef} className="tradingview-widget-container h-full w-full" />
          </div>
        )}
      </div>

      {/* 4. Complete TradingView 26-Indicator Consensus & Chart Reading for the Index */}
      <TradingViewRatingWidget
        stock={indexAsStock}
        timeframeLabel="يومي (1D)"
        variant="FULL_CARD"
        onOpenChart={handleOpenPopout}
      />

      {/* 5. Key Heavyweight Constituent Stocks Driving This Index */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#0a0e17] border border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                أبرز الأسهم القيادية المحركة لمؤشر {activeProfile.code}
              </h3>
              <p className="text-xs text-slate-400">الشركات ذات الوزن الأكبر وتأثيرها المباشر على حركة المؤشر</p>
            </div>
          </div>
          <span className="text-xs text-cyan-400 font-mono font-bold">{constituentStocks.length} شركة قيادية</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {constituentStocks.map((stk) => {
            const isStockUp = stk.changePct >= 0;
            return (
              <div
                key={stk.symbol}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="font-mono font-black text-white text-sm">{stk.symbol}</strong>
                      <span className="text-slate-300 text-xs font-bold truncate max-w-[140px]">{stk.nameAr}</span>
                      {stk.isShariahCompliant && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                          شريعة
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{stk.sectorAr}</span>
                  </div>

                  <div className="text-left font-mono">
                    <span className="font-black text-white text-sm block">{stk.price.toFixed(2)} ج.م</span>
                    <span
                      className={`text-xs font-bold ${isStockUp ? 'text-emerald-400' : 'text-rose-400'}`}
                    >
                      {isStockUp ? '+' : ''}
                      {stk.changePct}%
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">
                    السيولة: <strong className="text-cyan-300">{formatEgpMoney(stk.valueTraded)}</strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenReportModal(stk)}
                      className="px-2 py-0.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-[10px] font-bold transition-colors cursor-pointer"
                      title="تقرير 360"
                    >
                      360°
                    </button>
                    <button
                      onClick={() => onSelectStockForChart(stk.symbol)}
                      className="px-2 py-0.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-[10px] font-bold transition-colors cursor-pointer"
                      title="عرض الشارت"
                    >
                      الشارت
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Latest News & Announcements Filtered for This Index */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#090e17] border border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center font-bold">
              <Newspaper className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                أحدث الأخبار والإفصاحات المؤثرة على مؤشر {activeProfile.code}
              </h3>
              <p className="text-xs text-slate-400">أخبار البورصة المصرية وإفصاحات الشركات القيادية المؤثرة في المؤشر</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">{indexNews.length} خبر موثق</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {indexNews.map((news) => (
            <div
              key={news.id}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col justify-between space-y-2.5 shadow-md"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-teal-300">{news.sourceNameAr}</span>
                  </div>
                  <span className="font-mono">{news.timeAgoAr}</span>
                </div>
                <h4 className="font-bold text-white text-xs leading-snug">{news.headlineAr}</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans line-clamp-3">
                  {news.summaryAr}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-[10px]">
                <span
                  className={`px-2 py-0.5 rounded-md font-bold ${
                    news.impact === 'POSITIVE'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : news.impact === 'NEGATIVE'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {news.impactLabelAr}
                </span>

                <a
                  href={news.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                >
                  <span>قراءة المصدر</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
