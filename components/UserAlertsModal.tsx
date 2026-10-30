import React, { useState } from 'react';
import {
  Bell,
  X,
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
  ShieldCheck,
  Power,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { EGXStock } from '../types/stock';
import { IndicatorSettingsPanel } from './IndicatorSettingsPanel';
import {
  FirestoreUserAlert,
  saveUserAlert,
  toggleAlertStatus,
  deleteUserAlert,
} from '../services/userFirestoreService';
import { signInWithGoogle, logOut } from '../services/firebase';

interface UserAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  alerts: FirestoreUserAlert[];
  stocks: EGXStock[];
  selectedSymbol: string;
}

export const UserAlertsModal: React.FC<UserAlertsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  alerts,
  stocks,
  selectedSymbol,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'ALERTS' | 'INDICATOR_SETTINGS'>('ALERTS');
  const [formSymbol, setFormSymbol] = useState(selectedSymbol || 'TMGH');
  const [formCondition, setFormCondition] = useState<FirestoreUserAlert['condition']>('ABOVE_PRICE');
  const [formTargetValue, setFormTargetValue] = useState<number>(100);
  const [formNote, setFormNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentStock = stocks.find((s) => s.symbol === formSymbol) || stocks[0];

  const handleGoogleLogin = async () => {
    setAuthError(null);
    try {
      const user = await signInWithGoogle();
      if (!user) {
        // User closed or dismissed the popup
        return;
      }
    } catch (e: any) {
      if (
        e?.code !== 'auth/popup-closed-by-user' &&
        e?.code !== 'auth/cancelled-popup-request' &&
        !e?.message?.includes('popup-closed-by-user')
      ) {
        console.error('Google Sign In error:', e);
        setAuthError(e.message || 'تعذر تسجيل الدخول عبر حساب جوجل، يرجى المحاولة مجدداً.');
      }
    }
  };

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
        return 'صعود السعر أعلى من';
      case 'BELOW_PRICE':
        return 'هبوط السعر أدنى من';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn font-['Cairo']">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>نظام التنبيهات المخصص للأسهم المصرية</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                  Firestore Cloud Sync
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                ضبط إشارات حركة الأسعار والسيولة وأسهم الشريعة وحفظها بقاعدة بياناتك الآمنة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Sub-Tabs */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-950 border-b border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveModalTab('ALERTS')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeModalTab === 'ALERTS'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>تنبيهات الأسعار ({alerts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModalTab('INDICATOR_SETTINGS')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeModalTab === 'INDICATOR_SETTINGS'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>حساسية الماكدي والسوبر ترند للشارت ⚙️</span>
          </button>
        </div>

        {activeModalTab === 'INDICATOR_SETTINGS' ? (
          <div className="p-4 overflow-y-auto max-h-[65vh]">
            <IndicatorSettingsPanel onApplied={onClose} />
          </div>
        ) : (
          <>
            {/* Auth State Bar */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
          {currentUser ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2.5">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-emerald-500/40"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    {currentUser.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <span className="font-bold text-white block">
                    {currentUser.displayName || 'مستخدم مسجل'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {currentUser.email}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAdding(!isAdding)}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAdding ? 'إلغاء' : 'تنبيه جديد'}</span>
                </button>
                <button
                  onClick={() => logOut()}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full flex-wrap gap-2">
              <div className="space-y-0.5">
                <span className="font-bold text-white block">
                  تسجيل الدخول مطلوب لحفظ التنبيهات بقاعدة البيانات
                </span>
                <span className="text-[11px] text-slate-400">
                  سجل الدخول بحساب جوجل لحفظ تنبيهاتك ومزامنتها على السحابة
                </span>
              </div>
              <button
                onClick={handleGoogleLogin}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center gap-2 shadow-lg shadow-white/10 transition-all"
              >
                <LogIn className="w-4 h-4 text-rose-500" />
                <span>تسجيل الدخول عبر Google</span>
              </button>
            </div>
          )}
        </div>

        {authError && (
          <div className="p-3 mx-4 mt-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Add Alert Form */}
          {currentUser && isAdding && (
            <form
              onSubmit={handleCreateAlert}
              className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-3.5 animate-fadeIn"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>تكوين شرط تنبيه سعري جديد:</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  السعر اللحظي: {currentStock?.price.toFixed(2)} ج.م
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Stock Selector */}
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">السهم المراد مراقبته:</label>
                  <select
                    value={formSymbol}
                    onChange={(e) => {
                      setFormSymbol(e.target.value);
                      const s = stocks.find((x) => x.symbol === e.target.value);
                      if (s) setFormTargetValue(Number((s.price * 1.05).toFixed(2)));
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-white font-bold font-mono focus:outline-none focus:border-cyan-500"
                  >
                    {stocks.map((s) => (
                      <option key={s.symbol} value={s.symbol}>
                        {s.symbol} - {s.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Condition Type */}
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">نوع الشرط الفني:</label>
                  <select
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ABOVE_PRICE">صعود السعر أعلى من (ج.م)</option>
                    <option value="BELOW_PRICE">هبوط السعر أدنى من (ج.م)</option>
                    <option value="CHANGE_UP_PCT">ارتفاع يومي يتجاوز %</option>
                    <option value="CHANGE_DOWN_PCT">هبوط يومي يتجاوز %</option>
                    <option value="VOLUME_SPIKE">قفزة غير اعتيادية بالسيولة</option>
                    <option value="SHARIAH_EVENT">تحديث بالموقف الشرعي</option>
                  </select>
                </div>

                {/* Target Value */}
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">القيمة المستهدفة:</label>
                  <input
                    type="number"
                    step="0.05"
                    value={formTargetValue}
                    onChange={(e) => setFormTargetValue(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-white font-bold font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-bold">ملاحظة شخصية أو خطة التداول:</label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="مثال: هدف المقاومة الأولى للبيع أو جني أرباح جزئي"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {isSaving ? 'جاري الحفظ...' : 'حفظ التنبيه في Firestore'}
                </button>
              </div>
            </form>
          )}

          {/* Alerts List */}
          {currentUser ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold">التنبيهات المحفوظة ({alerts.length}):</span>
                <span>المزامنة السحابية نشطة</span>
              </div>

              {alerts.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-500 space-y-2">
                  <Bell className="w-8 h-8 text-slate-600 mx-auto opacity-50" />
                  <p className="font-bold text-slate-300 text-xs">لا توجد تنبيهات نشطة حالياً</p>
                  <p className="text-[11px] text-slate-500">
                    اضغط على زر "تنبيه جديد" لإضافة شروط مراقبة لحركة الأسعار أو أسهم الشريعة
                  </p>
                </div>
              ) : (
                alerts.map((al) => {
                  const stock = stocks.find((s) => s.symbol === al.symbol);
                  const currentP = stock?.price || 0;
                  const isTriggered =
                    (al.condition === 'ABOVE_PRICE' && currentP >= al.targetValue) ||
                    (al.condition === 'BELOW_PRICE' && currentP <= al.targetValue);

                  return (
                    <div
                      key={al.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        isTriggered
                          ? 'bg-amber-950/20 border-amber-500/50 shadow-md shadow-amber-500/10'
                          : al.isActive
                          ? 'bg-slate-950/80 border-slate-800'
                          : 'bg-slate-950/40 border-slate-800/40 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isTriggered
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : 'bg-slate-800 text-cyan-400 border border-slate-700'
                          }`}
                        >
                          {al.condition.includes('UP') || al.condition === 'ABOVE_PRICE' ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-white text-sm">
                              {al.symbol}
                            </span>
                            <span className="text-slate-400 text-xs">({al.stockNameAr})</span>
                            {isTriggered && (
                              <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold">
                                تم تحقيق الشرط الآن!
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 font-semibold mt-0.5">
                            {getConditionLabel(al.condition)}:{' '}
                            <strong className="text-cyan-300 font-mono">
                              {al.targetValue} {al.condition.includes('PCT') ? '%' : 'ج.م'}
                            </strong>{' '}
                            (السعر الحالي: {currentP.toFixed(2)} ج.م)
                          </p>
                          {al.note && (
                            <p className="text-[11px] text-slate-400 mt-1 italic">
                              "{al.note}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => toggleAlertStatus(currentUser.uid, al.id, al.isActive)}
                          className={`p-1.5 rounded-lg border text-xs font-bold transition-colors ${
                            al.isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
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
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-3">
              <ShieldCheck className="w-10 h-10 text-cyan-400 mx-auto opacity-70" />
              <h4 className="font-bold text-white text-sm">
                مزامنة التنبيهات مع Firebase Firestore
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                عند تسجيل الدخول بحساب Google، سيتم حفظ جميع تنبيهاتك الخاصة بالأسهم المصرية وأسهم الشريعة ومزامنتها لحظياً لتعمل على هاتفك وحاسوبك تلقائياً.
              </p>
              <button
                onClick={handleGoogleLogin}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <LogIn className="w-4 h-4" />
                <span>تسجيل الدخول الآمن الآن</span>
              </button>
            </div>
          )}
        </div>
          </>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            تتم مطابقة الأسعار دورياً مع بيانات التداول الرسمية
          </span>
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
