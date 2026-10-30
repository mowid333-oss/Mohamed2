import React from 'react';
import { ShieldCheck, RefreshCw, Lock, Unlock, Timer, Sparkles } from 'lucide-react';
import { ReportLockState } from '../hooks/useReportLock';

interface ReportStabilityLockBarProps {
  lockState: ReportLockState;
  reportTitle?: string;
  isRefreshing?: boolean;
  className?: string;
  compact?: boolean;
}

export const ReportStabilityLockBar: React.FC<ReportStabilityLockBarProps> = ({
  lockState,
  reportTitle,
  isRefreshing = false,
  className = '',
  compact = false,
}) => {
  const {
    isLocked,
    remainingSeconds,
    progressPct,
    formattedTimeRemaining,
    triggerManualRefresh,
  } = lockState;

  if (compact) {
    return (
      <div
        dir="rtl"
        className={`flex items-center gap-2 bg-slate-950/80 px-2.5 py-1 rounded-xl border ${
          isLocked
            ? 'border-cyan-500/35 text-cyan-200'
            : 'border-slate-800 text-slate-400'
        } font-['Cairo'] text-xs shrink-0 ${className}`}
      >
        <div className="flex items-center gap-1.5">
          {isLocked ? (
            <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          ) : (
            <Unlock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          )}
          <span className="font-bold text-[11px] whitespace-nowrap">
            {isLocked ? 'مثبت (180ث)' : 'تحديث تلقائي'}
          </span>
        </div>

        {isLocked && (
          <span className="font-mono tabular-nums text-[11px] font-bold text-cyan-300 bg-cyan-950/90 px-1.5 py-0.2 rounded border border-cyan-800/50">
            {formattedTimeRemaining}
          </span>
        )}

        <button
          type="button"
          onClick={triggerManualRefresh}
          disabled={isRefreshing}
          className="p-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/35 text-cyan-300 hover:text-white border border-cyan-500/40 transition-colors disabled:opacity-50 cursor-pointer"
          title="تحديث فوري وتجاوز التثبيت"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className={`p-3 rounded-2xl border transition-all ${
        isLocked
          ? 'bg-gradient-to-r from-cyan-950/40 via-slate-950 to-teal-950/30 border-cyan-500/35 shadow-md shadow-cyan-950/30'
          : 'bg-slate-950/70 border-slate-800/80'
      } font-['Cairo'] text-xs space-y-2 ${className}`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Left: Lock Status & Countdown */}
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
              isLocked
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs">
                {isLocked
                  ? 'تقرير مثبت ومستقر لمنع الانقطاع (قفل 180 ثانية)'
                  : 'انتهت فترة القفل - استئناف التحديث التلقائي الدوري'}
              </span>
              {reportTitle && (
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                  [{reportTitle}]
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isLocked
                ? `البيانات ثابتة لضمان القراءة بتركيز دون وميض أو إعادة تحميل. متبقي: ${formattedTimeRemaining}`
                : 'التحديث التلقائي الدوري نشط مجدداً عند كل إشارة جديدة أو انتهاء المهلة.'}
            </p>
          </div>
        </div>

        {/* Right: Timer & Manual Refresh Action */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {isLocked && (
            <div className="flex items-center gap-1.5 font-mono tabular-nums text-xs font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-xl border border-cyan-700/50">
              <Timer className="w-3.5 h-3.5 text-cyan-400" />
              <span>{formattedTimeRemaining}</span>
            </div>
          )}

          <button
            type="button"
            onClick={triggerManualRefresh}
            disabled={isRefreshing}
            className="px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            title="تحديث فوري للتقرير وتجاوز مهلة الـ 180 ثانية"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>تحديث فوري 🔄</span>
          </button>
        </div>
      </div>

      {/* Visual Progress Bar (0% at lock -> 100% when 180s expires) */}
      <div className="space-y-1">
        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${
              isLocked
                ? 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400'
                : 'bg-slate-700'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>0 ثانية (بداية القراءة)</span>
          <span className="text-cyan-400/90 font-bold">
            {isLocked ? `متبقي ${remainingSeconds} ثانية` : 'تم انتهاء القفل 100%'}
          </span>
          <span>180 ثانية (3 دقائق)</span>
        </div>
      </div>
    </div>
  );
};
