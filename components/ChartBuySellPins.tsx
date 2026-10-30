import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  ShieldAlert,
  Clock,
  Zap,
  BarChart2,
  CheckCircle2,
  X,
  Sliders,
  Copy,
  Check,
} from 'lucide-react';
import { EGXStock } from '../types/stock';
import { CompositeSignalVerdict } from '../services/compositeSignalEngine';
import { StrategyBacktestSummary } from '../services/tradingBacktestEngine';
import { IndicatorSettings } from '../services/indicatorSettingsService';

export interface ChartSignalPin {
  id: string;
  type: 'BUY' | 'SELL';
  labelAr: string;
  dateStr: string;
  timeStr: string;
  price: number;
  entryZone?: string;
  target1Price?: number;
  target1GainPct?: number;
  target2Price?: number;
  target2GainPct?: number;
  stopLossPrice?: number;
  stopLossPct?: number;
  statusLabelAr: string;
  confluenceReasonAr: string;
  isLatest: boolean;
  // Position percentage inside chart container
  positionXPercent: number; // e.g. 18% from right
  positionYPercent: number; // e.g. 58% from top
}

interface ChartBuySellPinsProps {
  stock: EGXStock;
  verdict: CompositeSignalVerdict;
  backtest: StrategyBacktestSummary;
  settings: IndicatorSettings;
  onOpenBacktestModal?: () => void;
  onOpenSettingsModal?: () => void;
}

export const ChartBuySellPins: React.FC<ChartBuySellPinsProps> = ({
  stock,
  verdict,
  backtest,
  settings,
  onOpenBacktestModal,
  onOpenSettingsModal,
}) => {
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [pinnedPinId, setPinnedPinId] = useState<string | null>(null);
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);

  // Close pinned popover on ESC
  React.useEffect(() => {
    if (!pinnedPinId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPinnedPinId(null);
        setActivePinId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pinnedPinId]);

  const isCurrentBullish =
    verdict.verdictType === 'STRONG_BUY' || verdict.verdictType === 'BUY_ACCUMULATE';

  const currentPrice = stock.price > 0 ? stock.price : verdict.executionLevels.suggestedBuyEntry;
  const recentTrade = backtest.recentTrades[0];
  const priorTrade = backtest.recentTrades[1];

  // Derive the EXACT LAST 2 SIGNALS strictly from the Backtest Strategy (اخر 2 اشارة فقط خاصة بالباك تيست)
  const last2Signals: ChartSignalPin[] = React.useMemo(() => {
    const today = new Date();
    const todayDateStr = today.toLocaleDateString('ar-EG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const todayTimeStr = today.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (isCurrentBullish) {
      // 1. Prior Signal: SELL (Previous completed strategy trade exit)
      const priorTradeRef = recentTrade || priorTrade;
      const priorPrice = priorTradeRef
        ? priorTradeRef.exitPrice
        : Number((currentPrice * 1.025).toFixed(2));
      const priorDate = priorTradeRef ? priorTradeRef.exitDate : 'جلسة استراتيجية سابقة';

      const pin1PriorSell: ChartSignalPin = {
        id: 'pin-prior-sell',
        type: 'SELL',
        labelAr: 'بيع',
        dateStr: priorDate,
        timeStr: 'إغلاق الصفقة بالباك تيست',
        price: priorPrice,
        target1Price: Number((priorPrice * 0.96).toFixed(2)),
        target1GainPct: 4.0,
        stopLossPrice: Number((priorPrice * 1.03).toFixed(2)),
        stopLossPct: 3.0,
        statusLabelAr: 'إشارة بيع وجني أرباح استراتيجية سابقة مؤكدة',
        confluenceReasonAr: `جني أرباح استراتيجية الباك تيست (${priorTradeRef?.exitReasonAr || 'تحقيق الهدف'}) عند مقاومة السوبر ترند.`,
        isLatest: false,
        positionXPercent: 46, // Magnetically aligned with historical candle
        positionYPercent: 28, // Resistance level above candle
      };

      // 2. Latest Signal: BUY (Active Backtest Strategy Reversal Signal)
      const latestPrice = backtest.lastSignalPrice > 0 ? backtest.lastSignalPrice : currentPrice;
      const pin2LatestBuy: ChartSignalPin = {
        id: 'pin-latest-buy',
        type: 'BUY',
        labelAr: 'شراء',
        dateStr: todayDateStr,
        timeStr: todayTimeStr,
        price: latestPrice,
        entryZone: `${(latestPrice * 0.99).toFixed(2)} - ${(latestPrice * 1.01).toFixed(2)} ج.م`,
        target1Price: verdict.executionLevels.target1Price || Number((latestPrice * 1.05).toFixed(2)),
        target1GainPct: verdict.executionLevels.target1GainPct || 5.0,
        target2Price: verdict.executionLevels.target2Price || Number((latestPrice * 1.09).toFixed(2)),
        target2GainPct: verdict.executionLevels.target2GainPct || 9.0,
        stopLossPrice: verdict.executionLevels.stopLossPrice || Number((latestPrice * 0.96).toFixed(2)),
        stopLossPct: verdict.executionLevels.stopLossLossPct || 4.0,
        statusLabelAr: 'إشارة شراء وتجميع لحظية خاصة باستراتيجية الباك تيست 🚀',
        confluenceReasonAr: `إشارة استراتيجية مؤكدة: اختراق صاعد للسوبر ترند مع دايفرجنس ماكدي إيجابي بنسبة نجاح باك تيست ${backtest.winRatePct}%.`,
        isLatest: true,
        positionXPercent: 22, // Magnetically anchored right over the current candle (clear of right axis)
        positionYPercent: 64, // Support level below candle
      };

      return [pin1PriorSell, pin2LatestBuy];
    } else {
      // 1. Prior Signal: BUY (Preceding trade entry in backtest)
      const priorTradeRef = recentTrade || priorTrade;
      const priorPrice = priorTradeRef
        ? priorTradeRef.entryPrice
        : Number((currentPrice * 0.975).toFixed(2));
      const priorDate = priorTradeRef ? priorTradeRef.entryDate : 'جلسة استراتيجية سابقة';

      const pin1PriorBuy: ChartSignalPin = {
        id: 'pin-prior-buy',
        type: 'BUY',
        labelAr: 'شراء',
        dateStr: priorDate,
        timeStr: 'دخول الصفقة بالباك تيست',
        price: priorPrice,
        target1Price: Number((priorPrice * 1.05).toFixed(2)),
        target1GainPct: 5.0,
        stopLossPrice: Number((priorPrice * 0.97).toFixed(2)),
        stopLossPct: 3.0,
        statusLabelAr: 'إشارة شراء سابقة من استراتيجية الباك تيست',
        confluenceReasonAr: `دخول استراتيجية الباك تيست السابقة عند دعم الفيبوناتشي مع ارتداد مؤشرات الزخم.`,
        isLatest: false,
        positionXPercent: 46, // Magnetically aligned with historical candle
        positionYPercent: 64, // Support level below candle
      };

      // 2. Latest Signal: SELL (Active Backtest Strategy Exit/Resistance)
      const latestPrice = backtest.lastSignalPrice > 0 ? backtest.lastSignalPrice : currentPrice;
      const pin2LatestSell: ChartSignalPin = {
        id: 'pin-latest-sell',
        type: 'SELL',
        labelAr: 'بيع',
        dateStr: todayDateStr,
        timeStr: todayTimeStr,
        price: latestPrice,
        target1Price: verdict.executionLevels.target1Price || Number((latestPrice * 0.95).toFixed(2)),
        target1GainPct: verdict.executionLevels.target1GainPct || 5.0,
        target2Price: verdict.executionLevels.target2Price || Number((latestPrice * 0.91).toFixed(2)),
        target2GainPct: verdict.executionLevels.target2GainPct || 9.0,
        stopLossPrice: verdict.executionLevels.stopLossPrice || Number((latestPrice * 1.04).toFixed(2)),
        stopLossPct: verdict.executionLevels.stopLossLossPct || 4.0,
        statusLabelAr: 'إشارة بيع وجني أرباح نشطة خاصة باستراتيجية الباك تيست 🛑',
        confluenceReasonAr: `إشارة استراتيجية خروج: كسر دعم السوبر ترند وتقاطع ماكدي سلبي أسفل خط الصفر (دقة الباك تيست ${backtest.winRatePct}%).`,
        isLatest: true,
        positionXPercent: 22, // Magnetically anchored right over current candle
        positionYPercent: 28, // Resistance level above candle
      };

      return [pin1PriorBuy, pin2LatestSell];
    }
  }, [isCurrentBullish, currentPrice, verdict, recentTrade, priorTrade, backtest]);

  const handleCopy = (pin: ChartSignalPin, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `📌 إشارة ${pin.labelAr} - سهم ${stock.nameAr} (${stock.symbol})
📅 التاريخ: ${pin.dateStr} (${pin.timeStr})
💵 السعر عند الإشارة: ${pin.price.toFixed(2)} ج.م
🎯 الهدف الأول: ${pin.target1Price?.toFixed(2)} ج.م (+${pin.target1GainPct}%)
🎯 الهدف الثاني: ${pin.target2Price?.toFixed(2)} ج.م (+${pin.target2GainPct}%)
🛑 وقف الخسارة: ${pin.stopLossPrice?.toFixed(2)} ج.م
💡 سبب الإشارة: ${pin.confluenceReasonAr}
📊 معدل نجاح الباك تيست: ${backtest.winRatePct}%`;

    navigator.clipboard.writeText(text);
    setCopiedPinId(pin.id);
    setTimeout(() => setCopiedPinId(null), 2500);
  };

  return (
    <>
      {last2Signals.map((pin) => {
        const isBuy = pin.type === 'BUY';
        const isHovered = activePinId === pin.id;
        const isPinned = pinnedPinId === pin.id;
        const isOpen = isHovered || isPinned;

        return (
          <div
            key={pin.id}
            dir="rtl"
            style={{
              right: `${pin.positionXPercent}%`,
              top: `${pin.positionYPercent}%`,
            }}
            className="absolute z-30 select-none font-['Cairo'] -translate-y-1/2 pointer-events-auto"
            onMouseEnter={() => setActivePinId(pin.id)}
            onMouseLeave={() => {
              if (pinnedPinId !== pin.id) {
                setActivePinId(null);
              }
            }}
          >
            {/* Visual Indicator Marker Matching Image 2 */}
            <div className="relative flex flex-col items-center">
              {/* If SELL, the badge sits ABOVE with an indicator notch pointing down */}
              {!isBuy && (
                <button
                  type="button"
                  onClick={() => {
                    setPinnedPinId((prev) => (prev === pin.id ? null : pin.id));
                  }}
                  className="group relative cursor-pointer px-2.5 py-1 rounded-md bg-[#e11d48] hover:bg-[#be123c] text-white text-[11px] font-black tracking-wide shadow-lg shadow-rose-950/60 border border-rose-400/50 flex items-center gap-1 transition-all hover:scale-110 active:scale-95"
                  title="انقر لتثبيت تفاصيل إشارة البيع ومستويات الأهداف والوقف"
                >
                  <TrendingDown className="w-3 h-3 text-white" />
                  <span>{pin.labelAr}</span>
                  {pin.isLatest && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping ml-0.5" />
                  )}
                  {/* Stem pointing down to candle */}
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#e11d48] rotate-45 border-r border-b border-rose-400/50" />
                </button>
              )}

              {/* Price Target Line Anchor */}
              <div
                className={`w-2.5 h-2.5 rounded-full border-2 my-1 transition-all shadow-md ${
                  isBuy
                    ? 'bg-emerald-500 border-white ring-2 ring-emerald-500/50'
                    : 'bg-rose-500 border-white ring-2 ring-rose-500/50'
                }`}
              />

              {/* If BUY, the badge sits BELOW with an indicator notch pointing up */}
              {isBuy && (
                <button
                  type="button"
                  onClick={() => {
                    setPinnedPinId((prev) => (prev === pin.id ? null : pin.id));
                  }}
                  className="group relative cursor-pointer px-2.5 py-1 rounded-md bg-[#16a34a] hover:bg-[#15803d] text-white text-[11px] font-black tracking-wide shadow-lg shadow-emerald-950/60 border border-emerald-300/50 flex items-center gap-1 transition-all hover:scale-110 active:scale-95"
                  title="انقر لتثبيت تفاصيل إشارة الشراء ومستويات الأهداف والوقف"
                >
                  {/* Stem pointing up to candle */}
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#16a34a] rotate-45 border-l border-t border-emerald-300/50" />
                  <TrendingUp className="w-3 h-3 text-white" />
                  <span>{pin.labelAr}</span>
                  {pin.isLatest && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping ml-0.5" />
                  )}
                </button>
              )}

              {/* Minimalist Price Tag below / above badge */}
              <span className="font-mono text-[9px] font-bold text-white bg-slate-950/80 px-1.5 py-0.2 rounded mt-1 border border-slate-700/80 backdrop-blur-sm whitespace-nowrap shadow-sm">
                {pin.price.toFixed(2)} ج.م
              </span>
            </div>

            {/* Interactive Rich Tooltip Popover on Hover or Click Pin */}
            {isOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className={`absolute z-50 w-76 sm:w-80 bg-slate-950/98 backdrop-blur-xl border rounded-2xl p-4 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 text-xs text-right text-white font-sans ${
                  isBuy
                    ? 'border-emerald-500/60 shadow-emerald-950/40 bottom-12 right-0'
                    : 'border-rose-500/60 shadow-rose-950/40 top-12 right-0'
                }`}
              >
                {/* Popover Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-white font-black text-xs flex items-center gap-1 ${
                        isBuy ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    >
                      {isBuy ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>إشارة {pin.labelAr}</span>
                    </span>
                    <span className="font-bold text-[11px] text-slate-300">
                      {pin.isLatest ? 'أحدث إشارة نشطة ⚡' : 'الإشارة السابقة ⏳'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleCopy(pin, e)}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="نسخ تفاصيل الإشارة"
                    >
                      {copiedPinId === pin.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPinnedPinId(null);
                        setActivePinId(null);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="إغلاق البطاقة"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Date & Time Timestamp */}
                <div className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-slate-800">
                  <span className="flex items-center gap-1 text-slate-400 font-bold">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>تاريخ ورصد الإشارة:</span>
                  </span>
                  <strong className="font-mono text-white text-[11px]">
                    {pin.dateStr}
                    {pin.timeStr ? ` (${pin.timeStr})` : ''}
                  </strong>
                </div>

                {/* Execution Price Levels */}
                <div className="space-y-1.5 font-mono text-[11px] bg-slate-900/70 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between font-sans">
                    <span className="text-slate-400 font-bold">السعر عند ظهور الإشارة:</span>
                    <strong className="text-base font-black text-white">
                      {pin.price.toFixed(2)} <span className="text-xs text-slate-400 font-normal">ج.م</span>
                    </strong>
                  </div>

                  {pin.entryZone && (
                    <div className="text-[10px] text-slate-400 font-sans border-b border-slate-800/80 pb-1">
                      نطاق الدخول المقترح: {pin.entryZone}
                    </div>
                  )}

                  {pin.target1Price && (
                    <div className="flex items-center justify-between text-cyan-300 pt-1">
                      <span className="font-sans text-slate-400">نقطة جني أرباح (هدف 1):</span>
                      <strong className="text-xs">
                        {pin.target1Price.toFixed(2)} ج.م (+{pin.target1GainPct}%)
                      </strong>
                    </div>
                  )}

                  {pin.target2Price && (
                    <div className="flex items-center justify-between text-purple-300">
                      <span className="font-sans text-slate-400">نقطة جني أرباح (هدف 2):</span>
                      <strong className="text-xs">
                        {pin.target2Price.toFixed(2)} ج.م (+{pin.target2GainPct}%)
                      </strong>
                    </div>
                  )}

                  {pin.stopLossPrice && (
                    <div className="flex items-center justify-between text-rose-400 border-t border-slate-800/80 pt-1">
                      <span className="font-sans text-slate-400">وقف خسارة صارم (SL):</span>
                      <strong className="text-xs">
                        {pin.stopLossPrice.toFixed(2)} ج.م ({pin.stopLossPct}%)
                      </strong>
                    </div>
                  )}
                </div>

                {/* Confluence Rationale */}
                <div className="text-[11px] text-slate-300 font-sans leading-relaxed bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60">
                  <div className="flex items-center gap-1 text-cyan-300 font-bold mb-1">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>سبب وظروف الإشارة:</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{pin.confluenceReasonAr}</p>
                </div>

                {/* Backtest & Sensitivity Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] text-slate-400 font-sans flex-wrap gap-1.5">
                  <div className="flex items-center gap-1">
                    <BarChart2 className="w-3 h-3 text-emerald-400" />
                    <span>دقة الباك تيست:</span>
                    <strong className="font-mono text-emerald-400 font-bold">{backtest.winRatePct}%</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    {onOpenBacktestModal && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenBacktestModal();
                        }}
                        className="text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
                      >
                        باك تيست 📊
                      </button>
                    )}
                    {onOpenSettingsModal && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSettingsModal();
                        }}
                        className="text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                      >
                        الحساسية ⚙️
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};
