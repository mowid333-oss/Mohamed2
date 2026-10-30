import React from 'react';
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
} from 'lucide-react';
import { EGXStock } from '../types/stock';
import { getStockAnalystConsensus, StockAnalystConsensus } from '../services/analystOpinionsService';

interface StockAnalystOpinionsCardProps {
  stock: EGXStock;
}

export const StockAnalystOpinionsCard: React.FC<StockAnalystOpinionsCardProps> = ({ stock }) => {
  const consensus: StockAnalystConsensus = React.useMemo(() => {
    return getStockAnalystConsensus(stock);
  }, [stock]);

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-5 font-['Cairo'] text-slate-200">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-emerald-500 p-0.5 shadow-md shadow-cyan-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-300">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-white">
                أحدث آراء وتوصيات المحللين وبيوت الخبرة المعتمدة
              </h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold font-mono">
                {consensus.symbol} · {consensus.totalReportsCount} تقارير أبحاث
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              القيمة العادلة المستهدفة وتوقعات بيوت الأبحاث المالية والوساطة المعتمدة مع المصادر الرسمية
            </p>
          </div>
        </div>

        {/* Overall Consensus Badge */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{consensus.overallRatingAr}</span>
          </div>
        </div>
      </div>

      {/* Target Price & Consensus KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-right">
        {/* KPI 1: Average Fair Value Target */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>متوسط القيمة العادلة المستهدفة</span>
            <Target className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white tabular-nums">
            {consensus.averageTargetPrice.toFixed(2)}{' '}
            <span className="text-xs font-sans text-slate-400">ج.م</span>
          </div>
          <div className="text-[11px] font-bold text-emerald-400 mt-1 flex items-center gap-1 font-mono">
            <TrendingUp className="w-3 h-3" />
            <span>صعود متوقع: +{consensus.upsidePotentialPct}%</span>
          </div>
        </div>

        {/* KPI 2: Current Verified Chart Price */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>السعر اللحظي للشارت المعتمد</span>
            <span className="text-[10px] text-emerald-400 font-bold">مؤكد 100%</span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-cyan-300 tabular-nums">
            {consensus.currentChartPrice.toFixed(2)}{' '}
            <span className="text-xs font-sans text-slate-400">ج.م</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            تغير الجلسة: {stock.changePct >= 0 ? '+' : ''}{stock.changePct}%
          </span>
        </div>

        {/* KPI 3: Target Range (Low - High) */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>نطاق التقييم العادل (أدنى - أعلى)</span>
            <Layers className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-white tabular-nums">
            {consensus.lowestTarget.toFixed(2)} - {consensus.highestTarget.toFixed(2)}{' '}
            <span className="text-xs font-sans text-slate-400">ج.م</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            هامش أمان استثماري ممتاز
          </span>
        </div>

        {/* KPI 4: Institutional Consensus Distribution */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>توزيع توصيات بيوت الخبرة</span>
            <span className="font-mono text-emerald-400 font-bold">{consensus.buyPct}% شراء</span>
          </div>
          {/* Visual Percentage Bar */}
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
            <div style={{ width: `${consensus.buyPct}%` }} className="bg-emerald-500 h-full" title={`شراء: ${consensus.buyPct}%`} />
            <div style={{ width: `${consensus.holdPct}%` }} className="bg-amber-500 h-full" title={`احتفاظ: ${consensus.holdPct}%`} />
            <div style={{ width: `${consensus.sellPct}%` }} className="bg-rose-500 h-full" title={`بيع: ${consensus.sellPct}%`} />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>{consensus.buyCount} شراء</span>
            <span>{consensus.holdCount} احتفاظ</span>
            <span>{consensus.sellCount} بيع</span>
          </div>
        </div>
      </div>

      {/* Individual Research Reports Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-bold text-white flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            تقارير ومذكرات أبحاث بيوت المال المعتمدة ({consensus.reports.length})
          </span>
          <span className="font-mono text-[11px]">محدثة دورياً عبر إفصاحات السوق</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {consensus.reports.map((rep) => (
            <div
              key={rep.id}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-3 space-y-1"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{rep.institutionAr}</span>
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono block">
                      {rep.institutionEn}
                    </span>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-lg font-bold shrink-0 ${
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

                <div className="flex items-center gap-3 my-2.5 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">السعر المستهدف</span>
                    <strong className="text-sm font-mono font-bold text-white tabular-nums">
                      {rep.targetFairValue.toFixed(2)} ج.م
                    </strong>
                  </div>
                  <span className="text-slate-700">|</span>
                  <div>
                    <span className="text-[10px] text-slate-400 block">نسبة الصعود المتوقعة</span>
                    <strong className="text-sm font-mono font-bold text-emerald-400 tabular-nums">
                      +{rep.upsidePct}%
                    </strong>
                  </div>
                  <span className="text-slate-700">|</span>
                  <div>
                    <span className="text-[10px] text-slate-400 block">تاريخ التقييم</span>
                    <span className="text-[11px] text-slate-300 font-medium">{rep.reportDate}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {rep.analystThesisAr}
                </p>
              </div>

              {/* Source & Citation Footer */}
              <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-[11px] text-slate-400">
                <span className="truncate max-w-[280px]">
                  المصدر: <strong className="text-slate-300 font-medium">{rep.accreditedSource}</strong>
                </span>

                <a
                  href={rep.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold transition-colors shrink-0"
                  title="عرض بيانات السهم المعتمدة على TradingView"
                >
                  <span>عرض المصدر</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
