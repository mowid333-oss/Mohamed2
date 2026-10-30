import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Zap,
  Target,
  TrendingUp,
  ShieldCheck,
  Timer,
  RefreshCw,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Flame,
  FileSpreadsheet,
  Layers,
  X,
  AlertTriangle,
  Eye,
  FileText,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Bell,
  BellRing,
} from 'lucide-react';
import { EGXStock } from '../types/stock';
import {
  scanAllMarketOpportunities,
  ScannedOpportunity,
  StrategyCategory,
} from '../services/dayTradingAnalystService';
import { playSonarPingSound, playNewOpportunityChime } from '../services/soundAlerts';
import { TradingViewRatingWidget } from './TradingViewRatingWidget';
import { copyStockSymbolToClipboard } from './CopyableStockSymbol';

interface LiveOpportunitiesTapeProps {
  stocks: EGXStock[];
  selectedSymbol: string;
  onSelectStock: (symbol: string) => void;
  onSelectStockForChart: (symbol: string) => void;
  onNavigateToScanner: () => void;
  shariahOnly: boolean;
  onOpenAdvisorWithSymbol?: (symbol: string) => void;
  onOpenReportWithStock?: (stock: EGXStock) => void;
  onClose?: () => void;
}

export const LiveOpportunitiesTape: React.FC<LiveOpportunitiesTapeProps> = ({
  stocks,
  selectedSymbol,
  onSelectStock,
  onSelectStockForChart,
  onNavigateToScanner,
  shariahOnly,
  onOpenAdvisorWithSymbol,
  onOpenReportWithStock,
  onClose,
}) => {
  // Update interval state in seconds (Default: 30 seconds for live dynamic updates)
  const [updateIntervalSec, setUpdateIntervalSec] = useState<number>(30);
  const [countdown, setCountdown] = useState<number>(updateIntervalSec);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [copiedOppSymbol, setCopiedOppSymbol] = useState<string | null>(null);

  // Audio alert state (User controllable with localStorage persistence, default: true)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('egx_opps_sound_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('egx_opps_sound_enabled', String(next));
        if (next) {
          playNewOpportunityChime();
        }
      } catch {}
      return next;
    });
  };

  // Ref tracking previous opportunity symbols to detect new additions
  const prevOpportunitySymbolsRef = useRef<Set<string>>(new Set());
  const isInitialScanRef = useRef<boolean>(true);

  // Set of newly detected symbols to highlight with glowing border & badge
  const [newlyDetectedSymbols, setNewlyDetectedSymbols] = useState<Set<string>>(new Set());

  // Floating visual toast alert for newly detected opportunity
  const [activeNewOpportunityAlert, setActiveNewOpportunityAlert] = useState<ScannedOpportunity | null>(null);
  const [isTapeFlashing, setIsTapeFlashing] = useState<boolean>(false);

  // Filter state inside tape
  const [tapeFilterGrade, setTapeFilterGrade] = useState<'ALL' | 'A_PLUS_ONLY'>('ALL');
  const [tapeStrategy, setTapeStrategy] = useState<StrategyCategory>('ALL');

  // Modal for inspecting detailed trading plan
  const [modalOpportunity, setModalOpportunity] = useState<ScannedOpportunity | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  // Default speed: 320s (extra calm and slow, can be toggled to 400s or 240s)
  const [tapeSpeedSeconds, setTapeSpeedSeconds] = useState<number>(320);

  const cycleTapeSpeed = () => {
    setTapeSpeedSeconds((prev) => {
      if (prev === 320) return 400; // Ultra slow crawl
      if (prev === 400) return 240; // Relaxed slow
      return 320; // Default calm
    });
  };

  // Scan opportunities periodically
  const rawOpportunities = useMemo(() => {
    return scanAllMarketOpportunities(
      stocks,
      tapeFilterGrade,
      shariahOnly,
      tapeStrategy,
      100000,
      0.5
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stocks, tapeFilterGrade, shariahOnly, tapeStrategy, refreshTrigger]);

  // Ensure minimum items in each set so the track fills wide viewports before looping
  const displaySet = useMemo(() => {
    if (rawOpportunities.length === 0) return [];
    if (rawOpportunities.length >= 10) return rawOpportunities;
    const factor = Math.ceil(10 / rawOpportunities.length);
    return Array(factor).fill(rawOpportunities).flat();
  }, [rawOpportunities]);

  // Periodic automatic update
  useEffect(() => {
    if (updateIntervalSec <= 0) return;

    const timer = setInterval(() => {
      setRefreshTrigger((prev) => prev + 1);
      setCountdown(updateIntervalSec);
    }, updateIntervalSec * 1000);

    return () => clearInterval(timer);
  }, [updateIntervalSec]);

  // 1-second countdown ticker
  useEffect(() => {
    if (updateIntervalSec <= 0) return;

    const ticker = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return updateIntervalSec;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(ticker);
  }, [updateIntervalSec]);

  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
    setCountdown(updateIntervalSec);
    try {
      if (soundEnabled) {
        playSonarPingSound();
      }
    } catch {}
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  }, [updateIntervalSec, soundEnabled]);

  // Detect newly discovered opportunities and trigger audio & visual alert
  useEffect(() => {
    if (rawOpportunities.length === 0) return;

    const currentSymbols = new Set(rawOpportunities.map((o) => o.stock.symbol));

    if (isInitialScanRef.current) {
      // First load: cache existing symbols without firing alarms
      prevOpportunitySymbolsRef.current = currentSymbols;
      isInitialScanRef.current = false;
      return;
    }

    // Identify opportunities that just appeared
    const brandNewOpps = rawOpportunities.filter(
      (o) => !prevOpportunitySymbolsRef.current.has(o.stock.symbol)
    );

    if (brandNewOpps.length > 0) {
      const latest = brandNewOpps[0];

      // 1. Audio Alert
      if (soundEnabled) {
        try {
          playNewOpportunityChime();
        } catch (e) {
          console.warn('Error playing opportunity chime:', e);
        }
      }

      // 2. Visual Alert: Tape header flash
      setIsTapeFlashing(true);
      setTimeout(() => setIsTapeFlashing(false), 5000);

      // 3. Visual Alert: Highlight newly detected cards
      const newSyms = new Set(brandNewOpps.map((o) => o.stock.symbol));
      setNewlyDetectedSymbols((prev) => new Set([...prev, ...newSyms]));

      setTimeout(() => {
        setNewlyDetectedSymbols((prev) => {
          const next = new Set(prev);
          brandNewOpps.forEach((o) => next.delete(o.stock.symbol));
          return next;
        });
      }, 75000);

      // 4. Visual Alert: Floating Toast
      setActiveNewOpportunityAlert(latest);
    }

    prevOpportunitySymbolsRef.current = currentSymbols;
  }, [rawOpportunities, soundEnabled]);

  // Auto-dismiss floating toast after 8 seconds
  useEffect(() => {
    if (!activeNewOpportunityAlert) return;
    const timer = setTimeout(() => {
      setActiveNewOpportunityAlert(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [activeNewOpportunityAlert]);

  // Scroll controls
  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleCopyAlert = (e: React.MouseEvent, opp: ScannedOpportunity) => {
    e.stopPropagation();
    navigator.clipboard.writeText(opp.rawAlertText);
    setCopiedOppSymbol(opp.stock.symbol);
    setTimeout(() => setCopiedOppSymbol(null), 2000);
  };

  // Reusable card renderer
  const renderOpportunityCard = (opp: ScannedOpportunity, keyPrefix: string) => {
    const isSelected = opp.stock.symbol === selectedSymbol;
    const isCopied = copiedOppSymbol === opp.stock.symbol;
    const isAPlus = opp.quality === 'A+';
    const isBrandNew = newlyDetectedSymbols.has(opp.stock.symbol);

    return (
      <div
        key={`${keyPrefix}-${opp.stock.symbol}`}
        dir="rtl"
        onClick={() => {
          onSelectStock(opp.stock.symbol);
          setModalOpportunity(opp);
        }}
        className={`shrink-0 flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer group shadow-sm ${
          isBrandNew
            ? 'bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border-amber-400 text-white shadow-lg shadow-amber-500/30 ring-2 ring-amber-400 animate-pulse'
            : isSelected
            ? 'bg-amber-950/40 border-amber-400 text-white shadow-amber-500/20 ring-1 ring-amber-400/50'
            : isAPlus
            ? 'bg-slate-900/90 hover:bg-slate-850 border-amber-500/40 hover:border-amber-400 text-slate-200'
            : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-cyan-500/40 text-slate-300'
        }`}
        title={`انقر لعرض خطة التداول الكاملة لسهم ${opp.stock.nameAr} (${opp.stock.symbol})`}
      >
        {/* Brand New Opportunity Pulsing Badge */}
        {isBrandNew && (
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 flex items-center gap-1 animate-bounce shrink-0 shadow-md">
            <Sparkles className="w-2.5 h-2.5 fill-slate-950" />
            <span>فرصة جديدة!</span>
          </span>
        )}

        {/* Quality Grade Tag */}
        <span
          className={`font-black text-[10px] px-1.5 py-0.5 rounded-md font-mono shrink-0 ${
            isAPlus
              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-sm'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}
        >
          {isAPlus ? '💎 A+' : '🟢 A'}
        </span>

        {/* Stock Symbol & Arabic Name */}
        <div className="flex items-baseline gap-1.5 shrink-0">
          <strong
            onClick={(e) => {
              e.stopPropagation();
              copyStockSymbolToClipboard(opp.stock.symbol, e);
            }}
            className="font-mono text-xs font-black text-white group-hover:text-amber-300 hover:text-cyan-300 hover:underline cursor-copy flex items-center gap-1 group/sym transition-colors"
            title={`انقر لنسخ رمز السهم (${opp.stock.symbol}) إلى الحافظة`}
          >
            {opp.stock.symbol}
            <Copy className="w-2.5 h-2.5 opacity-0 group-hover/sym:opacity-100 text-cyan-400 transition-opacity" />
          </strong>
          <span className="text-[11px] text-slate-300 truncate max-w-[100px] hidden sm:inline">
            {opp.stock.nameAr}
          </span>
        </div>

        {/* Strategy Badge */}
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800 shrink-0">
          {opp.strategyCategoryAr}
        </span>

        {/* TradingView Mini Rating Badge */}
        <TradingViewRatingWidget stock={opp.stock} variant="MINI_BADGE" />

        {/* Live Price */}
        <span className="font-mono text-xs font-bold text-slate-100 shrink-0">
          {opp.stock.price.toFixed(2)} ج.م
        </span>

        {/* Target Gain & R:R */}
        <div className="flex items-center gap-1.5 font-mono text-[11px] shrink-0 bg-slate-950/80 px-2 py-0.5 rounded-lg border border-slate-850">
          <span className="text-emerald-400 font-bold">
            TP1: +{opp.takeProfit1GainPct}%
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-300 font-bold text-[10px]">
            {opp.riskRewardRatio}
          </span>
        </div>

        {/* Shariah Icon */}
        {opp.stock.isShariahCompliant && (
          <span
            className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"
            title="سهم شريعة إسلامية معتمد"
          />
        )}

        {/* Quick Actions inside Card */}
        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => handleCopyAlert(e, opp)}
            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="نسخ خطة التداول الفورية"
          >
            {isCopied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3 text-amber-400" />
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectStockForChart(opp.stock.symbol);
            }}
            className="px-1.5 py-0.5 rounded-md bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-[10px] font-bold transition-colors"
            title="عرض الشارت اللحظي المباشر"
          >
            شارت
          </button>
        </div>
      </div>
    );
  };

  const handleTriggerTestAlert = () => {
    if (rawOpportunities.length > 0) {
      const opp = rawOpportunities[0];
      if (soundEnabled) {
        try {
          playNewOpportunityChime();
        } catch {}
      }
      setIsTapeFlashing(true);
      setTimeout(() => setIsTapeFlashing(false), 4000);
      setNewlyDetectedSymbols((prev) => new Set([...prev, opp.stock.symbol]));
      setActiveNewOpportunityAlert(opp);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-[#060b14] via-[#09111f] to-[#0a1424] border-b border-amber-500/30 py-1.5 px-2 sm:px-4 select-none text-xs font-['Cairo'] shadow-md relative z-20 overflow-hidden">
        <div className="max-w-[1850px] w-full mx-auto flex items-center justify-between gap-2 sm:gap-3">
          {/* Left Badge: Live Opportunities Tracker Branding & Periodic Timer */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 px-2 sm:px-2.5 py-1 rounded-xl shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
              <div className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
                <span className="font-black text-white text-xs tracking-wide whitespace-nowrap">
                  شريط الفرص
                </span>
              </div>
              <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-500/30 text-amber-300 border border-amber-500/40 whitespace-nowrap">
                {rawOpportunities.length} فرصة
              </span>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="text-amber-400/80 hover:text-white p-0.5 rounded cursor-pointer transition-colors"
                title={isPaused ? 'استئناف حركة شريط الفرص' : 'إيقاف حركة شريط الفرص مؤقتاً'}
              >
                {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3" />}
              </button>

              {/* Speed Controller Toggle */}
              <button
                type="button"
                onClick={cycleTapeSpeed}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-500/40 cursor-pointer transition-colors flex items-center gap-1 shrink-0"
                title={`السرعة الحالية: ${
                  tapeSpeedSeconds === 400
                    ? 'فائق الهدوء والبطء (400 ثانية)'
                    : tapeSpeedSeconds === 320
                    ? 'بطيء جداً ومريح (320 ثانية)'
                    : 'بطيء متزن (240 ثانية)'
                } - انقر للتبديل بين السرعات`}
              >
                <span>{tapeSpeedSeconds === 400 ? '🐢 فائق البطء' : tapeSpeedSeconds === 320 ? '🐌 بطيء جداً' : '🚶 متزن'}</span>
                <span className="font-mono text-[9px] text-slate-400">{tapeSpeedSeconds}s</span>
              </button>

              {/* Sound Alert Toggle (User Request: Audio Alert on New Opportunities) */}
              <button
                type="button"
                onClick={toggleSound}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1 shrink-0 ${
                  soundEnabled
                    ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 hover:bg-amber-500/35'
                    : 'bg-slate-900/90 text-slate-400 border border-slate-800 hover:text-white'
                }`}
                title={
                  soundEnabled
                    ? 'التنبيه الصوتي مفعل: رنين نغمي عند رصد أي فرصة جديدة (انقر للتعطيل)'
                    : 'التنبيه الصوتي صامت (انقر للتفعيل وسماع نغمة الرصد)'
                }
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-3 h-3 text-amber-400 animate-pulse" />
                    <span className="hidden xl:inline">صوت: مفعّل 🔔</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3 h-3 text-slate-400" />
                    <span className="hidden xl:inline">صوت: صامت 🔕</span>
                  </>
                )}
              </button>

              {/* Test Alert Button */}
              <button
                type="button"
                onClick={handleTriggerTestAlert}
                className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 cursor-pointer transition-colors hidden xl:flex items-center gap-1 shrink-0"
                title="تجربة التنبيه الصوتي والبصري للفرص الجديدة"
              >
                <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                <span>تجربة التنبيه</span>
              </button>

              {/* Visual Flash Banner when new opportunity is detected */}
              {isTapeFlashing && (
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-[10px] animate-bounce flex items-center gap-1 shadow-md shadow-amber-500/40 shrink-0">
                  <Sparkles className="w-3 h-3 fill-slate-950" />
                  <span>فرصة جديدة رُصدت! ⚡</span>
                </span>
              )}
            </div>

            {/* Periodic Auto-Update Indicator */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-xl text-[11px] text-slate-300">
              <Timer className="w-3 h-3 text-cyan-400" />
              <span className="text-slate-400">تحديث:</span>
              <span className="font-mono font-bold text-cyan-300 tabular-nums">
                {countdown}ث
              </span>
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="hover:text-white p-0.5 transition-colors cursor-pointer"
                title="تحديث فوري لفرص السوق الآن"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-amber-400' : 'text-slate-400'}`}
                />
              </button>
            </div>
          </div>

          {/* Manual Scroll Arrow (Right Side) */}
          <button
            onClick={() => handleScroll('right')}
            className="p-1 sm:p-1.5 text-amber-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-amber-500/30 rounded-lg cursor-pointer transition-colors shrink-0 shadow-sm"
            title="تمرير شريط الفرص لليمين"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Center: Continuous Scrolling Marquee Track */}
          <div
            dir="ltr"
            ref={scrollContainerRef}
            className="relative overflow-x-auto no-scrollbar flex-1 group marquee-track scroll-smooth"
            onWheel={(e) => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollLeft += e.deltaY;
              }
            }}
          >
            {displaySet.length === 0 ? (
              <div className="text-xs text-slate-400 py-1 px-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>جاري فحص جميع الأسهم لاستخراج الفرص عالية الجودة...</span>
              </div>
            ) : (
              <div
                style={{ animationDuration: `${tapeSpeedSeconds}s` }}
                className={`flex items-center gap-2.5 will-change-transform flex-nowrap ${
                  isPaused ? 'ticker-paused' : 'animate-opportunities-marquee'
                }`}
              >
                {/* First Set of Opportunities */}
                {displaySet.map((opp, idx) => renderOpportunityCard(opp, `opp-a-${idx}`))}
                {/* Second Duplicate Set for Endless Seamless Continuous Marquee */}
                {displaySet.map((opp, idx) => renderOpportunityCard(opp, `opp-b-${idx}`))}
              </div>
            )}
          </div>

          {/* Manual Scroll Arrow (Left Side) */}
          <button
            onClick={() => handleScroll('left')}
            className="p-1 sm:p-1.5 text-amber-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-amber-500/30 rounded-lg cursor-pointer transition-colors shrink-0 shadow-sm"
            title="تمرير شريط الفرص لليسار"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Right Action: Open All in Scanner */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onNavigateToScanner}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-1 sm:gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              title="فتح شاشة ماسح الأسهم الشاملة واستخراج خطط التداول"
            >
              <Target className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">كل الفرص ({rawOpportunities.length})</span>
              <span className="sm:hidden">الفرص</span>
              <ArrowRight className="w-3 h-3" />
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 sm:p-1.5 text-slate-400 hover:text-rose-400 bg-slate-900/90 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-800 rounded-lg cursor-pointer transition-colors shrink-0 shadow-sm"
                title="إخفاء شريط رادار الفرص اللحظية"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Interactive Trading Plan Modal */}
      {modalOpportunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-['Cairo'] animate-fadeIn">
          <div className="bg-[#0b0f17] border border-amber-500/50 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-mono font-black text-amber-300 text-base">
                  {modalOpportunity.stock.symbol}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-white">
                      {modalOpportunity.stock.nameAr}
                    </h3>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300">
                      {modalOpportunity.setupBadgeAr}
                    </span>
                    {modalOpportunity.stock.isShariahCompliant && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                        متوافق مع الشريعة ✅
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    القطاع: {modalOpportunity.stock.sectorAr} • السعر اللحظي: {modalOpportunity.stock.price.toFixed(2)} ج.م
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalOpportunity(null)}
                className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Strategy Title */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs text-amber-400 font-bold block">
                النموذج الفني المكتشف:
              </span>
              <p className="text-xs text-slate-200 font-semibold leading-relaxed">
                {modalOpportunity.setupType}
              </p>
            </div>

            {/* Exact TradingView Technical Chart Opinion & Levels */}
            <TradingViewRatingWidget
              stock={modalOpportunity.stock}
              timeframeLabel="يومي (1D)"
              variant="COMPACT_BANNER"
              onOpenChart={onSelectStockForChart}
            />

            {/* Key Numbers Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs font-mono">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">نطاق الدخول</span>
                <span className="text-sm font-bold text-white mt-1 block">
                  {modalOpportunity.entryZoneMin} - {modalOpportunity.entryZoneMax}
                </span>
                <span className="text-[10px] text-cyan-300 block font-sans">
                  المثالي: {modalOpportunity.entryOptimal} ج.م
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-rose-500/40">
                <span className="text-[10px] text-rose-400 block font-sans">وقف الخسارة SL</span>
                <span className="text-sm font-bold text-rose-400 mt-1 block">
                  {modalOpportunity.stopLoss.toFixed(2)} ج.م
                </span>
                <span className="text-[10px] text-rose-400/80 block">
                  -{modalOpportunity.stopLossPct}%
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-emerald-500/40">
                <span className="text-[10px] text-emerald-400 block font-sans">الهدف 1 (50%)</span>
                <span className="text-sm font-bold text-emerald-300 mt-1 block">
                  {modalOpportunity.takeProfit1.toFixed(2)} ج.م
                </span>
                <span className="text-[10px] text-emerald-400 block">
                  +{modalOpportunity.takeProfit1GainPct}% تأمين 🛡️
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-teal-500/40">
                <span className="text-[10px] text-teal-400 block font-sans">الهدف 2 (30%)</span>
                <span className="text-sm font-bold text-teal-300 mt-1 block">
                  {modalOpportunity.takeProfit2.toFixed(2)} ج.م
                </span>
                <span className="text-[10px] text-teal-300 block">
                  +{modalOpportunity.takeProfit2GainPct}% جني 💰
                </span>
              </div>
            </div>

            {/* Position Sizing and Money Risk Breakdown */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-850 flex items-center justify-between text-xs font-mono text-slate-300 flex-wrap gap-2">
              <div>
                <span className="text-slate-500 font-sans">الكمية المقترحة: </span>
                <span className="text-white font-bold">{modalOpportunity.recommendedShares.toLocaleString()} سهم</span>
              </div>
              <div>
                <span className="text-slate-500 font-sans">قيمة الصفقة: </span>
                <span className="text-cyan-300 font-bold">{modalOpportunity.totalPositionValueEgp.toLocaleString()} ج.م</span>
              </div>
              <div>
                <span className="text-slate-500 font-sans">أقصى مخاطرة: </span>
                <span className="text-rose-400 font-bold">-{modalOpportunity.maxRiskAmountEgp.toLocaleString()} ج.م</span>
              </div>
              <div>
                <span className="text-slate-500 font-sans">العائد للمخاطرة: </span>
                <span className="text-amber-300 font-bold">{modalOpportunity.riskRewardRatio}</span>
              </div>
            </div>

            {/* Execution Plan Steps */}
            <div className="space-y-1.5 text-xs text-slate-300">
              <span className="font-bold text-white block">خطوات التنفيذ والإدارة الذكية:</span>
              {modalOpportunity.executionPlanStepsAr.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="w-4 h-4 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center text-[10px] shrink-0 font-mono">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>

            {/* Invalidation Alert */}
            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{modalOpportunity.invalidationAr}</span>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleCopyAlert(e, modalOpportunity)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Copy className="w-4 h-4" />
                  <span>
                    {copiedOppSymbol === modalOpportunity.stock.symbol
                      ? 'تم النسخ بنجاح ✅'
                      : 'نسخ خطة التداول 📋'}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onSelectStockForChart(modalOpportunity.stock.symbol);
                    setModalOpportunity(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                >
                  فتح الشارت اللحظي 📊
                </button>

                <button
                  onClick={() => {
                    onSelectStock(modalOpportunity.stock.symbol);
                    onNavigateToScanner();
                    setModalOpportunity(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold cursor-pointer"
                >
                  فتح في ماسح الصفقات 🚀
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Real-time Visual Toast Alert for newly detected opportunity (User Request: تنبيه بصري) */}
      {activeNewOpportunityAlert && (
        <div
          dir="rtl"
          className="fixed bottom-6 left-6 z-50 max-w-md w-[92vw] sm:w-[420px] bg-gradient-to-r from-slate-950 via-[#0d1726] to-[#0a1824] border-2 border-amber-400 rounded-2xl p-4 shadow-2xl shadow-amber-500/30 backdrop-blur-xl animate-in slide-in-from-bottom-5 font-['Cairo'] text-white space-y-3"
        >
          {/* Toast Header */}
          <div className="flex items-start justify-between gap-3 border-b border-amber-500/30 pb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/30 shrink-0">
                <Zap className="w-5 h-5 fill-slate-950 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <strong className="text-amber-300 text-xs font-black">
                    رُصدت فرصة جديدة في شريط الفرص! ⚡
                  </strong>
                  <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[9px] font-black">
                    {activeNewOpportunityAlert.quality}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  تنبيه لحظي مباشر • جودة عالية
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveNewOpportunityAlert(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Toast Body */}
          <div className="flex items-center justify-between gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-black text-amber-400">
                  {activeNewOpportunityAlert.stock.symbol}
                </span>
                <span className="text-xs font-bold text-white">
                  {activeNewOpportunityAlert.stock.nameAr}
                </span>
              </div>
              <span className="text-[11px] text-cyan-300 font-bold block mt-0.5">
                {activeNewOpportunityAlert.setupType}
              </span>
            </div>

            <div className="text-left font-mono tabular-nums">
              <div className="text-xs font-bold text-slate-200">
                {activeNewOpportunityAlert.stock.price.toFixed(2)} ج.م
              </div>
              <div className="text-[11px] font-black text-emerald-400">
                TP1: +{activeNewOpportunityAlert.takeProfit1GainPct}% 🎯
              </div>
            </div>
          </div>

          {/* Toast Actions */}
          <div className="flex items-center justify-between pt-1 gap-2">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <span>العائد للمخاطرة:</span>
              <strong className="text-amber-300 font-mono">{activeNewOpportunityAlert.riskRewardRatio}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onSelectStockForChart(activeNewOpportunityAlert.stock.symbol);
                  setActiveNewOpportunityAlert(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-[11px] font-bold transition-colors cursor-pointer"
              >
                فتح الشارت 📈
              </button>
              <button
                onClick={() => {
                  onSelectStock(activeNewOpportunityAlert.stock.symbol);
                  setModalOpportunity(activeNewOpportunityAlert);
                  setActiveNewOpportunityAlert(null);
                }}
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[11px] hover:brightness-110 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              >
                عرض الخطة 🎯
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
