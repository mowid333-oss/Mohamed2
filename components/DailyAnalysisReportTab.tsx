import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  Copy,
  Check,
  Building2,
  Calendar,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Share2,
  CheckCircle2,
} from 'lucide-react';
import { EGXStock } from '../types/stock';
import { DailyReportData } from '../services/userFirestoreService';
import { formatEgpMoney } from './StockTable';
import { verifyReportPricesBatch } from '../utils/priceVerificationService';
import { TradingViewRatingWidget } from './TradingViewRatingWidget';
import { getLiveCalculatedIndices } from '../data/marketIndices';
import { useReportLock } from '../hooks/useReportLock';
import { ReportStabilityLockBar } from './ReportStabilityLockBar';

interface DailyAnalysisReportTabProps {
  report: DailyReportData;
  stocks: EGXStock[];
  onSelectStock: (symbol: string) => void;
  onOpenDetailedReport: (stock: EGXStock) => void;
}

export const DailyAnalysisReportTab: React.FC<DailyAnalysisReportTabProps> = ({
  report,
  stocks,
  onSelectStock,
  onOpenDetailedReport,
}) => {
  const [copied, setCopied] = useState(false);

  // 180-second state-based lock
  const lockState = useReportLock('daily_report_tab_ai', report?.dateStr || 'TODAY', 180);

  // Guarantee all stock prices shown in the report match current live chart prices
  const { verifiedStocks, totalChecked, syncedCount } = useMemo(() => {
    return verifyReportPricesBatch(stocks);
  }, [stocks]);

  const shariahStocks = verifiedStocks.filter((s) => s.isShariahCompliant);
  const advancingCount = verifiedStocks.filter((s) => s.changePct > 0).length;
  const decliningCount = verifiedStocks.filter((s) => s.changePct < 0).length;
  const unchangedCount = verifiedStocks.filter((s) => s.changePct === 0).length;

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
⏱️ تاريخ ووقت بيانات الشارت اللحظية: ${cairoTimeNow}
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
المصدر: التقرير الآلي اليومي - رادار البورصة المصرية وأسهم الشريعة TradingView Live`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Top 5 Gainers & Top 5 Losers with strictly verified chart prices
  const topGainers = [...verifiedStocks].sort((a, b) => b.changePct - a.changePct).slice(0, 5);
  const topLosers = [...verifiedStocks].sort((a, b) => a.changePct - b.changePct).slice(0, 5);
  const topLiquidity = [...verifiedStocks].sort((a, b) => (b.valueTraded || 0) - (a.valueTraded || 0)).slice(0, 5);

  return (
    <div className="space-y-6 font-['Cairo']">
      {/* 180s Stability Lock Bar with Progress Bar & Countdown */}
      <ReportStabilityLockBar
        lockState={lockState}
        reportTitle={`تقرير البورصة اليومي: ${report.dateStr}`}
      />

      {/* Real-time Chart Price Verification Ribbon */}
      <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-emerald-300 font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>أسعار أسهم التقرير اليومي مطابقة ومدققة لحظياً مع شارت TradingView بنسبة 100%</span>
          <span className="text-[11px] text-slate-400 font-mono font-normal">
            · تم تدقيق ومزامنة {totalChecked} سهماً
            {syncedCount > 0 ? ` (${syncedCount} تم تصحيحها لحظياً)` : ''}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          ⏱️ توقيت تدقيق أسعار الشارت: {new Date().toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit' })} بتوقيت القاهرة
        </span>
      </div>

      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  التقرير اليومي الآلي لتحليل البورصة المصرية وحركة أسهم الشريعة
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                  Daily Market Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                تحليل رقمي دقيق لحركة السيولة الإجمالية، تدوير القطاعات، وأداء مؤشرات السوق ومؤشر الشريعة استناداً إلى مصادر التداول المعتمدة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-end">
            <button
              onClick={handleCopyReport}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ بنجاح' : 'نسخ التقرير بالكامل'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors"
              title="طباعة التقرير"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Market Breadth Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80 font-mono text-xs text-right">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-sans">سيولة جلسة اليوم</span>
            <div className="text-lg font-black text-cyan-300">{report.totalTurnoverEgp} مليار ج.م</div>
            <span className="text-[9px] text-slate-500 block font-sans">قيمة التداول بالسوق</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/25">
            <span className="text-[10px] text-slate-400 block font-sans">الأسهم الصاعدة</span>
            <div className="text-lg font-black text-emerald-400">+{advancingCount} سهم</div>
            <span className="text-[9px] text-emerald-400/80 block font-sans">إغلاقات خضراء</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-rose-500/25">
            <span className="text-[10px] text-slate-400 block font-sans">الأسهم المتراجعة</span>
            <div className="text-lg font-black text-rose-400">-{decliningCount} سهم</div>
            <span className="text-[9px] text-rose-400/80 block font-sans">تصحيح وجني أرباح</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-sans">أسهم الشريعة المعتمدة</span>
            <div className="text-lg font-black text-emerald-300">{shariahStocks.length} شركة</div>
            <span className="text-[9px] text-slate-500 block font-sans">متوافقة مع معايير AAOIFI</span>
          </div>
        </div>
      </div>

      {/* Main Narrative Headline Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0a0e17] border border-slate-800/90 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
          <Calendar className="w-4 h-4" />
          <span>جلسة: {report.dateStr}</span>
          <span>·</span>
          <span>التوقيت: {report.generatedAt}</span>
        </div>
        <h3 className="text-base sm:text-lg font-black text-white leading-snug">
          {report.headlineAr}
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
          {report.sessionSummaryAr}
        </p>
      </div>

      {/* Shariah Index Analysis Deep Dive */}
      <div className="p-5 sm:p-6 rounded-2xl bg-emerald-950/20 border-2 border-emerald-500/35 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h4 className="font-bold text-white text-sm">
            تحليل مؤشر الشريعة الإسلامية (EGX30 Shariah) وتدفقات الصناديق:
          </h4>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed font-sans">
          {report.shariahAnalysisAr}
        </p>
      </div>

      {/* Gainers & Losers Tables Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 5 Gainers */}
        <div className="p-5 rounded-2xl bg-[#0a0e17] border border-slate-800/90 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <TrendingUp className="w-4 h-4" />
              <span>الأسهم الأكثر صعوداً بالجلسة:</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Top 5 Gainers</span>
          </div>

          <div className="space-y-2">
            {topGainers.map((s) => (
              <div
                key={s.symbol}
                onClick={() => onSelectStock(s.symbol)}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800/80 cursor-pointer flex items-center justify-between transition-all group"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-white text-xs group-hover:text-cyan-400">{s.symbol}</span>
                    {s.isShariahCompliant && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 font-bold">
                        شريعة
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 truncate max-w-[170px] block font-sans">
                    {s.nameAr}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-left font-mono tabular-nums">
                    <strong className="text-xs text-white block">{s.price.toFixed(2)} ج.م</strong>
                    <span className="text-xs font-bold text-emerald-400">+{s.changePct.toFixed(2)}%</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetailedReport(s);
                    }}
                    className="p-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/35 text-[11px] font-bold flex items-center gap-1 transition-all"
                    title="عرض التقرير 360°"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">360°</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Decliners */}
        <div className="p-5 rounded-2xl bg-[#0a0e17] border border-slate-800/90 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
              <TrendingDown className="w-4 h-4" />
              <span>الأسهم الأكثر تراجعاً بالجلسة:</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Top 5 Decliners</span>
          </div>

          <div className="space-y-2">
            {topLosers.map((s) => (
              <div
                key={s.symbol}
                onClick={() => onSelectStock(s.symbol)}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800/80 cursor-pointer flex items-center justify-between transition-all group"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-white text-xs group-hover:text-cyan-400">{s.symbol}</span>
                    {s.isShariahCompliant && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 font-bold">
                        شريعة
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 truncate max-w-[170px] block font-sans">
                    {s.nameAr}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-left font-mono tabular-nums">
                    <strong className="text-xs text-white block">{s.price.toFixed(2)} ج.م</strong>
                    <span className="text-xs font-bold text-rose-400">{s.changePct.toFixed(2)}%</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetailedReport(s);
                    }}
                    className="p-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/35 text-[11px] font-bold flex items-center gap-1 transition-all"
                    title="عرض التقرير 360°"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">360°</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TradingView Chart Opinion & Indicators Section (Requested by user) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#090e17] border border-cyan-500/40 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-cyan-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-black font-mono text-sm">
              TV
            </div>
            <div>
              <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                <span>رأي الشارت الفني لمنصة TradingView ومؤشراته الـ 26</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                  26 Technical Indicators
                </span>
              </h4>
              <p className="text-xs text-slate-400">
                قراءة فنية لحظية شاملة لـ 15 متوسطاً متحركاً و 11 مذبذباً مع الشموع ونقاط الدعم والمقاومة
              </p>
            </div>
          </div>
          <span className="text-[11px] text-cyan-400 font-mono font-bold">
            مؤشر EGX 30 والأسهم القيادية
          </span>
        </div>

        {/* Embedded TradingView Rating Widget for the Lead Stock (e.g. TMGH or top active) */}
        {verifiedStocks[0] && (
          <TradingViewRatingWidget
            stock={verifiedStocks[0]}
            timeframeLabel="يومي (1D)"
            variant="FULL_CARD"
            onOpenChart={onSelectStock}
          />
        )}
      </div>

      {/* Technical Outlook & Recommendations */}
      <div className="p-5 sm:p-6 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <h4 className="font-bold text-white text-sm">
            الرؤية الفنية للجلسة القادمة وإرشادات إدارة المخاطر:
          </h4>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          {report.recommendationsAr}
        </p>
      </div>
    </div>
  );
};
