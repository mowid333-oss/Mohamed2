import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  BellRing,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Power,
  Sparkles,
  AlertCircle,
  LogIn,
  Check,
} from 'lucide-react';
import { EGXStock } from '../types/stock';
import { FirestoreUserAlert } from '../services/userFirestoreService';
import { CopyableStockSymbol } from './CopyableStockSymbol';

export interface QuickAlertPopoverProps {
  stock: EGXStock;
  isOpen: boolean;
  onClose: () => void;
  anchorRect: DOMRect | null;
  alerts: FirestoreUserAlert[];
  onSaveAlert: (alertData: {
    symbol: string;
    stockNameAr: string;
    condition: FirestoreUserAlert['condition'];
    targetValue: number;
    currentPriceWhenCreated: number;
    isActive: boolean;
    isTriggered: boolean;
    note: string;
  }) => Promise<void> | void;
  onToggleAlert: (alertId: string, currentActive: boolean) => Promise<void> | void;
  onDeleteAlert: (alertId: string) => Promise<void> | void;
  isLoggedIn: boolean;
  onOpenAuthModal?: () => void;
}

export const QuickAlertPopover: React.FC<QuickAlertPopoverProps> = ({
  stock,
  isOpen,
  onClose,
  anchorRect,
  alerts,
  onSaveAlert,
  onToggleAlert,
  onDeleteAlert,
  isLoggedIn,
  onOpenAuthModal,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Form states
  const [condition, setCondition] = useState<'ABOVE_PRICE' | 'BELOW_PRICE'>('ABOVE_PRICE');
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(5);
  const [targetPrice, setTargetPrice] = useState<string>(() => {
    return stock.price > 0 ? (stock.price * 1.05).toFixed(stock.price >= 10 ? 2 : 3) : '10.00';
  });
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter alerts for this stock
  const stockAlerts = alerts.filter(
    (a) => a.symbol.trim().toUpperCase() === stock.symbol.trim().toUpperCase()
  );

  // Update target price default when stock changes
  useEffect(() => {
    if (stock.price > 0) {
      setTargetPrice((stock.price * 1.05).toFixed(stock.price >= 10 ? 2 : 3));
      setSelectedPercentage(5);
      setCondition('ABOVE_PRICE');
      setNote('');
      setSaveSuccess(false);
      setErrorMessage(null);
    }
  }, [stock.symbol, stock.price]);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !anchorRect) return null;

  // Calculate smart popover positioning
  const popoverWidth = 360;
  const popoverEstimatedHeight = 490;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  let top = anchorRect.bottom + 8;
  if (top + popoverEstimatedHeight > viewportHeight - 16) {
    // Flip above anchor if overflowing bottom
    top = Math.max(16, anchorRect.top - popoverEstimatedHeight - 8);
  }

  // Anchor horizontally (RTL alignment)
  let left = anchorRect.left;
  if (left + popoverWidth > viewportWidth - 16) {
    left = viewportWidth - popoverWidth - 16;
  }
  if (left < 16) {
    left = 16;
  }

  // Exactly 3 quick percentage buttons (+5%, +10%, -5%) as requested
  const applyPercentageShortcut = (pct: number) => {
    if (stock.price <= 0) return;
    const factor = 1 + pct / 100;
    const calculated = (stock.price * factor).toFixed(stock.price >= 10 ? 2 : 3);
    setTargetPrice(calculated);
    setSelectedPercentage(pct);
    setCondition(pct >= 0 ? 'ABOVE_PRICE' : 'BELOW_PRICE');
    setErrorMessage(null);
  };

  // Percentage difference from current price
  const numTarget = parseFloat(targetPrice);
  const pctDiff =
    !isNaN(numTarget) && stock.price > 0
      ? (((numTarget - stock.price) / stock.price) * 100).toFixed(2)
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(targetPrice);
    if (isNaN(val) || val <= 0) {
      setErrorMessage('يرجى إدخال سعر مستهدف صالح أكبر من صفر');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await onSaveAlert({
        symbol: stock.symbol,
        stockNameAr: stock.nameAr || stock.symbol,
        condition,
        targetValue: val,
        currentPriceWhenCreated: stock.price || 0,
        isActive: true,
        isTriggered: false,
        note: note.trim(),
      });
      setSaveSuccess(true);
      setNote('');
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2500);
    } catch (err: any) {
      console.error('Error saving alert:', err);
      setErrorMessage(err?.message || 'تعذر حفظ التنبيه، يرجى المحاولة ثانية');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: `${popoverWidth}px`,
        zIndex: 9999,
      }}
      className="bg-slate-900/98 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-2xl shadow-black/80 text-white font-['Cairo'] p-4 animate-in fade-in zoom-in-95 duration-150 overflow-hidden max-h-[85vh] flex flex-col"
      dir="rtl"
    >
      {/* Popover Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <BellRing className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CopyableStockSymbol symbol={stock.symbol} size="sm" />
              <span className="text-xs text-slate-300 font-bold truncate max-w-[150px]">
                {stock.nameAr}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              السعر اللحظي:{' '}
              <span className="text-white font-bold">{stock.price.toFixed(2)} ج.م</span>
              <span
                className={`mr-1.5 font-bold ${
                  stock.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                ({stock.changePct >= 0 ? '+' : ''}
                {stock.changePct.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-y-auto space-y-3.5 pt-3 pr-0.5 custom-scrollbar">
        {/* 3 Quick Percentage Shortcuts: +5%, +10%, -5% */}
        <div>
          <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>أزرار سريعة بالنسبة المئوية (+5%، +10%، -5%):</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5 text-xs font-mono font-bold">
            <button
              type="button"
              onClick={() => applyPercentageShortcut(5)}
              className={`py-1.5 px-2 rounded-xl border flex items-center justify-center gap-1 transition-all ${
                selectedPercentage === 5
                  ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400 ring-2 ring-emerald-500/30 shadow-sm shadow-emerald-500/20'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
              }`}
              title="تحديد صعود 5% فوق السعر الحالي"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+5%</span>
            </button>
            <button
              type="button"
              onClick={() => applyPercentageShortcut(10)}
              className={`py-1.5 px-2 rounded-xl border flex items-center justify-center gap-1 transition-all ${
                selectedPercentage === 10
                  ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400 ring-2 ring-emerald-500/30 shadow-sm shadow-emerald-500/20'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
              }`}
              title="تحديد صعود 10% فوق السعر الحالي"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+10%</span>
            </button>
            <button
              type="button"
              onClick={() => applyPercentageShortcut(-5)}
              className={`py-1.5 px-2 rounded-xl border flex items-center justify-center gap-1 transition-all ${
                selectedPercentage === -5
                  ? 'bg-rose-500/30 text-rose-300 border-rose-400 ring-2 ring-rose-500/30 shadow-sm shadow-rose-500/20'
                  : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-400'
              }`}
              title="تحديد هبوط 5% أسفل السعر الحالي"
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>-5%</span>
            </button>
          </div>
        </div>

        {/* Target Price Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Condition selector */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-950/70 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setCondition('ABOVE_PRICE');
                setSelectedPercentage(null);
              }}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                condition === 'ABOVE_PRICE'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>صعود أعلى من (≥)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCondition('BELOW_PRICE');
                setSelectedPercentage(null);
              }}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                condition === 'BELOW_PRICE'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>هبوط أدنى من (≤)</span>
            </button>
          </div>

          {/* Price input & preview */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
              <span>السعر المستهدف للتنبيه:</span>
              {pctDiff && (
                <span
                  className={`font-mono text-[11px] ${
                    parseFloat(pctDiff) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  فارق {parseFloat(pctDiff) >= 0 ? '+' : ''}
                  {pctDiff}%
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={targetPrice}
                onChange={(e) => {
                  setTargetPrice(e.target.value);
                  setSelectedPercentage(null);
                  setErrorMessage(null);
                }}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-3 py-2 text-white font-mono text-sm text-left pl-14 transition-colors"
                placeholder="0.00"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                ج.م
              </span>
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ملاحظة سريعة (اختياري: مثلاً نقطة مقاومة، وقف خسارة...)"
              maxLength={60}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-slate-600 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Save Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              saveSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-900/30'
            }`}
          >
            {isSubmitting ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>تم حفظ التنبيه بنجاح!</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>حفظ التنبيه لهذا السهم</span>
              </>
            )}
          </button>
        </form>

        {/* Existing Alerts for this specific stock */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>تنبيهات السهم المسجلة:</span>
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
              {stockAlerts.length}
            </span>
          </div>

          {stockAlerts.length === 0 ? (
            <div className="py-3 px-2 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center text-slate-500 text-xs">
              لا توجد تنبيهات سابقة لهذا السهم. حدد السعر واضغط "حفظ التنبيه" بالأعلى.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
              {stockAlerts.map((alert) => {
                const isAbove = alert.condition === 'ABOVE_PRICE';
                const distPct =
                  stock.price > 0
                    ? (((alert.targetValue - stock.price) / stock.price) * 100).toFixed(1)
                    : null;

                return (
                  <div
                    key={alert.id}
                    className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                      alert.isActive
                        ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-950/30 border-slate-800/40 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          alert.isActive ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-1 py-0.2 rounded border ${
                              isAbove
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {isAbove ? '≥ أعلى من' : '≤ أدنى من'}
                          </span>
                          <span className="font-mono font-bold text-xs text-white">
                            {alert.targetValue.toFixed(2)} ج.م
                          </span>
                        </div>
                        {distPct && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            يبعد {parseFloat(distPct) >= 0 ? '+' : ''}
                            {distPct}% عن السعر الحالي
                          </div>
                        )}
                        {alert.note && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[170px] mt-0.5">
                            {alert.note}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Active/Inactive Toggle */}
                      <button
                        type="button"
                        onClick={() => onToggleAlert(alert.id, alert.isActive)}
                        className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                          alert.isActive
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                            : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300'
                        }`}
                        title={alert.isActive ? 'إيقاف التنبيه مؤقتاً' : 'تفعيل التنبيه'}
                      >
                        <Power className="w-3 h-3" />
                      </button>

                      {/* Delete alert */}
                      <button
                        type="button"
                        onClick={() => onDeleteAlert(alert.id)}
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/80 hover:border-rose-500/30 transition-all"
                        title="حذف هذا التنبيه"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* User login / guest notice */}
        <div className="pt-2 text-[10px] text-slate-500 border-t border-slate-800/60 flex items-center justify-between">
          <span>
            {isLoggedIn ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" />
                متصل ومحفوظ سحابياً في حسابك
              </span>
            ) : (
              <span>محفوظ محلياً على جهازك</span>
            )}
          </span>
          {!isLoggedIn && onOpenAuthModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuthModal();
              }}
              className="text-amber-400 hover:underline flex items-center gap-1 font-bold"
            >
              <LogIn className="w-3 h-3" />
              <span>تسجيل الدخول للمزامنة</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
