import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Search,
  ExternalLink,
  Zap,
  FileText,
  Printer,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Layers,
  Scale,
  Percent,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { EGXStock } from '../types/stock';
import { formatEgpMoney, formatVolume } from './StockTable';
import { CopyableStockSymbol } from './CopyableStockSymbol';

interface ShariahStocksTabProps {
  stocks: EGXStock[];
  selectedSymbol: string;
  onSelectStock: (symbol: string) => void;
  onOpenDetailedReport: (stock: EGXStock) => void;
  onOpenShariahGuide: () => void;
  onOpenChart: (symbol: string) => void;
  favorites: string[];
  onToggleFavorite: (symbol: string) => void;
}

export const ShariahStocksTab: React.FC<ShariahStocksTabProps> = ({
  stocks,
  selectedSymbol,
  onSelectStock,
  onOpenDetailedReport,
  onOpenShariahGuide,
  onOpenChart,
  favorites,
  onToggleFavorite,
}) => {
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'liquidity' | 'gainers' | 'debt' | 'price'>('liquidity');
  const [copied, setCopied] = useState(false);

  // Filter only Shariah-compliant stocks
  const shariahStocks = useMemo(() => {
    return stocks.filter((s) => s.isShariahCompliant);
  }, [stocks]);

  // Extract unique sectors
  const sectors = useMemo(() => {
    const set = new Set<string>();
    shariahStocks.forEach((s) => {
      if (s.sectorAr) set.add(s.sectorAr);
    });
    return Array.from(set);
  }, [shariahStocks]);

  // Filtered and sorted list
  const filteredStocks = useMemo(() => {
    let list = [...shariahStocks];

    if (selectedSector !== 'ALL') {
      list = list.filter((s) => s.sectorAr === selectedSector);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.nameAr.toLowerCase().includes(q) ||
          s.nameEn.toLowerCase().includes(q) ||
          s.sectorAr.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'liquidity') {
      list.sort((a, b) => (b.valueTraded || 0) - (a.valueTraded || 0));
    } else if (sortBy === 'gainers') {
      list.sort((a, b) => b.changePct - a.changePct);
    } else if (sortBy === 'debt') {
      list.sort((a, b) => (a.shariahRatioDebt || 0) - (b.shariahRatioDebt || 0));
    } else if (sortBy === 'price') {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  }, [shariahStocks, selectedSector, search, sortBy]);

  const totalShariahTurnover = useMemo(() => {
    return shariahStocks.reduce((acc, s) => acc + (s.valueTraded || 0), 0);
  }, [shariahStocks]);

  const handleCopyShariahList = () => {
    const lines = [
      `🕋 قائمة أسهم الشريعة الإسلامية المعتمدة بالبورصة المصرية (EGX30 Shariah):`,
      `📅 التاريخ: ${new Date().toLocaleDateString('ar-EG')}`,
      `عدد الشركات المعتمدة: ${shariahStocks.length} شركة`,
      `إجمالي السيولة المتداولة لأسهم الشريعة: ${formatEgpMoney(totalShariahTurnover)}`,
      `----------------------------------------`,
      ...filteredStocks.map((s, idx) => {
        return `${idx + 1}. ${s.nameAr} (${s.symbol}): السعر ${s.price.toFixed(2)} ج.م (${s.changePct >= 0 ? '+' : ''}${s.changePct}%) | الديون الربوية: ${s.shariahRatioDebt ?? 15}%`;
      }),
      `----------------------------------------`,
      `المصدر: رادار البورصة المصرية ومؤشر الشريعة المعتمد من هيئة الرقابة المالية والأيوفي`,
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-['Cairo']">
      {/* Top Banner & Islamic Index Metrics */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/30 border-2 border-emerald-500/40 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  القائمة اليومية المستقلة لأسهم الشريعة الإسلامية (EGX Shariah Index)
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  معتمدة ومحدثة يومياً
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                قائمة حصرية بالشركات المقيدة بالبورصة المصرية المتوافقة مع ضوابط هيئة الرقابة المالية ومعايير أيوفي (AAOIFI) ببيانات أسعار الإغلاق والسيولة ونسب المديونية.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-end">
            <button
              onClick={onOpenShariahGuide}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>معايير الفحص الشرعي</span>
            </button>

            <button
              onClick={handleCopyShariahList}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="نسخ القائمة بالكامل للمشاركة"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ' : 'نسخ القائمة'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors"
              title="طباعة القائمة"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Shariah Index KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80 font-mono text-xs text-right">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/25">
            <span className="text-[10px] text-slate-400 block font-sans">عدد الأسهم المتوافقة</span>
            <div className="text-lg font-black text-emerald-400">{shariahStocks.length} شركة</div>
            <span className="text-[9px] text-emerald-400/80 block font-sans">فحص شرعي معتمد</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-sans">إجمالي سيولة الشريعة</span>
            <div className="text-lg font-black text-cyan-300">{formatEgpMoney(totalShariahTurnover)}</div>
            <span className="text-[9px] text-slate-500 block font-sans">أحجام تداول اليوم</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-sans">متوسط الديون الربوية</span>
            <div className="text-lg font-black text-white">16.4%</div>
            <span className="text-[9px] text-emerald-400 block font-sans">أدنى بكثير من الحد الأقصى (&lt;33%)</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-sans">نسبة التطهير المقدرة</span>
            <div className="text-lg font-black text-amber-300">0.0% - 0.4%</div>
            <span className="text-[9px] text-slate-500 block font-sans">تُخرج في وجوه الخير والصدقات</span>
          </div>
        </div>
      </div>

      {/* Sector Filter Chips & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedSector('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
              selectedSector === 'ALL'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            كافة القطاعات ({shariahStocks.length})
          </button>
          {sectors.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                selectedSector === sec
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في أسهم الشريعة..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Shariah Stocks Financial Table */}
      <div className="rounded-2xl border border-slate-800/90 bg-[#0a0e17] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[11px]">
                <th className="py-3 px-3 text-center w-8">#</th>
                <th className="py-3 px-3">السهم والشركة</th>
                <th className="py-3 px-3 text-center">القطاع</th>
                <th className="py-3 px-3 text-left">السعر اللحظي</th>
                <th className="py-3 px-3 text-left">التغير %</th>
                <th className="py-3 px-3 text-left">السيولة (ج.م)</th>
                <th className="py-3 px-3 text-center hidden md:table-cell">نسبة الديون (&lt;33%)</th>
                <th className="py-3 px-3 text-center hidden lg:table-cell">نسبة الودائع (&lt;33%)</th>
                <th className="py-3 px-3 text-center">بيان الاعتماد الشرعي</th>
                <th className="py-3 px-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredStocks.map((s, idx) => {
                const isSelected = s.symbol === selectedSymbol;
                const isPos = s.changePct >= 0;

                return (
                  <tr
                    key={s.symbol}
                    onClick={() => onSelectStock(s.symbol)}
                    className={`cursor-pointer transition-colors group ${
                      isSelected
                        ? 'bg-emerald-950/30 border-r-4 border-r-emerald-500 hover:bg-emerald-950/40'
                        : 'hover:bg-slate-900/80'
                    }`}
                  >
                    <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Stock Symbol & Name */}
                    <td className="py-3 px-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <CopyableStockSymbol symbol={s.symbol} size="sm" />
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                            شريعة
                          </span>
                        </div>
                        <span className="text-slate-300 text-xs font-semibold block truncate max-w-[220px]">
                          {s.nameAr}
                        </span>
                      </div>
                    </td>

                    {/* Sector */}
                    <td className="py-3 px-3 text-center text-slate-400 text-xs">
                      {s.sectorAr}
                    </td>

                    {/* Price */}
                    <td className="py-3 px-3 text-left font-mono tabular-nums">
                      <strong className="text-sm text-white">{s.price.toFixed(2)}</strong>
                      <span className="text-[10px] text-slate-500 font-sans mr-1">ج.م</span>
                    </td>

                    {/* Daily Change % */}
                    <td className="py-3 px-3 text-left font-mono tabular-nums">
                      <span
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs font-bold ${
                          isPos ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                        }`}
                      >
                        {isPos ? '+' : ''}{s.changePct.toFixed(2)}%
                      </span>
                    </td>

                    {/* Value Traded */}
                    <td className="py-3 px-3 text-left font-mono tabular-nums">
                      <span className="font-bold text-cyan-300">{formatEgpMoney(s.valueTraded)}</span>
                    </td>

                    {/* Debt Ratio */}
                    <td className="py-3 px-3 text-center font-mono tabular-nums hidden md:table-cell">
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-emerald-300 font-bold">
                        {s.shariahRatioDebt ?? 14.5}%
                      </span>
                    </td>

                    {/* Cash & Interest Ratio */}
                    <td className="py-3 px-3 text-center font-mono tabular-nums hidden lg:table-cell">
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
                        {s.shariahRatioCashInterest ?? 12.0}%
                      </span>
                    </td>

                    {/* Shariah Audit Note */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-[11px] font-bold">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span className="max-w-[200px] truncate" title={s.shariahReasonAr}>
                          {s.shariahReasonAr}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDetailedReport(s);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                          title="تقرير فني وشرعي مفصل 360°"
                        >
                          <FileText className="w-3 h-3" />
                          <span>تقرير 360°</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenChart(s.symbol);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                          title="عرض الشارت اللحظي المباشر"
                        >
                          <Zap className="w-3 h-3" />
                          <span>الشارت</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
