import React, { useState, useMemo, useEffect } from 'react';
import {
  Compass,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Target,
  Search,
  ShieldCheck,
  ShieldAlert,
  BarChart2,
  Sliders,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Bot,
  Layers,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Info,
  DollarSign,
  Maximize2,
  PieChart,
  Copy,
  Check,
  Clock,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { EGXStock, TradingTimeframe, TRADING_TIMEFRAMES } from '../types/stock';
import {
  calculateStockTechnicalIndicators,
  IndicatorDetails,
  MovingAverageItem,
} from '../services/technicalAnalysisService';
import { calculateStockAso } from '../services/asoMarketService';
import { formatEgpMoney, formatVolume } from './StockTable';
import { exportAccumulationPlansToExcel, exportMasterComprehensiveAllStocksExcel } from '../services/excelExportService';
import { TradingViewRatingWidget } from './TradingViewRatingWidget';
import { getTradingViewChartVerdict } from '../utils/tradingViewChartVerdict';
import { calculateAccumulationDistribution } from '../utils/accumulationDistributionEngine';
import { MomentumMatrixCard } from './MomentumMatrixCard';
import { calculateMomentumMatrix, MomentumMatrixResult } from '../utils/momentumMatrixEngine';

function normalizeArabicText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '')
    .trim();
}

interface TechnicalAnalystTabProps {
  stocks: EGXStock[];
  selectedSymbol: string;
  onSelectStock: (symbol: string) => void;
  onSelectStockForChart: (symbol: string) => void;
  onOpenReportModal: (stock: EGXStock) => void;
  onOpenAdvisor: (symbol: string) => void;
  shariahOnly: boolean;
  onToggleShariahOnly: () => void;
  currentTimeframe?: TradingTimeframe;
  onTimeframeChange?: (tf: TradingTimeframe) => void;
}

export const TechnicalAnalystTab: React.FC<TechnicalAnalystTabProps> = ({
  stocks,
  selectedSymbol,
  onSelectStock,
  onSelectStockForChart,
  onOpenReportModal,
  onOpenAdvisor,
  shariahOnly,
  onToggleShariahOnly,
  currentTimeframe,
  onTimeframeChange,
}) => {
  const [timeframe, setTimeframe] = useState<TradingTimeframe>(currentTimeframe || '1D');
  const [copiedReport, setCopiedReport] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState<
    | 'ALL'
    | 'QUADRANT_BULLISH'
    | 'QUADRANT_OVERBOUGHT'
    | 'QUADRANT_BOTTOM'
    | 'QUADRANT_BEARISH'
    | 'ACCUMULATION'
    | 'BUY'
    | 'NEUTRAL'
    | 'SELL'
  >('ALL');
  const [sortBy, setSortBy] = useState<'consensus' | 'rsi' | 'supertrend' | 'volume' | 'ma'>('consensus');

  useEffect(() => {
    if (currentTimeframe) {
      setTimeframe(currentTimeframe);
    }
  }, [currentTimeframe]);
  const [investBudget, setInvestBudget] = useState<number>(50000);

  // Precompute indicator details and Momentum Matrix for each stock
  const analyzedStocks = useMemo(() => {
    return stocks.map((s) => {
      const indicators = calculateStockTechnicalIndicators(s, timeframe);
      const momentumMatrix = calculateMomentumMatrix(s, timeframe);
      return {
        stock: s,
        indicators,
        momentumMatrix,
      };
    });
  }, [stocks, timeframe]);

  const filteredList = useMemo(() => {
    let list = analyzedStocks;

    if (shariahOnly) {
      list = list.filter((item) => item.stock.isShariahCompliant);
    }

    if (filterRating === 'QUADRANT_BULLISH') {
      list = list.filter((item) => item.momentumMatrix.quadrantId === 'BULLISH_EXPANSION');
    } else if (filterRating === 'QUADRANT_OVERBOUGHT') {
      list = list.filter((item) => item.momentumMatrix.quadrantId === 'OVERBOUGHT_RISK');
    } else if (filterRating === 'QUADRANT_BOTTOM') {
      list = list.filter((item) => item.momentumMatrix.quadrantId === 'BOTTOM_ACCUMULATION');
    } else if (filterRating === 'QUADRANT_BEARISH') {
      list = list.filter((item) => item.momentumMatrix.quadrantId === 'BEARISH_MOMENTUM');
    } else if (filterRating === 'ACCUMULATION') {
      list = list.filter(
        (item) =>
          item.indicators.accumulationPlan.accumulationStatus === 'IN_ZONE' ||
          item.indicators.accumulationPlan.accumulationStatus === 'BREAKOUT_CONFIRMED'
      );
    } else if (filterRating === 'BUY') {
      list = list.filter((item) => item.indicators.consensusRatingAr.includes('شراء'));
    } else if (filterRating === 'SELL') {
      list = list.filter(
        (item) =>
          item.indicators.consensusRatingAr.includes('بيع') ||
          item.indicators.consensusRatingAr.includes('تخفيف')
      );
    } else if (filterRating === 'NEUTRAL') {
      list = list.filter((item) => item.indicators.consensusRatingAr.includes('حياد'));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const normQ = normalizeArabicText(q);
      list = list.filter(
        (item) =>
          item.stock.symbol.toLowerCase().includes(q) ||
          normalizeArabicText(item.stock.symbol).includes(normQ) ||
          normalizeArabicText(item.stock.nameAr).includes(normQ) ||
          normalizeArabicText(item.stock.nameEn || '').includes(normQ) ||
          normalizeArabicText(item.stock.sectorAr).includes(normQ)
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'consensus') {
        return b.indicators.consensusScore - a.indicators.consensusScore;
      }
      if (sortBy === 'rsi') {
        return b.indicators.rsi.value - a.indicators.rsi.value;
      }
      if (sortBy === 'supertrend') {
        return (b.indicators.superTrend.isBullish ? 1 : -1) - (a.indicators.superTrend.isBullish ? 1 : -1);
      }
      if (sortBy === 'ma') {
        return b.indicators.movingAverages.bullishCount - a.indicators.movingAverages.bullishCount;
      }
      return (b.stock.valueTraded || 0) - (a.stock.valueTraded || 0);
    });

    return list;
  }, [analyzedStocks, shariahOnly, filterRating, searchQuery, sortBy]);

  // Selected Stock Details Card
  const activeItem = useMemo(() => {
    return (
      analyzedStocks.find((item) => item.stock.symbol === selectedSymbol) ||
      filteredList[0] ||
      analyzedStocks[0]
    );
  }, [analyzedStocks, selectedSymbol, filteredList]);

  // Tranche calculator based on user's investment budget
  const budgetSharesCalculation = useMemo(() => {
    if (!activeItem || investBudget <= 0) return null;
    const plan = activeItem.indicators.accumulationPlan;
    const t1Budget = investBudget * 0.35;
    const t2Budget = investBudget * 0.40;
    const t3Budget = investBudget * 0.25;

    const t1Shares = Math.floor(t1Budget / plan.tranches.tranche1.price);
    const t2Shares = Math.floor(t2Budget / plan.tranches.tranche2.price);
    const t3Shares = Math.floor(t3Budget / plan.tranches.tranche3.price);
    const totalShares = t1Shares + t2Shares + t3Shares;

    const totalActualCost =
      t1Shares * plan.tranches.tranche1.price +
      t2Shares * plan.tranches.tranche2.price +
      t3Shares * plan.tranches.tranche3.price;

    const effectiveAvgCost = totalShares > 0 ? totalActualCost / totalShares : 0;
    const projectedProfitT1 = totalShares * (plan.targets.t1.price - effectiveAvgCost);
    const projectedProfitT2 = totalShares * (plan.targets.t2.price - effectiveAvgCost);

    return {
      t1Budget,
      t2Budget,
      t3Budget,
      t1Shares,
      t2Shares,
      t3Shares,
      totalShares,
      effectiveAvgCost,
      projectedProfitT1,
      projectedProfitT2,
    };
  }, [activeItem, investBudget]);

  const activeStockAso = useMemo(() => {
    if (!activeItem) return null;
    return calculateStockAso(activeItem.stock);
  }, [activeItem]);

  const handleCopyReport = () => {
    if (!activeItem) return;
    const { stock, indicators } = activeItem;
    const plan = indicators.accumulationPlan;
    const tfMeta = TRADING_TIMEFRAMES.find((t) => t.code === timeframe) || TRADING_TIMEFRAMES[4];
    const tvVerdict = getTradingViewChartVerdict(stock, tfMeta.labelAr);
    const adMetric = calculateAccumulationDistribution(stock, tfMeta.labelAr);

    const reportText = `📑 التقرير الفني الشامل - رادار البورصة المصرية EGX
━━━━━━━━━━━━━━━━━━━━
📌 السهم: ${stock.nameAr} (${stock.symbol})
🏢 القطاع: ${stock.sectorAr}
💵 السعر اللحظي: ${stock.price.toFixed(2)} ج.م (${stock.changePct >= 0 ? '+' : ''}${stock.changePct}%)
⏱️ الفريم الزمني المعتمد: ${tfMeta.labelAr} (${tfMeta.badgeAr}) - ${tfMeta.descriptionAr}
🕋 الموقف الشرعي: ${stock.isShariahCompliant ? 'متوافق مع الشريعة الإسلامية ✅' : 'غير متوافق ⚠️'}
━━━━━━━━━━━━━━━━━━━━
🔬 مقياس التجميع والتصريف الدقيق (Wyckoff & VSA Precision):
- حالة السهم الدقيقة: [${adMetric.phaseAr}]
- نسبة التجميع المؤسسي: ${adMetric.accumulationScore}% مقابل نسبة التصريف: ${adMetric.distributionScore}%
- معامل موضع الإغلاق الشمعي CLV: ${adMetric.clv > 0 ? '+' : ''}${adMetric.clv} (${adMetric.clvStatusAr})
- مرحلة دورة وايكوف: ${adMetric.wyckoffStageAr}
- قراءة الحجم والمدى VSA: ${adMetric.vsaInsightAr}
- صافي السيولة التجميعية المقدرة: ${adMetric.estimatedAccumulatedValueEgp >= 0 ? '+' : ''}${formatEgpMoney(adMetric.estimatedAccumulatedValueEgp)}
- تشخيص وحكم المقياس: ${adMetric.detailedVerdictAr}

🎯 رأي وقراءة شارت TradingView اللحظي المعتمد:
- التقييم الفني الموحد لـ TradingView: [${tvVerdict.overallRatingAr}] بنسبة ${tvVerdict.overallScorePct}%
- المتوسطات المتحركة (15 MAs): ${tvVerdict.movingAverages.ratingAr} (${tvVerdict.movingAverages.buyCount} شراء / ${tvVerdict.movingAverages.sellCount} بيع)
- مؤشرات التذبذب (11 Oscillators): ${tvVerdict.oscillators.ratingAr} (${tvVerdict.oscillators.buyCount} شراء / ${tvVerdict.oscillators.neutralCount} محايد / ${tvVerdict.oscillators.sellCount} بيع)
- نموذج الشمعة: ${tvVerdict.candlestick.patternNameAr}
- Pivot: ${tvVerdict.levels.pivot} ج.م | S1: ${tvVerdict.levels.support1} ج.م | R1: ${tvVerdict.levels.resistance1} ج.م
- رأي الشارت الصريح: ${tvVerdict.explicitChartOpinionAr}

🏆 الرأي الفني المجمع:
- الإشارة: [${indicators.consensusRatingAr}] بقوة ${indicators.consensusScore}%
- رأي المؤسسات: ${indicators.generalOpinion.institutionalVerdictAr}
${activeStockAso ? `- مؤشر حالة السوق ASO للسهم: ${activeStockAso.regimeAr} (نقاط: ${activeStockAso.asoScore} | قوة الثيران: ${activeStockAso.bullsPower}%)` : ''}

📊 قراءة المؤشرات الفنية الرئيسية (الفريم: ${tfMeta.labelAr}):
1. SuperTrend: ${indicators.superTrend.trendAr} (وقف الأرباح: ${indicators.superTrend.superTrendValue} ج.م)
2. RSI (14): ${indicators.rsi.value} (${indicators.rsi.statusAr})
3. Stochastic: %K=${indicators.stochastic.k}, %D=${indicators.stochastic.d} (${indicators.stochastic.statusAr})
4. MACD: ${indicators.macd.statusAr}
5. تقييم المتوسطات المتحركة: ${indicators.movingAverages.ratingAr} (${indicators.movingAverages.bullishCount} من 5 متوسطات صاعدة)

🎯 خطة التداول والمستهدفات وإدارة المخاطر (${tfMeta.labelAr}):
- نطاق الشراء والدخول: بين ${plan.primaryZone.min} ج.م و ${plan.primaryZone.max} ج.م
- المستهدف الأول (${tfMeta.badgeAr}): ${plan.targets.t1.price} ج.م (+${plan.targets.t1.gainPct}%)
- المستهدف الثاني: ${plan.targets.t2.price} ج.م (+${plan.targets.t2.gainPct}%)
- المستهدف الثالث: ${plan.targets.t3.price} ج.م (+${plan.targets.t3.gainPct}%)
- وقف الخسارة الصارم: ${plan.stopLoss.price} ج.م (${plan.stopLoss.lossPct}%)
- نسبة العائد للمخاطرة (R:R): ${plan.riskRewardRatio}
- التوصية التنفيذية: ${plan.recommendationAr}

المصدر: منصة رادار البورصة المصرية ومؤشر الشريعة الإسلامية TradingView Live`;

    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2200);
  };

  return (
    <div className="space-y-6 font-['Cairo']">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/70 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 shrink-0">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  المحلل الفني ومناطق التجميع الذكية والمتوسطات
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/40">
                  Moving Averages & Accumulation Engine
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                دراسة فنية متكاملة تحدد أفضل مناطق التجميع بالأرقام الدقيقة، وخطة الدخول بالدفعات، والرأي العام للمؤشرات والمتوسطات المتحركة الخمسة (SMA10, EMA20, SMA50, EMA100, SMA200) لسوق الأسهم المصرية EGX.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => exportMasterComprehensiveAllStocksExcel(stocks)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-500/25 active:scale-95 cursor-pointer border border-emerald-400/40"
              title="تحميل التقرير العام الشامل لجميع الأسهم المصرية (290+ سهم) من جميع النواحي والخطط والأهداف والمخاطر ومقياس التجميع والتصريف (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>تقرير شامل Excel لكل الأسهم 📊</span>
              <Download className="w-3.5 h-3.5 text-emerald-200" />
            </button>

            <button
              onClick={() => exportAccumulationPlansToExcel(filteredList)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="تحميل تقرير مناطق التجميع والمتوسطات بصيغة Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              <span>إكسيل التجميع ({filteredList.length})</span>
              <Download className="w-3.5 h-3.5 text-cyan-400" />
            </button>

            <button
              onClick={onToggleShariahOnly}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                shariahOnly
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>أسهم الشريعة فقط</span>
            </button>
          </div>
        </div>
      </div>

      {/* Featured Stock Deep Dive: Accumulation Plan & Technical Opinion */}
      {activeItem && (
        <div className="space-y-6">
          {/* Stock Header & Actions Bar */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#0b0f17] border border-cyan-500/40 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-slate-900 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-black text-lg shadow-inner">
                  {activeItem.stock.symbol}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-black text-white">{activeItem.stock.nameAr}</h3>
                    <span className="text-xs text-slate-400 font-mono">({activeItem.stock.symbol})</span>
                    <TradingViewRatingWidget stock={activeItem.stock} variant="MINI_BADGE" />
                    {activeItem.stock.isShariahCompliant ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        شريعة ✅
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        تقليدي ⚠️
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 flex-wrap">
                    <span className="text-slate-400">القطاع: <strong className="text-white">{activeItem.stock.sectorAr}</strong></span>
                    <span>•</span>
                    <span>السعر اللحظي: <strong className="font-mono text-cyan-300 text-sm">{activeItem.stock.price.toFixed(2)} ج.م</strong></span>
                    <span
                      className={`font-mono font-bold ${
                        activeItem.stock.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      ({activeItem.stock.changePct >= 0 ? '+' : ''}{activeItem.stock.changePct}%)
                    </span>
                    <span>•</span>
                    <span className="text-slate-400">السيولة اليومية: <strong className="text-slate-200">{formatEgpMoney(activeItem.stock.valueTraded)}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => onOpenAdvisor(activeItem.stock.symbol)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-600/25 transition-all"
                >
                  <Bot className="w-4 h-4" />
                  <span>استشارة المستشار الفني</span>
                </button>

                <button
                  onClick={() => onOpenReportModal(activeItem.stock)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>تقرير 360°</span>
                </button>

                <button
                  onClick={() => onSelectStockForChart(activeItem.stock.symbol)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span>الشارت</span>
                </button>
              </div>
            </div>

            {/* Exact TradingView Technical Chart Opinion & Speedometer Gauge */}
            <TradingViewRatingWidget
              stock={activeItem.stock}
              timeframeLabel={TRADING_TIMEFRAMES.find((t) => t.code === timeframe)?.labelAr || 'يومي (1D)'}
              variant="FULL_CARD"
              onOpenChart={onSelectStockForChart}
            />

            {/* SECTION 1: الرأي العام للمؤشرات الفنية (General Technical Opinion) */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-indigo-500/30 space-y-4">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-indigo-500/40 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] text-slate-400">إجماع فني</span>
                    <span className="text-lg font-black font-mono text-cyan-300">
                      {activeItem.indicators.generalOpinion.consensusScore}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block">
                      الرأي العام المجمع للمؤشرات الفنية:
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`text-lg font-black ${
                          activeItem.indicators.generalOpinion.consensusRatingAr.includes('شراء')
                            ? 'text-emerald-400'
                            : activeItem.indicators.generalOpinion.consensusRatingAr.includes('بيع')
                            ? 'text-rose-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {activeItem.indicators.generalOpinion.consensusRatingAr}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {activeItem.indicators.generalOpinion.buySignalsCount} شراء • {activeItem.indicators.generalOpinion.neutralSignalsCount} محايد • {activeItem.indicators.generalOpinion.sellSignalsCount} بيع
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full lg:w-auto">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-right">
                    <span className="text-[10px] text-slate-400 block">مؤشرات التذبذب (Oscillators)</span>
                    <span className="text-xs font-bold text-emerald-400">
                      {activeItem.indicators.generalOpinion.oscillatorsRatingAr}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-right">
                    <span className="text-[10px] text-slate-400 block">المتوسطات المتحركة (MAs)</span>
                    <span className="text-xs font-bold text-cyan-400">
                      {activeItem.indicators.generalOpinion.movingAveragesRatingAr} ({activeItem.indicators.movingAverages.bullishCount}/5)
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-right col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-400 block">السوبر ترند (SuperTrend)</span>
                    <span className={`text-xs font-bold ${activeItem.indicators.superTrend.isBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {activeItem.indicators.superTrend.trend === 'BULLISH' ? 'صاعد أخضر 🟢' : 'هابط أحمر 🔴'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stock ASO Indicator Bar */}
              {activeStockAso && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-black font-mono text-sm shrink-0">
                      ASO
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">مؤشر حالة السهم (Absolute Strength Oscillator):</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {activeStockAso.regimeAr}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        {activeStockAso.actionableGuidanceAr}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs shrink-0 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                    <span className="text-emerald-400 font-bold">قوة الشراء: {activeStockAso.bullsPower}%</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-rose-400 font-bold">قوة البيع: {activeStockAso.bearsPower}%</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-cyan-400 font-bold">الفارق: {activeStockAso.asoSpread >= 0 ? `+${activeStockAso.asoSpread}` : activeStockAso.asoSpread}%</span>
                  </div>
                </div>
              )}

              {/* Institutional Verdict & Actionable Advice */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/90 text-xs space-y-1">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5 text-[11px]">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    تشخيص الاتجاه المؤسسي (Institutional Flow):
                  </span>
                  <p className="text-slate-400 leading-relaxed">
                    {activeItem.indicators.generalOpinion.institutionalVerdictAr}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs space-y-1">
                  <span className="font-bold text-cyan-300 flex items-center gap-1.5 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    التوصية التنفيذية المباشرة للمستثمر:
                  </span>
                  <p className="text-cyan-100/90 leading-relaxed font-medium">
                    {activeItem.indicators.generalOpinion.actionableAdviceAr}
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 2: أفضل مناطق التجميع والخطة الصحيحة للتجميع بالأرقام */}
            <div className="p-5 rounded-2xl bg-slate-950/90 border border-emerald-500/40 space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                      أفضل مناطق التجميع والخطة الصحيحة للتجميع بالأرقام
                    </h4>
                    <span className="text-[11px] text-emerald-400 font-bold">
                      {activeItem.indicators.accumulationPlan.statusAr}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                    نسبة العائد للمخاطرة: <strong className="text-emerald-400 font-mono">{activeItem.indicators.accumulationPlan.riskRewardRatio}</strong>
                  </span>
                </div>
              </div>

              {/* Accumulation Zones Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* 1. Primary Zone */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-950/30 to-slate-950 border border-emerald-500/40 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-300 block">
                    🎯 نطاق التجميع الأساسي (Primary Zone)
                  </span>
                  <div className="flex items-baseline gap-1 text-white font-mono">
                    <span className="text-lg font-black text-emerald-400">
                      {activeItem.indicators.accumulationPlan.primaryZone.min}
                    </span>
                    <span className="text-xs text-slate-400">إلى</span>
                    <span className="text-lg font-black text-emerald-400">
                      {activeItem.indicators.accumulationPlan.primaryZone.max}
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans"> ج.م</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {activeItem.indicators.accumulationPlan.primaryZone.descriptionAr}
                  </p>
                </div>

                {/* 2. Secondary Discount Zone */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-cyan-300 block">
                    🛡️ نطاق الخصم والتجميع الاحتياطي
                  </span>
                  <div className="flex items-baseline gap-1 text-white font-mono">
                    <span className="text-lg font-black text-cyan-400">
                      {activeItem.indicators.accumulationPlan.secondaryDiscountZone.min}
                    </span>
                    <span className="text-xs text-slate-400">إلى</span>
                    <span className="text-lg font-black text-cyan-400">
                      {activeItem.indicators.accumulationPlan.secondaryDiscountZone.max}
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans"> ج.م</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {activeItem.indicators.accumulationPlan.secondaryDiscountZone.descriptionAr}
                  </p>
                </div>

                {/* 3. Blended Cost & Tranches */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-amber-300 block">
                    ⚖️ متوسط التكلفة المستهدف بالأرقام
                  </span>
                  <div className="text-2xl font-black font-mono text-white">
                    {activeItem.indicators.accumulationPlan.blendedTargetCost}
                    <span className="text-xs text-slate-400 font-sans font-normal mr-1"> ج.م</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    توزيع السيولة الموصى به: 35% دفعة أولى • 40% دفعة ثانية • 25% دفعة اختراق.
                  </p>
                </div>

                {/* 4. Strict Stop Loss */}
                <div className="p-4 rounded-2xl bg-rose-950/25 border border-rose-500/40 space-y-2">
                  <span className="text-[11px] font-bold text-rose-300 block">
                    ⛔ وقف الخسارة الحاسم للتجميع
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black font-mono text-rose-400">
                      {activeItem.indicators.accumulationPlan.stopLoss.price}
                    </span>
                    <span className="text-xs font-mono font-bold text-rose-300">
                      (-{activeItem.indicators.accumulationPlan.stopLoss.lossPct}%)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {activeItem.indicators.accumulationPlan.stopLoss.reasonAr}
                  </p>
                </div>
              </div>

              {/* Tranches Step-by-Step Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                <span className="text-xs font-black text-slate-200 block">
                  خطة تنفيذ الدفعات الثلاثية الصحيحة بالأرقام والأسعار:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400">الدفعة 1 (35% من السيولة)</span>
                      <span className="font-mono font-bold text-white">
                        {activeItem.indicators.accumulationPlan.tranches.tranche1.price} ج.م
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      {activeItem.indicators.accumulationPlan.tranches.tranche1.descriptionAr}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-teal-400">الدفعة 2 (40% من السيولة)</span>
                      <span className="font-mono font-bold text-white">
                        {activeItem.indicators.accumulationPlan.tranches.tranche2.price} ج.م
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      {activeItem.indicators.accumulationPlan.tranches.tranche2.descriptionAr}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-400">الدفعة 3 (25% من السيولة)</span>
                      <span className="font-mono font-bold text-white">
                        {activeItem.indicators.accumulationPlan.tranches.tranche3.price} ج.م
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      {activeItem.indicators.accumulationPlan.tranches.tranche3.descriptionAr}
                    </p>
                  </div>
                </div>

                {/* Targets & Volume Confirmation Bar */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pt-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-400 font-bold">أهداف التجميع:</span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono">
                      الهدف 1: <strong className="text-emerald-400">{activeItem.indicators.accumulationPlan.targets.t1.price} ج.م</strong> (+{activeItem.indicators.accumulationPlan.targets.t1.gainPct}%)
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono">
                      الهدف 2: <strong className="text-cyan-400">{activeItem.indicators.accumulationPlan.targets.t2.price} ج.م</strong> (+{activeItem.indicators.accumulationPlan.targets.t2.gainPct}%)
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono">
                      الهدف 3: <strong className="text-indigo-400">{activeItem.indicators.accumulationPlan.targets.t3.price} ج.م</strong> (+{activeItem.indicators.accumulationPlan.targets.t3.gainPct}%)
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    فوليوم تأكيد الاختراق المطلوب: <strong className="font-mono text-white">{formatVolume(activeItem.indicators.accumulationPlan.requiredVolumeConfirmation)} سهم</strong> ({formatEgpMoney(activeItem.indicators.accumulationPlan.requiredLiquidityConfirmationEgp)})
                  </div>
                </div>
              </div>

              {/* Interactive Capital Tranche Calculator */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-indigo-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">حاسبة كميات التجميع بالجنيه لميزانيتك:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">الميزانية المقترحة:</span>
                    <input
                      type="number"
                      step={5000}
                      value={investBudget}
                      onChange={(e) => setInvestBudget(Number(e.target.value) || 0)}
                      className="w-32 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-xs text-slate-400">ج.م</span>
                  </div>
                </div>

                {budgetSharesCalculation && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">أسهم الدفعة الأولى (35%)</span>
                      <span className="text-sm font-black font-mono text-emerald-400">
                        {budgetSharesCalculation.t1Shares.toLocaleString()} سهم
                      </span>
                      <span className="text-[10px] text-slate-500 block font-mono">
                        ({budgetSharesCalculation.t1Budget.toLocaleString()} ج.م)
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">أسهم الدفعة الثانية (40%)</span>
                      <span className="text-sm font-black font-mono text-teal-400">
                        {budgetSharesCalculation.t2Shares.toLocaleString()} سهم
                      </span>
                      <span className="text-[10px] text-slate-500 block font-mono">
                        ({budgetSharesCalculation.t2Budget.toLocaleString()} ج.م)
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">أسهم الدفعة الثالثة (25%)</span>
                      <span className="text-sm font-black font-mono text-cyan-400">
                        {budgetSharesCalculation.t3Shares.toLocaleString()} سهم
                      </span>
                      <span className="text-[10px] text-slate-500 block font-mono">
                        ({budgetSharesCalculation.t3Budget.toLocaleString()} ج.م)
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30">
                      <span className="text-[10px] text-slate-400 block">إجمالي الكمية ومتوسط التكلفة</span>
                      <span className="text-sm font-black font-mono text-white">
                        {budgetSharesCalculation.totalShares.toLocaleString()} سهم
                      </span>
                      <span className="text-[10px] text-indigo-300 block font-mono">
                        متوسط: {budgetSharesCalculation.effectiveAvgCost.toFixed(2)} ج.م
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 3: مصفوفة المتوسطات المتحركة بأفضل الأرقام (Moving Averages Matrix) */}
            <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-white">
                      مصفوفة المتوسطات المتحركة بأفضل الأرقام (SMA 10, EMA 20, SMA 50, EMA 100, SMA 200)
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {activeItem.indicators.movingAverages.goldenCrossStatusAr}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 font-bold text-cyan-300">
                    حالة المتوسطات: {activeItem.indicators.movingAverages.bullishCount} إيجابي من أصل 5
                  </span>
                </div>
              </div>

              {/* Moving Averages Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-bold">
                      <th className="py-2.5 px-3">المتوسط المتحرك</th>
                      <th className="py-2.5 px-3">قيمة المتوسط (ج.م)</th>
                      <th className="py-2.5 px-3">تموضع السعر</th>
                      <th className="py-2.5 px-3">المسافة %</th>
                      <th className="py-2.5 px-3">الإشارة الفنية</th>
                      <th className="py-2.5 px-3 hidden md:table-cell">الأهمية الاستراتيجية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {activeItem.indicators.movingAverages.maList.map((ma) => (
                      <tr key={ma.nameAr} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-3 px-3 font-bold text-white">{ma.nameAr}</td>
                        <td className="py-3 px-3 font-mono font-bold text-cyan-300">{ma.value} ج.م</td>
                        <td className="py-3 px-3 font-mono">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              ma.priceVsMa === 'ABOVE'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {ma.priceVsMa === 'ABOVE' ? 'أعلى المتوسط (صاعد) 🟢' : 'أدنى المتوسط (تصحيحي) 🔴'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold">
                          <span className={ma.distancePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {ma.distancePct >= 0 ? '+' : ''}{ma.distancePct}%
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`font-bold ${
                              ma.isBullish ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {ma.isBullish ? 'إشارة شراء / دعم' : 'إشارة بيع / مقاومة'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-[11px] hidden md:table-cell">
                          {ma.significanceAr}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 3.5: مصفوفة تقييم الزخم (Momentum Matrix: SMA 50/200 & RSI) */}
            <MomentumMatrixCard
              stock={activeItem.stock}
              timeframe={timeframe}
              onOpenChart={onSelectStockForChart}
              onOpenAdvisor={onOpenAdvisor}
            />

            {/* SECTION 4: المؤشرات الأربعة الرئيسية (SuperTrend, RSI, Stochastic, MACD) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* 1. SuperTrend */}
              <div
                className={`p-4 rounded-2xl border ${
                  activeItem.indicators.superTrend.isBullish
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-100'
                    : 'bg-rose-950/20 border-rose-500/40 text-rose-100'
                } space-y-2`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    مؤشر السوبر ترند (SuperTrend)
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                      activeItem.indicators.superTrend.isBullish
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {activeItem.indicators.superTrend.trend === 'BULLISH' ? 'صاعد أخضر 🟢' : 'هابط أحمر 🔴'}
                  </span>
                </div>
                <div className="pt-1">
                  <span className="text-[11px] text-slate-400 block">خط الدعم / المقاومة:</span>
                  <span className="text-lg font-black font-mono text-white">
                    {activeItem.indicators.superTrend.superTrendValue} ج.م
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                  {activeItem.indicators.superTrend.trendAr}
                </p>
              </div>

              {/* 2. RSI Indicator */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    مؤشر القوة النسبية (RSI 14)
                  </span>
                  <span className="text-xs font-black font-mono text-cyan-300">
                    {activeItem.indicators.rsi.value}
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full ${
                      activeItem.indicators.rsi.value >= 70
                        ? 'bg-rose-500'
                        : activeItem.indicators.rsi.value <= 30
                        ? 'bg-teal-400'
                        : 'bg-cyan-500'
                    }`}
                    style={{ width: `${Math.min(100, activeItem.indicators.rsi.value)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                  {activeItem.indicators.rsi.statusAr}
                </p>
              </div>

              {/* 3. Stochastic Oscillator */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    مؤشر الاستوكاستك (Stochastic)
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-300">
                    %K: {activeItem.indicators.stochastic.k} | %D: {activeItem.indicators.stochastic.d}
                  </span>
                </div>
                <div className="pt-1">
                  <span className="text-[11px] text-slate-400 block">حالة التقاطع:</span>
                  <span className="text-xs font-bold text-white">
                    {activeItem.indicators.stochastic.isGoldenCross
                      ? 'تقاطع ذهبي إيجابي 🌟'
                      : activeItem.indicators.stochastic.isDeadCross
                      ? 'تقاطع تصريفي ⚠️'
                      : 'حركة زخم متوازنة'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                  {activeItem.indicators.stochastic.statusAr}
                </p>
              </div>

              {/* 4. MACD Indicator */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-teal-400" />
                    مؤشر الماكدي (MACD)
                  </span>
                  <span
                    className={`text-xs font-mono font-bold ${
                      activeItem.indicators.macd.isBullish ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {activeItem.indicators.macd.histogram >= 0 ? '+' : ''}
                    {activeItem.indicators.macd.histogram}
                  </span>
                </div>
                <div className="pt-1">
                  <span className="text-[11px] text-slate-400 block">خط الماكدي وخط الإشارة:</span>
                  <span className="text-xs font-mono font-bold text-white">
                    {activeItem.indicators.macd.macdLine} / {activeItem.indicators.macd.signalLine}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                  {activeItem.indicators.macd.statusAr}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar for all Stocks */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <button
            onClick={() => setFilterRating('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterRating === 'ALL'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            جميع الأسهم ({analyzedStocks.length})
          </button>
          <button
            onClick={() => setFilterRating('QUADRANT_BULLISH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterRating === 'QUADRANT_BULLISH'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            زخم صاعد مؤسسي (الربع 1) 🟢
          </button>
          <button
            onClick={() => setFilterRating('QUADRANT_BOTTOM')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterRating === 'QUADRANT_BOTTOM'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-cyan-400'
            }`}
          >
            ارتداد تجميعي (الربع 3) 💎
          </button>
          <button
            onClick={() => setFilterRating('QUADRANT_OVERBOUGHT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterRating === 'QUADRANT_OVERBOUGHT'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-amber-400'
            }`}
          >
            تشبع شرائي ممتد (الربع 2) ⚠️
          </button>
          <button
            onClick={() => setFilterRating('QUADRANT_BEARISH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterRating === 'QUADRANT_BEARISH'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            زخم هابط وتصحيحي (الربع 4) 🔴
          </button>
          <button
            onClick={() => setFilterRating('ACCUMULATION')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterRating === 'ACCUMULATION'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            مناطق التجميع 🎯
          </button>
          <button
            onClick={() => setFilterRating('BUY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterRating === 'BUY'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            إشارات شراء 🟢
          </button>
          <button
            onClick={() => setFilterRating('NEUTRAL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterRating === 'NEUTRAL'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-amber-400'
            }`}
          >
            حياد ومراقبة 🟡
          </button>
          <button
            onClick={() => setFilterRating('SELL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterRating === 'SELL'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            جني أرباح / بيع 🔴
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالرمز أو اسم الشركة..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Multi-Stock Indicator Matrix Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-bold">
                <th className="p-3.5">السهم</th>
                <th className="p-3.5">السعر والتغير</th>
                <th className="p-3.5">مصفوفة الزخم (SMA/RSI)</th>
                <th className="p-3.5">نطاق التجميع المقترح</th>
                <th className="p-3.5">الرأي العام والإجماع</th>
                <th className="p-3.5">المتوسطات (MAs)</th>
                <th className="p-3.5">SuperTrend</th>
                <th className="p-3.5">RSI</th>
                <th className="p-3.5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredList.map(({ stock, indicators, momentumMatrix }) => {
                const isSelected = stock.symbol === selectedSymbol;
                return (
                  <tr
                    key={stock.symbol}
                    onClick={() => onSelectStock(stock.symbol)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-cyan-950/30 border-r-4 border-r-cyan-400'
                        : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <td className="p-3.5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-white">{stock.symbol}</span>
                          {stock.isShariahCompliant && (
                            <span className="text-[9px] px-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                              شريعة
                            </span>
                          )}
                        </div>
                        <span className="text-slate-300 text-xs truncate max-w-[170px]">{stock.nameAr}</span>
                      </div>
                    </td>

                    <td className="p-3.5 font-mono">
                      <div className="font-bold text-white">{stock.price.toFixed(2)} ج.م</div>
                      <span
                        className={`text-[11px] ${
                          stock.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {stock.changePct >= 0 ? '+' : ''}{stock.changePct}%
                      </span>
                    </td>

                    {/* Momentum Matrix Column */}
                    <td className="p-3.5">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border inline-block ${
                            momentumMatrix.quadrantColor === 'emerald'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                              : momentumMatrix.quadrantColor === 'amber'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                              : momentumMatrix.quadrantColor === 'cyan'
                              ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/35'
                          }`}
                        >
                          {momentumMatrix.quadrantBadge}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          زخم: <strong className="text-white">{momentumMatrix.overallMomentumScore}%</strong> • {momentumMatrix.crossStatus === 'GOLDEN_CROSS' ? 'ذهبي 🌟' : momentumMatrix.crossStatus === 'DEATH_CROSS' ? 'موت ⚠️' : 'متماسك ⚖️'}
                        </span>
                      </div>
                    </td>

                    {/* Accumulation Zone Column */}
                    <td className="p-3.5 font-mono">
                      <div className="text-emerald-400 font-bold text-xs">
                        {indicators.accumulationPlan.primaryZone.min} - {indicators.accumulationPlan.primaryZone.max} ج.م
                      </div>
                      <span className="text-[10px] text-slate-400 font-sans block truncate max-w-[150px]">
                        متوسط: {indicators.accumulationPlan.blendedTargetCost} ج.م
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-xs font-bold inline-block ${
                          indicators.generalOpinion.consensusRatingAr.includes('شراء')
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : indicators.generalOpinion.consensusRatingAr.includes('بيع')
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {indicators.generalOpinion.consensusRatingAr} ({indicators.generalOpinion.consensusScore}%)
                      </span>
                    </td>

                    <td className="p-3.5 font-mono">
                      <span className="text-cyan-300 font-bold">
                        {indicators.movingAverages.bullishCount}/5 إيجابي
                      </span>
                    </td>

                    <td className="p-3.5 font-mono">
                      <span
                        className={`text-xs font-bold ${
                          indicators.superTrend.isBullish ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {indicators.superTrend.trend === 'BULLISH' ? 'صاعد 🟢' : 'هابط 🔴'}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono">
                      <span className="font-bold text-slate-200">{indicators.rsi.value}</span>
                    </td>

                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenAdvisor(stock.symbol);
                          }}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-cyan-900/40 text-cyan-400 transition-colors"
                          title="استشارة المستشار الفني"
                        >
                          <Bot className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectStockForChart(stock.symbol);
                          }}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-blue-900/40 text-blue-400 transition-colors"
                          title="عرض الشارت"
                        >
                          <Activity className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenReportModal(stock);
                          }}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-teal-900/40 text-teal-400 transition-colors"
                          title="تقرير شامل 360°"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
