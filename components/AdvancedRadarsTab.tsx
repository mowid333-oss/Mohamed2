import React, { useState, useMemo } from 'react';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Target,
  FileText,
  Copy,
  Check,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Search,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { EGXStock } from '../types/stock';
import {
  RadarSignal,
  evaluateExplosionSignals,
  evaluateReversalSignals,
  evaluateBottomFormationSignals,
  evaluateTopFormationSignals,
} from '../services/radarAdvancedEngine';
import { formatEgpMoney } from './StockTable';
import { exportRadarsToExcel } from '../services/excelExportService';
import { CopyableStockSymbol } from './CopyableStockSymbol';

interface AdvancedRadarsTabProps {
  stocks: EGXStock[];
  onSelectStockForChart: (symbol: string) => void;
  onOpenDetailedReport: (stock: EGXStock) => void;
  shariahOnly: boolean;
  onToggleShariahOnly: () => void;
}

export const AdvancedRadarsTab: React.FC<AdvancedRadarsTabProps> = ({
  stocks,
  onSelectStockForChart,
  onOpenDetailedReport,
  shariahOnly,
  onToggleShariahOnly,
}) => {
  const [activeSubRadar, setActiveSubRadar] = useState<
    'EXPLOSION' | 'REVERSAL' | 'BOTTOM_FORMATION' | 'TOP_FORMATION'
  >('EXPLOSION');
  const [filterQuery, setFilterQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Compute signals
  const explosionSignals = useMemo(() => evaluateExplosionSignals(stocks), [stocks]);
  const reversalSignals = useMemo(() => evaluateReversalSignals(stocks), [stocks]);
  const bottomSignals = useMemo(() => evaluateBottomFormationSignals(stocks), [stocks]);
  const topSignals = useMemo(() => evaluateTopFormationSignals(stocks), [stocks]);

  // Active list based on chosen sub radar
  const activeSignals = useMemo(() => {
    let list: RadarSignal[] = [];
    switch (activeSubRadar) {
      case 'EXPLOSION':
        list = explosionSignals;
        break;
      case 'REVERSAL':
        list = reversalSignals;
        break;
      case 'BOTTOM_FORMATION':
        list = bottomSignals;
        break;
      case 'TOP_FORMATION':
        list = topSignals;
        break;
    }

    if (shariahOnly) {
      list = list.filter((s) => s.isShariah);
    }

    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.stockNameAr.toLowerCase().includes(q) ||
          s.explanationAr.toLowerCase().includes(q)
      );
    }

    return list;
  }, [
    activeSubRadar,
    explosionSignals,
    reversalSignals,
    bottomSignals,
    topSignals,
    shariahOnly,
    filterQuery,
  ]);

  const handleCopySignal = (sig: RadarSignal) => {
    const text = `🎯 [${sig.badgeAr}] إشارة رادار لسهم ${sig.stockNameAr} (${sig.symbol}):
💵 السعر الحالي: ${sig.triggerPrice.toFixed(2)} ج.م (${sig.changePct >= 0 ? '+' : ''}${sig.changePct}%)
🕋 الموقف الشرعي: ${sig.isShariah ? 'متوافق مع الشريعة الإسلامية ✅' : 'غير متوافق ⚠️'}
📈 المستهدف الأول: ${sig.targetPrice1.toFixed(2)} ج.م
🚀 المستهدف الثاني: ${sig.targetPrice2.toFixed(2)} ج.م
🛑 وقف الخسارة: ${sig.stopLossPrice.toFixed(2)} ج.م
⚖️ نسبة العائد للمخاطرة: ${sig.riskRewardRatio}
🔬 التحليل الفني: ${sig.explanationAr}
💡 الخطة المقترحة: ${sig.actionAdviceAr}
المصدر: رادار البورصة المصرية ومؤشر الشريعة TradingView Live`;

    navigator.clipboard.writeText(text);
    setCopiedId(sig.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 font-['Cairo']">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  منظومة الرواصد الفنية المتقدمة وفق أعلى المعايير العلمية
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                  TradingView Math Engine
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                رصد آلي لحظي لانفجارات السيولة، الانعكاسات الحادة، انتهاء تكوين القيعان، ورصد القمم السعرية لحماية الأرباح.
              </p>
            </div>
          </div>

          {/* Actions: Excel Exports & Shariah Filter */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => {
                const subRadarName =
                  activeSubRadar === 'EXPLOSION'
                    ? 'رادار_الانفجارات_والسيولة'
                    : activeSubRadar === 'REVERSAL'
                    ? 'رادار_الانعكاسات_الفنية'
                    : activeSubRadar === 'BOTTOM_FORMATION'
                    ? 'رادار_اكتمال_القيعان'
                    : 'رادار_تكوين_القمم';
                exportRadarsToExcel(activeSignals, subRadarName);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-600/30 active:scale-95 cursor-pointer border border-emerald-400/50"
              title="تحميل إشارات الرادار الحالي بصيغة Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>تحميل إكسيل للرادار الحالي ({activeSignals.length}) 📊</span>
              <Download className="w-3.5 h-3.5 text-emerald-200" />
            </button>

            <button
              onClick={() => {
                const allCombined = [...explosionSignals, ...reversalSignals, ...bottomSignals, ...topSignals];
                exportRadarsToExcel(allCombined, 'الرواصد_الفنية_الأربعة_بالكامل');
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="تحميل الرواصد الأربعة بالكامل في ملف Excel واحد (.xlsx)"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>تصدير الـ 4 رواصد بالكامل 📑</span>
            </button>

            {/* Shariah Filter Toggle */}
            <button
              onClick={onToggleShariahOnly}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer ${
                shariahOnly
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>أسهم الشريعة فقط</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  shariahOnly ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 4 Radars Segmented Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80">
          {/* Tab 1: Explosion Radar */}
          <button
            onClick={() => setActiveSubRadar('EXPLOSION')}
            className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
              activeSubRadar === 'EXPLOSION'
                ? 'bg-cyan-500/15 border-cyan-500/60 text-white shadow-lg shadow-cyan-500/10'
                : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>راصد الانفجارات والسيولة</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-cyan-950 text-cyan-300 font-bold">
                {explosionSignals.length}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">اختراق النطاقات وتدفق السيولة المؤسسية</span>
          </button>

          {/* Tab 2: Reversals Radar */}
          <button
            onClick={() => setActiveSubRadar('REVERSAL')}
            className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
              activeSubRadar === 'REVERSAL'
                ? 'bg-emerald-500/15 border-emerald-500/60 text-white shadow-lg shadow-emerald-500/10'
                : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span>راصد الانعكاسات الفنية</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-emerald-950 text-emerald-300 font-bold">
                {reversalSignals.length}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">انعكاسات الشموع ومؤشرات التشبع RSI</span>
          </button>

          {/* Tab 3: Bottom Formation Radar */}
          <button
            onClick={() => setActiveSubRadar('BOTTOM_FORMATION')}
            className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
              activeSubRadar === 'BOTTOM_FORMATION'
                ? 'bg-teal-500/15 border-teal-500/60 text-white shadow-lg shadow-teal-500/10'
                : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-teal-400" />
                <span>راصد اكتمال القيعان</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-teal-950 text-teal-300 font-bold">
                {bottomSignals.length}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">القيعان المزدوجة W ونهاية التجميع</span>
          </button>

          {/* Tab 4: Top Formation Radar */}
          <button
            onClick={() => setActiveSubRadar('TOP_FORMATION')}
            className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
              activeSubRadar === 'TOP_FORMATION'
                ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-lg shadow-amber-500/10'
                : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                <span>راصد تكوين القمم</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-amber-950 text-amber-300 font-bold">
                {topSignals.length}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">التصريف وجني الأرباح عند المقاومات</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="بحث داخل إشارات الرادار..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <span className="text-xs text-slate-400 font-mono font-bold">
          النتائج المرصودة: <strong className="text-white">{activeSignals.length}</strong> إشارة فنية
        </span>
      </div>

      {/* Signals Grid */}
      {activeSignals.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 space-y-2">
          <Info className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="font-bold text-sm text-slate-300">لا توجد إشارات مطابقة للشروط في الوقت الحالي</p>
          <p className="text-xs text-slate-500">
            يتم فحص حركة الأسعار والسيولة ومؤشرات الشموع تلقائياً مع كل تحديث لحظي
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeSignals.map((sig) => {
            const stock = stocks.find((s) => s.symbol === sig.symbol);

            return (
              <div
                key={sig.id}
                className="p-5 rounded-2xl bg-[#0a0e17] border border-slate-800/90 hover:border-slate-700 shadow-xl space-y-3.5 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Row: Symbol, Shariah, Price */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <CopyableStockSymbol symbol={sig.symbol} size="md" />
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700 font-bold">
                          {sig.badgeAr}
                        </span>
                        {sig.isShariah && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                            شريعة إسلامية
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-300 font-semibold block mt-0.5">
                        {sig.stockNameAr}
                      </span>
                    </div>

                    <div className="text-left font-mono tabular-nums">
                      <div className="text-base font-black text-white">
                        {sig.triggerPrice.toFixed(2)} ج.م
                      </div>
                      <span
                        className={`text-[11px] font-bold ${
                          sig.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {sig.changePct >= 0 ? '+' : ''}{sig.changePct}%
                      </span>
                    </div>
                  </div>

                  {/* Signal Title & Explanation */}
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-white text-sm">{sig.titleAr}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {sig.explanationAr}
                    </p>
                  </div>

                  {/* Key Execution Levels (Target 1, Target 2, Stop Loss, R:R) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs text-right pt-1">
                    <div className="p-2 rounded-xl bg-slate-950 border border-emerald-500/25">
                      <span className="text-[10px] text-slate-400 block font-sans">الهدف الأول</span>
                      <strong className="text-emerald-400 text-xs">{sig.targetPrice1} ج.م</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-teal-500/25">
                      <span className="text-[10px] text-slate-400 block font-sans">الهدف الثاني</span>
                      <strong className="text-teal-300 text-xs">{sig.targetPrice2} ج.م</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-rose-500/25">
                      <span className="text-[10px] text-slate-400 block font-sans">وقف الخسارة</span>
                      <strong className="text-rose-400 text-xs">{sig.stopLossPrice} ج.م</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans">العائد للمخاطرة</span>
                      <strong className="text-amber-300 text-xs">{sig.riskRewardRatio}</strong>
                    </div>
                  </div>

                  {/* Indicators Used Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 pt-1">
                    <span className="font-bold text-slate-500">المؤشرات المعتمدة:</span>
                    {sig.indicatorsUsed.map((ind, i) => (
                      <span
                        key={i}
                        className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md text-slate-300"
                      >
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCopySignal(sig)}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-bold transition-all"
                    title="نسخ تفاصيل الإشارة الفنية"
                  >
                    {copiedId === sig.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    {stock && (
                      <button
                        onClick={() => onOpenDetailedReport(stock)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/35 text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>تقرير مفصل 360°</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSelectStockForChart(sig.symbol)}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>الشارت الفني</span>
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
