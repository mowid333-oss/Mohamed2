import React, { useMemo } from 'react';
import {
  Compass,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Target,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  Sliders,
  Sparkles,
  HelpCircle,
  Flame,
  Copy,
  Check,
} from 'lucide-react';
import { EGXStock } from '../types/stock';
import { calculateMarketAso, MarketAsoSummary, calculateStockAso } from '../services/asoMarketService';

interface AsoMarketIndicatorProps {
  stocks: EGXStock[];
  onSelectStock: (symbol: string) => void;
  onOpenReportModal?: (stock: EGXStock) => void;
}

export const AsoMarketIndicator: React.FC<AsoMarketIndicatorProps> = ({
  stocks,
  onSelectStock,
  onOpenReportModal,
}) => {
  const asoSummary: MarketAsoSummary = useMemo(() => calculateMarketAso(stocks), [stocks]);

  const {
    marketAsoScore,
    bullsMarketPower,
    bearsMarketPower,
    asoSpread,
    regimeTitleAr,
    regimeDescriptionAr,
    regimeBadgeColor,
    strategyAdviceAr,
    advancingStocksCount,
    decliningStocksCount,
    unchangedStocksCount,
    bullishBreadthPct,
    sectorSentiment,
    topAccumulatedStocks,
    topDistributedStocks,
  } = asoSummary;

  const [copiedAso, setCopiedAso] = React.useState(false);

  const handleCopyAsoReport = () => {
    const reportText = `📊 *تقرير مؤشر حالة السوق المصري العام (ASO - Market Regime)*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 *نظام السوق الحالي:* ${regimeTitleAr}
📝 *التشخيص:* ${regimeDescriptionAr}
⚖️ *ميزان القوى:* الثيران ${bullsMarketPower}% مقابل الدببة ${bearsMarketPower}% (فارق القوة: ${asoSpread >= 0 ? '+' : ''}${asoSpread}%)
📈 *اتساع السوق (Breadth):* ${bullishBreadthPct}% من الأسهم في اتجاه صاعد (${advancingStocksCount} صاعد / ${decliningStocksCount} هابط / ${unchangedStocksCount} مستقر)
💡 *التوصية الاستراتيجية:* ${strategyAdviceAr}

🏆 *أبرز الأسهم تحت التجميع المؤسسي:*
${topAccumulatedStocks.map((s) => `• ${s.symbol} (${s.nameAr}): القوة ${s.asoScore}% | السعر ${s.price.toFixed(2)} ج.م`).join('\n')}

المصدر: رادار البورصة المصرية ومؤشر الشريعة الإسلامية`;

    navigator.clipboard.writeText(reportText);
    setCopiedAso(true);
    setTimeout(() => setCopiedAso(false), 2200);
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-950 via-[#0a0f1d] to-indigo-950/60 border border-slate-800 shadow-2xl space-y-6 font-['Cairo']">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/25 shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-white">
                مؤشر قياس حالة السوق العام (ASO - Average Sentiment & Strength Oscillator)
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/40">
                مذبذب القوة المطلقة وهيمنة الثيران vs الدببة
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              يقيس التوازن الحقيقي لقوى الشراء المؤسسي (Bulls Power) والبيع (Bears Power) عبر مسح 280+ سهم بالبورصة المصرية، لتحديد نظام السوق اللحظي وحالة الاتجاه العام.
            </p>
          </div>
        </div>

        {/* Regime Badge & Copy Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleCopyAsoReport}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md active:scale-95"
            title="نسخ تقرير حالة السوق"
          >
            {copiedAso ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">تم نسخ التقرير! 📋</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-cyan-400" />
                <span>نسخ تقرير حالة السوق 📋</span>
              </>
            )}
          </button>

          <div
            className={`px-4 py-2.5 rounded-2xl border flex items-center gap-2.5 shadow-lg ${
              regimeBadgeColor === 'emerald'
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-emerald-950/30'
                : regimeBadgeColor === 'cyan'
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-cyan-950/30'
                : regimeBadgeColor === 'purple'
                ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-purple-950/30'
                : regimeBadgeColor === 'rose'
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-rose-950/30'
                : 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-amber-950/30'
            }`}
          >
            <Flame className="w-5 h-5 shrink-0 animate-pulse" />
            <div>
              <span className="text-[10px] block opacity-80 font-bold">نظام السوق الحالي (Market Regime)</span>
              <strong className="text-xs sm:text-sm font-black">{regimeTitleAr}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main ASO Power Tug-of-War Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Gauge & Meters */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>ميزان القوى بين المشترين والبائعين (Bulls vs Bears Power):</span>
            </span>
            <span className="text-xs font-mono font-bold text-slate-300">
              فارق القوة (Spread):{' '}
              <strong className={asoSpread >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {asoSpread >= 0 ? `+${asoSpread}` : asoSpread}%
              </strong>
            </span>
          </div>

          {/* Visual Dual Tug-of-War Bar */}
          <div className="space-y-1.5">
            <div className="h-5 w-full rounded-xl bg-slate-950 p-1 flex items-center gap-1 overflow-hidden border border-slate-800">
              <div
                style={{ width: `${bullsMarketPower}%` }}
                className="h-full rounded-lg bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-700 flex items-center justify-start px-2 text-[10px] font-black text-slate-950 font-mono"
              >
                {bullsMarketPower >= 15 ? `ثيران ${bullsMarketPower}%` : ''}
              </div>
              <div
                style={{ width: `${bearsMarketPower}%` }}
                className="h-full rounded-lg bg-gradient-to-r from-rose-500 to-red-700 transition-all duration-700 flex items-center justify-end px-2 text-[10px] font-black text-white font-mono"
              >
                {bearsMarketPower >= 15 ? `دببة ${bearsMarketPower}%` : ''}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono px-1">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                قوة الشراء المؤسسي (Bulls): {bullsMarketPower}%
              </span>
              <span className="text-rose-400 font-bold flex items-center gap-1">
                قوة عروض البيع (Bears): {bearsMarketPower}%
                <TrendingDown className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Regime Description & Strategy Box */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-200 leading-relaxed">
                {regimeDescriptionAr}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-900 flex items-start gap-2 text-xs">
              <span className="font-black text-cyan-400 shrink-0">خطة التعامل الفنية:</span>
              <span className="text-slate-300 font-medium">{strategyAdviceAr}</span>
            </div>
          </div>

          {/* Market Breadth Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-center">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">أسهم صاعدة 🟢</span>
              <span className="text-sm font-black font-mono text-emerald-400 mt-0.5 block">
                {advancingStocksCount} سهم
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">أسهم هابطة 🔴</span>
              <span className="text-sm font-black font-mono text-rose-400 mt-0.5 block">
                {decliningStocksCount} سهم
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">أسهم مستقرة ⚪</span>
              <span className="text-sm font-black font-mono text-slate-300 mt-0.5 block">
                {unchangedStocksCount} سهم
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-cyan-400 block">اتساع السوق الإيجابي</span>
              <span className="text-sm font-black font-mono text-cyan-300 mt-0.5 block">
                {bullishBreadthPct}%
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Top Accumulation Leaders by ASO */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-400" />
                <span>أعلى الأسهم سيطرة ثيران وتجميع (ASO):</span>
              </h3>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">Smart Bulls</span>
            </div>

            <div className="space-y-2">
              {topAccumulatedStocks.slice(0, 4).map((s) => (
                <div
                  key={s.symbol}
                  onClick={() => onSelectStock(s.symbol)}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-xs font-black text-white">{s.symbol}</strong>
                      <span className="text-[11px] text-slate-300 truncate max-w-[120px]">{s.nameAr}</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-medium">{s.regimeAr}</span>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-xs font-bold text-white block">{s.price.toFixed(2)} ج.م</span>
                    <span className="text-[10px] font-black text-emerald-400">
                      قوة: {s.bullsPower}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-400 leading-relaxed text-center">
            تحديث ASO دوري بناءً على حركة الصفقات والإغلاقات في النصف العلوي للشموع.
          </div>
        </div>
      </div>

      {/* Sector Sentiment Matrix based on ASO */}
      {sectorSentiment.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              <span>مصفوفة معنويات القطاعات وفق مؤشر ASO:</span>
            </h3>
            <span className="text-[10px] text-slate-400">مرتبة حسب القطاعات الأكثر تجميعاً</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {sectorSentiment.slice(0, 6).map((sec) => (
              <div
                key={sec.sectorAr}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1"
              >
                <span className="text-[11px] font-bold text-slate-300 block truncate" title={sec.sectorAr}>
                  {sec.sectorAr}
                </span>
                <div className="flex items-center justify-center gap-1 font-mono">
                  <span className="text-xs font-black text-white">{sec.asoScore}</span>
                  <span className="text-[10px] text-slate-500">/ 100</span>
                </div>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block ${
                    sec.statusAr === 'تجميع قوي'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : sec.statusAr === 'صعود مستقر'
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : sec.statusAr === 'تصريف'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {sec.statusAr}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
