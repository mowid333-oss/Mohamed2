import React, { useState } from 'react';
import {
  Bell,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  LogOut,
  Zap,
  TrendingUp,
  TrendingDown,
  Volume2,
  VolumeX,
  ShieldCheck,
  Power,
  RotateCcw,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { EGXStock } from '../types/stock';
import { IndicatorSettingsPanel } from './IndicatorSettingsPanel';
import { CopyableStockSymbol } from './CopyableStockSymbol';
import {
  FirestoreUserAlert,
  saveUserAlert,
  toggleAlertStatus,
  deleteUserAlert,
} from '../services/userFirestoreService';
import { signInWithGoogle, logOut } from '../services/firebase';
import {
  playBullishAlertSound,
  playWarningAlertSound,
  playSonarPingSound,
} from '../services/soundAlerts';

interface AlertsManagerTabProps {
  currentUser: User | null;
  alerts: FirestoreUserAlert[];
  stocks: EGXStock[];
  selectedSymbol: string;
  onSelectStock: (symbol: string) => void;
}

export const AlertsManagerTab: React.FC<AlertsManagerTabProps> = ({
  currentUser,
  alerts,
  stocks,
  selectedSymbol,
  onSelectStock,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'ALERTS' | 'INDICATOR_SETTINGS'>('ALERTS');
  const [formSymbol, setFormSymbol] = useState(selectedSymbol || 'TMGH');
  const [formCondition, setFormCondition] = useState<FirestoreUserAlert['condition']>('ABOVE_PRICE');
  const [formTargetValue, setFormTargetValue] = useState<number>(100);
  const [formNote, setFormNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const currentStock = stocks.find((s) => s.symbol === formSymbol) || stocks[0];

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSaving(true);
    try {
      await saveUserAlert(currentUser.uid, {
        symbol: formSymbol,
        stockNameAr: currentStock?.nameAr || formSymbol,
        condition: formCondition,
        targetValue: formTargetValue,
        currentPriceWhenCreated: currentStock?.price || 0,
        isActive: true,
        isTriggered: false,
        note: formNote.trim(),
      });
      if (soundEnabled) playSonarPingSound();
      setIsAdding(false);
      setFormNote('');
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const getConditionLabel = (cond: FirestoreUserAlert['condition']) => {
    switch (cond) {
      case 'ABOVE_PRICE':
        return 'صعود السعر أعلى من (ج.م)';
      case 'BELOW_PRICE':
        return 'هبوط السعر أدنى من (ج.م)';
      case 'CHANGE_UP_PCT':
        return 'ارتفاع يومي يتجاوز %';
      case 'CHANGE_DOWN_PCT':
        return 'هبوط يومي يتجاوز %';
      case 'VOLUME_SPIKE':
        return 'قفزة غير اعتيادية في السيولة';
      case 'SHARIAH_EVENT':
        return 'تغير في تصنيف التوافق الشرعي';
      default:
        return cond;
    }
  };

  // Evaluate which alerts are triggered based on live prices
  const triggeredAlerts = alerts.filter((al) => {
    const stk = stocks.find((s) => s.symbol === al.symbol);
    if (!stk || !al.isActive) return false;
    if (al.condition === 'ABOVE_PRICE') return stk.price >= al.targetValue;
    if (al.condition === 'BELOW_PRICE') return stk.price <= al.targetValue;
    if (al.condition === 'CHANGE_UP_PCT') return stk.changePct >= al.targetValue;
    if (al.condition === 'CHANGE_DOWN_PCT') return stk.changePct <= -Math.abs(al.targetValue);
    if (al.condition === 'VOLUME_SPIKE') return (stk.valueTraded || 0) >= al.targetValue * 1_000_000;
    return false;
  });

  return (
    <div className="space-y-6 font-['Cairo']">
      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20 shrink-0">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  مركز التنبيهات وإشارات السوق المخصصة
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                  Firestore Real-time Rules
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                حدد مستويات الأسعار، قفزات السيولة، وأحداث الشريعة الإسلامية لتلقي إشعارات لحظية مع أصوات تنبيهية ومزامنة سحابية.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-end">
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playBullishAlertSound();
              }}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                soundEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundEnabled ? 'التنبيه الصوتي مفعّل' : 'صامت'}</span>
            </button>

            {currentUser ? (
              <button
                onClick={() => setIsAdding(!isAdding)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{isAdding ? 'إلغاء' : 'إضافة تنبيه جديد'}</span>
              </button>
            ) : (
              <button
                onClick={() => signInWithGoogle()}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-white/10 transition-all"
              >
                <LogIn className="w-4 h-4 text-rose-500" />
                <span>تسجيل الدخول بحساب Google</span>
              </button>
            )}
          </div>
        </div>

        {/* User Identity Info Strip */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>
                الحساب المتصل:{' '}
                <strong className="text-white font-mono">{currentUser.email}</strong>
              </span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-300">
                مزامنة Firestore نشطة
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>سجل الدخول بحساب Google لحفظ التنبيهات دائماً ومزامنتها على السحابة</span>
            </div>
          )}

          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>التنبيهات النشطة: <strong className="text-cyan-300">{alerts.length}</strong></span>
            <span>المنفذة اليوم: <strong className="text-emerald-400">{triggeredAlerts.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation: Alerts List vs Indicator Sensitivity Settings */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveSubTab('ALERTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'ALERTS'
              ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>تنبيهات الأسعار والسيولة ({alerts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('INDICATOR_SETTINGS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'INDICATOR_SETTINGS'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span>إعدادات حساسية الماكدي والسوبر ترند للشارت ⚙️</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
            تطبيق لحظي ⚡
          </span>
        </button>
      </div>

      {/* When Indicator Settings tab is active */}
      {activeSubTab === 'INDICATOR_SETTINGS' ? (
        <IndicatorSettingsPanel />
      ) : (
        <>
          {/* Add Alert Form */}
          {currentUser && isAdding && (
            <form
              onSubmit={handleCreateAlert}
              className="p-5 rounded-2xl bg-[#0a0e17] border border-cyan-500/40 space-y-4 shadow-2xl animate-fadeIn"
            >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-white text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>ضبط شرط تنبيه فني وسعري جديد:</span>
            </span>
            <span className="text-xs text-cyan-300 font-mono">
              سعر {currentStock?.symbol} الحالي: {currentStock?.price.toFixed(2)} ج.م
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Stock */}
            <div className="space-y-1">
              <label className="text-slate-400 block font-bold">السهم المراد مراقبته:</label>
              <select
                value={formSymbol}
                onChange={(e) => {
                  setFormSymbol(e.target.value);
                  const s = stocks.find((x) => x.symbol === e.target.value);
                  if (s) setFormTargetValue(Number((s.price * 1.05).toFixed(2)));
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold font-mono focus:outline-none focus:border-cyan-500"
              >
                {stocks.map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol} - {s.nameAr}
                  </option>
                ))}
              </select>
            </div>

            {/* Condition */}
            <div className="space-y-1">
              <label className="text-slate-400 block font-bold">نوع الشرط الفني:</label>
              <select
                value={formCondition}
                onChange={(e) => setFormCondition(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
              >
                <option value="ABOVE_PRICE">صعود السعر أعلى من (ج.م)</option>
                <option value="BELOW_PRICE">هبوط السعر أدنى من (ج.م)</option>
                <option value="CHANGE_UP_PCT">ارتفاع يومي يتجاوز %</option>
                <option value="CHANGE_DOWN_PCT">هبوط يومي يتجاوز %</option>
                <option value="VOLUME_SPIKE">قفزة سيولة (مليون ج.م)</option>
                <option value="SHARIAH_EVENT">تحديث بالموقف الشرعي</option>
              </select>
            </div>

            {/* Target Value */}
            <div className="space-y-1">
              <label className="text-slate-400 block font-bold">القيمة المستهدفة:</label>
              <input
                type="number"
                step="0.05"
                value={formTargetValue}
                onChange={(e) => setFormTargetValue(parseFloat(e.target.value) || 0)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 block font-bold text-xs">
              ملاحظة التداول أو الرأي الفني:
            </label>
            <input
              type="text"
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              placeholder="مثال: اختراق المقاومة التاريخية - الدخول بهدف +8%"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-md transition-all disabled:opacity-50"
            >
              {isSaving ? 'جاري الحفظ في Firestore...' : 'تثبيت التنبيه'}
            </button>
          </div>
        </form>
      )}

      {/* Triggered Live Alerts Alert Box */}
      {triggeredAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 to-slate-950 border-2 border-amber-500/50 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span>إشارات فنية وتنبيهات تم تحقيقها لحظياً بالسوق:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {triggeredAlerts.map((al) => {
              const stk = stocks.find((s) => s.symbol === al.symbol);
              return (
                <div
                  key={al.id}
                  onClick={() => onSelectStock(al.symbol)}
                  className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/40 cursor-pointer hover:border-amber-400 transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <CopyableStockSymbol symbol={al.symbol} size="sm" />
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold">
                        متحقق الآن!
                      </span>
                    </div>
                    <span className="text-xs text-slate-300 mt-0.5 block">
                      {getConditionLabel(al.condition)} {al.targetValue}
                    </span>
                  </div>
                  <div className="text-left font-mono tabular-nums">
                    <strong className="text-amber-300 text-sm">{stk?.price.toFixed(2)} ج.م</strong>
                    <span className="text-[11px] text-slate-400 block font-sans">اضغط للعرض</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Alerts Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <h3 className="font-bold text-white text-sm">قائمة التنبيهات المراقبة ({alerts.length}):</h3>
          <span>مزامنة مباشرة عبر Google Firestore</span>
        </div>

        {alerts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 space-y-2">
            <Bell className="w-10 h-10 text-slate-600 mx-auto opacity-50" />
            <p className="font-bold text-sm text-slate-300">لم تقم بإضافة تنبيهات حتى الآن</p>
            <p className="text-xs text-slate-500">
              {currentUser
                ? 'اضغط على زر "إضافة تنبيه جديد" بالأعلى لبرمجة إشاراتك الفنية والسعرية الخاصة.'
                : 'قم بتسجيل الدخول بحساب Google أولاً لتفعيل وحفظ التنبيهات.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {alerts.map((al) => {
              const stock = stocks.find((s) => s.symbol === al.symbol);
              const currentP = stock?.price || 0;
              const isTriggered =
                (al.condition === 'ABOVE_PRICE' && currentP >= al.targetValue) ||
                (al.condition === 'BELOW_PRICE' && currentP <= al.targetValue);

              return (
                <div
                  key={al.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                    isTriggered
                      ? 'bg-amber-950/20 border-amber-500/50 shadow-md shadow-amber-500/10'
                      : al.isActive
                      ? 'bg-[#0a0e17] border-slate-800/90'
                      : 'bg-slate-950/40 border-slate-800/40 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <CopyableStockSymbol symbol={al.symbol} size="md" />
                        <span className="text-xs text-slate-400">({al.stockNameAr})</span>
                        {isTriggered && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold">
                            الهدف متحقق!
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-300 font-bold mt-1 block">
                        {getConditionLabel(al.condition)}: <strong className="text-cyan-300 font-mono">{al.targetValue}</strong>
                      </span>
                    </div>

                    <div className="text-left font-mono tabular-nums">
                      <span className="text-[10px] text-slate-500 block">السعر اللحظي</span>
                      <strong className="text-sm text-white">{currentP.toFixed(2)} ج.م</strong>
                    </div>
                  </div>

                  {al.note && (
                    <p className="text-xs text-slate-300 italic bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      "{al.note}"
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                    <button
                      onClick={() => onSelectStock(al.symbol)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>فتح الشارت الفني</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {currentUser && (
                        <>
                          <button
                            onClick={() => toggleAlertStatus(currentUser.uid, al.id, al.isActive)}
                            className={`p-1.5 rounded-lg border text-xs font-bold transition-colors ${
                              al.isActive
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-slate-800 text-slate-500 border-slate-700'
                            }`}
                            title={al.isActive ? 'إيقاف مؤقت' : 'تفعيل'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteUserAlert(currentUser.uid, al.id)}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                            title="حذف التنبيه"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};
