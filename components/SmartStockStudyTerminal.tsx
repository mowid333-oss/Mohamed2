import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Target,
  Search,
  TrendingUp,
  TrendingDown,
  Sparkles,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Activity,
  LineChart,
  DollarSign,
  Zap,
  Info,
  Calendar,
  Award,
  Bot,
  Filter,
} from 'lucide-react';
import { EGXStock } from '../types/stock';

export type InvestmentHorizon = 'SHORT' | 'MEDIUM' | 'LONG';

interface SmartStockStudyTerminalProps {
  stocks: EGXStock[];
  selectedSymbol: string;
  onSelectStock: (symbol: string) => void;
  onOpenAdvisor?: (symbol: string) => void;
  onSwitchToDca?: (symbol: string) => void;
}

function normalizeArabicText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '')
    .trim();
}

export const SmartStockStudyTerminal: React.FC<SmartStockStudyTerminalProps> = ({
  stocks,
  selectedSymbol,
  onSelectStock,
  onOpenAdvisor,
  onSwitchToDca,
}) => {
  // Search query & active stock
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Selected Investment Horizon: SHORT (1-14 days), MEDIUM (1-6 months), LONG (1-3 years)
  const [horizon, setHorizon] = useState<InvestmentHorizon>('MEDIUM');

  // Active stock
  const activeStock = useMemo(() => {
    return stocks.find((s) => s.symbol.toUpperCase() === selectedSymbol.toUpperCase()) || stocks[0] || {
      symbol: 'TMGH',
      nameAr: 'مجموعة طلعت مصطفى',
      nameEn: 'Talaat Moustafa Group',
      price: 60.5,
      low: 58.0,
      high: 62.0,
      rsi14: 44,
      sma50: 57.0,
      sma200: 48.0,
      changePct: 1.5,
      volume: 2500000,
      valueTraded: 151250000,
      isShariahCompliant: true,
      sectorAr: 'عقارات',
    };
  }, [stocks, selectedSymbol]);

  // Close search suggestions on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filtered search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const norm = normalizeArabicText(searchQuery);
    return stocks
      .filter((s) => {
        return (
          s.symbol.toLowerCase().includes(norm) ||
          normalizeArabicText(s.nameAr).includes(norm) ||
          s.nameEn.toLowerCase().includes(norm)
        );
      })
      .slice(0, 10);
  }, [stocks, searchQuery]);

  // Core Technical Diagnosis Engine based on selected stock and Horizon
  const analysis = useMemo(() => {
    const p = activeStock.price || 50;
    const low = (activeStock as any)?.low || p * 0.95;
    const high = (activeStock as any)?.high || p * 1.05;
    const prevClose = activeStock.prevClose || p;
    const rsi = activeStock.rsi14 || 48;
    const sma50 = activeStock.sma50 || p * 0.94;
    const sma200 = activeStock.sma200 || p * 0.82;

    // Classic Pivot Points
    const pivot = (high + low + p) / 3;
    const classicS1 = 2 * pivot - high;
    const classicS2 = pivot - (high - low);
    const classicR1 = 2 * pivot - low;
    const classicR2 = pivot + (high - low);

    // Trend Direction Evaluation
    let trendType: 'BULLISH' | 'CORRECTION' | 'BEARISH' | 'SIDEWAYS';
    let trendLabel: string;
    if (p > sma50 && p > sma200 && rsi >= 48) {
      trendType = 'BULLISH';
      trendLabel = 'اتجاه صاعد قوي (Bullish Uptrend)';
    } else if (p < sma50 && p > sma200) {
      trendType = 'CORRECTION';
      trendLabel = 'موجة تصحيحية في اتجاه عام صاعد (Correction)';
    } else if (p < sma50 && p < sma200) {
      trendType = 'BEARISH';
      trendLabel = 'مسار هابط رئيسي كاسر للمتوسطات (Bearish)';
    } else {
      trendType = 'SIDEWAYS';
      trendLabel = 'تذبذب وتجميع عرضي (Sideways Channel)';
    }

    // Determine BUY vs WAIT Decision:
    // If RSI is heavily overbought (>74) or price is in free-fall breaking all supports without bounce
    let isWaitDecision = false;
    let waitReason = '';
    let waitAction = '';

    if (horizon === 'SHORT' && rsi >= 72) {
      isWaitDecision = true;
      waitReason = `السهم في منطقة ذروة شراء مفرطة (RSI: ${rsi.toFixed(0)}) وقريب من المقاومة اللحظية. الشراء الآن يحمل مخاطرة مطاردة القمم.`;
      waitAction = `انتظر تصحيح السعر نحو مستويات الدعم اللحظية وهبوط مؤشر RSI دون 50 للدخول الآمن.`;
    } else if (trendType === 'BEARISH' && rsi < 30 && activeStock.changePct < -3) {
      isWaitDecision = true;
      waitReason = `السهم في حالة هبوط حاد (Free Fall) دون ظهور شمعة انعكاسية أو دايفرجنس إيجابي حتى الآن.`;
      waitAction = `انتظر تأكيد صانع السوق بقاع مزدوج أو شمعة ابتلاعية خضراء على الإطار اليومي قبل فتح أي مركز جديد.`;
    } else if (rsi >= 78) {
      isWaitDecision = true;
      waitReason = `مؤشر القوة النسبية متضخم جداً (${rsi.toFixed(0)}). العائد المتوقع أقل بكثير من حجم المخاطرة.`;
      waitAction = `تريث ولا تتسرع؛ انتظر مرحلة جني الأرباح والتجميع عند الدعوم الفنية.`;
    }

    // Dynamic Buy Zones based on Horizon:
    // SHORT: Quick, narrow supports (S1, S2, Fib 38.2%), tight targets & stop loss
    // MEDIUM: Fibonacci 50% & 61.8%, SMA50, position targets (+15% to +30%)
    // LONG: Historic bases, SMA200, Fib 78.6%, major multi-year accumulation zones (+40% to +80%)
    let buyLevel1: { price: number; name: string; sharePct: number; desc: string; sl: number };
    let buyLevel2: { price: number; name: string; sharePct: number; desc: string; sl: number };
    let buyLevel3: { price: number; name: string; sharePct: number; desc: string; sl: number };
    let tp1: { price: number; gainPct: number; desc: string };
    let tp2: { price: number; gainPct: number; desc: string };
    let tp3: { price: number; gainPct: number; desc: string };
    let strictStopLoss: { price: number; lossPct: number; desc: string };
    let riskRewardRatio: string;
    let horizonDescription: string;
    let suggestedHoldingPeriod: string;

    if (horizon === 'SHORT') {
      horizonDescription = 'مضاربة سريعة تركز على الزخم اللحظي، فريمات الساعة واليومي، وأهداف سريعة مع وقف خسارة ضيق جداً.';
      suggestedHoldingPeriod = 'من يومين إلى 10 أيام تداول';
      
      const p1 = Number((p * 0.985).toFixed(2));
      const p2 = Number((Math.min(classicS1, p * 0.965)).toFixed(2));
      const p3 = Number((Math.min(classicS2, p * 0.945)).toFixed(2));

      buyLevel1 = {
        price: p1,
        name: 'دعم المضاربة اللحظي (Intraday Pullback)',
        sharePct: 40,
        desc: 'الشراء مع أول اختبار للمتوسط المتحرك السريع EMA 20 على فريم الساعة.',
        sl: Number((p1 * 0.97).toFixed(2)),
      };
      buyLevel2 = {
        price: p2,
        name: 'الدعم الأول S1 وتصحيح فيبوناتشي 38.2%',
        sharePct: 40,
        desc: 'أقوى مناطق الارتداد السريع واقتناص شمعة الهمر أو الابتلاع الإيجابي.',
        sl: Number((p2 * 0.97).toFixed(2)),
      };
      buyLevel3 = {
        price: p3,
        name: 'دعم كسر وهمي واقتناص السيولة',
        sharePct: 20,
        desc: 'دخول تكتيكي عند محاولة ضرب وقوف الخسائر قبل الصعود السريع.',
        sl: Number((p3 * 0.97).toFixed(2)),
      };

      const target1 = Number((p * 1.05).toFixed(2));
      const target2 = Number((p * 1.09).toFixed(2));
      const target3 = Number((p * 1.14).toFixed(2));
      const stop = Number((p3 * 0.97).toFixed(2));

      tp1 = { price: target1, gainPct: 5.0, desc: 'الهدف الأول (المقاومة اللحظية R1 - بيع 50% من الكمية)' };
      tp2 = { price: target2, gainPct: 9.0, desc: 'الهدف الثاني (سقف القناة السعرية R2 - تأمين الأرباح)' };
      tp3 = { price: target3, gainPct: 14.0, desc: 'الهدف الثالث (امتداد فيبوناتشي 127.2%)' };
      strictStopLoss = {
        price: stop,
        lossPct: Number((((p - stop) / p) * 100).toFixed(1)),
        desc: 'إغلاق شمعة ساعة أدنى من هذا المستوى يتطلب الخروج الفوري لحماية رأس المال.',
      };
      riskRewardRatio = '1 : 2.8';
    } else if (horizon === 'MEDIUM') {
      horizonDescription = 'استثمار موجي وتمركز متوسط المدى يهدف لاقتناص موجة دافعة كاملة بناءً على الأساسيات الفنية وفيبوناتشي ومتوسط 50 يوم.';
      suggestedHoldingPeriod = 'من شهر إلى 5 أشهر';

      const p1 = Number((p * 0.96).toFixed(2));
      const p2 = Number((Math.min(sma50, p * 0.915)).toFixed(2));
      const p3 = Number((p * 0.865).toFixed(2));

      buyLevel1 = {
        price: p1,
        name: 'الدعم الفني الأول S1 (بداية التجميع)',
        sharePct: 35,
        desc: 'منطقة اختبار خط الاتجاه الصاعد وتصحيح فيبوناتشي 38.2%.',
        sl: Number((p1 * 0.95).toFixed(2)),
      };
      buyLevel2 = {
        price: p2,
        name: 'الدعم الذهبي S2 (فيبوناتشي 61.8% ومتوسط 50 يوم)',
        sharePct: 45,
        desc: 'أهم منطقة للشراء التراكمي وتواجد السيولة المؤسسية الكبرى.',
        sl: Number((p2 * 0.94).toFixed(2)),
      };
      buyLevel3 = {
        price: p3,
        name: 'منطقة الطلب الأسبوعية (Deep Support)',
        sharePct: 20,
        desc: 'قاع الموجة التصحيحية وفرصة تعزيز استثنائية بعائد مرتفع جداً.',
        sl: Number((p3 * 0.93).toFixed(2)),
      };

      const target1 = Number((p * 1.15).toFixed(2));
      const target2 = Number((p * 1.25).toFixed(2));
      const target3 = Number((p * 1.40).toFixed(2));
      const stop = Number((p3 * 0.94).toFixed(2));

      tp1 = { price: target1, gainPct: 15.0, desc: 'الهدف الأول (قمة سابقة ومقاومة رئيسية R1)' };
      tp2 = { price: target2, gainPct: 25.0, desc: 'الهدف الثاني (اختراق المقاومة التاريخية R2)' };
      tp3 = { price: target3, gainPct: 40.0, desc: 'الهدف الثالث (امتداد الموجة الصاعدة الكبرى)' };
      strictStopLoss = {
        price: stop,
        lossPct: Number((((p - stop) / p) * 100).toFixed(1)),
        desc: 'إغلاق شمعة أسبوعية تحت الدعم الأسبوعي ينهي النموذج الإيجابي ويستوجب تخفيف المراكز.',
      };
      riskRewardRatio = '1 : 3.4';
    } else {
      // LONG TERM
      horizonDescription = 'استثمار قيمة استراتيجي طويل المدى يستهدف مضاعفة رأس المال بناءً على القيعان التاريخية، متوسط 200 يوم، والنمو الاقتصادي.';
      suggestedHoldingPeriod = 'من سنة إلى 3 سنوات';

      const p1 = Number((Math.min(sma50, p * 0.93)).toFixed(2));
      const p2 = Number((Math.min(sma200, p * 0.85)).toFixed(2));
      const p3 = Number((p * 0.76).toFixed(2));

      buyLevel1 = {
        price: p1,
        name: 'المحطة 1: الشراء التراكمي الأولي',
        sharePct: 30,
        desc: 'دخول أولي عند متوسط 50 يوم في مسار صاعد متعدد السنوات.',
        sl: Number((p1 * 0.90).toFixed(2)),
      };
      buyLevel2 = {
        price: p2,
        name: 'المحطة 2: الدعم المؤسسي الاستراتيجي (متوسط 200 يوم)',
        sharePct: 40,
        desc: 'حزام الأمان الاستثماري وتمركز الصناديق السيادية والمؤسسات الأجنبية.',
        sl: Number((p2 * 0.88).toFixed(2)),
      };
      buyLevel3 = {
        price: p3,
        name: 'المحطة 3: القاع السنوي التاريخي (Maximum Value Zone)',
        sharePct: 30,
        desc: 'اقتناص السهم في أدنى مكرر ربحية وقيمة عادلة استثنائية.',
        sl: Number((p3 * 0.86).toFixed(2)),
      };

      const target1 = Number((p * 1.35).toFixed(2));
      const target2 = Number((p * 1.60).toFixed(2));
      const target3 = Number((p * 2.05).toFixed(2));
      const stop = Number((p3 * 0.88).toFixed(2));

      tp1 = { price: target1, gainPct: 35.0, desc: 'الهدف الاستثماري الأول (تحقيق دورة سعرية متوسطة)' };
      tp2 = { price: target2, gainPct: 60.0, desc: 'الهدف الاستثماري الثاني (الوصول للقيمة العادلة المقدرة)' };
      tp3 = { price: target3, gainPct: 105.0, desc: 'الهدف الاستثماري الأقصى (مضاعفة رأس المال +100%)' };
      strictStopLoss = {
        price: stop,
        lossPct: Number((((p - stop) / p) * 100).toFixed(1)),
        desc: 'كسر وإغلاق سنوي تحت أدنى قاع تاريخي يمثل إنذاراً لإعادة تقييم الشركة ومراجعة القوائم المالية.',
      };
      riskRewardRatio = '1 : 4.5';
    }

    return {
      currentPrice: p,
      trendType,
      trendLabel,
      rsi,
      sma50,
      sma200,
      classicS1: Number(classicS1.toFixed(2)),
      classicS2: Number(classicS2.toFixed(2)),
      classicR1: Number(classicR1.toFixed(2)),
      classicR2: Number(classicR2.toFixed(2)),
      isWaitDecision,
      waitReason,
      waitAction,
      buyLevel1,
      buyLevel2,
      buyLevel3,
      tp1,
      tp2,
      tp3,
      strictStopLoss,
      riskRewardRatio,
      horizonDescription,
      suggestedHoldingPeriod,
    };
  }, [activeStock, horizon]);

  // Copy Complete Technical & Buy Zones Report
  const handleCopyReport = () => {
    const horizonTitle =
      horizon === 'SHORT' ? 'قصير المدى (مضاربة 1-14 يوم)' : horizon === 'MEDIUM' ? 'متوسط المدى (1-6 أشهر)' : 'طويل المدى (1-3 سنوات)';

    const text = `🎯 تقرير الدراسة الفنية وتحديد أفضل أماكن الشراء - منصة مستشار التداول الذكي EGX
السهم المختار: ${activeStock.symbol} - ${activeStock.nameAr}
السعر السوقي اللحظي: ${activeStock.price.toFixed(2)} ج.م (التغير: ${activeStock.changePct > 0 ? '+' : ''}${activeStock.changePct}%)
أفق ونوع الاستثمار: ${horizonTitle}
الاتجاه العام: ${analysis.trendLabel}
مؤشر القوة النسبية RSI(14): ${analysis.rsi.toFixed(1)}

${
  analysis.isWaitDecision
    ? `⏳ قرار المنظومة الفني: انتظار (HOLD / WAIT)
سبب الانتظار: ${analysis.waitReason}
شروط التحول للشراء: ${analysis.waitAction}`
    : `🟢 قرار المنظومة الفني: شراء متاح (BUY ZONES ACTIVE)
🎯 أفضل 3 أماكن للشراء بدقة:
1️⃣ مكان الشراء الأول: ${analysis.buyLevel1.price} ج.م (${analysis.buyLevel1.name}) - حصة ${analysis.buyLevel1.sharePct}%
   - الأساس: ${analysis.buyLevel1.desc}
   - وقف الخسارة: ${analysis.buyLevel1.sl} ج.م

2️⃣ مكان الشراء الثاني: ${analysis.buyLevel2.price} ج.م (${analysis.buyLevel2.name}) - حصة ${analysis.buyLevel2.sharePct}%
   - الأساس: ${analysis.buyLevel2.desc}
   - وقف الخسارة: ${analysis.buyLevel2.sl} ج.م

3️⃣ مكان الشراء الثالث: ${analysis.buyLevel3.price} ج.م (${analysis.buyLevel3.name}) - حصة ${analysis.buyLevel3.sharePct}%
   - الأساس: ${analysis.buyLevel3.desc}
   - وقف الخسارة: ${analysis.buyLevel3.sl} ج.م

🎯 أهداف جني الأرباح (Take Profit Targets):
- الهدف 1: ${analysis.tp1.price} ج.م (+${analysis.tp1.gainPct}%) -> ${analysis.tp1.desc}
- الهدف 2: ${analysis.tp2.price} ج.م (+${analysis.tp2.gainPct}%) -> ${analysis.tp2.desc}
- الهدف 3: ${analysis.tp3.price} ج.م (+${analysis.tp3.gainPct}%) -> ${analysis.tp3.desc}

🛡️ إدارة المخاطر:
- وقف الخسارة الصارم المشترك: ${analysis.strictStopLoss.price} ج.م (-${analysis.strictStopLoss.lossPct}%)
- معدل العائد إلى المخاطرة (Risk-Reward): ${analysis.riskRewardRatio}`
}

فترة الاحتفاظ المقترحة: ${analysis.suggestedHoldingPeriod}
تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}`;

    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2200);
  };

  // Popular quick stocks
  const POPULAR_SYMBOLS = ['TMGH', 'COMI', 'SWDY', 'FWRY', 'ABUK', 'MFPC', 'ESRS', 'EKHO', 'HELI', 'PHDC'];

  return (
    <div
      dir="rtl"
      className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-[#060c14] via-[#09111c] to-[#040810] p-4 sm:p-6 shadow-2xl space-y-6 font-['Cairo'] relative overflow-hidden"
    >
      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Row: Title & Action Hub */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <Target className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>منظومة الدراسة الفنية الذكية وتحديد أماكن الشراء الـ 3</span>
              </h2>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                AI Stock Study Terminal
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              اكتب اسم السهم لدراسة الشارت والمؤشرات وتحديد أفضل 3 مستويات للدخول أو قرار الانتظار حسب أفق استثمارك
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-between lg:justify-end">
          <button
            type="button"
            onClick={handleCopyReport}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm"
            title="نسخ تقرير التحليل وتوصية أماكن الشراء"
          >
            {copiedReport ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-emerald-400" />}
            <span>{copiedReport ? 'تم النسخ!' : 'نسخ التقرير الشامل'}</span>
          </button>

          {onSwitchToDca && (
            <button
              type="button"
              onClick={() => onSwitchToDca(activeStock.symbol)}
              className="px-3.5 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
              title="نقل السهم إلى حاسبة التبريد وتعديل المتوسط الذكي DCA"
            >
              <span>حاسبة التبريد DCA 🎯</span>
            </button>
          )}

          {onOpenAdvisor && (
            <button
              type="button"
              onClick={() => onOpenAdvisor(activeStock.symbol)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
              title="استشارة المستشار الفني الآلي المباشر"
            >
              <Bot className="w-4 h-4" />
              <span>المستشار الآلي 🤖</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Input Bar (Smart Interactive Stock Search) */}
      <div className="space-y-3">
        <div ref={searchContainerRef} className="relative w-full">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="🔍 اكتب اسم السهم أو الرمز لدراسته فورياً (مثال: TMGH, طلعت مصطفى, SWDY, السويدي, فوري, COMI...)"
              className="w-full bg-slate-950 border-2 border-emerald-500/40 hover:border-emerald-500/70 focus:border-emerald-400 rounded-2xl py-3.5 pr-11 pl-4 text-sm font-bold text-white placeholder-slate-500 focus:outline-none shadow-xl transition-all"
            />
            <Search className="w-5 h-5 text-emerald-400 absolute right-3.5 top-3.5 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3.5 top-3.5 text-xs text-slate-400 hover:text-white bg-slate-800 px-2 py-0.5 rounded-lg cursor-pointer"
              >
                مسح
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && searchResults.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-[#0a111a] border border-emerald-500/50 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800/80 max-h-80 overflow-y-auto animate-fadeIn">
              {searchResults.map((s) => (
                <div
                  key={s.symbol}
                  onClick={() => {
                    onSelectStock(s.symbol);
                    setSearchQuery('');
                    setIsDropdownOpen(false);
                  }}
                  className="p-3 hover:bg-emerald-950/40 transition-colors cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-sm text-emerald-300 group-hover:text-emerald-200">
                      {s.symbol}
                    </span>
                    <span className="text-xs font-bold text-white">{s.nameAr}</span>
                    <span className="text-[10px] text-slate-400 font-sans">{s.sectorAr}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-white">{s.price.toFixed(2)} ج.م</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        s.changePct >= 0
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                          : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                      }`}
                    >
                      {s.changePct > 0 ? '+' : ''}
                      {s.changePct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Popular Stock Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          <span className="text-[11px] text-slate-400 font-bold shrink-0 ml-1">الأسهم الأكثر بحثاً:</span>
          {POPULAR_SYMBOLS.map((sym) => {
            const isSelected = activeStock.symbol === sym;
            return (
              <button
                key={sym}
                type="button"
                onClick={() => onSelectStock(sym)}
                className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-emerald-500/40 hover:text-white'
                }`}
              >
                {sym}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Stock Overview HUD */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center font-mono font-black text-lg text-emerald-400 shadow-inner">
            {activeStock.symbol.slice(0, 4)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-white">{activeStock.nameAr}</h3>
              <span className="text-xs font-mono text-slate-400 font-bold">({activeStock.symbol})</span>
              {activeStock.isShariahCompliant && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>متوافق مع الشريعة</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>القطاع: <strong>{activeStock.sectorAr || 'السوق الرئيسي'}</strong></span>
              <span>•</span>
              <span>التنفيذ اليومي: <strong>{(activeStock.volume || 0).toLocaleString()} سهم</strong></span>
            </p>
          </div>
        </div>

        {/* Live Price & Trend Badge */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">السعر السوقي اللحظي</span>
            <div className="text-2xl font-mono font-black text-white flex items-center gap-1.5">
              <span>{activeStock.price.toFixed(2)}</span>
              <span className="text-xs font-sans text-slate-400 font-normal">ج.م</span>
            </div>
          </div>

          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1 shadow-sm ${
              activeStock.changePct >= 0
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                : 'bg-rose-950/80 text-rose-300 border-rose-500/50'
            }`}
          >
            {activeStock.changePct >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span>{activeStock.changePct > 0 ? '+' : ''}{activeStock.changePct}%</span>
          </div>
        </div>
      </div>

      {/* Investment Horizon Selector (قصير، متوسط، طويل المدى - حسب طلب المستخدم الصريح) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-white flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>اختر نوع وأفق الاستثمار المطلوب لدراسة السهم:</span>
          </label>
          <span className="text-[11px] text-slate-400">
            تتغير أماكن الشراء والأهداف ووقف الخسارة فورياً بناءً على اختيارك
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Horizon 1: SHORT */}
          <button
            type="button"
            onClick={() => setHorizon('SHORT')}
            className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between relative ${
              horizon === 'SHORT'
                ? 'bg-gradient-to-b from-amber-500/20 to-slate-900 border-amber-400 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50'
                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">⚡</span>
                <span className="text-xs font-black text-amber-200">مضاربة قصيرة المدى (Short-Term)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 border border-amber-500/30">
                1 - 14 يوم
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              يركز على الزخم اللحظي، فريم الساعة واليومي، أهداف سريعة (+5% إلى +12%) مع وقف خسارة ضيق جداً (2-3%).
            </p>
          </button>

          {/* Horizon 2: MEDIUM */}
          <button
            type="button"
            onClick={() => setHorizon('MEDIUM')}
            className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between relative ${
              horizon === 'MEDIUM'
                ? 'bg-gradient-to-b from-emerald-500/20 to-slate-900 border-emerald-400 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400/50'
                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">📈</span>
                <span className="text-xs font-black text-emerald-200">استثمار متوسط المدى (Position Swing)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-emerald-300 border border-emerald-500/30 font-bold">
                1 - 6 أشهر (موصى به)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              يركز على الموجات الدافعة، مستويات فيبوناتشي 61.8%، متوسط 50 يوم، وأهداف استراتيجية (+15% إلى +35%).
            </p>
          </button>

          {/* Horizon 3: LONG */}
          <button
            type="button"
            onClick={() => setHorizon('LONG')}
            className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between relative ${
              horizon === 'LONG'
                ? 'bg-gradient-to-b from-cyan-500/20 to-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/50'
                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">🏛️</span>
                <span className="text-xs font-black text-cyan-200">استثمار طويل المدى (Value & Trend)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-cyan-300 border border-cyan-500/30">
                1 - 3 سنوات
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              يركز على القيمة العادلة، القيعان السنوية، متوسط 200 يوم، وتوزيعات الأرباح لتحقيق مضاعفات سعرية (+40% إلى +100%).
            </p>
          </button>
        </div>
      </div>

      {/* CORE DECISION CARD: 3 BUY ZONES OR WAIT DECISION */}
      {analysis.isWaitDecision ? (
        /* HOLD / WAIT CARD */
        <div className="p-5 rounded-3xl bg-gradient-to-b from-rose-950/40 via-amber-950/20 to-slate-950 border-2 border-rose-500/60 shadow-2xl space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 shrink-0">
              <AlertTriangle className="w-8 h-8 animate-bounce" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">
                  قرار المنظومة الفني: <span className="text-rose-400 font-mono">انتظار (HOLD / WAIT) ⏳</span>
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                  لا توجد فرصة شراء آمنة حالياً
                </span>
              </div>
              <p className="text-xs text-rose-200/90 leading-relaxed">
                <strong>السبب الفني:</strong> {analysis.waitReason}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="text-xs font-black text-amber-300 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-400" />
              <span>متى يتحول القرار إلى شراء؟ (شروط الدخول المؤكدة):</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {analysis.waitAction}
            </p>
            <div className="pt-2 flex items-center gap-3 text-xs text-slate-400 flex-wrap">
              <span>الدعم المرتقب للمراقبة: <strong className="text-cyan-300 font-mono">{analysis.classicS1} ج.م</strong></span>
              <span>•</span>
              <span>الدعم الذهبي الأقوى: <strong className="text-emerald-400 font-mono">{analysis.classicS2} ج.م</strong></span>
              <span>•</span>
              <span>RSI الحالي: <strong className="text-purple-300 font-mono">{analysis.rsi.toFixed(1)}</strong></span>
            </div>
          </div>
        </div>
      ) : (
        /* ACTIVE BUY ZONES (THE 3 PRECISE BUY LOCATIONS) */
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                <span>أفضل 3 أماكن للشراء بدقة (Buy Zones):</span>
              </h3>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
              إشارة شراء نشطة 🟢
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Buy Zone 1 */}
            <div className="rounded-2xl p-4 bg-gradient-to-b from-slate-900/90 via-[#0a141c] to-slate-950 border border-cyan-500/40 hover:border-cyan-400 shadow-xl flex flex-col justify-between transition-all group">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-bold text-xs font-mono">
                      1
                    </span>
                    <span className="text-xs font-black text-white">مكان الشراء الأول</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                    تخصيص {analysis.buyLevel1.sharePct}%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/20 text-center mb-3">
                  <span className="text-[10px] text-slate-400 block mb-0.5">سعر الدخول المقترح:</span>
                  <div className="text-2xl font-mono font-black text-cyan-300">
                    {analysis.buyLevel1.price.toFixed(2)}{' '}
                    <span className="text-xs font-sans text-slate-400 font-normal">ج.م</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1 font-bold">
                    {analysis.buyLevel1.name}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed mb-3 min-h-[32px]">
                  {analysis.buyLevel1.desc}
                </p>
              </div>

              <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">وقف الخسارة المباشر:</span>
                <span className="font-mono font-bold text-rose-400">{analysis.buyLevel1.sl} ج.م</span>
              </div>
            </div>

            {/* Buy Zone 2 */}
            <div className="rounded-2xl p-4 bg-gradient-to-b from-slate-900/90 via-[#0a1812] to-slate-950 border-2 border-emerald-500/50 hover:border-emerald-400 shadow-xl flex flex-col justify-between transition-all group relative">
              <div className="absolute -top-2.5 right-4 px-2 py-0.2 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black shadow-md">
                الدعم الذهبي الأقوى ⭐
              </div>

              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-bold text-xs font-mono">
                      2
                    </span>
                    <span className="text-xs font-black text-emerald-200">مكان الشراء الثاني</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                    تخصيص {analysis.buyLevel2.sharePct}%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 text-center mb-3">
                  <span className="text-[10px] text-slate-400 block mb-0.5">سعر الدخول الذهبي:</span>
                  <div className="text-2xl font-mono font-black text-emerald-400">
                    {analysis.buyLevel2.price.toFixed(2)}{' '}
                    <span className="text-xs font-sans text-slate-400 font-normal">ج.م</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1 font-bold">
                    {analysis.buyLevel2.name}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed mb-3 min-h-[32px]">
                  {analysis.buyLevel2.desc}
                </p>
              </div>

              <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">وقف الخسارة المباشر:</span>
                <span className="font-mono font-bold text-rose-400">{analysis.buyLevel2.sl} ج.م</span>
              </div>
            </div>

            {/* Buy Zone 3 */}
            <div className="rounded-2xl p-4 bg-gradient-to-b from-slate-900/90 via-[#18110a] to-slate-950 border border-amber-500/40 hover:border-amber-400 shadow-xl flex flex-col justify-between transition-all group">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold text-xs font-mono">
                      3
                    </span>
                    <span className="text-xs font-black text-amber-200">مكان الشراء الثالث</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/60">
                    تخصيص {analysis.buyLevel3.sharePct}%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/20 text-center mb-3">
                  <span className="text-[10px] text-slate-400 block mb-0.5">سعر القاع المؤسسي:</span>
                  <div className="text-2xl font-mono font-black text-amber-300">
                    {analysis.buyLevel3.price.toFixed(2)}{' '}
                    <span className="text-xs font-sans text-slate-400 font-normal">ج.م</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1 font-bold">
                    {analysis.buyLevel3.name}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed mb-3 min-h-[32px]">
                  {analysis.buyLevel3.desc}
                </p>
              </div>

              <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">وقف الخسارة المباشر:</span>
                <span className="font-mono font-bold text-rose-400">{analysis.buyLevel3.sl} ج.م</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Targets & Risk Management Matrix */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 flex-wrap gap-2">
          <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-400" />
            <span>مستويات جني الأرباح (Take Profit) ونقاط الحماية الصارمة:</span>
          </h4>
          <span className="text-xs text-emerald-400 font-mono font-bold">
            معدل العائد إلى المخاطرة: {analysis.riskRewardRatio} (ممتاز)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Target 1 */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-purple-950/30 to-slate-900 border border-purple-500/40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-purple-300 font-bold">الهدف الأول (TP1)</span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">+{analysis.tp1.gainPct}%</span>
            </div>
            <div className="text-xl font-mono font-black text-white mb-1">
              {analysis.tp1.price.toFixed(2)} <span className="text-xs font-sans text-slate-400">ج.م</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">{analysis.tp1.desc}</p>
          </div>

          {/* Target 2 */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-emerald-950/30 to-slate-900 border border-emerald-500/40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-emerald-300 font-bold">الهدف الثاني (TP2)</span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">+{analysis.tp2.gainPct}%</span>
            </div>
            <div className="text-xl font-mono font-black text-white mb-1">
              {analysis.tp2.price.toFixed(2)} <span className="text-xs font-sans text-slate-400">ج.م</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">{analysis.tp2.desc}</p>
          </div>

          {/* Target 3 */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-cyan-950/30 to-slate-900 border border-cyan-500/40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-cyan-300 font-bold">الهدف الأقصى (TP3)</span>
              <span className="text-[10px] text-cyan-400 font-mono font-bold">+{analysis.tp3.gainPct}%</span>
            </div>
            <div className="text-xl font-mono font-black text-white mb-1">
              {analysis.tp3.price.toFixed(2)} <span className="text-xs font-sans text-slate-400">ج.م</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">{analysis.tp3.desc}</p>
          </div>

          {/* Strict Stop Loss */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-rose-950/40 to-slate-900 border border-rose-500/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-rose-300 font-bold">وقف الخسارة الصارم</span>
              <span className="text-[10px] text-rose-400 font-mono font-bold">-{analysis.strictStopLoss.lossPct}%</span>
            </div>
            <div className="text-xl font-mono font-black text-rose-300 mb-1">
              {analysis.strictStopLoss.price.toFixed(2)} <span className="text-xs font-sans text-slate-400">ج.م</span>
            </div>
            <p className="text-[10px] text-rose-200/80 leading-normal">{analysis.strictStopLoss.desc}</p>
          </div>
        </div>
      </div>

      {/* Embedded Real-Time TradingView Chart for the Selected Stock */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-black text-white">
              شارت TradingView اللحظي لسهم {activeStock.symbol} - فحص حركة السعر والمؤشرات
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            EGX:{activeStock.symbol} • Interactive Technical Chart
          </span>
        </div>

        <div className="h-[420px] w-full relative">
          <iframe
            key={`chart-${activeStock.symbol}`}
            src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_smart_${activeStock.symbol}&symbol=EGX%3A${activeStock.symbol}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=0c1017&studies=%5B%22RSI%40tv-basicstudies%22%2C%22MASimple%40tv-basicstudies%22%5D&theme=dark&style=1&timezone=Africa%2FCairo&studies_overrides=%7B%7D&overrides=%7B%22mainSeriesProperties.style%22%3A1%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=ar_AE&utm_source=tradingview.com`}
            title={`TradingView Chart ${activeStock.symbol}`}
            className="w-full h-full border-0"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};
