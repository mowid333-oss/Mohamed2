import React, { useState } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Flame,
} from 'lucide-react';
import { EGXStock } from '../types/stock';
import {
  getTradingViewChartVerdict,
  TradingViewTechnicalBreakdown,
} from '../utils/tradingViewChartVerdict';
import { evaluateSmcAnalysis, SmcAnalysisResult } from '../utils/smcAnalysisEngine';
import { calculateBollingerBands, BollingerBandsResult } from '../utils/bollingerBandsEngine';
import { calculateAccumulationDistribution, AccumulationDistributionResult } from '../utils/accumulationDistributionEngine';

interface TradingViewRatingWidgetProps {
  stock: EGXStock;
  timeframeLabel?: string;
  variant?: 'FULL_CARD' | 'COMPACT_BANNER' | 'MINI_BADGE';
  onOpenChart?: (symbol: string) => void;
}

export const TradingViewRatingWidget: React.FC<TradingViewRatingWidgetProps> = ({
  stock,
  timeframeLabel = 'يومي (1D)',
  variant = 'FULL_CARD',
  onOpenChart,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  const verdict = React.useMemo(() => {
    return getTradingViewChartVerdict(stock, timeframeLabel);
  }, [stock, timeframeLabel]);

  const smcVerdict = React.useMemo(() => {
    return evaluateSmcAnalysis(stock, timeframeLabel);
  }, [stock, timeframeLabel]);

  const bollingerVerdict = React.useMemo(() => {
    return calculateBollingerBands(stock, timeframeLabel);
  }, [stock, timeframeLabel]);

  const adVerdict: AccumulationDistributionResult = React.useMemo(() => {
    return calculateAccumulationDistribution(stock, timeframeLabel);
  }, [stock, timeframeLabel]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const fullText = `${verdict.fullTradingViewText}\n\n${adVerdict.fullReportSummaryText}\n\n${smcVerdict.fullSmcReportText}\n\n${bollingerVerdict.fullBollingerText}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRatingBadgeStyle = (rating: TradingViewTechnicalBreakdown['overallRating']) => {
    switch (rating) {
      case 'STRONG_BUY':
        return 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-emerald-950/40';
      case 'BUY':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-teal-950/30';
      case 'STRONG_SELL':
        return 'bg-rose-500/25 text-rose-300 border-rose-500/50 shadow-rose-950/40';
      case 'SELL':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-950/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  // MINI BADGE (Used in tables, tickers, headers)
  if (variant === 'MINI_BADGE') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border font-['Cairo'] shadow-sm ${getRatingBadgeStyle(
          verdict.overallRating
        )}`}
        title={verdict.explicitChartOpinionAr}
      >
        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
        <span className="font-mono text-[10px] text-slate-300 font-normal">TV:</span>
        <span>{verdict.overallRatingAr}</span>
      </div>
    );
  }

  // COMPACT BANNER (Used inside modals and alert cards)
  if (variant === 'COMPACT_BANNER') {
    return (
      <div className="p-3.5 rounded-2xl bg-[#08101a] border border-cyan-500/35 space-y-2 font-['Cairo'] text-xs">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold font-mono text-xs">
              TV
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">
                رأي شارت TradingView اللحظي المعتمد:
              </span>
              <strong
                className={`text-xs font-black ${
                  verdict.overallRating.includes('BUY')
                    ? 'text-emerald-400'
                    : verdict.overallRating.includes('SELL')
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}
              >
                {verdict.overallRatingAr} (قوة: {verdict.overallScorePct}%)
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="font-mono text-[10px] bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
              <span className="text-emerald-400 font-bold">
                {verdict.movingAverages.buyCount + verdict.oscillators.buyCount} شراء
              </span>{' '}
              •{' '}
              <span className="text-slate-400">{verdict.oscillators.neutralCount} محايد</span>{' '}
              •{' '}
              <span className="text-rose-400 font-bold">
                {verdict.movingAverages.sellCount + verdict.oscillators.sellCount} بيع
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="نسخ رأي الشارت"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <p className="text-slate-200 text-xs leading-relaxed font-medium">
          {verdict.explicitChartOpinionAr}
        </p>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 font-mono">
          <span>شمعة الشارت: <strong className="text-white font-sans">{verdict.candlestick.patternNameAr}</strong></span>
          <span>Pivot: <strong className="text-cyan-300">{verdict.levels.pivot} ج.م</strong></span>
          <span>S1: <strong className="text-emerald-400">{verdict.levels.support1} ج.م</strong></span>
          <span>R1: <strong className="text-rose-400">{verdict.levels.resistance1} ج.م</strong></span>
        </div>

        {/* Smart Money Concepts (SMC) Section */}
        <div className="pt-2 border-t border-amber-500/25 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] flex-wrap gap-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>🏛️ قراءة مدرسة السيولة الذكية (SMC) بدقة:</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                smcVerdict.marketStructure.isBullish
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {smcVerdict.marketStructure.badgeAr}
            </span>
          </div>

          <p className="text-slate-200 text-xs leading-relaxed font-semibold">
            {smcVerdict.smcVerdictAr}
          </p>

          <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono text-center pt-1">
            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block font-sans">منطقة Order Block:</span>
              <strong className="text-cyan-300 font-bold">{smcVerdict.orderBlock.zoneMin} - {smcVerdict.orderBlock.zoneMax} ج.م</strong>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block font-sans">تسعير السهم:</span>
              <strong className={`font-bold ${smcVerdict.pricing.zone === 'DISCOUNT' ? 'text-emerald-400' : smcVerdict.pricing.zone === 'PREMIUM' ? 'text-rose-400' : 'text-amber-400'}`}>
                {smcVerdict.pricing.zoneBadgeAr} ({smcVerdict.pricing.equilibriumPrice} ج.م)
              </strong>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block font-sans">صيد السيولة:</span>
              <strong className="text-amber-300 font-bold">{smcVerdict.liquidity.sweepType}</strong>
            </div>
          </div>
        </div>

        {/* Bollinger Bands Section */}
        <div className="pt-2 border-t border-purple-500/25 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] flex-wrap gap-1">
            <div className="flex items-center gap-1.5 font-bold text-purple-300">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span>📊 قراءة مؤشر البولنجر (Bollinger Bands 20,2):</span>
            </div>
            <div className="flex items-center gap-1.5">
              {bollingerVerdict.isSqueeze && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                  ⚠️ انضغاط Squeeze
                </span>
              )}
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  bollingerVerdict.percentB > 0.8
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : bollingerVerdict.percentB < 0.2
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}
              >
                {bollingerVerdict.positionAr} (%B: {bollingerVerdict.percentB.toFixed(2)})
              </span>
            </div>
          </div>

          <p className="text-slate-200 text-xs leading-relaxed font-semibold">
            {bollingerVerdict.bollingerVerdictAr}
          </p>

          <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono text-center pt-1">
            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block font-sans">الحد العلوي:</span>
              <strong className="text-rose-400 font-bold">{bollingerVerdict.upper} ج.م</strong>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block font-sans">الأوسط (SMA20):</span>
              <strong className="text-cyan-300 font-bold">{bollingerVerdict.middle} ج.م</strong>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block font-sans">الحد السفلي:</span>
              <strong className="text-emerald-400 font-bold">{bollingerVerdict.lower} ج.م</strong>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block font-sans">عرض النطاق:</span>
              <strong className={`font-bold ${bollingerVerdict.isSqueeze ? 'text-amber-400' : 'text-purple-300'}`}>
                {bollingerVerdict.bandwidthPct.toFixed(1)}%
              </strong>
            </div>
          </div>
        </div>

        {/* Precision Accumulation vs Distribution Metric Section (مقياس التجميع والتصريف الدقيق) */}
        <div className="pt-2 border-t border-emerald-500/25 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] flex-wrap gap-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>🔬 مقياس التجميع والتصريف الدقيق (Wyckoff & VSA):</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                adVerdict.isAccumulation
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : adVerdict.isDistribution
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {adVerdict.phaseAr}
            </span>
          </div>

          <p className="text-slate-200 text-xs leading-relaxed font-semibold">
            {adVerdict.detailedVerdictAr}
          </p>

          <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono text-center pt-1">
            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block font-sans">قوة التجميع vs التصريف:</span>
              <strong className={adVerdict.accumulationScore >= 50 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                تجميع {adVerdict.accumulationScore}% | تصريف {adVerdict.distributionScore}%
              </strong>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block font-sans">موضع الإغلاق CLV:</span>
              <strong className="text-cyan-300 font-bold">{adVerdict.clv > 0 ? '+' : ''}{adVerdict.clv} ({adVerdict.clvStatusAr})</strong>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block font-sans">دورة وايكوف:</span>
              <strong className="text-amber-300 font-bold">{adVerdict.wyckoffPhaseCode} ({adVerdict.wyckoffStageAr})</strong>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // FULL CARD (Used in TradingViewWidget screen and 360 report)
  return (
    <div className="p-5 rounded-3xl bg-gradient-to-br from-[#060b14] via-[#09121f] to-[#0a1829] border border-cyan-500/40 shadow-2xl space-y-4 font-['Cairo']">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-cyan-500/20 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-black font-mono text-sm shadow-inner">
            TV
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-white">
                رأي وقراءة شارت TradingView اللحظي المعتمد
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                26 Technical Indicators
              </span>
            </div>
            <p className="text-xs text-slate-400">
              تحليل مباشر يدمج 15 متوسطاً متحركاً و 11 مذبذباً مع تشخيص الشموع والدعوم
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{copied ? 'تم النسخ' : 'نسخ رأي الشارت 📋'}</span>
          </button>

          {onOpenChart && (
            <button
              onClick={() => onOpenChart(stock.symbol)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>فتح الشارت</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Speedometer Gauge Visual Representation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Master Meter Column */}
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between space-y-3">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block mb-1">التقييم الفني العام لشارت السهم:</span>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-xl font-black ${
                  verdict.overallRating.includes('BUY')
                    ? 'text-emerald-400'
                    : verdict.overallRating.includes('SELL')
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}
              >
                {verdict.overallRatingAr}
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                ({verdict.overallScorePct}%)
              </span>
            </div>
          </div>

          {/* 5-Step Visual Speedometer Gauge */}
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded-full bg-slate-900 overflow-hidden flex border border-slate-800 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  verdict.overallRating === 'STRONG_BUY'
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-400 w-full'
                    : verdict.overallRating === 'BUY'
                    ? 'bg-emerald-500 w-[75%]'
                    : verdict.overallRating === 'NEUTRAL'
                    ? 'bg-amber-400 w-[50%]'
                    : verdict.overallRating === 'SELL'
                    ? 'bg-rose-500 w-[30%]'
                    : 'bg-red-700 w-[15%]'
                }`}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-500 px-1">
              <span>بيع قوي</span>
              <span>بيع</span>
              <span>محايد</span>
              <span>شراء</span>
              <span>شراء قوي</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
            <span className="text-emerald-400 font-bold">
              {verdict.movingAverages.buyCount + verdict.oscillators.buyCount} شراء
            </span>
            <span className="text-slate-400">{verdict.oscillators.neutralCount} محايد</span>
            <span className="text-rose-400 font-bold">
              {verdict.movingAverages.sellCount + verdict.oscillators.sellCount} بيع
            </span>
          </div>
        </div>

        {/* Moving Averages vs Oscillators Pillars */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Moving Averages (15 MAs) */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>المتوسطات المتحركة (15 MAs)</span>
              </span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  verdict.movingAverages.ratingAr.includes('شراء')
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : verdict.movingAverages.ratingAr.includes('بيع')
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {verdict.movingAverages.ratingAr}
              </span>
            </div>
            <div className="flex items-baseline justify-between font-mono text-xs">
              <span className="text-emerald-400 font-bold">{verdict.movingAverages.buyCount} شراء</span>
              <span className="text-slate-500">•</span>
              <span className="text-rose-400 font-bold">{verdict.movingAverages.sellCount} بيع</span>
            </div>
            <div className="text-[11px] text-slate-400 line-clamp-2">
              تغطي متوسطات EMA و SMA من 10 إلى 200 يوم مع Ichimoku و VWMA و Hull MA.
            </div>
          </div>

          {/* Oscillators (11 Oscillators) */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                <span>مؤشرات التذبذب (11 Oscillators)</span>
              </span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  verdict.oscillators.ratingAr === 'شراء'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : verdict.oscillators.ratingAr === 'بيع'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {verdict.oscillators.ratingAr}
              </span>
            </div>
            <div className="flex items-baseline justify-between font-mono text-xs">
              <span className="text-emerald-400 font-bold">{verdict.oscillators.buyCount} شراء</span>
              <span className="text-slate-400 font-bold">{verdict.oscillators.neutralCount} محايد</span>
              <span className="text-rose-400 font-bold">{verdict.oscillators.sellCount} بيع</span>
            </div>
            <div className="text-[11px] text-slate-400 line-clamp-2">
              تغطي RSI (14), Stochastic, MACD, CCI, ADX, Williams %R و Awesome Osc.
            </div>
          </div>

          {/* Candlestick & Price Action Full Span */}
          <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-950/90 border border-cyan-500/25 space-y-1">
            <span className="text-[11px] font-bold text-cyan-300 block">
              💡 خلاصة رأي الشارت الفني المباشر:
            </span>
            <p className="text-xs text-white leading-relaxed font-semibold">
              {verdict.explicitChartOpinionAr}
            </p>
          </div>
        </div>
      </div>

      {/* Levels Ribbon: Pivot, S1, S2, R1, R2 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-mono">
        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 block font-sans">الدعم الثاني S2</span>
          <span className="text-rose-400 font-bold">{verdict.levels.support2} ج.م</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-emerald-400 block font-sans">الدعم الأول S1</span>
          <span className="text-emerald-400 font-bold">{verdict.levels.support1} ج.م</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-950 border border-cyan-500/30 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-cyan-300 block font-sans">نقطة الارتكاز Pivot</span>
          <span className="text-white font-bold">{verdict.levels.pivot} ج.م</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-amber-400 block font-sans">المقاومة الأولى R1</span>
          <span className="text-amber-300 font-bold">{verdict.levels.resistance1} ج.م</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 block font-sans">المقاومة الثانية R2</span>
          <span className="text-rose-400 font-bold">{verdict.levels.resistance2} ج.م</span>
        </div>
      </div>

      {/* Smart Money Concepts (SMC) Institutional Analysis Section */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c1424] via-[#09101d] to-[#121c2e] border border-amber-500/35 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold text-base shadow-inner">
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-black text-white">
                  رأي وتحليل مدرسة السيولة الذكية (Smart Money Concepts - SMC) بدقة
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  Institutional Flow
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                رصد حركة صانع السوق والبنوك: كسر الهيكل، مناطق كتل الأوامر (OB)، صيد السيولة (Sweeps)، والفجوات السعرية (FVG)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                smcVerdict.marketStructure.isBullish
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              {smcVerdict.marketStructure.badgeAr}
            </span>
          </div>
        </div>

        {/* 4 SMC Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          {/* Pillar 1: Market Structure */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">1. هيكل السوق (Structure):</span>
            <div className="font-mono text-cyan-300 font-bold">{smcVerdict.marketStructure.type}</div>
            <p className="text-[11px] text-slate-300 leading-tight">
              {smcVerdict.marketStructure.explanationAr}
            </p>
          </div>

          {/* Pillar 2: Liquidity Sweep */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">2. صيد السيولة (Liquidity):</span>
            <div className="font-mono text-amber-300 font-bold">{smcVerdict.liquidity.sweepType}</div>
            <p className="text-[11px] text-slate-300 leading-tight">
              {smcVerdict.liquidity.sweepStatusAr} ({smcVerdict.liquidity.inducementTrapAr})
            </p>
          </div>

          {/* Pillar 3: Order Block */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">3. كتلة الأوامر (Order Block):</span>
            <div className="font-mono text-emerald-400 font-bold">
              {smcVerdict.orderBlock.zoneMin} - {smcVerdict.orderBlock.zoneMax} ج.م
            </div>
            <p className="text-[11px] text-slate-300 leading-tight">
              {smcVerdict.orderBlock.badgeAr} ({smcVerdict.orderBlock.statusAr})
            </p>
          </div>

          {/* Pillar 4: Pricing & FVG */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">4. التسعير & FVG:</span>
            <div
              className={`font-mono font-bold ${
                smcVerdict.pricing.zone === 'DISCOUNT'
                  ? 'text-emerald-400'
                  : smcVerdict.pricing.zone === 'PREMIUM'
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {smcVerdict.pricing.zoneBadgeAr} (عادل: {smcVerdict.pricing.equilibriumPrice} ج.م)
            </div>
            <p className="text-[11px] text-slate-300 leading-tight">
              {smcVerdict.fairValueGap.imbalanceStatusAr} {smcVerdict.fairValueGap.hasFvg ? `(${smcVerdict.fairValueGap.zoneAr})` : ''}
            </p>
          </div>
        </div>

        {/* Institutional Actionable Verdict */}
        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs space-y-1">
          <span className="text-amber-300 font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>خلاصة حُكم مدرسة SMC الصريح لحركة السهم:</span>
          </span>
          <p className="text-slate-100 font-semibold leading-relaxed">
            {smcVerdict.smcVerdictAr}
          </p>
        </div>
      </div>

      {/* Bollinger Bands Analysis Section */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#100d23] via-[#0d1021] to-[#14122e] border border-purple-500/35 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-2.5 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center font-bold text-base shadow-inner">
              📊
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-black text-white">
                  تحليل نطاقات البولنجر (Bollinger Bands 20, 2)
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                  Volatility & Envelopes
                </span>
                {bollingerVerdict.isSqueeze && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                    ⚠️ انضغاط سعري حاد (Squeeze)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                قياس التذبذب ومستويات التشبع السعري والترقب لانفراجة سعرية وشيكة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                bollingerVerdict.percentB > 0.8
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : bollingerVerdict.percentB < 0.2
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              }`}
            >
              {bollingerVerdict.positionAr} (%B: {bollingerVerdict.percentB.toFixed(2)})
            </span>
          </div>
        </div>

        {/* 4 Bollinger Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-center font-mono">
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-sans block">الحد العلوي (Upper Band)</span>
            <span className="text-rose-400 font-bold text-sm">{bollingerVerdict.upper} ج.م</span>
            <span className="text-[10px] text-slate-500 font-sans block">+2 انحراف معياري</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-cyan-500/30">
            <span className="text-[10px] text-cyan-300 font-sans block">الخط الأوسط (SMA 20)</span>
            <span className="text-white font-bold text-sm">{bollingerVerdict.middle} ج.م</span>
            <span className="text-[10px] text-slate-500 font-sans block">المتوسط المتحرك البسيط</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-sans block">الحد السفلي (Lower Band)</span>
            <span className="text-emerald-400 font-bold text-sm">{bollingerVerdict.lower} ج.م</span>
            <span className="text-[10px] text-slate-500 font-sans block">-2 انحراف معياري</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-purple-300 font-sans block">عرض النطاق (Bandwidth)</span>
            <span className={`font-bold text-sm ${bollingerVerdict.isSqueeze ? 'text-amber-400' : 'text-purple-300'}`}>
              {bollingerVerdict.bandwidthPct.toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-500 font-sans block">{bollingerVerdict.bandwidthStatusAr}</span>
          </div>
        </div>

        {/* Actionable Bollinger Verdict */}
        <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/40 text-xs space-y-1">
          <span className="text-purple-300 font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>تشخيص وقراءة مؤشر البولنجر للسهم:</span>
          </span>
          <p className="text-slate-100 font-semibold leading-relaxed">
            {bollingerVerdict.bollingerVerdictAr}
          </p>
        </div>
      </div>

      {/* Precision Accumulation vs Distribution Engine Section (مقياس التجميع والتصريف الدقيق) */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#06141a] via-[#091820] to-[#0a1e27] border-2 border-emerald-500/50 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-bold text-base shadow-inner">
              🔬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-white">
                  مقياس التجميع والتصريف المؤسسي الدقيق (Accumulation vs Distribution Engine)
                </h4>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  Wyckoff & VSA Precision
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                مقياس علمي حاسم يرصد بدقة (وليس مجرد تذبذب) هل السهم يخضع لتجميع ذكي صامت أم تصريف وتفريغ للمحافظ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-black border shadow-md ${
                adVerdict.isAccumulation
                  ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-emerald-950/40'
                  : adVerdict.isDistribution
                  ? 'bg-rose-500/25 text-rose-300 border-rose-500/50 shadow-rose-950/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {adVerdict.phaseAr}
            </span>
          </div>
        </div>

        {/* Tug-of-war Accumulation vs Distribution Visual Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              قوة التجميع المؤسسي: {adVerdict.accumulationScore}%
            </span>
            <span className="text-slate-400 font-sans text-[11px]">ميزان التدفق التراكمي</span>
            <span className="text-rose-400 font-bold flex items-center gap-1">
              قوة التصريف البيعي: {adVerdict.distributionScore}%
              <TrendingDown className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="h-4 w-full bg-slate-950 rounded-xl overflow-hidden flex border border-slate-800 p-0.5">
            <div
              className="bg-gradient-to-r from-emerald-600 to-teal-400 h-full rounded-lg transition-all duration-700 flex items-center justify-start px-2 text-[10px] font-black text-slate-950 font-mono"
              style={{ width: `${adVerdict.accumulationScore}%` }}
            >
              {adVerdict.accumulationScore >= 20 ? `${adVerdict.accumulationScore}%` : ''}
            </div>
            <div
              className="bg-gradient-to-r from-rose-500 to-red-700 h-full rounded-lg transition-all duration-700 flex items-center justify-end px-2 text-[10px] font-black text-white font-mono"
              style={{ width: `${adVerdict.distributionScore}%` }}
            >
              {adVerdict.distributionScore >= 20 ? `${adVerdict.distributionScore}%` : ''}
            </div>
          </div>
        </div>

        {/* 4 Diagnostic Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">1. مرحلة وايكوف (Wyckoff Stage):</span>
            <div className="font-bold text-amber-300 font-mono text-[11px]">{adVerdict.wyckoffPhaseCode}</div>
            <p className="text-[11px] text-slate-200 leading-tight font-medium">{adVerdict.wyckoffStageAr}</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">2. موضع الإغلاق الشمعي (CLV):</span>
            <div className="font-mono text-cyan-300 font-bold text-[11px]">
              {adVerdict.clv > 0 ? `+${adVerdict.clv}` : adVerdict.clv} (-1.0 إلى +1.0)
            </div>
            <p className="text-[11px] text-slate-200 leading-tight font-medium">{adVerdict.clvStatusAr}</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">3. تحليل الحجم والمدى (VSA):</span>
            <div className="font-bold text-emerald-400 text-[11px]">{adVerdict.vsaSignificance}</div>
            <p className="text-[11px] text-slate-200 leading-tight font-medium">{adVerdict.vsaInsightAr}</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">4. صافي السيولة التجميعية المقدرة:</span>
            <div className={`font-mono font-bold text-[11px] ${adVerdict.estimatedAccumulatedValueEgp >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {adVerdict.estimatedAccumulatedValueEgp >= 0 ? '+' : ''}{adVerdict.estimatedAccumulatedValueEgp.toLocaleString()} ج.م
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">صافي التدفق المالي الذكي</p>
          </div>
        </div>

        {/* Detailed Definitive Verdict Callout */}
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs space-y-1">
          <span className="text-emerald-300 font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>حُكم وتشخيص المقياس الدقيق الحاسم:</span>
          </span>
          <p className="text-slate-100 font-semibold leading-relaxed">
            {adVerdict.detailedVerdictAr}
          </p>
          <div className="pt-1 text-[11px] text-cyan-300 font-bold">
            التوصية التنفيذية: {adVerdict.actionAdviceAr}
          </div>
        </div>
      </div>

      {/* Accordion Toggle for Detailed Indicators Table */}
      <div className="border-t border-slate-800/80 pt-2">
        <button
          onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          {isDetailsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span>
            {isDetailsExpanded
              ? 'إخفاء تفصيل الـ 26 مؤشراً'
              : 'عرض تفصيل قائمة الـ 26 مؤشراً ومتوسطاً حسابياً بالكامل'}
          </span>
        </button>

        {isDetailsExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 text-xs">
            {/* MAs Detailed List */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <span className="font-bold text-white block border-b border-slate-800 pb-1">
                المتوسطات المتحركة الـ 15:
              </span>
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {verdict.movingAverages.items.map((ma, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-1 border-b border-slate-900 font-mono text-[11px]"
                  >
                    <span className="text-slate-300">{ma.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white">{ma.value} ج.م</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          ma.action === 'BUY'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {ma.actionAr}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Oscillators Detailed List */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <span className="font-bold text-white block border-b border-slate-800 pb-1">
                مؤشرات التذبذب الـ 11:
              </span>
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {verdict.oscillators.items.map((osc, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-1 border-b border-slate-900 font-mono text-[11px]"
                  >
                    <span className="text-slate-300">{osc.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white">{osc.value}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          osc.action === 'BUY'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : osc.action === 'SELL'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {osc.actionAr}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
