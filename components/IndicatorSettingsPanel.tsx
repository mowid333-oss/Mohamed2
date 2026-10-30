import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Sparkles,
  Zap,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Activity,
  ShieldAlert,
  ShieldCheck,
  Info,
  Clock,
  ArrowRight,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  IndicatorSettings,
  getStoredIndicatorSettings,
  saveIndicatorSettings,
  resetIndicatorSettings,
  DEFAULT_INDICATOR_SETTINGS,
  PRESET_FAST_SCALPING,
  PRESET_CONSERVATIVE_SWING,
} from '../services/indicatorSettingsService';
import { playBuySignalSound, playSellSignalSound } from '../services/soundAlerts';

interface IndicatorSettingsPanelProps {
  onApplied?: () => void;
  className?: string;
}

export const IndicatorSettingsPanel: React.FC<IndicatorSettingsPanelProps> = ({
  onApplied,
  className = '',
}) => {
  const [settings, setSettings] = useState<IndicatorSettings>(getStoredIndicatorSettings());
  const [justApplied, setJustApplied] = useState(false);

  // Sync if updated externally
  useEffect(() => {
    setSettings(getStoredIndicatorSettings());
  }, []);

  const handleApply = (newSettings?: IndicatorSettings) => {
    const toSave = newSettings || settings;
    saveIndicatorSettings(toSave);
    setSettings(toSave);
    setJustApplied(true);
    if (onApplied) onApplied();
    setTimeout(() => setJustApplied(false), 3000);
  };

  const handleApplyPreset = (preset: IndicatorSettings) => {
    handleApply(preset);
  };

  const handleReset = () => {
    const def = resetIndicatorSettings();
    setSettings(def);
    setJustApplied(true);
    if (onApplied) onApplied();
    setTimeout(() => setJustApplied(false), 3000);
  };

  // Determine sensitivity description
  const isFast = settings.superTrend.length < 10 || settings.macd.fastLength < 12;
  const isConservative = settings.superTrend.length > 10 || settings.macd.slowLength > 26;

  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-5 text-right font-['Cairo'] ${className}`}>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-white text-base flex items-center gap-2">
              <span>إعدادات حساسية الماكدي والسوبر ترند</span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                Real-Time Chart Sync ⚡
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              تحكم بدقة في سرعة التقاط إشارات الشراء والبيع وتطبيقها لحظياً على شارت TradingView
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-center cursor-pointer"
          title="استعادة القيم القياسية (10, 3.0 للسوبر ترند و 12, 26, 9 للماكدي)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>استعادة الافتراضي 🔄</span>
        </button>
      </div>

      {/* Quick Sensitivity Preset Buttons */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>القوالب الجاهزة للحساسية والسرعة:</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Preset 1: Fast Scalping */}
          <button
            type="button"
            onClick={() => handleApplyPreset(PRESET_FAST_SCALPING)}
            className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
              settings.sensitivityPreset === 'FAST'
                ? 'bg-amber-950/40 border-amber-500 text-amber-300 ring-1 ring-amber-500/50 shadow-md shadow-amber-950/30'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <strong className="text-xs font-bold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>مضاربة لحظية سريعة ⚡</span>
              </strong>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                خاطف (Scalp)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              سوبر ترند (7, 2.0) + ماكدي (6, 13, 5) لإشارات مبكرة جداً واقتناص الارتدادات السريعة.
            </p>
          </button>

          {/* Preset 2: Standard Default */}
          <button
            type="button"
            onClick={() => handleApplyPreset(DEFAULT_INDICATOR_SETTINGS)}
            className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
              settings.sensitivityPreset === 'STANDARD'
                ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500/50 shadow-md shadow-cyan-950/30'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <strong className="text-xs font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>الافتراضي المتوازن ⚖️</span>
              </strong>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                القياسي (Standard)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              سوبر ترند (10, 3.0) + ماكدي (12, 26, 9) توازن ذهبي يجمع بين دقة الإشارة وفلترة التذبذب.
            </p>
          </button>

          {/* Preset 3: Conservative Swing */}
          <button
            type="button"
            onClick={() => handleApplyPreset(PRESET_CONSERVATIVE_SWING)}
            className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
              settings.sensitivityPreset === 'CONSERVATIVE'
                ? 'bg-purple-950/40 border-purple-500 text-purple-300 ring-1 ring-purple-500/50 shadow-md shadow-purple-950/30'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <strong className="text-xs font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>سوينج واستثمار محافظ 🛡️</span>
              </strong>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                هادئ (Swing)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              سوبر ترند (14, 4.0) + ماكدي (19, 39, 9) لفلترة الإشارات الكاذبة ومواكبة الموجات الكبرى.
            </p>
          </button>
        </div>
      </div>

      {/* Main Dual Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ========================================= */}
        {/* SECTION 1: SuperTrend Fine Tuning         */}
        {/* ========================================= */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>مؤشر السوبر ترند (SuperTrend):</span>
            </span>
            <span className="font-mono text-xs font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              {settings.superTrend.length} , {settings.superTrend.multiplier.toFixed(1)}
            </span>
          </div>

          {/* SuperTrend Length Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">فترة الـ ATR / الطول (Period Length):</span>
              <span className="font-mono text-white font-bold">{settings.superTrend.length}</span>
            </div>
            <input
              type="range"
              min={5}
              max={30}
              step={1}
              value={settings.superTrend.length}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  superTrend: { ...settings.superTrend, length: Number(e.target.value) },
                  sensitivityPreset: 'CUSTOM',
                })
              }
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>5 (سريع جداً)</span>
              <span>10 (افتراضي)</span>
              <span>30 (بطيء ممتد)</span>
            </div>
          </div>

          {/* SuperTrend Multiplier Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">معامل الضرب (ATR Multiplier):</span>
              <span className="font-mono text-white font-bold">{settings.superTrend.multiplier.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={1.0}
              max={6.0}
              step={0.1}
              value={settings.superTrend.multiplier}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  superTrend: { ...settings.superTrend, multiplier: Number(e.target.value) },
                  sensitivityPreset: 'CUSTOM',
                })
              }
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>1.0x (حساس لصيق)</span>
              <span>3.0x (افتراضي)</span>
              <span>6.0x (هامش أمان واسع)</span>
            </div>
          </div>
        </div>

        {/* ========================================= */}
        {/* SECTION 2: MACD Fine Tuning               */}
        {/* ========================================= */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>مؤشر الماكدي (MACD):</span>
            </span>
            <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
              {settings.macd.fastLength} , {settings.macd.slowLength} , {settings.macd.signalLength}
            </span>
          </div>

          {/* MACD Fast Length */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">المتوسط السريع (Fast Length):</span>
              <span className="font-mono text-white font-bold">{settings.macd.fastLength}</span>
            </div>
            <input
              type="range"
              min={4}
              max={24}
              step={1}
              value={settings.macd.fastLength}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  macd: { ...settings.macd, fastLength: Number(e.target.value) },
                  sensitivityPreset: 'CUSTOM',
                })
              }
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>4</span>
              <span>12 (افتراضي)</span>
              <span>24</span>
            </div>
          </div>

          {/* MACD Slow Length */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">المتوسط البطيء (Slow Length):</span>
              <span className="font-mono text-white font-bold">{settings.macd.slowLength}</span>
            </div>
            <input
              type="range"
              min={14}
              max={50}
              step={1}
              value={settings.macd.slowLength}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  macd: { ...settings.macd, slowLength: Number(e.target.value) },
                  sensitivityPreset: 'CUSTOM',
                })
              }
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>14</span>
              <span>26 (افتراضي)</span>
              <span>50</span>
            </div>
          </div>

          {/* MACD Signal Smoothing */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">متوسط خط الإشارة (Signal Smoothing):</span>
              <span className="font-mono text-white font-bold">{settings.macd.signalLength}</span>
            </div>
            <input
              type="range"
              min={3}
              max={18}
              step={1}
              value={settings.macd.signalLength}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  macd: { ...settings.macd, signalLength: Number(e.target.value) },
                  sensitivityPreset: 'CUSTOM',
                })
              }
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>3</span>
              <span>9 (افتراضي)</span>
              <span>18</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sound Alerts Settings (التنبيهات الصوتية لإشارات الشراء والبيع) */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${settings.soundAlertsEnabled ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
              {settings.soundAlertsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">التنبيهات الصوتية الحية لإشارات الشراء والبيع:</span>
                <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${settings.soundAlertsEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'}`}>
                  {settings.soundAlertsEnabled ? 'مفعلة 🔔' : 'مكتومة 🔇'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                تشغيل رنين متصاعد مميز عند إشارة الشراء ونغمة تحذيرية واضحة عند إشارة البيع اللحظية على الشارت.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {/* Toggle switch */}
            <button
              type="button"
              onClick={() => {
                const nextState = !settings.soundAlertsEnabled;
                setSettings({ ...settings, soundAlertsEnabled: nextState });
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                settings.soundAlertsEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              {settings.soundAlertsEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
              <span>{settings.soundAlertsEnabled ? 'الصوت مفعّل' : 'الصوت مكتوم'}</span>
            </button>
          </div>
        </div>

        {/* Sound test buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 text-xs flex-wrap">
          <span className="text-[10px] text-slate-400 font-bold">تجربة نغمات الإشارات:</span>
          <button
            type="button"
            onClick={() => playBuySignalSound()}
            className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
          >
            <span>تجربة صوت الشراء 🟢</span>
          </button>
          <button
            type="button"
            onClick={() => playSellSignalSound()}
            className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
          >
            <span>تجربة صوت البيع 🔴</span>
          </button>
        </div>
      </div>

      {/* Sensitivity Evaluation Badge */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-slate-300 font-sans">
            طبيعة الإشارات الحالية:
            {isFast ? (
              <strong className="text-amber-300 font-bold mr-1">
                حساسة وسريعة تلتقط نقاط الدخول والخروج المبكرة مع هامش أعلى للذبذبة.
              </strong>
            ) : isConservative ? (
              <strong className="text-purple-300 font-bold mr-1">
                محافظة ومفلترة تركز على الاتجاهات الصلبة وتبتعد عن الفخاخ السعرية.
              </strong>
            ) : (
              <strong className="text-emerald-300 font-bold mr-1">
                متوازنة قياسية معتمدة تناسب معظم جلسات التداول بالبورصة المصرية.
              </strong>
            )}
          </span>
        </div>

        <div className="font-mono text-[11px] text-slate-400 shrink-0">
          ST: {settings.superTrend.length}/{settings.superTrend.multiplier.toFixed(1)} | MACD: {settings.macd.fastLength}/{settings.macd.slowLength}/{settings.macd.signalLength}
        </div>
      </div>

      {/* Action Footer & Real-Time Apply Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          {justApplied ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              <span>تم حفظ الإعدادات وتطبيقها وتحديث شارت TradingView لحظياً بنجاح! ⚡</span>
            </span>
          ) : (
            <span>التغييرات يتم حفظها وتطبيقها تلقائياً على الشارت ومحرك الإشارات فور الضغط.</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleApply()}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer transition-all"
        >
          <Zap className="w-4 h-4 text-slate-950" />
          <span>تطبيق وحفظ فوري على الشارت ⚡</span>
        </button>
      </div>
    </div>
  );
};
