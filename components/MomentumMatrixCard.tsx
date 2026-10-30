import React from 'react';
import {
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Target,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from 'lucide-react';
import { EGXStock, TradingTimeframe } from '../types/stock';
import { calculateMomentumMatrix, MomentumMatrixResult } from '../utils/momentumMatrixEngine';

interface MomentumMatrixCardProps {
  stock: EGXStock;
  timeframe: TradingTimeframe;
  onOpenChart?: (symbol: string) => void;
  onOpenAdvisor?: (symbol: string) => void;
}

export const MomentumMatrixCard: React.FC<MomentumMatrixCardProps> = ({
  stock,
  timeframe,
  onOpenChart,
  onOpenAdvisor,
}) => {
  const result: MomentumMatrixResult = calculateMomentumMatrix(stock, timeframe);

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-[#090d16] border border-cyan-500/35 shadow-2xl space-y-5 font-['Cairo']">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0">
            <Compass className="w-5 h-5 text-cyan-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base sm:text-lg font-black text-white">
                مصفوفة تقييم الزخم (Momentum Matrix)
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 font-mono font-bold border border-cyan-700/50">
                SMA 50 · SMA 200 · RSI 14
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              تحديد قوة وسرعة اتجاه السهم عبر الجمع الهندسي بين تقاطع المتوسطات الكبرى ومؤشر القوة النسبية.
            </p>
          </div>
        </div>

        {/* Momentum Score Badge */}
        <div className="flex items-center gap-2.5">
          <div className="text-left">
            <span className="text-[10px] text-slate-400 block font-bold">قوة الزخم الكلية</span>
            <span className="text-xs font-black text-emerald-400 font-mono">
              {result.overallMomentumScore}% ({result.momentumLevelAr})
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center font-mono font-black text-lg text-cyan-300 shadow-inner">
            {result.overallMomentumScore}
          </div>
        </div>
      </div>

      {/* Main Grid: 2D Matrix Diagram & Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* 2D Quadrant Matrix Visualizer (7 Columns on LG) */}
        <div className="lg:col-span-7 flex flex-col justify-between p-4 rounded-2xl bg-slate-950/90 border border-slate-800/90 space-y-3 relative overflow-hidden">
          {/* Axis Labels */}
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
            <span className="flex items-center gap-1 text-cyan-300">
              <span>◄ المحور الأفقي: مؤشر RSI</span>
            </span>
            <span className="flex items-center gap-1 text-indigo-300">
              <span>المحور الرأسي: قوة الاتجاه والمتوسطات ▲</span>
            </span>
          </div>

          {/* 2D Matrix Canvas */}
          <div className="relative w-full aspect-[16/11] sm:aspect-[16/10] rounded-xl bg-[#060a12] border border-slate-800 overflow-hidden shadow-inner select-none">
            {/* Quadrant Backgrounds */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
              {/* Top-Left: Quadrant 2 (Overbought Extended) */}
              <div
                className={`p-2.5 border-r border-b border-slate-800/60 transition-colors ${
                  result.quadrantId === 'OVERBOUGHT_RISK'
                    ? 'bg-amber-950/25 border-amber-500/40'
                    : 'bg-transparent'
                }`}
              >
                <span className="text-[10px] font-bold text-amber-400 block">
                  الربع 2: تشبع شرائي ممتد ⚠️
                </span>
                <span className="text-[9px] text-slate-500 block">RSI &gt; 68 • مخاطر تصحيح</span>
              </div>

              {/* Top-Right: Quadrant 1 (Bullish Expansion) */}
              <div
                className={`p-2.5 border-b border-slate-800/60 text-right transition-colors ${
                  result.quadrantId === 'BULLISH_EXPANSION'
                    ? 'bg-emerald-950/30 border-emerald-500/40'
                    : 'bg-transparent'
                }`}
              >
                <span className="text-[10px] font-bold text-emerald-300 block">
                  الربع 1: زخم صاعد مؤسسي 🟢
                </span>
                <span className="text-[9px] text-slate-500 block">تقاطع ذهبي • اندفاع صحي</span>
              </div>

              {/* Bottom-Left: Quadrant 4 (Bearish Momentum) */}
              <div
                className={`p-2.5 border-r border-slate-800/60 flex flex-col justify-end transition-colors ${
                  result.quadrantId === 'BEARISH_MOMENTUM'
                    ? 'bg-rose-950/25 border-rose-500/40'
                    : 'bg-transparent'
                }`}
              >
                <span className="text-[9px] text-slate-500 block">تقاطع موت • ضغط بيعي</span>
                <span className="text-[10px] font-bold text-rose-400 block">
                  الربع 4: زخم هابط وتصحيحي 🔴
                </span>
              </div>

              {/* Bottom-Right: Quadrant 3 (Bottom Accumulation) */}
              <div
                className={`p-2.5 text-right flex flex-col justify-end transition-colors ${
                  result.quadrantId === 'BOTTOM_ACCUMULATION'
                    ? 'bg-cyan-950/30 border-cyan-500/40'
                    : 'bg-transparent'
                }`}
              >
                <span className="text-[9px] text-slate-500 block">تشبع بيعي • دعوم صخرية</span>
                <span className="text-[10px] font-bold text-cyan-300 block">
                  الربع 3: ارتداد تجميعي 💎
                </span>
              </div>
            </div>

            {/* Center Crosshair Axes */}
            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-cyan-500/30 pointer-events-none" />
            <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-cyan-500/30 pointer-events-none" />

            {/* Center Neutral Cross Label */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/90 px-1.5 py-0.5 rounded text-[8px] font-mono text-slate-400 border border-slate-700 pointer-events-none">
              RSI 50 / Neutral
            </div>

            {/* Dynamic Plotted Pin for the Current Stock */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-out z-20 group"
              style={{
                left: `${result.xPlotPercent}%`,
                top: `${result.yPlotPercent}%`,
              }}
            >
              {/* Glowing Pulse Rings */}
              <div className="relative flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-cyan-400/40 opacity-75" />
                <div className="relative px-2 py-1 rounded-lg bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-600 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/50 flex items-center gap-1 border border-white/60">
                  <span className="font-mono text-[11px]">{stock.symbol}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse" />
                </div>
              </div>

              {/* Pin Hover/Tap Tooltip */}
              <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-44 p-2 bg-slate-950/95 border border-cyan-500/60 rounded-xl text-[10px] shadow-2xl backdrop-blur-md text-right pointer-events-none z-30">
                <p className="font-bold text-white">{stock.nameAr}</p>
                <div className="text-slate-300 font-mono mt-0.5 space-y-0.5">
                  <div className="flex justify-between">
                    <span>RSI:</span>
                    <strong className="text-cyan-400">{result.rsiValue}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>الاتجاه:</span>
                    <strong className="text-emerald-400">{result.yTrendScore}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Matrix Legend Footer */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80 px-1">
            <span>◄ اليسار: RSI منخفض (تشبع بيعي)</span>
            <span>المنتصف: توازن ⚖️</span>
            <span>اليمين: RSI مرتفع (تشبع شرائي) ►</span>
          </div>
        </div>

        {/* Technical Diagnostics & Cross Status Panel (5 Columns on LG) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
          {/* Current Stock Quadrant Badge */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 block">تموضع السهم في المصفوفة:</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-white">{result.quadrantNameAr}</span>
              <span
                className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${
                  result.quadrantColor === 'emerald'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                    : result.quadrantColor === 'amber'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                    : result.quadrantColor === 'cyan'
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35'
                    : 'bg-rose-500/15 text-rose-300 border-rose-500/35'
                }`}
              >
                {result.quadrantBadge}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {result.actionableAdviceAr}
            </p>
          </div>

          {/* Moving Averages 50 / 200 Cross Card */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                حالة تقاطع المتوسطات الكبرى (50 و 200):
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                  result.crossStatus === 'GOLDEN_CROSS'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : result.crossStatus === 'DEATH_CROSS'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {result.crossStatusAr}
              </span>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">متوسط 50 يوم (SMA 50):</span>
                <div className="flex items-baseline justify-between mt-0.5 font-mono">
                  <span className="font-black text-white">{result.sma50} ج.م</span>
                  <span
                    className={`text-[10px] font-bold ${
                      result.priceVsSma50Pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {result.priceVsSma50Pct >= 0 ? '+' : ''}
                    {result.priceVsSma50Pct}%
                  </span>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">متوسط 200 يوم (SMA 200):</span>
                <div className="flex items-baseline justify-between mt-0.5 font-mono">
                  <span className="font-black text-white">{result.sma200} ج.م</span>
                  <span
                    className={`text-[10px] font-bold ${
                      result.priceVsSma200Pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {result.priceVsSma200Pct >= 0 ? '+' : ''}
                    {result.priceVsSma200Pct}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RSI Gauge Card */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                مؤشر القوة النسبية (RSI 14):
              </span>
              <span className="text-xs font-mono font-black text-cyan-300">
                {result.rsiValue}
              </span>
            </div>

            {/* Visual Gauge Bar */}
            <div className="relative w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 ${
                  result.rsiValue >= 70
                    ? 'bg-rose-500'
                    : result.rsiValue >= 55
                    ? 'bg-emerald-400'
                    : result.rsiValue >= 45
                    ? 'bg-cyan-400'
                    : 'bg-teal-400'
                }`}
                style={{ width: `${result.rsiValue}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>0 (تشبع بيعي 30)</span>
              <span className="font-bold text-slate-300">{result.rsiZoneAr}</span>
              <span>(تشبع شرائي 70) 100</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            {onOpenChart && (
              <button
                onClick={() => onOpenChart(stock.symbol)}
                className="flex-1 py-2 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/35 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>شارت السهم</span>
              </button>
            )}

            {onOpenAdvisor && (
              <button
                onClick={() => onOpenAdvisor(stock.symbol)}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>المستشار الذكي</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
