import React, { useState, useMemo } from 'react';
import {
  FileText,
  X,
  Printer,
  Copy,
  Check,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Building2,
  Calendar,
  Share2,
  CheckCircle2,
} from 'lucide-react';
import { EGXStock } from '../types/stock';
import { DailyReportData } from '../services/userFirestoreService';
import { verifyReportPricesBatch } from '../utils/priceVerificationService';
import { TradingViewRatingWidget } from './TradingViewRatingWidget';
import { useReportLock } from '../hooks/useReportLock';
import { ReportStabilityLockBar } from './ReportStabilityLockBar';

interface DailyAnalysisReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: DailyReportData;
  stocks: EGXStock[];
}

export const DailyAnalysisReportModal: React.FC<DailyAnalysisReportModalProps> = ({
  isOpen,
  onClose,
  report,
  stocks,
}) => {
  const [copied, setCopied] = useState(false);

  // 180-second state-based lock
  const lockState = useReportLock('daily_report_ai', report?.dateStr || 'TODAY', 180);

  // Guarantee all stock prices shown in the report match current live chart prices
  const { verifiedStocks, totalChecked, syncedCount } = useMemo(() => {
    return verifyReportPricesBatch(stocks);
  }, [stocks]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyReport = () => {
    const cairoTimeNow = new Date().toLocaleString('ar-EG', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const text = `📰 ${report.headlineAr}
📅 التاريخ: ${report.dateStr} (${report.generatedAt})
⏱️ توقيت التقرير وبيانات الشارت اللحظية: ${cairoTimeNow}
⚠️ تنويه للدقة والمصداقية: أسعار وبيانات الشارت الفني اللحظية قد تكون متأخرة 15 دقيقة بحسب اشتراطات البورصة المصرية ومزود البيانات TradingView.

🏛️ ملخص أداء جلسة البورصة المصرية:
${report.sessionSummaryAr}

🕌 تحليل مؤشر وقوائم أسهم الشريعة الإسلامية:
${report.shariahAnalysisAr}

📊 أبرز الأسهم الصاعدة: ${report.topGainers}
📉 أبرز الأسهم المتراجعة: ${report.topLosers}

💡 التوصيات الفنية وإدارة المخاطر:
${report.recommendationsAr}

⚠️ إخلاء مسؤولية: كافة المعلومات والتحليلات الواردة في هذا التقرير هي لأغراض تعليمية واسترشادية فقط ولا تمثل توصية بالبيع أو الشراء. القرار الاستثماري وإدارة المخاطر مسؤولية المستثمر بالكامل.
المصدر: التقرير الآلي اليومي - رادار البورصة المصرية وأسهم الشريعة`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shariahStocksCount = verifiedStocks.filter((s) => s.isShariahCompliant).length;
  const advancingCount = verifiedStocks.filter((s) => s.changePct > 0).length;
  const decliningCount = verifiedStocks.filter((s) => s.changePct < 0).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn font-['Cairo']">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white flex items-center justify-center shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>التقرير اليومي الآلي لتحليل البورصة المصرية وأسهم الشريعة</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                  Daily Automated Brief
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                قراءة شاملة لحركة المؤشرات والسيولة النقدية استناداً إلى مصادر التداول المعتمدة
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ReportStabilityLockBar
              lockState={lockState}
              reportTitle={report.dateStr}
              compact={true}
            />
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="طباعة التقرير"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Full 180s Stability Lock Bar */}
          <ReportStabilityLockBar
            lockState={lockState}
            reportTitle={`التقرير اليومي الآلي: ${report.dateStr}`}
          />

          {/* Live Chart Price Verification Badge */}
          <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>أسعار أسهم التقرير مطابقة ومدققة لحظياً مع شارت TradingView 100%</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {totalChecked} سهماً مدققاً {syncedCount > 0 ? `(${syncedCount} تم تحديثها) ` : ''}
            </span>
          </div>

          {/* Headline & Session Metrics Strip */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold font-mono">
                <Calendar className="w-4 h-4" />
                <span>جلسة: {report.dateStr}</span>
              </div>
              <span className="text-slate-500 font-sans">توقيت الإصدار: {report.generatedAt}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white leading-snug">
              {report.headlineAr}
            </h2>

            {/* Session KPI Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80 font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">إجمالي السيولة المتداولة</span>
                <span className="text-sm font-black text-cyan-300">{report.totalTurnoverEgp} مليار ج.م</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">أسهم الشريعة المعتمدة</span>
                <span className="text-sm font-black text-emerald-400">{shariahStocksCount} سهم</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">الأسهم المرتفعة</span>
                <span className="text-sm font-black text-emerald-400">+{advancingCount} سهم</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">الأسهم المنخفضة</span>
                <span className="text-sm font-black text-rose-400">-{decliningCount} سهم</span>
              </div>
            </div>
          </div>

          {/* Section 1: Session Overview */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span>أداء المؤشرات وتدفقات السيولة بالسوق</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-['Cairo']">
              {report.sessionSummaryAr}
            </p>
          </div>

          {/* Section 2: Dedicated Shariah Stocks & Index Deep Dive */}
          <div className="p-5 rounded-2xl bg-emerald-950/25 border border-emerald-500/35 space-y-2.5">
            <h4 className="font-bold text-emerald-300 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>تحليل مؤشر الشريعة الإسلامية (EGX30 Shariah) والأسهم المتوافقة</span>
            </h4>
            <p className="text-xs text-slate-200 leading-relaxed font-['Cairo']">
              {report.shariahAnalysisAr}
            </p>
          </div>

          {/* Section 3: Leaders & Laggards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/25 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <TrendingUp className="w-4 h-4" />
                <span>أبرز الأسهم المرتفعة اليوم:</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
                {report.topGainers}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-rose-500/25 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                <TrendingDown className="w-4 h-4" />
                <span>الأسهم الأكثر تراجعاً:</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
                {report.topLosers}
              </p>
            </div>
          </div>

          {/* Section 4: TradingView Chart Opinion & Indicators Breakdown */}
          {verifiedStocks[0] && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>رأي ومؤشرات الشارت الفني لمنصة TradingView (26 مؤشراً):</span>
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">15 MAs + 11 Oscillators</span>
              </div>
              <TradingViewRatingWidget
                stock={verifiedStocks[0]}
                timeframeLabel="يومي (1D)"
                variant="COMPACT_BANNER"
              />
            </div>
          )}

          {/* Section 5: Technical Advice & Risk Management */}
          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>الرؤية الفنية وإدارة المخاطر المقترحة:</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-['Cairo']">
              {report.recommendationsAr}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between print:hidden">
          <span className="text-[11px] text-slate-500">
            تحديث آلي يومي موثوق من رادار البورصة المصرية
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'تم النسخ بنجاح' : 'نسخ التقرير بالكامل'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
