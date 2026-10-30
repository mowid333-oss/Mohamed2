import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  LineChart,
  PieChart,
  Calculator,
  Compass,
  Flame,
  Newspaper,
  FileText,
  Target,
  Zap,
  Activity,
  Bell,
  Globe,
  ArrowLeftRight,
  Users,
  ChevronDown,
  Filter,
  SlidersHorizontal,
  Clock,
  RefreshCw,
  Coins,
  TrendingUp,
  TrendingDown,
  Star,
  Eye,
  EyeOff,
  RotateCcw,
  Timer,
  Check,
  Landmark,
} from 'lucide-react';
import { WatchlistCategory, MarketSessionStatus } from '../types/stock';

export type NavigationTabType =
  | 'WATCHLIST'
  | 'SHARIAH'
  | 'INDICES_ANALYST'
  | 'CHART'
  | 'SECTORS'
  | 'DCA'
  | 'TECHNICAL_ANALYST'
  | 'DAY_TRADING'
  | 'NEWS'
  | 'DAILY_REPORT'
  | 'RADARS'
  | 'DIVERGENCE'
  | 'ASO_REGIME'
  | 'ALERTS'
  | 'TRADE_MANAGEMENT'
  | 'PORTFOLIO'
  | 'GLOBAL_MARKETS'
  | 'GOLD_MARKET'
  | 'MARKET_COMPARISON'
  | 'INVESTOR_CATEGORIES'
  | 'SMART_BUY_STUDY';

interface UnifiedMarketCommandRibbonProps {
  activeTab: NavigationTabType;
  onSelectTab: (tab: NavigationTabType) => void;
  activeCategory: WatchlistCategory;
  onSelectCategory: (cat: WatchlistCategory) => void;
  counts: {
    shariah: number;
    egx30: number;
    egx70: number;
    egx100: number;
    all: number;
    favorites: number;
    institutionalLiquidity?: number;
  };
  sortBy: 'liquidity' | 'gainers' | 'losers' | 'price';
  onSortChange: (sort: 'liquidity' | 'gainers' | 'losers' | 'price') => void;
  shariahOnly: boolean;
  onToggleShariahOnly: () => void;
  barsVisibility: {
    showGoldBar: boolean;
    showMarketStatusBar: boolean;
    showPriceTicker: boolean;
    showOpportunitiesTape: boolean;
  };
  onToggleGoldBar: () => void;
  onToggleMarketStatusBar: () => void;
  onTogglePriceTicker: () => void;
  onToggleOpportunitiesTape: () => void;
  onShowAllBars?: () => void;
  onHideAllBars?: () => void;
  onResetDefaultBars?: () => void;
  session: MarketSessionStatus;
  lastUpdated: string;
  refreshInterval: number;
  onRefreshIntervalChange: (sec: number) => void;
  countdownSeconds: number;
  onRefresh: () => void;
  isLoading: boolean;
}

export const UnifiedMarketCommandRibbon: React.FC<UnifiedMarketCommandRibbonProps> = ({
  activeTab,
  onSelectTab,
  activeCategory,
  onSelectCategory,
  counts,
  sortBy,
  onSortChange,
  shariahOnly,
  onToggleShariahOnly,
  barsVisibility,
  onToggleGoldBar,
  onToggleMarketStatusBar,
  onTogglePriceTicker,
  onToggleOpportunitiesTape,
  onShowAllBars,
  onHideAllBars,
  onResetDefaultBars,
  session,
  lastUpdated,
  refreshInterval,
  onRefreshIntervalChange,
  countdownSeconds,
  onRefresh,
  isLoading,
}) => {
  // Dropdown states
  const [isTabsOpen, setIsTabsOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isBarsOpen, setIsBarsOpen] = useState(false);

  const tabsRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tabsRef.current && !tabsRef.current.contains(e.target as Node)) {
        setIsTabsOpen(false);
      }
      if (categoriesRef.current && !categoriesRef.current.contains(e.target as Node)) {
        setIsCategoriesOpen(false);
      }
      if (barsRef.current && !barsRef.current.contains(e.target as Node)) {
        setIsBarsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Categorized Tab Groups
  const tabGroups = [
    {
      groupNameAr: '📊 التداول والأسهم',
      items: [
        { id: 'WATCHLIST' as NavigationTabType, label: 'قوائم البورصة العامة', icon: Layers, badge: `${counts.all}` },
        { id: 'INDICES_ANALYST' as NavigationTabType, label: 'تحليل المؤشرات (30 و 33 و 70 و 100)', icon: Landmark, badge: 'مؤشرات 🏛️', color: 'text-cyan-400' },
        { id: 'SHARIAH' as NavigationTabType, label: 'مؤشر الشريعة الإسلامية', icon: Sparkles, badge: `${counts.shariah}`, color: 'text-emerald-400' },
        { id: 'CHART' as NavigationTabType, label: 'الشارت اللحظي TradingView', icon: LineChart, badge: 'لحظي' },
        { id: 'SECTORS' as NavigationTabType, label: 'قطاعات السوق والسيولة', icon: PieChart },
        { id: 'DCA' as NavigationTabType, label: 'حاسبة متوسط التكلفة DCA', icon: Calculator },
      ],
    },
    {
      groupNameAr: '🤖 الذكاء الاصطناعي والتحليل',
      items: [
        { id: 'SMART_BUY_STUDY' as NavigationTabType, label: 'محدد أماكن الشراء الـ 3 والفحص الشامل', icon: Target, badge: 'أماكن الشراء 🎯', color: 'text-emerald-400' },
        { id: 'TECHNICAL_ANALYST' as NavigationTabType, label: 'المحلل الفني ومناطق التجميع', icon: Compass, badge: 'التجميع' },
        { id: 'DAY_TRADING' as NavigationTabType, label: 'ماسح المضاربة وخطط SMC', icon: Flame, badge: 'SMC ⚡', color: 'text-amber-400' },
        { id: 'NEWS' as NavigationTabType, label: 'الأخبار والروابط المعتمدة', icon: Newspaper, badge: 'روابط ↗' },
        { id: 'DAILY_REPORT' as NavigationTabType, label: 'التقرير اليومي الآلي للسوق', icon: FileText },
      ],
    },
    {
      groupNameAr: '⚡ الرواصد الفنية والمؤشرات',
      items: [
        { id: 'RADARS' as NavigationTabType, label: 'الرواصد الفنية الأربعة المتقدمة', icon: Target },
        { id: 'DIVERGENCE' as NavigationTabType, label: 'راصد الدايفرجنس (8 مؤشرات)', icon: Zap, badge: '8 مؤشرات' },
        { id: 'ASO_REGIME' as NavigationTabType, label: 'مؤشر ميزان القوى وحالة السوق (ASO)', icon: Activity, badge: 'ASO' },
        { id: 'ALERTS' as NavigationTabType, label: 'تنبيهات الأسعار المخصصة', icon: Bell },
      ],
    },
    {
      groupNameAr: '💼 المحفظة والصفقات',
      items: [
        { id: 'TRADE_MANAGEMENT' as NavigationTabType, label: 'إدارة الصفقات ووقف الخسارة', icon: Target, badge: 'مباشر 🚀' },
        { id: 'PORTFOLIO' as NavigationTabType, label: 'سجل المحفظة الذكية', icon: Layers, badge: 'رأس المال' },
      ],
    },
    {
      groupNameAr: '🌐 الأسواق والمؤسسات',
      items: [
        { id: 'GLOBAL_MARKETS' as NavigationTabType, label: 'الأسواق العالمية والنفط والذهب', icon: Globe, badge: 'مباشر 🌐' },
        { id: 'GOLD_MARKET' as NavigationTabType, label: 'بورصة الذهب والصاغة iSagha', icon: Coins, badge: 'مباشر 🪙', color: 'text-amber-400' },
        { id: 'MARKET_COMPARISON' as NavigationTabType, label: 'مقارنة الأسواق بالشارت الموحد', icon: ArrowLeftRight },
        { id: 'INVESTOR_CATEGORIES' as NavigationTabType, label: 'فئات المستثمرين والمؤسسات', icon: Users },
      ],
    },
  ];

  // Find active tab info
  const activeTabInfo = tabGroups
    .flatMap((g) => g.items)
    .find((item) => item.id === activeTab) || {
    id: 'WATCHLIST' as NavigationTabType,
    label: 'قوائم البورصة العامة',
    icon: Layers,
    badge: `${counts.all}`,
  };
  const ActiveTabIcon = activeTabInfo.icon;

  // Watchlist Category Groups
  const categoryGroups = [
    {
      groupNameAr: '🏛️ مؤشرات البورصة الرسمية',
      items: [
        { id: 'SHARIAH' as WatchlistCategory, label: 'مؤشر الشريعة (EGX Shariah)', count: counts.shariah, isShariah: true },
        { id: 'EGX30' as WatchlistCategory, label: 'مؤشر EGX 30 القيادي', count: counts.egx30 },
        { id: 'EGX70' as WatchlistCategory, label: 'مؤشر EGX 70 الشركات المتوسطة', count: counts.egx70 },
        { id: 'EGX100' as WatchlistCategory, label: 'مؤشر EGX 100 الأوسع نطاقاً', count: counts.egx100 },
      ],
    },
    {
      groupNameAr: '🚀 الزخم والسيولة اللحظية',
      items: [
        { id: 'INSTITUTIONAL_LIQUIDITY' as WatchlistCategory, label: 'تدفق السيولة المؤسساتية (ADV-20)', count: counts.institutionalLiquidity ?? 0, isSpike: true },
        { id: 'MOST_ACTIVE' as WatchlistCategory, label: 'الأعلى نشاطاً وسيولة اليوم', count: 25 },
        { id: 'GAINERS' as WatchlistCategory, label: 'الأسهم الأكثر صعوداً ↗', count: 20 },
        { id: 'LOSERS' as WatchlistCategory, label: 'الأسهم الأكثر هبوطاً ↘', count: 20 },
      ],
    },
    {
      groupNameAr: '🎯 الإشارات الفنية والقوائم',
      items: [
        { id: 'RESISTANCE_BREAK' as WatchlistCategory, label: 'اختراق مستويات المقاومة ⚡', count: 15 },
        { id: 'SUPPORT_REBOUND' as WatchlistCategory, label: 'ارتداد صاعد من مناطق الدعم 🛡️', count: 18 },
        { id: 'FAVORITES' as WatchlistCategory, label: 'الأسهم المفضلة لديك ⭐', count: counts.favorites },
        { id: 'ALL' as WatchlistCategory, label: 'جميع الأسهم المصرية المدرجة', count: counts.all },
      ],
    },
  ];

  const currentCategoryLabel = categoryGroups
    .flatMap((g) => g.items)
    .find((c) => c.id === activeCategory)?.label || 'قوائم الأسهم';

  const activeBarsCount =
    (barsVisibility.showGoldBar ? 1 : 0) +
    (barsVisibility.showMarketStatusBar ? 1 : 0) +
    (barsVisibility.showPriceTicker ? 1 : 0) +
    (barsVisibility.showOpportunitiesTape ? 1 : 0);

  return (
    <div
      dir="rtl"
      className="bg-gradient-to-r from-[#070b12] via-[#0c101a] to-[#070b12] border-b border-cyan-500/25 px-2.5 sm:px-4 lg:px-6 py-2 text-xs font-['Cairo'] shadow-lg backdrop-blur-md sticky top-[57px] z-30 select-none"
    >
      <div className="max-w-[1850px] w-full mx-auto flex items-center justify-between gap-2.5 flex-wrap">
        {/* Left Side: The 3 Consolidated Semantic Dropdowns + Quick Pills */}
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {/* ============================================================== */}
          {/* DROPDOWN 1: أقسام وتبويبات المنصة الـ 18 (Platform Tabs Dropdown) */}
          {/* ============================================================== */}
          <div className="relative" ref={tabsRef}>
            <button
              type="button"
              onClick={() => {
                setIsTabsOpen(!isTabsOpen);
                setIsCategoriesOpen(false);
                setIsBarsOpen(false);
              }}
              className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer border shadow-sm active:scale-95 ${
                isTabsOpen
                  ? 'bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 text-slate-950 border-cyan-300 ring-2 ring-cyan-400/40'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border-cyan-500/40 hover:border-cyan-400'
              }`}
              title="تحديد قسم أو تبويب التحليل (18 تبويب مصنفة)"
            >
              <ActiveTabIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span className="max-w-[150px] sm:max-w-[180px] truncate">{activeTabInfo.label}</span>
              {activeTabInfo.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                  {activeTabInfo.badge}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isTabsOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Categorized Dropdown Content */}
            {isTabsOpen && (
              <div className="absolute right-0 mt-2 w-[320px] sm:w-[360px] rounded-2xl bg-[#0a0e17] border border-cyan-500/40 shadow-2xl shadow-cyan-950/60 p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl max-h-[75vh] overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-bold text-slate-400 px-1">
                  <span className="text-cyan-300 font-black">أقسام وتبويبات التحليل (18)</span>
                  <span className="text-[10px] text-slate-500">اختر القسم مباشرة</span>
                </div>

                <div className="space-y-3">
                  {tabGroups.map((group) => (
                    <div key={group.groupNameAr}>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 px-1">
                        {group.groupNameAr}
                      </span>
                      <div className="space-y-0.5">
                        {group.items.map((item) => {
                          const isCurrent = activeTab === item.id;
                          const IconComp = item.icon;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                onSelectTab(item.id);
                                setIsTabsOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-right transition-colors cursor-pointer border ${
                                isCurrent
                                  ? 'bg-gradient-to-r from-cyan-500/25 to-teal-500/20 text-cyan-200 border-cyan-400/60 font-black'
                                  : 'bg-slate-900/50 hover:bg-slate-800/80 text-slate-300 border-transparent hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <IconComp className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-cyan-400' : 'text-slate-400'}`} />
                                <span className="truncate text-xs">{item.label}</span>
                              </div>
                              {item.badge && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* DROPDOWN 2: تصنيفات الأسهم المصرية (Watchlist Category Dropdown) */}
          {/* ============================================================== */}
          <div className="relative" ref={categoriesRef}>
            <button
              type="button"
              onClick={() => {
                setIsCategoriesOpen(!isCategoriesOpen);
                setIsTabsOpen(false);
                setIsBarsOpen(false);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border shadow-sm active:scale-95 ${
                isCategoriesOpen
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 border-emerald-300 ring-2 ring-emerald-400/40'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-emerald-300 border-emerald-500/40 hover:border-emerald-400'
              }`}
              title="تحديد تصنيف الأسهم (مؤشرات، سيولة، اختراقات، شريعة)"
            >
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              <span className="max-w-[140px] sm:max-w-[170px] truncate">{currentCategoryLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCategoriesOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Categorized Dropdown Content */}
            {isCategoriesOpen && (
              <div className="absolute right-0 mt-2 w-[320px] sm:w-[350px] rounded-2xl bg-[#0a0e17] border border-emerald-500/40 shadow-2xl shadow-emerald-950/60 p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl max-h-[75vh] overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-bold text-slate-400 px-1">
                  <span className="text-emerald-300 font-black">تصنيفات الأسهم المصرية</span>
                  <span className="text-[10px] text-slate-500">فلترة فورية</span>
                </div>

                <div className="space-y-3">
                  {categoryGroups.map((group) => (
                    <div key={group.groupNameAr}>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 px-1">
                        {group.groupNameAr}
                      </span>
                      <div className="space-y-0.5">
                        {group.items.map((cat) => {
                          const isCurrent = activeCategory === cat.id;
                          return (
                            <button
                              key={cat.id}
                              onClick={() => {
                                onSelectCategory(cat.id);
                                onSelectTab('WATCHLIST');
                                setIsCategoriesOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-right transition-colors cursor-pointer border ${
                                isCurrent
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 font-black'
                                  : 'bg-slate-900/50 hover:bg-slate-800/80 text-slate-300 border-transparent hover:border-slate-700'
                              }`}
                            >
                              <span className="truncate text-xs">{cat.label}</span>
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${
                                  isCurrent
                                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {cat.count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sort Option Controls at Bottom of Dropdown */}
                <div className="mt-3 pt-2.5 border-t border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1.5 px-1">ترتيب الجدول حسب:</span>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <button
                      onClick={() => onSortChange('liquidity')}
                      className={`px-2 py-1 rounded-lg border font-bold transition-colors ${
                        sortBy === 'liquidity'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      الأعلى سيولة 💧
                    </button>
                    <button
                      onClick={() => onSortChange('gainers')}
                      className={`px-2 py-1 rounded-lg border font-bold transition-colors ${
                        sortBy === 'gainers'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      الأكثر صعوداً ↗
                    </button>
                    <button
                      onClick={() => onSortChange('losers')}
                      className={`px-2 py-1 rounded-lg border font-bold transition-colors ${
                        sortBy === 'losers'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      الأكثر هبوطاً ↘
                    </button>
                    <button
                      onClick={() => onSortChange('price')}
                      className={`px-2 py-1 rounded-lg border font-bold transition-colors ${
                        sortBy === 'price'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      الأعلى سعراً 🪙
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* DROPDOWN 3: مفاتيح إظهار وإخفاء الأشرطة (Live Tickers Dropdown) */}
          {/* ============================================================== */}
          <div className="relative" ref={barsRef}>
            <button
              type="button"
              onClick={() => {
                setIsBarsOpen(!isBarsOpen);
                setIsTabsOpen(false);
                setIsCategoriesOpen(false);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border shadow-sm active:scale-95 ${
                isBarsOpen
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-slate-950 border-amber-300 ring-2 ring-amber-400/40'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-amber-300 border-amber-500/40 hover:border-amber-400'
              }`}
              title="التحكم في إظهار وإخفاء أشرطة البورصة والذهب"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>الأشرطة اللحظية</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-300 border border-amber-800/80">
                {activeBarsCount}/4
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isBarsOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Content */}
            {isBarsOpen && (
              <div className="absolute right-0 mt-2 w-[280px] sm:w-[320px] rounded-2xl bg-[#0a0e17] border border-amber-500/40 shadow-2xl shadow-amber-950/60 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-bold text-slate-400">
                  <span className="text-amber-300 font-black">أشرطة البث والتنبيهات</span>
                  <span className="text-[10px] text-slate-500">{activeBarsCount} مفعلة</span>
                </div>

                <div className="space-y-1.5">
                  {/* 1. Gold Bar Switch */}
                  <button
                    onClick={onToggleGoldBar}
                    className={`w-full flex items-center justify-between p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      barsVisibility.showGoldBar
                        ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-400" />
                      <span>شريط بورصة الذهب الفاخر</span>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${barsVisibility.showGoldBar ? 'bg-amber-400 animate-ping' : 'bg-slate-700'}`} />
                  </button>

                  {/* 2. Market Status Bar Switch */}
                  <button
                    onClick={onToggleMarketStatusBar}
                    className={`w-full flex items-center justify-between p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      barsVisibility.showMarketStatusBar
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <span>شريط ساعات وحالة السوق</span>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${barsVisibility.showMarketStatusBar ? 'bg-emerald-400 animate-ping' : 'bg-slate-700'}`} />
                  </button>

                  {/* 3. Opportunities Tape Switch */}
                  <button
                    onClick={onToggleOpportunitiesTape}
                    className={`w-full flex items-center justify-between p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      barsVisibility.showOpportunitiesTape
                        ? 'bg-purple-950/40 border-purple-500/50 text-purple-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span>شريط الفرص اللحظية والرادار</span>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${barsVisibility.showOpportunitiesTape ? 'bg-purple-400 animate-ping' : 'bg-slate-700'}`} />
                  </button>

                  {/* 4. Price Ticker Switch */}
                  <button
                    onClick={onTogglePriceTicker}
                    className={`w-full flex items-center justify-between p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      barsVisibility.showPriceTicker
                        ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                      <span>شريط الأسعار اللحظية المتحرك</span>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${barsVisibility.showPriceTicker ? 'bg-cyan-400 animate-ping' : 'bg-slate-700'}`} />
                  </button>
                </div>

                {/* Quick actions: Show All, Hide All */}
                <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] gap-2">
                  {onShowAllBars && (
                    <button
                      onClick={onShowAllBars}
                      className="text-slate-400 hover:text-emerald-300 cursor-pointer"
                    >
                      إظهار الكل
                    </button>
                  )}
                  {onHideAllBars && (
                    <button
                      onClick={onHideAllBars}
                      className="text-slate-400 hover:text-rose-300 cursor-pointer"
                    >
                      إخفاء الكل
                    </button>
                  )}
                  {onResetDefaultBars && (
                    <button
                      onClick={onResetDefaultBars}
                      className="text-cyan-400 hover:text-cyan-300 cursor-pointer font-bold"
                    >
                      الافتراضي
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Access Top Pills (الأكثر زيارة واستخداماً) */}
          <div className="hidden xl:flex items-center gap-1">
            <button
              onClick={() => onSelectTab('WATCHLIST')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                activeTab === 'WATCHLIST'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border-transparent'
              }`}
            >
              📊 الأسهم
            </button>
            <button
              onClick={() => onSelectTab('SHARIAH')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                activeTab === 'SHARIAH'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-900/60 text-emerald-400/70 hover:text-emerald-300 border-transparent'
              }`}
            >
              🟢 الشريعة
            </button>
            <button
              onClick={() => onSelectTab('CHART')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                activeTab === 'CHART'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border-transparent'
              }`}
            >
              📈 الشارت
            </button>
            <button
              onClick={() => onSelectTab('DAY_TRADING')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                activeTab === 'DAY_TRADING'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900/60 text-amber-400/80 hover:text-amber-300 border-transparent'
              }`}
            >
              ⚡ المضاربة
            </button>
          </div>
        </div>

        {/* Right Side: Cairo Market Status & Refresh Countdown */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Cairo Session Status Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px]">
            <span
              className={`w-2 h-2 rounded-full ${
                session.isOpen ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
              }`}
            />
            <span className="font-bold text-white hidden sm:inline">{session.statusTextAr}</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <div className="flex items-center gap-1 text-slate-300 font-mono text-[11px]">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>{session.cairoTimeFormatted}</span>
            </div>
          </div>

          {/* Auto Refresh Interval & Timer */}
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px]">
            <Timer className="w-3 h-3 text-cyan-400" />
            <select
              value={refreshInterval}
              onChange={(e) => onRefreshIntervalChange(Number(e.target.value))}
              className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer text-[11px] font-['Cairo']"
              title="تحديد فترة التحديث التلقائي"
            >
              <option value={15} className="bg-slate-950 text-slate-200">15ث ⚡</option>
              <option value={30} className="bg-slate-950 text-slate-200">30ث</option>
              <option value={60} className="bg-slate-950 text-emerald-400 font-bold">1د ⭐</option>
              <option value={120} className="bg-slate-950 text-slate-200">2د</option>
              <option value={0} className="bg-slate-950 text-rose-300">يدوي</option>
            </select>
            {refreshInterval > 0 && (
              <span className="font-mono text-[10px] text-cyan-400 font-bold bg-cyan-950/90 px-1 rounded border border-cyan-800/60 tabular-nums">
                {countdownSeconds}ث
              </span>
            )}
          </div>

          {/* Instant Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-colors cursor-pointer"
            title="تحديث البيانات لحظياً الآن"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
