import React, { useState, useMemo } from 'react';
import {
  Zap,
  X,
  Volume2,
  VolumeX,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Filter,
  BarChart2,
  FileSpreadsheet,
  Download,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { InstitutionalLiquidityAlert } from '../services/institutionalLiquidityAlertService';
import { EGXStock } from '../types/stock';
import { formatEgpMoney, formatVolume } from './StockTable';

interface LiveLiquidityAlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: InstitutionalLiquidityAlert[];
  stocks: EGXStock[];
  isSoundMuted: boolean;
  onToggleSound: () => void;
  onSelectStockForChart: (symbol: string) => void;
  onOpenReportModal?: (stock: EGXStock) => void;
  onOpenAdvisor?: (symbol: string) => void;
}

export const LiveLiquidityAlertsDrawer: React.FC<LiveLiquidityAlertsDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  stocks,
  isSoundMuted,
  onToggleSound,
  onSelectStockForChart,
  onOpenReportModal,
  onOpenAdvisor,
}) => {
  const [filterThreshold, setFilterThreshold] = useState<'ALL' | 'STRONG' | 'EXPLOSIVE'>('ALL');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'SHARIAH' | 'EGX30'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (filterThreshold === 'STRONG' && alert.rvol20 < 1.25) return false;
      if (filterThreshold === 'EXPLOSIVE' && alert.rvol20 < 1.75) return false;
      if (filterCategory === 'SHARIAH' && !alert.isShariahCompliant) return false;
      if (filterCategory === 'EGX30' && !alert.isInEgx30) return false;
      return true;
    });
  }, [alerts, filterThreshold, filterCategory]);

  const handleCopyAlert = (alert: InstitutionalLiquidityAlert) => {
    navigator.clipboard.writeText(alert.rawAlertText);
    setCopiedId(alert.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm animate-fadeIn font-['Cairo']">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-2xl h-full bg-[#070b13] border-r border-slate-800 shadow-2xl flex flex-col z-10 overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-[#0a1220] to-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold text-lg shadow-inner">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  رادار تدفق السيولة اللحظية المؤسسية
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {filteredAlerts.length} سهم نشط
                </span>
              </div>
              <p className="text-xs text-slate-400">
                رصد فوري للأسهم التي تجاوز حجم تداولها متوسط 20 يوم (دخول وتجميع مؤسسي)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              onClick={onToggleSound}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isSoundMuted
                  ? 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
              }`}
              title={isSoundMuted ? 'تفعيل الصوت عند رصد سيولة جديدة' : 'كتم النغمة الصوتية'}
            >
              {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              <span className="hidden sm:inline">{isSoundMuted ? 'صامت' : 'صوت الرادار'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap text-xs">
          {/* Threshold Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] text-slate-400 font-bold shrink-0">شدة القفزة:</span>
            <button
              onClick={() => setFilterThreshold('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterThreshold === 'ALL'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              الكل (تجاوز 100%+)
            </button>
            <button
              onClick={() => setFilterThreshold('STRONG')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterThreshold === 'STRONG'
                  ? 'bg-emerald-500 text-slate-950 font-black'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              دخول قوي (125%+)
            </button>
            <button
              onClick={() => setFilterThreshold('EXPLOSIVE')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterThreshold === 'EXPLOSIVE'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              انفجار استثنائي (175%+)
            </button>
          </div>

          {/* Index / Shariah Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setFilterCategory(filterCategory === 'SHARIAH' ? 'ALL' : 'SHARIAH')}
              className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                filterCategory === 'SHARIAH'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              أسهم الشريعة
            </button>
            <button
              onClick={() => setFilterCategory(filterCategory === 'EGX30' ? 'ALL' : 'EGX30')}
              className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                filterCategory === 'EGX30'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              EGX30
            </button>
          </div>
        </div>

        {/* Alerts List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {filteredAlerts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-400 space-y-2 mt-8">
              <Zap className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="font-bold text-sm text-slate-300">لم يتم رصد أسهم تتجاوز متوسط 20 يوم بالمعايير المختارة حالياً</p>
              <p className="text-xs text-slate-500">يقوم الرادار بمراقبة كافة الأسهم بصورة دورية كل 15 ثانية وينبهك فور تجاوز الأحجام لمتوسط 20 يوم.</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const matchedStock = stocks.find((s) => s.symbol === alert.symbol);
              const isCopied = copiedId === alert.id;

              return (
                <div
                  key={alert.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 hover:border-amber-500/40 transition-all shadow-md space-y-3"
                >
                  {/* Card Top: Stock Identity & Volume Spike Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-black text-amber-300 text-sm">
                        {alert.symbol}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{alert.nameAr}</h4>
                          {alert.isShariahCompliant && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                              شرعي
                            </span>
                          )}
                          {alert.isInEgx30 && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                              EGX30
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">{alert.sectorAr}</span>
                      </div>
                    </div>

                    <div className="text-left font-mono">
                      <div className="text-sm font-black text-white">{alert.price.toFixed(2)} ج.م</div>
                      <span
                        className={`text-xs font-bold ${
                          alert.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {alert.changePct >= 0 ? '+' : ''}{alert.changePct}%
                      </span>
                    </div>
                  </div>

                  {/* Volume Metric Highlights */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 font-sans block">حجم التداول اليوم:</span>
                      <strong className="text-white font-bold">{alert.currentVolume.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-sans block">متوسط 20 يوم (ADV):</span>
                      <span className="text-slate-300">{alert.avgVolume20Day.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-300 font-sans block">معامل التجاوز RVOL:</span>
                      <strong className="text-amber-400 font-black">{alert.rvol20}x (+{alert.spikePct}%)</strong>
                    </div>
                  </div>

                  {/* Progress Bar of Volume vs 20-Day Average */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>تجاوز الحجم اليومي: {alert.rvol20}x</span>
                      <span>{alert.intensityLabelAr}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (alert.rvol20 / 2.5) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Direction & Institutional Interpretation */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-850 flex-wrap gap-1">
                    <span className="text-slate-300 font-semibold flex items-center gap-1">
                      <span>اتجاه التدفق:</span>
                      <strong className="text-emerald-300">{alert.flowDirectionAr}</strong>
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      صافي السيولة: {alert.estimatedNetInstitutionalInflowEgp >= 0 ? '+' : ''}{formatEgpMoney(alert.estimatedNetInstitutionalInflowEgp)}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-850 gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          onSelectStockForChart(alert.symbol);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/30 text-blue-300 text-xs font-bold transition-colors flex items-center gap-1"
                        title="فتح الشارت اللحظي"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span>الشارت</span>
                      </button>

                      {matchedStock && onOpenReportModal && (
                        <button
                          onClick={() => {
                            onOpenReportModal(matchedStock);
                            onClose();
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/30 text-teal-300 text-xs font-bold transition-colors flex items-center gap-1"
                          title="عرض التقرير الشامل 360°"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>تقرير 360°</span>
                        </button>
                      )}

                      {onOpenAdvisor && (
                        <button
                          onClick={() => {
                            onOpenAdvisor(alert.symbol);
                            onClose();
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold transition-colors"
                        >
                          🤖 المستشار
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => handleCopyAlert(alert)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      title="نسخ بيانات التنبيه كاملة"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-400">
          <span>يتم تحديث متوسط 20 يوم آلياً وفق تعاملات جلسة البورصة المصرية • إجمالي السيولة الإيجابية تدعم قرارات الدخول المؤسسي</span>
        </div>
      </div>
    </div>
  );
};
