import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Building2,
  TrendingUp,
  Target,
  ExternalLink,
  ShieldCheck,
  Award,
  Layers,
  FileText,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Clock,
  Sparkles,
  Bot,
  Play,
  Pause,
  ArrowUpRight,
  TrendingDown,
  DollarSign,
  Percent,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';
import { EGXStock } from '../types/stock';
import {
  fetchLiveAnalystForecasts,
  queryAiAnalystSearch,
  StockAnalystConsensus,
  AnalystReportItem,
  LiveAiAnalystNote,
} from '../services/analystOpinionsService';
import { verifyAndSyncReportPrice } from '../utils/priceVerificationService';
import { getCairoCurrentTimeFormatted } from '../utils/reportDisclaimer';

interface AnalystForecastsWidgetProps {
  stock: EGXStock;
  onSelectRelatedStock?: (symbol: string) => void;
  className?: string;
}

export const AnalystForecastsWidget: React.FC<AnalystForecastsWidgetProps> = ({
  stock,
  onSelectRelatedStock,
  className = '',
}) => {
  // Synchronize stock with guaranteed verified chart price
  const verifiedStock = useMemo(() => {
    return verifyAndSyncReportPrice(stock).verifiedStock;
  }, [stock]);

  // Consensus & Forecast state
  const [consensus, setConsensus] = useState<StockAnalystConsensus | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastFetchedTimeStr, setLastFetchedTimeStr] = useState<string>(() => getCairoCurrentTimeFormatted());

  // Auto-refresh timer state (Periodic background fetching)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  const [refreshIntervalSec, setRefreshIntervalSec] = useState<number>(60);
  const [countdownSec, setCountdownSec] = useState<number>(60);

  // Filter & sorting states
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'BUY' | 'HOLD'>('ALL');
  const [sortBy, setSortBy] = useState<'TARGET_DESC' | 'UPSIDE_DESC' | 'DATE_DESC'>('TARGET_DESC');

  // AI Live Search state
  const [isAiSearching, setIsAiSearching] = useState<boolean>(false);
  const [aiNotes, setAiNotes] = useState<LiveAiAnalystNote[]>([]);
  const [showAiNotes, setShowAiNotes] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Show temporary toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Core Data Fetching function
  const loadForecasts = useCallback(
    async (forceRefresh: boolean = false) => {
      setIsFetching(true);
      setFetchError(null);
      try {
        const data = await fetchLiveAnalystForecasts(verifiedStock, forceRefresh);
        setConsensus(data);
        setLastFetchedTimeStr(getCairoCurrentTimeFormatted());
        setCountdownSec(refreshIntervalSec);
        if (forceRefresh) {
          showToast(`تم تحديث توقعات المحللين لسهم ${verifiedStock.nameAr} بنجاح ✅`);
        }
      } catch (err: any) {
        console.error('Failed to load analyst forecasts:', err);
        setFetchError('تعذر جلب بعض تقارير المحللين مؤقتاً، جاري استخدام النماذج الاحتياطية.');
      } finally {
        setIsFetching(false);
      }
    },
    [verifiedStock, refreshIntervalSec]
  );

  // Load when stock changes or on mount
  useEffect(() => {
    setAiNotes([]);
    setShowAiNotes(false);
    loadForecasts(false);
  }, [verifiedStock.symbol, verifiedStock.price, loadForecasts]);

  // Periodic Auto-refresh Countdown
  useEffect(() => {
    if (!autoRefreshEnabled) {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      return;
    }

    countdownTimerRef.current = setInterval(() => {
      setCountdownSec((prev) => {
        if (prev <= 1) {
          // Trigger periodic update
          loadForecasts(true);
          return refreshIntervalSec;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [autoRefreshEnabled, refreshIntervalSec, loadForecasts]);

  // Trigger live AI search for breaking commentary
  const handleTriggerAiSearch = async () => {
    setIsAiSearching(true);
    setShowAiNotes(true);
    try {
      const notes = await queryAiAnalystSearch(verifiedStock);
      setAiNotes(notes);
      showToast('تم رصد أحدث مذكرات السوق عبر بحث Google الذكي 🌐');
    } catch (e) {
      console.warn('AI search failed:', e);
    } finally {
      setIsAiSearching(false);
    }
  };

  // Filtered & Sorted reports
  const displayReports = useMemo(() => {
    if (!consensus?.reports) return [];
    let list = [...consensus.reports];

    // Filter
    if (selectedFilter === 'BUY') {
      list = list.filter((r) => r.recommendation === 'BUY' || r.recommendation === 'STRONG_BUY');
    } else if (selectedFilter === 'HOLD') {
      list = list.filter((r) => r.recommendation === 'HOLD');
    }

    // Sort
    if (sortBy === 'TARGET_DESC') {
      list.sort((a, b) => b.targetFairValue - a.targetFairValue);
    } else if (sortBy === 'UPSIDE_DESC') {
      list.sort((a, b) => b.upsidePct - a.upsidePct);
    } else if (sortBy === 'DATE_DESC') {
      list.sort((a, b) => b.id.localeCompare(a.id));
    }

    return list;
  }, [consensus, selectedFilter, sortBy]);

  if (!consensus && isFetching) {
    return (
      <div className={`p-6 rounded-2xl bg-[#090d16] border border-cyan-500/30 text-center font-['Cairo'] ${className}`}>
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <h4 className="text-sm font-bold text-white">جاري جلب أحدث آراء وتوقعات المحللين الماليين المعتمدين...</h4>
          <p className="text-xs text-slate-400 font-mono">EGX Research Hub · Synchronizing with Live Chart</p>
        </div>
      </div>
    );
  }

  if (!consensus) return null;

  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-[#0a0e17] p-4 sm:p-6 shadow-2xl space-y-5 font-['Cairo'] text-slate-200 relative ${className}`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl bg-emerald-500/90 text-slate-950 font-bold text-xs shadow-xl backdrop-blur-md flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Regular Updating Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/25 shrink-0">
            <div className="w-full h-full bg-[#070b12] rounded-[14px] flex items-center justify-center text-cyan-300">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>توقعات وآراء المحللين الماليين المعتمدين</span>
                <span className="text-xs text-cyan-400 font-normal">({consensus.nameAr})</span>
              </h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold font-mono">
                {consensus.symbol} · {consensus.totalReportsCount} تقارير أبحاث
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>جلب دوري منتظم 🟢</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              القيم العادلة المستهدفة وتوقعات النمو المالي من كبرى بيوت الأبحاث والوساطة المعتمدة مع الروابط الرسمية
            </p>
          </div>
        </div>

        {/* Regular Update HUD Controls */}
        <div className="flex items-center gap-2 flex-wrap self-stretch lg:self-auto justify-end">
          {/* Auto-Refresh Countdown Pill */}
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 transition-all ${
              autoRefreshEnabled
                ? 'bg-slate-900 border-cyan-500/30 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
            title="حالة التحديث الدوري التلقائي للبيانات"
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-[11px]">
              {autoRefreshEnabled ? `تحديث تلقائي: ${countdownSec}ث` : 'التحديث التلقائي متوقف'}
            </span>
            <button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title={autoRefreshEnabled ? 'إيقاف مؤقت للتحديث التلقائي' : 'تفعيل التحديث التلقائي المنتظم'}
            >
              {autoRefreshEnabled ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
            </button>
          </div>

          {/* Refresh Interval Selector */}
          <select
            value={refreshIntervalSec}
            onChange={(e) => {
              const val = Number(e.target.value);
              setRefreshIntervalSec(val);
              setCountdownSec(val);
            }}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-mono"
            title="فترة التحديث الدوري"
          >
            <option value={30}>كل 30 ثانية</option>
            <option value={60}>كل 60 ثانية</option>
            <option value={120}>كل دقيقتين</option>
          </select>

          {/* Instant Manual Refresh Button */}
          <button
            onClick={() => loadForecasts(true)}
            disabled={isFetching}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
            title="إعادة جلب وتحديث آراء وتوقعات المحللين الآن"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>{isFetching ? 'جاري الجلب...' : 'تحديث الآن 🔄'}</span>
          </button>

          {/* AI Search Intelligence Button */}
          <button
            onClick={handleTriggerAiSearch}
            disabled={isAiSearching}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
            title="فحص مذكرات وتقارير السوق اللحظية عبر بحث Google والذكاء الاصطناعي"
          >
            <Bot className="w-3.5 h-3.5 text-slate-950" />
            <span>{isAiSearching ? 'جاري الرصد...' : 'رصد AI 🌐'}</span>
          </button>
        </div>
      </div>

      {/* Target Price & Consensus KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-right">
        {/* KPI 1: Average Target Fair Value */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/40 relative overflow-hidden group">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="font-bold text-slate-300">متوسط القيمة العادلة</span>
            <Target className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white tabular-nums">
            {consensus.averageTargetPrice.toFixed(2)}{' '}
            <span className="text-xs font-sans text-slate-400">ج.م</span>
          </div>
          <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1 font-mono">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>صعود متوقع: +{consensus.upsidePotentialPct}%</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            مقارنة بالسعر اللحظي: <strong className="text-white font-mono">{consensus.currentChartPrice.toFixed(2)} ج.م</strong>
          </div>
        </div>

        {/* KPI 2: Overall Institutional Consensus */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="font-bold text-slate-300">إجماع بيوت الأبحاث</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-black text-emerald-400 flex items-center gap-1.5 mt-0.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{consensus.overallRatingAr}</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1.5">
            {consensus.buyCount} شراء قوي مقابل {consensus.holdCount} احتفاظ
          </span>
        </div>

        {/* KPI 3: Target Range (Lowest - Highest) */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="font-bold text-slate-300">نطاق التقييمات العادلة</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-white tabular-nums mt-0.5">
            {consensus.lowestTarget.toFixed(2)} - {consensus.highestTarget.toFixed(2)}{' '}
            <span className="text-xs font-sans text-slate-400">ج.م</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-bold block mt-1.5">
            {consensus.forecasts.fairValuePricedInAr}
          </span>
        </div>

        {/* KPI 4: Recommendation Breakdown Bar */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-bold text-slate-300">توزيع التوصيات المؤسسية</span>
            <span className="font-mono text-emerald-400 font-bold">{consensus.buyPct}% شراء</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden flex">
            <div
              style={{ width: `${consensus.buyPct}%` }}
              className="bg-emerald-500 h-full transition-all duration-500"
              title={`شراء: ${consensus.buyPct}%`}
            />
            <div
              style={{ width: `${consensus.holdPct}%` }}
              className="bg-amber-500 h-full transition-all duration-500"
              title={`احتفاظ: ${consensus.holdPct}%`}
            />
            <div
              style={{ width: `${consensus.sellPct}%` }}
              className="bg-rose-500 h-full transition-all duration-500"
              title={`بيع: ${consensus.sellPct}%`}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="text-emerald-400 font-bold">{consensus.buyCount} شراء</span>
            <span className="text-amber-400 font-bold">{consensus.holdCount} احتفاظ</span>
            <span className="text-rose-400 font-bold">{consensus.sellCount} بيع</span>
          </div>
        </div>
      </div>

      {/* Financial Forecasts & Projections Strip (توقعات الأداء المالي للعام القادم) */}
      <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>توقعات الأداء المالي والنمو التشغيلي ({consensus.forecasts.forecastPeriodAr})</span>
          </span>
          <span className="text-[10px] font-mono text-cyan-400">
            نمذجة مالية معتمدة وفق مكررات الربحية والتدفقات النقدية
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-right">
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">نمو الإيرادات المتوقع</span>
            <strong className="text-sm font-mono font-bold text-emerald-400 tabular-nums">
              +{consensus.forecasts.expectedRevenueGrowthPct}%
            </strong>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">نمو صافي الأرباح</span>
            <strong className="text-sm font-mono font-bold text-emerald-400 tabular-nums">
              +{consensus.forecasts.expectedNetProfitGrowthPct}%
            </strong>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">مضاعف الربحية المستهدف (P/E)</span>
            <strong className="text-sm font-mono font-bold text-cyan-300 tabular-nums">
              {consensus.forecasts.targetPeRatio}x
            </strong>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">العائد المتوقع على التوزيعات</span>
            <strong className="text-sm font-mono font-bold text-amber-300 tabular-nums">
              {consensus.forecasts.expectedDividendYieldPct}% سنوياً
            </strong>
          </div>
        </div>
      </div>

      {/* AI Live Notes Section (If triggered or available) */}
      {showAiNotes && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-teal-950/40 to-cyan-950/40 border border-teal-500/40 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-teal-400" />
              <span className="font-bold text-white">
                أحدث مذكرات السوق وإفصاحات المحللين المباشرة (Google AI Search)
              </span>
            </div>
            <button
              onClick={() => setShowAiNotes(false)}
              className="text-[11px] text-slate-400 hover:text-white"
            >
              إخفاء ✕
            </button>
          </div>

          {isAiSearching ? (
            <div className="flex items-center gap-2 text-xs text-teal-300 py-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>جاري مسح أحدث الأخبار وتوصيات المحللين الماليين عبر بحث Google...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {aiNotes.map((note, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-950/80 border border-teal-500/20 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-bold text-teal-300">{note.sourceName}</span>
                    <span className="font-mono text-[10px]">{note.timeAgo}</span>
                  </div>
                  <h5 className="font-bold text-white text-xs">{note.headline}</h5>
                  <p className="text-slate-300 leading-relaxed text-[11px]">{note.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter and Sorting Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        {/* Recommendation Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              selectedFilter === 'ALL'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            جميع التقارير ({consensus.reports.length})
          </button>
          <button
            onClick={() => setSelectedFilter('BUY')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              selectedFilter === 'BUY'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            توصيات الشراء ({consensus.buyCount})
          </button>
          <button
            onClick={() => setSelectedFilter('HOLD')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              selectedFilter === 'HOLD'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            توصيات الاحتفاظ ({consensus.holdCount})
          </button>
        </div>

        {/* Sorting selector */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>الترتيب حسب:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1 focus:outline-none focus:border-cyan-500 font-bold"
          >
            <option value="TARGET_DESC">الأعلى سعراً مستهدفاً</option>
            <option value="UPSIDE_DESC">أعلى نسبة صعود متوقعة</option>
            <option value="DATE_DESC">أحدث التقارير</option>
          </select>
        </div>
      </div>

      {/* Individual Accredited Research Reports Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {displayReports.map((rep) => (
          <div
            key={rep.id}
            className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between gap-3 shadow-md"
          >
            <div>
              {/* Header: Institution & Rating Pill */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>{rep.institutionAr}</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                    {rep.institutionEn}
                  </span>
                </div>

                <span
                  className={`text-xs px-2.5 py-1 rounded-lg font-bold shrink-0 ${
                    rep.recommendation === 'STRONG_BUY'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : rep.recommendation === 'BUY'
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {rep.recommendationAr}
                </span>
              </div>

              {/* Targets Strip */}
              <div className="grid grid-cols-3 gap-2 my-3 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block">السعر المستهدف</span>
                  <strong className="text-sm font-mono font-bold text-white tabular-nums">
                    {rep.targetFairValue.toFixed(2)} ج.م
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">نسبة الصعود/الهبوط</span>
                  <strong className={`text-sm font-mono font-bold tabular-nums ${rep.upsidePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {rep.upsidePct >= 0 ? '+' : ''}{rep.upsidePct}%
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">تاريخ الإصدار</span>
                  <span className="text-[11px] text-slate-300 font-medium block mt-0.5">
                    {rep.reportDate}
                  </span>
                </div>
              </div>

              {/* Valuation Methodology Badge */}
              {rep.valuationMethodAr && (
                <div className="mb-2 p-1.5 px-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] text-cyan-300 font-medium flex items-center gap-1.5">
                  <span className="text-slate-500 font-bold">المنهجية:</span>
                  <span>{rep.valuationMethodAr}</span>
                </div>
              )}

              {/* Investment Thesis & Catalysts */}
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {rep.analystThesisAr}
              </p>
            </div>

            {/* Source & Verified External Link */}
            <div className="pt-2.5 border-t border-slate-800/70 flex items-center justify-between text-[11px] text-slate-400">
              <span className="truncate max-w-[260px] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>المصدر: <strong className="text-slate-200 font-medium">{rep.accreditedSource}</strong></span>
              </span>

              <a
                href={rep.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                referrerPolicy="no-referrer"
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold transition-colors shrink-0 bg-cyan-950/40 hover:bg-cyan-900/50 px-2 py-0.5 rounded-lg border border-cyan-800/40"
                title="فتح المصدر وبيانات السهم المعتمدة على TradingView"
              >
                <span>المصدر المعتمد</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info: Synchronized Chart Price Tag & Legal Notice */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-2 flex-wrap">
          <span>توقيت آخر جلب معتمد: <strong className="text-slate-300 font-mono">{lastFetchedTimeStr}</strong></span>
          <span>•</span>
          <span>سعر الشارت المتطابق: <strong className="text-cyan-300 font-mono font-bold">{consensus.currentChartPrice.toFixed(2)} ج.م</strong></span>
        </div>
        <div className="text-[10px] text-slate-500">
          التقارير استرشادية مبنية على إفصاحات البورصة المصرية ومذكرات بيوت الخبرة الاستثمارية المعتمدة
        </div>
      </div>
    </div>
  );
};
