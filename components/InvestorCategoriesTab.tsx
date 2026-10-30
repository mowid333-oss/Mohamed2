import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Users,
  Building2,
  TrendingUp,
  TrendingDown,
  Globe,
  PieChart,
  DollarSign,
  ShieldCheck,
  Search,
  Copy,
  Check,
  FileText,
  Activity,
  Bot,
  Timer,
  RefreshCw,
  Clock,
  Filter,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
} from 'lucide-react';
import { EGXStock } from '../types/stock';
import { computeInvestorCategories, InvestorMarketSnapshot } from '../services/investorCategoriesService';
import { formatEgpMoney } from './StockTable';
import { playSonarPingSound } from '../services/soundAlerts';

interface InvestorCategoriesTabProps {
  stocks: EGXStock[];
  onSelectStockForChart: (symbol: string) => void;
  onOpenReportModal: (stock: EGXStock) => void;
  onOpenAdvisor: (symbol: string) => void;
  refreshInterval?: number;
}

export const InvestorCategoriesTab: React.FC<InvestorCategoriesTabProps> = ({
  stocks,
  onSelectStockForChart,
  onOpenReportModal,
  onOpenAdvisor,
  refreshInterval = 60,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'INST_BUY' | 'FOREIGN_BUY' | 'ARAB_BUY' | 'EGX30' | 'SHARIAH'>('ALL');

  // Dedicated Continuous Live Update Interval State (Default: 30 seconds for hyper-responsive institutional flows)
  const [flowsRefreshInterval, setFlowsRefreshInterval] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('egx_investor_flows_refresh_sec');
      if (stored !== null) {
        const val = parseInt(stored, 10);
        if (!isNaN(val)) return val;
      }
    } catch {}
    return 30; // 30 seconds default
  });

  const [flowsCountdown, setFlowsCountdown] = useState<number>(flowsRefreshInterval);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Compute snapshot dynamically from stocks & refreshTrigger
  const snapshot: InvestorMarketSnapshot = useMemo(() => {
    return computeInvestorCategories(stocks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stocks, refreshTrigger]);

  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
    setFlowsCountdown(flowsRefreshInterval);
    try {
      playSonarPingSound();
    } catch {}
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  }, [flowsRefreshInterval]);

  // Continuous timer for Investor Categories
  useEffect(() => {
    if (flowsRefreshInterval <= 0) return;
    const intervalTimer = setInterval(() => {
      setRefreshTrigger((prev) => prev + 1);
      setFlowsCountdown(flowsRefreshInterval);
    }, flowsRefreshInterval * 1000);
    return () => clearInterval(intervalTimer);
  }, [flowsRefreshInterval]);

  // 1-second countdown ticker
  useEffect(() => {
    if (flowsRefreshInterval <= 0) return;
    const ticker = setInterval(() => {
      setFlowsCountdown((prev) => {
        if (prev <= 1) return flowsRefreshInterval;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(ticker);
  }, [flowsRefreshInterval]);

  const handleIntervalChange = (newSec: number) => {
    setFlowsRefreshInterval(newSec);
    setFlowsCountdown(newSec);
    try {
      localStorage.setItem('egx_investor_flows_refresh_sec', newSec.toString());
    } catch {}
  };

  // Filtered Stock Breakdowns
  const filteredStocks = useMemo(() => {
    let list = snapshot.stockBreakdowns;

    if (activeFilter === 'INST_BUY') {
      list = list.filter((s) => s.institutionalNetEgp > 0);
    } else if (activeFilter === 'FOREIGN_BUY') {
      list = list.filter((s) => s.foreignNetEgp > 0);
    } else if (activeFilter === 'ARAB_BUY') {
      list = list.filter((s) => s.arabNetEgp > 0);
    } else if (activeFilter === 'EGX30') {
      list = list.filter((s) => {
        const stk = stocks.find((x) => x.symbol === s.symbol);
        return stk?.isInEgx30;
      });
    } else if (activeFilter === 'SHARIAH') {
      list = list.filter((s) => {
        const stk = stocks.find((x) => x.symbol === s.symbol);
        return stk?.isShariahCompliant;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.nameAr.toLowerCase().includes(q) ||
          s.primaryActorAr.toLowerCase().includes(q) ||
          s.smartMoneyVerdictAr.toLowerCase().includes(q)
      );
    }

    return list;
  }, [snapshot, activeFilter, searchQuery, stocks]);

  const handleCopy = () => {
    const egy = snapshot.nationalityFlows.find((f) => f.category === 'EGYPTIANS');
    const arab = snapshot.nationalityFlows.find((f) => f.category === 'ARABS');
    const forGroup = snapshot.nationalityFlows.find((f) => f.category === 'FOREIGNERS');
    const inst = snapshot.entityTypeFlows.find((f) => f.type === 'INSTITUTIONS');
    const ind = snapshot.entityTypeFlows.find((f) => f.type === 'INDIVIDUALS');

    const text = `📊 تقرير فئات المستثمرين والمتعاملين في البورصة المصرية (محدث لحظياً):
📅 الجلسة: ${snapshot.sessionDate} (${snapshot.lastUpdatedTimestamp})
💵 إجمالي قيمة التداولات: ${formatEgpMoney(snapshot.totalSessionValueEgp)}
🏛️ هيمنة المؤسسات: ${snapshot.institutionalDominancePct}% من تنفيذات السوق

🟢 المستثمرون المصريون: صافي ${egy && egy.netValueEgp >= 0 ? 'شراء' : 'بيع'} ${(Math.abs(egy?.netValueEgp || 0) / 1_000_000).toFixed(1)} مليون ج.م (حصة ${egy?.marketSharePct}%)
🟡 المستثمرون العرب: صافي ${arab && arab.netValueEgp >= 0 ? 'شراء' : 'بيع'} ${(Math.abs(arab?.netValueEgp || 0) / 1_000_000).toFixed(1)} مليون ج.م (حصة ${arab?.marketSharePct}%)
🔴 المستثمرون الأجانب: صافي ${forGroup && forGroup.netValueEgp >= 0 ? 'شراء' : 'بيع'} ${(Math.abs(forGroup?.netValueEgp || 0) / 1_000_000).toFixed(1)} مليون ج.م (حصة ${forGroup?.marketSharePct}%)

🏛️ المؤسسات وصناديق الاستثمار: صافي ${inst && inst.netValueEgp >= 0 ? 'شراء +' : 'بيع -'}${(Math.abs(inst?.netValueEgp || 0) / 1_000_000).toFixed(1)} مليون ج.م (${inst?.marketSharePct}%)
👤 المستثمرون الأفراد: صافي ${ind && ind.netValueEgp >= 0 ? 'شراء +' : 'بيع -'}${(Math.abs(ind?.netValueEgp || 0) / 1_000_000).toFixed(1)} مليون ج.م (${ind?.marketSharePct}%)

⏱️ توقيت التقرير والشارت: ${snapshot.lastUpdatedTimestamp}
${snapshot.delayNoticeAr}

${snapshot.disclaimerAr}
المصدر: رادار البورصة المصرية EGX`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 font-['Cairo']">
      {/* Top Banner with Continuous Live Update HUD */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/70 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  فئات المستثمرين والمتعاملين (المصريين • العرب • الأجانب • المؤسسات • الأفراد)
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/40">
                  EGX Institutional Net Flows
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>تحديث مستمر تلقائي</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                رصد متجدد لحظياً لصافي تعاملات المؤسسات والأفراد وجنسيات التداول مع احتساب مسار السيولة الذكية (Smart Money Tracker) بالتزامن مع حركة الأسهم الحية.
              </p>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-mono flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>آخر تحديث لحظي:</span>
                  <span className="text-cyan-300 font-bold">{snapshot.lastUpdatedTimestamp}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>التحديث القادم خلال:</span>
                  <span className="text-emerald-300 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60 tabular-nums">
                    {flowsCountdown} ثانية
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Actions: Interval selector + Manual Refresh + Copy */}
          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-end">
            {/* Interval Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs">
              <span className="text-slate-400 font-bold text-[11px]">معدل التحديث:</span>
              <select
                value={flowsRefreshInterval}
                onChange={(e) => handleIntervalChange(Number(e.target.value))}
                className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer text-xs font-['Cairo']"
              >
                <option value={15} className="bg-slate-950 text-slate-200">كل 15 ثانية (سريع)</option>
                <option value={30} className="bg-slate-950 text-emerald-400 font-bold">كل 30 ثانية (موصى به)</option>
                <option value={60} className="bg-slate-950 text-slate-200">كل دقيقة</option>
                <option value={180} className="bg-slate-950 text-slate-200">كل 3 دقائق</option>
                <option value={0} className="bg-slate-950 text-rose-300">يدوي فقط</option>
              </select>
            </div>

            {/* Manual Refresh Now Button */}
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
              title="إعادة احتساب وتحديث فئات المستثمرين لحظياً الآن"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-300' : ''}`} />
              <span>{isRefreshing ? 'جاري التحديث...' : 'تحديث الآن'}</span>
            </button>

            {/* Copy Report Button */}
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'تم النسخ' : 'نسخ التقرير'}</span>
            </button>
          </div>
        </div>

        {/* Narrative Box */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
          {snapshot.summaryNarrativeAr}
        </div>
      </div>

      {/* Grid of 2 Core Pillars: Nationalities + Entity Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pillar 1: Nationalities (Egyptians / Arabs / Foreigners) */}
        <div className="p-5 rounded-3xl bg-[#0b0f17] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-black text-white">توزيع الجنسيات (المصريين / العرب / الأجانب)</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">حسب نسبة الاستحواذ %</span>
          </div>

          <div className="space-y-3">
            {snapshot.nationalityFlows.map((flow) => (
              <div
                key={flow.category}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{flow.labelAr}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                      {flow.marketSharePct}% من السوق
                    </span>
                  </div>
                  <span
                    className={`font-mono font-bold flex items-center gap-1 ${
                      flow.netValueEgp >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {flow.netValueEgp >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    صافي {flow.netValueEgp >= 0 ? 'شراء +' : 'بيع '}
                    {formatEgpMoney(Math.abs(flow.netValueEgp))}
                  </span>
                </div>

                {/* Visual Ratio Bar */}
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full ${
                      flow.netValueEgp >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${flow.marketSharePct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>الموقف العام: <strong className="text-white font-sans">{flow.sentimentAr}</strong></span>
                  <span>
                    شراء: {formatEgpMoney(flow.buyValueEgp)} | بيع: {formatEgpMoney(flow.sellValueEgp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pillar 2: Entity Types (Institutions vs Individuals) */}
        <div className="p-5 rounded-3xl bg-[#0b0f17] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-black text-white">طبيعة المتعاملين (المؤسسات vs الأفراد)</h3>
            </div>
            <span className="text-[11px] font-mono text-cyan-300 font-bold">
              هيمنة مؤسسية: {snapshot.institutionalDominancePct}%
            </span>
          </div>

          <div className="space-y-3">
            {snapshot.entityTypeFlows.map((flow) => (
              <div
                key={flow.type}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{flow.labelAr}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-slate-800">
                      {flow.marketSharePct}% من التداولات
                    </span>
                  </div>
                  <span
                    className={`font-mono font-bold flex items-center gap-1 ${
                      flow.netValueEgp >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {flow.netValueEgp >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    صافي {flow.netValueEgp >= 0 ? 'شراء +' : 'بيع '}
                    {formatEgpMoney(Math.abs(flow.netValueEgp))}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full ${
                      flow.type === 'INSTITUTIONS' ? 'bg-cyan-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${flow.marketSharePct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>المسار: <strong className="text-white font-sans">{flow.sentimentAr}</strong></span>
                  <span>
                    شراء: {formatEgpMoney(flow.buyValueEgp)} | بيع: {formatEgpMoney(flow.sellValueEgp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stock-Level Institutional & Category Breakdown Table */}
      <div className="space-y-4">
        {/* Filters and Search Bar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full lg:w-auto pb-1 lg:pb-0">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === 'ALL'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800'
              }`}
            >
              جميع الأسهم النشطة ({snapshot.stockBreakdowns.length})
            </button>
            <button
              onClick={() => setActiveFilter('INST_BUY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === 'INST_BUY'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-emerald-400 bg-slate-950/60 border border-slate-800'
              }`}
            >
              شراء مؤسسي صافي 🏛️
            </button>
            <button
              onClick={() => setActiveFilter('FOREIGN_BUY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === 'FOREIGN_BUY'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-indigo-400 bg-slate-950/60 border border-slate-800'
              }`}
            >
              شراء أجنبي 🌐
            </button>
            <button
              onClick={() => setActiveFilter('ARAB_BUY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === 'ARAB_BUY'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-amber-400 bg-slate-950/60 border border-slate-800'
              }`}
            >
              شراء عربي 🟡
            </button>
            <button
              onClick={() => setActiveFilter('EGX30')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === 'EGX30'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'text-slate-400 hover:text-teal-400 bg-slate-950/60 border border-slate-800'
              }`}
            >
              أسهم EGX30
            </button>
            <button
              onClick={() => setActiveFilter('SHARIAH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === 'SHARIAH'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-emerald-400 bg-slate-950/60 border border-slate-800'
              }`}
            >
              الأسهم الشرعية 🟢
            </button>
          </div>

          <div className="relative w-full lg:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالرمز أو اسم الشركة..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-bold">
                  <th className="p-3.5">السهم</th>
                  <th className="p-3.5">السعر والتغير</th>
                  <th className="p-3.5">قيمة التداول</th>
                  <th className="p-3.5">نسبة المؤسسات</th>
                  <th className="p-3.5">صافي المؤسسات</th>
                  <th className="p-3.5">الطرف الأكثر نشاطاً</th>
                  <th className="p-3.5">تشخيص السيولة الذكية</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredStocks.map((stk) => {
                  const targetStock = stocks.find((s) => s.symbol === stk.symbol);
                  return (
                    <tr key={stk.symbol} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm">{stk.symbol}</span>
                          <span className="text-slate-300 text-xs truncate max-w-[130px]">{stk.nameAr}</span>
                          {targetStock?.isShariahCompliant && (
                            <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                              شرعي
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-mono">
                          <span className="font-bold text-white">{stk.price.toFixed(2)} ج.م</span>
                          <span
                            className={`block text-[11px] font-bold ${
                              stk.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {stk.changePct >= 0 ? '+' : ''}
                            {stk.changePct}%
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-slate-300">
                        {formatEgpMoney(stk.totalTurnoverEgp)}
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-cyan-300">
                            {stk.institutionalRatioPct}%
                          </span>
                          <div className="w-16 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className="bg-cyan-500 h-full"
                              style={{ width: `${stk.institutionalRatioPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`font-mono font-bold flex items-center gap-0.5 ${
                            stk.institutionalNetEgp >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {stk.institutionalNetEgp >= 0 ? '+' : ''}
                          {formatEgpMoney(stk.institutionalNetEgp)}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-300 text-xs font-bold">
                        {stk.primaryActorAr}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                            stk.smartMoneyVerdictAr.includes('دخول') || stk.smartMoneyVerdictAr.includes('تجميع')
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : stk.smartMoneyVerdictAr.includes('تخارج')
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {stk.smartMoneyVerdictAr}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenAdvisor(stk.symbol)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border border-slate-700 transition-colors"
                            title="استشارة المستشار الفني"
                          >
                            <Bot className="w-3.5 h-3.5" />
                          </button>
                          {targetStock && (
                            <button
                              onClick={() => onOpenReportModal(targetStock)}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-teal-500/20 text-teal-400 hover:text-teal-300 border border-slate-700 transition-colors"
                              title="تقرير 360°"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onSelectStockForChart(stk.symbol)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-slate-700 transition-colors"
                            title="الشارت اللحظي"
                          >
                            <Activity className="w-3.5 h-3.5" />
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

      {/* Disclaimers & Chart Timing Notice */}
      <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-cyan-400 font-bold">
          <Clock className="w-4 h-4 shrink-0" />
          <span>توقيت ودقة بيانات السوق اللحظية:</span>
          <span className="font-mono text-cyan-300">{snapshot.lastUpdatedTimestamp}</span>
        </div>
        <p className="text-[11px] leading-relaxed text-amber-300/90">
          {snapshot.delayNoticeAr}
        </p>
        <p className="text-[11px] leading-relaxed text-slate-400 border-t border-slate-800/80 pt-2">
          {snapshot.disclaimerAr}
        </p>
      </div>
    </div>
  );
};
