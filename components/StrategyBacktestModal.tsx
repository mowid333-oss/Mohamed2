import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  BarChart2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Calendar,
  Clock,
  Sparkles,
  Zap,
  Target,
  ShieldCheck,
  Scale,
} from 'lucide-react';
import { EGXStock } from '../types/stock';
import { StrategyBacktestSummary } from '../services/tradingBacktestEngine';
import { CopyableStockSymbol } from './CopyableStockSymbol';

interface StrategyBacktestModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: EGXStock;
  backtest: StrategyBacktestSummary;
}

export const StrategyBacktestModal: React.FC<StrategyBacktestModalProps> = ({
  isOpen,
  onClose,
  stock,
  backtest,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    const text = `📊 تقرير الباك تيست والاختبار التاريخي للاستراتيجية (Strategy Backtest - مدقق حسابياً)
سهم: ${stock.nameAr} (${stock.symbol}) | الفترة: ${backtest.periodLabelAr}
الاستراتيجية: ${backtest.strategyNameAr}

🏆 المؤشرات الإحصائية الحقيقية للأداء (مع خصم عمولات البورصة المصرية 0.31%):
- معدل نجاح الصفقات (Win Rate): ${backtest.winRatePct}% (${backtest.winningTrades} صفقات رابحة من إجمالي ${backtest.totalTrades})
- صافي العائد التراكمي المحقق: +${backtest.netProfitPct}% (العائد الإجمالي قبل العمولات: +${backtest.grossProfitPct}%)
- معامل الربحية الحقيقي (Profit Factor): ${backtest.profitFactor}
- أقصى تراجع فعلي للمحفظة (Max Drawdown Peak-to-Trough): ${backtest.maxDrawdownPct}%
- متوسط الربح في الصفقات الرابحة: +${backtest.averageGainPct}%
- متوسط الخسارة في الصفقات الخاسرة: -${backtest.averageLossPct}%
- معامل العائد للمخاطرة المحقق: ${backtest.riskRewardRatioAchieved}
- التوقع الرياضي لكل صفقة (Expectancy): +${backtest.expectancyPct}%
- نسبة شارب (Sharpe Ratio): ${backtest.sharpeRatio}

⏱️ آخر إشارة مسجلة:
- الإجراء: ${backtest.lastSignalActionAr}
- تاريخ وتوقيت الإشارة: ${backtest.lastSignalDateAr}
- السعر عند الإشارة: ${backtest.lastSignalPrice.toFixed(2)} ج.م`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-hidden font-['Cairo'] animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#0a0e17] border border-cyan-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-[#0a1524] to-cyan-950/70 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-500/20 shrink-0">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">
                  نتائج الباك تيست والاختبار التاريخي للاستراتيجية
                </h3>
                <CopyableStockSymbol symbol={stock.symbol} size="sm" />
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>مدقق حسابياً بالكامل</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {backtest.strategyNameAr}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              title="نسخ تقرير الباك تيست"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Real Math Audit Verification Ribbon */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>تدقيق واقعي وصارم:</strong> تم احتساب النتائج بناءً على نماذج التداول الحقيقية وخصم عمولات التداول بالبورصة المصرية (<span className="text-amber-300 font-mono font-bold">0.155% لكل جانب = 0.31% للصفقة</span>).
              </span>
            </div>
            <div className="text-cyan-300 font-mono text-xs font-bold shrink-0">
              إجمالي العمولات المخصومة: {backtest.totalCommissionPaidEgp.toLocaleString()} ج.م
            </div>
          </div>

          {/* Last Signal Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-950 to-cyan-950/60 border border-emerald-500/40 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">آخر إشارة مؤكدة ظهرت على السهم:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="text-white text-sm font-black">{backtest.lastSignalActionAr}</strong>
                  <span className="text-cyan-300 font-mono font-bold">عند سعر {backtest.lastSignalPrice.toFixed(2)} ج.م</span>
                </div>
              </div>
            </div>

            <div className="text-left font-mono">
              <span className="text-[10px] text-slate-400 block font-sans">تاريخ وتوقيت الإشارة:</span>
              <strong className="text-slate-200 text-xs">{backtest.lastSignalDateAr}</strong>
            </div>
          </div>

          {/* 4 Primary Performance Scorecards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-right">
            {/* Win Rate */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-400" />
              <span className="text-[10px] text-slate-400 block mb-0.5">معدل الصفقات الرابحة (Win Rate)</span>
              <strong className="text-xl sm:text-2xl font-mono font-black text-emerald-400 block">
                {backtest.winRatePct}%
              </strong>
              <span className="text-[10px] text-slate-400 font-sans">
                {backtest.winningTrades} رابحة من {backtest.totalTrades} صفقة
              </span>
            </div>

            {/* Net Cumulative Profit after Commissions */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-cyan-400" />
              <span className="text-[10px] text-slate-400 block mb-0.5">صافي العائد التراكمي (بعد الرسوم)</span>
              <strong className="text-xl sm:text-2xl font-mono font-black text-cyan-300 block">
                +{backtest.netProfitPct}%
              </strong>
              <span className="text-[10px] text-slate-400 font-sans">
                الإجمالي قبل الرسوم: +{backtest.grossProfitPct}%
              </span>
            </div>

            {/* Profit Factor */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-purple-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-purple-400" />
              <span className="text-[10px] text-slate-400 block mb-0.5">معامل الربحية الحقيقي (Profit Factor)</span>
              <strong className="text-xl sm:text-2xl font-mono font-black text-purple-300 block">
                {backtest.profitFactor}
              </strong>
              <span className="text-[10px] text-slate-400 font-sans">
                إجمالي الأرباح ÷ إجمالي الخسائر
              </span>
            </div>

            {/* Max Drawdown (Peak to Trough) */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-rose-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-400" />
              <span className="text-[10px] text-slate-400 block mb-0.5">أقصى تراجع للمحفظة (Peak-to-Trough)</span>
              <strong className="text-xl sm:text-2xl font-mono font-black text-rose-400 block">
                {backtest.maxDrawdownPct}%
              </strong>
              <span className="text-[10px] text-slate-400 font-sans">
                تراجع حقيقي من أعلى قمة للمحفظة
              </span>
            </div>
          </div>

          {/* Trade Mechanics & Statistics Strip */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div>
              <span className="text-[10px] text-slate-400 font-sans block">متوسط ربح الصفقة الرابحة:</span>
              <strong className="text-emerald-400 text-sm">+{backtest.averageGainPct}%</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-sans block">متوسط خسارة الصفقة الخاسرة:</span>
              <strong className="text-rose-400 text-sm">-{backtest.averageLossPct}%</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-sans block">التوقع الرياضي (Expectancy):</span>
              <strong className="text-cyan-300 text-sm">+{backtest.expectancyPct}% / صفقة</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-sans block">معامل شارب (Sharpe):</span>
              <strong className="text-purple-300 text-sm">{backtest.sharpeRatio}</strong>
            </div>
          </div>

          {/* Historical Trades Log Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Target className="w-4 h-4 text-cyan-400" />
                <span>سجل صفقات الباك تيست التاريخية الكاملة ({backtest.recentTrades.length} صفقة مع خصم العمولات):</span>
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">Realized Historical Log</span>
            </div>

            <div className="rounded-2xl border border-slate-800 overflow-x-auto no-scrollbar">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-bold">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">تاريخ الدخول</th>
                    <th className="p-3">سعر الشراء</th>
                    <th className="p-3">تاريخ الخروج</th>
                    <th className="p-3">سعر البيع</th>
                    <th className="p-3">سبب الخروج</th>
                    <th className="p-3">العائد الإجمالي</th>
                    <th className="p-3 text-left">الصافي بعد العمولات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {backtest.recentTrades.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 text-slate-500 font-sans text-[11px]">{idx + 1}</td>
                      <td className="p-3 text-slate-300 font-sans text-[11px]">{t.entryDate}</td>
                      <td className="p-3 text-white font-bold">{t.entryPrice.toFixed(2)} ج.م</td>
                      <td className="p-3 text-slate-300 font-sans text-[11px]">{t.exitDate}</td>
                      <td className="p-3 text-white font-bold">{t.exitPrice.toFixed(2)} ج.م</td>
                      <td className="p-3 font-sans text-[11px] text-slate-400">
                        {t.exitReasonAr}
                      </td>
                      <td className="p-3">
                        <span className={t.grossPnlPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {t.grossPnlPct >= 0 ? '+' : ''}{t.grossPnlPct}%
                        </span>
                      </td>
                      <td className="p-3 text-left">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold inline-block ${
                            t.isWin
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {t.netPnlPct >= 0 ? '+' : ''}{t.netPnlPct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
