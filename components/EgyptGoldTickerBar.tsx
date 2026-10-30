import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Coins,
  TrendingUp,
  ShieldCheck,
  X,
  RefreshCw,
  Sparkles,
  Scale,
  Award,
  Clock,
  ArrowUpRight,
  Calculator,
  ChevronDown,
  ChevronUp,
  Flame,
  CheckCircle2,
  DollarSign,
  Gem,
  ExternalLink,
  Copy,
  Check,
  Zap,
  Info,
  Maximize2,
  LineChart,
} from 'lucide-react';
import {
  getLiveEgyptGoldSnapshot,
  fetchLiveEgyptGoldSnapshot,
  EgyptGoldMarketSnapshot,
  calculateGoldZakat,
  ZakatCalculationResult,
} from '../services/goldPriceService';
import { useReportLock } from '../hooks/useReportLock';
import { ReportStabilityLockBar } from './ReportStabilityLockBar';

interface EgyptGoldTickerBarProps {
  className?: string;
  onClose?: () => void;
  onOpenGlobalChart?: (symbol: string) => void;
}

export const EgyptGoldTickerBar: React.FC<EgyptGoldTickerBarProps> = ({
  className = '',
  onClose,
  onOpenGlobalChart,
}) => {
  const [snapshot, setSnapshot] = useState<EgyptGoldMarketSnapshot>(() => getLiveEgyptGoldSnapshot());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<
    'CALIBERS' | 'POUND' | 'BARS' | 'CALCULATOR' | 'ZAKAT' | 'CHART' | 'HEDGING'
  >('CALIBERS');
  const [copiedReport, setCopiedReport] = useState(false);

  // 180-second state-based lock for gold analysis and calculations
  const lockState = useReportLock('egypt_gold_report', 'XAU_SAGHA', 180);

  // Auto-refresh timer state (30 seconds default for live precision)
  const [refreshIntervalSec, setRefreshIntervalSec] = useState<number>(30);
  const [countdown, setCountdown] = useState<number>(30);

  // View mode: 'CARDS' (Expanded Luxury Cards) or 'RIBBON' (Compact Strip)
  const [viewMode, setViewMode] = useState<'CARDS' | 'RIBBON'>(() => {
    return (localStorage.getItem('egx_gold_view_mode') as 'CARDS' | 'RIBBON') || 'CARDS';
  });

  // Interactive Purchase & Selling Calculator State
  const [calcCaliber, setCalcCaliber] = useState<'24' | '21' | '18' | '14' | 'POUND' | 'BAR_BTC'>('21');
  const [calcGrams, setCalcGrams] = useState<number>(10);
  const [calcCraftsmanshipEgp, setCalcCraftsmanshipEgp] = useState<number>(90); // متوسط المصنعية بالجرام
  const [calcIncludeVat, setCalcIncludeVat] = useState<boolean>(true); // ضريبة القيمة المضافة والدمغة

  // Islamic Zakat Calculator State
  const [zakat24Grams, setZakat24Grams] = useState<number>(0);
  const [zakat21Grams, setZakat21Grams] = useState<number>(50);
  const [zakat18Grams, setZakat18Grams] = useState<number>(20);
  const [zakatPoundsCount, setZakatPoundsCount] = useState<number>(4);

  // TradingView Gold Chart Ref
  const goldChartRef = useRef<HTMLDivElement>(null);

  const toggleViewMode = () => {
    setViewMode((prev) => {
      const next = prev === 'CARDS' ? 'RIBBON' : 'CARDS';
      localStorage.setItem('egx_gold_view_mode', next);
      return next;
    });
  };

  const handleRefresh = async (isManual: boolean = false) => {
    // If auto-refresh fired but report lock is active in modal, don't interrupt reading
    if (!isManual && isModalOpen && lockState.isLocked) {
      return;
    }
    if (isManual) {
      lockState.triggerManualRefresh();
    }
    setIsRefreshing(true);
    try {
      const data = await fetchLiveEgyptGoldSnapshot();
      setSnapshot(data);
      setCountdown(refreshIntervalSec);
    } catch (_err) {
      // keep existing
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Periodic Auto-refresh Timer
  useEffect(() => {
    handleRefresh(true);
  }, []);

  useEffect(() => {
    if (refreshIntervalSec <= 0) return;
    const timer = setInterval(() => {
      handleRefresh(false);
      setCountdown(refreshIntervalSec);
    }, refreshIntervalSec * 1000);
    return () => clearInterval(timer);
  }, [refreshIntervalSec, isModalOpen, lockState.isLocked]);

  // 1-second countdown ticker
  useEffect(() => {
    if (refreshIntervalSec <= 0) return;
    const ticker = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return refreshIntervalSec;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(ticker);
  }, [refreshIntervalSec]);

  // Embed TradingView interactive gold chart when modal opens to CHART tab
  useEffect(() => {
    if (!isModalOpen || activeModalTab !== 'CHART' || !goldChartRef.current) return;
    goldChartRef.current.innerHTML = '';
    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    goldChartRef.current.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: 'OANDA:XAUUSD',
      interval: '15',
      timezone: 'Africa/Cairo',
      theme: 'dark',
      style: '1',
      locale: 'ar_AE',
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: true,
      calendar: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
    });
    goldChartRef.current.appendChild(script);

    return () => {
      if (goldChartRef.current) {
        goldChartRef.current.innerHTML = '';
      }
    };
  }, [isModalOpen, activeModalTab]);

  // Calculator computations
  const calculationResult = useMemo(() => {
    let baseSellPrice = snapshot.gold21k.sellPriceEgp;
    let baseBuyPrice = snapshot.gold21k.buyPriceEgp;
    let unitLabel = 'جرام عيار 21';
    let defaultCraft = 90;

    if (calcCaliber === '24') {
      baseSellPrice = snapshot.gold24k.sellPriceEgp;
      baseBuyPrice = snapshot.gold24k.buyPriceEgp;
      unitLabel = 'جرام عيار 24 (سبائك)';
      defaultCraft = 75;
    } else if (calcCaliber === '18') {
      baseSellPrice = snapshot.gold18k.sellPriceEgp;
      baseBuyPrice = snapshot.gold18k.buyPriceEgp;
      unitLabel = 'جرام عيار 18 (مشغولات)';
      defaultCraft = 150;
    } else if (calcCaliber === '14') {
      baseSellPrice = snapshot.gold14k.sellPriceEgp;
      baseBuyPrice = snapshot.gold14k.buyPriceEgp;
      unitLabel = 'جرام عيار 14';
      defaultCraft = 120;
    } else if (calcCaliber === 'POUND') {
      baseSellPrice = snapshot.goldPound.sellPriceEgp;
      baseBuyPrice = snapshot.goldPound.buyPriceEgp;
      unitLabel = 'جنيه ذهب (8 جرام عيار 21)';
      defaultCraft = 55 * 8; // ~440 ج.م للجنيه
    } else if (calcCaliber === 'BAR_BTC') {
      baseSellPrice = snapshot.gold24k.sellPriceEgp;
      baseBuyPrice = snapshot.gold24k.buyPriceEgp;
      unitLabel = 'سبيكة ذهب BTC عيار 24';
      defaultCraft = 85;
    }

    const grams = Math.max(0.1, calcGrams || 1);
    const goldRawValue = baseSellPrice * grams;
    const craftsmanshipTotal = (calcCraftsmanshipEgp || defaultCraft) * grams;
    const vatRate = calcIncludeVat ? 0.025 : 0; // متوسط ضريبة القيمة المضافة والدمغة على المصنعية
    const vatAndStampTotal = craftsmanshipTotal * vatRate;

    const totalBuyFromShop = Math.round(goldRawValue + craftsmanshipTotal + vatAndStampTotal);
    const totalSellToShop = Math.round(baseBuyPrice * grams);
    const spreadLossOnImmediateSale = totalBuyFromShop - totalSellToShop;

    return {
      baseSellPrice,
      baseBuyPrice,
      unitLabel,
      grams,
      goldRawValue,
      craftsmanshipTotal,
      vatAndStampTotal,
      totalBuyFromShop,
      totalSellToShop,
      spreadLossOnImmediateSale,
    };
  }, [calcCaliber, calcGrams, calcCraftsmanshipEgp, calcIncludeVat, snapshot]);

  // Zakat Calculation
  const zakatResult: ZakatCalculationResult = useMemo(() => {
    return calculateGoldZakat(
      zakat24Grams,
      zakat21Grams,
      zakat18Grams,
      zakatPoundsCount,
      snapshot
    );
  }, [zakat24Grams, zakat21Grams, zakat18Grams, zakatPoundsCount, snapshot]);

  // Copy full gold report
  const handleCopyFullReport = () => {
    const text = `🪙 تقرير أسعار الذهب والسبائك اللحظي - الصاغة المصرية والأسواق العالمية
المصدر المعتمد: ${snapshot.sourceLabelAr}
التاريخ والوقت: ${snapshot.lastUpdatedDate} (${snapshot.cairoTimestamp})

📌 أسعار الذهب الخام بالصاغة (شراء / بيع):
- عيار 24 (ذهب خالص): بيع ${snapshot.gold24k.sellPriceEgp.toLocaleString()} ج.م | شراء ${snapshot.gold24k.buyPriceEgp.toLocaleString()} ج.م
- عيار 21 (الأكثر تداولاً): بيع ${snapshot.gold21k.sellPriceEgp.toLocaleString()} ج.م | شراء ${snapshot.gold21k.buyPriceEgp.toLocaleString()} ج.م
- عيار 18 (المشغولات): بيع ${snapshot.gold18k.sellPriceEgp.toLocaleString()} ج.م | شراء ${snapshot.gold18k.buyPriceEgp.toLocaleString()} ج.م
- عيار 14: بيع ${snapshot.gold14k.sellPriceEgp.toLocaleString()} ج.م | شراء ${snapshot.gold14k.buyPriceEgp.toLocaleString()} ج.م

🪙 الجنيه الذهب والعملات:
- الجنيه الذهب (8 جرام عيار 21): بيع ${snapshot.goldPound.sellPriceEgp.toLocaleString()} ج.م | شراء ${snapshot.goldPound.buyPriceEgp.toLocaleString()} ج.م
- نصف جنيه ذهب (4 جرام): بيع ${snapshot.halfGoldPound.sellPriceEgp.toLocaleString()} ج.م
- ربع جنيه ذهب (2 جرام): بيع ${snapshot.quarterGoldPound.sellPriceEgp.toLocaleString()} ج.م

🧈 سبائك BTC المعتمدة عيار 24:
- سبيكة 10 جرام BTC: ${snapshot.bullionBars.find((b) => b.weightGrams === 10)?.priceEgp.toLocaleString()} ج.م (كاش باك 280 ج.م)
- سبيكة 31.1 جرام (أونصة BTC): ${snapshot.bullionBars.find((b) => b.weightGrams === 31.1035)?.priceEgp.toLocaleString()} ج.م
- سبيكة 50 جرام BTC: ${snapshot.bullionBars.find((b) => b.weightGrams === 50)?.priceEgp.toLocaleString()} ج.م
- سبيكة 100 جرام BTC: ${snapshot.bullionBars.find((b) => b.weightGrams === 100)?.priceEgp.toLocaleString()} ج.م

🌐 البورصة العالمية والعملات:
- أونصة الذهب عالمياً (Spot XAU/USD): $${snapshot.globalSpot.priceUsd.toFixed(2)}
- دولار الصاغة المحسوب: $1 = ${snapshot.globalSpot.saghaUsdRate.toFixed(2)} ج.م (البنك الرسمي: ${snapshot.globalSpot.usdEgpRate.toFixed(2)} ج.م)

تحديث آلي فوري عبر منصة مستشار التداول الذكي EGX`;
    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2200);
  };

  return (
    <div
      dir="rtl"
      className={`rounded-3xl border border-amber-500/40 bg-gradient-to-b from-[#191206] via-[#0d1017] to-[#120d04] shadow-2xl shadow-amber-950/40 text-xs font-['Cairo'] relative overflow-hidden backdrop-blur-xl ${className}`}
    >
      {/* Golden Metallic Glow Trim */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-90" />

      {/* Top Header Row with Verified Source & Auto-Refresh HUD */}
      <div className="px-4 py-2.5 sm:px-5 border-b border-amber-500/20 flex items-center justify-between gap-3 flex-wrap bg-gradient-to-r from-amber-950/40 via-slate-900/60 to-amber-950/40">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 p-0.5 shadow-md shadow-amber-500/25 shrink-0 flex items-center justify-center">
            <Coins className="w-5 h-5 text-slate-950 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-amber-100 tracking-tight flex items-center gap-1.5">
                <span>بورصة الذهب بالصاغة المصرية والأسواق العالمية</span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>مصدر رسمي معتمد: iSagha</span>
              </span>
            </div>
            <p className="text-[10px] text-amber-200/80 font-medium flex items-center gap-1.5 flex-wrap">
              <span>تحديث الصاغة اللحظي</span>
              <span>•</span>
              <span className="font-mono text-cyan-300 font-bold">{snapshot.cairoTimestamp}</span>
              <span>•</span>
              <span>عيار 21 الآن: <strong className="text-white font-mono">{snapshot.gold21k.sellPriceEgp.toLocaleString('ar-EG')} ج.م</strong></span>
              <span>•</span>
              <span>الأونصة: <strong className="text-emerald-300 font-mono">${snapshot.globalSpot.priceUsd.toFixed(1)}</strong></span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Quick Auto-refresh Countdown Pill */}
          <div className="flex items-center gap-1.5 bg-slate-950/90 border border-slate-800 rounded-xl px-2.5 py-1 text-[11px] font-mono text-slate-300">
            <Clock className="w-3 h-3 text-amber-400" />
            <select
              value={refreshIntervalSec}
              onChange={(e) => {
                const val = Number(e.target.value);
                setRefreshIntervalSec(val);
                setCountdown(val);
              }}
              className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer text-xs"
              title="تغيير فترة التحديث التلقائي"
            >
              <option value={15} className="bg-slate-950 text-slate-200">15 ثانية</option>
              <option value={30} className="bg-slate-950 text-emerald-400 font-bold">30 ثانية (موصى به)</option>
              <option value={60} className="bg-slate-950 text-slate-200">1 دقيقة</option>
              <option value={0} className="bg-slate-950 text-rose-300">إيقاف التحديث</option>
            </select>
            {refreshIntervalSec > 0 && (
              <span className="text-[10px] text-cyan-400 font-bold tabular-nums">
                ({countdown}s)
              </span>
            )}
          </div>

          {/* Copy Report */}
          <button
            type="button"
            onClick={handleCopyFullReport}
            className="px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="نسخ تقرير أسعار الذهب الفوري"
          >
            {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            <span className="hidden sm:inline">{copiedReport ? 'تم النسخ!' : 'نسخ التقرير'}</span>
          </button>

          {/* Detailed Full Tool Modal Button */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:brightness-110 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/25 active:scale-95"
            title="فتح أداة الذهب المتكاملة: حاسبة المصنعية، زكاة الذهب، سبائك BTC، وشارت الذهب"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span>الأداة الشاملة للذهب 🪙</span>
          </button>

          {/* Toggle View Mode: Cards vs Ribbon */}
          <button
            type="button"
            onClick={toggleViewMode}
            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title={viewMode === 'CARDS' ? 'التبديل للشريط السريع المدمج' : 'التبديل لعرض البطاقات الشاملة'}
          >
            {viewMode === 'CARDS' ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">عرض مدمج</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">عرض البطاقات ⭐</span>
              </>
            )}
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => handleRefresh(true)}
            disabled={isRefreshing}
            className="p-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-colors cursor-pointer"
            title="تحديث أسعار الذهب الآن من آي صاغة"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Close Bar */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-900/90 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700/80 hover:border-rose-800 transition-colors cursor-pointer"
              title="إخفاء لوحة الذهب"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* View Mode 1: Executive Luxury Cards (Default Stunning View) */}
      {viewMode === 'CARDS' && (
        <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Card 1: عيار 21 (التاج والأساس الأكثر تداولاً) */}
          <div className="relative rounded-2xl p-3.5 bg-gradient-to-b from-amber-500/15 via-amber-950/30 to-slate-950/80 border border-amber-400/50 shadow-lg shadow-amber-950/50 flex flex-col justify-between group hover:border-amber-300 transition-all hover:scale-[1.01]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-500/25">
              <div className="flex items-center gap-1.5">
                <span className="text-base">👑</span>
                <span className="text-xs font-black text-amber-200">عيار 21 (الأكثر طلباً)</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-0.5 bg-emerald-950/80 px-1.5 py-0.5 rounded-full border border-emerald-800/60">
                <ArrowUpRight className="w-3 h-3" />
                +{snapshot.gold21k.changePct24h}%
              </span>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[11px] text-slate-400">سعر البيع (شراء العميل):</span>
                <span className="font-mono text-xl font-black text-amber-300">
                  {snapshot.gold21k.sellPriceEgp.toLocaleString('ar-EG')} <span className="text-xs font-sans text-amber-200">ج.م</span>
                </span>
              </div>
              <div className="flex items-baseline justify-between text-[11px]">
                <span className="text-slate-400">سعر الشراء (بيع العميل):</span>
                <span className="font-mono font-bold text-slate-200">
                  {snapshot.gold21k.buyPriceEgp.toLocaleString('ar-EG')} ج.م
                </span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-amber-500/20 flex items-center justify-between text-[10px] text-amber-300/80">
              <span>فرق الصاغة: <strong>{snapshot.gold21k.spreadEgp} ج.م</strong></span>
              <span className="text-slate-400">نقاء 875/1000</span>
            </div>
          </div>

          {/* Card 2: عيار 24 (الذهب الخالص وسبائك الاستثمار) */}
          <div className="relative rounded-2xl p-3.5 bg-gradient-to-b from-slate-900/90 via-[#0d1017] to-slate-950/80 border border-amber-500/30 hover:border-amber-400/60 shadow-md flex flex-col justify-between transition-all hover:scale-[1.01]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="text-base">🧈</span>
                <span className="text-xs font-black text-amber-300">عيار 24 (السبائك والخالص)</span>
              </div>
              <span className="text-[10px] text-amber-400 font-bold bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/60 font-mono">
                999.9
              </span>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[11px] text-slate-400">سعر البيع:</span>
                <span className="font-mono text-xl font-black text-white">
                  {snapshot.gold24k.sellPriceEgp.toLocaleString('ar-EG')} <span className="text-xs font-sans text-slate-400">ج.م</span>
                </span>
              </div>
              <div className="flex items-baseline justify-between text-[11px]">
                <span className="text-slate-400">سعر الشراء:</span>
                <span className="font-mono font-bold text-amber-200">
                  {snapshot.gold24k.buyPriceEgp.toLocaleString('ar-EG')} ج.م
                </span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>فرق الصاغة: {snapshot.gold24k.spreadEgp} ج.م</span>
              <span className="text-amber-400/90 font-medium">معيار السبائك BTC</span>
            </div>
          </div>

          {/* Card 3: عيار 18 (مشغولات الذهب الإيطالي والأناقة) */}
          <div className="relative rounded-2xl p-3.5 bg-gradient-to-b from-slate-900/90 via-[#0d1017] to-slate-950/80 border border-slate-800 hover:border-slate-700 shadow-md flex flex-col justify-between transition-all hover:scale-[1.01]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="text-base">💎</span>
                <span className="text-xs font-black text-slate-200">عيار 18 (المشغولات)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold bg-slate-800 px-1.5 py-0.2 rounded">
                750/1000
              </span>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[11px] text-slate-400">سعر البيع:</span>
                <span className="font-mono text-xl font-black text-white">
                  {snapshot.gold18k.sellPriceEgp.toLocaleString('ar-EG')} <span className="text-xs font-sans text-slate-400">ج.م</span>
                </span>
              </div>
              <div className="flex items-baseline justify-between text-[11px]">
                <span className="text-slate-400">سعر الشراء:</span>
                <span className="font-mono font-bold text-slate-300">
                  {snapshot.gold18k.buyPriceEgp.toLocaleString('ar-EG')} ج.م
                </span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>فرق الصاغة: {snapshot.gold18k.spreadEgp} ج.م</span>
              <span>ذهب إيطالي ومودرن</span>
            </div>
          </div>

          {/* Card 4: الجنيه الذهب (8 جرام عيار 21 BTC) */}
          <div className="relative rounded-2xl p-3.5 bg-gradient-to-b from-amber-500/10 via-slate-900/90 to-slate-950/80 border border-amber-500/35 hover:border-amber-400/60 shadow-md flex flex-col justify-between transition-all hover:scale-[1.01]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-500/20">
              <div className="flex items-center gap-1.5">
                <span className="text-base">🪙</span>
                <span className="text-xs font-black text-amber-200">الجنيه الذهب (8 جرام)</span>
              </div>
              <span className="text-[10px] text-amber-300 font-bold bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-800/60 font-mono">
                BTC
              </span>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[11px] text-slate-400">سعر البيع:</span>
                <span className="font-mono text-xl font-black text-amber-200">
                  {snapshot.goldPound.sellPriceEgp.toLocaleString('ar-EG')} <span className="text-xs font-sans text-slate-400">ج.م</span>
                </span>
              </div>
              <div className="flex items-baseline justify-between text-[11px]">
                <span className="text-slate-400">سعر الشراء:</span>
                <span className="font-mono font-bold text-slate-300">
                  {snapshot.goldPound.buyPriceEgp.toLocaleString('ar-EG')} ج.م
                </span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-amber-500/20 flex items-center justify-between text-[10px] text-amber-300/80">
              <span>نصف: {snapshot.halfGoldPound.sellPriceEgp.toLocaleString('ar-EG')}</span>
              <span>ربع: {snapshot.quarterGoldPound.sellPriceEgp.toLocaleString('ar-EG')}</span>
            </div>
          </div>

          {/* Card 5: الأونصة العالمية وسعر التعادل في الصاغة */}
          <div className="relative rounded-2xl p-3.5 bg-gradient-to-b from-slate-900/90 via-[#0d1017] to-slate-950/80 border border-slate-800 hover:border-slate-700 shadow-md flex flex-col justify-between transition-all hover:scale-[1.01]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="text-base">🌐</span>
                <span className="text-xs font-black text-cyan-300">أونصة الذهب Spot</span>
              </div>
              <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-800/60 font-mono">
                XAU/USD
              </span>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[11px] text-slate-400">السعر العالمي اللحظي:</span>
                <span className="font-mono text-xl font-black text-cyan-300">
                  ${snapshot.globalSpot.priceUsd.toFixed(1)}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-[11px]">
                <span className="text-slate-400">الأونصة بالجنيه:</span>
                <span className="font-mono font-bold text-slate-200">
                  {snapshot.goldOunceEgp.toLocaleString('ar-EG')} ج.م
                </span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>دولار الصاغة: <strong className="text-white">${snapshot.globalSpot.saghaUsdRate.toFixed(1)}ج</strong></span>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(true);
                  setActiveModalTab('CHART');
                }}
                className="text-cyan-400 hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
              >
                <span>شارت الذهب</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Card 6: سعر صرف الدولار بالبنوك مقابل دولار الصاغة (USD/EGP Official vs Sagha Spread) */}
          <div className="relative rounded-2xl p-3.5 bg-gradient-to-b from-slate-900/90 via-[#0a1512] to-slate-950/80 border border-emerald-500/40 hover:border-emerald-400/70 shadow-md flex flex-col justify-between transition-all hover:scale-[1.01]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-500/20">
              <div className="flex items-center gap-1.5">
                <span className="text-base">💵</span>
                <span className="text-xs font-black text-emerald-300">سعر الدولار (بنوك / صاغة)</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800/60 font-mono">
                USD/EGP
              </span>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[11px] text-slate-400">البنك الرسمي (بيع):</span>
                <span className="font-mono text-xl font-black text-emerald-300">
                  {(snapshot.usdRateDetail?.officialBankSell || snapshot.globalSpot.usdEgpRate || 50.95).toFixed(2)}{' '}
                  <span className="text-xs font-sans text-slate-400 font-normal">ج.م</span>
                </span>
              </div>
              <div className="flex items-baseline justify-between text-[11px]">
                <span className="text-slate-400">دولار الصاغة المشتق:</span>
                <span className="font-mono font-bold text-amber-300">
                  {(snapshot.usdRateDetail?.saghaRate || snapshot.globalSpot.saghaUsdRate || 56.20).toFixed(2)} ج.م
                </span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>علاوة التحوط: <strong className="text-amber-400 font-mono">+{snapshot.usdRateDetail ? snapshot.usdRateDetail.spreadEgp.toFixed(2) : '5.25'} ج.م</strong></span>
              <span className="text-emerald-400 font-mono font-bold">
                +{snapshot.usdRateDetail ? snapshot.usdRateDetail.spreadPct.toFixed(1) : '10.3'}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* View Mode 2: Compact Elegant Ribbon */}
      {viewMode === 'RIBBON' && (
        <div className="px-4 py-2 flex items-center gap-3 overflow-x-auto no-scrollbar flex-wrap justify-between">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* عيار 21 */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40">
              <span className="text-amber-300 font-black text-xs">عيار 21 👑:</span>
              <span className="font-mono font-black text-white text-sm">
                {snapshot.gold21k.sellPriceEgp.toLocaleString('ar-EG')}
              </span>
              <span className="text-[10px] text-slate-400">بيع /</span>
              <span className="font-mono font-bold text-amber-200 text-xs">
                {snapshot.gold21k.buyPriceEgp.toLocaleString('ar-EG')}
              </span>
              <span className="text-[10px] text-slate-400">شراء</span>
              <span className="text-[10px] text-emerald-400 font-bold font-mono mr-1">
                +{snapshot.gold21k.changePct24h}%
              </span>
            </div>

            {/* عيار 24 */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-amber-400 font-black text-xs">عيار 24 🧈:</span>
              <span className="font-mono font-bold text-white text-xs">
                {snapshot.gold24k.sellPriceEgp.toLocaleString('ar-EG')}
              </span>
              <span className="text-[10px] text-slate-400">بيع /</span>
              <span className="font-mono text-slate-300 text-xs">
                {snapshot.gold24k.buyPriceEgp.toLocaleString('ar-EG')}
              </span>
            </div>

            {/* عيار 18 */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-slate-300 font-black text-xs">عيار 18 💎:</span>
              <span className="font-mono font-bold text-white text-xs">
                {snapshot.gold18k.sellPriceEgp.toLocaleString('ar-EG')}
              </span>
              <span className="text-[10px] text-slate-400">بيع /</span>
              <span className="font-mono text-slate-300 text-xs">
                {snapshot.gold18k.buyPriceEgp.toLocaleString('ar-EG')}
              </span>
            </div>

            {/* الجنيه الذهب */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <span className="text-amber-300 font-black text-xs">الجنيه الذهب (8ج) 🪙:</span>
              <span className="font-mono font-bold text-amber-200 text-xs">
                {snapshot.goldPound.sellPriceEgp.toLocaleString('ar-EG')}
              </span>
              <span className="text-[10px] text-slate-400">ج.م</span>
            </div>

            {/* الأونصة العالمية */}
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400 font-sans">Spot XAU:</span>
              <span className="text-cyan-300 font-bold">${snapshot.globalSpot.priceUsd.toFixed(1)}</span>
            </div>

            {/* سعر صرف الدولار (بنوك / صاغة) */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs font-mono">
              <span className="text-emerald-400 font-sans font-bold">💵 الدولار:</span>
              <span className="text-slate-200">بنك {(snapshot.usdRateDetail?.officialBankSell || snapshot.globalSpot.usdEgpRate || 50.95).toFixed(2)}</span>
              <span className="text-slate-500">|</span>
              <span className="text-amber-300">صاغة {(snapshot.usdRateDetail?.saghaRate || snapshot.globalSpot.saghaUsdRate || 56.20).toFixed(2)}</span>
              <span className="text-[10px] text-amber-300 font-bold bg-amber-950/80 px-1 py-0.2 rounded border border-amber-800/40">
                +{snapshot.usdRateDetail ? snapshot.usdRateDetail.spreadEgp.toFixed(2) : '5.25'}ج
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Full Gold Market Modal (All Tools in One Place) */}
      {isModalOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn font-['Cairo']"
        >
          <div className="relative w-full max-w-4xl bg-[#0b0f17] border border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-amber-500/30 flex items-center justify-between bg-gradient-to-r from-slate-950 via-[#181105] to-slate-950">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner">
                  <Coins className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-white">
                      منصة وأداة الذهب المتكاملة - الصاغة المصرية والبورصة العالمية
                    </h3>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>iSagha معتمد 100%</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>{snapshot.sourceLabelAr}</span>
                    <span>•</span>
                    <span className="font-mono text-cyan-300">{snapshot.cairoTimestamp}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ReportStabilityLockBar
                  lockState={lockState}
                  reportTitle="بورصة الذهب والصاغة"
                  isRefreshing={isRefreshing}
                  compact={true}
                />
                <button
                  type="button"
                  onClick={() => handleRefresh(true)}
                  disabled={isRefreshing}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                  title="تحديث البيانات الآن"
                >
                  <RefreshCw className={`w-4 h-4 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs in Modal */}
            <div className="flex items-center gap-1.5 px-4 pt-3 pb-2 border-b border-slate-800 bg-slate-950/90 text-xs overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveModalTab('CALIBERS')}
                className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeModalTab === 'CALIBERS'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/25'
                    : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
                }`}
              >
                الأعيرة والجرامات (24/21/18/14)
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('POUND')}
                className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeModalTab === 'POUND'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/25'
                    : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
                }`}
              >
                الجنيه الذهب وفئاته 🪙
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('BARS')}
                className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeModalTab === 'BARS'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/25'
                    : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
                }`}
              >
                سبائك BTC المعتمدة (الكاش باك) 🧈
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('CALCULATOR')}
                className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === 'CALCULATOR'
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-black shadow-md'
                    : 'text-cyan-300 hover:text-white bg-slate-900/60 border border-slate-800'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>حاسبة المصنعية والبيع والشراء</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('ZAKAT')}
                className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === 'ZAKAT'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                    : 'text-emerald-400 hover:text-white bg-slate-900/60 border border-slate-800'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>حاسبة زكاة الذهب الشرعية ⚖️</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('CHART')}
                className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === 'CHART'
                    ? 'bg-blue-500 text-white font-black shadow-md'
                    : 'text-blue-300 hover:text-white bg-slate-900/60 border border-slate-800'
                }`}
              >
                <LineChart className="w-3.5 h-3.5" />
                <span>شارت الذهب اللحظي (XAU/USD)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('HEDGING')}
                className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeModalTab === 'HEDGING'
                    ? 'bg-teal-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
                }`}
              >
                التحوط ودولار الصاغة
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {/* 180s Stability Lock Bar with Live Progress Bar & Instant Refresh */}
              <ReportStabilityLockBar
                lockState={lockState}
                reportTitle="تقرير ومنصة الذهب الشاملة"
                isRefreshing={isRefreshing}
              />

              {/* TAB 1: CALIBERS & GRAMS */}
              {activeModalTab === 'CALIBERS' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* عيار 24 */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-300">عيار 24 (خالص 999.9)</span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">سبائك</span>
                      </div>
                      <div className="text-xl font-black font-mono text-white">
                        {snapshot.gold24k.sellPriceEgp.toLocaleString('ar-EG')}{' '}
                        <span className="text-xs font-sans text-slate-400">ج.م بيع</span>
                      </div>
                      <div className="text-xs font-mono text-slate-300">
                        شراء: <strong>{snapshot.gold24k.buyPriceEgp.toLocaleString('ar-EG')} ج.م</strong>
                      </div>
                      <div className="pt-2 border-t border-slate-850 text-[10px] text-slate-400 flex justify-between">
                        <span>فرق الصاغة: {snapshot.gold24k.spreadEgp} ج.م</span>
                        <span>{snapshot.gold24k.craftingEstimateEgp}</span>
                      </div>
                    </div>

                    {/* عيار 21 */}
                    <div className="p-4 rounded-2xl bg-amber-950/20 border-2 border-amber-500/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-200">عيار 21 (الأكثر انتشاراً ⭐)</span>
                        <span className="text-[10px] font-mono text-amber-400 font-bold">875</span>
                      </div>
                      <div className="text-xl font-black font-mono text-amber-300">
                        {snapshot.gold21k.sellPriceEgp.toLocaleString('ar-EG')}{' '}
                        <span className="text-xs font-sans text-amber-200">ج.م بيع</span>
                      </div>
                      <div className="text-xs font-mono text-slate-200">
                        شراء: <strong>{snapshot.gold21k.buyPriceEgp.toLocaleString('ar-EG')} ج.م</strong>
                      </div>
                      <div className="pt-2 border-t border-amber-500/20 text-[10px] text-amber-300/80 flex justify-between">
                        <span>فرق الصاغة: {snapshot.gold21k.spreadEgp} ج.م</span>
                        <span>{snapshot.gold21k.craftingEstimateEgp}</span>
                      </div>
                    </div>

                    {/* عيار 18 */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-200">عيار 18 (المشغولات)</span>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">750</span>
                      </div>
                      <div className="text-xl font-black font-mono text-white">
                        {snapshot.gold18k.sellPriceEgp.toLocaleString('ar-EG')}{' '}
                        <span className="text-xs font-sans text-slate-400">ج.م بيع</span>
                      </div>
                      <div className="text-xs font-mono text-slate-300">
                        شراء: <strong>{snapshot.gold18k.buyPriceEgp.toLocaleString('ar-EG')} ج.م</strong>
                      </div>
                      <div className="pt-2 border-t border-slate-850 text-[10px] text-slate-400 flex justify-between">
                        <span>فرق الصاغة: {snapshot.gold18k.spreadEgp} ج.م</span>
                        <span>ذهب إيطالي وخفيف</span>
                      </div>
                    </div>

                    {/* عيار 14 */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-300">عيار 14</span>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">585</span>
                      </div>
                      <div className="text-xl font-black font-mono text-white">
                        {snapshot.gold14k.sellPriceEgp.toLocaleString('ar-EG')}{' '}
                        <span className="text-xs font-sans text-slate-400">ج.م بيع</span>
                      </div>
                      <div className="text-xs font-mono text-slate-300">
                        شراء: <strong>{snapshot.gold14k.buyPriceEgp.toLocaleString('ar-EG')} ج.م</strong>
                      </div>
                      <div className="pt-2 border-t border-slate-850 text-[10px] text-slate-400 flex justify-between">
                        <span>فرق الصاغة: 35 ج.م</span>
                        <span>اقتصادي</span>
                      </div>
                    </div>
                  </div>

                  {/* Silver Rates in Sagha */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <h4 className="font-bold text-white text-xs flex items-center gap-2">
                      <Gem className="w-4 h-4 text-cyan-400" />
                      <span>أسعار الفضة بالصاغة المصرية (فضة نقية وإسترليني):</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block font-sans text-[11px]">فضة نقية عيار 999:</span>
                        <strong className="text-white text-sm">بيع {snapshot.silver999.sellPriceEgp} ج.م</strong>
                        <span className="text-slate-400 block text-[10px]">شراء {snapshot.silver999.buyPriceEgp} ج.م</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block font-sans text-[11px]">فضة إسترليني عيار 925:</span>
                        <strong className="text-white text-sm">بيع {snapshot.silver925.sellPriceEgp} ج.م</strong>
                        <span className="text-slate-400 block text-[10px]">شراء {snapshot.silver925.buyPriceEgp} ج.م</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block font-sans text-[11px]">فضة مصرية عيار 800:</span>
                        <strong className="text-white text-sm">بيع {snapshot.silver800.sellPriceEgp} ج.م</strong>
                        <span className="text-slate-400 block text-[10px]">شراء {snapshot.silver800.buyPriceEgp} ج.م</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: GOLD POUND & SUBDIVISIONS */}
              {activeModalTab === 'POUND' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* الجنيه الذهب */}
                    <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 space-y-2">
                      <span className="text-xs font-black text-amber-200 block">جنيه ذهب كامل (8 جرام)</span>
                      <div className="text-xl font-black font-mono text-amber-300">
                        {snapshot.goldPound.sellPriceEgp.toLocaleString('ar-EG')}{' '}
                        <span className="text-xs font-sans text-slate-300">ج.م بيع</span>
                      </div>
                      <div className="text-xs font-mono text-slate-300">
                        شراء: {snapshot.goldPound.buyPriceEgp.toLocaleString('ar-EG')} ج.م
                      </div>
                      <div className="pt-2 border-t border-amber-500/20 text-[10px] text-amber-300/80">
                        عيار 21 معتمد BTC
                      </div>
                    </div>

                    {/* نصف جنيه */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-white block">نصف جنيه ذهب (4 جرام)</span>
                      <div className="text-xl font-black font-mono text-white">
                        {snapshot.halfGoldPound.sellPriceEgp.toLocaleString('ar-EG')}{' '}
                        <span className="text-xs font-sans text-slate-400">ج.م بيع</span>
                      </div>
                      <div className="text-xs font-mono text-slate-400">
                        شراء: {snapshot.halfGoldPound.buyPriceEgp.toLocaleString('ar-EG')} ج.م
                      </div>
                      <div className="pt-2 border-t border-slate-850 text-[10px] text-slate-400">
                        4 جرام عيار 21
                      </div>
                    </div>

                    {/* ربع جنيه */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-white block">ربع جنيه ذهب (2 جرام)</span>
                      <div className="text-xl font-black font-mono text-white">
                        {snapshot.quarterGoldPound.sellPriceEgp.toLocaleString('ar-EG')}{' '}
                        <span className="text-xs font-sans text-slate-400">ج.م بيع</span>
                      </div>
                      <div className="text-xs font-mono text-slate-400">
                        شراء: {snapshot.quarterGoldPound.buyPriceEgp.toLocaleString('ar-EG')} ج.م
                      </div>
                      <div className="pt-2 border-t border-slate-850 text-[10px] text-slate-400">
                        2 جرام عيار 21
                      </div>
                    </div>

                    {/* خمسة جنيهات */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-white block">خمسة جنيهات (40 جرام)</span>
                      <div className="text-xl font-black font-mono text-white">
                        {snapshot.fiveGoldPounds.sellPriceEgp.toLocaleString('ar-EG')}{' '}
                        <span className="text-xs font-sans text-slate-400">ج.م بيع</span>
                      </div>
                      <div className="text-xs font-mono text-slate-400">
                        شراء: {snapshot.fiveGoldPounds.buyPriceEgp.toLocaleString('ar-EG')} ج.م
                      </div>
                      <div className="pt-2 border-t border-slate-850 text-[10px] text-slate-400">
                        40 جرام عيار 21
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
                    <span className="font-bold text-amber-300">ملاحظات الصاغة عند شراء وبيع الجنيه الذهب:</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                      <li>الجنيه الذهب المغلف (شركة BTC أو سام) يحتوي على فاتورة رسمية ويسترد جزء من المصنعية (كاش باك يتراوح بين 25 إلى 35 ج.م للجرام) عند البيع بنفس الغلاف.</li>
                      <li>الجنيه الذهب البلدي (غير المغلف) يباع ويشترى بسعر الذهب الخام عيار 21 بدون مصنعية أو كاش باك.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 3: BTC BULLION BARS */}
              {activeModalTab === 'BARS' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
                    <span className="text-amber-200 leading-relaxed">
                      جميع السبائك المدرجة عيار 24 خالص بنقاء 999.9 من إنتاج شركة BTC المعتمدة ومصلحة دمغ المصوغات والموازين المصرية مع ضمان الكاش باك الرسمي عند الاسترداد.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {snapshot.bullionBars.map((bar) => (
                      <div
                        key={bar.nameAr}
                        className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 transition-all flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <strong className="text-xs font-bold text-white block">
                            🧈 {bar.nameAr}
                          </strong>
                          <div className="text-[11px] text-slate-400 font-mono">
                            الوزن: {bar.weightGrams} جرام • نقاء {bar.purity}
                          </div>
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 inline-block">
                            كاش باك رسمي: {bar.cashbackEgp} ج.م
                          </span>
                        </div>
                        <div className="text-left font-mono">
                          <span className="text-sm font-black text-amber-300 block">
                            {bar.priceEgp.toLocaleString('ar-EG')} ج.م
                          </span>
                          <span className="text-[10px] text-slate-400">سعر الصاغة شامل الغلاف</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: ADVANCED GOLD CALCULATOR */}
              {activeModalTab === 'CALCULATOR' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                    <h4 className="text-xs font-black text-white flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-cyan-400" />
                      <span>حاسبة شراء وبيع الذهب والمصنعية بالصاغة المصرية:</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-300 block mb-1">العيار أو المنتج:</label>
                        <select
                          value={calcCaliber}
                          onChange={(e) => setCalcCaliber(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-amber-300 focus:outline-none focus:border-cyan-400"
                        >
                          <option value="21">عيار 21 (الأكثر انتشاراً)</option>
                          <option value="24">عيار 24 (ذهب خالص 999.9)</option>
                          <option value="18">عيار 18 (مشغولات إيطالي)</option>
                          <option value="14">عيار 14 (اقتصادي)</option>
                          <option value="POUND">الجنيه الذهب (8 جرام 21)</option>
                          <option value="BAR_BTC">سبيكة BTC عيار 24</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-300 block mb-1">
                          {calcCaliber === 'POUND' ? 'عدد الجنيهات:' : 'الوزن الإجمالي (جرام):'}
                        </label>
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={calcGrams}
                          onChange={(e) => setCalcGrams(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-300 block mb-1">
                          متوسط المصنعية والدمغة (ج.م / جرام):
                        </label>
                        <input
                          type="number"
                          step="5"
                          value={calcCraftsmanshipEgp}
                          onChange={(e) => setCalcCraftsmanshipEgp(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 text-xs">
                      <input
                        type="checkbox"
                        id="vat-check"
                        checked={calcIncludeVat}
                        onChange={(e) => setCalcIncludeVat(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="vat-check" className="text-slate-300 cursor-pointer">
                        إضافة ضريبة القيمة المضافة والدمغة القانونية على المصنعية (~2.5%)
                      </label>
                    </div>
                  </div>

                  {/* Calculator Outputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/40 space-y-1">
                      <span className="text-[11px] text-slate-400 block font-bold">
                        إجمالي تكلفة الشراء من الصاغة:
                      </span>
                      <div className="text-2xl font-black font-mono text-amber-300">
                        {calculationResult.totalBuyFromShop.toLocaleString('ar-EG')} <span className="text-xs font-sans">ج.م</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        (خام: {Math.round(calculationResult.goldRawValue).toLocaleString()} + مصنعية ودمغة: {Math.round(calculationResult.craftsmanshipTotal + calculationResult.vatAndStampTotal).toLocaleString()})
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 space-y-1">
                      <span className="text-[11px] text-slate-400 block font-bold">
                        عائد البيع للصاغة (السعر العادل):
                      </span>
                      <div className="text-2xl font-black font-mono text-emerald-400">
                        {calculationResult.totalSellToShop.toLocaleString('ar-EG')} <span className="text-xs font-sans">ج.م</span>
                      </div>
                      <span className="text-[10px] text-emerald-300 block">
                        على أساس سعر شراء الصاغة الحالي ({calculationResult.baseBuyPrice} ج.م / جرام)
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 col-span-1 sm:col-span-2 lg:col-span-1">
                      <span className="text-[11px] text-slate-400 block font-bold">
                        فارق المصنعية وسبريد الشراء الفوري:
                      </span>
                      <div className="text-2xl font-black font-mono text-rose-400">
                        -{calculationResult.spreadLossOnImmediateSale.toLocaleString('ar-EG')} <span className="text-xs font-sans">ج.م</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        يمثل فرق البيع والشراء والمصنعية التي تعوض بارتفاع السعر لاحقاً
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: ISLAMIC ZAKAT CALCULATOR */}
              {activeModalTab === 'ZAKAT' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 space-y-3">
                    <div className="flex items-center gap-2">
                      <Scale className="w-5 h-5 text-emerald-400" />
                      <h4 className="text-sm font-black text-emerald-300">
                        حاسبة زكاة الذهب الشرعية (وفق المعايير الفقهية المعتمدة):
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      النصاب الشرعي للذهب هو <strong>85 جراماً من الذهب الخالص عيار 24</strong> (أو ما يعادله 97.14 جرام عيار 21، أو 113.33 جرام عيار 18). ونصاب الذهب الحالي بالصاغة يساوي <strong className="text-emerald-400 font-mono">{zakatResult.nisabValueEgp.toLocaleString('ar-EG')} ج.م</strong>. إذا بلغ الذهب المدخر هذا المقدار ودار عليه الحول (عام هجري كامل)، تجب فيه الزكاة بنسبة ربع العشر (2.5%).
                    </p>
                  </div>

                  {/* Zakat Inputs */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-white block">أدخل كميات الذهب المدخر للادخار أو التجارة:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">ذهب عيار 24 (جرام):</label>
                        <input
                          type="number"
                          min="0"
                          value={zakat24Grams}
                          onChange={(e) => setZakat24Grams(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">ذهب عيار 21 (جرام):</label>
                        <input
                          type="number"
                          min="0"
                          value={zakat21Grams}
                          onChange={(e) => setZakat21Grams(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">ذهب عيار 18 (جرام):</label>
                        <input
                          type="number"
                          min="0"
                          value={zakat18Grams}
                          onChange={(e) => setZakat18Grams(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">عدد الجنيهات الذهب:</label>
                        <input
                          type="number"
                          min="0"
                          value={zakatPoundsCount}
                          onChange={(e) => setZakatPoundsCount(parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Zakat Result Summary Card */}
                  <div
                    className={`p-5 rounded-2xl border space-y-3 ${
                      zakatResult.hasReachedNisab
                        ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {zakatResult.hasReachedNisab ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Info className="w-5 h-5 text-slate-400" />
                        )}
                        <h5 className="font-bold text-sm text-white">
                          {zakatResult.hasReachedNisab ? 'الذهب بلغ النصاب الشرعي وتجب فيه الزكاة 🟢' : 'الذهب لم يبلغ النصاب الشرعي بعد ⚪'}
                        </h5>
                      </div>
                      <span className="font-mono text-xs font-bold text-white bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                        المعادل الصافي: {zakatResult.totalPureGrams24k} جرام عيار 24
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed font-sans">{zakatResult.explanationAr}</p>

                    {zakatResult.hasReachedNisab && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-emerald-500/30">
                        <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30">
                          <span className="text-[10px] text-slate-400 block font-bold">مقدار الزكاة الواجبة نقداً (2.5%):</span>
                          <strong className="text-2xl font-black font-mono text-emerald-400 block mt-0.5">
                            {zakatResult.zakatDueEgp.toLocaleString('ar-EG')} <span className="text-xs font-sans">جنيه مصري</span>
                          </strong>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30">
                          <span className="text-[10px] text-slate-400 block font-bold">أو إخراجها ذهباً خالصاً (عيار 24):</span>
                          <strong className="text-2xl font-black font-mono text-cyan-300 block mt-0.5">
                            {zakatResult.zakatDueGrams24k} <span className="text-xs font-sans">جرام ذهب</span>
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: REAL-TIME GLOBAL GOLD TRADINGVIEW CHART */}
              {activeModalTab === 'CHART' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">شارت الذهب العالمي اللحظي (XAU/USD) - TradingView:</span>
                      <span className="font-mono text-cyan-300 font-bold">${snapshot.globalSpot.priceUsd.toFixed(2)}</span>
                    </div>
                    <a
                      href="https://www.tradingview.com/chart/?symbol=OANDA:XAUUSD"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                    >
                      <span>فتح بكامل الشاشة</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="relative w-full h-[460px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-1">
                    <div ref={goldChartRef} className="tradingview-widget-container h-full w-full" />
                  </div>
                </div>
              )}

              {/* TAB 7: HEDGING & SAGHA DOLLAR */}
              {activeModalTab === 'HEDGING' && (
                <div className="space-y-4 text-xs text-slate-300">
                  <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-cyan-300 text-sm flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-cyan-400" />
                        <span>سعر دولار الصاغة المحسوب مقابل سعر البنك الرسمي:</span>
                      </h4>
                      <span className="font-mono text-base font-black text-white">
                        ${snapshot.globalSpot.saghaUsdRate.toFixed(2)} ج.م
                      </span>
                    </div>
                    <p className="leading-relaxed text-slate-300">
                      يتم حساب دولار الصاغة عبر معادلة: (سعر جرام الذهب عيار 24 بالصاغة × 31.1035 ÷ سعر أونصة الذهب عالمياً بالدولار).
                      وهو المؤشر الأهم لقياس سيولة العملة الصعبة ومستويات التضخم في السوق المصري.
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-cyan-500/20 text-slate-400 font-mono text-[11px]">
                      <span>سعر الصرف بالبنك الرسمي: <strong>{snapshot.globalSpot.usdEgpRate.toFixed(2)} ج.م</strong></span>
                      <span>سعر دولار الصاغة: <strong className="text-cyan-300">{snapshot.globalSpot.saghaUsdRate.toFixed(2)} ج.م</strong></span>
                      <span>علاوة التحوط: <strong className="text-amber-400">+{((snapshot.globalSpot.saghaUsdRate / snapshot.globalSpot.usdEgpRate - 1) * 100).toFixed(1)}%</strong></span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-950/25 border border-emerald-500/35 space-y-2">
                    <h4 className="font-bold text-emerald-300 text-sm flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>قواعد التحوط وحماية رأس المال مع الأسهم:</span>
                    </h4>
                    <p className="leading-relaxed text-slate-200">
                      {snapshot.globalSpot.hedgingAdviceAr}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                الأسعار تسترشد ببيانات سوق الصاغة المصرية الرسمي ومنصة iSagha وبورصة نيويورك ولندن للمعادن
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
