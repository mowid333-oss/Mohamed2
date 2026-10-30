import {
  Globe,
  Scale,
  TrendingUp,
  Radio,
  Users,
  Newspaper,
  Camera,
  Zap,
  ShieldCheck,
  BookOpen,
  ShieldAlert,
  Sparkles,
  Coins,
  Smartphone,
  Monitor,
  Landmark,
  Calculator,
  Target,
} from 'lucide-react';
import { TabType } from '../types/stock';

interface TopQuickAccessToolbarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenChartVision: () => void;
  onOpenShariahGuide: () => void;
  onOpenUserGuide: () => void;
  onOpenHealthModal: () => void;
  isMobileMode?: boolean;
  onToggleMobileMode?: () => void;
}

export const TopQuickAccessToolbar: React.FC<TopQuickAccessToolbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenChartVision,
  onOpenShariahGuide,
  onOpenUserGuide,
  onOpenHealthModal,
  isMobileMode = false,
  onToggleMobileMode,
}) => {
  return (
    <div
      dir="rtl"
      className="rounded-2xl border border-slate-800/90 bg-gradient-to-b from-[#0a0f1d] via-[#070b14] to-[#050810] p-3 sm:p-4 shadow-xl shadow-black/40 font-['Cairo'] space-y-3"
    >
      {/* Header Label Strip */}
      <div className="flex items-center justify-between border-b border-slate-800/70 pb-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <span className="font-bold text-slate-200 text-xs sm:text-sm">
            لوحة الوصول السريع والملاحة المركزية
          </span>
          <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-mono">
            Quick Navigation Hub
          </span>
        </div>
        <div className="text-[11px] text-slate-400 hidden md:block">
          جميع أدوات التحليل، الأسواق العالمية، والرقابة الفنية المعتمدة
        </div>
      </div>

      {/* Row 1: الأسواق العالمية، التحليلات، والرادارات */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
            المنظومة والأسواق:
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 flex-wrap">
            {/* 0. التحليل المستقل لمؤشرات البورصة 30 و 33 و 70 و 100 */}
            <button
              type="button"
              onClick={() => onSelectTab('INDICES_ANALYST')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border ${
                activeTab === 'INDICES_ANALYST'
                  ? 'bg-gradient-to-r from-cyan-500/30 to-teal-500/30 text-cyan-200 border-cyan-400 shadow-sm shadow-cyan-500/30 ring-1 ring-cyan-400/50'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-cyan-300 hover:text-white border-cyan-500/40 hover:border-cyan-400'
              }`}
              title="التحليل المستقل لمؤشرات البورصة العامة EGX 30 و 33 الشريعة و 70 و 100"
            >
              <Landmark className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>مؤشرات البورصة (30 و 33 و 70 و 100) 🏛️</span>
            </button>

            {/* 1. الأسواق العالمية */}
            <button
              type="button"
              onClick={() => onSelectTab('GLOBAL_MARKETS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border ${
                activeTab === 'GLOBAL_MARKETS'
                  ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400 shadow-sm shadow-cyan-500/30 ring-1 ring-cyan-400/50'
                  : 'bg-slate-900/80 hover:bg-slate-800/90 text-cyan-400 hover:text-cyan-300 border-cyan-500/30 hover:border-cyan-500/50'
              }`}
              title="رادار الأسواق العالمية والسلع والعملات"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>الأسواق العالمية</span>
            </button>

            {/* 1.5. بورصة الذهب والصاغة 🪙 */}
            <button
              type="button"
              onClick={() => onSelectTab('GOLD_MARKET')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border ${
                activeTab === 'GOLD_MARKET'
                  ? 'bg-amber-500/25 text-amber-200 border-amber-400 shadow-sm shadow-amber-500/30 ring-1 ring-amber-400/50'
                  : 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 hover:text-amber-200 border-amber-500/40 hover:border-amber-400'
              }`}
              title="بورصة الذهب والسبائك اللحظية المعتمدة iSagha"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>بورصة الذهب 🪙</span>
            </button>

            {/* 2. مقارنة الأسواق ⚖️ */}
            <button
              type="button"
              onClick={() => onSelectTab('MARKET_COMPARISON')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border ${
                activeTab === 'MARKET_COMPARISON'
                  ? 'bg-purple-500/25 text-purple-200 border-purple-400 shadow-sm shadow-purple-500/30 ring-1 ring-purple-400/50'
                  : 'bg-slate-900/80 hover:bg-slate-800/90 text-purple-300 hover:text-purple-200 border-purple-500/30 hover:border-purple-500/50'
              }`}
              title="مقارنة سهمين أو مؤشرين في شارت موحد"
            >
              <Scale className="w-3.5 h-3.5 text-purple-400" />
              <span>مقارنة الأسواق ⚖️</span>
            </button>

            {/* 3. نظام التبريد وتعديل المتوسط الذكي DCA */}
            <button
              type="button"
              onClick={() => onSelectTab('DCA')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border ${
                activeTab === 'DCA'
                  ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400 shadow-sm shadow-cyan-500/30 ring-1 ring-cyan-400/50'
                  : 'bg-slate-900/80 hover:bg-slate-800/90 text-cyan-300 hover:text-cyan-200 border-cyan-500/30 hover:border-cyan-500/50'
              }`}
              title="نظام وحاسبة التبريد الذكي وتعديل متوسط السعر (DCA)"
            >
              <Calculator className="w-3.5 h-3.5 text-cyan-400" />
              <span>نظام التبريد الذكي (DCA) 🎯</span>
            </button>

            {/* 4. محدد أماكن الشراء الـ 3 والفحص الشامل */}
            <button
              type="button"
              onClick={() => onSelectTab('SMART_BUY_STUDY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border ${
                activeTab === 'SMART_BUY_STUDY'
                  ? 'bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-cyan-500/30 text-emerald-200 border-emerald-400 shadow-sm shadow-emerald-500/30 ring-1 ring-emerald-400/50 font-black'
                  : 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 hover:text-white border-emerald-500/40 hover:border-emerald-400'
              }`}
              title="دراسة شاملة للسهم والشارت وتحديد أفضل 3 أماكن للشراء أو إشارة الانتظار حسب أفق الاستثمار"
            >
              <Target className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>محدد أماكن الشراء الـ 3 🎯</span>
            </button>

            {/* 5. المحلل الفني */}
            <button
              type="button"
              onClick={() => onSelectTab('TECHNICAL_ANALYST')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border ${
                activeTab === 'TECHNICAL_ANALYST'
                  ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400 shadow-sm shadow-emerald-500/30 ring-1 ring-emerald-400/50'
                  : 'bg-slate-900/80 hover:bg-slate-800/90 text-slate-300 hover:text-emerald-300 border-slate-800 hover:border-emerald-500/40'
              }`}
              title="محطة المحلل الفني ومؤشرات الزخم"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>المحلل الفني</span>
            </button>

            {/* 4. راصد الدايفرجنس */}
            <button
              type="button"
              onClick={() => onSelectTab('DIVERGENCE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border ${
                activeTab === 'DIVERGENCE'
                  ? 'bg-indigo-500/25 text-indigo-200 border-indigo-400 shadow-sm shadow-indigo-500/30 ring-1 ring-indigo-400/50'
                  : 'bg-slate-900/80 hover:bg-slate-800/90 text-indigo-300 hover:text-indigo-200 border-indigo-500/30 hover:border-indigo-500/50'
              }`}
              title="راصد الدايفرجنس الإيجابي والسلبي لـ 8 مؤشرات"
            >
              <Radio className="w-3.5 h-3.5 text-indigo-400" />
              <span>راصد الدايفرجنس</span>
            </button>

            {/* 5. فئات المستثمرين */}
            <button
              type="button"
              onClick={() => onSelectTab('INVESTOR_CATEGORIES')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border ${
                activeTab === 'INVESTOR_CATEGORIES'
                  ? 'bg-amber-500/25 text-amber-200 border-amber-400 shadow-sm shadow-amber-500/30 ring-1 ring-amber-400/50'
                  : 'bg-slate-900/80 hover:bg-slate-800/90 text-amber-300 hover:text-amber-200 border-amber-500/30 hover:border-amber-500/50'
              }`}
              title="تصنيفات المستثمرين (مؤسسات، أفراد، مصريين، أجانب، عرب)"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>فئات المستثمرين</span>
            </button>

            {/* 6. الأخبار المعتمدة */}
            <button
              type="button"
              onClick={() => onSelectTab('NEWS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border ${
                activeTab === 'NEWS'
                  ? 'bg-teal-500/25 text-teal-200 border-teal-400 shadow-sm shadow-teal-500/30 ring-1 ring-teal-400/50'
                  : 'bg-slate-900/80 hover:bg-slate-800/90 text-teal-300 hover:text-teal-200 border-teal-500/30 hover:border-teal-500/50'
              }`}
              title="الأخبار المالية والإفصاحات المعتمدة"
            >
              <Newspaper className="w-3.5 h-3.5 text-teal-400" />
              <span>الأخبار المعتمدة</span>
            </button>

            {/* 7. تحليل شارت بصورة */}
            <button
              type="button"
              onClick={onOpenChartVision}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border-cyan-500/40 hover:border-cyan-400 shadow-sm shadow-cyan-950/40"
              title="تحليل الشارت بصورة عبر الذكاء الاصطناعي والرؤية الحاسوبية"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>تحليل شارت بصورة 📷</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: الحوكمة، السلامة، الشريعة، والتداول اللحظي */}
      <div className="space-y-1.5 pt-1 border-t border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
            الحوكمة والتنفيذ:
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 flex-wrap">
            {/* 1. محلل التداول اللحظي (الأسهم & XAUUSD) ⚡ */}
            <button
              type="button"
              onClick={() => onSelectTab('DAY_TRADING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border ${
                activeTab === 'DAY_TRADING'
                  ? 'bg-amber-500/25 text-amber-200 border-amber-400 shadow-sm shadow-amber-500/30 ring-1 ring-amber-400/50 font-black'
                  : 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 hover:text-amber-200 border-amber-500/40 hover:border-amber-400'
              }`}
              title="محلل وماسح التداول اللحظي للأسهم والذهب XAUUSD"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>محلل التداول اللحظي (الأسهم & XAUUSD) ⚡</span>
            </button>

            {/* 2. معايير الشريعة */}
            <button
              type="button"
              onClick={onOpenShariahGuide}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 hover:text-emerald-200 border-emerald-500/40 hover:border-emerald-400 shadow-sm"
              title="دليل ومعايير الفحص الشرعي للأسهم (الديون والفوائد)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>معايير الشريعة</span>
            </button>

            {/* 3. دليل الاستخدام الذكي 📖 */}
            <button
              type="button"
              onClick={onOpenUserGuide}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 hover:text-sky-200 border-sky-500/40 hover:border-sky-400 shadow-sm"
              title="الدليل الشامل لاستخدام التطبيق وقراءة المؤشرات"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              <span>دليل الاستخدام الذكي 📖</span>
            </button>

            {/* 4. فحص سلامة النظام (30 دقيقة) 🛡️ */}
            <button
              type="button"
              onClick={onOpenHealthModal}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 hover:text-rose-200 border-rose-500/40 hover:border-rose-400 shadow-sm"
              title="تقرير التشخيص الآلي وفحص سلامة النظام دورياً كل 30 دقيقة"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>فحص سلامة النظام (30 دقيقة) 🛡️</span>
            </button>

            {/* 5. خيار وضع الموبايل / ديسكتوب 📱 */}
            {onToggleMobileMode && (
              <button
                type="button"
                onClick={onToggleMobileMode}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border shadow-sm ${
                  isMobileMode
                    ? 'bg-amber-500/25 text-amber-200 border-amber-400 shadow-amber-500/20 ring-1 ring-amber-400/50'
                    : 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 hover:text-amber-200 border-amber-500/40 hover:border-amber-400'
                }`}
                title={isMobileMode ? 'التبديل إلى وضع الديسكتوب والجدول الكامل' : 'التبديل إلى وضع الموبايل وبطاقات اللمس الذكية'}
              >
                {isMobileMode ? (
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Monitor className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>{isMobileMode ? 'وضع الموبايل 📱' : 'خيار الموبايل 📱'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
