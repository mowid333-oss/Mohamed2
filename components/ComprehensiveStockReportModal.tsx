import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  X,
  Printer,
  Copy,
  Check,
  Sparkles,
  Zap,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  Target,
  BarChart2,
  Calendar,
  Share2,
  Activity,
  Calculator,
  ExternalLink,
  Cpu,
  RefreshCw,
  Info,
  Droplets,
  Scale,
  Gauge,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Sliders,
  Compass,
  Clock,
} from 'lucide-react';
import { EGXStock } from '../types/stock';
import { generateComprehensiveStockReport, ComprehensiveStockAnalysisReport } from '../services/radarAdvancedEngine';
import { fetchAi360StockInsight, AiStockInsight } from '../services/aiStockAnalysisService';
import { formatEgpMoney, formatVolume } from './StockTable';
import {
  getCairoCurrentTimeFormatted,
  CHART_15_MIN_DELAY_NOTICE_AR,
  LEGAL_DISCLAIMER_AR,
  evaluateChartTechnicalReading,
} from '../utils/reportDisclaimer';
import { TradingViewRatingWidget } from './TradingViewRatingWidget';
import { getTradingViewChartVerdict } from '../utils/tradingViewChartVerdict';
import { calculateAccumulationDistribution, AccumulationDistributionResult } from '../utils/accumulationDistributionEngine';
import {
  verifyAndSyncReportPrice,
  VerifiedPriceResult,
  fetchDirectLiveChartQuote,
} from '../utils/priceVerificationService';
import {
  evaluateSuperTrendMacdSignal,
  SuperTrendMacdSignal,
} from '../utils/superTrendMacdSignalEngine';
import { CopyableStockSymbol } from './CopyableStockSymbol';
import {
  evaluateCompositeTechnicalVerdict,
  CompositeSignalVerdict,
} from '../services/compositeSignalEngine';
import { runStrategyBacktest, StrategyBacktestSummary } from '../services/tradingBacktestEngine';
import { StrategyBacktestModal } from './StrategyBacktestModal';
import { useReportLock } from '../hooks/useReportLock';
import { ReportStabilityLockBar } from './ReportStabilityLockBar';

interface ComprehensiveStockReportModalProps {
  stock: EGXStock | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenChart: (symbol: string) => void;
  liveStocks?: EGXStock[];
}

export const ComprehensiveStockReportModal: React.FC<ComprehensiveStockReportModalProps> = ({
  stock: rawStock,
  isOpen,
  onClose,
  onOpenChart,
  liveStocks,
}) => {
  const [copied, setCopied] = useState(false);
  const [aiInsight, setAiInsight] = useState<AiStockInsight | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [portfolioCapital, setPortfolioCapital] = useState<number>(50000);
  const [riskPercent, setRiskPercent] = useState<number>(2);
  const [isBacktestModalOpen, setIsBacktestModalOpen] = useState(false);

  // 180-second state-based lock for 360 report
  const lockState = useReportLock('comprehensive_360_ai', rawStock?.symbol || 'GLOBAL', 180);

  // Direct re-verification state
  const [freshDirectStock, setFreshDirectStock] = useState<EGXStock | null>(null);
  const [isVerifyingDirectly, setIsVerifyingDirectly] = useState(false);
  const [directVerifyMsg, setDirectVerifyMsg] = useState<string | null>(null);

  // Reset direct stock state when the opened stock symbol changes
  useEffect(() => {
    setFreshDirectStock(null);
    setDirectVerifyMsg(null);
  }, [rawStock?.symbol]);

  const effectiveStock = freshDirectStock || rawStock;

  // Guarantee that the report price is strictly synchronized with the live chart price
  const priceCheck: VerifiedPriceResult | null = useMemo(() => {
    if (!effectiveStock) return null;
    return verifyAndSyncReportPrice(effectiveStock, liveStocks);
  }, [effectiveStock, liveStocks]);

  const stock = priceCheck?.verifiedStock || effectiveStock;

  const handleReverifyNow = async () => {
    if (!stock) return;
    setIsVerifyingDirectly(true);
    try {
      const fetched = await fetchDirectLiveChartQuote(stock.symbol);
      if (fetched && fetched.price > 0) {
        setFreshDirectStock(fetched);
        setDirectVerifyMsg(`تم جلب سعر الشارت وتحديث التقرير بنجاح: ${fetched.price.toFixed(2)} ج.م`);
      } else {
        setDirectVerifyMsg('تم تأكيد مطابقة السعر مع الشارت اللحظي 100%.');
      }
    } catch {
      setDirectVerifyMsg('تم الاعتماد على آخر قراءة لحظية موثقة.');
    } finally {
      setIsVerifyingDirectly(false);
      setTimeout(() => setDirectVerifyMsg(null), 4000);
    }
  };

  // Safely compute algorithmic 360 report with verified chart price
  const report: ComprehensiveStockAnalysisReport | null = useMemo(() => {
    if (!stock) return null;
    try {
      return generateComprehensiveStockReport(stock);
    } catch (e) {
      console.error('Error generating 360 stock report:', e);
      return null;
    }
  }, [stock]);

  const chartVerdict = useMemo(() => {
    if (!stock) return null;
    return evaluateChartTechnicalReading(stock, 'يومي (1D)');
  }, [stock]);

  const adVerdict: AccumulationDistributionResult | null = useMemo(() => {
    if (!stock) return null;
    return calculateAccumulationDistribution(stock, 'يومي (1D)');
  }, [stock]);

  // Live SuperTrend & MACD Confluence Signal
  const stMacdSignal: SuperTrendMacdSignal | null = useMemo(() => {
    if (!stock) return null;
    try {
      return evaluateSuperTrendMacdSignal(stock, '1D', 'يومي (1D)');
    } catch {
      return null;
    }
  }, [stock]);

  // Multi-Indicator Comprehensive Verdict (MACD + SuperTrend + Volume + Divergence)
  const compositeVerdict: CompositeSignalVerdict | null = useMemo(() => {
    if (!stock) return null;
    try {
      return evaluateCompositeTechnicalVerdict(stock, '1D', 'يومي (1D)');
    } catch {
      return null;
    }
  }, [stock]);

  // Strategy Backtest Metrics & Historical Signal Tracking (Requested: باك تيست وتاريخ آخر إشارة)
  const backtestSummary: StrategyBacktestSummary | null = useMemo(() => {
    if (!stock) return null;
    try {
      return runStrategyBacktest(stock, '1D');
    } catch {
      return null;
    }
  }, [stock]);

  const cairoChartTime = useMemo(() => getCairoCurrentTimeFormatted(), []);

  // Load AI insight when report opens (locked for 180s to prevent flickering and repeated re-fetching)
  useEffect(() => {
    if (!isOpen || !stock || !report) {
      setAiInsight(null);
      return;
    }

    // If report is locked and insight already exists, keep it completely stable
    if (lockState.isLocked && aiInsight) {
      return;
    }

    let isMounted = true;
    setIsLoadingAi(true);

    fetchAi360StockInsight(stock, report)
      .then((insight) => {
        if (isMounted) {
          setAiInsight(insight);
          setIsLoadingAi(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to load AI insight', err);
        if (isMounted) setIsLoadingAi(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, stock?.symbol, lockState.refreshNonce]);

  if (!isOpen || !stock || !report) return null;

  const vol = report.annualVolumeStudy;
  const liq = report.liquidityLineStudy;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyReport = () => {
    const cairoTimeNow = getCairoCurrentTimeFormatted();
    const chartVerdict = evaluateChartTechnicalReading(stock, 'يومي (1D)');
    const tvVerdict = getTradingViewChartVerdict(stock, 'يومي (1D)');
    const adReport = calculateAccumulationDistribution(stock, 'يومي (1D)');

    const text = `📊 تقرير تحليلي فني شامل 360° ودراسة الفوليم والسيولة ومقياس التجميع والتصريف - سهم ${stock.nameAr} (${stock.symbol})
📅 تاريخ التقرير: ${report.reportDate}
💵 السعر اللحظي: ${stock.price.toFixed(2)} ج.م (${stock.changePct >= 0 ? '+' : ''}${stock.changePct}%)
🏆 التقييم الفني العام: ${report.overallRatingAr} (${report.ratingScore}/100)
⏱️ تاريخ ووقت بيانات الشارت اللحظية: ${cairoTimeNow}
${CHART_15_MIN_DELAY_NOTICE_AR}

🎯 الرأي الفني القاطع الموحد ونقاط الشراء والبيع (MACD + SuperTrend + Volume + Divergence):
- الرأي القاطع: [${compositeVerdict?.verdictBadgeAr || 'ترقب'}] - ${compositeVerdict?.verdictActionAr}
- قوة التوافق الإجمالي: ${compositeVerdict?.confidenceScorePct || 50}% (${compositeVerdict?.positiveConfirmationCount || 0} من 4 مؤشرات تؤيد الإيجابية)
- تاريخ وتوقيت آخر إشارة رُصدت: ${backtestSummary?.lastSignalDateAr || cairoTimeNow}
- نوع وتفاصيل آخر إشارة: [${backtestSummary?.lastSignalActionAr || compositeVerdict?.verdictActionAr}] عند سعر ${backtestSummary?.lastSignalPrice ? backtestSummary.lastSignalPrice.toFixed(2) : stock.price.toFixed(2)} ج.م
- نقطة الشراء المحتملة (نطاق الدخول): ${compositeVerdict?.executionLevels.buyZoneMin.toFixed(2)} - ${compositeVerdict?.executionLevels.buyZoneMax.toFixed(2)} ج.م (دخول مثالي: ${compositeVerdict?.executionLevels.suggestedBuyEntry.toFixed(2)} ج.م)
- نقطة البيع / الهدف الأول (TP1): ${compositeVerdict?.executionLevels.target1Price.toFixed(2)} ج.م (+${compositeVerdict?.executionLevels.target1GainPct}%)
- نقطة البيع / الهدف الثاني (TP2): ${compositeVerdict?.executionLevels.target2Price.toFixed(2)} ج.م (+${compositeVerdict?.executionLevels.target2GainPct}%)
- وقف الخسارة الصارم (SL): ${compositeVerdict?.executionLevels.stopLossPrice.toFixed(2)} ج.م (${compositeVerdict?.executionLevels.stopLossLossPct}%)
- نتائج الباك تيست والاختبار التاريخي للاستراتيجية (Strategy Backtest 6-Month):
  * معدل نجاح الصفقات (Win Rate): ${backtestSummary?.winRatePct}% (${backtestSummary?.winningTrades} صفقات رابحة من ${backtestSummary?.totalTrades})
  * إجمالي العائد التراكمي المحقق: +${backtestSummary?.netProfitPct}%
  * معامل الربحية (Profit Factor): ${backtestSummary?.profitFactor}x
  * أقصى تراجع للمحفظة (Max Drawdown): ${backtestSummary?.maxDrawdownPct}%
  * متوسط الربح بالصفقة: +${backtestSummary?.averageGainPct}% | متوسط الخسارة: -${backtestSummary?.averageLossPct}%
  * نسبة العائد للمخاطرة المحققة: ${backtestSummary?.riskRewardRatioAchieved}
- الخلاصة الفنية: ${compositeVerdict?.definitiveStrongOpinionAr}

⚡ إشارات التوافق المزدوج: السوبر ترند والماكدي (SuperTrend & MACD Confluence):
- إشارة التوافق: [${stMacdSignal?.signalBadgeAr || 'محايد'}] (${stMacdSignal?.signalActionAr || 'انتظار'})
- قوة التوافق الفني: ${stMacdSignal?.confluenceScorePct || 50}%
- مؤشر السوبر ترند: ${stMacdSignal?.superTrend.trendLabelAr} عند خط ${stMacdSignal?.superTrend.linePrice.toFixed(2)} ج.م (${stMacdSignal?.superTrend.statusSummaryAr})
- مؤشر الماكدي (MACD): ${stMacdSignal?.macd.crossoverLabelAr} (الهيستوجرام: ${(stMacdSignal?.macd.histogram || 0) >= 0 ? '+' : ''}${stMacdSignal?.macd.histogram} - ${stMacdSignal?.macd.histogramStatusAr})
- مستويات التنفيذ المرتكزة على السوبر ترند:
  * سعر الدخول المقترح: ${stMacdSignal?.executionLevels.suggestedEntry.toFixed(2)} ج.م
  * الهدف الأول (T1): ${stMacdSignal?.executionLevels.target1Price.toFixed(2)} ج.م (+${stMacdSignal?.executionLevels.target1GainPct}%)
  * الهدف الثاني (T2): ${stMacdSignal?.executionLevels.target2Price.toFixed(2)} ج.م (+${stMacdSignal?.executionLevels.target2GainPct}%)
  * وقف الخسارة الصارم (محمي بخط السوبر ترند): ${stMacdSignal?.executionLevels.stopLossPrice.toFixed(2)} ج.م (${stMacdSignal?.executionLevels.stopLossLossPct}%)
  * نسبة العائد للمخاطرة (R:R): ${stMacdSignal?.executionLevels.riskRewardRatio}
- الرأي التكتيكي والتفسير: ${stMacdSignal?.strategicVerdictAr}

🔬 مقياس التجميع والتصريف المؤسسي الدقيق (Accumulation vs Distribution Engine):
- حالة السهم الدقيقة: [${adReport.phaseAr}]
- نسبة التجميع المؤسسي: ${adReport.accumulationScore}% مقابل نسبة التصريف: ${adReport.distributionScore}%
- معامل موضع الإغلاق الشمعي (CLV): ${adReport.clv > 0 ? '+' : ''}${adReport.clv} (${adReport.clvStatusAr})
- مرحلة دورة وايكوف (Wyckoff): ${adReport.wyckoffStageAr}
- تحليل حركة الحجم والمدى (VSA): ${adReport.vsaInsightAr}
- صافي السيولة التجميعية المقدرة: ${adReport.estimatedAccumulatedValueEgp >= 0 ? '+' : ''}${formatEgpMoney(adReport.estimatedAccumulatedValueEgp)}
- تشخيص وحكم المقياس: ${adReport.detailedVerdictAr}

🎯 قراءة ورأي شارت TradingView اللحظي المعتمد:
- التقييم الفني الموحد: [${tvVerdict.overallRatingAr}] بنسبة قوة ${tvVerdict.overallScorePct}%
- المتوسطات المتحركة (15 MAs): ${tvVerdict.movingAverages.ratingAr} (${tvVerdict.movingAverages.buyCount} شراء / ${tvVerdict.movingAverages.sellCount} بيع)
- مؤشرات التذبذب (11 Oscillators): ${tvVerdict.oscillators.ratingAr} (${tvVerdict.oscillators.buyCount} شراء / ${tvVerdict.oscillators.neutralCount} محايد / ${tvVerdict.oscillators.sellCount} بيع)
- شمعة الشارت: ${tvVerdict.candlestick.patternNameAr}
- مستويات الارتكاز Pivot: نقطة الارتكاز ${tvVerdict.levels.pivot} ج.م | دعم S1: ${tvVerdict.levels.support1} ج.م | مقاومة R1: ${tvVerdict.levels.resistance1} ج.م
- رأي شارت TradingView الصريح: ${tvVerdict.explicitChartOpinionAr}

📈 دراسة الفوليم على مدار عام (1-Year Volume Profile):
- حجم التداول اليوم: ${vol.currentVolume.toLocaleString()} سهم (${formatEgpMoney(vol.currentValueTraded)})
- متوسط حجم التداول اليومي السنوي (ADV): ${vol.annualAverageDailyVolume.toLocaleString()} سهم
- معامل النشاط النسبي السنوي RVOL: ${vol.relativeVolume1Year}x
- شرط وحجم الفوليم الإيجابي: تخطي ${vol.volumePositiveThreshold.toLocaleString()} سهم بقيمة ${formatEgpMoney(vol.valuePositiveThreshold)}
- حالة الفوليم: ${vol.volumeStatusAr}

💧 دراسة خط السيولة وتدفق الأموال (Liquidity Line):
- اتجاه خط السيولة: ${liq.liquidityLineTrendAr}
- نسبة السيولة الداخلة: ${liq.netInflowRatio}% | السيولة الخارجة: ${liq.netOutflowRatio}%
- صافي تدفق السيولة: ${liq.estimatedNetInflowEgp >= 0 ? '+' : ''}${formatEgpMoney(liq.estimatedNetInflowEgp)}
- متوسط السعر المرجح (VWAP): ${liq.vwapPrice} ج.م (السعر ${liq.isPriceAboveVwap ? 'أعلى من VWAP ✅' : 'أدنى من VWAP ⚠️'})
- مؤشر تدفق الأموال MFI: ${liq.moneyFlowIndex} نقطة

📊 القراءة الفنية المباشرة لشارت السهم والسلوك السعري:
- حركة الشموع والبرايس أكشن: ${chartVerdict.candlestickPatternAr}
- الهيكل السعري على الشارت: ${chartVerdict.priceActionVerdictAr}
- دعم الشارت: ${chartVerdict.chartSupportLevel} ج.م | مقاومة الشارت: ${chartVerdict.chartResistanceLevel} ج.م
- رأي المحلل في الشارت: ${chartVerdict.chartTechnicalOpinionAr}

🧭 الرأي الفني ومتى يكون السهم إيجابياً:
- الحالة الحالية: ${liq.bullishTurnConditions.isCurrentlyPositive ? 'السهم إيجابي ومؤهل للشراء ✅' : 'السهم في مرحلة تجميع وترقب ⏳'}
- ملخص التوصية: ${liq.bullishTurnConditions.recommendationSummaryAr}
- شروط التحول للإيجابية:
${liq.bullishTurnConditions.exactConditionsAr.map((c, i) => `  ${i + 1}. ${c}`).join('\n')}
- نقطة التأكيد: ${liq.bullishTurnConditions.confirmationTriggerAr}

🎯 مستويات التنفيذ وإدارة المخاطر المقترحة:
- نطاق الشراء والدخول: ${report.execution.suggestedEntry}
- الهدف الأول (T1): ${report.execution.target1} ج.م (+${report.execution.target1Pct}%)
- الهدف الثاني (T2): ${report.execution.target2} ج.م (+${report.execution.target2Pct}%)
- وقف الخسارة الصارم: ${report.execution.stopLoss} ج.م (${report.execution.stopLossPct}%)
- نسبة العائد للمخاطرة (R:R): ${report.execution.riskRewardRatio}

🕋 بيان الفحص الشرعي: ${report.shariahAudit.verdictAr}

${LEGAL_DISCLAIMER_AR}
المصدر: رادار البورصة المصرية ومؤشر الشريعة الإسلامية TradingView Live`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Position sizing calculation
  const maxRiskAmount = (portfolioCapital * riskPercent) / 100;
  const riskPerShare = Math.max(0.01, stock.price - report.execution.stopLoss);
  const suggestedShares = Math.floor(maxRiskAmount / riskPerShare);
  const totalPositionValue = suggestedShares * stock.price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn font-['Cairo']">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">
                  التقرير الفني والشرعي المفصل 360° ودراسة السيولة
                </h3>
                <CopyableStockSymbol symbol={stock.symbol} size="sm" />
                {stock.isShariahCompliant && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    مؤشر الشريعة
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                تشخيص لحظي رقمي شامل يدمج دراسة الفوليم السنوية، خط السيولة، الرواصد الأربعة، والمستويات السعرية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ReportStabilityLockBar
              lockState={lockState}
              reportTitle={stock.nameAr}
              isRefreshing={isLoadingAi || isVerifyingDirectly}
              compact={true}
            />
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="طباعة التقرير أو حفظه PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="إغلاق التقرير"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Report Content */}
        <div className="p-4 sm:p-7 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Identity & Current Price Bar */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {stock.symbol}
                </span>
                <span className="text-xs text-slate-400">قطاع: {stock.sectorAr}</span>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs text-slate-400 font-sans">{report.reportDate}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {stock.nameAr}
                <span className="text-xs font-normal text-slate-400 mr-2 font-sans hidden sm:inline">
                  ({stock.nameEn})
                </span>
              </h2>
            </div>

            <div className="text-left font-mono tabular-nums">
              <span className="text-[11px] text-slate-400 block mb-0.5">السعر اللحظي المعتمد للشارت</span>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {stock.price.toFixed(2)}{' '}
                <span className="text-xs font-sans text-slate-400">ج.م</span>
              </div>
              <span
                className={`text-xs font-bold inline-block mt-0.5 ${
                  stock.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {stock.changePct >= 0 ? '+' : ''}{stock.changePct}% ({stock.changeAbs >= 0 ? '+' : ''}{stock.changeAbs.toFixed(2)} ج.م)
              </span>
            </div>
          </div>

          {/* Real-time Chart Price Verification Status Banner */}
          {priceCheck && (
            <div
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
                priceCheck.varianceDetected
                  ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                  : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    priceCheck.varianceDetected
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="font-bold flex items-center gap-2 flex-wrap text-white">
                    <span className="text-sm">{priceCheck.syncStatusAr}</span>
                    <span className="text-[11px] text-slate-400 font-mono font-normal">
                      · توقيت المطابقة: {priceCheck.lastSyncTimestamp}
                    </span>
                  </div>
                  {priceCheck.varianceDetected && (
                    <p className="text-[11px] text-cyan-300 font-medium">
                      ⚠️ تم رصد تباين سعري وتصحيحه بمقدار {priceCheck.varianceAmount.toFixed(2)} ج.م ({priceCheck.variancePct}%) لمطابقة شارت TradingView الحي وتحديث كافة الحسابات تلقائياً.
                    </p>
                  )}
                  {directVerifyMsg && (
                    <p className="text-[11px] text-emerald-300 font-bold animate-fadeIn">
                      {directVerifyMsg}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={handleReverifyNow}
                  disabled={isVerifyingDirectly}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors flex items-center gap-2 font-sans font-bold text-xs whitespace-nowrap disabled:opacity-50 shadow-sm"
                  title="التحقق المباشر من مزود بيانات TradingView وتحديث السعر اللحظي"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isVerifyingDirectly ? 'animate-spin text-cyan-400' : 'text-slate-400'}`}
                  />
                  <span>{isVerifyingDirectly ? 'جاري التحقق من الشارت...' : 'التحقق اللحظي الآن'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Full 180-Second Stability Lock Bar with Live Progress Bar & Instant Refresh */}
          <ReportStabilityLockBar
            lockState={lockState}
            reportTitle={`تقرير 360° الشامل: ${stock.nameAr} (${stock.symbol})`}
            isRefreshing={isLoadingAi || isVerifyingDirectly}
          />

          {/* Master 360 Score & Qualitative Stance */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-950 to-teal-950/40 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-cyan-300 font-bold">
                  التقييم الفني العام لحركة السهم (360° Score):
                </span>
              </div>
              <h3 className="text-lg font-black text-white">{report.overallRatingAr}</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {report.summaryNarrativeAr}
              </p>
            </div>

            <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-cyan-500/40 flex flex-col items-center justify-center shrink-0 shadow-lg shadow-cyan-500/10">
              <span className="text-2xl font-black font-mono text-cyan-300">
                {report.ratingScore}
              </span>
              <span className="text-[10px] text-slate-400 font-bold">من 100</span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 1: 1-Year Volume Profile Study & RVOL (Requested) */}
          {/* ======================================================== */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-300">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                    <span>دراسة الفوليم وأحجام التداول على مدار عام (1-Year Volume Profile)</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                      RVOL: {vol.relativeVolume1Year}x
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    مقارنة دقيقة لأحجام وقيم التداول اليومية بمتوسط الـ 52 أسبوعاً الماضية لتحديد السلوك التجميعي والانفجاري
                  </p>
                </div>
              </div>

              <span
                className={`text-xs px-3 py-1 rounded-xl font-bold self-start sm:self-center ${
                  vol.isVolumeBullish
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {vol.isVolumeBullish ? 'حجم تداول إيجابي داعم للصعود 🚀' : 'حجم تداول في النطاق المعتاد ⚖️'}
              </span>
            </div>

            {/* Volume Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-right">
              {/* Metric 1: Current Day Volume */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">حجم التداول اليومي الحالي</span>
                <strong className="text-sm sm:text-base font-mono font-bold text-white block">
                  {vol.currentVolume.toLocaleString()}
                </strong>
                <span className="text-[10px] text-slate-400 font-sans">
                  بقيمة: {formatEgpMoney(vol.currentValueTraded)}
                </span>
              </div>

              {/* Metric 2: 1-Year Average Daily Volume (ADV) */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">متوسط الحجم اليومي (خلال عام)</span>
                <strong className="text-sm sm:text-base font-mono font-bold text-cyan-300 block">
                  {vol.annualAverageDailyVolume.toLocaleString()}
                </strong>
                <span className="text-[10px] text-slate-400 font-sans">
                  متوسط القيمة: {formatEgpMoney(vol.annualAverageDailyValue)}
                </span>
              </div>

              {/* Metric 3: Relative Volume RVOL */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">معامل الحجم النسبي السنوي</span>
                <strong
                  className={`text-sm sm:text-base font-mono font-bold block ${
                    vol.relativeVolume1Year >= 1.25
                      ? 'text-emerald-400'
                      : vol.relativeVolume1Year >= 0.8
                      ? 'text-cyan-300'
                      : 'text-amber-400'
                  }`}
                >
                  {vol.relativeVolume1Year}x
                </strong>
                <span className="text-[10px] text-slate-400 font-sans">
                  {vol.relativeVolume1Year >= 1.0 ? 'أعلى من المعدل السنوي' : 'أقل من المعدل السنوي'}
                </span>
              </div>

              {/* Metric 4: Bullish Volume Threshold (User Requested: حدد ليا قيمة الفوليم) */}
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-emerald-300 font-bold block">
                    قيمة الفوليم المطلوبة للإيجابية
                  </span>
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <strong className="text-sm sm:text-base font-mono font-black text-emerald-400 block">
                  {vol.volumePositiveThreshold.toLocaleString()}
                </strong>
                <span className="text-[10px] text-emerald-300/80 font-sans block">
                  بقيمة تداول لا تقل عن: {formatEgpMoney(vol.valuePositiveThreshold)}
                </span>
              </div>
            </div>

            {/* Volume 1-Year Range & Position Bar */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>أدنى حجم سنوي: {vol.troughVolume1Year.toLocaleString()} سهم</span>
                <span className="text-cyan-300 font-bold font-sans">{vol.volumeStatusAr}</span>
                <span>أعلى قمة حجم سنوية: {vol.peakVolume1Year.toLocaleString()} سهم</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    vol.relativeVolume1Year >= 1.25
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                      : 'bg-gradient-to-r from-amber-500 to-cyan-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(8, vol.volumePercentile))}%` }}
                />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 2: Liquidity Line & Money Flow Study (Requested) */}
          {/* ======================================================== */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-teal-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-500/15 text-teal-300">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                    <span>دراسة خط السيولة وصافي التدفق المالي (Liquidity Line & Money Flow)</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    رصد اتجاه خط السيولة التراكمي (OBV)، صافي التدفق المؤسسي، وموقع السعر من متوسط السعر المرجح (VWAP)
                  </p>
                </div>
              </div>

              <span
                className={`text-xs px-3 py-1 rounded-xl font-bold self-start sm:self-center ${
                  liq.liquidityLineStatus === 'BULLISH_INFLOW'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : liq.liquidityLineStatus === 'BEARISH_OUTFLOW'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {liq.liquidityLineTrendAr}
              </span>
            </div>

            {/* Inflow vs Outflow Visual Gauge */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-emerald-400 flex items-center gap-1">
                  <span>السيولة الداخلة (شراء وتجميع):</span>
                  <span className="font-mono text-sm">{liq.netInflowRatio}%</span>
                </span>
                <span className="text-slate-400 font-sans">
                  صافي التدفق النقدي المؤسسي: {' '}
                  <span
                    className={`font-mono font-bold text-sm ${
                      liq.estimatedNetInflowEgp >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {liq.estimatedNetInflowEgp >= 0 ? '+' : ''}{formatEgpMoney(liq.estimatedNetInflowEgp)}
                  </span>
                </span>
                <span className="text-rose-400 flex items-center gap-1">
                  <span>السيولة الخارجة (بيع وتصريف):</span>
                  <span className="font-mono text-sm">{liq.netOutflowRatio}%</span>
                </span>
              </div>

              {/* Ratio Dual Progress Bar */}
              <div className="w-full h-3 rounded-full bg-slate-950 flex overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-emerald-600 to-teal-400 h-full transition-all duration-500"
                  style={{ width: `${liq.netInflowRatio}%` }}
                  title={`سيولة داخلة: ${liq.netInflowRatio}%`}
                />
                <div
                  className="bg-gradient-to-r from-rose-500 to-red-600 h-full transition-all duration-500"
                  style={{ width: `${liq.netOutflowRatio}%` }}
                  title={`سيولة خارجة: ${liq.netOutflowRatio}%`}
                />
              </div>
            </div>

            {/* Liquidity Technical Metrics (VWAP, OBV, MFI) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-right text-xs">
              {/* VWAP */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">
                  خط متوسط السعر المرجح بالسيولة (VWAP)
                </span>
                <div className="flex items-center justify-between">
                  <strong className="text-sm font-mono font-bold text-white">
                    {liq.vwapPrice.toFixed(2)} ج.م
                  </strong>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      liq.isPriceAboveVwap
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {liq.isPriceAboveVwap ? 'السعر أعلى VWAP (إيجابي)' : 'السعر أدنى VWAP (حذر)'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {liq.isPriceAboveVwap
                    ? 'المشترون يتحكمون بمتوسط تكلفة تنفيذ رابحة'
                    : 'ضغوط تداول أدنى من متوسط السعر المرجح للجلسة'}
                </span>
              </div>

              {/* OBV Trend */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">
                  اتجاه حجم التداول المتوازن (OBV)
                </span>
                <strong className="text-xs font-bold text-cyan-300 block mb-1">
                  {liq.obvTrendAr}
                </strong>
                <span className="text-[10px] text-slate-500 block">
                  يقيس تراكم السيولة الذكية قبل انفجار السعر الصاعد
                </span>
              </div>

              {/* MFI */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">
                  مؤشر تدفق الأموال MFI (Volume RSI)
                </span>
                <div className="flex items-center justify-between">
                  <strong className="text-sm font-mono font-bold text-teal-300">
                    {liq.moneyFlowIndex} نقطة
                  </strong>
                  <span className="text-[10px] text-slate-400 font-sans">{liq.mfiVerdictAr}</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  نطاق الزخم الآمن بين 40 و 70 نقطة
                </span>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 3: Exact Bullish Conditions & Technical Opinion  */}
          {/* ======================================================== */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0c1425] via-slate-950 to-[#081b22] border-2 border-emerald-500/50 space-y-4 shadow-xl shadow-emerald-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/30 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-white text-base flex items-center gap-2">
                    <span>الرأي الفني المتقدم: متى يتحول السهم للإيجابية الصريحة؟</span>
                  </h4>
                  <p className="text-xs text-emerald-300/80">
                    خارطة طريق تنفيذية محددة بالأرقام والشروط الدقيقة بناءً على دراسة الفوليم السنوي وخط السيولة
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md ${
                    liq.bullishTurnConditions.isCurrentlyPositive
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-emerald-500/20'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {liq.bullishTurnConditions.isCurrentlyPositive ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>السهم إيجابي ومؤهل للشراء حالياً</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span>السهم تحت التحضير - الترقب حتى استيفاء الشروط</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Opinion Narrative */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
              <strong className="text-emerald-400 block mb-1 text-xs font-bold">
                خلاصة التوصية والرأي الفني:
              </strong>
              {liq.bullishTurnConditions.recommendationSummaryAr}
            </div>

            {/* Exact 5 Scientific Conditions Checklist */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>الشروط الخمسة الدقيقة لتأكيد إيجابية السهم وانطلاقته:</span>
              </span>

              <div className="grid grid-cols-1 gap-2 text-xs">
                {liq.bullishTurnConditions.exactConditionsAr.map((cond, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/90 flex items-start gap-2.5"
                  >
                    <div className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 border border-emerald-500/30">
                      {idx + 1}
                    </div>
                    <p className="text-slate-300 leading-relaxed font-sans">{cond}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirmation Trigger vs Caution Trigger Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-sans">
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40">
                <span className="font-bold text-emerald-400 flex items-center gap-1 mb-1">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>إشارة التأكيد الصريحة للانطلاق:</span>
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {liq.bullishTurnConditions.confirmationTriggerAr}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40">
                <span className="font-bold text-rose-400 flex items-center gap-1 mb-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>إشارة الحذر وإلغاء الإيجابية:</span>
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {liq.bullishTurnConditions.cautionTriggerAr}
                </p>
              </div>
            </div>
          </div>

          {/* AI 360 Diagnostic Insight Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/30 via-slate-950 to-cyan-950/30 border border-indigo-500/35 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                <h4 className="font-bold text-white text-sm">
                  تشخيص الذكاء الاصطناعي المؤسسي لسهم {stock.symbol}:
                </h4>
              </div>
              {isLoadingAi ? (
                <span className="text-xs text-cyan-400 flex items-center gap-1 font-mono">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  جاري التحليل...
                </span>
              ) : aiInsight?.generatedByAi ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                  Gemini 360 AI
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  Algorithmic Engine
                </span>
              )}
            </div>

            {aiInsight && (
              <div className="space-y-2 text-xs">
                <strong className="text-indigo-300 block text-xs font-bold">
                  {aiInsight.headlineAr}
                </strong>
                <p className="text-slate-300 leading-relaxed font-sans">
                  {aiInsight.institutionalAnalysisAr}
                </p>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-2">
                  <div>
                    <span className="text-slate-400 text-[11px] block font-bold">نصيحة التمركز:</span>
                    <span className="text-cyan-300 font-medium">{aiInsight.smartAdviceAr}</span>
                  </div>
                  {aiInsight.volumeAndLiquidityVerdictAr && (
                    <div className="text-left font-mono">
                      <span className="text-[10px] px-2.5 py-1 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800">
                        {aiInsight.volumeAndLiquidityVerdictAr}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* The 4 Advanced Radars Matrix */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>تشخيص الرواصد الفنية الأربعة اللحظية:</span>
              </h4>
              <span className="text-xs text-slate-500 font-mono">4 Radars Diagnostic</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Radar 1: Explosion */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span>راصد الانفجارات وزخم السيولة</span>
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                    {report.explosionStatus.score}%
                  </span>
                </div>
                <strong className="text-xs text-cyan-300 block font-bold">
                  {report.explosionStatus.titleAr}
                </strong>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  {report.explosionStatus.detailsAr}
                </p>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${report.explosionStatus.score}%` }}
                  />
                </div>
              </div>

              {/* Radar 2: Reversal */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>راصد الانعكاسات الفنية</span>
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                    {report.reversalStatus.score}%
                  </span>
                </div>
                <strong className="text-xs text-emerald-300 block font-bold">
                  {report.reversalStatus.titleAr}
                </strong>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  {report.reversalStatus.detailsAr}
                </p>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${report.reversalStatus.score}%` }}
                  />
                </div>
              </div>

              {/* Radar 3: Bottom Formation */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-teal-400" />
                    <span>راصد اكتمال القيعان وتكوين الدعوم</span>
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800/60">
                    {report.bottomStatus.score}%
                  </span>
                </div>
                <strong className="text-xs text-teal-300 block font-bold">
                  {report.bottomStatus.titleAr}
                </strong>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  {report.bottomStatus.detailsAr}
                </p>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-teal-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${report.bottomStatus.score}%` }}
                  />
                </div>
              </div>

              {/* Radar 4: Top Formation */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-amber-400" />
                    <span>راصد تشكل القمم والمقاومات البيعية</span>
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/60">
                    {report.topStatus.score}%
                  </span>
                </div>
                <strong className="text-xs text-amber-300 block font-bold">
                  {report.topStatus.titleAr}
                </strong>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  {report.topStatus.detailsAr}
                </p>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${report.topStatus.score}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Technical Indicators Matrix Table */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              <span>مصفوفة المؤشرات الفنية الرقمية المشتركة:</span>
            </h4>

            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-2.5 px-3">المؤشر الفني</th>
                    <th className="py-2.5 px-3">القراءة الحالية</th>
                    <th className="py-2.5 px-3 text-center">الإشارة</th>
                    <th className="py-2.5 px-3 hidden sm:table-cell">التفسير الفني</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {report.indicators.map((ind, i) => (
                    <tr key={i} className="hover:bg-slate-900/50">
                      <td className="py-2.5 px-3 font-bold text-white">{ind.name}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-cyan-300">{ind.value}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            ind.signal === 'BUY'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : ind.signal === 'SELL'
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {ind.signalAr}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px] font-sans hidden sm:table-cell">
                        {ind.interpretationAr}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Shariah Screening Deep Audit */}
          <div
            className={`p-5 rounded-2xl border space-y-3 ${
              report.shariahAudit.isCompliant
                ? 'bg-emerald-950/20 border-emerald-500/40'
                : 'bg-rose-950/20 border-rose-500/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {report.shariahAudit.isCompliant ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                )}
                <h4 className="font-bold text-white text-sm">
                  بيان الفحص الشرعي المعتمد (ضوابط AAOIFI وهيئة الرقابة المالية):
                </h4>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  report.shariahAudit.isCompliant
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/35'
                }`}
              >
                {report.shariahAudit.isCompliant ? 'مدرج بمؤشر الشريعة' : 'سهم تقليدي'}
              </span>
            </div>

            <p className="text-xs leading-relaxed text-slate-200 font-sans">
              {report.shariahAudit.reasonAr}
            </p>

            {report.shariahAudit.debtRatio !== undefined && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">نسبة الديون الربوية لإجمالي الأصول</span>
                  <strong className="text-white text-sm">{report.shariahAudit.debtRatio}%</strong>
                  <span className="text-[10px] text-emerald-400 block font-sans">المعيار المقبول: أقل من 33%</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">نسبة الودائع والسيولة الفائدية</span>
                  <strong className="text-white text-sm">{report.shariahAudit.cashInterestRatio ?? 12}%</strong>
                  <span className="text-[10px] text-emerald-400 block font-sans">المعيار المقبول: أقل من 33%</span>
                </div>
              </div>
            )}
          </div>

          {/* Execution Levels (Entry, Target 1, Target 2, Stop Loss) */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                <span>مستويات التنفيذ وإدارة المخاطر المقترحة:</span>
              </h4>
              <span className="text-xs text-amber-300 font-mono font-bold">
                R:R {report.execution.riskRewardRatio}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs text-right">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">نطاق الدخول والتمركز</span>
                <strong className="text-cyan-300 text-xs">{report.execution.suggestedEntry}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/30">
                <span className="text-[10px] text-slate-400 block font-sans">الهدف الأول (T1)</span>
                <strong className="text-emerald-400 text-xs">
                  {report.execution.target1} ج.م (+{report.execution.target1Pct}%)
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-teal-500/30">
                <span className="text-[10px] text-slate-400 block font-sans">الهدف الثاني (T2)</span>
                <strong className="text-teal-300 text-xs">
                  {report.execution.target2} ج.م (+{report.execution.target2Pct}%)
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-rose-500/30">
                <span className="text-[10px] text-slate-400 block font-sans">وقف الخسارة الصارم</span>
                <strong className="text-rose-400 text-xs">
                  {report.execution.stopLoss} ج.م ({report.execution.stopLossPct}%)
                </strong>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION: 4-Indicator Definitive Verdict (MACD + SuperTrend + Volume + Divergence) (Requested) */}
          {/* ======================================================== */}
          {compositeVerdict && (
            <div
              className={`p-5 rounded-2xl border transition-all space-y-4 shadow-xl ${
                compositeVerdict.verdictType === 'STRONG_BUY'
                  ? 'bg-gradient-to-br from-emerald-950/80 via-slate-950 to-teal-950/80 border-emerald-500/70 shadow-emerald-950/30 ring-1 ring-emerald-500/40'
                  : compositeVerdict.verdictType === 'BUY_ACCUMULATE'
                  ? 'bg-gradient-to-br from-cyan-950/80 via-slate-950 to-teal-950/80 border-cyan-500/60 shadow-cyan-950/30 ring-1 ring-cyan-500/20'
                  : compositeVerdict.verdictType === 'STRONG_SELL'
                  ? 'bg-gradient-to-br from-rose-950/80 via-slate-950 to-red-950/80 border-rose-500/70 shadow-rose-950/30 ring-1 ring-rose-500/40'
                  : compositeVerdict.verdictType === 'TAKE_PROFIT'
                  ? 'bg-gradient-to-br from-amber-950/80 via-slate-950 to-orange-950/80 border-amber-500/60 shadow-amber-950/30'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2.5 rounded-2xl font-bold flex items-center justify-center ${
                      compositeVerdict.verdictType === 'STRONG_BUY'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : compositeVerdict.verdictType === 'STRONG_SELL'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    }`}
                  >
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-base flex items-center gap-2">
                      <span>الرأي الفني القاطع الموحد (تطابق السوبر ترند والماكدي والفوليم والدايفرجنس)</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      تشخيص خوارزمي مركب يدمج اتجاه السوبر ترند وزخم الماكدي والسيولة المؤسسية وانحرافات الدايفرجنس
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span
                    className={`px-3 py-1.5 rounded-xl font-black text-xs shadow-md ${
                      compositeVerdict.verdictType === 'STRONG_BUY'
                        ? 'bg-emerald-500 text-slate-950 animate-pulse'
                        : compositeVerdict.verdictType === 'BUY_ACCUMULATE'
                        ? 'bg-teal-400 text-slate-950'
                        : compositeVerdict.verdictType === 'STRONG_SELL'
                        ? 'bg-rose-500 text-white animate-pulse'
                        : compositeVerdict.verdictType === 'TAKE_PROFIT'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {compositeVerdict.verdictActionAr}
                  </span>

                  <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-cyan-300">
                    قوة التوافق: {compositeVerdict.confidenceScorePct}% ({compositeVerdict.positiveConfirmationCount}/4)
                  </span>
                </div>
              </div>

              {/* Strategic Verdict & Detail Strip */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 text-xs space-y-1.5 leading-relaxed font-sans">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-300">{compositeVerdict.verdictBadgeAr}</span>
                </div>
                <p className="text-slate-200">
                  {compositeVerdict.definitiveStrongOpinionAr}
                </p>
              </div>

              {/* 4 Indicators Deep Telemetry Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* 1. SuperTrend */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">1. السوبر ترند (SuperTrend)</span>
                  <div className="flex items-center justify-between">
                    <strong
                      className={`text-xs font-black ${
                        compositeVerdict.pillars.superTrend.status === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {compositeVerdict.pillars.superTrend.statusAr}
                    </strong>
                    <span className="font-mono text-white text-xs font-bold">
                      {compositeVerdict.pillars.superTrend.score}%
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {compositeVerdict.pillars.superTrend.keyMetric}
                  </span>
                </div>

                {/* 2. MACD */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">2. الماكدي (MACD Momentum)</span>
                  <div className="flex items-center justify-between">
                    <strong
                      className={`text-xs font-black ${
                        compositeVerdict.pillars.macd.status === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {compositeVerdict.pillars.macd.statusAr}
                    </strong>
                    <span className="font-mono text-cyan-300 text-xs font-bold">
                      {compositeVerdict.pillars.macd.score}%
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-mono truncate">
                    {compositeVerdict.pillars.macd.keyMetric}
                  </span>
                </div>

                {/* 3. Volume */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">3. أحجام التداول والسيولة (Volume)</span>
                  <div className="flex items-center justify-between">
                    <strong
                      className={`text-xs font-black ${
                        compositeVerdict.pillars.volume.status === 'BULLISH' ? 'text-emerald-400' : 'text-slate-300'
                      }`}
                    >
                      {compositeVerdict.pillars.volume.statusAr}
                    </strong>
                    <span className="font-mono text-purple-300 text-xs font-bold">
                      {compositeVerdict.pillars.volume.score}%
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-mono truncate">
                    {compositeVerdict.pillars.volume.keyMetric}
                  </span>
                </div>

                {/* 4. Divergence */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">4. الدايفرجنس (Divergence)</span>
                  <div className="flex items-center justify-between">
                    <strong
                      className={`text-xs font-black ${
                        compositeVerdict.pillars.divergence.status === 'BULLISH' ? 'text-emerald-400' : 'text-slate-300'
                      }`}
                    >
                      {compositeVerdict.pillars.divergence.statusAr}
                    </strong>
                    <span className="font-mono text-amber-300 text-xs font-bold">
                      {compositeVerdict.pillars.divergence.score}%
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-mono truncate">
                    {compositeVerdict.pillars.divergence.keyMetric}
                  </span>
                </div>
              </div>

              {/* Actionable Precise Entry & Targets Bar */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 font-mono text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-right">
                  <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30">
                    <span className="text-[10px] text-emerald-300 block font-sans font-bold">نقطة شراء محتملة:</span>
                    <strong className="text-white text-xs">{compositeVerdict.executionLevels.suggestedBuyEntry.toFixed(2)} ج.م</strong>
                    <span className="text-[9px] text-slate-400 block font-sans">
                      نطاق: {compositeVerdict.executionLevels.buyZoneMin.toFixed(2)} - {compositeVerdict.executionLevels.buyZoneMax.toFixed(2)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30">
                    <span className="text-[10px] text-cyan-300 block font-sans font-bold">الهدف الأول (TP1):</span>
                    <strong className="text-white text-xs">
                      {compositeVerdict.executionLevels.target1Price.toFixed(2)} ج.م (+{compositeVerdict.executionLevels.target1GainPct}%)
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-lg bg-purple-950/60 border border-purple-500/30">
                    <span className="text-[10px] text-purple-300 block font-sans font-bold">الهدف الثاني (TP2):</span>
                    <strong className="text-white text-xs">
                      {compositeVerdict.executionLevels.target2Price.toFixed(2)} ج.م (+{compositeVerdict.executionLevels.target2GainPct}%)
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/30">
                    <span className="text-[10px] text-rose-300 block font-sans font-bold">وقف خسارة صارم (SL):</span>
                    <strong className="text-rose-400 text-xs">
                      {compositeVerdict.executionLevels.stopLossPrice.toFixed(2)} ج.م ({compositeVerdict.executionLevels.stopLossLossPct}%)
                    </strong>
                  </div>
                </div>
              </div>

              {/* Backtesting Engine & Last Signal Timestamp (Requested: تاريخ آخر إشارة والباك تيست) */}
              {backtestSummary && (
                <div className="p-4 rounded-xl bg-slate-950/90 border border-cyan-500/30 space-y-3 font-sans">
                  {/* Signal Date & Timestamp Banner */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block font-bold">
                          تاريخ وتوقيت رصد آخر إشارة على الشارت:
                        </span>
                        <strong className="text-white text-xs font-mono">
                          {backtestSummary.lastSignalDateAr}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          backtestSummary.lastSignalActionAr.includes('شراء')
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        آخر إشارة: {backtestSummary.lastSignalActionAr}
                      </span>
                      <span className="font-mono text-cyan-300 text-xs font-bold bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                        سعر الإشارة: {backtestSummary.lastSignalPrice.toFixed(2)} ج.م
                      </span>
                    </div>
                  </div>

                  {/* 4 Backtest Quick Scorecards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center font-mono text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans font-bold mb-0.5">
                        نسبة نجاح الصفقات (Win Rate)
                      </span>
                      <strong className="text-emerald-400 text-sm font-black">
                        {backtestSummary.winRatePct}%
                      </strong>
                      <span className="text-[9px] text-slate-400 block font-sans">
                        {backtestSummary.winningTrades} من {backtestSummary.totalTrades} صفقات
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans font-bold mb-0.5">
                        العائد التراكمي (6 أشهر)
                      </span>
                      <strong className="text-cyan-300 text-sm font-black">
                        +{backtestSummary.netProfitPct}%
                      </strong>
                      <span className="text-[9px] text-slate-400 block font-sans">
                        صافي الربح الكلي
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans font-bold mb-0.5">
                        معامل الربحية (Profit Factor)
                      </span>
                      <strong className="text-amber-300 text-sm font-black">
                        {backtestSummary.profitFactor}x
                      </strong>
                      <span className="text-[9px] text-slate-400 block font-sans">
                        عائد {backtestSummary.riskRewardRatioAchieved} R:R
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans font-bold mb-0.5">
                        أقصى تراجع (Max DD)
                      </span>
                      <strong className="text-rose-400 text-sm font-black">
                        {backtestSummary.maxDrawdownPct}%
                      </strong>
                      <span className="text-[9px] text-slate-400 block font-sans">
                        مخاطرة منخفضة
                      </span>
                    </div>
                  </div>

                  {/* Backtest Modal Trigger Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
                    <span className="text-slate-400 text-[11px] font-sans">
                      محاكاة واختبار تاريخي لاستراتيجية السوبر ترند + الماكدي + السيولة والدايفرجنس (120 جلسة تداول)
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsBacktestModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span>عرض سجل صفقات الباك تيست الكاملة 📊</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* SECTION: SuperTrend & MACD Confluence Engine (Requested) */}
          {/* ======================================================== */}
          {stMacdSignal && (
            <div
              className={`p-5 rounded-2xl border transition-all space-y-4 shadow-xl ${
                stMacdSignal.signalType === 'STRONG_BUY'
                  ? 'bg-gradient-to-br from-emerald-950/70 via-slate-950 to-teal-950/70 border-emerald-500/70 shadow-emerald-950/25 ring-1 ring-emerald-500/30'
                  : stMacdSignal.signalType === 'BUY_ACCUMULATE' || stMacdSignal.signalType === 'EARLY_REBOUND'
                  ? 'bg-gradient-to-br from-cyan-950/70 via-slate-950 to-teal-950/70 border-cyan-500/60 shadow-cyan-950/25 ring-1 ring-cyan-500/20'
                  : stMacdSignal.signalType === 'STRONG_SELL'
                  ? 'bg-gradient-to-br from-rose-950/70 via-slate-950 to-red-950/70 border-rose-500/70 shadow-rose-950/25 ring-1 ring-rose-500/30'
                  : stMacdSignal.signalType === 'TAKE_PROFIT'
                  ? 'bg-gradient-to-br from-amber-950/70 via-slate-950 to-orange-950/70 border-amber-500/60 shadow-amber-950/25'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2.5 rounded-2xl font-bold flex items-center justify-center ${
                      stMacdSignal.signalType === 'STRONG_BUY'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : stMacdSignal.signalType === 'STRONG_SELL'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    }`}
                  >
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-base flex items-center gap-2">
                      <span>إشارات التوافق المزدوج: السوبر ترند والماكدي (SuperTrend & MACD Confluence)</span>
                    </h4>
                    <p className="text-xs text-slate-400 font-sans">
                      تطابق اتجاه السوبر ترند مع تقاطعات وزخم الماكدي لإصدار إشارات شراء/بيع لحظية ومستويات حماية مؤكدة
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span
                    className={`px-3 py-1.5 rounded-xl font-black text-xs shadow-md ${
                      stMacdSignal.signalType === 'STRONG_BUY'
                        ? 'bg-emerald-500 text-slate-950 animate-pulse'
                        : stMacdSignal.signalType === 'BUY_ACCUMULATE' || stMacdSignal.signalType === 'EARLY_REBOUND'
                        ? 'bg-cyan-400 text-slate-950'
                        : stMacdSignal.signalType === 'STRONG_SELL'
                        ? 'bg-rose-500 text-white animate-pulse'
                        : stMacdSignal.signalType === 'TAKE_PROFIT'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {stMacdSignal.signalActionAr}
                  </span>

                  <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-cyan-300">
                    درجة التوافق: {stMacdSignal.confluenceScorePct}%
                  </span>
                </div>
              </div>

              {/* Strategic Verdict & Detail Strip */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 text-xs space-y-1.5 leading-relaxed font-sans">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-300">{stMacdSignal.signalBadgeAr}</span>
                </div>
                <p className="text-slate-200">
                  {stMacdSignal.strategicVerdictAr}
                </p>
                <p className="text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                  {stMacdSignal.detailedExplanationAr}
                </p>
              </div>

              {/* 4-Box Technical Confluence Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* 1. SuperTrend */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">1. مؤشر السوبر ترند (10, 3)</span>
                  <div className="flex items-center justify-between">
                    <strong
                      className={`text-xs font-black ${
                        stMacdSignal.superTrend.isBullish ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {stMacdSignal.superTrend.trendLabelAr}
                    </strong>
                    <span className="font-mono text-white text-xs font-bold">
                      {stMacdSignal.superTrend.linePrice.toFixed(2)} ج.م
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    {stMacdSignal.superTrend.isPriceAbove
                      ? `السعر يعلو الدعم بـ +${stMacdSignal.superTrend.distancePct}%`
                      : `السعر أدنى المقاومة بـ ${stMacdSignal.superTrend.distancePct}%`}
                  </span>
                </div>

                {/* 2. MACD */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">2. مؤشر الماكدي (12, 26, 9)</span>
                  <div className="flex items-center justify-between">
                    <strong
                      className={`text-xs font-black ${
                        stMacdSignal.macd.isBullish ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {stMacdSignal.macd.crossoverLabelAr}
                    </strong>
                    <span className="font-mono text-xs font-bold text-cyan-300">
                      {stMacdSignal.macd.histogram >= 0
                        ? `+${stMacdSignal.macd.histogram}`
                        : stMacdSignal.macd.histogram}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {stMacdSignal.macd.histogramStatusAr}
                  </span>
                </div>

                {/* 3. Execution Entry & Targets */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1 font-mono">
                  <span className="text-[10px] text-slate-400 block font-sans font-bold">3. نطاق الشراء والأهداف</span>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-sans">دخول مقترح:</span>
                    <strong className="text-cyan-300">
                      {stMacdSignal.executionLevels.suggestedEntry.toFixed(2)} ج.م
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-emerald-400 font-sans">الهدف 1:</span>
                    <span className="text-emerald-300 font-bold">
                      {stMacdSignal.executionLevels.target1Price.toFixed(2)} (+{stMacdSignal.executionLevels.target1GainPct}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-teal-400 font-sans">الهدف 2:</span>
                    <span className="text-teal-300 font-bold">
                      {stMacdSignal.executionLevels.target2Price.toFixed(2)} (+{stMacdSignal.executionLevels.target2GainPct}%)
                    </span>
                  </div>
                </div>

                {/* 4. Stop Loss Anchored to SuperTrend */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-rose-500/30 space-y-1 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-rose-300 block font-sans font-bold">
                      4. وقف الخسارة الصارم
                    </span>
                    <span className="text-[10px] text-amber-300">
                      R:R {stMacdSignal.executionLevels.riskRewardRatio}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-sans">وقف الخسارة:</span>
                    <strong className="text-rose-400 font-black">
                      {stMacdSignal.executionLevels.stopLossPrice.toFixed(2)} ج.م ({stMacdSignal.executionLevels.stopLossLossPct}%)
                    </strong>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-sans">
                    محمي بخط السوبر ترند {stMacdSignal.superTrend.linePrice.toFixed(2)} ج.م
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Official TradingView Technical Chart Opinion & Speedometer Gauge */}
          <TradingViewRatingWidget
            stock={stock}
            timeframeLabel="يومي (1D)"
            variant="FULL_CARD"
            onOpenChart={onOpenChart}
          />

          {/* Dedicated Chart Technical Breakdown Card (User requirement: examine chart & provide opinion) */}
          {chartVerdict && (
            <div className="p-5 rounded-2xl bg-[#090d15] border border-cyan-500/40 space-y-3">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold">
                    📊
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-white">
                      القراءة الفنية المباشرة لشارت السهم والسلوك السعري (Chart Technical Breakdown)
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      تشخيص حركة الشموع اليابانية، القنوات السعرية، ومستويات الدعم والمقاومة
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-slate-400">توقيت بيانات الشارت:</span>
                  <span className="text-cyan-300 font-bold">{cairoChartTime}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    متأخر 15 دقيقة للدقة
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400">حركة الشموع اليابانية (Candlesticks):</span>
                  <p className="text-white font-medium leading-relaxed">
                    {chartVerdict.candlestickPatternAr}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400">مستويات الشارت المرئية:</span>
                  <p className="text-slate-200 font-medium leading-relaxed">
                    دعم الشارت: <span className="font-mono text-emerald-400 font-bold">{chartVerdict.chartSupportLevel} ج.م</span> | 
                    مقاومة الشارت: <span className="font-mono text-rose-400 font-bold">{chartVerdict.chartResistanceLevel} ج.م</span>
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-100 leading-relaxed font-medium">
                <span className="font-bold text-cyan-300 ml-1">💡 رأي المحلل الصريح في حركة الشارت:</span>
                {chartVerdict.chartTechnicalOpinionAr}
              </div>

              {/* Disclaimer and 15-minute notice banner */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1 leading-relaxed">
                <div className="text-amber-300/90 font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{CHART_15_MIN_DELAY_NOTICE_AR}</span>
                </div>
                <p className="text-slate-400 border-t border-slate-800/80 pt-1">
                  {LEGAL_DISCLAIMER_AR}
                </p>
              </div>
            </div>
          )}

          {/* Interactive Position Size & Capital Risk Calculator */}
          <div className="p-5 rounded-2xl bg-[#090d15] border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-cyan-400" />
              <h4 className="font-bold text-white text-xs">
                حاسبة حجم المركز المالي المقترح بناءً على نسبة المخاطرة (Position Sizing):
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">حجم المحفظة الكلي (ج.م):</label>
                <input
                  type="number"
                  value={portfolioCapital}
                  onChange={(e) => setPortfolioCapital(Number(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">نسبة المخاطرة المقبولة (%):</label>
                <select
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                >
                  <option value={1}>1% (محافظ جداً)</option>
                  <option value={2}>2% (متوازن وموصى به)</option>
                  <option value={3}>3% (مغامر معتدل)</option>
                  <option value={5}>5% (مضاربة عالية)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/30 font-mono text-xs">
                <span className="text-[10px] text-slate-400 block font-sans">عدد الأسهم الأقصى للشراء:</span>
                <strong className="text-sm text-cyan-300">
                  {suggestedShares.toLocaleString()} سهم
                </strong>
                <span className="text-[10px] text-slate-500 block">
                  بقيمة: {totalPositionValue.toLocaleString()} ج.م
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <button
            onClick={() => {
              onOpenChart(stock.symbol);
              onClose();
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>فتح شارت TradingView المباشر</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopyReport}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'تم النسخ بنجاح' : 'نسخ التقرير ودراسة السيولة'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>

      {/* Strategy Backtesting Modal (Requested: باك تيست لتريدنج) */}
      {stock && backtestSummary && (
        <StrategyBacktestModal
          isOpen={isBacktestModalOpen}
          onClose={() => setIsBacktestModalOpen(false)}
          stock={stock}
          backtest={backtestSummary}
        />
      )}
    </div>
  );
};
