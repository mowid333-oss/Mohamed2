import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyableStockSymbolProps {
  symbol: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'badge';
  showCopyIcon?: boolean;
  children?: React.ReactNode;
}

export const copyStockSymbolToClipboard = async (symbol: string, e?: React.MouseEvent) => {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(symbol.trim());
    } else {
      // Fallback for older environments
      const textarea = document.createElement('textarea');
      textarea.value = symbol.trim();
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    // Dispatch global event for floating toast notification
    window.dispatchEvent(
      new CustomEvent('egx-stock-symbol-copied', {
        detail: { symbol: symbol.trim() },
      })
    );
    return true;
  } catch (err) {
    console.error('Failed to copy stock symbol:', err);
    return false;
  }
};

export const CopyableStockSymbol: React.FC<CopyableStockSymbolProps> = ({
  symbol,
  className = '',
  size = 'md',
  showCopyIcon = true,
  children,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const success = await copyStockSymbolToClipboard(symbol, e);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  const sizeClasses = {
    xs: 'text-[10px] px-1 py-0.2',
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-0.5',
    lg: 'text-base sm:text-lg px-2.5 py-1',
    badge: 'text-xs font-bold px-2 py-0.5 rounded-lg',
  }[size];

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
    badge: 'w-3 h-3',
  }[size];

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`group relative inline-flex items-center gap-1 font-mono font-black rounded-md transition-all cursor-pointer select-all border active:scale-95 ${
        copied
          ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300 shadow-sm shadow-emerald-500/20'
          : 'bg-slate-900/60 hover:bg-cyan-950/40 text-white hover:text-cyan-300 border-slate-800 hover:border-cyan-500/40'
      } ${sizeClasses} ${className}`}
      title={copied ? `تم نسخ الرمز (${symbol}) بنجاح!` : `انقر لنسخ رمز السهم (${symbol}) إلى الحافظة`}
    >
      <span>{children || symbol}</span>
      {showCopyIcon && (
        <span className="shrink-0 transition-transform">
          {copied ? (
            <Check className={`${iconSizes} text-emerald-400 animate-scale`} />
          ) : (
            <Copy className={`${iconSizes} text-slate-500 group-hover:text-cyan-300 opacity-70 group-hover:opacity-100 transition-opacity`} />
          )}
        </span>
      )}
      {copied && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-emerald-600 text-slate-950 text-[10px] font-sans font-black shadow-lg pointer-events-none whitespace-nowrap z-50 animate-fadeIn">
          تم النسخ ✓
        </span>
      )}
    </button>
  );
};
