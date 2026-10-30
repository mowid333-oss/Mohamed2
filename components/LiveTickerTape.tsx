import React, { useRef, useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Zap, Radio, Clock, Pause, Play, ChevronLeft, ChevronRight, X, Copy } from 'lucide-react';
import { EGXStock } from '../types/stock';
import { copyStockSymbolToClipboard } from './CopyableStockSymbol';

interface LiveTickerTapeProps {
  stocks: EGXStock[];
  selectedSymbol: string;
  onSelectStock: (symbol: string) => void;
  isLoading: boolean;
  onClose?: () => void;
}

export const LiveTickerTape: React.FC<LiveTickerTapeProps> = ({
  stocks,
  selectedSymbol,
  onSelectStock,
  isLoading,
  onClose,
}) => {
  const [flashingSymbols, setFlashingSymbols] = useState<Record<string, 'up' | 'down'>>({});
  const [isPaused, setIsPaused] = useState(false);
  const prevPricesRef = useRef<Record<string, number>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const flashes: Record<string, 'up' | 'down'> = {};
    let hasFlash = false;

    stocks.forEach((s) => {
      const prev = prevPricesRef.current[s.symbol];
      if (prev !== undefined && prev !== s.price && s.price > 0) {
        flashes[s.symbol] = s.price > prev ? 'up' : 'down';
        hasFlash = true;
      }
      prevPricesRef.current[s.symbol] = s.price;
    });

    if (hasFlash) {
      setFlashingSymbols(flashes);
      const timer = setTimeout(() => {
        setFlashingSymbols({});
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [stocks]);

  // Featured top tickers to show on the ticker tape (repeated for continuous loop)
  const topTickers = stocks.slice(0, 35);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const renderStockPill = (s: EGXStock, keyPrefix: string) => {
    const isSelected = s.symbol === selectedSymbol;
    const isPos = s.changePct > 0;
    const isNeg = s.changePct < 0;
    const flash = flashingSymbols[s.symbol];

    let flashClass = '';
    if (flash === 'up') flashClass = 'bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-400';
    else if (flash === 'down') flashClass = 'bg-rose-500/30 text-rose-300 ring-1 ring-rose-400';

    return (
      <button
        key={`${keyPrefix}-${s.symbol}`}
        dir="rtl"
        onClick={() => onSelectStock(s.symbol)}
        className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-xs transition-all border cursor-pointer ${
          flashClass
            ? flashClass
            : isSelected
            ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/40'
            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
        title={`${s.nameAr} - ${s.price.toFixed(2)} ج.م`}
      >
        <span
          onClick={(e) => {
            e.stopPropagation();
            copyStockSymbolToClipboard(s.symbol, e);
          }}
          className="font-bold text-[11px] text-white hover:text-cyan-300 hover:underline cursor-copy flex items-center gap-0.5 group/sym"
          title={`انقر لنسخ رمز السهم (${s.symbol}) إلى الحافظة`}
        >
          {s.symbol}
          <Copy className="w-2.5 h-2.5 opacity-0 group-hover/sym:opacity-100 text-cyan-400 transition-opacity" />
        </span>
        <span className="font-semibold text-slate-200">
          {s.price > 0 ? s.price.toFixed(s.price >= 10 ? 2 : 3) : '-'}
        </span>
        <span
          className={`flex items-center text-[10px] font-bold ${
            isPos ? 'text-emerald-400' : isNeg ? 'text-rose-400' : 'text-slate-400'
          }`}
        >
          {isPos ? (
            <ArrowUpRight className="w-2.5 h-2.5 stroke-[2.5]" />
          ) : isNeg ? (
            <ArrowDownRight className="w-2.5 h-2.5 stroke-[2.5]" />
          ) : null}
          {Math.abs(s.changePct).toFixed(1)}%
        </span>
        {s.isShariahCompliant && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="سهم شريعة إسلامية" />
        )}
      </button>
    );
  };

  return (
    <div className="bg-[#04070c] border-b border-slate-800/90 py-1 px-2 sm:px-4 overflow-hidden select-none text-xs">
      <div className="max-w-[1850px] w-full mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Live Indicator Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 bg-slate-900 border border-slate-800 px-2 sm:px-2.5 py-1 rounded-lg shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-bold text-white tracking-wider font-['Cairo'] whitespace-nowrap">
            شريط الأسعار اللحظي
          </span>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer transition-colors"
            title={isPaused ? 'استئناف الحركة' : 'إيقاف الحركة مؤقتاً'}
          >
            {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3" />}
          </button>
        </div>

        {/* Manual Arrow Controls (Left Side) */}
        <button
          onClick={() => handleScroll('right')}
          className="p-1 sm:p-1.5 text-slate-400 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-lg cursor-pointer transition-colors shrink-0 shadow-sm"
          title="تمرير الشريط لليمين"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Continuous Animated Marquee Ticker */}
        <div
          dir="ltr"
          ref={scrollContainerRef}
          className="relative overflow-x-auto no-scrollbar flex-1 group marquee-track scroll-smooth"
          onWheel={(e) => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollLeft += e.deltaY;
            }
          }}
        >
          <div
            className={`flex items-center gap-2 will-change-transform flex-nowrap ${
              isPaused ? 'ticker-paused' : 'animate-ticker-marquee'
            }`}
          >
            {/* First Set */}
            {topTickers.map((s, idx) => renderStockPill(s, `ticker-a-${idx}`))}
            {/* Second Duplicate Set for Endless Continuous Marquee */}
            {topTickers.map((s, idx) => renderStockPill(s, `ticker-b-${idx}`))}
          </div>
        </div>

        {/* Manual Arrow Controls (Right Side) */}
        <button
          onClick={() => handleScroll('left')}
          className="p-1 sm:p-1.5 text-slate-400 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-lg cursor-pointer transition-colors shrink-0 shadow-sm"
          title="تمرير الشريط لليسار"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 sm:p-1.5 text-slate-400 hover:text-rose-400 bg-slate-900/90 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-800 rounded-lg cursor-pointer transition-colors shrink-0 shadow-sm"
            title="إخفاء شريط الأسعار اللحظية"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
