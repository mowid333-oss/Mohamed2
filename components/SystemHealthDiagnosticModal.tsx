import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Wrench,
  CheckCircle2,
  Clock,
  Activity,
  Cpu,
  Database,
  Radio,
  Volume2,
  Users,
  HardDrive,
  Calendar,
  Sparkles,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { EGXStock } from '../types/stock';
import {
  SystemHealthReport,
  HealthCheckItem,
  runFullSystemDiagnostics,
  autoRepairSystem,
  getHealthCheckIntervalSec,
  setHealthCheckIntervalSec,
} from '../services/systemHealthService';

interface SystemHealthDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: SystemHealthReport | null;
  stocks: EGXStock[];
  onRefreshReport: (newReport: SystemHealthReport) => void;
  countdownSeconds: number;
  autoCheckInterval: number;
  onIntervalChange: (newIntervalSec: number) => void;
}

export const SystemHealthDiagnosticModal: React.FC<SystemHealthDiagnosticModalProps> = ({
  isOpen,
  onClose,
  report,
  stocks,
  onRefreshReport,
  countdownSeconds,
  autoCheckInterval,
  onIntervalChange,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairedActions, setRepairedActions] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !report) return null;

  const handleRunScan = async () => {
    setIsScanning(true);
    setRepairedActions([]);
    try {
      const res = await runFullSystemDiagnostics(stocks);
      onRefreshReport(res);
    } catch (e) {
      console.error('Diagnostic error:', e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleRunRepair = async () => {
    setIsRepairing(true);
    try {
      const { repairedActionsAr, refreshedReport } = await autoRepairSystem(stocks);
      setRepairedActions(repairedActionsAr);
      onRefreshReport(refreshedReport);
    } catch (e) {
      console.error('Repair error:', e);
    } finally {
      setIsRepairing(false);
    }
  };

  const handleCopyReport = () => {
    const lines = [
      `تقرير فحص سلامة نظام رادار البورصة المصرية (EGX Radar):`,
      `• التاريخ والوقت: ${report.timestamp}`,
      `• درجة السلامة العامة: ${report.overallScore}% (${report.statusLabelAr})`,
      `• زمن دورة الفحص: ${report.executionDurationMs} مللي ثانية`,
      `• الفحوصات الناجحة: ${report.passedCount} من ${report.totalChecks}`,
      `----------------------------------------------------`,
      ...report.checks.map(
        (c, idx) =>
          `${idx + 1}. [${c.status === 'PASS' ? 'سليم' : c.status === 'WARN' ? 'تنبيه' : 'فشل'}] ${c.nameAr} (${c.responseTimeMs}ms): ${c.messageAr}`
      ),
      `----------------------------------------------------`,
      `تم الفحص والإصلاح الفوري بنجاح.`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryIcon = (cat: HealthCheckItem['category']) => {
    switch (cat) {
      case 'FEED':
        return <Radio className="w-4 h-4 text-cyan-400" />;
      case 'DATABASE':
        return <Database className="w-4 h-4 text-emerald-400" />;
      case 'INDICATORS':
        return <Cpu className="w-4 h-4 text-indigo-400" />;
      case 'AUDIO':
        return <Volume2 className="w-4 h-4 text-amber-400" />;
      case 'INVESTOR_FLOWS':
        return <Users className="w-4 h-4 text-teal-400" />;
      case 'STORAGE':
        return <HardDrive className="w-4 h-4 text-purple-400" />;
      case 'SCHEDULE':
        return <Calendar className="w-4 h-4 text-blue-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const minutesUntilNext = Math.floor(countdownSeconds / 60);
  const secondsRemainder = countdownSeconds % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-hidden font-['Cairo']">
      <div className="relative w-full max-w-4xl h-[92vh] max-h-[880px] bg-[#0b0f17] border border-cyan-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-[#0a1524] to-cyan-950/70 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/25 shrink-0">
              <div className="w-full h-full bg-[#070a0f] rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>فحص سلامة النظام والإصلاح الفوري</span>
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                  Auto-Check: 30 Mins Default
                </span>
              </div>
              <p className="text-xs text-slate-400">
                مراقبة شاملة لكافة محاور النظام مع الإصلاح الذاتي الفوري لأي خلل أو تجميد
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              title="نسخ تقرير الفحص للحافظة"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Master Score & Auto-Healing Action Banner */}
        <div className="p-4 sm:p-5 bg-slate-900/90 border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-cyan-500/40 flex flex-col items-center justify-center shrink-0 shadow-inner">
              <span className={`text-2xl font-black font-mono ${
                report.overallScore >= 90 ? 'text-emerald-400' : report.overallScore >= 70 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {report.overallScore}%
              </span>
              <span className="text-[9px] text-slate-400 font-bold">درجة الصحة</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-base font-black ${
                  report.overallScore >= 90 ? 'text-emerald-300' : report.overallScore >= 70 ? 'text-amber-300' : 'text-rose-300'
                }`}>
                  {report.statusLabelAr}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap font-mono">
                <span>آخر فحص: <strong className="text-white">{report.timestamp}</strong></span>
                <span>•</span>
                <span>زمن الفحص: <strong className="text-cyan-300">{report.executionDurationMs}ms</strong></span>
                <span>•</span>
                <span>الناجح: <strong className="text-emerald-400">{report.passedCount}/{report.totalChecks}</strong></span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Run Scan Now & Instant Auto-Repair */}
          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap justify-end">
            <button
              onClick={handleRunScan}
              disabled={isScanning || isRepairing}
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all border border-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin text-cyan-400' : 'text-slate-300'}`} />
              <span>{isScanning ? 'جاري الفحص...' : 'إعادة الفحص الآن'}</span>
            </button>
            <button
              onClick={handleRunRepair}
              disabled={isRepairing || isScanning}
              className="flex-1 md:flex-initial px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Wrench className={`w-4 h-4 ${isRepairing ? 'animate-spin' : ''}`} />
              <span>{isRepairing ? 'جاري الإصلاح الشامل...' : 'إصلاح فوري شامل للنظام'}</span>
            </button>
          </div>
        </div>

        {/* Schedule & Auto-Check Settings Strip */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>الفحص والإصلاح الدوري التلقائي كل:</span>
            <select
              value={autoCheckInterval}
              onChange={(e) => onIntervalChange(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-cyan-300 font-bold rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value={5 * 60}>5 دقائق (مكثف)</option>
              <option value={15 * 60}>15 دقيقة</option>
              <option value={30 * 60}>30 دقيقة (الافتراضي الموصى به)</option>
              <option value={60 * 60}>1 ساعة</option>
              <option value={0}>يدوي فقط</option>
            </select>
          </div>
          {autoCheckInterval > 0 ? (
            <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
              <span className="hidden sm:inline">الفحص الذاتي القادم خلال:</span>
              <span className="font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                {String(minutesUntilNext).padStart(2, '0')}:{String(secondsRemainder).padStart(2, '0')}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-950/70 text-cyan-300 border border-cyan-800 font-sans font-bold">
                إصلاح آلي عند &lt; 90% ⚡
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-amber-400 font-bold">الفحص الآلي معطّل (يعمل يدوياً فقط)</span>
          )}
        </div>

        {/* Repaired Actions Callout if any */}
        {repairedActions.length > 0 && (
          <div className="mx-4 mt-3 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 shadow-md space-y-1.5 text-xs text-emerald-200 animate-fadeIn">
            <div className="font-bold flex items-center gap-1.5 text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
              <span>تم تنفيذ عمليات الإصلاح الذاتي التالية بنجاح:</span>
            </div>
            {repairedActions.map((act, i) => (
              <div key={i} className="flex items-start gap-1.5 text-slate-200">
                <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                <span>{act}</span>
              </div>
            ))}
          </div>
        )}

        {/* Test Items Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-1">
            <span>محاور فحص واختبار السلامة (7 محاور حيوية):</span>
            <span>الحالة وزمن الاستجابة</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.checks.map((chk) => {
              const isPass = chk.status === 'PASS';
              const isWarn = chk.status === 'WARN';
              const isFail = chk.status === 'FAIL';

              return (
                <div
                  key={chk.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isPass
                      ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                      : isWarn
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-rose-950/25 border-rose-500/50'
                  } space-y-2.5`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                        {getCategoryIcon(chk.category)}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
                          {chk.nameAr}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          {chk.nameEn}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[11px] shrink-0">
                      <span className="text-slate-400">{chk.responseTimeMs}ms</span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          isPass
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : isWarn
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {isPass ? 'سليم' : isWarn ? 'تنبيه' : 'فشل'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {chk.messageAr}
                  </p>

                  {chk.technicalDetails && (
                    <div className="text-[10px] font-mono text-slate-400 bg-slate-950/70 px-2.5 py-1 rounded-lg border border-slate-850 truncate">
                      {chk.technicalDetails}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            النظام مجهز بخوارزمية مراقبة واستشفاء فوري ذاتي لضمان دقة واستمرارية التداول.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
