import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  ShieldCheck,
  RefreshCw,
  Timer,
  BookOpen,
  Wrench,
  Activity,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react';
import { getEgxMarketStatus } from '../utils/marketHours';
import { MarketSessionStatus, WatchlistCategory } from '../types/stock';
import { HealthStatusLevel } from '../services/systemHealthService';
import { EGX_MARKET_INDICES, MarketIndexItem, getLiveCalculatedIndices } from '../data/marketIndices';
import { EGXStock } from '../types/stock';

interface DailyEgxMarketStatusBarProps {
  lastUpdated: string;
  totalStocksCount: number;
  shariahCount: number;
  isLiveFeed: boolean;
  onRefresh: () => void;
  isLoading: boolean;
  refreshInterval: number;
  onRefreshIntervalChange: (intervalSec: number) => void;
  countdownSeconds: number;
  onOpenHealthModal?: () => void;
  healthScore?: number;
  healthStatus?: HealthStatusLevel;
  onOpenUserGuide?: () => void;
  onNavigateToDayTradingScanner?: () => void;
  onSelectCategory?: (category: WatchlistCategory) => void;
  stocks?: EGXStock[];
  onClose?: () => void;
}

export const DailyEgxMarketStatusBar: React.FC<DailyEgxMarketStatusBarProps> = ({
  lastUpdated,
  totalStocksCount,
  shariahCount,
  isLiveFeed,
  onRefresh,
  isLoading,
  refreshInterval,
  onRefreshIntervalChange,
  countdownSeconds,
  onOpenHealthModal,
  healthScore = 100,
  healthStatus = 'OPTIMAL',
  onOpenUserGuide,
  onNavigateToDayTradingScanner,
  onSelectCategory,
  stocks,
  onClose,
}) => {
  const [session, setSession] = useState<MarketSessionStatus>(getEgxMarketStatus());
  const [isIndicesPaused, setIsIndicesPaused] = useState(false);
  const marqueeContainerRef = useRef<HTMLDivElement>(null);

  const liveIndices = React.useMemo(() => getLiveCalculatedIndices(stocks), [stocks]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (marqueeContainerRef.current) {
      const amount = direction === 'left' ? -260 : 260;
      marqueeContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setSession(getEgxMarketStatus());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-[#05080e] border-b border-slate-800/80 px-2 sm:px-4 lg:px-6 py-1.5 text-xs font-['Cairo'] select-none">
      <div className="max-w-[1850px] w-full mx-auto flex items-center justify-between gap-2.5">
        {/* Left: Cairo Time & Official Market Session Status + Play/Pause Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded-xl">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                session.isOpen ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
              }`}
            />
            <span className="font-bold text-white text-[11px] whitespace-nowrap">
              {session.statusTextAr}
            </span>
            <span className="text-slate-600 hidden sm:inline" aria-hidden="true">
              ·
            </span>
            <div className="hidden sm:flex items-center gap-1 text-slate-300 font-mono text-[10px]">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>{session.cairoTimeFormatted}</span>
            </div>
            <button
              onClick={() => setIsIndicesPaused(!isIndicesPaused)}
              className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer transition-colors"
              title={isIndicesPaused ? 'استئناف حركة شريط المؤشرات' : 'إيقاف حركة شريط المؤشرات مؤقتاً'}
            >
              {isIndicesPaused ? <Play className="w-2.5 h-2.5 text-emerald-400" /> : <Pause className="w-2.5 h-2.5" />}
            </button>
          </div>
        </div>

        {/* Center: Left & Right Scroll Buttons Flanking Continuous Moving Marquee */}
        <div className="flex items-center gap-1 flex-1 overflow-hidden">
          <button
            onClick={() => handleScroll('left')}
            className="p-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 transition-colors shrink-0 cursor-pointer shadow-sm"
            title="تمرير المؤشرات لليسار"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div
            dir="ltr"
            ref={marqueeContainerRef}
            className="relative overflow-x-auto no-scrollbar flex-1 group mx-1 marquee-track scroll-smooth"
            onWheel={(e) => {
              if (marqueeContainerRef.current) {
                marqueeContainerRef.current.scrollLeft += e.deltaY;
              }
            }}
          >
            <div
              className={`flex items-center gap-2 will-change-transform flex-nowrap ${
                isIndicesPaused ? 'ticker-paused' : 'animate-indices-marquee'
              }`}
            >
            {/* Set A of Market Indices */}
            {liveIndices.map((idx) => (
              <button
                key={`idx-a-${idx.id}`}
                dir="rtl"
                onClick={() => onSelectCategory?.(idx.categoryFilter)}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-[11px] shrink-0 transition-colors cursor-pointer group/idx"
                title={`${idx.nameAr} - ${idx.descriptionAr}`}
              >
                <span className="font-mono font-bold text-cyan-300 group-hover/idx:text-white">
                  {idx.symbol}
                </span>
                <span className="font-mono text-slate-200">
                  {idx.points.toLocaleString()}
                </span>
                <span
                  className={`font-mono font-bold text-[10px] flex items-center gap-0.5 ${
                    idx.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {idx.changePct >= 0 ? '+' : ''}{idx.changePct}%
                </span>
              </button>
            ))}

            {/* Extra Session Vitals in the loop */}
            <div dir="rtl" className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>الجلسة: <strong className="text-white">10:00 ص - 02:30 م</strong></span>
            </div>
            <div dir="rtl" className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 shrink-0">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>الشريعة: <strong className="text-white">{shariahCount} سهم</strong></span>
            </div>

            {/* Set B (Duplicate for Endless Seamless Continuous Loop) */}
            {liveIndices.map((idx) => (
              <button
                key={`idx-b-${idx.id}`}
                dir="rtl"
                onClick={() => onSelectCategory?.(idx.categoryFilter)}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-[11px] shrink-0 transition-colors cursor-pointer group/idx"
                title={`${idx.nameAr} - ${idx.descriptionAr}`}
              >
                <span className="font-mono font-bold text-cyan-300 group-hover/idx:text-white">
                  {idx.symbol}
                </span>
                <span className="font-mono text-slate-200">
                  {idx.points.toLocaleString()}
                </span>
                <span
                  className={`font-mono font-bold text-[10px] flex items-center gap-0.5 ${
                    idx.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {idx.changePct >= 0 ? '+' : ''}{idx.changePct}%
                </span>
              </button>
            ))}

            <div dir="rtl" className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>الجلسة: <strong className="text-white">10:00 ص - 02:30 م</strong></span>
            </div>
            <div dir="rtl" className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 shrink-0">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>الشريعة: <strong className="text-white">{shariahCount} سهم</strong></span>
            </div>
          </div>
        </div>

        <button
          onClick={() => handleScroll('right')}
          className="p-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 transition-colors shrink-0 cursor-pointer shadow-sm"
          title="تمرير المؤشرات لليمين"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

        {/* Right: Controls, Health Check & Refresh */}
        <div className="flex items-center gap-2 text-slate-400 text-[11px] shrink-0">
          {/* Shariah Count */}
          <div className="hidden lg:flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-bold">
              {shariahCount} سهم شريعة معتمد
            </span>
          </div>

          <span className="text-slate-700 hidden lg:inline" aria-hidden="true">
            ·
          </span>

          {/* Last updated timestamp */}
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-slate-400">آخر تحديث:</span>
            <span className="text-cyan-300 font-bold font-mono">{lastUpdated}</span>
          </div>

          {/* Auto-Refresh Interval Selector (User Control, Default: 1 Minute) */}
          <div className="flex items-center gap-1.5 bg-slate-900/95 border border-slate-700/80 rounded-xl px-2.5 py-1 shadow-sm">
            <Timer className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-slate-300 font-bold hidden sm:inline">فترة التحديث:</span>
            <select
              value={refreshInterval}
              onChange={(e) => onRefreshIntervalChange(Number(e.target.value))}
              className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer text-xs font-['Cairo']"
              title="تحديد فترة التحديث التلقائي لبيانات وأسعار البورصة المصرية"
            >
              <option value={15} className="bg-slate-950 text-slate-200">كل 15 ثانية (مضاربة ⚡)</option>
              <option value={30} className="bg-slate-950 text-slate-200">كل 30 ثانية</option>
              <option value={60} className="bg-slate-950 text-emerald-400 font-bold">كل دقيقة (الافتراضي ⭐)</option>
              <option value={120} className="bg-slate-950 text-slate-200">كل دقيقتين</option>
              <option value={300} className="bg-slate-950 text-slate-200">كل 5 دقائق</option>
              <option value={0} className="bg-slate-950 text-rose-300">يدوي فقط (إيقاف ⏸️)</option>
            </select>

            {refreshInterval > 0 ? (
              <span
                className="font-mono text-[10px] text-cyan-400 font-bold bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60 tabular-nums"
                title={`متبقي ${countdownSeconds} ثانية حتى التحديث التلقائي`}
              >
                {countdownSeconds}ث
              </span>
            ) : (
              <span className="text-[10px] text-rose-400 font-bold bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-800/60">
                موقوف
              </span>
            )}
          </div>

          {/* System Health Diagnostics & Auto-Repair Button */}
          {onOpenHealthModal && (
            <button
              onClick={onOpenHealthModal}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${
                healthScore >= 90
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                  : 'bg-amber-950/80 border-amber-500/50 text-amber-300 hover:bg-amber-900/50 animate-pulse'
              }`}
              title={`سلامة النظام: ${healthScore}% (الفحص والإصلاح الذاتي الآلي مفعّل عند انخفاض الكفاءة عن 90%)`}
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>{healthScore}%</span>
              <span className="hidden xl:inline text-[10px] text-slate-400">سلامة النظام 🛡️</span>
            </button>
          )}

          {/* Manual Refresh Now Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer active:scale-95 shadow-sm"
            title="تحديث البيانات لحظياً الآن من البورصة المصرية"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
            <span>تحديث الآن</span>
          </button>

          {/* Close / Hide Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-xl bg-slate-900/90 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800 transition-colors cursor-pointer"
              title="إخفاء شريط حالة السوق"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
