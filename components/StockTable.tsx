import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Star,
  Bell,
  BellRing,
  ExternalLink,
  Info,
  Check,
  Copy,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  FileText,
  Target,
  Bot,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  RotateCcw,
  CheckSquare,
  Square,
  ArrowLeftRight,
  X,
  Layers,
  ArrowRight,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { EGXStock } from '../types/stock';
import { TradingViewRatingWidget } from './TradingViewRatingWidget';
import { calculateAccumulationDistribution } from '../utils/accumulationDistributionEngine';
import { getEstimated20DayAvgVolume } from '../services/institutionalLiquidityAlertService';
import { FirestoreUserAlert } from '../services/userFirestoreService';
import { QuickAlertPopover } from './QuickAlertPopover';
import { CopyableStockSymbol } from './CopyableStockSymbol';

export type TableColumnKey =
  | 'favorite'
  | 'symbolAndName'
  | 'shariah'
  | 'price'
  | 'changePct'
  | 'changeAbs'
  | 'valueTraded'
  | 'accumulationZone'
  | 'dayRange'
  | 'actions';

export interface ColumnDef {
  key: TableColumnKey;
  labelAr: string;
  descriptionAr: string;
  canHide: boolean;
}

export const TABLE_COLUMNS_DEFS: ColumnDef[] = [
  { key: 'favorite', labelAr: 'المفضلة والتنبيه', descriptionAr: 'نجمة المفضلة وزر تفعيل تنبيهات الأسعار اللحظية', canHide: true },
  { key: 'symbolAndName', labelAr: 'السهم والرمز والتقييم', descriptionAr: 'رمز السهم، الاسم العربي، مؤشر الشريعة، وتقييم TradingView', canHide: false },
  { key: 'shariah', labelAr: 'التوافق الشرعي', descriptionAr: 'شارة الامتثال لضوابط الهيئة الشرعية مع السبب', canHide: true },
  { key: 'price', labelAr: 'السعر اللحظي (ج.م)', descriptionAr: 'سعر السهم اللحظي المتزامن بدقة مع الشارت', canHide: false },
  { key: 'changePct', labelAr: 'التغير اليومي %', descriptionAr: 'نسبة الارتفاع أو الانخفاض اليومي للجلسة', canHide: true },
  { key: 'changeAbs', labelAr: 'التغير بالجنيه', descriptionAr: 'قيمة التغير بالجنيه المصري عن الإغلاق السابق', canHide: true },
  { key: 'valueTraded', labelAr: 'قيمة التداول وسيولة 20 يوم', descriptionAr: 'السيولة المتداولة وإشارات قفزة حجم 20 يوم المؤسساتية', canHide: true },
  { key: 'accumulationZone', labelAr: 'نطاق التجميع المقترح', descriptionAr: 'نطاق أسعار الشراء التجميعي المحسوب فنياً', canHide: true },
  { key: 'dayRange', labelAr: 'نطاق اليوم (أدنى - أعلى)', descriptionAr: 'أدنى وأعلى سعر مسجل خلال جلسة اليوم', canHide: true },
  { key: 'actions', labelAr: 'الإجراءات والتقرير والشارت', descriptionAr: 'أزرار فتح الشارت، تقرير 360، ومحلل الذكاء الاصطناعي', canHide: true },
];

const DEFAULT_COLUMNS_STATE: Record<TableColumnKey, boolean> = {
  favorite: true,
  symbolAndName: true,
  shariah: true,
  price: true,
  changePct: true,
  changeAbs: true,
  valueTraded: true,
  accumulationZone: true,
  dayRange: true,
  actions: true,
};

interface StockTableProps {
  stocks: EGXStock[];
  selectedSymbol: string;
  onSelectStock: (symbol: string) => void;
  favorites: string[];
  onToggleFavorite: (symbol: string) => void;
  onOpenStockDetails: (stock: EGXStock) => void;
  onOpenDetailedReport: (stock: EGXStock) => void;
  onOpenChart: (symbol: string) => void;
  onOpenGoogleAiNews?: (symbol: string) => void;
  onOpenDirectChartAi?: (stock: EGXStock) => void;
  userAlerts?: FirestoreUserAlert[];
  onSaveAlert?: (alert: {
    symbol: string;
    stockNameAr: string;
    condition: FirestoreUserAlert['condition'];
    targetValue: number;
    currentPriceWhenCreated: number;
    isActive: boolean;
    isTriggered: boolean;
    note: string;
  }) => Promise<void> | void;
  onToggleAlert?: (alertId: string, currentActive: boolean) => Promise<void> | void;
  onDeleteAlert?: (alertId: string) => Promise<void> | void;
  isLoggedIn?: boolean;
  onOpenAuthModal?: () => void;
  isMobileMode?: boolean;
  onToggleMobileMode?: () => void;
}

export function formatEgpMoney(val?: number): string {
  if (val === undefined || val === null || isNaN(val) || val === 0) return '-';
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)} مليار ج.م`;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)} مليون ج.م`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)} ألف ج.م`;
  return `${val.toLocaleString()} ج.م`;
}

export function formatVolume(vol?: number): string {
  if (vol === undefined || vol === null || isNaN(vol) || vol === 0) return '-';
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(0)}K`;
  return vol.toLocaleString();
}

export const StockTable: React.FC<StockTableProps> = ({
  stocks,
  selectedSymbol,
  onSelectStock,
  favorites,
  onToggleFavorite,
  onOpenStockDetails,
  onOpenDetailedReport,
  onOpenChart,
  onOpenGoogleAiNews,
  onOpenDirectChartAi,
  userAlerts = [],
  onSaveAlert,
  onToggleAlert,
  onDeleteAlert,
  isLoggedIn = false,
  onOpenAuthModal,
  isMobileMode = false,
  onToggleMobileMode,
}) => {
  const [copiedSymbol, setCopiedSymbol] = useState<string | null>(null);
  const [alertPopoverStock, setAlertPopoverStock] = useState<EGXStock | null>(null);
  const [alertPopoverAnchor, setAlertPopoverAnchor] = useState<DOMRect | null>(null);

  // View Layout Mode: 'TABLE' (Desktop Full Table) or 'CARDS' (Mobile Touch Cards)
  const [viewLayout, setViewLayout] = useState<'TABLE' | 'CARDS'>(() => {
    try {
      const stored = localStorage.getItem('egx_stock_table_layout');
      if (stored === 'TABLE' || stored === 'CARDS') return stored;
    } catch {}
    return isMobileMode || (typeof window !== 'undefined' && window.innerWidth < 768) ? 'CARDS' : 'TABLE';
  });

  useEffect(() => {
    if (isMobileMode) {
      setViewLayout('CARDS');
    }
  }, [isMobileMode]);

  const handleToggleLayout = (layout: 'TABLE' | 'CARDS') => {
    setViewLayout(layout);
    try {
      localStorage.setItem('egx_stock_table_layout', layout);
    } catch {}
  };

  // Column Customization & Row Limit States (User-requested feature)
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<TableColumnKey, boolean>>(() => {
    try {
      const stored = localStorage.getItem('egx_table_visible_columns_v1');
      if (stored) {
        return { ...DEFAULT_COLUMNS_STATE, ...JSON.parse(stored) };
      }
    } catch {}
    return DEFAULT_COLUMNS_STATE;
  });

  // Default Rows per view (25, 50, 100, 200, 0 for all)
  const [rowsLimit, setRowsLimit] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('egx_table_rows_limit_v1');
      if (stored !== null) {
        const val = parseInt(stored, 10);
        if (!isNaN(val)) return val;
      }
    } catch {}
    return 50; // Default: 50 rows
  });

  const [expandedCount, setExpandedCount] = useState<number>(0);

  // Top Horizontal Scrolling & Navigation State
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const topScrollTrackRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState<number>(1200);

  // Synchronize scroll metrics between top track and main table
  useEffect(() => {
    const updateMetrics = () => {
      if (tableContainerRef.current) {
        setScrollWidth(tableContainerRef.current.scrollWidth);
      }
    };
    updateMetrics();
    window.addEventListener('resize', updateMetrics);
    return () => window.removeEventListener('resize', updateMetrics);
  }, [stocks.length, visibleColumns]);

  const handleScrollLeft = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (topScrollTrackRef.current) {
      topScrollTrackRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleTopTrackScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleToggleColumn = (key: TableColumnKey) => {
    setVisibleColumns((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('egx_table_visible_columns_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleResetColumns = () => {
    setVisibleColumns(DEFAULT_COLUMNS_STATE);
    try {
      localStorage.setItem('egx_table_visible_columns_v1', JSON.stringify(DEFAULT_COLUMNS_STATE));
    } catch {}
  };

  const handleSelectAllColumns = () => {
    const allTrue: Record<TableColumnKey, boolean> = {
      favorite: true,
      symbolAndName: true,
      shariah: true,
      price: true,
      changePct: true,
      changeAbs: true,
      valueTraded: true,
      accumulationZone: true,
      dayRange: true,
      actions: true,
    };
    setVisibleColumns(allTrue);
    try {
      localStorage.setItem('egx_table_visible_columns_v1', JSON.stringify(allTrue));
    } catch {}
  };

  const handleRowsLimitChange = (limit: number) => {
    setRowsLimit(limit);
    setExpandedCount(0);
    try {
      localStorage.setItem('egx_table_rows_limit_v1', limit.toString());
    } catch {}
  };

  // Slice stocks based on configured limit
  const displayedRows = useMemo(() => {
    if (rowsLimit <= 0) return stocks;
    const effectiveLimit = rowsLimit + expandedCount;
    return stocks.slice(0, effectiveLimit);
  }, [stocks, rowsLimit, expandedCount]);

  const activeColumnsCount = useMemo(() => {
    return Object.values(visibleColumns).filter(Boolean).length;
  }, [visibleColumns]);

  const handleOpenAlertPopover = (e: React.MouseEvent, s: EGXStock) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (alertPopoverStock?.symbol === s.symbol) {
      setAlertPopoverStock(null);
      setAlertPopoverAnchor(null);
    } else {
      setAlertPopoverStock(s);
      setAlertPopoverAnchor(rect);
    }
  };

  const handleCopyStockSummary = (e: React.MouseEvent, s: EGXStock) => {
    e.stopPropagation();
    const ad = calculateAccumulationDistribution(s, 'يومي (1D)');
    const text = `📊 تقرير سهم ${s.nameAr} (${s.symbol}) - البورصة المصرية EGX:
💵 السعر الحالي: ${s.price.toFixed(2)} ج.م (${s.changePct >= 0 ? '+' : ''}${s.changePct}%)
🕋 الحكم الشرعي: ${s.isShariahCompliant ? 'متوافق مع الشريعة الإسلامية ✅' : 'غير متوافق (تقليدي) ⚠️'}
🔬 مقياس التجميع والتصريف الدقيق: [${ad.phaseAr}] (تجميع ${ad.accumulationScore}% / تصريف ${ad.distributionScore}%)
🏛️ مرحلة دورة وايكوف: ${ad.wyckoffStageAr}
📈 السيولة المتداولة: ${formatEgpMoney(s.valueTraded)} (${formatVolume(s.volume)} سهم)
📐 نطاق اليوم: أدنى ${s.low.toFixed(2)} - أعلى ${s.high.toFixed(2)} ج.م
🏢 القطاع: ${s.sectorAr}
📌 الرأي الشرعي: ${s.shariahReasonAr}
المصدر: رادار البورصة المصرية ومؤشر الشريعة TradingView Live`;

    navigator.clipboard.writeText(text);
    setCopiedSymbol(s.symbol);
    setTimeout(() => setCopiedSymbol(null), 2000);
  };

  if (stocks.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 space-y-2">
        <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
        <p className="font-bold text-sm text-slate-300">لا توجد أسهم مطابقة لمعايير التصفية الحالية</p>
        <p className="text-xs text-slate-500">جرب تغيير التصنيف أو إلغاء فلتر البحث للوصول لكافة أسهم البورصة</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 font-['Cairo']">
      {/* ========================================================================= */}
      {/* 1. TOP CONTROLS BAR ABOVE TABLE (User Requested: Horizontal Scroll & Settings) */}
      {/* ========================================================================= */}
      <div className="p-3 bg-[#080d16] border border-slate-800/90 rounded-2xl shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Left / Right Quick Navigation Buttons & Top Horizontal Scrollbar */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-1 shrink-0">
            {/* Scroll Right Button */}
            <button
              type="button"
              onClick={handleScrollRight}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white border border-slate-700/80 transition-all flex items-center gap-1 font-bold shadow-sm cursor-pointer active:scale-95"
              title="تحريك الجدول لليمين لإظهار الأعمدة المخفية"
            >
              <ChevronRight className="w-4 h-4" />
              <span className="hidden sm:inline">يمين</span>
            </button>
            {/* Scroll Left Button */}
            <button
              type="button"
              onClick={handleScrollLeft}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white border border-slate-700/80 transition-all flex items-center gap-1 font-bold shadow-sm cursor-pointer active:scale-95"
              title="تحريك الجدول لليسار لإظهار الأعمدة المخفية"
            >
              <span className="hidden sm:inline">يسار</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Synchronized Top Horizontal Scrollbar Track */}
          <div
            ref={topScrollTrackRef}
            onScroll={handleTopTrackScroll}
            className="flex-1 overflow-x-auto overflow-y-hidden rounded-xl bg-slate-950 border border-slate-800/80 h-7 flex items-center px-1 custom-scrollbar"
            title="شريط التمرير الأفقي العلوي - اسحب يميناً أو يساراً لتحريك الجدول"
          >
            <div
              style={{ width: `${scrollWidth}px`, height: '1px' }}
              className="flex items-center justify-between text-[10px] text-slate-500 font-bold px-2 pointer-events-none select-none"
            >
              <span>◄ اسحب الشريط أو اضغط الأزرار لتحريك الأعمدة</span>
              <span className="text-cyan-400 font-mono">◄ إظهار الأعمدة المخفية ►</span>
              <span>اسحب لليمين واليسار ►</span>
            </div>
          </div>
        </div>

        {/* Action Button: Customize Columns, Default Rows & Mobile Layout Switcher */}
        <div className="flex items-center gap-2 shrink-0 justify-end flex-wrap">
          {/* Mobile Cards vs Table Layout Toggle (User Requested: خيار للموبايل) */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => handleToggleLayout('CARDS')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewLayout === 'CARDS'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="عرض البطاقات السريعة المخصص للموبايل واللمس 📱"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>بطاقات الموبايل 📱</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleLayout('TABLE')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewLayout === 'TABLE'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="عرض جدول البيانات الكامل للشاشات الكبيرة 💻"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>الجدول الكامل 💻</span>
            </button>
          </div>

          {/* Quick Rows Count Pill */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-slate-400 font-mono text-[11px]">
            <span className="text-slate-400 font-sans">معروض:</span>
            <strong className="text-emerald-400 font-bold">{displayedRows.length}</strong>
            <span className="text-slate-600">/</span>
            <span>{stocks.length} سهم</span>
          </div>

          {/* Customize Button */}
          {viewLayout === 'TABLE' && (
            <button
              type="button"
              onClick={() => setIsCustomizeModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600/25 via-teal-600/25 to-blue-600/25 hover:from-cyan-600/35 hover:to-blue-600/35 text-cyan-200 border border-cyan-400/50 text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
              title="تحديد الأعمدة والصفوف التي ترغب في ظهورها افتراضياً في جدول الأسهم"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-300" />
              <span className="hidden sm:inline">تخصيص الأعمدة</span>
              <span className="px-1.5 py-0.2 rounded-md bg-cyan-950 text-cyan-300 font-mono text-[10px] border border-cyan-700/60 font-bold">
                {activeColumnsCount}/{TABLE_COLUMNS_DEFS.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2A. MOBILE CARDS VIEW (خيار عرض البطاقات المخصص للموبايل واللمس السريع)  */}
      {/* ========================================================================= */}
      {viewLayout === 'CARDS' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {displayedRows.map((s) => {
            const isSelected = s.symbol === selectedSymbol;
            const isFav = favorites.includes(s.symbol);
            const isPositive = s.changePct > 0;
            const isNegative = s.changePct < 0;
            const matchingAlerts = userAlerts.filter(
              (a) => a.symbol.trim().toUpperCase() === s.symbol.trim().toUpperCase()
            );
            const hasActiveAlert = matchingAlerts.some((a) => a.isActive);
            const adv20 = getEstimated20DayAvgVolume(s);
            const vol = s.volume || 0;
            const hasSpike = vol >= adv20 && (s.valueTraded || 0) >= 50000;
            const rvol = adv20 > 0 ? (vol / adv20).toFixed(1) : '1.0';
            const ad = calculateAccumulationDistribution(s, 'يومي (1D)');

            return (
              <div
                key={`card-${s.symbol}`}
                onClick={() => onSelectStock(s.symbol)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 relative ${
                  isSelected
                    ? 'bg-[#0f1728] border-cyan-400/80 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400/50'
                    : 'bg-[#0a0e17] hover:bg-[#0c121e] border-slate-800/90 hover:border-slate-700 shadow-md'
                }`}
              >
                {/* Card Top: Favorite, Alert, Symbol & Badges */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(s.symbol);
                      }}
                      className="p-1.5 rounded-lg bg-slate-900 text-slate-500 hover:text-amber-400 transition-colors"
                      title={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          isFav ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleOpenAlertPopover(e, s)}
                      className={`p-1.5 rounded-lg border transition-all relative ${
                        hasActiveAlert
                          ? 'text-amber-400 bg-amber-500/15 border-amber-500/40 shadow-sm'
                          : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800 border-slate-800'
                      }`}
                      title={hasActiveAlert ? 'إدارة تنبيهات السعر' : 'تحديد تنبيه سعر'}
                    >
                      {hasActiveAlert ? (
                        <BellRing className="w-4 h-4 animate-pulse text-amber-400" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <strong className="font-mono font-black text-white text-base group-hover:text-cyan-400">
                          {s.symbol}
                        </strong>
                        {s.isInEgx30 && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                            EGX30
                          </span>
                        )}
                        <TradingViewRatingWidget stock={s} variant="MINI_BADGE" />
                      </div>
                      <span className="text-slate-300 text-xs font-bold block truncate max-w-[190px]">
                        {s.nameAr}
                      </span>
                    </div>
                  </div>

                  {/* Shariah Badge */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenStockDetails(s);
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border shrink-0 transition-transform active:scale-95 ${
                      s.isShariahCompliant
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/35'
                    }`}
                  >
                    {s.isShariahCompliant ? (
                      <>
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>شرعي</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-3 h-3 text-rose-400" />
                        <span>غير متوافق</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Card Middle: Price, Daily Change & Key Statistics */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-0.5">السعر اللحظي:</span>
                    <div className="text-base font-black font-mono text-white">
                      {s.price.toFixed(2)} <span className="text-xs font-sans text-slate-400">ج.م</span>
                    </div>
                    <span
                      className={`text-xs font-bold font-mono inline-block mt-0.5 ${
                        isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-400'
                      }`}
                    >
                      {isPositive ? '+' : ''}{s.changePct.toFixed(2)}% ({isPositive ? '+' : ''}{s.changeAbs.toFixed(2)} ج)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-0.5">السيولة والتداول:</span>
                    <strong className="text-xs font-bold text-cyan-300 block font-mono">
                      {formatEgpMoney(s.valueTraded)}
                    </strong>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {formatVolume(s.volume)} سهم
                    </span>
                  </div>
                </div>

                {/* Volume Spike & Accumulation Pills */}
                <div className="flex items-center justify-between text-[11px] gap-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded-lg font-bold border text-[10px] ${
                      ad.isAccumulation
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                        : ad.isDistribution
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/35'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {ad.phaseAr} ({ad.accumulationScore}%)
                  </span>

                  {hasSpike && (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                      <span>قفزة 20 يوم ({rvol}x)</span>
                    </span>
                  )}
                </div>

                {/* Card Bottom: Touch Action Buttons */}
                <div className="pt-2 border-t border-slate-850 grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenChart(s.symbol);
                    }}
                    className="py-2 px-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold flex items-center justify-center gap-1 transition-colors active:scale-95 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-blue-400" />
                    <span>الشارت</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetailedReport(s);
                    }}
                    className="py-2 px-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center justify-center gap-1 transition-colors active:scale-95 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>تقرير 360</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleCopyStockSummary(e, s)}
                    className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors active:scale-95 cursor-pointer"
                  >
                    {copiedSymbol === s.symbol ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>{copiedSymbol === s.symbol ? 'تم' : 'نسخ'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* 2B. THE MAIN STOCK DATA TABLE WITH CONFIGURABLE COLUMNS & ROWS            */
        /* ========================================================================= */
        <div className="rounded-2xl border border-slate-800/90 bg-[#0a0e17] overflow-hidden shadow-2xl relative">
        <div
          ref={tableContainerRef}
          onScroll={handleTableScroll}
          className="overflow-x-auto scroll-smooth"
        >
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                {visibleColumns.favorite && (
                  <th className="py-3 px-2 text-center w-16">المفضلة والتنبيه</th>
                )}
                {visibleColumns.symbolAndName && (
                  <th className="py-3 px-3">السهم والشركة</th>
                )}
                {visibleColumns.shariah && (
                  <th className="py-3 px-3 text-center">التوافق الشرعي</th>
                )}
                {visibleColumns.price && (
                  <th className="py-3 px-3 text-left">السعر اللحظي</th>
                )}
                {visibleColumns.changePct && (
                  <th className="py-3 px-3 text-left">التغير اليومي %</th>
                )}
                {visibleColumns.changeAbs && (
                  <th className="py-3 px-3 text-left hidden sm:table-cell">التغير (ج.م)</th>
                )}
                {visibleColumns.valueTraded && (
                  <th className="py-3 px-3 text-left">قيمة التداول (السيولة)</th>
                )}
                {visibleColumns.accumulationZone && (
                  <th className="py-3 px-3 text-center hidden md:table-cell">نطاق التجميع المقترح</th>
                )}
                {visibleColumns.dayRange && (
                  <th className="py-3 px-3 text-center hidden lg:table-cell">نطاق اليوم (أدنى - أعلى)</th>
                )}
                {visibleColumns.actions && (
                  <th className="py-3 px-3 text-center">الإجراء والشارت</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {displayedRows.map((s) => {
                const isSelected = s.symbol === selectedSymbol;
                const isFav = favorites.includes(s.symbol);
                const isPositive = s.changePct > 0;
                const isNegative = s.changePct < 0;

                const matchingAlerts = userAlerts.filter(
                  (a) => a.symbol.trim().toUpperCase() === s.symbol.trim().toUpperCase()
                );
                const hasActiveAlert = matchingAlerts.some((a) => a.isActive);

                return (
                  <tr
                    key={s.symbol}
                    onClick={() => onSelectStock(s.symbol)}
                    className={`cursor-pointer transition-colors group ${
                      isSelected
                        ? 'bg-emerald-950/25 border-r-4 border-r-emerald-500 hover:bg-emerald-950/35'
                        : 'hover:bg-slate-900/80'
                    }`}
                  >
                    {/* 1. Favorite & Alert Bell Toggle */}
                    {visibleColumns.favorite && (
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Star Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(s.symbol);
                            }}
                            className="p-1 rounded-lg text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
                            title={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                isFav ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                              }`}
                            />
                          </button>

                          {/* Bell Quick Alert Toggle */}
                          <button
                            type="button"
                            onClick={(e) => handleOpenAlertPopover(e, s)}
                            className={`p-1 rounded-lg transition-all relative cursor-pointer ${
                              hasActiveAlert
                                ? 'text-amber-400 bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 shadow-sm shadow-amber-500/20'
                                : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800'
                            }`}
                            title={
                              hasActiveAlert
                                ? `إدارة تنبيهات السعر (${matchingAlerts.length} نشط)`
                                : 'تحديد تنبيه سعر سريع لهذا السهم'
                            }
                          >
                            {hasActiveAlert ? (
                              <>
                                <BellRing className="w-3.5 h-3.5 animate-pulse" />
                                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
                              </>
                            ) : (
                              <Bell className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    )}

                    {/* 2. Stock Symbol, Arabic Name & Wyckoff / TradingView Badges */}
                    {visibleColumns.symbolAndName && (
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <CopyableStockSymbol symbol={s.symbol} size="md" />
                              {s.isInEgx30 && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                                  EGX30
                                </span>
                              )}
                              {s.isInShariahIndex && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                                  شريعة
                                </span>
                              )}
                              <TradingViewRatingWidget stock={s} variant="MINI_BADGE" />
                              {(() => {
                                const ad = calculateAccumulationDistribution(s, 'يومي (1D)');
                                return (
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                      ad.isAccumulation
                                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                                        : ad.isDistribution
                                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/35'
                                        : 'bg-slate-800 text-slate-400 border-slate-700'
                                    }`}
                                    title={`مقياس التجميع والتصريف الدقيق: ${ad.phaseAr} (تجميع ${ad.accumulationScore}% / تصريف ${ad.distributionScore}%)`}
                                  >
                                    {ad.isAccumulation ? 'تجميع 💎' : ad.isDistribution ? 'تصريف 🛑' : 'توازن ⚖️'}
                                  </span>
                                );
                              })()}
                            </div>
                            <span className="text-slate-300 text-xs font-semibold truncate max-w-[190px] sm:max-w-[260px] font-['Cairo']">
                              {s.nameAr}
                            </span>
                            <span className="text-slate-500 text-[10px] truncate max-w-[200px]">
                              {s.sectorAr}
                            </span>
                          </div>
                        </div>
                      </td>
                    )}

                    {/* 3. Shariah Compliance Badge */}
                    {visibleColumns.shariah && (
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenStockDetails(s);
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all hover:scale-105 cursor-pointer ${
                            s.isShariahCompliant
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35 shadow-sm shadow-emerald-500/10'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/35'
                          }`}
                          title={s.shariahReasonAr}
                        >
                          {s.isShariahCompliant ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>متوافق شرعاً</span>
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              <span>غير متوافق</span>
                            </>
                          )}
                        </button>
                      </td>
                    )}

                    {/* 4. Live Price in EGP */}
                    {visibleColumns.price && (
                      <td className="py-3 px-3 text-left font-mono tabular-nums">
                        <span className="text-sm font-black text-white">
                          {s.price > 0 ? s.price.toFixed(s.price >= 10 ? 2 : 3) : '-'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-sans mr-1"> ج.م</span>
                      </td>
                    )}

                    {/* 5. Daily Change % */}
                    {visibleColumns.changePct && (
                      <td className="py-3 px-3 text-left font-mono tabular-nums">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs font-bold ${
                            isPositive
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : isNegative
                              ? 'bg-rose-500/15 text-rose-400'
                              : 'text-slate-400 bg-slate-800/60'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                          ) : isNegative ? (
                            <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
                          ) : null}
                          <span>
                            {isPositive ? '+' : ''}
                            {s.changePct.toFixed(2)}%
                          </span>
                        </span>
                      </td>
                    )}

                    {/* 6. Absolute Change in EGP */}
                    {visibleColumns.changeAbs && (
                      <td className="py-3 px-3 text-left font-mono tabular-nums hidden sm:table-cell">
                        <span
                          className={`text-xs font-bold ${
                            isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-400'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {s.changeAbs.toFixed(2)}
                        </span>
                      </td>
                    )}

                    {/* 7. Value Traded (EGP Liquidity) & 20-day Volume Spike */}
                    {visibleColumns.valueTraded && (
                      <td className="py-3 px-3 text-left font-mono tabular-nums">
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-bold text-cyan-300">
                            {formatEgpMoney(s.valueTraded)}
                          </span>
                          {(() => {
                            const adv20 = getEstimated20DayAvgVolume(s);
                            const vol = s.volume || 0;
                            const hasSpike = vol >= adv20 && (s.valueTraded || 0) >= 50000;
                            if (!hasSpike || adv20 <= 0) return null;
                            const rvol = (vol / adv20).toFixed(1);
                            return (
                              <span
                                className="mt-0.5 inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black"
                                title={`حجم التداول (${vol.toLocaleString('en-US')}) تجاوز متوسط 20 يوم (${adv20.toLocaleString('en-US')}) بنسبة +${Math.round(((vol / adv20) - 1) * 100)}%`}
                              >
                                <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                                <span>⚡ قفزة 20 يوم ({rvol}x)</span>
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                    )}

                    {/* 8. Accumulation Zone Range */}
                    {visibleColumns.accumulationZone && (
                      <td className="py-3 px-3 text-center font-mono tabular-nums hidden md:table-cell">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                          <Target className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>
                            {(s.price * 0.97).toFixed(s.price >= 10 ? 2 : 3)} - {(s.price * 1.015).toFixed(s.price >= 10 ? 2 : 3)}
                          </span>
                        </span>
                      </td>
                    )}

                    {/* 9. Daily Range (Low - High) */}
                    {visibleColumns.dayRange && (
                      <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-300 hidden lg:table-cell">
                        <div className="flex items-center justify-center gap-1.5 text-[11px]">
                          <span className="text-rose-400">{s.low.toFixed(2)}</span>
                          <span className="text-slate-600">-</span>
                          <span className="text-emerald-400">{s.high.toFixed(2)}</span>
                        </div>
                      </td>
                    )}

                    {/* 10. Action Buttons */}
                    {visibleColumns.actions && (
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Detailed 360 Report Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenDetailedReport(s);
                            }}
                            className="px-2 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/35 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title="عرض التقرير الفني والشرعي المفصل 360°"
                          >
                            <FileText className="w-3 h-3 text-cyan-400" />
                            <span className="hidden sm:inline">تقرير 360°</span>
                          </button>

                          {/* Google AI Search & News Analyst Button */}
                          {onOpenGoogleAiNews && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenGoogleAiNews(s.symbol);
                              }}
                              className="px-2 py-1 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/35 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                              title="محلل AI وبحث Google لرصد الأخبار والإفصاحات اللحظية للسهم"
                            >
                              <Bot className="w-3 h-3 text-teal-300" />
                              <span className="hidden md:inline">أخبار Google</span>
                            </button>
                          )}

                          {/* Direct Chart AI Analysis Button */}
                          {onOpenDirectChartAi && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenDirectChartAi(s);
                              }}
                              className="px-2 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/35 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                              title="تحليل الشارت المباشر بالذكاء الاصطناعي دون إرفاق صورة"
                            >
                              <Bot className="w-3 h-3 text-cyan-300" />
                              <span className="hidden xl:inline">تحليل الشارت</span>
                            </button>
                          )}

                          {/* Quick Price Alert Action Button */}
                          <button
                            type="button"
                            onClick={(e) => handleOpenAlertPopover(e, s)}
                            className={`px-2 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              hasActiveAlert
                                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:text-amber-300'
                            }`}
                            title={
                              hasActiveAlert
                                ? `إدارة تنبيهات السعر (${matchingAlerts.length} نشط)`
                                : 'تحديد تنبيه سعر لحظي'
                            }
                          >
                            {hasActiveAlert ? (
                              <BellRing className="w-3 h-3 text-amber-400" />
                            ) : (
                              <Bell className="w-3 h-3 text-slate-400" />
                            )}
                            <span className="hidden xl:inline">{hasActiveAlert ? 'تنبيه نشط' : 'تنبيه'}</span>
                          </button>

                          {/* Direct Chart Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenChart(s.symbol);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title="فتح شارت TradingView المباشر"
                          >
                            <Zap className="w-3 h-3 text-emerald-400" />
                            <span>شارت</span>
                          </button>

                          {/* Copy Stock Summary */}
                          <button
                            type="button"
                            onClick={(e) => handleCopyStockSummary(e, s)}
                            className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                              copiedSymbol === s.symbol
                                ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50'
                                : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                            }`}
                            title="نسخ ملخص السهم والحكم الشرعي"
                          >
                            {copiedSymbol === s.symbol ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination / Load More Footer if limited */}
        {rowsLimit > 0 && stocks.length > displayedRows.length && (
          <div className="p-3.5 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 font-medium">
              يتم عرض <strong className="text-white font-mono">{displayedRows.length}</strong> من إجمالي{' '}
              <strong className="text-cyan-300 font-mono">{stocks.length}</strong> سهم مسجل
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExpandedCount((prev) => prev + 50)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 font-bold transition-all cursor-pointer"
              >
                عرض +50 سهم إضافي
              </button>
              <button
                type="button"
                onClick={() => handleRowsLimitChange(0)}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black transition-all cursor-pointer shadow-md"
              >
                عرض جميع الأسهم (290+)
              </button>
            </div>
          </div>
        )}

        {/* Quick Price Alert Floating Popover */}
        {alertPopoverStock && alertPopoverAnchor && (
          <QuickAlertPopover
            stock={alertPopoverStock}
            isOpen={Boolean(alertPopoverStock)}
            anchorRect={alertPopoverAnchor}
            onClose={() => {
              setAlertPopoverStock(null);
              setAlertPopoverAnchor(null);
            }}
            alerts={userAlerts}
            onSaveAlert={onSaveAlert || (async () => {})}
            onToggleAlert={onToggleAlert || (async () => {})}
            onDeleteAlert={onDeleteAlert || (async () => {})}
            isLoggedIn={isLoggedIn}
            onOpenAuthModal={onOpenAuthModal}
          />
        )}
      </div>
      )}

      {/* ========================================================================= */}
      {/* 3. COLUMNS & ROWS CUSTOMIZE MODAL (Pop-up requested by the user)         */}
      {/* ========================================================================= */}
      {isCustomizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-hidden animate-fadeIn font-['Cairo']">
          <div className="relative w-full max-w-2xl bg-[#0b0f17] border border-cyan-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-[#0a1824] to-cyan-950/70 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center shadow-inner">
                  <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>تخصيص الأعمدة والصفوف الافتراضية</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    حدد الأعمدة التي تريد إظهارها في الجدول وعدد الصفوف الافتراضية المفضلة
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomizeModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-200">
              {/* Part 1: Default Rows Per View */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>عدد الصفوف الافتراضية المعروضة في قائمة الأسهم:</span>
                  </span>
                  <span className="text-[10px] text-cyan-300 font-mono">
                    {rowsLimit === 0 ? 'عرض كافة الأسهم' : `${rowsLimit} صف افتراضي`}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 font-bold">
                  {[25, 50, 100, 200, 0].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleRowsLimitChange(num)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        rowsLimit === num
                          ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-black border-cyan-300 shadow-md shadow-cyan-500/20'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {num === 0 ? 'عرض الكل (290+)' : `${num} صف`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Part 2: Columns Visibility Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span>الأعمدة المطلوب إظهارها في الجدول:</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSelectAllColumns}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      تحديد الكل
                    </button>
                    <button
                      type="button"
                      onClick={handleResetColumns}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>الافتراضي</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {TABLE_COLUMNS_DEFS.map((col) => {
                    const isVisible = visibleColumns[col.key];
                    return (
                      <div
                        key={col.key}
                        onClick={() => col.canHide && handleToggleColumn(col.key)}
                        className={`p-3 rounded-xl border transition-all flex items-start gap-2.5 select-none ${
                          !col.canHide
                            ? 'bg-slate-950/60 border-slate-800/60 opacity-80 cursor-default'
                            : isVisible
                            ? 'bg-slate-900/90 border-cyan-500/40 hover:border-cyan-400 cursor-pointer'
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700 cursor-pointer'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isVisible ? (
                            <CheckSquare className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`font-bold text-xs ${isVisible ? 'text-white' : 'text-slate-500'}`}>
                              {col.labelAr}
                            </span>
                            {!col.canHide && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                                أساسي
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed line-clamp-1">
                            {col.descriptionAr}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                يتم حفظ التفضيلات تلقائياً في المتصفح لاستعادتها دائماً
              </span>
              <button
                type="button"
                onClick={() => setIsCustomizeModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
              >
                تطبيق وحفظ الإعدادات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
