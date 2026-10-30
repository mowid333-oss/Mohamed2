import React, { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Target,
  PieChart,
  Copy,
  Check,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  AlertTriangle,
  Award,
  Calendar,
  Layers,
  Filter,
  RefreshCw,
  Search,
  ChevronRight,
  ExternalLink,
  Trash2,
  RotateCcw,
  AlertOctagon,
} from 'lucide-react';
import { EGXStock } from '../types/stock';
import { ManagedTrade, PortfolioAccount } from '../types/portfolio';
import {
  calculatePortfolioSummary,
  generatePortfolioAiReportText,
  savePortfolioAccount,
  deleteTradeFromPortfolio,
  clearAllClosedTrades,
  reopenClosedTrade,
} from '../services/portfolioService';
import { CopyableStockSymbol } from './CopyableStockSymbol';

interface PortfolioJournalTabProps {
  stocks: EGXStock[];
  portfolio: PortfolioAccount;
  onUpdatePortfolio: (updated: PortfolioAccount) => void;
  onSelectStock: (symbol: string) => void;
  onSwitchToTradeManagement?: () => void;
}

export const PortfolioJournalTab: React.FC<PortfolioJournalTabProps> = ({
  stocks,
  portfolio,
  onUpdatePortfolio,
  onSelectStock,
  onSwitchToTradeManagement,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'OPEN' | 'CLOSED' | 'REPORT'>('OPEN');
  const [copiedReport, setCopiedReport] = useState(false);
  const [isCapitalModalOpen, setIsCapitalModalOpen] = useState(false);
  const [newCapitalInput, setNewCapitalInput] = useState<string>(
    portfolio.initialCapital.toString()
  );
  const [newCashInput, setNewCashInput] = useState<string>(
    portfolio.cashBalance.toString()
  );

  // Filter & Search in closed history
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');

  // Trade deletion confirmation state
  const [tradeToDelete, setTradeToDelete] = useState<ManagedTrade | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  // Compute live portfolio summary
  const summary = useMemo(() => {
    return calculatePortfolioSummary(portfolio, stocks);
  }, [portfolio, stocks]);

  // Open trades
  const openTrades = useMemo(() => {
    return portfolio.trades.filter((t) => t.status === 'ACTIVE');
  }, [portfolio.trades]);

  // Closed trades filtered
  const closedTrades = useMemo(() => {
    let list = portfolio.trades.filter((t) => t.status === 'CLOSED');
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.symbol.toLowerCase().includes(q) ||
          t.stockNameAr.toLowerCase().includes(q)
      );
    }
    if (historyFilter === 'WIN') {
      list = list.filter((t) => (t.realizedPnL || 0) > 0);
    } else if (historyFilter === 'LOSS') {
      list = list.filter((t) => (t.realizedPnL || 0) < 0);
    }
    return list;
  }, [portfolio.trades, historySearch, historyFilter]);

  const handleDeleteTradeConfirmed = (tradeId: string) => {
    const updated = deleteTradeFromPortfolio(portfolio, tradeId);
    onUpdatePortfolio(updated);
    setTradeToDelete(null);
  };

  const handleClearAllHistoryConfirmed = () => {
    const updated = clearAllClosedTrades(portfolio);
    onUpdatePortfolio(updated);
    setIsClearAllModalOpen(false);
  };

  const handleReopenTrade = (tradeId: string) => {
    const updated = reopenClosedTrade(portfolio, tradeId);
    onUpdatePortfolio(updated);
    setActiveSubTab('OPEN');
  };

  const handleCopyAiReport = () => {
    const text = generatePortfolioAiReportText(summary, portfolio, stocks);
    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2200);
  };

  const handleSaveCapital = () => {
    const cap = parseFloat(newCapitalInput) || portfolio.initialCapital;
    const cash = parseFloat(newCashInput) || portfolio.cashBalance;
    const updated: PortfolioAccount = {
      ...portfolio,
      initialCapital: cap,
      cashBalance: cash,
    };
    onUpdatePortfolio(updated);
    savePortfolioAccount(updated);
    setIsCapitalModalOpen(false);
  };

  return (
    <div className="space-y-6 font-['Cairo'] pb-12">
      {/* Top Portfolio Equity & Capital Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0a101d] to-cyan-950/70 border border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/2 -translate-y-1/2" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-500/40 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" /> سجل التداول والمحفظة الذكية
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/40">
                متابعة لحظية لرأس المال والأرباح
              </span>
            </div>
            
            <div className="flex items-baseline gap-4 flex-wrap">
              <div>
                <span className="text-xs text-slate-400 font-bold">إجمالي قيمة المحفظة (Total Equity):</span>
                <div className="text-2xl sm:text-4xl font-black text-white font-mono flex items-baseline gap-2">
                  <span>{summary.totalEquity.toLocaleString('ar-EG')}</span>
                  <span className="text-sm text-cyan-400 font-bold">ج.م</span>
                </div>
              </div>

              <div className="h-10 w-px bg-slate-800 hidden sm:block" />

              <div>
                <span className="text-xs text-slate-400 font-bold">صافي العائد التراكمي:</span>
                <div
                  className={`text-lg sm:text-2xl font-black font-mono flex items-baseline gap-1.5 ${
                    summary.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  <span>{summary.totalPnL >= 0 ? '+' : ''}{summary.totalPnL.toLocaleString('ar-EG')}</span>
                  <span className="text-xs font-bold">ج.م</span>
                  <span className="text-sm font-bold">({summary.totalPnLPct >= 0 ? '+' : ''}{summary.totalPnLPct}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto">
            <button
              onClick={() => setIsCapitalModalOpen(true)}
              className="flex-1 lg:flex-initial px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Wallet className="w-4 h-4 text-cyan-400" />
              <span>تعديل رأس المال والسيولة ⚙️</span>
            </button>

            <button
              onClick={handleCopyAiReport}
              className="flex-1 lg:flex-initial px-4 py-2.5 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
            >
              {copiedReport ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">تم نسخ التقرير! 📋</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-cyan-400" />
                  <span>نسخ تقرير حالة المحفظة 📋</span>
                </>
              )}
            </button>

            {onSwitchToTradeManagement && (
              <button
                onClick={onSwitchToTradeManagement}
                className="flex-1 lg:flex-initial px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>إدارة صفقة جديدة 🎯</span>
              </button>
            )}
          </div>
        </div>

        {/* Financial Metrics Cards Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-bold">السيولة الكاش (Cash)</div>
            <div className="font-mono font-black text-white text-base mt-0.5">
              {summary.cashBalance.toLocaleString('ar-EG')} ج.م
            </div>
            <div className="text-[10px] text-cyan-400 font-bold mt-0.5">{summary.cashPct}% من المحفظة</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-bold">المستثمر بالأسهم</div>
            <div className="font-mono font-black text-white text-base mt-0.5">
              {summary.investedValue.toLocaleString('ar-EG')} ج.م
            </div>
            <div className="text-[10px] text-teal-400 font-bold mt-0.5">{summary.investedPct}% من المحفظة</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-bold">أرباح عائمة (Unrealized)</div>
            <div
              className={`font-mono font-black text-base mt-0.5 ${
                summary.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {summary.unrealizedPnL >= 0 ? '+' : ''}{summary.unrealizedPnL.toLocaleString('ar-EG')} ج.م
            </div>
            <div className="text-[10px] text-slate-400 font-bold mt-0.5">({summary.unrealizedPnLPct}%)</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-bold">أرباح محققة (Realized)</div>
            <div
              className={`font-mono font-black text-base mt-0.5 ${
                summary.realizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {summary.realizedPnL >= 0 ? '+' : ''}{summary.realizedPnL.toLocaleString('ar-EG')} ج.م
            </div>
            <div className="text-[10px] text-slate-400 font-bold mt-0.5">({summary.realizedPnLPct}%)</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-bold">نسبة النجاح (Win Rate)</div>
            <div className="font-mono font-black text-cyan-300 text-base mt-0.5">
              {summary.winRatePct}%
            </div>
            <div className="text-[10px] text-slate-400 font-bold mt-0.5">
              {summary.winCount} رابحة / {summary.lossCount} خاسرة
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-bold">معامل الربح (Profit Factor)</div>
            <div className="font-mono font-black text-amber-300 text-base mt-0.5">
              {summary.profitFactor}
            </div>
            <div className="text-[10px] text-emerald-400 font-bold mt-0.5">
              أكبر ربح: +{summary.largestWin.toLocaleString()} ج.م
            </div>
          </div>
        </div>

        {/* Visual Allocation Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/60 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>توزيع رأس المال:</span>
            <span>
              كاش: {summary.cashPct}% | أسهم: {summary.investedPct}%
            </span>
          </div>
          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${summary.cashPct}%` }}
              className="bg-cyan-500 h-full transition-all duration-500"
              title={`السيولة الكاش: ${summary.cashPct}%`}
            />
            <div
              style={{ width: `${summary.investedPct}%` }}
              className="bg-emerald-500 h-full transition-all duration-500"
              title={`الأسهم المستثمرة: ${summary.investedPct}%`}
            />
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('OPEN')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'OPEN'
              ? 'bg-cyan-500 text-black font-black shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>الصفقات النشطة المفتوحة</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900/50">
            {openTrades.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('CLOSED')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'CLOSED'
              ? 'bg-cyan-500 text-black font-black shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>سجل الصفقات المغلقة والتاريخية</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900/50">
            {summary.closedTradesCount}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('REPORT')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'REPORT'
              ? 'bg-cyan-500 text-black font-black shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>تقرير وتشخيص المحفظة بالذكاء الاصطناعي 🤖</span>
        </button>
      </div>

      {/* Sub-Tab 1: Open Trades */}
      {activeSubTab === 'OPEN' && (
        <div className="space-y-4">
          {openTrades.length === 0 ? (
            <div className="text-center py-16 bg-[#0b0f17] border border-slate-800 rounded-3xl p-6 space-y-3">
              <Target className="w-12 h-12 text-slate-600 mx-auto" />
              <div className="text-base font-bold text-slate-200">لا توجد مراكز نشطة مفتوحة حالياً</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                يمكنك التوجه لنظام إدارة الصفقة، اختيار السهم، وتفعيل الصفقة بضغطة زر لمتابعتها هنا بالأسعار الحية.
              </p>
              {onSwitchToTradeManagement && (
                <button
                  onClick={onSwitchToTradeManagement}
                  className="px-5 py-2.5 rounded-2xl bg-cyan-500 text-black font-black text-xs hover:bg-cyan-400 shadow-lg shadow-cyan-500/25"
                >
                  فتح صفقة جديدة الآن 🚀
                </button>
              )}
            </div>
          ) : (
            <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[11px] font-bold">
                    <tr>
                      <th className="p-3.5">السهم</th>
                      <th className="p-3.5">الفريم</th>
                      <th className="p-3.5">تاريخ الدخول</th>
                      <th className="p-3.5">سعر الدخول</th>
                      <th className="p-3.5">السعر اللحظي</th>
                      <th className="p-3.5">الكمية</th>
                      <th className="p-3.5">القيمة الحالية</th>
                      <th className="p-3.5">الوقف الحالي</th>
                      <th className="p-3.5">الربح/الخسارة العائمة</th>
                      <th className="p-3.5">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {openTrades.map((trade) => {
                      const live = stocks.find((s) => s.symbol === trade.symbol);
                      const curPrice = live && live.price > 0 ? live.price : trade.actualEntryPrice || 10;
                      const entryP = trade.actualEntryPrice || trade.entryBatch1Price;
                      const shares = trade.actualShares || trade.totalPlannedShares;
                      const curVal = shares * curPrice;
                      const pnl = Math.round(shares * (curPrice - entryP));
                      const pnlPct = Number((((curPrice - entryP) / entryP) * 100).toFixed(2));

                      return (
                        <tr key={trade.id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <CopyableStockSymbol symbol={trade.symbol} size="sm" />
                              <span className="text-slate-300 truncate max-w-[140px]">{trade.stockNameAr}</span>
                            </div>
                          </td>
                          <td className="p-3.5 font-mono text-cyan-400 font-bold">{trade.timeframe}</td>
                          <td className="p-3.5 font-mono text-slate-400">{trade.entryDate || trade.createdAt}</td>
                          <td className="p-3.5 font-mono font-bold text-slate-200">{entryP.toFixed(2)} ج.م</td>
                          <td className="p-3.5 font-mono font-black text-white">{curPrice.toFixed(2)} ج.م</td>
                          <td className="p-3.5 font-mono text-slate-200">{shares.toLocaleString()}</td>
                          <td className="p-3.5 font-mono font-bold text-white">{curVal.toLocaleString()} ج.م</td>
                          <td className="p-3.5">
                            <span
                              className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                                trade.isBreakevenTriggered
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-300'
                              }`}
                            >
                              {trade.trailingStopLoss.toFixed(2)} ج.م
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div
                              className={`font-mono font-black text-sm ${
                                pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {pnl >= 0 ? '+' : ''}{pnl.toLocaleString()} ج.م
                            </div>
                            <div
                              className={`text-[10px] font-mono font-bold ${
                                pnlPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              ({pnlPct >= 0 ? '+' : ''}{pnlPct}%)
                            </div>
                          </td>
                          <td className="p-3.5">
                            <button
                              onClick={() => {
                                onSelectStock(trade.symbol);
                                onSwitchToTradeManagement?.();
                              }}
                              className="px-2.5 py-1 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold transition-colors"
                            >
                              إدارة 🎯
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 2: Closed History Journal */}
      {activeSubTab === 'CLOSED' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0b0f17] p-3.5 rounded-2xl border border-slate-800">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="ابحث في سجل الصفقات المغلقة..."
                className="w-full pr-8 pl-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => setHistoryFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  historyFilter === 'ALL'
                    ? 'bg-slate-700 text-white font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                الكل ({summary.closedTradesCount})
              </button>
              <button
                onClick={() => setHistoryFilter('WIN')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  historyFilter === 'WIN'
                    ? 'bg-emerald-600 text-white font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                الرابحة ({summary.winCount})
              </button>
              <button
                onClick={() => setHistoryFilter('LOSS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  historyFilter === 'LOSS'
                    ? 'bg-rose-600 text-white font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                الخاسرة ({summary.lossCount})
              </button>
            </div>

            {summary.closedTradesCount > 0 && (
              <button
                onClick={() => setIsClearAllModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all self-end sm:self-auto cursor-pointer"
                title="مسح جميع الصفقات المغلقة من السجل"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>مسح كل السجل 🗑️</span>
              </button>
            )}
          </div>

          {closedTrades.length === 0 ? (
            <div className="text-center py-16 bg-[#0b0f17] border border-slate-800 rounded-3xl p-6 text-slate-400 text-xs">
              لا توجد صفقات مغلقة مطابقة في السجل.
            </div>
          ) : (
            <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[11px] font-bold">
                    <tr>
                      <th className="p-3.5">السهم</th>
                      <th className="p-3.5">فترة التداول</th>
                      <th className="p-3.5">سعر الدخول</th>
                      <th className="p-3.5">سعر الخروج</th>
                      <th className="p-3.5">الكمية</th>
                      <th className="p-3.5">صافي الربح/الخسارة</th>
                      <th className="p-3.5">سبب الخروج</th>
                      <th className="p-3.5">التقييم</th>
                      <th className="p-3.5">الدروس المستفادة والملاحظات</th>
                      <th className="p-3.5 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {closedTrades.map((t) => {
                      const pnl = t.realizedPnL || 0;
                      const pnlPct = t.realizedPnLPct || 0;
                      return (
                        <tr key={t.id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <CopyableStockSymbol symbol={t.symbol} size="sm" />
                              <span className="text-slate-300 truncate max-w-[140px]">{t.stockNameAr}</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                            {t.entryDate || t.createdAt} ⬅️ {t.exitDate || 'مغلقة'}
                          </td>
                          <td className="p-3.5 font-mono text-slate-300">
                            {(t.actualEntryPrice || t.entryBatch1Price).toFixed(2)} ج.م
                          </td>
                          <td className="p-3.5 font-mono text-white font-bold">
                            {t.exitPrice ? t.exitPrice.toFixed(2) + ' ج.م' : '-'}
                          </td>
                          <td className="p-3.5 font-mono text-slate-200">
                            {(t.actualShares || t.totalPlannedShares).toLocaleString()}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`font-mono font-black text-sm ${
                                pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {pnl >= 0 ? '+' : ''}{pnl.toLocaleString()} ج.م
                            </span>
                            <div
                              className={`text-[10px] font-mono font-bold ${
                                pnlPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              ({pnlPct >= 0 ? '+' : ''}{pnlPct}%)
                            </div>
                          </td>
                          <td className="p-3.5 text-xs text-slate-300">
                            {t.exitReason === 'TARGET_ALL_HIT'
                              ? '🎯 كامل الأهداف'
                              : t.exitReason === 'TARGET_1_PARTIAL'
                              ? '✅ هدف أول جزئي'
                              : t.exitReason === 'TRAILING_STOP_HIT'
                              ? '🛡️ وقف متحرك'
                              : t.exitReason === 'STOP_LOSS_HIT'
                              ? '⚠️ وقف خسارة'
                              : '💰 خروج يدوي'}
                          </td>
                          <td className="p-3.5 text-amber-400 text-sm">
                            {'★'.repeat(t.ratingStars || 5)}
                          </td>
                          <td className="p-3.5 text-[11px] text-slate-400 max-w-xs truncate">
                            {t.lessonsLearned || t.notes || '-'}
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleReopenTrade(t.id)}
                                className="px-2 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
                                title="إعادة فتح الصفقة ونقلها للصفقات النشطة"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span className="hidden sm:inline">إعادة فتح</span>
                              </button>
                              <button
                                onClick={() => setTradeToDelete(t)}
                                className="px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                                title="حذف هذه الصفقة نهائياً من السجل"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>حذف</span>
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
          )}
        </div>
      )}

      {/* Sub-Tab 3: AI Diagnostic Report & Sector Exposure */}
      {activeSubTab === 'REPORT' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sector Allocation Breakdown (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <PieChart className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">التوزيع القطاعي للمحفظة</h3>
                </div>
                <span className="text-xs text-slate-400">
                  {summary.sectorAllocation.length} قطاعات
                </span>
              </div>

              {summary.sectorAllocation.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  لا توجد أسهم مستثمرة حالياً لرسم التوزيع القطاعي.
                </div>
              ) : (
                <div className="space-y-3">
                  {summary.sectorAllocation.map((sec) => (
                    <div key={sec.sector} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-200 font-semibold">{sec.sector}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-mono text-[11px]">
                            {sec.value.toLocaleString()} ج.م
                          </span>
                          <span className="font-mono font-bold text-cyan-400">{sec.pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${sec.pct}%` }}
                          className="bg-gradient-to-r from-cyan-500 to-teal-400 h-full rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Overconcentration Warnings */}
            <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>فحص تركز المخاطر في الأسهم الفردية</span>
              </h3>

              {summary.topOverconcentratedStocks.length > 0 ? (
                <div className="space-y-2">
                  {summary.topOverconcentratedStocks.map((s) => (
                    <div
                      key={s.symbol}
                      className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-white">{s.symbol}</span>
                        <span className="text-slate-300 mr-1.5">{s.nameAr}</span>
                      </div>
                      <span className="font-mono font-bold text-amber-300">
                        {s.pctOfEquity}% من المحفظة (مرتفع)
                      </span>
                    </div>
                  ))}
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">
                    ⚠️ يفضل ألا يتجاوز وزن السهم المنفرد 15% - 20% من إجمالي المحفظة لتجنب الصدمات السعرية المفاجئة.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>توزيع الأوزان متوازن ولا يوجد تركز عالي خطر في أي سهم منفرد ✅</span>
                </div>
              )}
            </div>
          </div>

          {/* AI Comprehensive Diagnostic Report (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#0b0f17] border border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <Award className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">
                    تقرير حالة المحفظة وتوصيات الذكاء الاصطناعي
                  </h3>
                </div>
                <button
                  onClick={handleCopyAiReport}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  {copiedReport ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">تم النسخ! 📋</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-cyan-400" />
                      <span>نسخ التقرير 📋</span>
                    </>
                  )}
                </button>
              </div>

              {/* Formatted Report Card */}
              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="font-bold text-white text-sm">💡 تشخيص السيولة واستراتيجية التداول:</div>
                  <p>
                    {summary.cashPct < 25
                      ? `⚠️ نسبة السيولة النقدية لديك (${summary.cashPct}%) منخفضة نسبياً مقارنة بإجمالي المحفظة. يوصى بعدم فتح مراكز شراء جديدة حتى يتم جني أرباح جزئي من الصفقات الحالية لاستعادة السيولة التكتيكية.`
                      : `✅ نسبة السيولة النقدية لديك (${summary.cashPct}%) ممتازة وتوفر مرونة عالية لاقتناص الفرص الارتدادية واختراقات الأسهم القيادية المتوافقة مع الشريعة.`}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="font-bold text-white text-sm">🎯 تقييم أداء الصفقات (Trading Performance):</div>
                  <p>
                    معدل الفوز التراكمي في صفقاتك هو{' '}
                    <span className="font-mono font-bold text-cyan-300">{summary.winRatePct}%</span>، ومعامل الربحية بلغ{' '}
                    <span className="font-mono font-bold text-amber-300">{summary.profitFactor}</span>. الاستمرار في الالتزام الصارم بسلالم جني الأرباح ونقل الوقف لنقطة الدخول (Breakeven) سيعزز من نمو المحفظة على المدى الطويل.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="font-bold text-white text-sm">🛡️ توصيات حماية رأس المال:</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    <li>لا تخاطر بأكثر من 1% إلى 2% من إجمالي رأس المال في أي صفقة منفردة.</li>
                    <li>عند تحقيق الهدف الأول H1، احرص على تفعيل قاعدة نقل الوقف لسعر الدخول فوراً.</li>
                    <li>نوع مراكزك على 3 إلى 5 قطاعات مختلفة في البورصة المصرية لتفادي التقلبات القطاعية.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Capital Modal */}
      {isCapitalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0b0f17] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-cyan-400" />
                <span>إعدادات رأس المال والسيولة النقدية</span>
              </h3>
              <button
                onClick={() => setIsCapitalModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-bold mb-1.5 block">
                  رأس المال الأساسي المودع بالمحفظة (ج.م):
                </label>
                <input
                  type="number"
                  value={newCapitalInput}
                  onChange={(e) => setNewCapitalInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  المبلغ الإجمالي الأولي المخصص للتداول لحساب نسب العائد الكلي.
                </span>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold mb-1.5 block">
                  السيولة النقدية المتاحة حالياً للكاش (ج.م):
                </label>
                <input
                  type="number"
                  value={newCashInput}
                  onChange={(e) => setNewCashInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  الكاش الحر غير المستثمر المتاح لاقتناص الصفقات الجديدة.
                </span>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                onClick={() => setIsCapitalModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveCapital}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black shadow-lg shadow-cyan-500/25"
              >
                حفظ التعديلات ✅
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Trade Confirmation Modal */}
      {tradeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0b0f17] border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">تأكيد حذف الصفقة من السجل</h4>
                <p className="text-xs text-slate-400">
                  هل أنت متأكد من حذف صفقة سهم <span className="text-white font-bold">{tradeToDelete.stockNameAr} ({tradeToDelete.symbol})</span>؟
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span>سعر الدخول:</span>
                <span className="font-mono font-bold text-white">{(tradeToDelete.actualEntryPrice || tradeToDelete.entryBatch1Price).toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between">
                <span>الربح/الخسارة المحققة:</span>
                <span className={`font-mono font-bold ${(tradeToDelete.realizedPnL || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {(tradeToDelete.realizedPnL || 0) >= 0 ? '+' : ''}{(tradeToDelete.realizedPnL || 0).toLocaleString()} ج.م
                </span>
              </div>
              <div className="flex justify-between">
                <span>الكمية:</span>
                <span className="font-mono font-bold text-white">{(tradeToDelete.actualShares || tradeToDelete.totalPlannedShares).toLocaleString()} سهم</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                onClick={() => setTradeToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleDeleteTradeConfirmed(tradeToDelete.id)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/30"
              >
                تأكيد الحذف 🗑️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Closed Trades Confirmation Modal */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0b0f17] border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">مسح كل سجل الصفقات المغلقة</h4>
                <p className="text-xs text-slate-400">
                  سيتم حذف جميع الصفقات المغلقة ({summary.closedTradesCount} صفقة) وتصفير إحصائيات الأداء السابقة.
                </p>
              </div>
            </div>

            <p className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl">
              ⚠️ تنبيه: هذا الإجراء لا يمكن التراجع عنه. الصفقات النشطة المفتوحة لن تتأثر وستظل كما هي.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                onClick={() => setIsClearAllModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                تراجع
              </button>
              <button
                onClick={handleClearAllHistoryConfirmed}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/30"
              >
                نعم، مسح كل السجل 🗑️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
