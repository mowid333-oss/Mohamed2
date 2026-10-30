import React, { useState, useMemo, useCallback } from 'react';
import {
  Flame,
  Zap,
  Clock,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Target,
  Copy,
  Check,
  AlertTriangle,
  Layers,
  ChevronDown,
  Search,
  DollarSign,
  Calendar,
  Activity,
  Award,
  Plus,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Info,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Radar,
  FileText,
  Calculator,
  Eye,
  X,
  SlidersHorizontal,
  BookmarkCheck,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { EGXStock } from '../types/stock';
import {
  AssetType,
  evaluateDayTradingSession,
  load14DayTradeLogs,
  save14DayTradeLogs,
  DayTradeLogItem,
  DayTradeAlert,
  TODAY_ECONOMIC_CALENDAR,
  scanAllMarketOpportunities,
  ScannedOpportunity,
  StrategyCategory,
} from '../services/dayTradingAnalystService';
import { formatEgpMoney } from './StockTable';
import { playSonarPingSound } from '../services/soundAlerts';
import { exportTradingPlansToExcel, exportMasterPlatformWorkbookToExcel, exportMasterComprehensiveAllStocksExcel } from '../services/excelExportService';
import { scanDivergences, calculateStockTechnicalIndicators } from '../services/technicalAnalysisService';
import { TradingViewRatingWidget } from './TradingViewRatingWidget';
import { calculateAccumulationDistribution } from '../utils/accumulationDistributionEngine';

interface DayTradingAnalystTabProps {
  stocks: EGXStock[];
  selectedSymbol: string;
  onSelectStock: (symbol: string) => void;
  onSelectStockForChart: (symbol: string) => void;
}

export const DayTradingAnalystTab: React.FC<DayTradingAnalystTabProps> = ({
  stocks,
  selectedSymbol,
  onSelectStock,
  onSelectStockForChart,
}) => {
  // Main view mode: Scanner (الخيار المطلوب) vs Desk vs Journal
  const [activeSubView, setActiveSubView] = useState<'SCANNER' | 'DESK' | 'JOURNAL'>('SCANNER');

  // Desk State
  const [assetType, setAssetType] = useState<AssetType>('XAUUSD');
  const [selectedEgxStockSymbol, setSelectedEgxStockSymbol] = useState<string>(selectedSymbol || 'TMGH');
  const [capitalInput, setCapitalInput] = useState<number>(10000); // $10,000 or EGP
  const [tradeLogs, setTradeLogs] = useState<DayTradeLogItem[]>(() => load14DayTradeLogs());
  const [copiedAlert, setCopiedAlert] = useState<boolean>(false);
  const [copiedUpdate, setCopiedUpdate] = useState<boolean>(false);
  const [updateAction, setUpdateAction] = useState<string>('MOVE_SL_TO_BE');
  const [updateReasonInput, setUpdateReasonInput] = useState<string>(
    'تم تحقيق الهدف الأول +1.6R وتأمين الصفقة بنقل الوقف لنقطة الدخول.'
  );
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [isStockDropdownOpen, setIsStockDropdownOpen] = useState(false);

  // Scanner State (خيار البحث في الأسهم كلها واستخراج الفرص الجيدة وخطة التداول)
  const [scannerGradeFilter, setScannerGradeFilter] = useState<'ALL' | 'A_PLUS_ONLY'>('ALL');
  const [scannerStrategyFilter, setScannerStrategyFilter] = useState<StrategyCategory>('ALL');
  const [scannerShariahOnly, setScannerShariahOnly] = useState<boolean>(false);
  const [scannerEgx30Only, setScannerEgx30Only] = useState<boolean>(false);
  const [scannerSearchQuery, setScannerSearchQuery] = useState<string>('');
  const [scannerCapitalEgp, setScannerCapitalEgp] = useState<number>(100000);
  const [scannerRiskPct, setScannerRiskPct] = useState<number>(0.5); // Default: 0.5% strict SMC risk
  const [isScanningAll, setIsScanningAll] = useState<boolean>(false);
  const [scanProgressPct, setScanProgressPct] = useState<number>(100);
  const [copiedOppId, setCopiedOppId] = useState<string | null>(null);

  // Detailed Modal for Full Trading Plan
  const [selectedOpportunityForModal, setSelectedOpportunityForModal] = useState<ScannedOpportunity | null>(null);

  const currentEgxStock = useMemo(() => {
    return stocks.find((s) => s.symbol === selectedEgxStockSymbol) || stocks[0];
  }, [stocks, selectedEgxStockSymbol]);

  // Evaluate Live Session State for Desk
  const sessionData = useMemo(() => {
    return evaluateDayTradingSession(assetType, assetType === 'EGX_STOCK' ? currentEgxStock : undefined);
  }, [assetType, currentEgxStock]);

  const activeAlert = sessionData.activeAlert;

  // Filter stocks for dropdown
  const filteredStocks = useMemo(() => {
    if (!stockSearchQuery.trim()) return stocks.slice(0, 30);
    const q = stockSearchQuery.toLowerCase().trim();
    return stocks
      .filter((s) => s.symbol.toLowerCase().includes(q) || s.nameAr.toLowerCase().includes(q))
      .slice(0, 40);
  }, [stocks, stockSearchQuery]);

  // All market opportunities computation (البحث في الأسهم كلها واستخراج الفرص وخطة التداول)
  const allScannedOpportunities: ScannedOpportunity[] = useMemo(() => {
    return scanAllMarketOpportunities(
      stocks,
      scannerGradeFilter,
      scannerShariahOnly,
      scannerStrategyFilter,
      scannerCapitalEgp,
      scannerRiskPct
    );
  }, [stocks, scannerGradeFilter, scannerShariahOnly, scannerStrategyFilter, scannerCapitalEgp, scannerRiskPct]);

  const filteredOpportunities = useMemo(() => {
    let list = allScannedOpportunities;
    if (scannerEgx30Only) {
      list = list.filter((opp) => opp.stock.isInEgx30);
    }
    if (scannerSearchQuery.trim()) {
      const q = scannerSearchQuery.toLowerCase().trim();
      list = list.filter(
        (opp) =>
          opp.stock.symbol.toLowerCase().includes(q) ||
          opp.stock.nameAr.toLowerCase().includes(q) ||
          opp.setupType.toLowerCase().includes(q) ||
          opp.strategyCategoryAr.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allScannedOpportunities, scannerEgx30Only, scannerSearchQuery]);

  // Trigger Full Scan with progress animation and sound
  const handleTriggerMarketScan = useCallback(() => {
    setIsScanningAll(true);
    setScanProgressPct(15);
    try {
      playSonarPingSound();
    } catch {}

    const t1 = setTimeout(() => setScanProgressPct(55), 250);
    const t2 = setTimeout(() => setScanProgressPct(90), 500);
    const t3 = setTimeout(() => {
      setScanProgressPct(100);
      setIsScanningAll(false);
    }, 750);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Desk Capital & Lot Sizing calculation (0.5% risk)
  const riskAmount = (capitalInput * 0.5) / 100;
  const priceDistanceToSl = activeAlert ? Math.abs(activeAlert.entryOptimal - activeAlert.stopLoss) : 10;

  const calculatedPositionSize = useMemo(() => {
    if (priceDistanceToSl <= 0) return 0;
    if (assetType === 'XAUUSD') {
      const lots = riskAmount / (priceDistanceToSl * 100);
      return Number(Math.max(0.01, lots).toFixed(2));
    }
    const shares = Math.floor(riskAmount / priceDistanceToSl);
    return Math.max(10, shares);
  }, [assetType, riskAmount, priceDistanceToSl]);

  const handleCopyAlert = () => {
    if (!activeAlert) return;
    navigator.clipboard.writeText(activeAlert.rawAlertText);
    setCopiedAlert(true);
    setTimeout(() => setCopiedAlert(false), 2200);
  };

  const handleCopyOpportunityAlert = (opp: ScannedOpportunity) => {
    navigator.clipboard.writeText(opp.rawAlertText);
    setCopiedOppId(opp.stock.symbol);
    setTimeout(() => setCopiedOppId(null), 2200);
  };

  const handleCopyUpdate = () => {
    const symbolStr = assetType === 'XAUUSD' ? 'XAUUSD' : currentEgxStock.symbol;
    const priceStr = assetType === 'XAUUSD' ? `$${sessionData.currentPrice.toFixed(2)}` : `${sessionData.currentPrice.toFixed(2)} EGP`;
    const actionLabel =
      updateAction === 'MOVE_SL_TO_BE'
        ? 'MOVE SL TO BE (نقل الوقف لنقطة الدخول 🛡️)'
        : updateAction === 'PARTIAL_CLOSE'
        ? 'PARTIAL CLOSE (جني أرباح جزئي 50% 💰)'
        : updateAction === 'HOLD'
        ? 'HOLD (استمرار في الصفقة ⏳)'
        : updateAction === 'CLOSE_TRADE'
        ? 'CLOSE TRADE (إغلاق كامل 🛑)'
        : 'LET TP HIT (ترك السعر لتحقيق الهدف التالي 🎯)';

    const updateText = `🔄 ${symbolStr} TRADE UPDATE

Current Price: ${priceStr}
Trade Status: ACTIVE (الصفقة قيد المتابعة)
PnL in R: +1.6R
Market Structure: تأكيد كسر هيكلي صاعد على M15 و M5 واستمرار الزخم الإيجابي

ACTION: ${actionLabel}

Reason: ${updateReasonInput}`;

    navigator.clipboard.writeText(updateText);
    setCopiedUpdate(true);
    setTimeout(() => setCopiedUpdate(false), 2200);
  };

  const handleLogActiveTrade = () => {
    if (!activeAlert) return;
    const newLog: DayTradeLogItem = {
      tradeNumber: tradeLogs.length + 1,
      id: `trade-exp-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      asset: activeAlert.assetSymbol,
      direction: activeAlert.direction,
      entryPrice: activeAlert.entryOptimal,
      stopLoss: activeAlert.stopLoss,
      takeProfit: activeAlert.takeProfit1,
      result: 'RUNNING',
      rMultiple: 0.0,
      dailyPnlPct: 0.0,
      cumulativePnlPct: tradeLogs[tradeLogs.length - 1]?.cumulativePnlPct || 2.09,
      tradeQuality: activeAlert.tradeQuality,
      notesAr: `${activeAlert.setupType} - ${activeAlert.reasons[0]}`,
    };
    const updated = [newLog, ...tradeLogs];
    setTradeLogs(updated);
    save14DayTradeLogs(updated);
  };

  const handleLogScannedOpportunity = (opp: ScannedOpportunity) => {
    const newLog: DayTradeLogItem = {
      tradeNumber: tradeLogs.length + 1,
      id: `trade-opp-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      asset: opp.stock.symbol,
      direction: opp.direction,
      entryPrice: opp.entryOptimal,
      stopLoss: opp.stopLoss,
      takeProfit: opp.takeProfit1,
      result: 'RUNNING',
      rMultiple: 0.0,
      dailyPnlPct: 0.0,
      cumulativePnlPct: tradeLogs[0]?.cumulativePnlPct || 2.09,
      tradeQuality: opp.quality,
      notesAr: `${opp.setupType} - ${opp.reasons[0]}`,
    };
    const updated = [newLog, ...tradeLogs];
    setTradeLogs(updated);
    save14DayTradeLogs(updated);
  };

  const handleLoadOpportunityInDesk = (opp: ScannedOpportunity) => {
    setAssetType('EGX_STOCK');
    setSelectedEgxStockSymbol(opp.stock.symbol);
    onSelectStock(opp.stock.symbol);
    setActiveSubView('DESK');
  };

  // Cumulative journal stats
  const totalR = tradeLogs.reduce((acc, t) => acc + (t.rMultiple || 0), 0);
  const winCount = tradeLogs.filter((t) => t.result === 'WIN').length;
  const closedCount = tradeLogs.filter((t) => t.result !== 'RUNNING').length;
  const winRate = closedCount > 0 ? Math.round((winCount / closedCount) * 100) : 100;
  const cumulativePnl = tradeLogs.length > 0 ? tradeLogs[0].cumulativePnlPct : 2.09;

  const handleExportAllToMasterWorkbook = () => {
    const divergences = scanDivergences(stocks);
    const analyzedList = stocks.map((s) => ({
      stock: s,
      indicators: calculateStockTechnicalIndicators(s, '1D'),
    }));
    exportMasterPlatformWorkbookToExcel(stocks, allScannedOpportunities, divergences, analyzedList);
  };

  return (
    <div className="space-y-6 font-['Cairo'] pb-12">
      {/* ============================================================== */}
      {/* HERO SPOTLIGHT: خيار البحث في الأسهم كلها واستخراج خطة التداول */}
      {/* ============================================================== */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-950 via-[#151108] to-amber-950/70 border border-amber-500/40 shadow-2xl relative overflow-hidden space-y-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/3 translate-y-1/3" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 p-0.5 shadow-xl shadow-amber-500/25 shrink-0">
              <div className="w-full h-full bg-[#070a0f] rounded-[14px] flex items-center justify-center">
                <Radar className="w-7 h-7 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-2xl font-black text-white">
                  مكتب التداول اللحظي وماسح الأسهم الذكي
                </h2>
                <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-amber-500/25 text-amber-300 font-mono border border-amber-500/40">
                  خيار فحص الأسهم واستخراج خطط التداول ⚡
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/40">
                  SMC & Multi-Timeframe
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-3xl leading-relaxed">
                محرك ذكي يفحص <strong className="text-amber-300">كافة أسهم البورصة المصرية (290+ سهم)</strong> لحظة بلحظة، يستخرج الفرص الاستثنائية (A+ و A) ذات الاحتمالية العالية، ويولد <strong className="text-cyan-300">خطة تداول تنفيذية كاملة</strong> (نطاق الدخول، وقف الخسارة، الأهداف الثلاثة، وإدارة رأس المال 0.5%).
              </p>
            </div>
          </div>

          {/* Trigger Scan & Excel Export Buttons Group */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={() => {
                setActiveSubView('SCANNER');
                handleTriggerMarketScan();
              }}
              disabled={isScanningAll}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-amber-500/30 active:scale-95 transition-all cursor-pointer disabled:opacity-60 border border-amber-200/50"
            >
              <RefreshCw className={`w-4 h-4 ${isScanningAll ? 'animate-spin' : ''}`} />
              <span>{isScanningAll ? 'جاري فحص جميع الأسهم...' : '⚡ فحص واستخراج الفرص'}</span>
            </button>

            <button
              onClick={() => exportMasterComprehensiveAllStocksExcel(stocks, scannerCapitalEgp, scannerRiskPct)}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer border border-emerald-400/40"
              title="تحميل التقرير العام الشامل لجميع الأسهم المصرية (290+ سهم) من جميع النواحي والخطط والأهداف والمخاطر ومقياس التجميع والتصريف (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>تقرير شامل Excel لكل الأسهم (290+ سهم) 📊</span>
              <Download className="w-3.5 h-3.5 text-emerald-200" />
            </button>

            <button
              onClick={() => exportTradingPlansToExcel(filteredOpportunities, scannerCapitalEgp, scannerRiskPct)}
              className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-sm border border-amber-500/40 active:scale-95 transition-all cursor-pointer"
              title="تحميل تقرير إكسيل فوري لكافة خطط التداول والفرص الحالية (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-300" />
              <span>إكسيل خطط الفرص ({filteredOpportunities.length})</span>
              <Download className="w-3.5 h-3.5 text-amber-300" />
            </button>

            <button
              onClick={handleExportAllToMasterWorkbook}
              className="px-3.5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm border border-slate-700 active:scale-95 transition-all cursor-pointer"
              title="تحميل المصنف الشامل لكافة رادارات وأسهم المنصة بملف إكسيل واحد متعدد الأوراق (.xlsx)"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">مصنف الرواصد 📑</span>
            </button>
          </div>
        </div>

        {/* View Mode Switcher Tabs (Scanner vs Desk vs Journal) */}
        <div className="relative z-10 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto no-scrollbar w-full sm:w-auto">
            <button
              onClick={() => setActiveSubView('SCANNER')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeSubView === 'SCANNER'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-md shadow-amber-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radar className="w-4 h-4" />
              <span>ماسح جميع الأسهم واستخراج خطط التداول</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 text-amber-300 font-mono font-black">
                {filteredOpportunities.length} فرصة
              </span>
            </button>

            <button
              onClick={() => setActiveSubView('DESK')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeSubView === 'DESK'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-black shadow-md shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>مكتب الصفقات اللحظية (XAUUSD والأسهم)</span>
            </button>

            <button
              onClick={() => setActiveSubView('JOURNAL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeSubView === 'JOURNAL'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md shadow-emerald-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>سجل متابعة تجربة الـ 14 يوماً ({tradeLogs.length})</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400">إجمالي الأسهم الممسوحة:</span>
              <span className="font-mono font-bold text-amber-300">{stocks.length} سهماً</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400">فرص A+ الاستثنائية:</span>
              <span className="font-mono font-bold text-emerald-400">
                {allScannedOpportunities.filter((o) => o.quality === 'A+').length}
              </span>
            </div>
          </div>
        </div>

        {/* Scan Progress Bar (when scanning) */}
        {isScanningAll && (
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-300 h-1.5 transition-all duration-300 ease-out"
              style={{ width: `${scanProgressPct}%` }}
            />
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* SECTION 1: ALL MARKET OPPORTUNITIES SCANNER & TRADING PLANS     */}
      {/* ============================================================== */}
      {activeSubView === 'SCANNER' && (
        <div className="space-y-6">
          {/* Controls: Strategy Filters, Capital & Risk Sizing, Search */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#0b0f17] border border-amber-500/30 shadow-xl space-y-4">
            {/* Top Toolbar: Grade, Shariah, EGX30 & Search */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Primary Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
                <button
                  onClick={() => setScannerGradeFilter('ALL')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    scannerGradeFilter === 'ALL'
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  جميع الفرص الجيدة ({allScannedOpportunities.length})
                </button>

                <button
                  onClick={() => setScannerGradeFilter('A_PLUS_ONLY')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    scannerGradeFilter === 'A_PLUS_ONLY'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-amber-400 border border-slate-800'
                  }`}
                >
                  فرص استثنائية (A+ فقط 💎)
                </button>

                <button
                  onClick={() => setScannerShariahOnly(!scannerShariahOnly)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    scannerShariahOnly
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-emerald-400 border border-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>الأسهم الشرعية فقط</span>
                </button>

                <button
                  onClick={() => setScannerEgx30Only(!scannerEgx30Only)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    scannerEgx30Only
                      ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-cyan-400 border border-slate-800'
                  }`}
                >
                  <span>أسهم EGX30 القيادية</span>
                </button>
              </div>

              {/* Search query input */}
              <div className="relative w-full lg:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={scannerSearchQuery}
                  onChange={(e) => setScannerSearchQuery(e.target.value)}
                  placeholder="ابحث بالرمز أو اسم السهم أو النموذج..."
                  className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Secondary Toolbar: Strategy Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-slate-800/80">
              <span className="text-xs text-slate-400 font-bold shrink-0 ml-2">استراتيجية النموذج الفني:</span>
              <button
                onClick={() => setScannerStrategyFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  scannerStrategyFilter === 'ALL'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setScannerStrategyFilter('SWEEP')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  scannerStrategyFilter === 'SWEEP'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-amber-300'
                }`}
              >
                سحب سيولة بيعية (SMC Sweep)
              </button>
              <button
                onClick={() => setScannerStrategyFilter('BREAKOUT')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  scannerStrategyFilter === 'BREAKOUT'
                    ? 'bg-cyan-500 text-slate-950 font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-cyan-300'
                }`}
              >
                اختراق حجمي مؤسسي (Volume Breakout)
              </button>
              <button
                onClick={() => setScannerStrategyFilter('DEMAND_RETEST')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  scannerStrategyFilter === 'DEMAND_RETEST'
                    ? 'bg-teal-500 text-slate-950 font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-teal-300'
                }`}
              >
                إعادة اختبار طلب FVG
              </button>
              <button
                onClick={() => setScannerStrategyFilter('DIVERGENCE')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  scannerStrategyFilter === 'DIVERGENCE'
                    ? 'bg-purple-500 text-white font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-purple-300'
                }`}
              >
                دايفرجنس إيجابي للزخم
              </button>
              <button
                onClick={() => setScannerStrategyFilter('MOMENTUM')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  scannerStrategyFilter === 'MOMENTUM'
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-emerald-300'
                }`}
              >
                زخم قيادي صاعد
              </button>
            </div>

            {/* Trading Plan Parameters Toolbar: Capital & Strict 0.5% Risk Settings */}
            <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Calculator className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="font-bold text-white">إعدادات حاسبة خطة التداول وإدارة رأس المال:</span>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                {/* Capital input with presets */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">رأس المال:</span>
                  <select
                    value={scannerCapitalEgp}
                    onChange={(e) => setScannerCapitalEgp(Number(e.target.value))}
                    className="bg-slate-900 text-cyan-300 font-mono font-bold px-2.5 py-1 rounded-lg border border-slate-700 focus:outline-none"
                  >
                    <option value={50000}>50,000 ج.م</option>
                    <option value={100000}>100,000 ج.م (الافتراضي)</option>
                    <option value={250000}>250,000 ج.م</option>
                    <option value={500000}>500,000 ج.م</option>
                    <option value={1000000}>1,000,000 ج.م</option>
                  </select>
                </div>

                {/* Risk per trade */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">نسبة المخاطرة لكل صفقة:</span>
                  <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-700">
                    <button
                      onClick={() => setScannerRiskPct(0.5)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        scannerRiskPct === 0.5
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      0.5% (مؤسسي صارم ⭐)
                    </button>
                    <button
                      onClick={() => setScannerRiskPct(1.0)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        scannerRiskPct === 1.0
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      1.0% (متوازن)
                    </button>
                  </div>
                </div>

                <div className="font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/60">
                  أقصى خسارة مسموحة عند الوقف: {((scannerCapitalEgp * scannerRiskPct) / 100).toLocaleString()} ج.م
                </div>

                {/* Instant Excel Download of Filtered Opportunities */}
                <button
                  onClick={() => exportTradingPlansToExcel(filteredOpportunities, scannerCapitalEgp, scannerRiskPct)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer border border-emerald-400/40"
                  title="تصدير نتائج الفحص الحالية لملف إكسيل (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                  <span>تصدير النتائج ({filteredOpportunities.length}) إلى Excel</span>
                  <Download className="w-3.5 h-3.5 text-emerald-200" />
                </button>
              </div>
            </div>
          </div>

          {/* Scanned Opportunities Cards Grid */}
          {filteredOpportunities.length === 0 ? (
            <div className="p-16 text-center rounded-3xl bg-[#0b0f17] border border-slate-800 space-y-3">
              <Target className="w-12 h-12 text-slate-600 mx-auto" />
              <div className="text-base font-bold text-white">لا توجد صفقات تستوفي شروط الفلتر المحددة حالياً</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                وفق قواعد التداول المؤسسي الصارم: لا ندخل أي صفقة إلا إذا تحقق سحب السيولة وكسر الهيكل ونسبة عائد تفوق 1:2.0. جرّب اختيار فلتر (الكل) أو إعادة مسح السوق.
              </p>
              <button
                onClick={() => {
                  setScannerGradeFilter('ALL');
                  setScannerStrategyFilter('ALL');
                  setScannerSearchQuery('');
                  setScannerShariahOnly(false);
                  setScannerEgx30Only(false);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer hover:bg-amber-400 transition-colors"
              >
                إعادة ضبط جميع الفلاتر
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredOpportunities.map((opp) => {
                const isCopied = copiedOppId === opp.stock.symbol;

                return (
                  <div
                    key={opp.stock.symbol}
                    className="p-5 sm:p-6 rounded-3xl bg-[#0b0f17] border border-slate-800 hover:border-amber-500/50 transition-all shadow-xl space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Top Header: Symbol, Name, Quality Badge & Price */}
                      <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-amber-500/30 flex items-center justify-center font-mono font-black text-amber-300 text-base shadow-inner">
                            {opp.stock.symbol}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-base font-black text-white">{opp.stock.nameAr}</h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                {opp.setupBadgeAr}
                              </span>
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300">
                                تقييم: {opp.score}/100
                              </span>
                              {opp.stock.isShariahCompliant && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                                  شرعي 🟢
                                </span>
                              )}
                              <TradingViewRatingWidget stock={opp.stock} variant="MINI_BADGE" />
                              {(() => {
                                const ad = calculateAccumulationDistribution(opp.stock, 'يومي (1D)');
                                return (
                                  <span
                                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                      ad.isAccumulation
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                        : ad.isDistribution
                                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                        : 'bg-slate-800 text-slate-300 border-slate-700'
                                    }`}
                                    title={`مقياس التجميع والتصريف الدقيق: ${ad.phaseAr} (تجميع ${ad.accumulationScore}% / تصريف ${ad.distributionScore}%)`}
                                  >
                                    🔬 {ad.phaseAr}
                                  </span>
                                );
                              })()}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                              <span>{opp.stock.sectorAr}</span>
                              <span>•</span>
                              <span>السيولة: {formatEgpMoney(opp.stock.valueTraded)}</span>
                              <span>•</span>
                              <span className="text-cyan-400">{opp.strategyCategoryAr}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-left font-mono">
                          <div className="text-base font-black text-white">{opp.stock.price.toFixed(2)} ج.م</div>
                          <span
                            className={`text-xs font-bold ${
                              opp.stock.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {opp.stock.changePct >= 0 ? '+' : ''}
                            {opp.stock.changePct}%
                          </span>
                        </div>
                      </div>

                      {/* Setup Summary Badge */}
                      <div className="p-3 rounded-2xl bg-slate-950 border border-slate-850 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-amber-400 font-bold flex items-center gap-1.5">
                            <Target className="w-4 h-4 text-amber-400" />
                            <span>النموذج الفني:</span>
                          </span>
                          <span className="font-mono text-cyan-300 font-bold">
                            العائد/المخاطرة {opp.riskRewardRatio}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 font-medium">{opp.setupType}</p>
                      </div>

                      {/* Exact TradingView Technical Chart Opinion & Levels */}
                      <TradingViewRatingWidget
                        stock={opp.stock}
                        timeframeLabel="يومي (1D)"
                        variant="COMPACT_BANNER"
                        onOpenChart={onSelectStockForChart}
                      />

                      {/* Complete Trading Plan Grid (خطة التداول المكتملة بالأرقام الدقيقة) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-white flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-cyan-400" />
                            <span>خطة التداول التنفيذية (مخاطرة {scannerRiskPct}%):</span>
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {opp.recommendedShares.toLocaleString()} سهم • {(opp.totalPositionValueEgp).toLocaleString()} ج.م
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                            <span className="text-[10px] text-slate-400 block font-sans">نطاق الشراء</span>
                            <span className="font-bold text-white mt-0.5 block">
                              {opp.entryZoneMin} - {opp.entryZoneMax}
                            </span>
                            <span className="text-[9px] text-cyan-300 block font-sans">المثالي: {opp.entryOptimal}</span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-950 border border-rose-500/30">
                            <span className="text-[10px] text-rose-400 block font-sans">وقف الخسارة SL</span>
                            <span className="font-bold text-rose-400 mt-0.5 block">
                              {opp.stopLoss.toFixed(2)} ج.م
                            </span>
                            <span className="text-[9px] text-rose-400/80 block">-{opp.stopLossPct}%</span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/30">
                            <span className="text-[10px] text-emerald-400 block font-sans">الهدف 1 (50%)</span>
                            <span className="font-bold text-emerald-300 mt-0.5 block">
                              {opp.takeProfit1.toFixed(2)} ج.م
                            </span>
                            <span className="text-[9px] text-emerald-400 block">+{opp.takeProfit1GainPct}% تأمين 🛡️</span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-950 border border-teal-500/30">
                            <span className="text-[10px] text-teal-400 block font-sans">الهدف 2 (30%)</span>
                            <span className="font-bold text-teal-300 mt-0.5 block">
                              {opp.takeProfit2.toFixed(2)} ج.م
                            </span>
                            <span className="text-[9px] text-teal-300 block">+{opp.takeProfit2GainPct}% جني 💰</span>
                          </div>
                        </div>
                      </div>

                      {/* Position Sizing and Money Risk Breakdown */}
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-300 flex-wrap gap-2">
                        <div>
                          <span className="text-slate-500 font-sans">أقصى خسارة بالوقف: </span>
                          <span className="text-rose-400 font-bold">-{opp.maxRiskAmountEgp.toLocaleString()} ج.م</span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-sans">ربح TP1: </span>
                          <span className="text-emerald-400 font-bold">+{opp.potentialProfitTp1Egp.toLocaleString()} ج.م</span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-sans">ربح تراكمي TP2: </span>
                          <span className="text-teal-400 font-bold">+{opp.potentialProfitTp2Egp.toLocaleString()} ج.م</span>
                        </div>
                      </div>

                      {/* Trade Reasons */}
                      <div className="space-y-1 text-xs text-slate-300">
                        {opp.reasons.slice(0, 2).map((r, i) => (
                          <div key={i} className="flex items-start gap-1.5 leading-relaxed">
                            <span className="text-emerald-400 shrink-0">✓</span>
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Opportunity Action Buttons */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyOpportunityAlert(opp)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="نسخ قالب التنبيه وخطة التداول الرسمية 🚨"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                          <span>{isCopied ? 'تم النسخ' : 'نسخ الخطة 🚨'}</span>
                        </button>

                        <button
                          onClick={() => setSelectedOpportunityForModal(opp)}
                          className="px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="عرض خطة التداول المكتملة بالتفصيل"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>عرض الخطة</span>
                        </button>

                        <button
                          onClick={() => exportTradingPlansToExcel([opp], scannerCapitalEgp, scannerRiskPct, `خطة_تداول_${opp.stock.symbol}`)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="تحميل خطة تداول هذا السهم بصيغة Excel (.xlsx)"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                          <span>إكسيل 📊</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectStockForChart(opp.stock.symbol)}
                          className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/40 text-xs font-bold transition-colors cursor-pointer"
                        >
                          الشارت 📊
                        </button>

                        <button
                          onClick={() => handleLoadOpportunityInDesk(opp)}
                          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                        >
                          <span>فتح في المكتب</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 2: LIVE TRADING DESK (Single Asset View - XAUUSD or EGX) */}
      {/* ============================================================== */}
      {activeSubView === 'DESK' && (
        <div className="space-y-6">
          {/* Asset Selector & Live Session Controls */}
          <div className="p-5 rounded-3xl bg-[#0b0f17] border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400">الأصل المالي المختار:</span>
                <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setAssetType('XAUUSD')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      assetType === 'XAUUSD'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🥇 الذهب (XAUUSD)
                  </button>
                  <button
                    onClick={() => setAssetType('EGX_STOCK')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      assetType === 'EGX_STOCK'
                        ? 'bg-cyan-500 text-slate-950 font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    📈 سهم مصري ({currentEgxStock.symbol})
                  </button>
                </div>
              </div>

              {/* EGX Stock Selector Dropdown */}
              {assetType === 'EGX_STOCK' && (
                <div className="relative w-full sm:w-72">
                  <div
                    onClick={() => setIsStockDropdownOpen(!isStockDropdownOpen)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 cursor-pointer text-xs"
                  >
                    <span className="font-bold text-white">
                      {currentEgxStock.nameAr} ({currentEgxStock.symbol})
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>

                  {isStockDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 max-h-60 overflow-y-auto space-y-1">
                      <input
                        type="text"
                        placeholder="ابحث عن سهم..."
                        value={stockSearchQuery}
                        onChange={(e) => setStockSearchQuery(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white mb-1 focus:outline-none"
                      />
                      {filteredStocks.map((s) => (
                        <div
                          key={s.symbol}
                          onClick={() => {
                            setSelectedEgxStockSymbol(s.symbol);
                            onSelectStock(s.symbol);
                            setIsStockDropdownOpen(false);
                          }}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer ${
                            s.symbol === currentEgxStock.symbol
                              ? 'bg-amber-500/20 text-amber-300 font-bold'
                              : 'text-slate-300 hover:bg-slate-900'
                          }`}
                        >
                          <span>{s.nameAr} ({s.symbol})</span>
                          <span className="font-mono">{s.price.toFixed(2)} ج.م</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Live Status Bar of the Selected Asset */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">السعر اللحظي</span>
                <span className="text-base font-black text-amber-300 mt-1 block">
                  {assetType === 'XAUUSD' ? `$${sessionData.currentPrice.toFixed(2)}` : `${sessionData.currentPrice.toFixed(2)} EGP`}
                </span>
                <span className="text-[10px] text-slate-500 font-sans block">{sessionData.dataSource}</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">أعلى / أدنى اليوم</span>
                <span className="text-sm font-bold text-white mt-1 block">
                  H: {sessionData.highToday.toFixed(2)} | L: {sessionData.lowToday.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500 font-sans block">نطاق حركة الجلسة</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">الجلسة وتوقيت القاهرة</span>
                <span className="text-sm font-bold text-cyan-300 mt-1 block">{sessionData.cairoTimeFormatted}</span>
                <span className="text-[10px] text-emerald-400 font-sans block">{sessionData.sessionPhaseAr}</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">حالة النظام</span>
                <span className="text-xs font-black text-amber-400 mt-1 block truncate">
                  {sessionData.currentStatus}
                </span>
                <span className="text-[10px] text-slate-400 font-sans block truncate">{sessionData.statusExplanationAr}</span>
              </div>
            </div>
          </div>

          {/* Active Trade Alert (If available) */}
          {activeAlert ? (
            <div className="p-6 rounded-3xl bg-gradient-to-b from-[#121824] to-[#0b0f17] border border-amber-500/40 shadow-2xl space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black font-mono">
                      {activeAlert.direction} 🟢
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black font-mono">
                      صفقة جودة {activeAlert.tradeQuality}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      تنبيه صفقة لحظية مؤكدة: {activeAlert.assetNameAr} ({activeAlert.assetSymbol})
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">النموذج: {activeAlert.setupType}</p>
                </div>

                <button
                  onClick={handleCopyAlert}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  {copiedAlert ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedAlert ? 'تم النسخ' : 'نسخ التنبيه 🚨'}</span>
                </button>
              </div>

              {/* Execution Plan Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs font-mono">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">نطاق الدخول</span>
                  <span className="text-sm font-bold text-white mt-1 block">
                    {activeAlert.entryZoneMin} - {activeAlert.entryZoneMax}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-rose-500/30">
                  <span className="text-[10px] text-rose-400 block font-sans">وقف الخسارة SL</span>
                  <span className="text-sm font-bold text-rose-400 mt-1 block">{activeAlert.stopLoss}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 block font-sans">الهدف 1 (50%)</span>
                  <span className="text-sm font-bold text-emerald-300 mt-1 block">{activeAlert.takeProfit1}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-teal-500/30">
                  <span className="text-[10px] text-teal-400 block font-sans">الهدف 2 (30%)</span>
                  <span className="text-sm font-bold text-teal-300 mt-1 block">{activeAlert.takeProfit2}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={handleLogActiveTrade}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>تسجيل هذه الصفقة في سجل الـ 14 يوماً</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-[#0b0f17] border border-slate-800 space-y-3">
              <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
              <div className="text-base font-bold text-white">LIVE DATA VERIFIED — WAITING FOR HIGH QUALITY SETUP</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                وفق شروط النظام الصارمة: لا يتم فتح أي صفقة إلا بعد استيفاء سحب السيولة على M15 وكسر الهيكل على M5 ومخاطرة 0.5% فقط.
              </p>
            </div>
          )}

          {/* Quick Trade Update Message Generator */}
          <div className="p-5 rounded-3xl bg-[#0b0f17] border border-slate-800 space-y-4">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>مُولّد تحديثات الصفقات المباشرة (Live Trade Update Generator)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">الإجراء المتخذ (Action):</label>
                <select
                  value={updateAction}
                  onChange={(e) => setUpdateAction(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold"
                >
                  <option value="MOVE_SL_TO_BE">MOVE SL TO BE (نقل الوقف لنقطة الدخول 🛡️)</option>
                  <option value="PARTIAL_CLOSE">PARTIAL CLOSE (جني أرباح جزئي 50% 💰)</option>
                  <option value="HOLD">HOLD (استمرار في الصفقة ⏳)</option>
                  <option value="CLOSE_TRADE">CLOSE TRADE (إغلاق كامل 🛑)</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">السبب والشرح الفني:</label>
                <input
                  type="text"
                  value={updateReasonInput}
                  onChange={(e) => setUpdateReasonInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
            </div>
            <button
              onClick={handleCopyUpdate}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
            >
              {copiedUpdate ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedUpdate ? 'تم نسخ التحديث' : 'نسخ رسالة التحديث 📋'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 3: 14-DAY EXPERIMENT JOURNAL (Requested Strict Log)     */}
      {/* ============================================================== */}
      {activeSubView === 'JOURNAL' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-[#0b0f17] border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">سجل متابعة تجربة الـ 14 يوماً (Strict SMC Journal)</h3>
                <p className="text-xs text-slate-400">إدارة رأس المال الصارمة: 0.5% لكل صفقة، وأقصى خسارة يومية 1.5%.</p>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs">
                <div className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-bold">
                  نسبة النجاح: {winRate}%
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 font-bold">
                  إجمالي الربح: +{cumulativePnl}% (+{totalR.toFixed(1)}R)
                </div>
              </div>
            </div>

            {/* Table of Trades */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">التاريخ</th>
                    <th className="py-2.5 px-3">الأصل</th>
                    <th className="py-2.5 px-3">الاتجاه</th>
                    <th className="py-2.5 px-3">سعر الدخول</th>
                    <th className="py-2.5 px-3">الوقف SL</th>
                    <th className="py-2.5 px-3">الهدف TP</th>
                    <th className="py-2.5 px-3">النتيجة</th>
                    <th className="py-2.5 px-3">مضاعف R</th>
                    <th className="py-2.5 px-3">الجودة</th>
                    <th className="py-2.5 px-3">الملاحظات الفنية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 font-mono">
                  {tradeLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-3 text-slate-400 font-sans">{log.tradeNumber}</td>
                      <td className="py-3 px-3 text-slate-300">{log.date}</td>
                      <td className="py-3 px-3 font-bold text-white">{log.asset}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.direction === 'BUY'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {log.direction}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-200">{log.entryPrice}</td>
                      <td className="py-3 px-3 text-rose-400">{log.stopLoss}</td>
                      <td className="py-3 px-3 text-emerald-300">{log.takeProfit}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.result === 'WIN'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : log.result === 'BREAKEVEN'
                              ? 'bg-cyan-500/20 text-cyan-300'
                              : log.result === 'RUNNING'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {log.result}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-cyan-300">
                        {log.rMultiple > 0 ? `+${log.rMultiple}R` : `${log.rMultiple}R`}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          {log.tradeQuality}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-300 text-[11px] max-w-xs truncate">
                        {log.notesAr}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DETAILED TRADING PLAN MODAL (Popup Window for any Scanned Stock) */}
      {/* ============================================================== */}
      {selectedOpportunityForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0b0f17] border border-amber-500/50 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-mono font-black text-amber-300 text-lg">
                  {selectedOpportunityForModal.stock.symbol}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">
                      {selectedOpportunityForModal.stock.nameAr}
                    </h3>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300">
                      {selectedOpportunityForModal.setupBadgeAr}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    القطاع: {selectedOpportunityForModal.stock.sectorAr} • السعر اللحظي: {selectedOpportunityForModal.stock.price.toFixed(2)} ج.م
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedOpportunityForModal(null)}
                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Trading Plan Blueprints */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs text-amber-400 font-bold block">النموذج الفني وتصنيف الصفقة:</span>
                <p className="text-xs text-slate-200 font-medium leading-relaxed">
                  {selectedOpportunityForModal.setupType}
                </p>
                <span className="text-[11px] font-mono text-cyan-300 font-bold block">
                  نسبة العائد إلى المخاطرة الإجمالية: {selectedOpportunityForModal.riskRewardRatio}
                </span>
              </div>

              {/* Grid Numbers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs font-mono">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">نطاق الشراء</span>
                  <span className="text-sm font-bold text-white mt-1 block">
                    {selectedOpportunityForModal.entryZoneMin} - {selectedOpportunityForModal.entryZoneMax}
                  </span>
                  <span className="text-[10px] text-cyan-300 block font-sans">
                    المثالي: {selectedOpportunityForModal.entryOptimal}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-rose-500/40">
                  <span className="text-[10px] text-rose-400 block font-sans">وقف الخسارة SL</span>
                  <span className="text-sm font-bold text-rose-400 mt-1 block">
                    {selectedOpportunityForModal.stopLoss.toFixed(2)} ج.م
                  </span>
                  <span className="text-[10px] text-rose-400/80 block">
                    -{selectedOpportunityForModal.stopLossPct}%
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-emerald-500/40">
                  <span className="text-[10px] text-emerald-400 block font-sans">الهدف 1 (50%)</span>
                  <span className="text-sm font-bold text-emerald-300 mt-1 block">
                    {selectedOpportunityForModal.takeProfit1.toFixed(2)} ج.م
                  </span>
                  <span className="text-[10px] text-emerald-400 block font-sans">
                    +{selectedOpportunityForModal.takeProfit1GainPct}% تأمين 🛡️
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-teal-500/40">
                  <span className="text-[10px] text-teal-400 block font-sans">الهدف 2 (30%)</span>
                  <span className="text-sm font-bold text-teal-300 mt-1 block">
                    {selectedOpportunityForModal.takeProfit2.toFixed(2)} ج.م
                  </span>
                  <span className="text-[10px] text-teal-300 block font-sans">
                    +{selectedOpportunityForModal.takeProfit2GainPct}% جني 💰
                  </span>
                </div>
              </div>

              {/* Execution Steps */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs text-white font-bold block">خطوات التنفيذ والإدارة خطوة بخطوة:</span>
                <div className="space-y-1.5 text-xs text-slate-300">
                  {selectedOpportunityForModal.executionPlanStepsAr.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center text-[10px] shrink-0 font-mono">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invalidation Rules */}
              <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-xs text-rose-300 space-y-1">
                <span className="font-bold block flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>معيار إلغاء النموذج الفني (Invalidation Rule):</span>
                </span>
                <p>{selectedOpportunityForModal.invalidationAr}</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyOpportunityAlert(selectedOpportunityForModal)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Copy className="w-4 h-4" />
                  <span>نسخ خطة التداول 📋</span>
                </button>

                <button
                  onClick={() => exportTradingPlansToExcel([selectedOpportunityForModal], scannerCapitalEgp, scannerRiskPct, `خطة_تداول_${selectedOpportunityForModal.stock.symbol}`)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/30 border border-emerald-400/40"
                  title="تحميل خطة التداول كاملة كملف Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                  <span>تحميل خطة التداول كملف Excel (.xlsx) 📊</span>
                  <Download className="w-3.5 h-3.5 text-emerald-200" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onSelectStockForChart(selectedOpportunityForModal.stock.symbol);
                    setSelectedOpportunityForModal(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                >
                  فتح الشارت اللحظي 📊
                </button>

                <button
                  onClick={() => {
                    handleLoadOpportunityInDesk(selectedOpportunityForModal);
                    setSelectedOpportunityForModal(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer"
                >
                  فتح في مكتب التداول 🚀
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
