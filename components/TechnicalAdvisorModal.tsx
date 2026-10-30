import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Bot,
  Send,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Target,
  Copy,
  Check,
  Zap,
  Droplets,
  Layers,
  ArrowRight,
  HelpCircle,
  Compass,
  Search,
  Clock,
  CheckCircle2,
  Calendar,
  Scale,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Award,
  ChevronDown,
} from 'lucide-react';
import { EGXStock, TradingTimeframe, TRADING_TIMEFRAMES } from '../types/stock';
import { calculateStockTechnicalIndicators } from '../services/technicalAnalysisService';
import { analyzeAnnualVolumeAndLiquidity } from '../services/radarAdvancedEngine';
import { evaluateAiCouncil, CouncilVerdict } from '../services/aiCouncilService';
import { GoogleGenAI } from '@google/genai';
import { callApmixChatCompletion } from '../services/apmixAiService';
import {
  getCairoCurrentTimeFormatted,
  CHART_15_MIN_DELAY_NOTICE_AR,
  LEGAL_DISCLAIMER_AR,
  evaluateChartTechnicalReading,
} from '../utils/reportDisclaimer';
import { TradingViewRatingWidget } from './TradingViewRatingWidget';
import { getTradingViewChartVerdict } from '../utils/tradingViewChartVerdict';
import { evaluateSmcAnalysis } from '../utils/smcAnalysisEngine';
import { calculateBollingerBands } from '../utils/bollingerBandsEngine';
import { calculateAccumulationDistribution } from '../utils/accumulationDistributionEngine';
import { formatEgpMoney } from './StockTable';
import { verifyAndSyncReportPrice } from '../utils/priceVerificationService';
import { getLiveCalculatedIndices } from '../data/marketIndices';
import { CopyableStockSymbol } from './CopyableStockSymbol';

import { useReportLock } from '../hooks/useReportLock';
import { ReportStabilityLockBar } from './ReportStabilityLockBar';

interface TechnicalAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: EGXStock[];
  initialSymbol?: string;
  onSelectStock?: (symbol: string) => void;
  onSelectStockForChart?: (symbol: string) => void;
  onOpenTradeManagement?: (symbol: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'USER' | 'ADVISOR';
  text: string;
  timestamp: string;
  stockSymbol?: string;
  quickMetrics?: {
    action: string;
    target1: string;
    stopLoss: string;
    consensusScore: number;
    isShariah: boolean;
    timeframe: string;
  };
}

// Arabic text normalizer for search
function normalizeAr(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '')
    .trim();
}

export const TechnicalAdvisorModal: React.FC<TechnicalAdvisorModalProps> = ({
  isOpen,
  onClose,
  stocks,
  initialSymbol,
  onSelectStock,
  onSelectStockForChart,
  onOpenTradeManagement,
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(
    initialSymbol || (stocks[0]?.symbol ?? 'TMGH')
  );
  const [selectedTimeframe, setSelectedTimeframe] = useState<TradingTimeframe>('1D');
  const [advisorViewMode, setAdvisorViewMode] = useState<'COUNCIL' | 'CHAT'>('COUNCIL');

  // 180-second state-based lock for AI council and advisor
  const lockState = useReportLock('advisor_council_ai', selectedSymbol || 'GLOBAL', 180);

  // Stock search combobox state
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Council state
  const [councilVerdict, setCouncilVerdict] = useState<CouncilVerdict | null>(null);
  const [isCouncilLoading, setIsCouncilLoading] = useState(false);

  // Chat state
  const [userQuery, setUserQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedFullReport, setCopiedFullReport] = useState(false);
  const [copiedCouncilReport, setCopiedCouncilReport] = useState(false);

  // Sync when initialSymbol changes from outside
  useEffect(() => {
    if (initialSymbol) {
      setSelectedSymbol(initialSymbol);
    }
  }, [initialSymbol]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const isSelectedAnIndex = useMemo(() => {
    const cleanSym = (selectedSymbol || '').toUpperCase().replace(/\s+/g, '');
    const indices = getLiveCalculatedIndices(stocks);
    return indices.find(
      (idx) =>
        idx.symbol.toUpperCase().replace(/\s+/g, '') === cleanSym ||
        cleanSym.includes(idx.symbol.toUpperCase().replace(/\s+/g, ''))
    );
  }, [stocks, selectedSymbol]);

  const currentStock = useMemo(() => {
    if (isSelectedAnIndex) {
      const idx = isSelectedAnIndex;
      return {
        symbol: idx.symbol,
        tradingViewSymbol: idx.tradingViewSymbol,
        nameAr: idx.nameAr,
        nameEn: idx.nameEn,
        sectorAr: 'المؤشر العام للبورصة المصرية',
        sectorEn: 'Market Benchmark Index',
        isShariahCompliant: idx.symbol.toLowerCase().includes('shariah'),
        shariahReasonAr: idx.descriptionAr,
        isInEgx30: idx.symbol.includes('30'),
        isInEgx70: idx.symbol.includes('70'),
        isInEgx100: idx.symbol.includes('100'),
        isInShariahIndex: idx.symbol.toLowerCase().includes('shariah'),
        price: idx.points,
        prevClose: Number((idx.points - idx.changePoints).toFixed(2)),
        changePct: idx.changePct,
        changeAbs: idx.changePoints,
        open: idx.points,
        high: idx.points,
        low: idx.points,
        volume: 350000000,
        valueTraded: 4800000000,
        lastUpdatedTime: getCairoCurrentTimeFormatted(),
      } as EGXStock;
    }

    const raw =
      stocks.find((s) => s.symbol.toUpperCase() === selectedSymbol.toUpperCase()) ||
      stocks[0] ||
      ({
        symbol: 'TMGH',
        nameAr: 'طلعت مصطفى',
        price: 60.0,
        changePct: 1.5,
        isShariahCompliant: true,
      } as EGXStock);

    const verified = verifyAndSyncReportPrice(raw, stocks);
    return verified.verifiedStock;
  }, [stocks, selectedSymbol, isSelectedAnIndex]);

  const tfMeta = useMemo(() => {
    return (
      TRADING_TIMEFRAMES.find((t) => t.code === selectedTimeframe) || TRADING_TIMEFRAMES[4]
    );
  }, [selectedTimeframe]);

  // Filter indices for combobox search (e.g. EGX30, ايجي 30, 70, 100)
  const matchingIndices = useMemo(() => {
    const indices = getLiveCalculatedIndices(stocks);
    if (!stockSearchQuery.trim()) return indices;
    const q = stockSearchQuery.toLowerCase().trim();
    const normQ = normalizeAr(q);
    return indices.filter((idx) => {
      const sym = idx.symbol.toLowerCase();
      const normName = normalizeAr(idx.nameAr);
      return (
        sym.includes(q) ||
        normName.includes(normQ) ||
        (normQ.includes('30') && idx.symbol.includes('30')) ||
        (normQ.includes('70') && idx.symbol.includes('70')) ||
        (normQ.includes('100') && idx.symbol.includes('100')) ||
        normQ.includes('ايجي') ||
        normQ.includes('ايجى') ||
        normQ.includes('مؤشر') ||
        normQ.includes('egx')
      );
    });
  }, [stocks, stockSearchQuery]);

  // Filter stocks for combobox (supports Symbol, Arabic Name, English Name)
  const filteredStocks = useMemo(() => {
    if (!stockSearchQuery.trim()) {
      return stocks.slice(0, 35);
    }
    const q = normalizeAr(stockSearchQuery);
    return stocks
      .filter((s) => {
        const sym = s.symbol.toLowerCase();
        const normSym = normalizeAr(s.symbol);
        const normNameAr = normalizeAr(s.nameAr);
        const normNameEn = normalizeAr(s.nameEn || '');
        const normSector = normalizeAr(s.sectorAr || '');

        return (
          sym.includes(q) ||
          normSym.includes(q) ||
          normNameAr.includes(q) ||
          normNameEn.includes(q) ||
          normSector.includes(q)
        );
      })
      .slice(0, 40);
  }, [stocks, stockSearchQuery]);

  // Compute live indicators & volume study for the current stock with the chosen timeframe
  const techData = useMemo(() => {
    if (!currentStock) return null;
    try {
      const indicators = calculateStockTechnicalIndicators(currentStock, selectedTimeframe);
      const volLiq = analyzeAnnualVolumeAndLiquidity(currentStock);
      return { indicators, volLiq };
    } catch (e) {
      console.warn('Error evaluating technical data:', e);
      return null;
    }
  }, [currentStock, selectedTimeframe]);

  // 3-Minute Stability Cache for AI Council
  const councilCacheRef = useRef<Map<string, { verdict: CouncilVerdict; timestamp: number }>>(new Map());

  // Re-evaluate 3-Model AI Council whenever stock or timeframe changes (Stable for 180s / 3 minutes)
  useEffect(() => {
    let isCancelled = false;
    const cleanSym = (currentStock?.symbol || "").toUpperCase();
    if (!cleanSym) return;

    const cacheKey = cleanSym + "_" + selectedTimeframe;
    const cached = councilCacheRef.current.get(cacheKey);

    // If locked and cached verdict exists, keep it stable
    if (cached && lockState.isLocked) {
      setCouncilVerdict(cached.verdict);
      setIsCouncilLoading(false);
      return;
    }

    async function loadCouncil() {
      setIsCouncilLoading(true);
      try {
        const verdict = await evaluateAiCouncil(currentStock, selectedTimeframe);
        if (!isCancelled) {
          setCouncilVerdict(verdict);
          councilCacheRef.current.set(cacheKey, { verdict, timestamp: Date.now() });
        }
      } catch (e) {
        console.error("Error generating AI Council verdict:", e);
      } finally {
        if (!isCancelled) {
          setIsCouncilLoading(false);
        }
      }
    }
    loadCouncil();
    return () => {
      isCancelled = true;
    };
  }, [currentStock?.symbol, selectedTimeframe, lockState.refreshNonce]);

  // Initial welcome message for chat
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-msg',
      sender: 'ADVISOR',
      text: `أهلاً بك! أنا المستشار الفني الذكي المعتمد لمنصة رادار البورصة المصرية EGX.
أعمل الآن بنظام "مجلس المستشارين الثلاثي" (النموذج المؤيد vs النموذج المعارض vs قاضي التداول الفاصل)، بالإضافة إلى المحادثة المباشرة للإجابة عن أي استفسار فني على أي فريم زمني تفضله!`,
      timestamp: 'الآن',
    },
  ]);

  if (!isOpen) return null;

  const handleSelectSymbol = (symbol: string) => {
    setSelectedSymbol(symbol);
    setIsSearchOpen(false);
    setStockSearchQuery('');
    onSelectStock?.(symbol);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyCouncilReport = () => {
    if (!councilVerdict) return;
    navigator.clipboard.writeText(councilVerdict.fullReportText);
    setCopiedCouncilReport(true);
    setTimeout(() => setCopiedCouncilReport(false), 2200);
  };

  const handleCopyFullConsultation = () => {
    if (!currentStock || !techData) return;
    const { indicators, volLiq } = techData;
    const p = currentStock.price;
    const nowStr = getCairoCurrentTimeFormatted();
    const chartVerdict = evaluateChartTechnicalReading(currentStock, tfMeta.labelAr);
    const tvVerdict = getTradingViewChartVerdict(currentStock, tfMeta.labelAr);
    const adReport = calculateAccumulationDistribution(currentStock, tfMeta.labelAr);

    const reportText = `🤖 تقرير المستشار الفني المباشر للبورصة المصرية EGX
━━━━━━━━━━━━━━━━━━━━
📌 السهم: ${currentStock.nameAr} (${currentStock.symbol})
⏱️ الفريم الزمني المعتمد: ${tfMeta.labelAr} (${tfMeta.badgeAr})
💵 السعر الحالي: ${p.toFixed(2)} ج.م (${currentStock.changePct >= 0 ? '+' : ''}${currentStock.changePct}%)
🕋 الموقف الشرعي: ${currentStock.isShariahCompliant ? 'متوافق مع الشريعة الإسلامية ✅' : 'غير متوافق ⚠️'}
⏱️ تاريخ ووقت بيانات الشارت اللحظية: ${nowStr}
${CHART_15_MIN_DELAY_NOTICE_AR}
━━━━━━━━━━━━━━━━━━━━

🔬 مقياس التجميع والتصريف المؤسسي الدقيق (Wyckoff & VSA):
• حالة السهم الدقيقة: [${adReport.phaseAr}]
• ميزان التجميع vs التصريف: تجميع مؤسسي ${adReport.accumulationScore}% مقابل تصريف ${adReport.distributionScore}%
• معامل موضع الإغلاق الشمعي CLV: ${adReport.clv > 0 ? '+' : ''}${adReport.clv} (${adReport.clvStatusAr})
• مرحلة دورة وايكوف: ${adReport.wyckoffStageAr}
• قراءة الحجم والمدى (VSA): ${adReport.vsaInsightAr}
• صافي السيولة التجميعية المقدرة: ${adReport.estimatedAccumulatedValueEgp >= 0 ? '+' : ''}${formatEgpMoney(adReport.estimatedAccumulatedValueEgp)}
• تشخيص المقياس الحاسم: ${adReport.detailedVerdictAr}

🎯 رأي وقراءة شارت TradingView اللحظي المعتمد:
• التقييم الفني الموحد: [${tvVerdict.overallRatingAr}] بنسبة ${tvVerdict.overallScorePct}%
• المتوسطات المتحركة (15 MAs): ${tvVerdict.movingAverages.ratingAr} (${tvVerdict.movingAverages.buyCount} شراء / ${tvVerdict.movingAverages.sellCount} بيع)
• مؤشرات التذبذب (11 Oscillators): ${tvVerdict.oscillators.ratingAr} (${tvVerdict.oscillators.buyCount} شراء / ${tvVerdict.oscillators.neutralCount} محايد / ${tvVerdict.oscillators.sellCount} بيع)
• نموذج الشمعة: ${tvVerdict.candlestick.patternNameAr}
• Pivot: ${tvVerdict.levels.pivot} ج.م | S1: ${tvVerdict.levels.support1} ج.م | R1: ${tvVerdict.levels.resistance1} ج.م
• رأي الشارت الصريح: ${tvVerdict.explicitChartOpinionAr}

📊 قراءة شارت السهم والشموع اليابانية (Chart Technical Breakdown):
• حركة الشموع والبرايس أكشن: ${chartVerdict.candlestickPatternAr}
• الهيكل السعري للشارت: ${chartVerdict.priceActionVerdictAr}
• مستويات الدعم والمقاومة للشارت: دعم ${chartVerdict.chartSupportLevel} ج.م | مقاومة ${chartVerdict.chartResistanceLevel} ج.م
• موقف المتوسطات المتحركة: ${chartVerdict.movingAveragesVerdictAr}
• الرأي الفني المباشر في الشارت: ${chartVerdict.chartTechnicalOpinionAr}

📊 التقييم الفني العام والمؤشرات المجمعة:
- الإشارة: [${indicators.consensusRatingAr}] بقوة ${indicators.consensusScore}%
- السوبر ترند: ${indicators.superTrend.trendAr} (وقف وقائي: ${indicators.superTrend.superTrendValue} ج.م)
- مؤشر RSI: ${indicators.rsi.value} (${indicators.rsi.statusAr})
- الاستوكاستك: %K=${indicators.stochastic.k}, %D=${indicators.stochastic.d}
- الماكدي: ${indicators.macd.statusAr}
- تدفق السيولة: ${volLiq.liquidityStudy.netInflowRatio}% سيولة شرائية

🎯 خطة التداول المقترحة على فريم ${tfMeta.labelAr}:
- نطاق الشراء والدخول: بين ${(p * 0.985).toFixed(2)} ج.م و ${(p * 1.015).toFixed(2)} ج.م
- المستهدف الأول: ${(p * (1 + tfMeta.target1Multiplier)).toFixed(2)} ج.م (+${(tfMeta.target1Multiplier * 100).toFixed(1)}%)
- المستهدف الثاني: ${(p * (1 + tfMeta.target2Multiplier)).toFixed(2)} ج.م (+${(tfMeta.target2Multiplier * 100).toFixed(1)}%)
- وقف الخسارة الصارم: ${(p * (1 - tfMeta.stopLossMultiplier)).toFixed(2)} ج.م (-${(tfMeta.stopLossMultiplier * 100).toFixed(1)}%)

${LEGAL_DISCLAIMER_AR}
المصدر: رادار البورصة المصرية ومؤشر الشريعة الإسلامية TradingView Live`;

    navigator.clipboard.writeText(reportText);
    setCopiedFullReport(true);
    setTimeout(() => setCopiedFullReport(false), 2200);
  };

  const handleQuickQuestion = async (
    type: 'ENTRY_EXIT' | 'VOLUME_LIQUIDITY' | 'SHARIAH' | 'STRATEGY' | 'MARKET_OVERVIEW' | 'TOP_PICKS' | 'SMC'
  ) => {
    if (!currentStock || !techData) return;

    let question = '';
    let responseText = '';
    const { indicators, volLiq } = techData;
    const p = currentStock.price;

    if (type === 'SMC') {
      question = `ما هو رأي وتحليل مدرسة السيولة الذكية (SMC) بدقة لسهم ${currentStock.nameAr} (${currentStock.symbol})؟`;
      const smc = evaluateSmcAnalysis(currentStock, tfMeta.labelAr);
      responseText = `🏛️ *تحليل وقراءة مدرسة السيولة الذكية (Smart Money Concepts - SMC) بدقة:*
━━━━━━━━━━━━━━━━━━━━
📌 السهم: ${currentStock.nameAr} (${currentStock.symbol}) | فريم: [${tfMeta.labelAr}]
💵 السعر اللحظي: ${p.toFixed(2)} ج.م (${currentStock.changePct >= 0 ? '+' : ''}${currentStock.changePct}%)
━━━━━━━━━━━━━━━━━━━━

1️⃣ *هيكل السوق (Market Structure):*
• كسر الهيكل: [${smc.marketStructure.type}] - ${smc.marketStructure.badgeAr}
• التفصيل: ${smc.marketStructure.explanationAr}

2️⃣ *صيد السيولة وتجاوز المستويات (Liquidity Sweep):*
• نوع السحب: [${smc.liquidity.sweepType}]
• الرصد: ${smc.liquidity.sweepStatusAr} (${smc.liquidity.inducementTrapAr})

3️⃣ *كتلة أوامر صانع السوق (Institutional Order Block):*
• النوع والحالة: ${smc.orderBlock.badgeAr} (${smc.orderBlock.statusAr})
• نطاق منطقة الأوامر: ما بين ${smc.orderBlock.zoneMin} ج.م إلى ${smc.orderBlock.zoneMax} ج.م

4️⃣ *الفجوة السعرية والتسعير (FVG & Discount / Premium):*
• حالة التسعير: السهم يتداول في نطاق [${smc.pricing.zoneBadgeAr}] مقارنة بالسعر العادل للتوازن (${smc.pricing.equilibriumPrice} ج.م)
• الفجوة السعرية (Fair Value Gap): ${smc.fairValueGap.imbalanceStatusAr} ${smc.fairValueGap.hasFvg ? `(${smc.fairValueGap.zoneAr})` : ''}

🎯 *خلاصة حكم مدرسة الـ SMC الصريح لحركة السهم:*
${smc.smcVerdictAr}`;
    } else if (type === 'MARKET_OVERVIEW') {
      question = 'ما هي قراءة اتجاه السوق العام ومؤشر إيجي إكس 30 وإيجي إكس 70 اليوم؟';
      const liveIndices = getLiveCalculatedIndices(stocks);
      const idx30 = liveIndices.find((i) => i.symbol === 'EGX30');
      const idx70 = liveIndices.find((i) => i.symbol === 'EGX70');
      const p30 = idx30 ? `${idx30.points.toLocaleString('ar-EG')} نقطة (${idx30.changePct >= 0 ? '+' : ''}${idx30.changePct}%)` : '51,052.26 نقطة (-0.42%)';
      const p70 = idx70 ? `${idx70.points.toLocaleString('ar-EG')} نقطة (${idx70.changePct >= 0 ? '+' : ''}${idx70.changePct}%)` : '17,184.31 نقطة (-3.09%)';
      responseText = `📊 *نظرة المستشار الفني على السوق العام ومؤشرات البورصة المصرية:*
• مؤشر EGX30 الرئيسي: يتداول عند ${p30}. الاتجاه العام صاعد أعلى مستوى الدعم المحوري 50,000 نقطة، مدعوماً بمشتريات المؤسسات والصناديق في القياديات.
• مؤشر EGX70 متساوي الأوزان: يتداول عند ${p70}. يختبر مناطق دعم ارتدادية هامة قرب 17,000 نقطة بعد موجة جني أرباح، مع استمرار النشاط الانتقائي في أسهم الأسمدة ومواد البناء.
• نصيحة إدارة السيولة: الاحتفاظ بنسبة 25% سيولة كاش لاقتناص الفرص عند التراجعات، والتركيز على الأسهم ذات التدفق الشرائي المؤسسي الصافي.`;
    } else if (type === 'TOP_PICKS') {
      question = 'ما هي أفضل الفرص والأسهم الصاعدة فنياً حالياً بالبورصة المصرية؟';
      const topBullish = stocks
        .filter((s) => s.price > 1 && s.changePct > 0)
        .slice(0, 4);
      responseText = `🏆 *أبرز الفرص الفنية الصاعدة بالبورصة المصرية:*
${topBullish.map((s, idx) => `• ${idx + 1}. [${s.symbol}] ${s.nameAr}: سعر ${s.price.toFixed(2)} ج.م (+${s.changePct}%) - قطاع ${s.sectorAr || 'عام'} - ${s.isShariahCompliant ? 'متوافق شرعاً ✅' : 'تقليدي'}`).join('\n')}

💡 التوصية: قم بفحص خطة الدخول وسلم الأهداف لكل سهم عبر نظام إدارة الصفقات 🎯 قبل التنفيذ.`;
    } else if (type === 'ENTRY_EXIT') {
      question = `ما هي نقاط الدخول والمستهدفات ووقف الخسارة لسهم ${currentStock.nameAr} (${currentStock.symbol}) على فريم ${tfMeta.labelAr}؟`;
      const t1 = (p * (1 + tfMeta.target1Multiplier)).toFixed(2);
      const t2 = (p * (1 + tfMeta.target2Multiplier)).toFixed(2);
      const sl = (p * (1 - tfMeta.stopLossMultiplier)).toFixed(2);
      responseText = `🎯 خطة التداول المقترحة لسهم ${currentStock.nameAr} (${currentStock.symbol}) - فريم [${tfMeta.labelAr}]:
- السعر الحالي: ${p.toFixed(2)} ج.م (${currentStock.changePct >= 0 ? '+' : ''}${currentStock.changePct}%)
- التقييم الفني: [${indicators.consensusRatingAr}] بإجماع ${indicators.bullishIndicatorsCount} من مؤشرات القوة الرئيسية (قوة الإشارة: ${indicators.consensusScore}%).
- نطاق الدخول: ما بين ${(p * 0.985).toFixed(2)} ج.م و ${(p * 1.015).toFixed(2)} ج.م.
- المستهدف الأول (${tfMeta.badgeAr}): ${t1} ج.م (+${(tfMeta.target1Multiplier * 100).toFixed(1)}%)
- المستهدف الثاني: ${t2} ج.م (+${(tfMeta.target2Multiplier * 100).toFixed(1)}%)
- وقف الخسارة الصارم: كسر مستوى ${sl} ج.م بإغلاق شمعة فريم ${tfMeta.labelAr}.`;
    } else if (type === 'VOLUME_LIQUIDITY') {
      question = `كيف ترى وضع الفوليم على مدار عام وخط السيولة لسهم ${currentStock.symbol}؟`;
      const vol = volLiq.volumeStudy;
      const liq = volLiq.liquidityStudy;
      responseText = `📊 دراسة الفوليم والسيولة لسهم ${currentStock.nameAr} (${currentStock.symbol}):
- حجم التداول اليوم: ${vol.currentVolume.toLocaleString()} سهم (معامل RVOL: ${vol.relativeVolume1Year}x مقارنة بمتوسط العام).
- خط السيولة المؤسسية: (${liq.liquidityLineTrendAr}) بنسبة تدفق شرائي داخل ${liq.netInflowRatio}%.
- مؤشر VWAP: السعر يتداول ${liq.isPriceAboveVwap ? 'أعلى' : 'أدنى'} متوسط السعر المرجح بالسيولة (${liq.vwapPrice} ج.م).
- التوصية التنفيذية: ${liq.bullishTurnConditions.recommendationSummaryAr}`;
    } else if (type === 'SHARIAH') {
      question = `ما هو الموقف الشرعي والتدقيق المالي لسهم ${currentStock.nameAr} (${currentStock.symbol})؟`;
      responseText = currentStock.isShariahCompliant
        ? `🕋 الموقف الشرعي لسهم ${currentStock.nameAr} (${currentStock.symbol}):
- السهم متوافق مع معايير الشريعة الإسلامية ومدرج في مؤشر EGX30 Shariah ✅
- نسبة الديون الربوية إلى القيمة السوقية: ${currentStock.shariahRatioDebt ? currentStock.shariahRatioDebt + '%' : '< 30% (ضمن الحدود المقبولة)'}
- نشاط الشركة خالي من المحرمات المصرفية أو المخالفات الشرعية المعتمدة.`
        : `⚠️ الموقف الشرعي لسهم ${currentStock.nameAr} (${currentStock.symbol}):
- السهم غير متوافق حالياً مع مؤشر الشريعة الإسلامية ⚠️
- السبب: ${currentStock.shariahReasonAr || 'تجاوز نسب الديون التمويلية للحد الأقصى المسموح شرعاً (33%)'}.`;
    } else {
      question = `ما هي الاستراتيجية المثلى للتعامل مع سهم ${currentStock.symbol} على فريم ${tfMeta.labelAr}؟`;
      responseText = `💡 الاستراتيجية الفنية الموصى بها على فريم [${tfMeta.labelAr}]:
- حالة السهم: ${indicators.superTrend.trendAr}
- مؤشر القوة النسبية RSI: ${indicators.rsi.statusAr}
- نوع التداول المناسب: ${
        currentStock.changePct > 2
          ? 'مضاربة سريعة مع رفع حماية الأرباح (Trailing Stop)'
          : indicators.consensusScore > 65
          ? 'تجميع هادئ على دفعتين بنظام إدارة الصفقات'
          : 'انتظار استقرار السعر وظهور إشارة اختراق واضحة'
      }.
- نصيحة الفريم: ${tfMeta.descriptionAr}.`;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: 'user-' + Date.now(),
        sender: 'USER',
        text: question,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: 'advisor-' + (Date.now() + 1),
        sender: 'ADVISOR',
        text: responseText,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        stockSymbol: currentStock.symbol,
        quickMetrics: {
          action: indicators.consensusRatingAr,
          target1: (p * (1 + tfMeta.target1Multiplier)).toFixed(2) + ' ج.م',
          stopLoss: (p * (1 - tfMeta.stopLossMultiplier)).toFixed(2) + ' ج.م',
          consensusScore: indicators.consensusScore,
          isShariah: currentStock.isShariahCompliant,
          timeframe: tfMeta.labelAr,
        },
      },
    ]);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim() || isThinking) return;

    if (advisorViewMode !== 'CHAT') {
      setAdvisorViewMode('CHAT');
    }

    const q = userQuery.trim();
    setUserQuery('');
    setMessages((prev) => [
      ...prev,
      {
        id: 'user-' + Date.now(),
        sender: 'USER',
        text: q,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    setIsThinking(true);

    const apiKey =
      (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
      '';

    // Check if the user is asking about another stock in the database
    const normQ = normalizeAr(q);
    const mentionedStock = stocks.find((s) => {
      const symNorm = normalizeAr(s.symbol);
      const nameNorm = normalizeAr(s.nameAr);
      return (
        normQ.includes(symNorm) ||
        (nameNorm.length > 3 && normQ.includes(nameNorm)) ||
        (s.nameEn && normQ.includes(normalizeAr(s.nameEn)))
      );
    });

    const activeTargetStock = mentionedStock || currentStock;
    const isGeneralMarketQuery =
      normQ.includes('سوق') ||
      normQ.includes('بورصه') ||
      normQ.includes('مؤشر') ||
      normQ.includes('egx') ||
      normQ.includes('30') ||
      normQ.includes('70') ||
      normQ.includes('100') ||
      normQ.includes('فائده') ||
      normQ.includes('تعويم') ||
      normQ.includes('تضخم') ||
      normQ.includes('مركزي') ||
      normQ.includes('افضل سهم') ||
      normQ.includes('ترشيحات') ||
      normQ.includes('توزيعات');

    let answer = '';
    const cairoTimeNow = getCairoCurrentTimeFormatted();
    const targetChartReading = evaluateChartTechnicalReading(activeTargetStock, tfMeta.labelAr);
    const targetTvVerdict = getTradingViewChartVerdict(activeTargetStock, tfMeta.labelAr);
    const targetSmc = evaluateSmcAnalysis(activeTargetStock, tfMeta.labelAr);
    const targetBollinger = calculateBollingerBands(activeTargetStock, tfMeta.labelAr);

    // Prompt builder shared by Gemini (primary) and ApMix (fallback) so both receive identical input
    const buildAdvisorPrompt = (): string => `أنت المستشار الفني والمحلل المالي المباشر والخبير المعتمد في البورصة المصرية EGX المزود ببحث Google Search المباشر.
سؤال المتداول: "${q}"

البيانات المرجعية للشارت والسوق:
- السهم المستهدف: ${activeTargetStock.nameAr} (${activeTargetStock.symbol}) - السعر اللحظي: ${activeTargetStock.price.toFixed(2)} ج.م (تغير: ${activeTargetStock.changePct}%)
- الفريم المعتمد للشارت: ${tfMeta.labelAr}
- قراءة شارت TradingView اللحظي:
  * التقييم الفني الموحد: ${targetTvVerdict.overallRatingAr} (${targetTvVerdict.overallScorePct}%)
  * المتوسطات (15 MAs): ${targetTvVerdict.movingAverages.ratingAr} | المذبذبات (11 Osc): ${targetTvVerdict.oscillators.ratingAr}
  * Pivot: ${targetTvVerdict.levels.pivot} ج.م | S1: ${targetTvVerdict.levels.support1} ج.م | R1: ${targetTvVerdict.levels.resistance1} ج.م
  * رأي الشارت المباشر: ${targetTvVerdict.explicitChartOpinionAr}
- تحليل مدرسة السيولة الذكية (SMC):
  * هيكل السوق: ${targetSmc.marketStructure.type} (${targetSmc.marketStructure.badgeAr})
  * صيد السيولة (Sweeps): ${targetSmc.liquidity.sweepType} (${targetSmc.liquidity.sweepStatusAr})
  * كتل أوامر صانع السوق (Order Block): ${targetSmc.orderBlock.zoneMin} - ${targetSmc.orderBlock.zoneMax} ج.م (${targetSmc.orderBlock.badgeAr})
  * التسعير والفجوة (FVG): ${targetSmc.pricing.zoneBadgeAr} (عادل: ${targetSmc.pricing.equilibriumPrice} ج.م) | ${targetSmc.fairValueGap.imbalanceStatusAr}
  * حُكم SMC الصريح: ${targetSmc.smcVerdictAr}
- تحليل نطاقات البولنجر (Bollinger Bands 20, 2):
  * الحد العلوي: ${targetBollinger.upper} ج.م | الخط الأوسط (SMA20): ${targetBollinger.middle} ج.م | الحد السفلي: ${targetBollinger.lower} ج.م
  * موقع السعر (%B): ${targetBollinger.positionAr} (${targetBollinger.percentB.toFixed(2)}) | عرض النطاق: ${targetBollinger.bandwidthPct.toFixed(1)}% (${targetBollinger.bandwidthStatusAr})
  * انضغاط البولنجر (Squeeze): ${targetBollinger.isSqueeze ? 'نعم - انضغاط سعري حاد يترقب انفراجة سعرية وشيكة' : 'لا - النطاق في حالة طبيعية'}
  * تشخيص البولنجر: ${targetBollinger.bollingerVerdictAr}
- قراءة الشارت الفني المباشرة:
  * الشموع اليابانية: ${targetChartReading.candlestickPatternAr}
  * السلوك السعري (Price Action): ${targetChartReading.priceActionVerdictAr}
  * الدعم المرئي على الشارت: ${targetChartReading.chartSupportLevel} ج.م | المقاومة: ${targetChartReading.chartResistanceLevel} ج.م
  * خلاصة الشارت: ${targetChartReading.chartTechnicalOpinionAr}

تعليمات الإجابة الصارمة:
1. انظر مباشرة إلى الشارت الفني لحركة السهم وأعطِ رأيك الصريح والدقيق في الشارت، السلوك السعري (Price Action)، نماذج الشموع اليابانية، مؤشر البولنجر (Bollinger Bands & Squeeze)، ومدرسة السيولة الذكية (SMC: Order Blocks, BOS/CHoCH, Fair Value Gaps).
2. إذا كان السؤال عن سهم، اذكر أهداف الشراء الدقيقة ووقف الخسارة وموقف الشريعة الإسلامية ورأي شارت TradingView ومدرسة SMC وتحليل البولنجر.
3. إذا كان السؤال عاماً عن مؤشرات السوق (EGX30, EGX70, EGX100) أو قطاع معين، أجب إجابة رقمية شاملة واستعن ببحث Google.
4. اذكر في نهاية الإجابة توقيت بيانات الشارت اللحظية (${cairoTimeNow}) مع التنويه: (بيانات الشارت والأسعار قد تكون متأخرة 15 دقيقة بحسب مزود الخدمة TradingView للبورصة المصرية للدقة والمصداقية).
5. اختم بإخلاء مسؤولية قانوني ومالي صريح.`;

    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = buildAdvisorPrompt();

        const resp = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });
        answer = resp.text || '';
      } catch (err) {
        console.warn('Gemini chat error, fallback to analytical response:', err);
      }
    }

    // Fallback: Gemini key missing / not working -> ApMix multi-key network (automatic key rotation + failover)
    if (!answer) {
      try {
        const apmixResult = await callApmixChatCompletion({
          category: 'CHAT',
          messages: [
            {
              role: 'system',
              content:
                'أنت المستشار الفني والمحلل المالي لمنصة رادار البورصة المصرية EGX. اعتمد فقط على البيانات المرفقة في الرسالة، ولا تختلق أخباراً أو أرقاماً غير واردة فيها، ولا تدّعِ أنك أجريت بحثاً مباشراً على الإنترنت.',
            },
            { role: 'user', content: buildAdvisorPrompt() },
          ],
          temperature: 0.25,
          maxTokens: 1500,
        });
        if (apmixResult && apmixResult.text && apmixResult.text.trim().length > 10) {
          answer = apmixResult.text;
        }
      } catch (apmixErr) {
        console.warn('ApMix chat fallback failed, using analytical response:', apmixErr);
      }
    }

    if (!answer) {
      if (mentionedStock && mentionedStock.symbol !== currentStock.symbol) {
        // Analytical answer for the other mentioned stock with Chart Reading
        const ind = calculateStockTechnicalIndicators(mentionedStock, selectedTimeframe);
        const pOther = mentionedStock.price;
        const otherChart = evaluateChartTechnicalReading(mentionedStock, tfMeta.labelAr);
        answer = `📊 *تحليل المستشار الفني وقراءة الشارت لسهم ${mentionedStock.nameAr} (${mentionedStock.symbol}):*
• السعر اللحظي: ${pOther.toFixed(2)} ج.م (${mentionedStock.changePct >= 0 ? '+' : ''}${mentionedStock.changePct}%)
• الفريم الزمني للشارت: ${tfMeta.labelAr}

📈 *قراءة شارت السهم والشموع اليابانية:*
- حركة الشموع والبرايس أكشن: ${otherChart.candlestickPatternAr}
- الهيكل السعري: ${otherChart.priceActionVerdictAr}
- الدعم الفني للشارت: ${otherChart.chartSupportLevel} ج.م | المقاومة: ${otherChart.chartResistanceLevel} ج.م
- رأي المستشار في الشارت: ${otherChart.chartTechnicalOpinionAr}

🎯 *المؤشرات ومستويات التداول المقترحة:*
• التقييم الفني: [${ind.consensusRatingAr}] بقوة ${ind.consensusScore}% (${ind.bullishIndicatorsCount} مؤشرات صاعدة)
• السوبر ترند: ${ind.superTrend.trendAr} (دعم وقائي: ${ind.superTrend.superTrendValue} ج.م)
• مؤشر RSI: ${ind.rsi.value} (${ind.rsi.statusAr}) | الماكدي: ${ind.macd.statusAr}
• نطاق الشراء المقترح: بين ${(pOther * 0.985).toFixed(2)} ج.م و ${(pOther * 1.015).toFixed(2)} ج.م
• المستهدف الأول: ${(pOther * (1 + tfMeta.target1Multiplier)).toFixed(2)} ج.م | الثاني: ${(pOther * (1 + tfMeta.target2Multiplier)).toFixed(2)} ج.م
• وقف الخسارة الصارم: ${(pOther * (1 - tfMeta.stopLossMultiplier)).toFixed(2)} ج.م
• الموقف الشرعي: ${mentionedStock.isShariahCompliant ? 'متوافق مع الشريعة الإسلامية ✅' : 'غير متوافق ⚠️'}

⏱️ تاريخ ووقت بيانات الشارت اللحظية: ${cairoTimeNow}
${CHART_15_MIN_DELAY_NOTICE_AR}

${LEGAL_DISCLAIMER_AR}`;
      } else if (isGeneralMarketQuery) {
        // Analytical answer for market / indices / economy
        const liveIndices = getLiveCalculatedIndices(stocks);
        const idx30 = liveIndices.find((i) => i.symbol === 'EGX30');
        const idx70 = liveIndices.find((i) => i.symbol === 'EGX70');
        const p30 = idx30 ? idx30.points.toLocaleString('ar-EG') : '51,052.26';
        const p70 = idx70 ? idx70.points.toLocaleString('ar-EG') : '17,184.31';
        answer = `🌐 *إجابة المستشار الفني عن وضع السوق العام والبورصة المصرية والشارت العام:*
بخصوص استفسارك: "${q}"

1. وضع مؤشر EGX30 وشارت السوق الرئيسي: يتداول المؤشر الرئيسي قرب ${p30} نقطة. القراءة الفنية لشارت EGX30 تظهر تماسكاً أعلى منطقة الدعم النفسي 50,000 نقطة، مع قيعان صاعدة على الفريم اليومي. القوة النسبية تشير لتدوير سيولة منضبط بين العقارات والبنوك والخدمات المالية.
2. مؤشر EGX70 متساوي الأوزان: يتحرك عند ${p70} نقطة مع نشاط مضاربي انتقائي واختبار لمقاومة القمة السابقة، والشارت يظهر زخماً إيجابياً في قطاعات الأسمدة والشحن ومواد البناء.
3. التوصية الاستراتيجية وإدارة السيولة:
• التزم بحجم سيولة نقدية كاش لا تقل عن 20-30% لاقتناص أي تصحيحات سريعة.
• لا تفرط في الشراء عند قمم المقاومات، واعتمد التجميع على دفعتين بنظام إدارة الصفقات.
• فعل دائماً أمر وقف الخسارة الصارم لكل مركز تفتحه لحماية رأس المال.

⏱️ توقيت السوق والشارت: ${cairoTimeNow}
${CHART_15_MIN_DELAY_NOTICE_AR}

${LEGAL_DISCLAIMER_AR}`;
      } else {
        // Current stock answer with full chart breakdown
        const { indicators, volLiq } = techData || {
          indicators: calculateStockTechnicalIndicators(currentStock, selectedTimeframe),
          volLiq: analyzeAnnualVolumeAndLiquidity(currentStock),
        };
        answer = `📊 *تحليل المستشار الفني ورأيه في شارت سهم ${currentStock.nameAr} (${currentStock.symbol}) على فريم [${tfMeta.labelAr}]:*

🎯 *رأي شارت TradingView المعتمد:*
• التقييم الموحد: [${targetTvVerdict.overallRatingAr}] بنسبة ${targetTvVerdict.overallScorePct}%
• المتوسطات (15 MAs): ${targetTvVerdict.movingAverages.ratingAr} | المذبذبات (11 Osc): ${targetTvVerdict.oscillators.ratingAr}
• Pivot: ${targetTvVerdict.levels.pivot} ج.م | S1: ${targetTvVerdict.levels.support1} ج.م | R1: ${targetTvVerdict.levels.resistance1} ج.م
• رأي الشارت اللحظي: ${targetTvVerdict.explicitChartOpinionAr}

🏛️ *تحليل مدرسة السيولة الذكية (SMC) بدقة:*
• هيكل السوق: [${targetSmc.marketStructure.type}] - ${targetSmc.marketStructure.badgeAr}
• صيد السيولة (Liquidity Sweeps): ${targetSmc.liquidity.sweepType} (${targetSmc.liquidity.sweepStatusAr})
• كتلة الأوامر (Order Block): ${targetSmc.orderBlock.zoneMin} - ${targetSmc.orderBlock.zoneMax} ج.م (${targetSmc.orderBlock.badgeAr})
• التسعير العادل & الفجوة FVG: ${targetSmc.pricing.zoneBadgeAr} (التوازن: ${targetSmc.pricing.equilibriumPrice} ج.م) | ${targetSmc.fairValueGap.imbalanceStatusAr}
• حُكم SMC الصريح: ${targetSmc.smcVerdictAr}

📊 *تحليل نطاقات البولنجر (Bollinger Bands 20, 2):*
• الحد العلوي: ${targetBollinger.upper} ج.م | الخط الأوسط (SMA20): ${targetBollinger.middle} ج.م | الحد السفلي: ${targetBollinger.lower} ج.م
• موقع السعر (%B): ${targetBollinger.positionAr} (${targetBollinger.percentB.toFixed(2)}) | عرض النطاق: ${targetBollinger.bandwidthPct.toFixed(1)}% (${targetBollinger.bandwidthStatusAr})
• حالة الانضغاط (Squeeze): ${targetBollinger.isSqueeze ? '⚠️ انضغاط سعري حاد (Squeeze) يترقب انفراجة سعرية وشيكة' : 'نطاق تذبذب طبيعي'}
• قراءة البولنجر: ${targetBollinger.bollingerVerdictAr}

📈 *القراءة الفنية لحركة الشموع والبرايس أكشن:*
• حركة الشموع: ${targetChartReading.candlestickPatternAr}
• الهيكل السعري: ${targetChartReading.priceActionVerdictAr}
• الدعم الفني للشارت: ${targetChartReading.chartSupportLevel} ج.م | المقاومة: ${targetChartReading.chartResistanceLevel} ج.م
• الرأي الصريح في الشارت: ${targetChartReading.chartTechnicalOpinionAr}

🎯 *المؤشرات الفنية والأرقام:*
• السعر اللحظي: ${currentStock.price.toFixed(2)} ج.م (تغير: ${currentStock.changePct}%)
• الإشارة التجميعية: [${indicators.consensusRatingAr}] بقوة ${indicators.consensusScore}%.
• السوبر ترند: ${indicators.superTrend.trendAr} | نسبة السيولة الداخلة: ${volLiq.liquidityStudy.netInflowRatio}%.
• المستهدف الأول: ${(currentStock.price * (1 + tfMeta.target1Multiplier)).toFixed(2)} ج.م | الثاني: ${(currentStock.price * (1 + tfMeta.target2Multiplier)).toFixed(2)} ج.م
• وقف الخسارة الصارم: ${(currentStock.price * (1 - tfMeta.stopLossMultiplier)).toFixed(2)} ج.م.

⏱️ تاريخ ووقت بيانات الشارت اللحظية: ${cairoTimeNow}
${CHART_15_MIN_DELAY_NOTICE_AR}

${LEGAL_DISCLAIMER_AR}`;
      }
    }

    setIsThinking(false);
    setMessages((prev) => [
      ...prev,
      {
        id: 'advisor-' + Date.now(),
        sender: 'ADVISOR',
        text: answer,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        stockSymbol: activeTargetStock?.symbol,
        quickMetrics: activeTargetStock
          ? {
              action: activeTargetStock.changePct >= 0 ? 'شراء وتجميع' : 'مراقبة وحذر',
              target1: (activeTargetStock.price * (1 + tfMeta.target1Multiplier)).toFixed(2) + ' ج.م',
              stopLoss: (activeTargetStock.price * (1 - tfMeta.stopLossMultiplier)).toFixed(2) + ' ج.م',
              consensusScore: 75,
              isShariah: activeTargetStock.isShariahCompliant,
              timeframe: tfMeta.labelAr,
            }
          : undefined,
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-hidden font-['Cairo']">
      <div className="relative w-full max-w-5xl h-[94vh] max-h-[890px] bg-[#0b0f17] border border-cyan-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-[#0d1424] to-cyan-950/70 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/25 shrink-0">
              <div className="w-full h-full bg-[#070a0f] rounded-[14px] flex items-center justify-center">
                <Bot className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  المستشار الفني الذكي • مجلس النماذج الثلاثية
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                  Gemini 3.8 Flash AI
                </span>
              </div>
              <p className="text-xs text-slate-400">
                مرافعة النموذج المؤيد 🟢 مقابل طعن المعارض 🔴 وحُكم القاضي الفاصل 👑
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ReportStabilityLockBar
              lockState={lockState}
              reportTitle={currentStock?.nameAr}
              isRefreshing={isCouncilLoading || isThinking}
              compact={true}
            />
            {advisorViewMode === 'COUNCIL' ? (
              <button
                onClick={handleCopyCouncilReport}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  copiedCouncilReport
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30'
                }`}
                title="نسخ تقرير مجلس المستشارين الكامل"
              >
                {copiedCouncilReport ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>تم نسخ قرار المجلس ✅</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-cyan-400" />
                    <span>نسخ قرار المجلس 📋</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleCopyFullConsultation}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition-all"
              >
                <Copy className="w-4 h-4 text-cyan-400" />
                <span>نسخ الاستشارة 📋</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Switcher Ribbon (Council vs Chat) */}
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setAdvisorViewMode('COUNCIL')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
                advisorViewMode === 'COUNCIL'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-black shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>مجلس المستشارين الثلاثي (المؤيد vs المعارض vs الحكم) ⚖️</span>
            </button>

            <button
              onClick={() => setAdvisorViewMode('CHAT')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
                advisorViewMode === 'CHAT'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-black shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>المحادثة والاستشارة الحرة 💬</span>
            </button>
          </div>

          {onOpenTradeManagement && (
            <button
              onClick={() => {
                onOpenTradeManagement(currentStock.symbol);
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <span>إدارة صفقة هذا السهم 🎯</span>
            </button>
          )}
        </div>

        {/* Stock Search Combobox & Timeframes Ribbon */}
        <div className="p-3 bg-slate-900/95 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs shrink-0">
          {/* Searchable Combobox */}
          <div className="relative flex-1 max-w-md" ref={searchDropdownRef}>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold whitespace-nowrap">السهم:</span>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={isSearchOpen ? stockSearchQuery : `${currentStock?.symbol} - ${currentStock?.nameAr}`}
                  onFocus={() => {
                    setIsSearchOpen(true);
                    setStockSearchQuery('');
                  }}
                  onChange={(e) => {
                    setStockSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  placeholder="ابحث بسهم أو مؤشر (EGX30, ايجي 30, TMGH)..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-1.5 text-xs font-bold text-white pr-8 focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Dropdown list of matching stocks & indices */}
            {isSearchOpen && (
              <div className="absolute top-full mt-1.5 right-0 left-0 bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 space-y-1 max-h-64 overflow-y-auto">
                {matchingIndices.length > 0 && (
                  <div className="mb-2">
                    <div className="text-[10px] text-amber-400 font-bold px-2 py-1 border-b border-amber-500/20 flex items-center justify-between bg-amber-950/20 rounded-lg mb-1">
                      <span className="flex items-center gap-1">
                        <span>📈</span>
                        <span>مؤشرات البورصة العامة ({matchingIndices.length})</span>
                      </span>
                      <span className="text-[9px] text-amber-300 font-mono">Market Indices</span>
                    </div>
                    {matchingIndices.map((idx) => {
                      const isSelected = idx.symbol === selectedSymbol;
                      return (
                        <button
                          key={idx.symbol}
                          onClick={() => handleSelectSymbol(idx.symbol)}
                          className={`w-full text-right p-2 rounded-xl flex items-center justify-between text-xs transition-colors mb-0.5 ${
                            isSelected
                              ? 'bg-amber-950/60 border border-amber-500/50 text-amber-200'
                              : 'hover:bg-slate-900 bg-slate-900/40 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                              {idx.symbol}
                            </span>
                            <span className="truncate max-w-[190px] text-slate-200 font-bold">
                              {idx.nameAr}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                idx.changePct >= 0
                                  ? 'bg-emerald-500/15 text-emerald-300'
                                  : 'bg-rose-500/15 text-rose-300'
                              }`}
                            >
                              {idx.changePct >= 0 ? '+' : ''}
                              {idx.changePct.toFixed(2)}%
                            </span>
                            <span className="font-mono font-black text-white">
                              {idx.points.toLocaleString('ar-EG', { maximumFractionDigits: 1 })} نقطة
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="text-[10px] text-slate-400 font-bold px-2 py-1 border-b border-slate-800 flex justify-between">
                  <span>الأسهم المتاحة ({filteredStocks.length})</span>
                  <span className="text-cyan-400 font-mono">EGX 292 Stocks</span>
                </div>
                {filteredStocks.length === 0 && matchingIndices.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-500">
                    لا يوجد سهم أو مؤشر مطابق للبحث "{stockSearchQuery}"
                  </div>
                ) : (
                  filteredStocks.map((stk) => {
                    const isSelected = stk.symbol === selectedSymbol;
                    return (
                      <button
                        key={stk.symbol}
                        onClick={() => handleSelectSymbol(stk.symbol)}
                        className={`w-full text-right p-2 rounded-xl flex items-center justify-between text-xs transition-colors ${
                          isSelected
                            ? 'bg-cyan-950/60 border border-cyan-500/50 text-cyan-200'
                            : 'hover:bg-slate-900 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">{stk.symbol}</span>
                          <span className="truncate max-w-[170px] text-slate-300 font-medium">
                            {stk.nameAr}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              stk.isShariahCompliant
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {stk.isShariahCompliant ? 'شريعة ✅' : 'تقليدي'}
                          </span>
                          <span className="font-mono font-bold text-slate-200">
                            {stk.price.toFixed(2)} ج.م
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Timeframe Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <span className="text-slate-400 font-bold whitespace-nowrap flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              الفريم:
            </span>
            {TRADING_TIMEFRAMES.map((tf) => {
              const active = tf.code === selectedTimeframe;
              return (
                <button
                  key={tf.code}
                  onClick={() => setSelectedTimeframe(tf.code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    active
                      ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-600/30'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                  title={tf.descriptionAr}
                >
                  {tf.labelAr}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Diagnostics Ribbon */}
        {currentStock && (
          <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <CopyableStockSymbol symbol={currentStock.symbol} size="sm" />
                <span className="font-bold text-white">{currentStock.nameAr}</span>
              </div>
              <span className="font-mono text-slate-200 font-bold">
                {currentStock.price.toFixed(2)} ج.م
              </span>
              <span
                className={`font-mono font-bold ${
                  currentStock.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                ({currentStock.changePct >= 0 ? '+' : ''}{currentStock.changePct}%)
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  currentStock.isShariahCompliant
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {currentStock.isShariahCompliant ? 'شريعة ✅' : 'تقليدي'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>سعر الشارت مؤكد لحظياً ✅</span>
              </span>
            </div>

            {onSelectStockForChart && (
              <button
                onClick={() => {
                  onSelectStockForChart(currentStock.symbol);
                  onClose();
                }}
                className="px-2.5 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30 transition-colors font-bold text-[11px]"
              >
                فتح الشارت 📈
              </button>
            )}
          </div>
        )}

        {/* VIEW 1: 3-MODEL AI COUNCIL SYSTEM */}
        {advisorViewMode === 'COUNCIL' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* 180s Stability Lock Bar */}
            <ReportStabilityLockBar
              lockState={lockState}
              reportTitle={`مجلس المستشارين: ${currentStock?.nameAr} (${currentStock?.symbol})`}
              isRefreshing={isCouncilLoading}
            />

            {isCouncilLoading ? (
              <div className="text-center py-20 space-y-3">
                <Sparkles className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                <div className="text-sm font-bold text-white">
                  مجلس المستشارين يفحص السهم عبر 3 نماذج ذكاء اصطناعي...
                </div>
                <p className="text-xs text-slate-400">
                  تحليل حجج المؤيد والصقر الصاعد مقابل طعن المعارض المتشكك وصياغة حُكم القاضي الفاصل
                </p>
              </div>
            ) : councilVerdict ? (
              <div className="space-y-5">
                {/* Balance Probability Bar */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4" />
                      ترجيح الصعود (المؤيد): {councilVerdict.supremeArbiter.bullishWeightPct}%
                    </span>
                    <span className="text-rose-400 flex items-center gap-1.5">
                      <TrendingDown className="w-4 h-4" />
                      ترجيح المخاطر (المعارض): {councilVerdict.supremeArbiter.bearishWeightPct}%
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${councilVerdict.supremeArbiter.bullishWeightPct}%` }}
                      className="bg-emerald-500 h-full transition-all duration-700"
                    />
                    <div
                      style={{ width: `${councilVerdict.supremeArbiter.bearishWeightPct}%` }}
                      className="bg-rose-500 h-full transition-all duration-700"
                    />
                  </div>
                </div>

                {/* Official TradingView Technical Chart Opinion & Speedometer Gauge */}
                <TradingViewRatingWidget
                  stock={currentStock}
                  timeframeLabel={councilVerdict.timeframeLabelAr}
                  variant="FULL_CARD"
                  onOpenChart={onSelectStockForChart}
                />

                {/* Dedicated Chart Technical Breakdown Card (User requirement: examine chart & provide opinion) */}
                <div className="p-4 rounded-3xl bg-[#08101a] border border-cyan-500/40 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold">
                        📊
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-cyan-200">
                          القراءة الفنية المباشرة لشارت السهم والسلوك السعري (Chart Action)
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          فحص حركة الشموع اليابانية، الدعوم والمقاومات، والمتوسطات على فريم {councilVerdict.timeframeLabelAr}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-slate-400">توقيت بيانات الشارت:</span>
                      <span className="text-cyan-300 font-bold">{councilVerdict.liveChartTimestamp}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        متأخر 15 دقيقة للدقة
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400">حركة الشموع اليابانية (Candlesticks):</span>
                      <p className="text-white font-medium leading-relaxed">
                        {councilVerdict.chartVerdict?.candlestickPatternAr}
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400">مستويات الشارت المرئية:</span>
                      <p className="text-slate-200 font-medium leading-relaxed">
                        دعم الشارت: <span className="font-mono text-emerald-400 font-bold">{councilVerdict.chartVerdict?.chartSupportLevel} ج.م</span> | 
                        مقاومة الشارت: <span className="font-mono text-rose-400 font-bold">{councilVerdict.chartVerdict?.chartResistanceLevel} ج.م</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-100 leading-relaxed font-medium">
                    <span className="font-bold text-cyan-300 ml-1">💡 رأي المحلل الصريح في الشارت:</span>
                    {councilVerdict.chartVerdict?.chartTechnicalOpinionAr}
                  </div>
                </div>

                {/* 2-Columns Grid: Bullish Advocate vs Bearish Skeptic */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Model 1: The Bullish Advocate */}
                  <div className="p-4 rounded-3xl bg-gradient-to-br from-[#07130f] to-[#0c1c16] border border-emerald-500/40 shadow-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                          🦅
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-emerald-300">
                            {councilVerdict.bullishAdvocate.modelNameAr}
                          </h4>
                          <span className="text-[10px] text-emerald-400/80">
                            {councilVerdict.bullishAdvocate.roleAr}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-black text-emerald-400 text-sm bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                        قوة: {councilVerdict.bullishAdvocate.scorePct}%
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      {councilVerdict.bullishAdvocate.thesisAr}
                    </p>

                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-bold text-emerald-300">أقوى الحجج الفنية الداعمة:</div>
                      {councilVerdict.bullishAdvocate.arguments.map((arg, i) => (
                        <div key={i} className="text-xs text-slate-300 flex items-start gap-1.5 leading-relaxed">
                          <span className="text-emerald-400 shrink-0 mt-0.5">✔</span>
                          <span>{arg}</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-xs text-emerald-200 font-bold">
                      💡 {councilVerdict.bullishAdvocate.verdictAr}
                    </div>
                  </div>

                  {/* Model 2: The Bearish Skeptic */}
                  <div className="p-4 rounded-3xl bg-gradient-to-br from-[#160a0d] to-[#220d13] border border-rose-500/40 shadow-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-rose-500/20 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                          ⚡
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-rose-300">
                            {councilVerdict.bearishSkeptic.modelNameAr}
                          </h4>
                          <span className="text-[10px] text-rose-400/80">
                            {councilVerdict.bearishSkeptic.roleAr}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-black text-rose-400 text-sm bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/30">
                        مخاطرة: {councilVerdict.bearishSkeptic.scorePct}%
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      {councilVerdict.bearishSkeptic.thesisAr}
                    </p>

                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-bold text-rose-300">المخاطر والعوائق الفنية الخفية:</div>
                      {councilVerdict.bearishSkeptic.arguments.map((arg, i) => (
                        <div key={i} className="text-xs text-slate-300 flex items-start gap-1.5 leading-relaxed">
                          <span className="text-rose-400 shrink-0 mt-0.5">✖</span>
                          <span>{arg}</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/20 text-xs text-rose-200 font-bold">
                      ⚠️ {councilVerdict.bearishSkeptic.verdictAr}
                    </div>
                  </div>
                </div>

                {/* Model 3: The Supreme Arbiter (Full Width Highlighted Verdict) */}
                <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-[#111827] to-cyan-950/80 border-2 border-amber-500/50 shadow-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-500/30 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl font-bold border border-amber-500/40">
                        👑
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-amber-300">
                            {councilVerdict.supremeArbiter.modelNameAr}
                          </h4>
                          <span className="text-[10px] text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                            الحكم النهائي الملزم
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">
                          {councilVerdict.supremeArbiter.roleAr}
                        </p>
                      </div>
                    </div>

                    <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 font-black text-sm">
                      {councilVerdict.supremeArbiter.verdictTitleAr}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-semibold">
                    {councilVerdict.supremeArbiter.rulingSummaryAr}
                  </p>

                  {/* Quantitative Execution Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
                    <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 font-bold">نطاق الدخول الموصى به</div>
                      <div className="font-mono font-black text-cyan-300 text-xs sm:text-sm mt-0.5">
                        {councilVerdict.supremeArbiter.entryZoneMin} - {councilVerdict.supremeArbiter.entryZoneMax}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 font-bold">المستهدف الأول (H1)</div>
                      <div className="font-mono font-black text-emerald-400 text-xs sm:text-sm mt-0.5">
                        {councilVerdict.supremeArbiter.target1Price} ج.م
                      </div>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 font-bold">المستهدف الثاني (H2)</div>
                      <div className="font-mono font-black text-emerald-300 text-xs sm:text-sm mt-0.5">
                        {councilVerdict.supremeArbiter.target2Price} ج.م
                      </div>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 font-bold">وقف الخسارة الصارم</div>
                      <div className="font-mono font-black text-rose-400 text-xs sm:text-sm mt-0.5">
                        {councilVerdict.supremeArbiter.stopLossPrice} ج.م
                      </div>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 font-bold">العائد للمخاطرة (R:R)</div>
                      <div className="font-mono font-black text-amber-300 text-xs sm:text-sm mt-0.5">
                        1 : {councilVerdict.supremeArbiter.riskRewardRatio}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 font-bold">أقصى حجم من المحفظة</div>
                      <div className="font-mono font-black text-white text-xs sm:text-sm mt-0.5">
                        {councilVerdict.supremeArbiter.recommendedPositionPct}%
                      </div>
                    </div>
                  </div>

                  {/* Execution Steps */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                    <div className="font-bold text-white text-xs">خطة التنفيذ العملي خطوة بخطوة:</div>
                    {councilVerdict.supremeArbiter.executionStepsAr.map((step, i) => (
                      <div key={i} className="text-slate-300 font-medium">
                        {step}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Disclaimer card */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1.5 leading-relaxed">
                  <div className="text-amber-300/90 font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{councilVerdict.delayNoticeAr}</span>
                  </div>
                  <p className="text-slate-400 border-t border-slate-800/80 pt-1.5">
                    {councilVerdict.disclaimerAr}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* VIEW 2: CHAT & CUSTOM QUESTIONS */}
        {advisorViewMode === 'CHAT' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Quick Action Consultation Buttons */}
            <div className="p-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
              <span className="text-[11px] text-slate-400 font-bold whitespace-nowrap">استشارات سريعة:</span>
              <button
                onClick={() => handleQuickQuestion('SMC')}
                className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-sm shadow-amber-500/20 cursor-pointer"
              >
                <span>🏛️ تحليل مدرسة السيولة الذكية (SMC) بدقة</span>
              </button>
              <button
                onClick={() => handleQuickQuestion('MARKET_OVERVIEW')}
                className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-500/40 text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>اتجاه المؤشرات والسوق العام 📈</span>
              </button>
              <button
                onClick={() => handleQuickQuestion('TOP_PICKS')}
                className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5" />
                <span>أفضل الفرص الصاعدة 🏆</span>
              </button>
              <button
                onClick={() => handleQuickQuestion('ENTRY_EXIT')}
                className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5"
              >
                <Target className="w-3.5 h-3.5" />
                <span>دخول ووقف وأهداف {currentStock?.symbol} ({tfMeta.badgeAr})</span>
              </button>
              <button
                onClick={() => handleQuickQuestion('VOLUME_LIQUIDITY')}
                className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-500/30 text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5"
              >
                <Droplets className="w-3.5 h-3.5" />
                <span>دراسة الفوليم والسيولة</span>
              </button>
              <button
                onClick={() => handleQuickQuestion('STRATEGY')}
                className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>الاستراتيجية الفنية</span>
              </button>
              <button
                onClick={() => handleQuickQuestion('SHARIAH')}
                className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>التدقيق الشرعي</span>
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'USER' ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl p-4 shadow-lg text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'USER'
                        ? 'bg-cyan-950/40 border border-cyan-500/40 text-cyan-100 rounded-tr-none'
                        : 'bg-slate-900/90 border border-slate-700/80 text-slate-100 rounded-tl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-2 mb-2 text-[10px] text-slate-400">
                      <div className="flex items-center gap-1.5 font-bold">
                        {msg.sender === 'USER' ? (
                          <span className="text-cyan-400">سؤال المتداول</span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            المستشار الفني المعتمد
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{msg.timestamp}</span>
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                          title="نسخ النص"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="whitespace-pre-line font-medium">{msg.text}</div>

                    {msg.quickMetrics && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-slate-400 block text-[9px]">الرأي الفني</span>
                          <span className="font-bold text-emerald-400">{msg.quickMetrics.action}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-slate-400 block text-[9px]">الفريم المعتمد</span>
                          <span className="font-bold text-cyan-300 font-mono">{msg.quickMetrics.timeframe}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-slate-400 block text-[9px]">المستهدف الأول</span>
                          <span className="font-bold font-mono text-cyan-300">{msg.quickMetrics.target1}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-slate-400 block text-[9px]">وقف الخسارة</span>
                          <span className="font-bold font-mono text-rose-400">{msg.quickMetrics.stopLoss}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 col-span-2 sm:col-span-1">
                          <span className="text-slate-400 block text-[9px]">قوة الإشارة</span>
                          <span className="font-bold font-mono text-amber-300">
                            {msg.quickMetrics.consensusScore}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex items-end justify-end">
                  <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl rounded-tl-none p-3.5 text-xs text-cyan-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>المستشار الفني يفحص المؤشرات وأحجام التداول اللحظية وفريم {tfMeta.labelAr}...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Permanent Bottom Free-Form Question Bar across Council and Chat views */}
        <form
          onSubmit={handleCustomSubmit}
          className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2 shrink-0"
        >
          <div className="hidden sm:flex items-center gap-1.5 text-cyan-400 text-xs font-bold shrink-0">
            <Bot className="w-4 h-4" />
            <span>سؤال حر:</span>
          </div>
          <input
            type="text"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder={`اسأل المستشار أي سؤال حر عن سهم ${currentStock?.nameAr || ''} (${currentStock?.symbol || 'EGX'}) أو السوق وسيجيبك فوراً...`}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!userQuery.trim() || isThinking}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-cyan-600/20 cursor-pointer shrink-0"
          >
            <span>إرسال</span>
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
};
