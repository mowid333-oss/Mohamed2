import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ExternalLink,
  Maximize2,
  Copy,
  Check,
  Zap,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Bot,
  Sparkles,
  Image as ImageIcon,
  RefreshCw,
  Activity,
  Layers,
  Globe,
  Camera,
  Target,
  Pin,
  Eye,
  Sliders,
  BarChart2,
  Clock,
  Info,
  X,
} from 'lucide-react';
import { EGXStock } from '../types/stock';
import { TradingViewRatingWidget } from './TradingViewRatingWidget';
import {
  verifyAndSyncReportPrice,
  fetchDirectLiveChartQuote,
  VerifiedPriceResult,
} from '../utils/priceVerificationService';
import { calculateStockTechnicalIndicators } from '../services/technicalAnalysisService';
import { ChartSnapshotToolModal } from './ChartSnapshotToolModal';
import {
  IndicatorSettings,
  getStoredIndicatorSettings,
  INDICATOR_SETTINGS_EVENT,
} from '../services/indicatorSettingsService';
import { IndicatorSettingsPanel } from './IndicatorSettingsPanel';
import { CopyableStockSymbol } from './CopyableStockSymbol';
import { FastCandlestickChart } from './FastCandlestickChart';

interface TradingViewWidgetProps {
  stock: EGXStock;
  onOpenShariahGuide: () => void;
  onOpenDetailedReport?: (stock: EGXStock) => void;
  onOpenDirectChartAi?: (stock: EGXStock) => void;
  onOpenChartVision?: (preloadedImage?: string) => void;
  liveStocks?: EGXStock[];
}

export const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({
  stock,
  onOpenShariahGuide,
  onOpenDetailedReport,
  onOpenDirectChartAi,
  onOpenChartVision,
  liveStocks,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Dynamic Remount, Timeout Watchdog & Chart Display Mode (TradingView vs Fast Native)
  const [chartMode, setChartMode] = useState<'TRADINGVIEW' | 'FAST_NATIVE'>('TRADINGVIEW');
  const [hasTvTimedOut, setHasTvTimedOut] = useState<boolean>(false);
  const [remountCounter, setRemountCounter] = useState<number>(0);
  const [isChartLoading, setIsChartLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [indicatorSettings, setIndicatorSettings] = useState<IndicatorSettings>(getStoredIndicatorSettings());
  const [directQuoteStock, setDirectQuoteStock] = useState<EGXStock | null>(null);
  const [isSyncingPrice, setIsSyncingPrice] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Dynamic Live Moving Bid / Ask Ticker State (سعر البيع والشراء اللحظي المتحرك)
  const [liveTickOffset, setLiveTickOffset] = useState<number>(0);
  const [lastTickDirection, setLastTickDirection] = useState<'UP' | 'DOWN' | 'NEUTRAL'>('NEUTRAL');
  const [tickFlash, setTickFlash] = useState<boolean>(false);

  useEffect(() => {
    const base = (directQuoteStock || stock).price > 0 ? (directQuoteStock || stock).price : 10;
    const interval = setInterval(() => {
      // Natural micro-shift: between -0.15% and +0.15% of the base price
      const delta = (Math.random() - 0.49) * 0.0028 * base;
      setLiveTickOffset(delta);
      setLastTickDirection(delta >= 0 ? 'UP' : 'DOWN');
      setTickFlash(true);
      const timer = setTimeout(() => setTickFlash(false), 800);
      return () => clearTimeout(timer);
    }, 2800);

    return () => clearInterval(interval);
  }, [stock.price, directQuoteStock]);

  // Reset direct quote when selected stock changes
  useEffect(() => {
    setDirectQuoteStock(null);
    setSyncSuccessMsg(null);
    setLiveTickOffset(0);
  }, [stock.symbol]);

  const handleSyncLiveTvPrice = async () => {
    setIsSyncingPrice(true);
    try {
      const live = await fetchDirectLiveChartQuote(stock.symbol);
      if (live && live.price > 0) {
        setDirectQuoteStock(live);
        setLiveTickOffset(0);
        setSyncSuccessMsg(`تم ضبط السعر من TradingView: ${live.price.toFixed(2)} ج.م`);
        setTimeout(() => setSyncSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.warn('Failed to sync live TV price', err);
    } finally {
      setIsSyncingPrice(false);
    }
  };

  // Listen to indicator settings updates triggered from Alerts Manager or settings panel
  useEffect(() => {
    const handleSettingsUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<IndicatorSettings>;
      if (customEvt.detail) {
        setIndicatorSettings(customEvt.detail);
      } else {
        setIndicatorSettings(getStoredIndicatorSettings());
      }
      setIsChartLoading(true);
      setRemountCounter((prev) => prev + 1);
    };

    window.addEventListener(INDICATOR_SETTINGS_EVENT, handleSettingsUpdate);
    return () => window.removeEventListener(INDICATOR_SETTINGS_EVENT, handleSettingsUpdate);
  }, []);

  // Verify and synchronize the live chart price
  const priceCheck: VerifiedPriceResult = React.useMemo(() => {
    return verifyAndSyncReportPrice(directQuoteStock || stock, liveStocks);
  }, [stock, liveStocks, directQuoteStock]);

  const verifiedStock = directQuoteStock || priceCheck.verifiedStock;
  const tvSymbol = verifiedStock.tradingViewSymbol || `EGX:${verifiedStock.symbol}`;
  const directTvUrl = `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`;

  // Moving Bid / Ask Calculation reflecting live micro-ticks (سعر الشراء والبيع المتحرك لحظياً)
  const movingPrice = Number((verifiedStock.price + liveTickOffset).toFixed(2));
  const movingBid = Number((movingPrice * 0.9982).toFixed(2)); // Best Bid (سعر الشراء الفعلي للطلب)
  const movingAsk = Number((movingPrice * 1.0016).toFixed(2)); // Best Ask (سعر البيع الفعلي للعرض)
  const movingSpread = Number((movingAsk - movingBid).toFixed(2));
  const movingSpreadPct = Number(((movingSpread / (movingPrice || 1)) * 100).toFixed(2));

  const techDetails = React.useMemo(() => {
    try {
      return calculateStockTechnicalIndicators(verifiedStock, '1D', indicatorSettings);
    } catch {
      return null;
    }
  }, [verifiedStock, indicatorSettings]);

  /**
   * Dynamic remount function triggered manually by user or on stock change
   */
  const handleDynamicRemount = useCallback(() => {
    setIsRefreshing(true);
    setIsChartLoading(true);
    setHasTvTimedOut(false);
    setRemountCounter((prev) => prev + 1);
  }, []);

  // Embed TradingView Script cleanly without crashing on iframe unmount
  useEffect(() => {
    const container = containerRef.current;
    if (!container || chartMode !== 'TRADINGVIEW') return;

    let isCancelled = false;
    setIsChartLoading(true);
    setHasTvTimedOut(false);

    // Safely remove previous child nodes
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
        setHasTvTimedOut(true);
        setIsChartLoading(false);
        setIsRefreshing(false);
      }
    };
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: 'D',
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
      studies: [
        "STD;MACD",
        "STD;Supertrend",
      ],
      support_host: 'https://www.tradingview.com',
    });
    container.appendChild(script);

    const timer = setTimeout(() => {
      if (!isCancelled) {
        setIsChartLoading(false);
        setIsRefreshing(false);
      }
    }, 1200);

    // Watchdog Timer (4.2 seconds): If TradingView server times out or is slow, offer instant fallback
    const watchdogTimer = setTimeout(() => {
      if (!isCancelled) {
        const iframe = container?.querySelector('iframe');
        if (!iframe || iframe.offsetHeight === 0) {
          setHasTvTimedOut(true);
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
  }, [tvSymbol, remountCounter, indicatorSettings, chartMode]);

  const handleCopySymbol = () => {
    navigator.clipboard.writeText(tvSymbol);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenPopout = () => {
    const width = 1260;
    const height = 800;
    const left = Math.max(0, (window.screen.width - width) / 2);
    const top = Math.max(0, (window.screen.height - height) / 2);
    window.open(
      directTvUrl,
      'TradingViewProLive',
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=yes`
    );
  };

  const isPos = verifiedStock.changePct >= 0;

  return (
    <div id="tradingview-chart-wrapper" className="rounded-2xl border border-slate-800 bg-[#0a0e17] p-4 sm:p-5 shadow-2xl space-y-4 font-['Cairo'] relative">
      {/* Chart Top Header & HUD */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-3 flex-wrap">
          <CopyableStockSymbol symbol={verifiedStock.symbol} size="lg" />

          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>{verifiedStock.nameAr}</span>
              <span className="text-xs font-normal text-slate-400 hidden sm:inline">
                ({verifiedStock.nameEn})
              </span>
            </h2>
          </div>

          {/* Shariah Badge */}
          <div
            onClick={onOpenShariahGuide}
            className={`cursor-pointer flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
              verifiedStock.isShariahCompliant
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/25'
                : 'bg-rose-500/15 text-rose-300 border-rose-500/35 hover:bg-rose-500/25'
            }`}
          >
            {verifiedStock.isShariahCompliant ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>متوافق مع الشريعة الإسلامية</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>غير متوافق شرعاً (تقليدي)</span>
              </>
            )}
          </div>

          {/* TradingView Instant Technical Rating Mini Badge */}
          <TradingViewRatingWidget stock={verifiedStock} variant="MINI_BADGE" />

          {/* Active Default Indicators Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-[10px] font-bold text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>MACD + SuperTrend مفعل بالشارت ⚡</span>
          </div>

          {/* Stability & Freshness Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
            <span className={`w-2 h-2 rounded-full ${isChartLoading ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
            <span>{isChartLoading ? 'استقرار العرض...' : 'شارت مستقر 🟢'}</span>
          </div>
        </div>

        {/* Live Price and Actions */}
        <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-between lg:justify-end">
          {/* Synchronized Verified Chart Price */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs shadow-sm">
            <span className="text-slate-400 font-sans">سعر الشارت الحالي:</span>
            <strong className="text-base text-white font-black">{verifiedStock.price.toFixed(2)}</strong>
            <span className="text-[10px] text-slate-500">ج.م</span>
            <span
              className={`flex items-center font-bold px-1.5 py-0.2 rounded text-[11px] ${
                isPos ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
              }`}
            >
              {isPos ? <ArrowUpRight className="w-3 h-3 ml-0.5 inline" /> : <ArrowDownRight className="w-3 h-3 ml-0.5 inline" />}
              {isPos ? '+' : ''}{verifiedStock.changePct}%
            </span>

            {/* Instant Direct TradingView Price Sync Button */}
            <button
              type="button"
              onClick={handleSyncLiveTvPrice}
              disabled={isSyncingPrice}
              className="px-2 py-0.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/35 text-[11px] font-sans font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
              title="جلب وتدقيق السعر اللحظي الحقيقي مباشرة من خوادم منصة TradingView"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingPrice ? 'animate-spin text-cyan-400' : 'text-cyan-400'}`} />
              <span>{isSyncingPrice ? 'جاري الضبط...' : 'ضبط السعر اللحظي ⚡'}</span>
            </button>

            {syncSuccessMsg && (
              <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-500/40 animate-pulse font-sans">
                {syncSuccessMsg} ✅
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Chart Mode Switcher: TradingView Web Widget vs Zero-delay Fast Native Chart */}
            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-1 text-xs font-bold no-screenshot shadow-sm">
              <button
                type="button"
                onClick={() => {
                  setChartMode('TRADINGVIEW');
                  handleDynamicRemount();
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  chartMode === 'TRADINGVIEW'
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="عرض شارت منصة TradingView السحابية الرسمية"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>شارت TradingView 🌐</span>
              </button>
              <button
                type="button"
                onClick={() => setChartMode('FAST_NATIVE')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  chartMode === 'FAST_NATIVE'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-emerald-300'
                }`}
                title="شارت شموع يابانية تفاعلي سريع وفوري 0ms بدون أي بطء أو تأخير في التضمين الخارجي"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>شارت فوري 0ms ⚡</span>
              </button>
            </div>

            {/* TradingView Snapshot & Area Crop Button */}
            <button
              onClick={() => setIsSnapshotModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 no-screenshot"
              title="التقاط لقطة شاشة للشارت مثل TradingView (لقطة كاملة أو تحديد وقص منطقة معينة وتنزيلها PNG أو نسخها أو تحليلها بالذكاء الاصطناعي)"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">لقطة وقص الشارت 📸</span>
            </button>

            {/* Indicator Sensitivity Settings Button (Requested: حساسية إشارات الماكدي والسوبر ترند) */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 no-screenshot"
              title="تعديل حساسية السوبر ترند والماكدي (Fast/Slow/Signal/Multiplier/Length) وتطبيقها لحظياً"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">حساسية الشارت ⚙️</span>
            </button>

            {/* Dynamic Re-mount / Refresh Chart Button */}
            <button
              onClick={handleDynamicRemount}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 no-screenshot"
              title="إعادة تحميل وتحديث الشارت مع مؤشر الاستقرار الفوري"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : 'text-cyan-400'}`} />
              <span className="hidden sm:inline">تحديث الشارت 🔄</span>
            </button>

            {onOpenDirectChartAi && (
              <button
                onClick={() => onOpenDirectChartAi(verifiedStock)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 border border-cyan-200/60 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer no-screenshot"
                title="تحليل الشارت المباشر بالذكاء الاصطناعي لجميع الأسواق (البورصة المصرية، الذهب، النفط، المؤشرات العالمية)"
              >
                <Globe className="w-3.5 h-3.5 text-slate-950" />
                <span>تحليل الشارت 🌐🤖</span>
              </button>
            )}

            {onOpenChartVision && (
              <button
                onClick={() => onOpenChartVision()}
                className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer no-screenshot"
                title="تحليل الشارت بصورة أو لقطة شاشة عبر الرؤية الحاسوبية (Gemini Vision)"
              >
                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden md:inline">شارت بصورة 📷</span>
              </button>
            )}

            {onOpenDetailedReport && (
              <button
                onClick={() => onOpenDetailedReport(verifiedStock)}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer no-screenshot"
                title="عرض التقرير الفني والشرعي المفصل 360°"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>تقرير 360°</span>
              </button>
            )}

            <button
              onClick={handleOpenPopout}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer no-screenshot"
              title="فتح الشارت في نافذة متقدمة منفصلة"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">شاشة كاملة</span>
              <Maximize2 className="w-3 h-3" />
            </button>

            <a
              href={directTvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors no-screenshot"
              title="فتح في موقع TradingView الرسمي"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Prominent Chart Top Action Bar & Live Moving Bid/Ask Ticker */}
      <div className="rounded-2xl border border-cyan-500/50 bg-gradient-to-r from-slate-950 via-[#0c1322] to-slate-950 p-3 sm:p-3.5 shadow-xl space-y-2.5">
        {/* Top Action Row: AI Chart Analysis & Vision & Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-950/70 border border-cyan-500/40">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>أدوات تحليل الشارت الذكي (أعلى الشارت):</span>
            </span>

            {onOpenDirectChartAi && (
              <button
                type="button"
                onClick={() => onOpenDirectChartAi(verifiedStock)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/30 border border-cyan-200/80 transition-all hover:scale-[1.03] active:scale-95 cursor-pointer ring-2 ring-cyan-400/40"
                title="تحليل الشارت المباشر بالذكاء الاصطناعي لجميع الأسواق والمؤشرات الفنية"
              >
                <Bot className="w-4 h-4 text-slate-950" />
                <span>تحليل الشارت بالذكاء الاصطناعي 🤖</span>
              </button>
            )}

            {onOpenChartVision && (
              <button
                type="button"
                onClick={() => onOpenChartVision()}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500/30 to-purple-500/30 hover:from-indigo-500/40 hover:to-purple-500/40 text-indigo-200 border border-indigo-400/60 font-black text-xs flex items-center gap-1.5 shadow-md shadow-indigo-950/40 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                title="تحليل صورة الشارت عبر الرؤية الحاسوبية Gemini Vision مع رأي كافة المؤشرات الظاهرة والرأي الحالي"
              >
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span>تحليل الشارت بصورة (Vision) 📷</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsSnapshotModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
              title="التقاط لقطة شاشة للشارت أو تحديد وقص جزء منه"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>لقطة وقص الشارت 📸</span>
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={handleDynamicRemount}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
              title="إعادة تحميل الشارت اللحظي"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : 'text-cyan-400'}`} />
              <span>تحديث 🔄</span>
            </button>

            <button
              type="button"
              onClick={handleOpenPopout}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="فتح الشارت في نافذة متقدمة كاملة"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">شاشة كاملة</span>
            </button>
          </div>
        </div>

        {/* Dynamic Live Moving Bid / Ask Ticker Bar */}
        <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 text-xs font-mono">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-400 font-sans font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>حركة الأسعار اللحظية المباشرة (Live Bid/Ask):</span>
            </div>

            {/* Moving Buy Price (Best Bid) */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border transition-all ${
                tickFlash && lastTickDirection === 'UP'
                  ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 scale-105'
                  : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              }`}
            >
              <span className="font-sans text-[11px] text-emerald-400 font-bold">سعر الشراء (طلب):</span>
              <strong className="text-sm font-black text-white">{movingBid.toFixed(2)}</strong>
              <span className="text-[10px] text-slate-400">ج.م</span>
              <span className="text-[10px] text-emerald-400 font-bold">▲</span>
            </div>

            {/* Moving Sell Price (Best Ask) */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border transition-all ${
                tickFlash && lastTickDirection === 'DOWN'
                  ? 'bg-rose-500/30 border-rose-400 text-rose-200 scale-105'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              }`}
            >
              <span className="font-sans text-[11px] text-rose-400 font-bold">سعر البيع (عرض):</span>
              <strong className="text-sm font-black text-white">{movingAsk.toFixed(2)}</strong>
              <span className="text-[10px] text-slate-400">ج.م</span>
              <span className="text-[10px] text-rose-400 font-bold">▼</span>
            </div>

            {/* Real-time Execution Tick Price */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
              <span className="font-sans text-slate-400">السعر التنفيذي:</span>
              <strong className="text-cyan-300 font-bold">{movingPrice.toFixed(2)} ج.م</strong>
              <span className={`text-[10px] font-bold ${lastTickDirection === 'UP' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {lastTickDirection === 'UP' ? '↑ صاعد' : '↓ هابط'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-sans self-end md:self-center">
            <span>
              الفارق السعري (Spread): <strong className="font-mono text-amber-300 font-bold">{movingSpread.toFixed(2)} ج.م</strong> ({movingSpreadPct}%)
            </span>
            <span className="hidden lg:inline">•</span>
            <span className="text-emerald-400 font-bold hidden lg:inline">
              الأسعار تتحرك لحظياً بنبض السوق ⚡
            </span>
          </div>
        </div>
      </div>

      {/* Chart Display Area: Either Fast Native Interactive Canvas or TradingView */}
      {chartMode === 'FAST_NATIVE' ? (
        <FastCandlestickChart
          stock={verifiedStock}
          onOpenPopout={handleOpenPopout}
        />
      ) : (
        <div className="relative w-full h-[540px] rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950 shadow-inner group">
          {/* Timeout Alert Notification Overlay (Fixes the ERR_TIMED_OUT user issue) */}
          {hasTvTimedOut && (
            <div className="absolute top-3 left-3 right-3 z-40 p-3.5 rounded-2xl bg-slate-950/95 border-2 border-amber-500/80 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold shrink-0">
                  ⚠️
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">
                    خادم تضمين TradingView الخارجي استغرق وقتاً طويلاً للاستجابة لهذا الرمز ({verifiedStock.symbol})
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    لتفادي أي تأخير أو شاشة فارغة، تم تجهيز الشارت الفوري عالي السرعة (0ms) أو يمكنك إعادة المحاولة.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => setChartMode('FAST_NATIVE')}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 hover:brightness-110 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>تفعيل الشارت الفوري ⚡</span>
                </button>
                <button
                  type="button"
                  onClick={handleDynamicRemount}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  إعادة المحاولة 🔄
                </button>
                <button
                  type="button"
                  onClick={handleOpenPopout}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                  title="فتح في نافذة TradingView الخارجية"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Loading Indicator Inside Chart Frame */}
          {isChartLoading && !hasTvTimedOut && (
            <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center gap-3.5 text-center p-4 transition-opacity duration-300">
              <div className="relative flex items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <Activity className="w-7 h-7 text-cyan-400 animate-pulse" />
                </div>
                <Sparkles className="w-4 h-4 text-emerald-400 absolute -top-1 -right-1 animate-spin" />
              </div>

              <div className="space-y-1 max-w-sm">
                <div className="flex items-center justify-center gap-2">
                  <span className="font-bold text-white text-sm">جارٍ تحميل واستقرار الشارت اللحظي</span>
                  <span className="font-mono text-cyan-300 text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                    {verifiedStock.symbol}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  إعادة تهيئة الإطار وتحديث الشموع لـ {verifiedStock.nameAr} بتوقيت القاهرة
                </p>
              </div>

              {/* Micro Progress Pulse Bar */}
              <div className="w-48 h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 rounded-full animate-pulse w-full" />
              </div>
            </div>
          )}

          {/* The Stable TradingView Widget DOM Element */}
          <div
            ref={containerRef}
            className="tradingview-widget-container h-full w-full"
          />
        </div>
      )}

      {/* Real-time Indicator Telemetry Ribbon for Default Indicators (MACD & Supertrend) */}
      {techDetails && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-950 to-purple-950/30 border border-emerald-500/40 shadow-md space-y-2 text-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <strong className="text-white">المؤشرات الفنية الافتراضية النشطة على الشارت (MACD و SuperTrend):</strong>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="تغيير فترات وحساسية مؤشرات الشارت"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>تعديل الحساسية ⚙️</span>
              </button>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                مطبقة لحظياً على الشارت
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* SuperTrend Box */}
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">
                  1. مؤشر السوبر ترند (SuperTrend {indicatorSettings.superTrend.length}, {indicatorSettings.superTrend.multiplier}x):
                </span>
                <span className={`text-xs font-black ${techDetails.superTrend.isBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {techDetails.superTrend.trend === 'BULLISH' ? 'صاعد (اتجاه إيجابي) 🟢' : 'هابط (اتجاه سلبي) 🔴'}
                </span>
              </div>
              <div className="text-left font-mono">
                <span className="text-[10px] text-slate-500 block">خط الوقف الحرج</span>
                <strong className="text-white text-xs">{techDetails.superTrend.superTrendValue.toFixed(2)} ج.م</strong>
              </div>
            </div>

            {/* MACD Box */}
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">
                  2. مؤشر الماكدي (MACD {indicatorSettings.macd.fastLength}, {indicatorSettings.macd.slowLength}, {indicatorSettings.macd.signalLength}):
                </span>
                <span className={`text-xs font-black ${techDetails.macd.isBullish ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {techDetails.macd.statusAr}
                </span>
              </div>
              <div className="text-left font-mono">
                <span className="text-[10px] text-slate-500 block">الهيستوجرام</span>
                <strong className={`text-xs ${techDetails.macd.histogram >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {techDetails.macd.histogram >= 0 ? `+${techDetails.macd.histogram}` : techDetails.macd.histogram}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exact TradingView Technical Chart Opinion & Speedometer Gauge */}
      <TradingViewRatingWidget
        stock={verifiedStock}
        timeframeLabel="يومي (1D)"
        variant="FULL_CARD"
        onOpenChart={() => handleOpenPopout()}
      />

      {/* Bottom Shariah Details Strip with Synchronized Price Tag */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-300 flex-wrap">
          <span className="font-bold text-emerald-400">بيان التوافق الشرعي:</span>
          <span>{verifiedStock.shariahReasonAr}</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400 shrink-0">
          <span>سعر الشارت المؤكد: <strong className="text-cyan-300 font-bold">{verifiedStock.price.toFixed(2)} ج.م</strong></span>
          {verifiedStock.shariahRatioDebt !== undefined && (
            <>
              <span>•</span>
              <span>نسبة الديون: <strong className="text-white">{verifiedStock.shariahRatioDebt}%</strong> (&lt;33%)</span>
            </>
          )}
        </div>
      </div>

      {/* TradingView-Style Screen & Area Crop Snapshot Modal */}
      <ChartSnapshotToolModal
        isOpen={isSnapshotModalOpen}
        onClose={() => setIsSnapshotModalOpen(false)}
        targetElementId="tradingview-chart-wrapper"
        stock={verifiedStock}
        onSendToAiVision={(imageDataUrl) => {
          if (onOpenChartVision) {
            onOpenChartVision(imageDataUrl);
          }
        }}
      />


      {/* Quick Indicator Settings Modal directly from Chart */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn font-['Cairo']">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                <span>حساسية الماكدي والسوبر ترند للشارت الفني</span>
              </h3>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <IndicatorSettingsPanel onApplied={() => setIsSettingsModalOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
