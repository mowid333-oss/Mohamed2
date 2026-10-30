import React, { useEffect, useState } from 'react';
import { Zap, X, ArrowUpRight, BarChart2 } from 'lucide-react';
import { InstitutionalLiquidityAlert } from '../services/institutionalLiquidityAlertService';

interface FloatingLiquidityAlertToastProps {
  alert: InstitutionalLiquidityAlert | null;
  onOpenDrawer: () => void;
  onSelectStockForChart: (symbol: string) => void;
  onDismiss: () => void;
}

export const FloatingLiquidityAlertToast: React.FC<FloatingLiquidityAlertToastProps> = ({
  alert,
  onOpenDrawer,
  onSelectStockForChart,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (alert) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss();
      }, 7000); // auto-hide after 7 seconds
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [alert, onDismiss]);

  if (!alert || !isVisible) return null;

  return (
    <div
      dir="rtl"
      className="fixed bottom-6 left-6 z-50 max-w-sm w-full bg-slate-950/95 border-2 border-amber-500/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-bounce-subtle font-['Cairo'] text-slate-100 space-y-2.5 transition-all duration-300"
    >
      {/* Toast Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold text-base shadow-sm animate-pulse">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-black text-white text-sm">{alert.symbol}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                قفزة سيولة 20 يوم!
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-semibold">{alert.nameAr}</p>
          </div>
        </div>

        <button
          onClick={() => {
            setIsVisible(false);
            onDismiss();
          }}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Volume Stats */}
      <div className="flex items-center justify-between text-xs font-mono bg-slate-900/90 p-2 rounded-xl border border-slate-800">
        <div>
          <span className="text-[10px] text-slate-400 font-sans block">تجاوز متوسط 20 يوم:</span>
          <strong className="text-amber-400 font-black">{alert.rvol20}x (+{alert.spikePct}%)</strong>
        </div>
        <div className="text-left">
          <span className="text-[10px] text-slate-400 font-sans block">السعر اللحظي:</span>
          <span className="text-white font-bold">{alert.price.toFixed(2)} ج.م ({alert.changePct >= 0 ? '+' : ''}{alert.changePct}%)</span>
        </div>
      </div>

      <p className="text-[11px] text-slate-300 leading-tight">
        {alert.flowDirectionAr}
      </p>

      {/* Buttons */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
        <button
          onClick={() => {
            onSelectStockForChart(alert.symbol);
            setIsVisible(false);
            onDismiss();
          }}
          className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-bold transition-colors flex items-center gap-1"
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>الشارت</span>
        </button>

        <button
          onClick={() => {
            onOpenDrawer();
            setIsVisible(false);
            onDismiss();
          }}
          className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-400 text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1"
        >
          <span>عرض كافة التنبيهات ({alert.rvol20}x)</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
