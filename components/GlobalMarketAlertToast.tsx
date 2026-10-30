import React, { useEffect, useState } from 'react';
import { Zap, X, ArrowUpRight, TrendingUp, TrendingDown, Bell, Clock, Activity } from 'lucide-react';
import { MarketIndicatorAlert } from '../types/globalMarket';

interface GlobalMarketAlertToastProps {
  alert: MarketIndicatorAlert | null;
  onSelectAssetForChart: (symbol: string) => void;
  onDismiss: () => void;
}

export const GlobalMarketAlertToast: React.FC<GlobalMarketAlertToastProps> = ({
  alert,
  onSelectAssetForChart,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (alert) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss();
      }, 8000); // auto-hide after 8 seconds
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [alert, onDismiss]);

  if (!alert || !isVisible) return null;

  const isOpportunity = alert.severity === 'OPPORTUNITY';
  const isCritical = alert.severity === 'CRITICAL' || alert.severity === 'WARNING';

  return (
    <div
      dir="rtl"
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-950/98 border-2 border-cyan-500/80 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-bounce-subtle font-['Cairo'] text-slate-100 space-y-2.5 transition-all duration-300"
    >
      {/* Toast Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${
              isOpportunity
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                : isCritical
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
            }`}
          >
            {isOpportunity ? <TrendingUp className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-black text-white text-sm">{alert.assetSymbol}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  isOpportunity
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                تنبيه مؤشر لحظي
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-bold">{alert.assetNameAr}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            onDismiss();
          }}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Alert Content */}
      <div className="space-y-1 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-xs">
        <strong className="text-white block font-bold leading-tight">{alert.titleAr}</strong>
        <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{alert.messageAr}</p>
      </div>

      {/* Bottom Info & Action */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-[11px]">
        <div className="flex items-center gap-1 text-slate-400 font-mono">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>{alert.timestamp}</span>
        </div>
        <button
          onClick={() => {
            onSelectAssetForChart(alert.assetSymbol);
            setIsVisible(false);
            onDismiss();
          }}
          className="px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1 cursor-pointer"
        >
          <span>عرض الشارت والمتوسطات</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
