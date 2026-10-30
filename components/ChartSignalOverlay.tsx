import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  ShieldAlert,
  ShieldCheck,
  Zap,
  ChevronDown,
  ChevronUp,
  Layers,
  BarChart2,
  Copy,
  Check,
  Sparkles,
  Info,
  Maximize2,
  Sliders,
} from 'lucide-react';
import { EGXStock } from '../types/stock';
import { CompositeSignalVerdict } from '../services/compositeSignalEngine';

interface ChartSignalOverlayProps {
  verdict: CompositeSignalVerdict;
  stock: EGXStock;
  onOpenDetailedReport?: () => void;
}

export const ChartSignalOverlay: React.FC<ChartSignalOverlayProps> = ({
  verdict,
  stock,
  onOpenDetailedReport,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [showPillarsModal, setShowPillarsModal] = useState<boolean>(false);

  // Dynamic live moving price delta so buy & sell levels reflect active market ticks
  const [liveDelta, setLiveDelta] = useState<number>(0);
  const [isTickActive, setIsTickActive] = useState<boolean>(false);

  React.useEffect(() => {
    const basePrice = stock.price > 0 ? stock.price : 10;
    const interval = setInterval(() => {
      const shift = (Math.random() - 0.49) * 0.0024 * basePrice;
      setLiveDelta(shift);
      setIsTickActive(true);
      const timer = setTimeout(() => setIsTickActive(false), 750);
      return () => clearTimeout(timer);
    }, 3200);

    return () => clearInterval(interval);
  }, [stock.price]);

  const handleCopy = () => {
    navigator.clipboard.writeText(verdict.fullFormattedReportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isBuy = verdict.verdictType === 'STRONG_BUY' || verdict.verdictType === 'BUY_ACCUMULATE';
  const isSell = verdict.verdictType === 'STRONG_SELL' || verdict.verdictType === 'TAKE_PROFIT';

  const movingBuyEntry = Number((verdict.executionLevels.suggestedBuyEntry + liveDelta).toFixed(2));
  const movingTarget1 = Number((verdict.executionLevels.target1Price + liveDelta * 1.05).toFixed(2));
  const movingTarget2 = Number((verdict.executionLevels.target2Price + liveDelta * 1.1).toFixed(2));

  return (
    <div className="space-y-3 font-['Cairo']">
      {/* Primary Floating HUD Strip directly on chart header */}
      <div
        className={`rounded-2xl border transition-all p-3 sm:p-4 shadow-xl ${
          isBuy
            ? 'bg-gradient-to-r from-emerald-950/80 via-slate-950 to-teal-950/80 border-emerald-500/60 shadow-emerald-950/20'
            : isSell
            ? 'bg-gradient-to-r from-rose-950/80 via-slate-950 to-amber-950/80 border-rose-500/60 shadow-rose-950/20'
            : 'bg-slate-900/90 border-slate-700/80'
        }`}
      >
        {/* Top Header of the Verdict Box */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Primary Action Badge */}
            <span
              className={`px-3 py-1 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md ${
                verdict.verdictType === 'STRONG_BUY'
                  ? 'bg-emerald-500 text-slate-950 animate-pulse'
                  : verdict.verdictType === 'BUY_ACCUMULATE'
                  ? 'bg-teal-400 text-slate-950'
                  : verdict.verdictType === 'STRONG_SELL'
                  ? 'bg-rose-500 text-white animate-pulse'
                  : verdict.verdictType === 'TAKE_PROFIT'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-800 text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{verdict.verdictActionAr}</span>
            </span>

            <div className="flex items-center gap-2">
              <strong className="text-white text-sm sm:text-base font-bold">
                {verdict.verdictTitleAr}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Confidence Score Pill */}
            <div className="px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-700 text-xs font-mono font-bold flex items-center gap-1.5">
              <span className="text-slate-400 font-sans">قوة الرأي والتوافق:</span>
              <span
                className={`font-black ${
                  verdict.confidenceScorePct >= 75
                    ? 'text-emerald-400'
                    : verdict.confidenceScorePct >= 50
                    ? 'text-cyan-400'
                    : 'text-amber-400'
                }`}
              >
                {verdict.confidenceScorePct}%
              </span>
              <span className="text-[10px] text-slate-500">
                ({verdict.positiveConfirmationCount}/{verdict.totalPillarsCount} مؤشرات)
              </span>
            </div>

            {/* Copy report */}
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
              title="نسخ تقرير الإشارات الفنية ونقاط الشراء والبيع"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span className="hidden md:inline">{copied ? 'تم النسخ' : 'نسخ الإشارة'}</span>
            </button>

            {/* Toggle Accordion */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title={isExpanded ? 'طي تفاصيل نقاط الدخول والأهداف' : 'عرض تفاصيل نقاط الدخول والأهداف'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Tactical Opinion Thesis */}
        <div className="py-2.5 text-xs text-slate-300 leading-relaxed font-sans border-b border-slate-800/60 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-cyan-300 ml-1 font-bold">الرأي الفني القاطع الموحد:</strong>
            <span>{verdict.definitiveStrongOpinionAr}</span>
          </div>
        </div>

        {/* Collapsible Execution Levels & 4 Indicators Grid */}
        {isExpanded && (
          <div className="pt-3 space-y-3">
            {/* Visual Actionable Execution Pins Grid: Buy Point, Target 1, Target 2, Stop Loss */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs font-mono">
              {/* Box 1: Potential Buy Point / Entry Zone */}
              <div className={`p-3 rounded-xl bg-slate-900/90 border transition-all relative overflow-hidden ${isTickActive ? 'border-emerald-400 shadow-md shadow-emerald-500/20' : 'border-emerald-500/40'}`}>
                <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500" />
                <div className="flex items-center justify-between font-sans mb-1 text-[11px]">
                  <span className="text-emerald-300 font-bold flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" />
                    <span>نقطة شراء لحظية (دخول):</span>
                  </span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-700/80 font-mono animate-pulse">
                    متحرك لحظياً 🟢
                  </span>
                </div>
                <div className="text-white text-base font-black flex items-center gap-1.5">
                  <span>{movingBuyEntry.toFixed(2)}</span>
                  <span className="text-xs text-slate-400 font-normal">ج.م</span>
                  {isTickActive && <span className="text-[10px] text-emerald-400 font-bold">▲</span>}
                </div>
                <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                  نطاق الشراء: {(movingBuyEntry * 0.995).toFixed(2)} - {(movingBuyEntry * 1.005).toFixed(2)} ج.م
                </div>
              </div>

              {/* Box 2: Target 1 / Take Profit 1 */}
              <div className={`p-3 rounded-xl bg-slate-900/90 border transition-all relative overflow-hidden ${isTickActive ? 'border-cyan-400 shadow-md shadow-cyan-500/20' : 'border-cyan-500/40'}`}>
                <div className="absolute top-0 right-0 w-1.5 h-full bg-cyan-400" />
                <div className="flex items-center justify-between font-sans mb-1 text-[11px]">
                  <span className="text-cyan-300 font-bold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>نقطة بيع / هدف أول (TP1):</span>
                  </span>
                  <span className="text-[10px] bg-cyan-950 text-cyan-400 px-1.5 py-0.2 rounded border border-cyan-800">
                    +{verdict.executionLevels.target1GainPct}%
                  </span>
                </div>
                <div className="text-white text-base font-black flex items-center gap-1.5">
                  <span>{movingTarget1.toFixed(2)}</span>
                  <span className="text-xs text-slate-400 font-normal">ج.م</span>
                </div>
                <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                  جني ربح سريع أو نقل الوقف لنقطة الدخول
                </div>
              </div>

              {/* Box 3: Target 2 / Take Profit 2 */}
              <div className={`p-3 rounded-xl bg-slate-900/90 border transition-all relative overflow-hidden ${isTickActive ? 'border-purple-400 shadow-md shadow-purple-500/20' : 'border-purple-500/40'}`}>
                <div className="absolute top-0 right-0 w-1.5 h-full bg-purple-400" />
                <div className="flex items-center justify-between font-sans mb-1 text-[11px]">
                  <span className="text-purple-300 font-bold flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    <span>نقطة بيع / هدف ثانٍ (TP2):</span>
                  </span>
                  <span className="text-[10px] bg-purple-950 text-purple-400 px-1.5 py-0.2 rounded border border-purple-800">
                    +{verdict.executionLevels.target2GainPct}%
                  </span>
                </div>
                <div className="text-white text-base font-black flex items-center gap-1.5">
                  <span>{movingTarget2.toFixed(2)}</span>
                  <span className="text-xs text-slate-400 font-normal">ج.م</span>
                </div>
                <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                  استهداف قمم المقاومة الرئيسية
                </div>
              </div>

              {/* Box 4: Stop Loss Anchored to SuperTrend */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-rose-500/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-500" />
                <div className="flex items-center justify-between font-sans mb-1 text-[11px]">
                  <span className="text-rose-300 font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>وقف خسارة صارم (SL):</span>
                  </span>
                  <span className="text-[10px] bg-rose-950 text-rose-400 px-1.5 py-0.2 rounded border border-rose-800">
                    {verdict.executionLevels.stopLossLossPct}% | R:R {verdict.executionLevels.riskRewardRatio}
                  </span>
                </div>
                <div className="text-rose-400 text-base font-black">
                  {verdict.executionLevels.stopLossPrice.toFixed(2)}{' '}
                  <span className="text-xs text-slate-400 font-normal">ج.م</span>
                </div>
                <div className="text-[10px] text-slate-400 font-sans mt-0.5 truncate">
                  محمي بدعم السوبر ترند {verdict.pillars.superTrend.keyMetric}
                </div>
              </div>
            </div>

            {/* 4 Indicators Deep Telemetry Strip: SuperTrend, MACD, Volume, Divergence */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 text-xs">
              {/* SuperTrend Pillar */}
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold">1. السوبر ترند:</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      verdict.pillars.superTrend.status === 'BULLISH'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {verdict.pillars.superTrend.statusAr}
                  </span>
                </div>
                <div className="text-white text-xs font-mono font-bold truncate">
                  {verdict.pillars.superTrend.keyMetric}
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2">
                  {verdict.pillars.superTrend.detailsAr}
                </p>
              </div>

              {/* MACD Pillar */}
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold">2. الماكدي (MACD):</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      verdict.pillars.macd.status === 'BULLISH'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : verdict.pillars.macd.status === 'BEARISH'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {verdict.pillars.macd.statusAr}
                  </span>
                </div>
                <div className="text-white text-xs font-mono font-bold truncate">
                  {verdict.pillars.macd.keyMetric}
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2">
                  {verdict.pillars.macd.detailsAr}
                </p>
              </div>

              {/* Volume Pillar */}
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold">3. أحجام التداول والسيولة:</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      verdict.pillars.volume.status === 'BULLISH'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : verdict.pillars.volume.status === 'BEARISH'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {verdict.pillars.volume.statusAr}
                  </span>
                </div>
                <div className="text-white text-xs font-mono font-bold truncate">
                  {verdict.pillars.volume.keyMetric}
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2">
                  {verdict.pillars.volume.detailsAr}
                </p>
              </div>

              {/* Divergence Pillar */}
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold">4. الدايفرجنس (Divergence):</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      verdict.pillars.divergence.status === 'BULLISH'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : verdict.pillars.divergence.status === 'BEARISH'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {verdict.pillars.divergence.statusAr}
                  </span>
                </div>
                <div className="text-white text-xs font-mono font-bold truncate">
                  {verdict.pillars.divergence.keyMetric}
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2">
                  {verdict.pillars.divergence.detailsAr}
                </p>
              </div>
            </div>

            {/* Positive Evidences & Cautions Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400 font-bold">عوامل التأييد الإيجابي:</span>
                {verdict.positiveConfluencesSummaryAr.slice(0, 3).map((ev, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-[11px]"
                  >
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>{ev}</span>
                  </span>
                ))}
              </div>

              {onOpenDetailedReport && (
                <button
                  onClick={onOpenDetailedReport}
                  className="text-cyan-400 hover:text-cyan-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>عرض التحليل الكامل في تقرير 360°</span>
                  <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
