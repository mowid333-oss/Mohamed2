import React, { useState } from 'react';
import {
  Coins,
  Clock,
  TrendingUp,
  Zap,
  Eye,
  EyeOff,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Compass,
  Layers,
} from 'lucide-react';

export interface BarsVisibilityState {
  showGoldBar: boolean;
  showMarketStatusBar: boolean;
  showPriceTicker: boolean;
  showOpportunitiesTape: boolean;
  showNavTabsBar: boolean;
  showWatchlistCategoriesBar: boolean;
}

interface BarsVisibilityControlBarProps {
  visibility: BarsVisibilityState;
  onToggleGoldBar: () => void;
  onToggleMarketStatusBar: () => void;
  onTogglePriceTicker: () => void;
  onToggleOpportunitiesTape: () => void;
  onToggleNavTabsBar: () => void;
  onToggleWatchlistCategoriesBar: () => void;
  onShowAll: () => void;
  onHideAll: () => void;
  onResetDefault: () => void;
}

export const BarsVisibilityControlBar: React.FC<BarsVisibilityControlBarProps> = ({
  visibility,
  onToggleGoldBar,
  onToggleMarketStatusBar,
  onTogglePriceTicker,
  onToggleOpportunitiesTape,
  onToggleNavTabsBar,
  onToggleWatchlistCategoriesBar,
  onShowAll,
  onHideAll,
  onResetDefault,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('egx_bars_controls_collapsed');
    return saved !== null ? saved === 'true' : true;
  });

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('egx_bars_controls_collapsed', String(next));
      return next;
    });
  };

  const activeCount =
    (visibility.showGoldBar ? 1 : 0) +
    (visibility.showMarketStatusBar ? 1 : 0) +
    (visibility.showPriceTicker ? 1 : 0) +
    (visibility.showOpportunitiesTape ? 1 : 0) +
    (visibility.showNavTabsBar ? 1 : 0) +
    (visibility.showWatchlistCategoriesBar ? 1 : 0);

  // If collapsed, display a slim, unobtrusive quick pill
  if (isCollapsed) {
    return (
      <div className="max-w-[1850px] w-full mx-auto px-2 sm:px-4 lg:px-6 pt-1.5">
        <div
          dir="rtl"
          className="flex items-center justify-between px-3 py-1 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] font-['Cairo'] shadow-sm text-slate-400 hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleToggleCollapse}
              className="flex items-center gap-1.5 font-bold text-slate-300 hover:text-cyan-300 cursor-pointer transition-colors"
              title="توسيع شريط التحكم في إظهار وإخفاء الأشرطة"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              <span>مفاتيح إظهار وإخفاء الأشرطة</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                {activeCount}/6 مفعلة
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Quick mini indicators */}
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] flex-wrap">
              <span
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                  visibility.showGoldBar
                    ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                    : 'bg-slate-900 text-slate-500 border border-slate-800 line-through'
                }`}
                onClick={onToggleGoldBar}
                title="شريط الذهب"
              >
                🪙 الذهب
              </span>
              <span
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                  visibility.showMarketStatusBar
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                    : 'bg-slate-900 text-slate-500 border border-slate-800 line-through'
                }`}
                onClick={onToggleMarketStatusBar}
                title="شريط حالة السوق"
              >
                🏛️ حالة السوق
              </span>
              <span
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                  visibility.showPriceTicker
                    ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60'
                    : 'bg-slate-900 text-slate-500 border border-slate-800 line-through'
                }`}
                onClick={onTogglePriceTicker}
                title="شريط الأسعار اللحظية (مخفي افتراضياً)"
              >
                📈 الأسعار {visibility.showPriceTicker ? '✓' : '(مخفي)'}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                  visibility.showOpportunitiesTape
                    ? 'bg-purple-950/60 text-purple-300 border border-purple-800/60'
                    : 'bg-slate-900 text-slate-500 border border-slate-800 line-through'
                }`}
                onClick={onToggleOpportunitiesTape}
                title="شريط الفرص"
              >
                ⚡ الفرص
              </span>
              <span
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                  visibility.showNavTabsBar
                    ? 'bg-blue-950/60 text-blue-300 border border-blue-800/60'
                    : 'bg-slate-900 text-slate-500 border border-slate-800 line-through'
                }`}
                onClick={onToggleNavTabsBar}
                title="شريط التبويبات الرئيسي"
              >
                🧭 التبويبات
              </span>
              <span
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                  visibility.showWatchlistCategoriesBar
                    ? 'bg-teal-950/60 text-teal-300 border border-teal-800/60'
                    : 'bg-slate-900 text-slate-500 border border-slate-800 line-through'
                }`}
                onClick={onToggleWatchlistCategoriesBar}
                title="شريط تصنيفات الأسهم"
              >
                🏷️ التصنيفات
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleCollapse}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>تخصيص الأشرطة</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1850px] w-full mx-auto px-2 sm:px-4 lg:px-6 pt-2">
      <div
        dir="rtl"
        className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-slate-950 via-[#0b0f17] to-slate-950 border border-cyan-500/25 text-xs font-['Cairo'] shadow-md flex flex-col gap-2.5"
      >
        {/* Top Header Row: Title, Counter & Action Buttons */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-xs">
                  مفاتيح إظهار وإخفاء الأشرطة
                </span>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  {activeCount} من 6 أشرطة مفعلة
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                تحكم كامل في مساحة الشاشة وإظهار أو إخفاء أي شريط لحظي أو شريط تبويبات وتصنيفات
              </p>
            </div>
          </div>

          {/* Quick Actions (Show All, Hide All, Reset Default, Minimize) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onShowAll}
              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="إظهار كافة الأشرطة الستة دفعة واحدة"
            >
              <Eye className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">إظهار الكل</span>
            </button>

            <button
              type="button"
              onClick={onHideAll}
              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="إخفاء كافة الأشرطة لتوفير أقصى مساحة ممكنة للرسم البياني وجدول الأسهم"
            >
              <EyeOff className="w-3 h-3 text-rose-400" />
              <span className="hidden sm:inline">إخفاء الكل</span>
            </button>

            <button
              type="button"
              onClick={onResetDefault}
              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="إعادة التعيين للوضع الافتراضي (إخفاء شريط الأسعار وإظهار باقي الأشرطة)"
            >
              <RotateCcw className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">الافتراضي</span>
            </button>

            <button
              type="button"
              onClick={handleToggleCollapse}
              className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              title="تصغير شريط التحكم"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* The 6 Interactive Switches Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 border-t border-slate-800/80">
          {/* 1. Gold Bar Switch */}
          <button
            type="button"
            onClick={onToggleGoldBar}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-between gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm ${
              visibility.showGoldBar
                ? 'bg-gradient-to-r from-amber-950/80 to-slate-900 border-amber-500/50 text-amber-300 hover:border-amber-400'
                : 'bg-slate-900/80 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
            }`}
            title="إظهار أو إخفاء شريط أسعار الذهب والعيارات والأونصة والتحوط بمصر"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Coins className={`w-3.5 h-3.5 shrink-0 ${visibility.showGoldBar ? 'text-amber-400' : 'text-slate-500'}`} />
              <span className="truncate">شريط الذهب</span>
            </div>
            <div
              className={`w-6 h-3 rounded-full p-0.5 transition-colors relative flex items-center shrink-0 ${
                visibility.showGoldBar ? 'bg-amber-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
            </div>
          </button>

          {/* 2. Market Status Bar Switch */}
          <button
            type="button"
            onClick={onToggleMarketStatusBar}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-between gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm ${
              visibility.showMarketStatusBar
                ? 'bg-gradient-to-r from-emerald-950/80 to-slate-900 border-emerald-500/50 text-emerald-300 hover:border-emerald-400'
                : 'bg-slate-900/80 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
            }`}
            title="إظهار أو إخفاء شريط ساعات جلسة البورصة والتحديث ومؤشرات السوق"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Clock className={`w-3.5 h-3.5 shrink-0 ${visibility.showMarketStatusBar ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span className="truncate">حالة السوق</span>
            </div>
            <div
              className={`w-6 h-3 rounded-full p-0.5 transition-colors relative flex items-center shrink-0 ${
                visibility.showMarketStatusBar ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
            </div>
          </button>

          {/* 3. Live Price Ticker Switch (Hidden by default) */}
          <button
            type="button"
            onClick={onTogglePriceTicker}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-between gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm relative ${
              visibility.showPriceTicker
                ? 'bg-gradient-to-r from-cyan-950/80 to-slate-900 border-cyan-500/60 text-cyan-300 hover:border-cyan-400'
                : 'bg-slate-900/80 border-cyan-900/50 text-slate-400 hover:text-cyan-300 hover:border-cyan-700'
            }`}
            title="إظهار أو إخفاء شريط الأسعار اللحظية المتحرك لأسهم البورصة المصرية (مخفي افتراضياً)"
          >
            <div className="flex items-center gap-1.5 truncate">
              <TrendingUp className={`w-3.5 h-3.5 shrink-0 ${visibility.showPriceTicker ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span className="truncate">شريط الأسعار</span>
              {!visibility.showPriceTicker && (
                <span className="text-[9px] px-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-sans">
                  مخفي
                </span>
              )}
            </div>
            <div
              className={`w-6 h-3 rounded-full p-0.5 transition-colors relative flex items-center shrink-0 ${
                visibility.showPriceTicker ? 'bg-cyan-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
            </div>
          </button>

          {/* 4. Live Opportunities Tape Switch */}
          <button
            type="button"
            onClick={onToggleOpportunitiesTape}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-between gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm ${
              visibility.showOpportunitiesTape
                ? 'bg-gradient-to-r from-purple-950/80 to-slate-900 border-purple-500/50 text-purple-300 hover:border-purple-400'
                : 'bg-slate-900/80 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
            }`}
            title="إظهار أو إخفاء شريط رادار الفرص اللحظية المتحرك والسيولة الذكية"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Zap className={`w-3.5 h-3.5 shrink-0 ${visibility.showOpportunitiesTape ? 'text-purple-400' : 'text-slate-500'}`} />
              <span className="truncate">شريط الفرص</span>
            </div>
            <div
              className={`w-6 h-3 rounded-full p-0.5 transition-colors relative flex items-center shrink-0 ${
                visibility.showOpportunitiesTape ? 'bg-purple-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
            </div>
          </button>

          {/* 5. Navigation Tabs Ribbon Switch (الشريط الأول بالصورة) */}
          <button
            type="button"
            onClick={onToggleNavTabsBar}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-between gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm ${
              visibility.showNavTabsBar
                ? 'bg-gradient-to-r from-blue-950/80 to-slate-900 border-blue-500/50 text-blue-300 hover:border-blue-400'
                : 'bg-slate-900/80 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
            }`}
            title="إظهار أو إخفاء شريط التبويبات الرئيسي (قوائم البورصة، الشريعة، المحلل الفني، دليل الاستخدام، تقارير Excel)"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Compass className={`w-3.5 h-3.5 shrink-0 ${visibility.showNavTabsBar ? 'text-blue-400' : 'text-slate-500'}`} />
              <span className="truncate">شريط التبويبات 🧭</span>
            </div>
            <div
              className={`w-6 h-3 rounded-full p-0.5 transition-colors relative flex items-center shrink-0 ${
                visibility.showNavTabsBar ? 'bg-blue-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
            </div>
          </button>

          {/* 6. Watchlist Categories Carousel Switch (الشريط الثاني بالصورة) */}
          <button
            type="button"
            onClick={onToggleWatchlistCategoriesBar}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-between gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm ${
              visibility.showWatchlistCategoriesBar
                ? 'bg-gradient-to-r from-teal-950/80 to-slate-900 border-teal-500/50 text-teal-300 hover:border-teal-400'
                : 'bg-slate-900/80 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
            }`}
            title="إظهار أو إخفاء شريط تصنيفات الأسهم (EGX30, EGX70, EGX100, الشريعة، الأكثر صعوداً، السيولة)"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Layers className={`w-3.5 h-3.5 shrink-0 ${visibility.showWatchlistCategoriesBar ? 'text-teal-400' : 'text-slate-500'}`} />
              <span className="truncate">شريط التصنيفات 🏷️</span>
            </div>
            <div
              className={`w-6 h-3 rounded-full p-0.5 transition-colors relative flex items-center shrink-0 ${
                visibility.showWatchlistCategoriesBar ? 'bg-teal-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
