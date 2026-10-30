import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  Sparkles,
  Copy,
  Check,
  Search,
  ShieldCheck,
  Activity,
  FileText,
  Bot,
  AlertCircle,
  Clock,
  Calendar,
  Layers,
  BarChart2,
  Filter,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { EGXStock } from '../types/stock';
import {
  scanDivergences,
  DivergenceSignal,
  DivergenceType,
  DivergenceIndicatorCode,
  DIVERGENCE_INDICATORS_CATALOG,
} from '../services/technicalAnalysisService';
import { exportDivergencesToExcel } from '../services/excelExportService';
import { CopyableStockSymbol } from './CopyableStockSymbol';

interface DivergenceRadarTabProps {
  stocks: EGXStock[];
  onSelectStockForChart: (symbol: string) => void;
  onOpenReportModal: (stock: EGXStock) => void;
  onOpenAdvisor: (symbol: string) => void;
  shariahOnly: boolean;
  onToggleShariahOnly: () => void;
}

export const DivergenceRadarTab: React.FC<DivergenceRadarTabProps> = ({
  stocks,
  onSelectStockForChart,
  onOpenReportModal,
  onOpenAdvisor,
  shariahOnly,
  onToggleShariahOnly,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | DivergenceType>('ALL');
  const [selectedIndicator, setSelectedIndicator] = useState<'ALL' | DivergenceIndicatorCode>('ALL');
  const [filterFreshness, setFilterFreshness] = useState<'ALL' | 'TODAY' | 'PREV_SESSION'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Compute divergence signals
  const allDivergences = useMemo(() => scanDivergences(stocks), [stocks]);

  const filteredSignals = useMemo(() => {
    let list = allDivergences;

    if (shariahOnly) {
      list = list.filter((s) => s.isShariah);
    }

    if (filterType !== 'ALL') {
      list = list.filter((s) => s.type === filterType);
    }

    if (selectedIndicator !== 'ALL') {
      list = list.filter((s) => s.indicatorCode === selectedIndicator);
    }

    if (filterFreshness !== 'ALL') {
      list = list.filter((s) => s.freshness === filterFreshness);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.stockNameAr.toLowerCase().includes(q) ||
          s.typeLabelAr.toLowerCase().includes(q) ||
          s.indicatorNameAr.toLowerCase().includes(q) ||
          s.detectedDate.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allDivergences, shariahOnly, filterType, selectedIndicator, filterFreshness, searchQuery]);

  const handleCopy = (sig: DivergenceSignal) => {
    const text = `🎯 [${sig.typeLabelAr}] لسهم ${sig.stockNameAr} (${sig.symbol}):
📅 تاريخ الاكتشاف: ${sig.detectedDate} (${sig.detectedTimeAr}) [${sig.freshnessLabelAr}]
💵 السعر الحالي: ${sig.price.toFixed(2)} ج.م (${sig.changePct >= 0 ? '+' : ''}${sig.changePct}%)
🔬 المؤشر المرصود: ${sig.indicatorNameAr}
📊 سلوك السعر: ${sig.priceActionAr}
📈 سلوك المؤشر: ${sig.indicatorActionAr}
💡 الخطة التداولية:
- سعر الدخول والتأكيد: ${sig.triggerPrice.toFixed(2)} ج.م
- المستهدف الأول: ${sig.targetPrice1.toFixed(2)} ج.م
- المستهدف الثاني: ${sig.targetPrice2.toFixed(2)} ج.م
- وقف الخسارة: ${sig.stopLossPrice.toFixed(2)} ج.م
- العائد للمخاطرة: ${sig.riskRewardRatio}
- الرأي الفني: ${sig.actionRecommendationAr}
المصدر: رادار الدايفرجنس (8 مؤشرات احترافية) - البورصة المصرية EGX`;

    navigator.clipboard.writeText(text);
    setCopiedId(sig.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const counts = useMemo(() => {
    return {
      all: allDivergences.length,
      today: allDivergences.filter((s) => s.freshness === 'TODAY').length,
      regBullish: allDivergences.filter((s) => s.type === 'REGULAR_BULLISH').length,
      regBearish: allDivergences.filter((s) => s.type === 'REGULAR_BEARISH').length,
      hidBullish: allDivergences.filter((s) => s.type === 'HIDDEN_BULLISH').length,
      hidBearish: allDivergences.filter((s) => s.type === 'HIDDEN_BEARISH').length,
    };
  }, [allDivergences]);

  return (
    <div className="space-y-6 font-['Cairo']">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  راصد الدايفرجنس التلقائي (Divergence Radar)
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/40">
                  8 مؤشرات دايفرجنس فائقة القوة + تاريخ الرصد
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                  {counts.today} إشارة رُصدت اليوم ⚡
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                رصد علمي فوري لتباين حركة السعر مع أقوى 8 مؤشرات عالمية (RSI، MACD، الاستوكاستك، OBV الحجمي، CMF شايكين، CCI، MFI تدفق السيولة، و Williams %R) مع توثيق دقيق لتاريخ وتوقيت اكتشاف الدايفرجنس لتفادي الإشارات القديمة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => exportDivergencesToExcel(filteredSignals)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-600/30 active:scale-95 cursor-pointer border border-emerald-400/50"
              title="تحميل تقرير إشارات الدايفرجنس الحالية بصيغة Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>تحميل إكسيل للدايفرجنس ({filteredSignals.length}) 📊</span>
              <Download className="w-3.5 h-3.5 text-emerald-200" />
            </button>

            <button
              onClick={onToggleShariahOnly}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                shariahOnly
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>أسهم الشريعة فقط</span>
            </button>
          </div>
        </div>

        {/* Catalog of the 8 Divergence Indicators */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-bold text-slate-300">
              المؤشرات الثمانية المعتمدة للرصد (اضغط لتصفية الإشارات حسب المؤشر):
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedIndicator('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedIndicator === 'ALL'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              كل المؤشرات (8)
            </button>
            {DIVERGENCE_INDICATORS_CATALOG.map((ind) => {
              const indCount = allDivergences.filter((s) => s.indicatorCode === ind.code).length;
              return (
                <button
                  key={ind.code}
                  onClick={() => setSelectedIndicator(ind.code)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                    selectedIndicator === ind.code
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/25'
                      : 'bg-slate-900/60 text-slate-300 border border-slate-800 hover:border-cyan-500/40 hover:text-white'
                  }`}
                >
                  <span>{ind.nameAr}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      selectedIndicator === ind.code
                        ? 'bg-slate-950 text-cyan-300'
                        : 'bg-slate-800 text-cyan-400'
                    }`}
                  >
                    {indCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divergence Theory Quick Guide Bar */}
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
            <span><strong>إيجابي كلاسيكي:</strong> قاع سعر أدنى + مؤشر أعلى (انعكاس صاعد قوي)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" />
            <span><strong>إيجابي خفي:</strong> قاع سعر أعلى + مؤشر أدنى (استمرار المسار الصاعد)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
            <span><strong>سلبي كلاسيكي:</strong> قمة سعر أعلى + مؤشر أدنى (تصريف وانعكاس هابط)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            <span><strong>سلبي خفي:</strong> قمة سعر أدنى + مؤشر أعلى (استمرار الهبوط)</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Freshness Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full lg:w-auto">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterType === 'ALL'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            الكل ({counts.all})
          </button>
          <button
            onClick={() => setFilterType('REGULAR_BULLISH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterType === 'REGULAR_BULLISH'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            انعكاس صاعد كلاسيكي ({counts.regBullish}) 🟢
          </button>
          <button
            onClick={() => setFilterType('HIDDEN_BULLISH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterType === 'HIDDEN_BULLISH'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-cyan-400'
            }`}
          >
            استمراري صاعد خفي ({counts.hidBullish}) 🚀
          </button>
          <button
            onClick={() => setFilterType('REGULAR_BEARISH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterType === 'REGULAR_BEARISH'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            انعكاس هابط وتصريف ({counts.regBearish}) 🔴
          </button>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto">
          {/* Freshness Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs shrink-0">
            <button
              onClick={() => setFilterFreshness('ALL')}
              className={`px-2 py-1 rounded-lg font-bold transition-all ${
                filterFreshness === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400'
              }`}
            >
              كل التواريخ
            </button>
            <button
              onClick={() => setFilterFreshness('TODAY')}
              className={`px-2 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                filterFreshness === 'TODAY'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <span>اليوم فقط</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          </div>

          <div className="relative w-full lg:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالرمز أو التاريخ..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Divergence Signals Cards Grid */}
      {filteredSignals.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800 space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">لا توجد إشارات دايفرجنس مطابقة لخيارات الفلترة الحالية</h3>
          <p className="text-xs text-slate-400">جرب اختيار "كل المؤشرات (8)" أو تغيير خيار الفلترة الزمنية.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSignals.map((sig) => {
            const isCopied = copiedId === sig.id;
            const targetStock = stocks.find((s) => s.symbol === sig.symbol);

            return (
              <div
                key={sig.id}
                className={`p-5 rounded-3xl bg-[#0b0f17] border ${
                  sig.type === 'REGULAR_BULLISH'
                    ? 'border-emerald-500/40 shadow-emerald-950/20'
                    : sig.type === 'HIDDEN_BULLISH'
                    ? 'border-cyan-500/40 shadow-cyan-950/20'
                    : 'border-rose-500/40 shadow-rose-950/20'
                } shadow-xl space-y-3.5 transition-all hover:border-cyan-400/60`}
              >
                {/* Card Header with Stock Info + Copy + Advisor */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <CopyableStockSymbol symbol={sig.symbol} size="md" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-black text-white">{sig.stockNameAr}</h3>
                        {sig.isShariah && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                            شريعة
                          </span>
                        )}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                          {sig.timeframeAr}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-300 mt-0.5 block">
                        {sig.price.toFixed(2)} ج.م ({sig.changePct >= 0 ? '+' : ''}
                        {sig.changePct}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopy(sig)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                      title="نسخ إشارة وتفاصيل الدايفرجنس"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => onOpenAdvisor(sig.symbol)}
                      className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-colors"
                      title="استشارة المستشار الفني"
                    >
                      <Bot className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Specific Requested: Discovery Date & Indicator & Freshness Badge */}
                <div className="flex items-center justify-between gap-2 bg-slate-950/90 p-2.5 rounded-2xl border border-slate-800/90 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs text-slate-300">
                      تاريخ الرصد: <strong className="text-white font-mono">{sig.detectedDate}</strong>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">({sig.detectedTimeAr})</span>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      sig.freshness === 'TODAY'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {sig.freshnessLabelAr}
                  </span>
                </div>

                {/* Signal Badge & Indicator */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 ${
                      sig.type === 'REGULAR_BULLISH'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : sig.type === 'HIDDEN_BULLISH'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{sig.typeLabelAr}</span>
                  </span>

                  <span className="text-xs text-slate-300 font-bold flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                    <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>المؤشر:</span>
                    <strong className="text-cyan-300">{sig.indicatorNameAr}</strong>
                  </span>
                </div>

                {/* Discrepancy Breakdown (Price Action vs Indicator Action) */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-slate-400 font-bold shrink-0">حركة السعر:</span>
                    <span className="text-slate-200">{sig.priceActionAr}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold shrink-0">حركة المؤشر:</span>
                    <span className="text-cyan-200 font-medium">{sig.indicatorActionAr}</span>
                  </div>
                </div>

                {/* Targets and Stop Loss */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">نقطة التأكيد</span>
                    <span className="font-mono font-bold text-white mt-0.5 block">{sig.triggerPrice}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-emerald-400 block">هدف 1</span>
                    <span className="font-mono font-bold text-emerald-300 mt-0.5 block">{sig.targetPrice1}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-cyan-400 block">هدف 2</span>
                    <span className="font-mono font-bold text-cyan-300 mt-0.5 block">{sig.targetPrice2}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-rose-400 block">وقف خسارة</span>
                    <span className="font-mono font-bold text-rose-300 mt-0.5 block">{sig.stopLossPrice}</span>
                  </div>
                </div>

                {/* Action Recommendation */}
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800 font-medium">
                  💡 {sig.actionRecommendationAr}
                </p>

                {/* Bottom Quick Actions */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    نسبة العائد للمخاطرة: <strong className="text-white font-mono">{sig.riskRewardRatio}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    {targetStock && (
                      <button
                        onClick={() => onOpenReportModal(targetStock)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-bold"
                      >
                        تقرير 360°
                      </button>
                    )}
                    <button
                      onClick={() => onSelectStockForChart(sig.symbol)}
                      className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-bold hover:bg-blue-500/30 transition-colors"
                    >
                      فتح الشارت
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
