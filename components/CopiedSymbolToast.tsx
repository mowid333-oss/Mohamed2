import React, { useState, useEffect } from 'react';
import { Copy, Check, CheckCircle2 } from 'lucide-react';

export const CopiedSymbolToast: React.FC = () => {
  const [copiedSymbol, setCopiedSymbol] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const handleCopied = (e: Event) => {
      const customEvent = e as CustomEvent<{ symbol: string }>;
      if (customEvent.detail && customEvent.detail.symbol) {
        setCopiedSymbol(customEvent.detail.symbol);
        clearTimeout(timer);
        timer = setTimeout(() => {
          setCopiedSymbol(null);
        }, 2200);
      }
    };

    window.addEventListener('egx-stock-symbol-copied', handleCopied);
    return () => {
      window.removeEventListener('egx-stock-symbol-copied', handleCopied);
      clearTimeout(timer);
    };
  }, []);

  if (!copiedSymbol) return null;

  return (
    <div
      dir="rtl"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#0b0f17]/95 border border-emerald-500/60 text-white shadow-2xl backdrop-blur-md font-['Cairo'] animate-slideUp pointer-events-none select-none"
    >
      <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
        <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
      </div>
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-slate-300">تم نسخ رمز السهم</span>
        <span className="font-mono font-black text-emerald-300 px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-sm">
          {copiedSymbol}
        </span>
        <span className="text-slate-300">إلى الحافظة بنجاح 📋</span>
      </div>
    </div>
  );
};
