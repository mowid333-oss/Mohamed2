import React from 'react';
import {
  X,
  BookOpen,
  CheckCircle2,
  XCircle,
  Percent,
  Coins,
  ShieldCheck,
  Scale,
  Building,
  FileText,
} from 'lucide-react';

interface ShariahScreeningGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShariahScreeningGuideModal: React.FC<ShariahScreeningGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn font-['Cairo']">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>ضوابط ومعايير فحص أسهم الشريعة الإسلامية</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  EGX Shariah Index
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                المعايير المعتمدة من الهيئة العامة للرقابة المالية وهيئة المحاسبة والمراجعة للمؤسسات المالية الإسلامية (AAOIFI)
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* Introduction Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-950 to-teal-950/30 border border-emerald-500/30 space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>مؤشر الشريعة بالبورصة المصرية (EGX30 Shariah)</span>
            </h4>
            <p className="text-slate-300 leading-relaxed">
              تم إطلاق مؤشر الشريعة رسمياً في البورصة المصرية ليضم كبرى الشركات المقيدة المتوافقة مع أحكام وضوابط الشريعة الإسلامية، بإشراف لجنة الفتوى والرقابة الشرعية بالهيئة العامة للرقابة المالية وفقاً لأحدث المعايير الشرعية الصارمة.
            </p>
          </div>

          {/* 4 Pillars Grid */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">الأركان الأربعة لفحص التوافق الشرعي:</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Pillar 1 */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono">
                    1
                  </div>
                  <span>ضابط النشاط التشغيلي الرئيسي</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  يجب أن يكون النشاط الأساسي للشركة مباحاً شرعاً (تصنيع، مقاولات، اتصالات، غذاء، دواء). وتُستبعد تلقائياً:
                </p>
                <div className="space-y-1 text-[11px] text-rose-400 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <XCircle className="w-3 h-3 text-rose-500" />
                    <span>البنوك التجارية التقليدية (لتعاملها بالربا الصريح).</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <XCircle className="w-3 h-3 text-rose-500" />
                    <span>شركات التبغ والدخان، الكحوليات، الميسر والقمار.</span>
                  </div>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono">
                    2
                  </div>
                  <span>معيار الديون الربوية (أقل من 33%)</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  يجب ألا يتجاوز إجمالي الديون المحملة بالفوائد (Interest-bearing Debt) نسبة <strong className="text-emerald-400">33%</strong> من القيمة السوقية للشركة (Market Capitalization) أو متوسط القيمة السوقية خلال آخر 12 شهراً.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono">
                    3
                  </div>
                  <span>السيولة النقدية والودائع الفائدية (&lt; 33%)</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  يجب ألا تتجاوز السيولة النقدية والودائع الاستثمارية ذات العائد الربوي نسبة <strong className="text-emerald-400">33%</strong> من القيمة السوقية، لمنع تحول السهم لأداة نقدية يُشترط فيها الصرف الفوري والمماثلة.
                </p>
              </div>

              {/* Pillar 4 */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono">
                    4
                  </div>
                  <span>الدخل غير المتوافق ونسبة التطهير (&lt; 5%)</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  أي عوائد عرضية غير متوافقة (كالفوائد البنكية لودائع تشغيلية طارئة) يجب ألا تتجاوز <strong className="text-emerald-400">5%</strong> من إجمالي إيرادات الشركة، مع وجوب إخراج نسبة التطهير وصرفها في وجوه الخير.
                </p>
              </div>
            </div>
          </div>

          {/* Practical Examples in EGX */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-xs">أمثلة تطبيقية في البورصة المصرية:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                <strong className="text-emerald-400 block mb-1">أسهم متوافقة معتمدة:</strong>
                <p className="text-slate-300">
                  طلعت مصطفى (TMGH)، السويدي إليكتريك (SWDY)، فوري (FWRY)، أبو قير للأسمدة (ABUK)، موبكو (MFPC)، حديد عز (ESRS)، مصرف أبوظبي الإسلامي (ADIB)، بنك فيصل (FAIT)، دومتي (DOMT)، جهينة (JUFO)، المصرية للاتصالات (ETEL).
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/30">
                <strong className="text-rose-400 block mb-1">أسهم غير متوافقة (محرمة):</strong>
                <p className="text-slate-300">
                  البنك التجاري الدولي (COMI)، الشرقية للدخان (EAST)، كريدي أجريكول (CIEB)، بنك QNB، بنك التعمير والإسكان (HDBK)، وبقية البنوك التجارية التي تقرض وتقترض بالربا الصريح.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-slate-500 text-xs">
            يتم تدقيق القوائم وتحديث نسب التوافق بصورة دورية
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
