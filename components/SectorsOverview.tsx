import React from 'react';
import { Layers, PieChart, ShieldCheck, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { EGXStock } from '../types/stock';
import { formatEgpMoney } from './StockTable';

interface SectorsOverviewProps {
  stocks: EGXStock[];
  onSelectSectorStock: (symbol: string) => void;
}

export const SectorsOverview: React.FC<SectorsOverviewProps> = ({
  stocks,
  onSelectSectorStock,
}) => {
  const sectorGroups = React.useMemo(() => {
    const map = new Map<
      string,
      {
        nameAr: string;
        stocks: EGXStock[];
        totalValue: number;
        avgChange: number;
        shariahCount: number;
      }
    >();

    stocks.forEach((s) => {
      const sec = s.sectorAr || 'أخرى';
      if (!map.has(sec)) {
        map.set(sec, {
          nameAr: sec,
          stocks: [],
          totalValue: 0,
          avgChange: 0,
          shariahCount: 0,
        });
      }
      const g = map.get(sec)!;
      g.stocks.push(s);
      g.totalValue += s.valueTraded || 0;
      if (s.isShariahCompliant) g.shariahCount++;
    });

    const list = Array.from(map.values()).map((g) => {
      const sumChange = g.stocks.reduce((acc, s) => acc + (s.changePct || 0), 0);
      g.avgChange = g.stocks.length > 0 ? Number((sumChange / g.stocks.length).toFixed(2)) : 0;
      return g;
    });

    return list.sort((a, b) => b.totalValue - a.totalValue);
  }, [stocks]);

  return (
    <div className="space-y-6 font-['Cairo']">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              خارطة سيولة قطاعات البورصة المصرية ونسبة التوافق الشرعي
            </h3>
            <p className="text-xs text-slate-400">
              توزيع السيولة والتدفقات النقدية اللحظية ونسبة الأسهم الشرعية بكل قطاع
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectorGroups.map((g) => {
          const isPos = g.avgChange >= 0;
          const shariahPct = g.stocks.length > 0 ? Math.round((g.shariahCount / g.stocks.length) * 100) : 0;

          return (
            <div
              key={g.nameAr}
              className="p-5 rounded-2xl bg-[#0a0e17] border border-slate-800/90 shadow-xl space-y-3.5 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-white text-sm">{g.nameAr}</h4>
                  <span className="text-[11px] text-slate-400">
                    {g.stocks.length} أسهم مقيدة
                  </span>
                </div>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg flex items-center gap-0.5 ${
                    isPos
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-rose-500/15 text-rose-400'
                  }`}
                >
                  {isPos ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {isPos ? '+' : ''}{g.avgChange}%
                </span>
              </div>

              {/* Shariah Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>التوافق الشرعي للقطاع:</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-300">
                    {shariahPct}% ({g.shariahCount} من {g.stocks.length})
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    style={{ width: `${shariahPct}%` }}
                  />
                </div>
              </div>

              {/* Value Traded */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">سيولة القطاع اليوم:</span>
                <span className="font-mono font-bold text-cyan-300">
                  {formatEgpMoney(g.totalValue)}
                </span>
              </div>

              {/* Top Stock Chips in Sector */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {g.stocks.slice(0, 4).map((s) => (
                  <button
                    key={s.symbol}
                    onClick={() => onSelectSectorStock(s.symbol)}
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                  >
                    {s.symbol} ({s.price.toFixed(1)})
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
