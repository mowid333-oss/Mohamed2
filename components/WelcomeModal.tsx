import React from 'react';
import {
  Sparkles,
  Bot,
  Zap,
  TrendingUp,
  Building2,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  X,
  BarChart3,
  Users,
  Layers,
  Flame,
  LineChart,
} from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExploreFeature?: (tabKey: string) => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onExploreFeature,
}) => {
  if (!isOpen) return null;

  const handleStartTrading = () => {
    localStorage.setItem('has_seen_egx_welcome', 'true');
    onClose();
  };

  const handleFeatureClick = (tabKey: string) => {
    localStorage.setItem('has_seen_egx_welcome', 'true');
    if (onExploreFeature) {
      onExploreFeature(tabKey);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200 font-['Cairo']"
      dir="rtl"
    >
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-950/50 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Decorative Top Glowing Ambient Bars */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-800/80 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/25 flex-shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  أهلاً بك في رادار البورصة ومستشار التداول الذكي (تحت الاختبار)
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[11px] font-bold text-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  تحت الاختبار 🧪
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                منصتك الاحترافية المتقدمة لتحليل الأسهم، تتبع السيولة، والتداول الذكي بأحدث تقنيات الذكاء الاصطناعي
              </p>
            </div>
          </div>

          <button
            onClick={handleStartTrading}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer border border-slate-700/60"
            title="إغلاق والبدء"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-right">
          {/* Hero Banner with Quick Highlights */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-emerald-950/40 border border-cyan-500/20 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-cyan-200 text-xs sm:text-sm font-bold">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>كل ما يحتاجه المستثمر والمتداول اليومي في البورصة المصرية (EGX) في مكان واحد</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-300">
              <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 font-mono">
                EGX30 / EGX70 / EGX33
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold">
                شريعة إسلامية 100%
              </span>
            </div>
          </div>

          {/* Three Core Pillars Highlight Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Feature 1: المحلل الذكي */}
            <div
              onClick={() => handleFeatureClick('TECHNICAL_ANALYST')}
              className="group relative p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-cyan-500/10 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-cyan-400 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                    Groq & Gemini AI
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-black text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                    المحلل الذكي
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    تحليل فني لحظي متعدد النماذج مدعوم بأحدث خوارزميات الذكاء الاصطناعي (Groq Llama 3 70B و Google Gemini).
                  </p>
                </div>

                <ul className="space-y-1.5 text-[11px] text-slate-300 pt-2 border-t border-slate-800/80">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span>تحديد نقاط الدخول، وقف الخسارة، والأهداف الفنية بدقة</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span>رصد مؤشرات SuperTrend و RSI و MACD تلقائياً</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span>قراءة الشارت بالرؤية الحاسوبية (Chart Vision AI)</span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-cyan-400 font-bold group-hover:text-cyan-300">
                <span>استكشاف المحلل الفني</span>
                <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Feature 2: ماسح الأسهم */}
            <div
              onClick={() => handleFeatureClick('WATCHLIST')}
              className="group relative p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-emerald-500/10 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    TradingView Live
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-black text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                    ماسح الأسهم
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    شاشة متابعة متطورة وتصفية فورية لأكثر من 290 شركة مقيدة في البورصة المصرية ومؤشرات السوق.
                  </p>
                </div>

                <ul className="space-y-1.5 text-[11px] text-slate-300 pt-2 border-t border-slate-800/80">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>مؤشرات EGX30، EGX70، EGX100 ومؤشر الشريعة EGX33</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>تصفية فورية حسب السيولة، والرابحين، وأحجام التداول</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>شارتات TradingView تفاعلية مع أسعار الذهب والعملات</span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-emerald-400 font-bold group-hover:text-emerald-300">
                <span>فتح ماسح الأسهم</span>
                <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Feature 3: تقارير المؤسسات */}
            <div
              onClick={() => handleFeatureClick('INVESTOR_CATEGORIES')}
              className="group relative p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-amber-500/10 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                    تدفقات السيولة الذكية
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                    تقارير المؤسسات
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    رصد استخبارات السوق وتحركات كبار المستثمرين والمؤسسات المحلية والعربية والأجنبية.
                  </p>
                </div>

                <ul className="space-y-1.5 text-[11px] text-slate-300 pt-2 border-t border-slate-800/80">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>رادار تنبيهات طفرات السيولة المؤسساتية (ADV-20 Spikes)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>صافي تعاملات المؤسسات مقابل الأفراد والمصريين والأجانب</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>تصدير تقرير إكسيل شامل ومتكامل لجميع الأسهم بنقرة واحدة</span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-amber-400 font-bold group-hover:text-amber-300">
                <span>عرض تقارير المؤسسات</span>
                <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Additional Features Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="text-right">
                <div className="text-xs font-bold text-white">فحص شرعي معتمد</div>
                <div className="text-[10px] text-slate-400">معايير الشريعة الإسلامية</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="text-right">
                <div className="text-xs font-bold text-white">تنبيهات فورية</div>
                <div className="text-[10px] text-slate-400">سحابية مع أصوات تنبيهية</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
              <BarChart3 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <div className="text-right">
                <div className="text-xs font-bold text-white">إدارة الصفقات والمحفظة</div>
                <div className="text-[10px] text-slate-400">سجل يومي وحاسبة DCA</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
              <LineChart className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <div className="text-right">
                <div className="text-xs font-bold text-white">رادارات الانفراج الفني</div>
                <div className="text-[10px] text-slate-400">Divergence & Aso Regime</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with Primary CTA */}
        <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 text-center sm:text-right">
            <span>يمكنك دائماً إعادة فتح هذا الدليل من زر </span>
            <strong className="text-cyan-300">"دليل الاستخدام"</strong>
            <span> أو القائمة العلوية في أي وقت.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleStartTrading}
              className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer border border-emerald-300/40 hover:brightness-110"
            >
              <span>ابدأ التداول الآن</span>
              <ArrowLeft className="w-5 h-5 text-slate-950" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
