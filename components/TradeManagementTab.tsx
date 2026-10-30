import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  TrendingUp,
  Target,
  ArrowRight,
  CheckCircle2,
  Clock,
  Zap,
  AlertTriangle,
  Play,
  RotateCcw,
  Copy,
  Check,
  Percent,
  Sliders,
  DollarSign,
  ChevronDown,
  Search,
  Sparkles,
  Award,
  Layers,
} from 'lucide-react';
import { EGXStock, TradingTimeframe, TRADING_TIMEFRAMES } from '../types/stock';
import { ManagedTrade, PortfolioAccount } from '../types/portfolio';
import {
  generateSmartTradePlan,
  evaluateLiveTrade,
  savePortfolioAccount,
} from '../services/portfolioService';
import { calculateStockTechnicalIndicators } from '../services/technicalAnalysisService';

interface TradeManagementTabProps {
  stocks: EGXStock[];
  selectedSymbol: string;
  onSelectStock: (symbol: string) => void;
  portfolio: PortfolioAccount;
  onUpdatePortfolio: (updated: PortfolioAccount) => void;
  onSwitchToPortfolioTab?: () => void;
  onOpenAdvisor?: (symbol: string) => void;
}

export const TradeManagementTab: React.FC<TradeManagementTabProps> = ({
  stocks,
  selectedSymbol,
  onSelectStock,
  portfolio,
  onUpdatePortfolio,
  onSwitchToPortfolioTab,
  onOpenAdvisor,
}) => {
  const [activeTimeframe, setActiveTimeframe] = useState<TradingTimeframe>('1D');
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [isStockDropdownOpen, setIsStockDropdownOpen] = useState(false);

  // Risk parameters
  const [customRiskPct, setCustomRiskPct] = useState<number>(
    portfolio.settings.maxRiskPerTradePct || 2.0
  );
  const [customCapital, setCustomCapital] = useState<number>(portfolio.cashBalance || 100000);

  // Copied toast
  const [copied, setCopied] = useState(false);

  // Exit modal state for closing an active trade
  const [closingTradeId, setClosingTradeId] = useState<string | null>(null);
  const [exitReason, setExitReason] = useState<string>('TARGET_1_PARTIAL');
  const [exitPriceInput, setExitPriceInput] = useState<string>('');
  const [exitNotes, setExitNotes] = useState<string>('');
  const [exitRating, setExitRating] = useState<number>(5);
  const [exitLessons, setExitLessons] = useState<string>('');

  const currentStock = useMemo(() => {
    return (
      stocks.find((s) => s.symbol.toUpperCase() === selectedSymbol.toUpperCase()) ||
      stocks[0] ||
      ({
        symbol: 'TMGH',
        nameAr: 'طلعت مصطفى',
        price: 60.0,
        changePct: 1.5,
        isShariahCompliant: true,
      } as EGXStock)
    );
  }, [stocks, selectedSymbol]);

  // Filter stocks for the dropdown
  const filteredStocks = useMemo(() => {
    if (!stockSearchQuery.trim()) return stocks.slice(0, 30);
    const q = stockSearchQuery.toLowerCase().trim();
    return stocks
      .filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.nameAr.toLowerCase().includes(q) ||
          (s.nameEn && s.nameEn.toLowerCase().includes(q))
      )
      .slice(0, 40);
  }, [stocks, stockSearchQuery]);

  // Generate dynamic smart plan based on inputs
  const plannedTrade = useMemo(() => {
    return generateSmartTradePlan(currentStock, activeTimeframe, customCapital, customRiskPct);
  }, [currentStock, activeTimeframe, customCapital, customRiskPct]);

  // Active trades in portfolio for the selected symbol (or all active trades)
  const activeTradesForSymbol = useMemo(() => {
    return portfolio.trades
      .filter((t) => t.status === 'ACTIVE' && t.symbol === currentStock.symbol)
      .map((t) => evaluateLiveTrade(t, currentStock));
  }, [portfolio.trades, currentStock]);

  const allActiveTrades = useMemo(() => {
    return portfolio.trades
      .filter((t) => t.status === 'ACTIVE')
      .map((t) => {
        const live = stocks.find((s) => s.symbol === t.symbol) || currentStock;
        return evaluateLiveTrade(t, live);
      });
  }, [portfolio.trades, stocks, currentStock]);

  // Handlers
  const handleLaunchTrade = () => {
    const newTrade: ManagedTrade = {
      ...plannedTrade,
      id: `trade-${Date.now()}-${currentStock.symbol}`,
      status: 'ACTIVE',
      entryDate: new Date().toISOString().split('T')[0],
      actualEntryPrice: plannedTrade.entryBatch1Price,
      actualShares: plannedTrade.totalPlannedShares,
      trailingStopLoss: plannedTrade.initialStopLoss,
    };

    // Deduct cash balance
    const cost = newTrade.actualShares! * newTrade.actualEntryPrice!;
    const updatedAccount: PortfolioAccount = {
      ...portfolio,
      cashBalance: Math.max(0, portfolio.cashBalance - cost),
      trades: [newTrade, ...portfolio.trades],
    };

    onUpdatePortfolio(updatedAccount);
    savePortfolioAccount(updatedAccount);
  };

  const handleOpenExitModal = (trade: ManagedTrade) => {
    setClosingTradeId(trade.id);
    const currentPrice =
      stocks.find((s) => s.symbol === trade.symbol)?.price || trade.actualEntryPrice || 10;
    setExitPriceInput(currentPrice.toString());
    setExitNotes('');
    setExitLessons('');
  };

  const handleConfirmExitTrade = () => {
    if (!closingTradeId) return;

    const exitP = parseFloat(exitPriceInput) || currentStock.price;
    const targetTrade = portfolio.trades.find((t) => t.id === closingTradeId);
    if (!targetTrade) return;

    const shares = targetTrade.actualShares || targetTrade.totalPlannedShares;
    const entryP = targetTrade.actualEntryPrice || targetTrade.entryBatch1Price;
    const realizedPnL = Math.round(shares * (exitP - entryP));
    const realizedPnLPct = Number((((exitP - entryP) / entryP) * 100).toFixed(2));

    const updatedTrades = portfolio.trades.map((t) => {
      if (t.id === closingTradeId) {
        const closed: ManagedTrade = {
          ...t,
          status: 'CLOSED',
          exitDate: new Date().toISOString().split('T')[0],
          exitPrice: exitP,
          exitReason: exitReason as any,
          realizedPnL,
          realizedPnLPct,
          notes: exitNotes,
          ratingStars: exitRating,
          lessonsLearned: exitLessons,
        };
        return closed;
      }
      return t;
    });

    // Return proceeds to cash
    const proceeds = shares * exitP;
    const updatedAccount: PortfolioAccount = {
      ...portfolio,
      cashBalance: portfolio.cashBalance + proceeds,
      trades: updatedTrades,
    };

    onUpdatePortfolio(updatedAccount);
    savePortfolioAccount(updatedAccount);
    setClosingTradeId(null);
  };

  const handleCopyPlan = () => {
    const tf = TRADING_TIMEFRAMES.find((t) => t.code === activeTimeframe) || TRADING_TIMEFRAMES[4];
    const text = `🎯 *خطة إدارة الصفقة المتكاملة - سهم ${currentStock.nameAr} (${currentStock.symbol})*
⏱️ الفريم الزمني: ${tf.labelAr} (${tf.badgeAr})
💵 السعر اللحظي: ${currentStock.price.toFixed(2)} ج.م (${currentStock.changePct >= 0 ? '+' : ''}${currentStock.changePct}%)
🕋 الموقف الشرعي: ${currentStock.isShariahCompliant ? 'متوافق مع الشريعة الإسلامية ✅' : 'تقليدي ⚠️'}

📌 *1. خطة الدخول المبرمجة (Scale-in Plan):*
• نطاق الشراء الموصى به: ${plannedTrade.entryZoneMin} - ${plannedTrade.entryZoneMax} ج.م
• الدفعة الأولى (60%): ${plannedTrade.entryBatch1Shares} سهم بسعر ${plannedTrade.entryBatch1Price} ج.م
• الدفعة الثانية (40%): ${plannedTrade.entryBatch2Shares} سهم بسعر ${plannedTrade.entryBatch2Price} ج.م (عند تأكيد الاختراق)
• إجمالي الكمية المخططة: ${plannedTrade.totalPlannedShares} سهم
• إجمالي رأس المال المخصص: ${plannedTrade.totalPlannedCapital.toLocaleString('ar-EG')} ج.م
• شرط التأكيد الفني للدخول: ${plannedTrade.entryTriggerCondition}

🛡️ *2. إدارة المخاطر والوقف (Risk & Stop Loss):*
• وقف الخسارة الأولي الصارم: ${plannedTrade.initialStopLoss} ج.م (-${((currentStock.price - plannedTrade.initialStopLoss) / currentStock.price * 100).toFixed(1)}%)
• أقصى خسارة محسوبة: ${plannedTrade.riskAmount.toLocaleString('ar-EG')} ج.م (${customRiskPct}% من رأس المال)
• نسبة العائد للمخاطرة (R:R Ratio): 1 إلى ${plannedTrade.riskRewardRatio}

🎯 *3. سلم جني الأرباح (Profit Targets Ladder):*
• الهدف الأول H1: ${plannedTrade.targets[0].price} ج.م (+${plannedTrade.targets[0].pctGain}%) 👈 جني أرباح 50% من الكمية ونقل الوقف إلى سعر الدخول فوراً
• الهدف الثاني H2: ${plannedTrade.targets[1].price} ج.م (+${plannedTrade.targets[1].pctGain}%) 👈 جني أرباح 30% إضافية ورفع الوقف لحماية الأرباح
• الهدف الثالث H3: ${plannedTrade.targets[2].price} ج.م (+${plannedTrade.targets[2].pctGain}%) 👈 إغلاق باقي الكمية 20% وحصد كامل المكاسب

تم إنشاؤها عبر نظام إدارة الصفقات الذكي - رادار البورصة المصرية EGX`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="space-y-6 font-['Cairo'] pb-12">
      {/* Top Banner & Quick Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0d1424] to-cyan-950/60 border border-cyan-500/30 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-500/40 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> نظام إدارة الصفقة الشامل
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/40 flex items-center gap-1">
                من لحظة الدخول ⬅️ وحتى التخارج النهائي
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              هندسة الصفقة، حساب الحجم الآمن، وإدارة الوقف وسلالم الأرباح
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              تخطيط الدخول على دفعتين، الحساب الدقيق لوقف الخسارة وكمية الأسهم، التحويل التلقائي لنقطة التعادل (Breakeven)، والمتابعة اللحظية عبر كافة مؤشرات المنصة.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto">
            <button
              onClick={handleCopyPlan}
              className="flex-1 lg:flex-initial px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">تم نسخ الخطة! 📋</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-cyan-400" />
                  <span>نسخ خطة الصفقة 📋</span>
                </>
              )}
            </button>

            {onSwitchToPortfolioTab && (
              <button
                onClick={onSwitchToPortfolioTab}
                className="flex-1 lg:flex-initial px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <span>سجل المحفظة 💼</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Stock Selector & Timeframe Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Stock Searchable Combobox */}
          <div className="relative w-full md:w-80">
            <label className="text-[11px] font-bold text-slate-400 mb-1 block">السهم المستهدف:</label>
            <button
              type="button"
              onClick={() => setIsStockDropdownOpen(!isStockDropdownOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-100 font-bold text-xs transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-cyan-400 font-bold text-sm">{currentStock.symbol}</span>
                <span className="text-slate-200 truncate">{currentStock.nameAr}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isStockDropdownOpen && (
              <div className="absolute top-full mt-1.5 right-0 left-0 bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 space-y-1.5 max-h-80 overflow-y-auto">
                <div className="relative mb-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={stockSearchQuery}
                    onChange={(e) => setStockSearchQuery(e.target.value)}
                    placeholder="ابحث بالاسم أو الرمز (مثل SIPC)..."
                    className="w-full pr-8 pl-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-400"
                    autoFocus
                  />
                </div>
                {filteredStocks.map((s) => (
                  <div
                    key={s.symbol}
                    onClick={() => {
                      onSelectStock(s.symbol);
                      setIsStockDropdownOpen(false);
                      setStockSearchQuery('');
                    }}
                    className={`p-2 rounded-xl cursor-pointer flex items-center justify-between text-xs transition-colors ${
                      s.symbol === currentStock.symbol
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{s.symbol}</span>
                      <span className="truncate max-w-[150px]">{s.nameAr}</span>
                    </div>
                    <span className="font-mono text-slate-300 font-bold">
                      {s.price > 0 ? s.price.toFixed(2) : '-'} ج.م
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timeframe Selector Ribbon */}
          <div className="w-full md:w-auto">
            <label className="text-[11px] font-bold text-slate-400 mb-1 block">الفريم الزمني للتداول:</label>
            <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-2xl border border-slate-800 overflow-x-auto no-scrollbar">
              {TRADING_TIMEFRAMES.map((tf) => (
                <button
                  key={tf.code}
                  onClick={() => setActiveTimeframe(tf.code)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTimeframe === tf.code
                      ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25 font-black'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {tf.labelAr}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics of Selected Stock */}
          <div className="flex items-center gap-3 bg-slate-950/60 px-4 py-2 rounded-2xl border border-slate-800/80">
            <div>
              <div className="text-[10px] text-slate-400 font-medium">السعر اللحظي</div>
              <div className="font-mono font-black text-white text-base">
                {currentStock.price.toFixed(2)} ج.م
              </div>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <div className="text-[10px] text-slate-400 font-medium">التغير اليومي</div>
              <div
                className={`font-mono font-bold text-xs ${
                  currentStock.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {currentStock.changePct >= 0 ? '+' : ''}
                {currentStock.changePct}%
              </div>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <div className="text-[10px] text-slate-400 font-medium">الموقف الشرعي</div>
              <div
                className={`text-[11px] font-bold ${
                  currentStock.isShariahCompliant ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {currentStock.isShariahCompliant ? 'شريعة ✅' : 'تقليدي'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Pre-Entry Blueprint vs Active Trades Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pre-Entry Strategy & Sizing Calculator (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Position Sizing & Capital Inputs */}
          <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">حاسبة حجم الصفقة وإدارة المخاطر</h3>
                  <p className="text-[11px] text-slate-400">
                    تحديد كمية الأسهم الآمنة بناءً على رأس المال ونسبة المخاطرة
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                فريم {activeTimeframe}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                  <span>رأس المال المتاح للحساب (ج.م)</span>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    كاش المحفظة: {portfolio.cashBalance.toLocaleString()} ج.م
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={customCapital}
                    onChange={(e) => setCustomCapital(Math.max(1000, Number(e.target.value)))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-sm focus:outline-none focus:border-cyan-400"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                    ج.م
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                  <span>أقصى نسبة مخاطرة مقبولة</span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    المبلغ: {plannedTrade.riskAmount.toLocaleString()} ج.م
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  {[1.0, 1.5, 2.0, 3.0].map((r) => (
                    <button
                      key={r}
                      onClick={() => setCustomRiskPct(r)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        customRiskPct === r
                          ? 'bg-cyan-500 text-black font-black shadow-md shadow-cyan-500/20'
                          : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {r}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sizing Output Stat Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-bold">إجمالي الأسهم الآمنة</div>
                <div className="font-mono font-black text-cyan-300 text-base">
                  {plannedTrade.totalPlannedShares.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-bold">قيمة الصفقة الإجمالية</div>
                <div className="font-mono font-black text-white text-base">
                  {plannedTrade.totalPlannedCapital.toLocaleString()} ج.م
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-bold">أقصى خسارة (عند الوقف)</div>
                <div className="font-mono font-black text-rose-400 text-base">
                  -{plannedTrade.riskAmount.toLocaleString()} ج.م
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-bold">نسبة العائد للمخاطرة</div>
                <div className="font-mono font-black text-emerald-400 text-base">
                  1 : {plannedTrade.riskRewardRatio}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Entry Blueprint (خطة الدخول على دفعتين) */}
          <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Play className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">خطة الدخول المتدرج (Scale-in Blueprint)</h3>
                  <p className="text-[11px] text-slate-400">تقسيم التمركز لتخفيض المخاطر وتأكيد الزخم</p>
                </div>
              </div>
              <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                نطاق الشراء: {plannedTrade.entryZoneMin} - {plannedTrade.entryZoneMax} ج.م
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Batch 1 */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/20 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300">الدفعة الأولى (60% من الحجم)</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md font-bold">
                    تنفيذ مبدئي
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-xs text-slate-400">السعر المستهدف:</div>
                  <div className="font-mono font-black text-white text-base">
                    {plannedTrade.entryBatch1Price} ج.م
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-xs text-slate-400">عدد الأسهم:</div>
                  <div className="font-mono font-bold text-emerald-300">
                    {plannedTrade.entryBatch1Shares} سهم
                  </div>
                </div>
                <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                  شراء عند السعر الحالي أو ارتداد الشموع اللحظية لاقتناص التمركز الأساسي.
                </div>
              </div>

              {/* Batch 2 */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-cyan-950/20 border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300">الدفعة الثانية (40% من الحجم)</span>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/15 px-2 py-0.5 rounded-md font-bold">
                    تعزيز اختراق
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-xs text-slate-400">السعر المستهدف:</div>
                  <div className="font-mono font-black text-white text-base">
                    {plannedTrade.entryBatch2Price} ج.م
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-xs text-slate-400">عدد الأسهم:</div>
                  <div className="font-mono font-bold text-cyan-300">
                    {plannedTrade.entryBatch2Shares} سهم
                  </div>
                </div>
                <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                  شراء بعد اختراق أول قمة وتأكيد استمرار الزخم لتفادي الفخاخ السعرية.
                </div>
              </div>
            </div>

            {/* Trigger condition banner */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-white">شرط التأكيد الفني الموصى به:</div>
                <div className="text-xs text-slate-300 mt-0.5">{plannedTrade.entryTriggerCondition}</div>
              </div>
            </div>

            {/* Launch Button */}
            <button
              onClick={handleLaunchTrade}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-98 transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>بدء وتفعيل الصفقة في المحفظة الآن 🚀</span>
            </button>
          </div>

          {/* Card 3: Targets & Trailing Stop Rules */}
          <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">سلم جني الأرباح ونظام الوقف المتحرك</h3>
                  <p className="text-[11px] text-slate-400">قواعد التخارج المتدرج وحماية رأس المال</p>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20">
                الوقف الصارم: {plannedTrade.initialStopLoss} ج.م
              </span>
            </div>

            {/* Ladder Steps */}
            <div className="space-y-2.5">
              {plannedTrade.targets.map((tgt) => (
                <div
                  key={tgt.level}
                  className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-400 font-mono font-bold text-xs flex items-center justify-center">
                      H{tgt.level}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        الهدف {tgt.level}: {tgt.price} ج.م
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {tgt.level === 1
                          ? 'جني أرباح 50% ونقل الوقف فوراً لسعر الدخول (Breakeven)'
                          : tgt.level === 2
                          ? 'جني أرباح 30% إضافية ورفع الوقف لمستوى الهدف الأول'
                          : 'إغلاق آخر 20% بالكامل وتحقيق أقصى ربح للصفقة'}
                      </div>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      +{tgt.pctGain}%
                    </span>
                    <div className="text-[10px] text-slate-400 font-bold">
                      تخارج {tgt.exitSharePct}%
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Breakeven Rule Callout */}
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
              <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-xs text-emerald-200">
                <span className="font-bold">قاعدة حماية رأس المال الذهبية:</span> بمجرد وصول السعر إلى{' '}
                <span className="font-mono font-bold">{plannedTrade.targets[0].price} ج.م</span>، يقوم
                النظام تلقائياً بنقل وقف الخسارة إلى سعر الدخول{' '}
                <span className="font-mono font-bold">{plannedTrade.entryBatch1Price} ج.م</span> لتصبح
                الصفقة خالية تماماً من المخاطر.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Trades Live Monitor & Actions (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0b0f17] border border-cyan-500/30 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">متابعة الصفقات النشطة المفتوحة</h3>
                  <p className="text-[11px] text-slate-400">
                    رصد لحظي للأسعار، التوصيات الحية، وتعديل الوقف
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                {allActiveTrades.length} صفقات نشطة
              </span>
            </div>

            {allActiveTrades.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3">
                <Target className="w-10 h-10 text-slate-600 mx-auto" />
                <div className="text-sm font-bold text-slate-300">لا توجد صفقات نشطة حالياً</div>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  اختر سهمك المطلوب من القائمة أعلاه واضغط على "بدء وتفعيل الصفقة" لإدارتها ومتابعتها لحظة بلحظة.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {allActiveTrades.map((trade) => {
                  const live = stocks.find((s) => s.symbol === trade.symbol) || currentStock;
                  const curPrice = live.price > 0 ? live.price : trade.actualEntryPrice || 10;
                  const entryP = trade.actualEntryPrice || trade.entryBatch1Price;
                  const shares = trade.actualShares || trade.totalPlannedShares;
                  const pnl = Math.round(shares * (curPrice - entryP));
                  const pnlPct = Number((((curPrice - entryP) / entryP) * 100).toFixed(2));

                  return (
                    <div
                      key={trade.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        trade.symbol === currentStock.symbol
                          ? 'bg-slate-900/90 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                          : 'bg-slate-900/60 border-slate-800'
                      } space-y-3`}
                    >
                      {/* Trade Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-base">
                            {trade.symbol}
                          </span>
                          <span className="text-xs text-slate-300 font-semibold truncate max-w-[140px]">
                            {trade.stockNameAr}
                          </span>
                          <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded font-mono font-bold">
                            {trade.timeframe}
                          </span>
                        </div>
                        <div className="text-left">
                          <span
                            className={`font-mono font-black text-sm ${
                              pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {pnl >= 0 ? '+' : ''}
                            {pnl.toLocaleString()} ج.م
                          </span>
                          <div
                            className={`text-[10px] font-mono font-bold ${
                              pnlPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            ({pnlPct >= 0 ? '+' : ''}
                            {pnlPct}%)
                          </div>
                        </div>
                      </div>

                      {/* Trade Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
                          <div className="text-[10px] text-slate-400">سعر الدخول</div>
                          <div className="font-mono font-bold text-slate-200">{entryP.toFixed(2)} ج.م</div>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
                          <div className="text-[10px] text-slate-400">السعر اللحظي</div>
                          <div className="font-mono font-black text-white">{curPrice.toFixed(2)} ج.م</div>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
                          <div className="text-[10px] text-slate-400">الوقف الحالي</div>
                          <div
                            className={`font-mono font-bold ${
                              trade.isBreakevenTriggered ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {trade.trailingStopLoss.toFixed(2)} ج.م
                          </div>
                        </div>
                      </div>

                      {/* Breakeven badge if active */}
                      {trade.isBreakevenTriggered && (
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/30 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>الصفقة مؤمنة خالية من المخاطر (Breakeven مُفعل) ✅</span>
                        </div>
                      )}

                      {/* Live Advice Bar */}
                      {trade.liveAdviceAr && (
                        <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                          💡 <span className="font-semibold">{trade.liveAdviceAr}</span>
                        </div>
                      )}

                      {/* Warnings if any */}
                      {trade.warningFlags && trade.warningFlags.length > 0 && (
                        <div className="space-y-1">
                          {trade.warningFlags.map((w, i) => (
                            <div
                              key={i}
                              className="text-[11px] text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20 flex items-center gap-1.5 font-bold"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>{w}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => onSelectStock(trade.symbol)}
                          className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
                        >
                          عرض تفاصيل السهم
                        </button>
                        {onOpenAdvisor && (
                          <button
                            onClick={() => onOpenAdvisor(trade.symbol)}
                            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold transition-colors"
                          >
                            🤖 المستشار
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenExitModal(trade)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold transition-colors border border-rose-500/30"
                        >
                          إنهاء الصفقة 🏁
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exit Modal for closing a trade */}
      {closingTradeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0b0f17] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>إنهاء وتوثيق الصفقة</span>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                  {portfolio.trades.find((t) => t.id === closingTradeId)?.symbol}
                </span>
              </h3>
              <button
                onClick={() => setClosingTradeId(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-bold mb-1 block">سعر التخارج الفعلي (ج.م):</label>
                <input
                  type="number"
                  step="0.01"
                  value={exitPriceInput}
                  onChange={(e) => setExitPriceInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold mb-1 block">سبب الخروج من الصفقة:</label>
                <select
                  value={exitReason}
                  onChange={(e) => setExitReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                >
                  <option value="TARGET_ALL_HIT">🎯 تحقيق كامل الأهداف الثلاثة بنجاح</option>
                  <option value="TARGET_1_PARTIAL">✅ تحقيق الهدف الأول وجني أرباح جزئي</option>
                  <option value="TRAILING_STOP_HIT">🛡️ ضرب الوقف المتحرك لحماية الأرباح</option>
                  <option value="STOP_LOSS_HIT">⚠️ ضرب وقف الخسارة الصارم</option>
                  <option value="MANUAL_EXIT_PROFIT">💰 خروج يدوي مع ربح</option>
                  <option value="MANUAL_EXIT_LOSS">🛑 خروج يدوي مع خسارة لحماية المحفظة</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold mb-1 block">تقييمك لانضباط تنفيذ الصفقة:</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setExitRating(star)}
                      className={`text-lg transition-transform ${
                        exitRating >= star ? 'text-amber-400 scale-110' : 'text-slate-600'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="text-xs text-slate-400 mr-2">
                    {exitRating === 5
                      ? 'التزام مثالي بالقواعد'
                      : exitRating >= 3
                      ? 'التزام جيد'
                      : 'يحتاج تحسين'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold mb-1 block">الدروس المستفادة وملاحظات التداول:</label>
                <textarea
                  value={exitLessons}
                  onChange={(e) => setExitLessons(e.target.value)}
                  placeholder="ما الذي نجح في هذه الصفقة؟ وما الذي يمكن تحسينه في الصفقات القادمة؟"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                onClick={() => setClosingTradeId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmExitTrade}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-black shadow-lg shadow-emerald-500/20"
              >
                تأكيد الإغلاق والترحيل لسجل المحفظة ✅
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
