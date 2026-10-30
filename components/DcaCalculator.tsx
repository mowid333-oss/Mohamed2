import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Target,
  Info,
  TrendingDown,
  TrendingUp,
  Sparkles,
  ShieldAlert,
  Coins,
  Scale,
  RotateCcw,
  Layers,
  ArrowRight,
  Sliders,
  DollarSign,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  ShieldCheck,
  Copy,
  Check,
  Zap,
  ArrowUpRight,
  PieChart,
} from 'lucide-react';
import { EGXStock } from '../types/stock';
import { getLiveEgyptGoldSnapshot, EgyptGoldMarketSnapshot } from '../services/goldPriceService';

interface DcaCalculatorProps {
  stocks: EGXStock[];
  selectedSymbol: string;
  onSelectStock: (symbol: string) => void;
}

/**
 * Normalizes user input supporting both Western (0-9) and Eastern Arabic (٠-٩) numerals
 * and decimal points (. or ، or ٫), while keeping empty strings and trailing decimals untouched.
 */
function normalizeNumericInput(value: string): string {
  if (!value) return '';
  // Convert Eastern Arabic numerals (٠-٩) to Western (0-9)
  let normalized = value.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
  // Convert Arabic comma or Persian decimal mark to standard dot
  normalized = normalized.replace(/[،,٫]/g, '.');
  // Remove any character that is not a digit or a period
  normalized = normalized.replace(/[^0-9.]/g, '');
  // Keep only the first period if multiple exist
  const parts = normalized.split('.');
  if (parts.length > 2) {
    normalized = parts[0] + '.' + parts.slice(1).join('');
  }
  return normalized;
}

export const DcaCalculator: React.FC<DcaCalculatorProps> = ({
  stocks,
  selectedSymbol,
  onSelectStock,
}) => {
  // Asset Type: 'STOCKS' (EGX) or 'GOLD' (الذهب والسبائك)
  const [assetType, setAssetType] = useState<'STOCKS' | 'GOLD'>('STOCKS');

  // Gold selection
  const [goldSnapshot] = useState<EgyptGoldMarketSnapshot>(() => getLiveEgyptGoldSnapshot());
  const [selectedGoldCaliber, setSelectedGoldCaliber] = useState<'21' | '24' | '18' | 'POUND' | 'BTC_BAR'>('21');

  // Active Stock
  const stock = stocks.find((s) => s.symbol === selectedSymbol) || stocks[0] || {
    symbol: 'TMGH',
    nameAr: 'مجموعة طلعت مصطفى',
    price: 60.5,
    low: 58.0,
    high: 62.0,
    rsi14: 42,
  };

  // Determine current asset market price & title
  const currentAssetPrice = useMemo(() => {
    if (assetType === 'STOCKS') {
      return stock?.price || 50;
    }
    switch (selectedGoldCaliber) {
      case '24':
        return goldSnapshot.gold24k.sellPriceEgp;
      case '18':
        return goldSnapshot.gold18k.sellPriceEgp;
      case 'POUND':
        return goldSnapshot.goldPound.sellPriceEgp;
      case 'BTC_BAR':
        return goldSnapshot.gold24k.sellPriceEgp;
      case '21':
      default:
        return goldSnapshot.gold21k.sellPriceEgp;
    }
  }, [assetType, stock?.price, selectedGoldCaliber, goldSnapshot]);

  const assetUnitName = useMemo(() => {
    if (assetType === 'STOCKS') return 'سهم';
    if (selectedGoldCaliber === 'POUND') return 'جنيه ذهب';
    return 'جرام';
  }, [assetType, selectedGoldCaliber]);

  // Operational DCA Modes:
  // 1: 'OPTIMIZER' -> Smart Liquidity Optimizer (اقتراح أفضل أماكن وكميات التبريد بناءً على السيولة المتاحة)
  // 2: 'DIRECT' -> Direct Quantity / Amount DCA (تبريد بالكمية المستهدفة)
  // 3: 'SOLVER' -> Target Average Solver (حاسبة الوصول لمتوسط مستهدف)
  // 4: 'LADDER' -> Smart Ladder / Martingale DCA (استراتيجية التبريد المتدرج الهرمي)
  const [activeDcaMode, setActiveDcaMode] = useState<'OPTIMIZER' | 'DIRECT' | 'SOLVER' | 'LADDER'>('OPTIMIZER');

  // User's Available Liquidity Input (ج.م)
  const [availableLiquidityStr, setAvailableLiquidityStr] = useState<string>('50000');

  // Optimization Strategy Profile
  const [strategyProfile, setStrategyProfile] = useState<'BALANCED' | 'AGGRESSIVE' | 'CONSERVATIVE'>('BALANCED');

  // String-based input states to ensure manual typing NEVER glitches or refuses input
  const [originalPriceStr, setOriginalPriceStr] = useState<string>(() =>
    (currentAssetPrice * 1.18).toFixed(2)
  );
  const [originalQtyStr, setOriginalQtyStr] = useState<string>('1000');
  const [targetBuyPriceStr, setTargetBuyPriceStr] = useState<string>(() =>
    (currentAssetPrice * 0.98).toFixed(2)
  );
  const [newQtyToAddStr, setNewQtyToAddStr] = useState<string>('1000');

  // Solver Mode Input: Desired Target Average
  const [desiredAverageStr, setDesiredAverageStr] = useState<string>(() =>
    (currentAssetPrice * 1.05).toFixed(2)
  );

  // Ladder Mode Input: Total Available DCA Budget (ج.م)
  const [ladderBudgetStr, setLadderBudgetStr] = useState<string>('50000');

  // Stock Search / Quick Filter
  const [stockSearchQuery, setStockSearchQuery] = useState<string>('');
  const [copiedPlan, setCopiedPlan] = useState(false);

  // Synchronize initial prices when stock changes (only if user explicitly clicks or when symbol changes first time)
  const handleSyncWithCurrentMarket = () => {
    setOriginalPriceStr((currentAssetPrice * 1.20).toFixed(2));
    setTargetBuyPriceStr(currentAssetPrice.toFixed(2));
    setDesiredAverageStr((currentAssetPrice * 1.08).toFixed(2));
  };

  // Parsed derived numeric values
  const originalPrice = parseFloat(originalPriceStr) || 0;
  const originalQty = parseFloat(originalQtyStr) || 0;
  const targetBuyPrice = parseFloat(targetBuyPriceStr) || 0;
  const newQtyToAdd = parseFloat(newQtyToAddStr) || 0;
  const desiredAverage = parseFloat(desiredAverageStr) || 0;
  const ladderBudget = parseFloat(ladderBudgetStr) || 0;
  const availableLiquidity = parseFloat(availableLiquidityStr) || 0;

  // Technical Levels Calculation for the active stock
  const technicalLevels = useMemo(() => {
    const p = currentAssetPrice;
    const low = (stock as any)?.low || p * 0.96;
    const high = (stock as any)?.high || p * 1.04;
    const s1 = Number((p * 0.96).toFixed(2));
    const s2 = Number((p * 0.915).toFixed(2)); // Fibonacci 61.8% region
    const s3 = Number((p * 0.86).toFixed(2)); // Deep Support 78.6%
    const r1 = Number((p * 1.12).toFixed(2)); // Resistance 1 / Take Profit 1
    const r2 = Number((Math.max(p * 1.22, originalPrice || p * 1.22)).toFixed(2)); // Resistance 2 / Take Profit 2
    const stopLoss = Number((s2 * 0.95).toFixed(2)); // 5% below S2
    const rsi = (stock as any)?.rsi14 || 44;

    let dcaVerdict: {
      type: 'BULLISH' | 'NEUTRAL' | 'CAUTION';
      title: string;
      desc: string;
    };

    if (rsi < 35 || p <= s1) {
      dcaVerdict = {
        type: 'BULLISH',
        title: 'منطقة تبريد فنية مثالية (Prime DCA Zone)',
        desc: `السهم في منطقة ذروة بيع (RSI: ${rsi.toFixed(0)}) وقريب من مستوى الدعم الأول S1 (${s1} ج.م). التبريد هنا يتميز بفرصة ارتداد مرتفعة ومخاطرة منخفضة.`,
      };
    } else if (rsi > 60) {
      dcaVerdict = {
        type: 'CAUTION',
        title: 'تريث! السهم في منطقة شراء مفرط',
        desc: `مؤشر القوة النسبية RSI عند ${rsi.toFixed(0)}. يفضل عدم التبريد في القمم والانتظار حتى يصحح السعر نحو مستويات الدعم (${s1} ج.م) لحماية السيولة.`,
      };
    } else {
      dcaVerdict = {
        type: 'NEUTRAL',
        title: 'تبريد مشروط بتأكيد الارتداد (Conditional DCA)',
        desc: `السهم في مرحلة تذبذب عرضي. يُنصح بتجزئة التبريد على دفعتين؛ الأولى عند ${s1} ج.م والثانية عند الدعم الأقوى ${s2} ج.م مع مراقبة السيولة.`,
      };
    }

    return { s1, s2, s3, r1, r2, stopLoss, low, high, rsi, dcaVerdict };
  }, [currentAssetPrice, stock, originalPrice]);

  // =========================================================================
  // AI & TECHNICAL LIQUIDITY OPTIMIZER (المستشار الذكي ومحسن التبريد بناءً على السيولة)
  // =========================================================================
  const liquidityPlan = useMemo(() => {
    const liquidity = availableLiquidity > 0 ? availableLiquidity : 50000;
    const p0 = originalPrice > 0 ? originalPrice : currentAssetPrice * 1.15;
    const q0 = originalQty > 0 ? originalQty : 1000;
    const originalCost = p0 * q0;

    // Split parameters based on strategy profile
    let stationSharesRatio: { s1Pct: number; s2Pct: number; s3Pct: number; reservePct: number };
    let strategyLabel: string;
    let strategyDesc: string;

    if (strategyProfile === 'BALANCED') {
      stationSharesRatio = { s1Pct: 35, s2Pct: 45, s3Pct: 0, reservePct: 20 };
      strategyLabel = 'متوازن ذكي (Smart Balanced - النسبة الذهبية)';
      strategyDesc = 'تقسيم السيولة بين الدعم الأول S1 (35%) والدعم الذهبي S2 (45%) مع حجز 20% كاش طوارئ لتأكيد شمعة الارتداد.';
    } else if (strategyProfile === 'AGGRESSIVE') {
      stationSharesRatio = { s1Pct: 65, s2Pct: 35, s3Pct: 0, reservePct: 0 };
      strategyLabel = 'اقتناص الارتداد السريع (Momentum / Rebound)';
      strategyDesc = 'تركيز 65% من السيولة عند أول تشبع بيعي، و35% عند القاع لاقتناص أقصى كمية أسهم بأسرع وقت.';
    } else {
      stationSharesRatio = { s1Pct: 25, s2Pct: 35, s3Pct: 40, reservePct: 0 };
      strategyLabel = 'محافظ دفاعي (Conservative Safety)';
      strategyDesc = 'توزيع السيولة على 3 محطات هبوط عميقة متدرجة لتقليل المخاطر وحماية رأس المال لأقصى درجة.';
    }

    // Stations Definition
    const stations = [
      {
        id: 1,
        title: 'المحطة 1: الدعم الفني الأول (S1)',
        desc: `منطقة الدعم اللحظي وتصحيح فيبوناتشي 38.2% ومؤشر RSI قرب التشبع البيعي`,
        price: technicalLevels.s1,
        allocSharePct: stationSharesRatio.s1Pct,
        allocatedMoney: liquidity * (stationSharesRatio.s1Pct / 100),
      },
      {
        id: 2,
        title: 'المحطة 2: الدعم الذهبي وفيبوناتشي 61.8% (S2)',
        desc: `أقوى مستويات صانع السوق وارتداد السيولة المؤسسية والتوافق مع المتوسط المتحرك`,
        price: technicalLevels.s2,
        allocSharePct: stationSharesRatio.s2Pct,
        allocatedMoney: liquidity * (stationSharesRatio.s2Pct / 100),
      },
    ];

    if (stationSharesRatio.s3Pct > 0) {
      stations.push({
        id: 3,
        title: 'المحطة 3: القاع الدفاعي الأسبوعي (S3)',
        desc: `منطقة صيد القيعان في حالة الذعر البيعي وتصحيح فيبوناتشي 78.6%`,
        price: technicalLevels.s3,
        allocSharePct: stationSharesRatio.s3Pct,
        allocatedMoney: liquidity * (stationSharesRatio.s3Pct / 100),
      });
    }

    let runningCost = originalCost;
    let runningQty = q0;
    let totalDcaShares = 0;
    let totalDcaSpent = 0;

    const evaluatedStations = stations.map((st) => {
      const sharesToBuy = st.price > 0 ? Math.floor(st.allocatedMoney / st.price) : 0;
      const actualMoney = sharesToBuy * st.price;

      totalDcaShares += sharesToBuy;
      totalDcaSpent += actualMoney;
      runningCost += actualMoney;
      runningQty += sharesToBuy;

      const progressiveAvg = runningQty > 0 ? runningCost / runningQty : 0;
      const reductionFromOriginalPct =
        p0 > 0 ? ((p0 - progressiveAvg) / p0) * 100 : 0;

      return {
        ...st,
        sharesToBuy,
        actualMoney,
        progressiveAvg: Number(progressiveAvg.toFixed(3)),
        reductionFromOriginalPct: Number(reductionFromOriginalPct.toFixed(1)),
      };
    });

    const finalAvgPrice = runningQty > 0 ? runningCost / runningQty : 0;
    const finalTotalReductionPct = p0 > 0 ? ((p0 - finalAvgPrice) / p0) * 100 : 0;

    // Breakeven recovery distance comparison
    const oldBreakevenPct =
      currentAssetPrice > 0 ? ((p0 - currentAssetPrice) / currentAssetPrice) * 100 : 0;
    const newBreakevenPct =
      currentAssetPrice > 0 ? ((finalAvgPrice - currentAssetPrice) / currentAssetPrice) * 100 : 0;

    // Cash Reserve
    const emergencyCashReserve = liquidity * (stationSharesRatio.reservePct / 100);

    // Target 1 (TP1) Profits Simulation at Resistance R1
    const tp1Value = runningQty * technicalLevels.r1;
    const tp1ProfitEgp = tp1Value - runningCost;
    const tp1ProfitPct = runningCost > 0 ? (tp1ProfitEgp / runningCost) * 100 : 0;

    // Target 2 (TP2) Profits Simulation at Resistance R2
    const tp2Value = runningQty * technicalLevels.r2;
    const tp2ProfitEgp = tp2Value - runningCost;
    const tp2ProfitPct = runningCost > 0 ? (tp2ProfitEgp / runningCost) * 100 : 0;

    return {
      liquidity,
      strategyLabel,
      strategyDesc,
      stations: evaluatedStations,
      emergencyCashReserve,
      totalDcaShares,
      totalDcaSpent,
      finalTotalShares: runningQty,
      finalTotalCost: runningCost,
      finalAvgPrice: Number(finalAvgPrice.toFixed(3)),
      finalTotalReductionPct: Number(finalTotalReductionPct.toFixed(1)),
      oldBreakevenPct: Number(oldBreakevenPct.toFixed(1)),
      newBreakevenPct: Number(newBreakevenPct.toFixed(1)),
      tp1: {
        price: technicalLevels.r1,
        profitEgp: Math.round(tp1ProfitEgp),
        profitPct: Number(tp1ProfitPct.toFixed(1)),
      },
      tp2: {
        price: technicalLevels.r2,
        profitEgp: Math.round(tp2ProfitEgp),
        profitPct: Number(tp2ProfitPct.toFixed(1)),
      },
    };
  }, [availableLiquidity, originalPrice, originalQty, currentAssetPrice, strategyProfile, technicalLevels]);

  // Mode 2: Direct DCA Calculations
  const directCalculation = useMemo(() => {
    const originalCost = originalPrice * originalQty;
    const additionalCost = targetBuyPrice * newQtyToAdd;
    const totalCost = originalCost + additionalCost;
    const totalQty = originalQty + newQtyToAdd;
    const newAveragePrice = totalQty > 0 ? totalCost / totalQty : 0;

    const priceReductionPct =
      originalPrice > 0 ? ((originalPrice - newAveragePrice) / originalPrice) * 100 : 0;

    const oldRecoveryNeededPct =
      currentAssetPrice > 0 ? ((originalPrice - currentAssetPrice) / currentAssetPrice) * 100 : 0;

    const newRecoveryNeededPct =
      currentAssetPrice > 0 ? ((newAveragePrice - currentAssetPrice) / currentAssetPrice) * 100 : 0;

    const profitAtOriginalPrice = totalQty * originalPrice - totalCost;
    const profitPctAtOriginalPrice = totalCost > 0 ? (profitAtOriginalPrice / totalCost) * 100 : 0;

    const currentValue = totalQty * currentAssetPrice;
    const unrealizedLossEgp = currentValue - totalCost;

    return {
      originalCost,
      additionalCost,
      totalCost,
      totalQty,
      newAveragePrice: Number(newAveragePrice.toFixed(3)),
      priceReductionPct: Number(priceReductionPct.toFixed(1)),
      oldRecoveryNeededPct: Number(oldRecoveryNeededPct.toFixed(1)),
      newRecoveryNeededPct: Number(newRecoveryNeededPct.toFixed(1)),
      profitAtOriginalPrice: Math.round(profitAtOriginalPrice),
      profitPctAtOriginalPrice: Number(profitPctAtOriginalPrice.toFixed(1)),
      unrealizedLossEgp: Math.round(unrealizedLossEgp),
    };
  }, [originalPrice, originalQty, targetBuyPrice, newQtyToAdd, currentAssetPrice]);

  // Mode 3: Target Average Solver Calculations
  const solverCalculation = useMemo(() => {
    const p0 = originalPrice;
    const q0 = originalQty;
    const p1 = targetBuyPrice;
    const tAvg = desiredAverage;

    let isPossible = true;
    let errorMessage = '';
    let requiredShares = 0;
    let requiredCash = 0;

    if (tAvg <= p1) {
      isPossible = false;
      errorMessage = `لا يمكن الوصول لمتوسط (${tAvg} ج.م) إذا كان سعر التبريد المقترح (${p1} ج.م) أعلى من أو مساوياً له. يجب أن يكون سعر التبريد أقل من المتوسط المستهدف.`;
    } else if (tAvg >= p0) {
      isPossible = false;
      errorMessage = `المتوسط المستهدف (${tAvg} ج.م) أعلى من أو يساوي سعر شرائك القديم (${p0} ج.م)! أنت بالفعل عند متوسط أفضل.`;
    } else if (p0 > 0 && q0 > 0 && p1 > 0) {
      requiredShares = Math.ceil((q0 * (p0 - tAvg)) / (tAvg - p1));
      requiredCash = requiredShares * p1;
    }

    const finalTotalQty = q0 + requiredShares;
    const finalTotalCost = q0 * p0 + requiredCash;
    const verifiedAverage = finalTotalQty > 0 ? finalTotalCost / finalTotalQty : 0;

    const recoveryNeededPct =
      currentAssetPrice > 0 ? ((tAvg - currentAssetPrice) / currentAssetPrice) * 100 : 0;

    return {
      isPossible,
      errorMessage,
      requiredShares,
      requiredCash,
      finalTotalQty,
      finalTotalCost,
      verifiedAverage: Number(verifiedAverage.toFixed(3)),
      recoveryNeededPct: Number(recoveryNeededPct.toFixed(1)),
    };
  }, [originalPrice, originalQty, targetBuyPrice, desiredAverage, currentAssetPrice]);

  // Mode 4: Ladder DCA (3 Progressive Tiers)
  const ladderTiers = useMemo(() => {
    const budget = ladderBudget > 0 ? ladderBudget : 50000;
    const basePrice = currentAssetPrice > 0 ? currentAssetPrice : 50;

    const tiers = [
      {
        tier: 1,
        title: 'الدفعة الأولى (التصحيح الأولي)',
        dropPct: 4,
        price: Number((basePrice * 0.96).toFixed(2)),
        budgetSharePct: 25,
      },
      {
        tier: 2,
        title: 'الدفعة الثانية (الدعم الفني الرئيسي S1)',
        dropPct: 8,
        price: Number((basePrice * 0.92).toFixed(2)),
        budgetSharePct: 35,
      },
      {
        tier: 3,
        title: 'الدفعة الثالثة (الدعم الذهبي S2 / فيبوناتشي)',
        dropPct: 14,
        price: Number((basePrice * 0.86).toFixed(2)),
        budgetSharePct: 40,
      },
    ];

    let runningShares = originalQty;
    let runningCost = originalPrice * originalQty;

    return tiers.map((t) => {
      const allocatedMoney = budget * (t.budgetSharePct / 100);
      const buyShares = t.price > 0 ? Math.floor(allocatedMoney / t.price) : 0;
      const actualSpent = buyShares * t.price;

      runningShares += buyShares;
      runningCost += actualSpent;

      const progressiveAverage = runningShares > 0 ? runningCost / runningShares : 0;
      const recoveryFromTierPricePct =
        t.price > 0 ? ((progressiveAverage - t.price) / t.price) * 100 : 0;

      return {
        ...t,
        allocatedMoney,
        buyShares,
        actualSpent,
        runningShares,
        runningCost,
        progressiveAverage: Number(progressiveAverage.toFixed(3)),
        recoveryFromTierPricePct: Number(recoveryFromTierPricePct.toFixed(1)),
      };
    });
  }, [ladderBudget, currentAssetPrice, originalQty, originalPrice]);

  // Copy Complete Strategic DCA Plan
  const handleCopyPlan = () => {
    const text = `🎯 الخطة الاستراتيجية المقترحة للتبريد الفني الذكي (DCA Optimization Plan)
الأصل: ${assetType === 'STOCKS' ? `${stock.symbol} - ${stock.nameAr}` : 'الذهب بالصاغة'}
السعر الحالي: ${currentAssetPrice.toFixed(2)} ج.م
سعر الدخول القديم: ${originalPrice.toFixed(2)} ج.م (الكمية الحالية: ${originalQty.toLocaleString()} ${assetUnitName})
إجمالي السيولة المخصصة للتبريد: ${liquidityPlan.liquidity.toLocaleString()} ج.م (${liquidityPlan.strategyLabel})

📍 محطات الشراء الفنية المقترحة:
${liquidityPlan.stations
  .map(
    (st) =>
      `• المحطة ${st.id} (${st.title}):
  - السعر المقترح: ${st.price.toFixed(2)} ج.م
  - الكمية: ${st.sharesToBuy.toLocaleString()} ${assetUnitName} (سيولة: ${st.actualMoney.toLocaleString()} ج.م)
  - المتوسط الناتج بعد هذه المحطة: ${st.progressiveAvg.toFixed(3)} ج.م (تخفيض ${st.reductionFromOriginalPct}%)`
  )
  .join('\n')}
${liquidityPlan.emergencyCashReserve > 0 ? `• كاش احتياطي للطوارئ: ${liquidityPlan.emergencyCashReserve.toLocaleString()} ج.م (20%)\n` : ''}
📊 النتيجة النهائية للمحفظة:
- المتوسط الجديد المستهدف: ${liquidityPlan.finalAvgPrice.toFixed(3)} ج.م (خفض التكلفة الإجمالية بنسبة ${liquidityPlan.finalTotalReductionPct}%)
- نقطة التعادل الجديدة: +${liquidityPlan.newBreakevenPct}% من السعر الحالي (بدلاً من +${liquidityPlan.oldBreakevenPct}% قبل التبريد!)

🎯 الأهداف ومستويات جني الأرباح (Take Profit):
- الهدف الأول (TP1 - المقاومة ${liquidityPlan.tp1.price} ج.م): ربح متوقع +${liquidityPlan.tp1.profitEgp.toLocaleString()} ج.م (+${liquidityPlan.tp1.profitPct}%)
- الهدف الثاني (TP2 - المقاومة ${liquidityPlan.tp2.price} ج.م): ربح متوقع +${liquidityPlan.tp2.profitEgp.toLocaleString()} ج.م (+${liquidityPlan.tp2.profitPct}%)
- وقف الخسارة الصارم (Stop Loss): كسر وإغلاق يومي تحت ${technicalLevels.stopLoss} ج.م`;

    navigator.clipboard.writeText(text);
    setCopiedPlan(true);
    setTimeout(() => setCopiedPlan(false), 2200);
  };

  // Apply Plan to Direct Calculator
  const handleApplyPlanToDirectCalc = () => {
    if (liquidityPlan.stations.length > 0) {
      setTargetBuyPriceStr(liquidityPlan.stations[0].price.toFixed(2));
      setNewQtyToAddStr(liquidityPlan.totalDcaShares.toString());
      setActiveDcaMode('DIRECT');
    }
  };

  // Filtered stocks list for quick search
  const filteredStocks = useMemo(() => {
    if (!stockSearchQuery) return stocks.slice(0, 35);
    const q = stockSearchQuery.toLowerCase();
    return stocks
      .filter((s) => s.symbol.toLowerCase().includes(q) || s.nameAr.includes(q))
      .slice(0, 35);
  }, [stocks, stockSearchQuery]);

  return (
    <div
      dir="rtl"
      className="rounded-3xl border border-cyan-500/30 bg-[#070b13] p-4 sm:p-6 shadow-2xl space-y-6 font-['Cairo'] relative overflow-hidden"
    >
      {/* Background Accent Gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/10">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>نظام التبريد الفني الذكي ومحسن السيولة (Smart DCA Optimizer)</span>
              </h2>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                {assetType === 'STOCKS' ? stock.symbol : 'XAU الصاغة'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              دراسة أماكن وكميات التبريد الفنية طبقاً للشارت والسيولة المتاحة لتحقيق أعلى مكاسب وخفض نقطة التعادل
            </p>
          </div>
        </div>

        {/* Top Controls: Asset Switcher & Sync Button */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-between lg:justify-end">
          {/* Asset Switcher (Stocks vs Gold) */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => setAssetType('STOCKS')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                assetType === 'STOCKS'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>بورصة مصر (EGX)</span>
            </button>
            <button
              type="button"
              onClick={() => setAssetType('GOLD')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                assetType === 'GOLD'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>الذهب والسبائك 🪙</span>
            </button>
          </div>

          {/* Sync with Current Market Button */}
          <button
            type="button"
            onClick={handleSyncWithCurrentMarket}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            title="تعبئة أسعار التبريد بسعر السوق اللحظي الحالي"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>مزامنة بأسعار السوق</span>
          </button>
        </div>
      </div>

      {/* Asset Selection Bar */}
      {assetType === 'STOCKS' ? (
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-bold text-slate-400 shrink-0">اختر السهم:</label>
            <select
              value={stock.symbol}
              onChange={(e) => onSelectStock(e.target.value)}
              className="w-full sm:w-72 bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {filteredStocks.map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol} - {s.nameAr} ({s.price.toFixed(2)} ج.م)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
            <span>
              السعر اللحظي: <strong className="text-cyan-300 font-mono text-sm">{currentAssetPrice.toFixed(2)} ج.م</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span>
              الدعم S1: <strong className="text-emerald-400 font-mono">{technicalLevels.s1.toFixed(2)} ج.م</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span>
              الدعم S2: <strong className="text-amber-400 font-mono">{technicalLevels.s2.toFixed(2)} ج.م</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span>
              RSI(14): <strong className="text-purple-300 font-mono">{technicalLevels.rsi.toFixed(0)}</strong>
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs font-bold text-amber-200 shrink-0">معيار الذهب:</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: '21', label: 'عيار 21 (الأكثر طلباً)', price: goldSnapshot.gold21k.sellPriceEgp },
                { id: '24', label: 'عيار 24 (السبائك)', price: goldSnapshot.gold24k.sellPriceEgp },
                { id: '18', label: 'عيار 18 (المشغولات)', price: goldSnapshot.gold18k.sellPriceEgp },
                { id: 'POUND', label: 'جنيه ذهب (8 جرام)', price: goldSnapshot.goldPound.sellPriceEgp },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedGoldCaliber(c.id as any)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    selectedGoldCaliber === c.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm font-black'
                      : 'bg-slate-900/90 text-amber-300 border-amber-500/30 hover:border-amber-400'
                  }`}
                >
                  {c.label} ({c.price.toLocaleString('ar-EG')} ج.م)
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-amber-300 font-bold">
            سعر الصاغة المعتمد: <span className="font-mono text-sm text-white">{currentAssetPrice.toLocaleString('ar-EG')} ج.م</span>
          </div>
        </div>
      )}

      {/* DCA Operation Mode Selector (Now 4 Comprehensive Modes) */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveDcaMode('OPTIMIZER')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
            activeDcaMode === 'OPTIMIZER'
              ? 'bg-gradient-to-r from-cyan-500/30 to-teal-500/30 text-cyan-200 border-cyan-400 shadow-md ring-1 ring-cyan-400/50 font-black'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
          <span>المُحسّن الذكي للسيولة (AI Liquidity Optimizer) ✨</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveDcaMode('DIRECT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
            activeDcaMode === 'DIRECT'
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <Calculator className="w-4 h-4 text-cyan-400" />
          <span>الوضع 2: تبريد مباشر بالكمية (Direct DCA)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveDcaMode('SOLVER')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
            activeDcaMode === 'SOLVER'
              ? 'bg-purple-500/20 text-purple-300 border-purple-500 shadow-md ring-1 ring-purple-500/50'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <Target className="w-4 h-4 text-purple-400" />
          <span>الوضع 3: حاسبة المتوسط المستهدف (Target Solver)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveDcaMode('LADDER')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
            activeDcaMode === 'LADDER'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>الوضع 4: التبريد الهرمي (Ladder Martingale)</span>
        </button>
      </div>

      {/* =========================================================================
          MODE 1: AI & TECHNICAL LIQUIDITY OPTIMIZER (طلب المستخدم المباشر)
          ========================================================================= */}
      {activeDcaMode === 'OPTIMIZER' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-teal-950/30 to-slate-950 border border-cyan-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>دراسة واقتراح أفضل أماكن وكميات التبريد بناءً على سيولتك المتوفرة</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                يقوم النظام بدراسة حركة السهم ومستويات الدعم الفنية (S1, S2, S3) وتوزيع سيولتك المتاحة بأفضل نسب رياضية لتقليص مسافة التعادل وتعظيم الأرباح عند الارتداد.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyPlan}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="نسخ الخطة المقترحة بالكامل"
              >
                {copiedPlan ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                <span>{copiedPlan ? 'تم النسخ بنجاح!' : 'نسخ الخطة الاستراتيجية'}</span>
              </button>
              <button
                type="button"
                onClick={handleApplyPlanToDirectCalc}
                className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-cyan-500/20 active:scale-95"
                title="نقل هذه الخطة إلى حاسبة التبريد المباشر"
              >
                <Zap className="w-4 h-4" />
                <span>تطبيق الخطة في الحاسبة</span>
              </button>
            </div>
          </div>

          {/* User Parameters Row: Liquidity, Original Price, Current Quantity, and Strategy Profile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Input 1: Available Cash Liquidity */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/50 focus-within:border-cyan-400 shadow-md transition-all">
              <label className="text-xs font-black text-cyan-300 flex items-center justify-between">
                <span>السيولة النقدية المتوفرة للتبريد:</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">كاش متاح</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  value={availableLiquidityStr}
                  onChange={(e) => setAvailableLiquidityStr(normalizeNumericInput(e.target.value))}
                  placeholder="مثال: 50000"
                  className="w-full bg-slate-900 border border-cyan-500/40 rounded-xl p-2.5 text-lg font-mono font-black text-white focus:outline-none focus:border-cyan-300 text-center"
                />
                <span className="absolute left-3 top-3 text-xs text-slate-400 font-sans pointer-events-none">ج.م</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <button
                  type="button"
                  onClick={() => setAvailableLiquidityStr('20000')}
                  className="hover:text-cyan-300 underline cursor-pointer"
                >
                  20 ألف
                </button>
                <button
                  type="button"
                  onClick={() => setAvailableLiquidityStr('50000')}
                  className="hover:text-cyan-300 underline cursor-pointer"
                >
                  50 ألف
                </button>
                <button
                  type="button"
                  onClick={() => setAvailableLiquidityStr('100000')}
                  className="hover:text-cyan-300 underline cursor-pointer"
                >
                  100 ألف
                </button>
                <button
                  type="button"
                  onClick={() => setAvailableLiquidityStr('250000')}
                  className="hover:text-cyan-300 underline cursor-pointer"
                >
                  250 ألف
                </button>
              </div>
            </div>

            {/* Input 2: Original Purchase Price */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 focus-within:border-cyan-500 transition-all">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>سعر الشراء الأصلي القديم:</span>
                <span className="text-[10px] text-rose-400 font-mono">سعر المركز</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  dir="ltr"
                  value={originalPriceStr}
                  onChange={(e) => setOriginalPriceStr(normalizeNumericInput(e.target.value))}
                  placeholder="مثال: 0.75"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-lg font-mono font-black text-white focus:outline-none focus:border-cyan-500 text-center"
                />
                <span className="absolute left-3 top-3 text-xs text-slate-400 font-sans pointer-events-none">ج.م</span>
              </div>
              <span className="text-[10px] text-slate-500 block text-right">
                السعر الحالي للسهم: {currentAssetPrice.toFixed(2)} ج.م
              </span>
            </div>

            {/* Input 3: Current Owned Quantity */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 focus-within:border-cyan-500 transition-all">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>الكمية الحالية بمحفظتك ({assetUnitName}):</span>
                <span className="text-[10px] text-slate-400 font-mono">الأسهم الحالية</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                value={originalQtyStr}
                onChange={(e) => setOriginalQtyStr(normalizeNumericInput(e.target.value))}
                placeholder="مثال: 75000"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-lg font-mono font-black text-white focus:outline-none focus:border-cyan-500 text-center"
              />
              <span className="text-[10px] text-slate-500 block text-right">
                التكلفة الحالية: {(originalPrice * originalQty).toLocaleString()} ج.م
              </span>
            </div>

            {/* Input 4: Optimization Strategy Profile */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <label className="text-xs font-bold text-slate-300 block">
                استراتيجية توزيع السيولة:
              </label>
              <select
                value={strategyProfile}
                onChange={(e) => setStrategyProfile(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 text-cyan-300 rounded-xl p-2.5 text-xs font-black focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="BALANCED">⚖️ متوازن ذكي (النسبة الذهبية - موصى به)</option>
                <option value="AGGRESSIVE">⚡ اقتناص ارتداد سريع (Momentum Rebound)</option>
                <option value="CONSERVATIVE">🛡️ محافظ دفاعي (توزيع هبوط عميق 3 مستويات)</option>
              </select>
              <span className="text-[10px] text-slate-400 block text-right truncate">
                {liquidityPlan.strategyDesc}
              </span>
            </div>
          </div>

          {/* Strategic Entry Stations Roadmap (محطات التبريد الفنية المقترحة) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>محطات التبريد الفنية المقترحة بدقة (الأماكن والكميات):</span>
              </h4>
              <span className="text-xs text-slate-400">
                موزعة على مستويات الدعم الفنية لتفادي استنزاف السيولة في قاع وهمي
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liquidityPlan.stations.map((st) => (
                <div
                  key={st.id}
                  className="rounded-2xl p-4 bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between shadow-lg relative group"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-mono font-bold text-xs">
                        {st.id}
                      </div>
                      <span className="text-xs font-black text-white">{st.title}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                      {st.allocSharePct}% من السيولة
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <p className="text-[11px] text-slate-400 leading-relaxed min-h-[32px]">
                      {st.desc}
                    </p>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                      <div className="flex items-baseline justify-between">
                        <span className="text-slate-400">سعر الدخول المقترح:</span>
                        <span className="font-mono text-base font-black text-cyan-300">
                          {st.price.toFixed(2)} <span className="text-xs font-sans text-slate-400 font-normal">ج.م</span>
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-slate-400">كمية الأسهم المقترحة:</span>
                        <span className="font-mono text-base font-black text-emerald-400">
                          {st.sharesToBuy.toLocaleString()} <span className="text-xs font-sans text-slate-400 font-normal">{assetUnitName}</span>
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between text-[11px]">
                        <span className="text-slate-400">السيولة المخصصة:</span>
                        <span className="font-mono font-bold text-amber-300">
                          {st.actualMoney.toLocaleString()} ج.م
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">المتوسط الناتج بعدها:</span>
                    <span className="font-mono font-black text-white text-xs">
                      {st.progressiveAvg.toFixed(3)} ج.م{' '}
                      <span className="text-emerald-400 text-[10px]">(-{st.reductionFromOriginalPct}%)</span>
                    </span>
                  </div>
                </div>
              ))}

              {/* Emergency Reserve Card if applicable */}
              {liquidityPlan.emergencyCashReserve > 0 && (
                <div className="rounded-2xl p-4 bg-gradient-to-b from-amber-950/20 to-slate-950 border border-amber-500/30 flex flex-col justify-between shadow-lg">
                  <div>
                    <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold text-xs">
                          🛡️
                        </div>
                        <span className="text-xs font-black text-amber-200">كاش الأمان والطوارئ (20%)</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/60">
                        احتياطي
                      </span>
                    </div>

                    <p className="text-[11px] text-amber-200/80 leading-relaxed mb-3">
                      مبلغ كاش محجوز لحماية حسابك من التذبذب العنيف أو لاقتناص شمعة ارتداد إيجابية مؤكدة (Bullish Confirmation) دون تعريض محفظتك للانكشاف الكامل.
                    </p>

                    <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/20 text-center">
                      <span className="text-[11px] text-slate-400 block mb-0.5">السيولة المحجوزة للطوارئ:</span>
                      <span className="font-mono text-xl font-black text-amber-300">
                        {liquidityPlan.emergencyCashReserve.toLocaleString()}{' '}
                        <span className="text-xs font-sans text-slate-400">ج.م</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 text-[10px] text-slate-400 text-center">
                    قاعدة حماية رأس المال: لا تستنزف كامل سيولتك في اتجاه هابط.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Strategic Gains & Portfolio Transformation HUD */}
          <div className="p-5 rounded-3xl bg-slate-950 border border-cyan-500/40 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <span>النتيجة الاستراتيجية للمحفظة بعد تنفيذ خطة التبريد:</span>
              </h4>
              <span className="text-xs text-emerald-400 font-bold">
                إجمالي الأسهم المضافة: {liquidityPlan.totalDcaShares.toLocaleString()} {assetUnitName} | السيولة المستثمرة: {liquidityPlan.totalDcaSpent.toLocaleString()} ج.م
              </span>
            </div>

            {/* 4 Transformation Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: New Final Average */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-950/40 to-slate-900 border border-emerald-500/50 shadow-md">
                <span className="text-xs text-slate-400 block mb-1">المتوسط الذهبي الجديد بعد التبريد</span>
                <div className="text-2xl font-mono font-black text-emerald-400">
                  {liquidityPlan.finalAvgPrice.toFixed(3)}{' '}
                  <span className="text-xs font-sans text-slate-400 font-normal">ج.م</span>
                </div>
                <div className="text-[11px] text-emerald-300 font-bold mt-1.5 flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>انخفض بنسبة {liquidityPlan.finalTotalReductionPct}% من سعر شرائك القديم</span>
                </div>
              </div>

              {/* Card 2: Breakeven Improvement */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-cyan-950/40 to-slate-900 border border-cyan-500/50 shadow-md">
                <span className="text-xs text-slate-400 block mb-1">المسافة المطلوبة لنقطة التعادل</span>
                <div className="text-2xl font-mono font-black text-cyan-300">
                  +{liquidityPlan.newBreakevenPct}%
                </div>
                <div className="text-[11px] text-slate-300 mt-1.5">
                  بدلاً من <strong className="text-rose-400 font-mono">+{liquidityPlan.oldBreakevenPct}%</strong> قبل التبريد!
                </div>
              </div>

              {/* Card 3: Target 1 (TP1) Gains */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-purple-950/40 to-slate-900 border border-purple-500/50 shadow-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-purple-300 font-bold">الهدف 1 (مقاومة {liquidityPlan.tp1.price} ج)</span>
                  <span className="text-[10px] text-purple-300 font-mono">TP1</span>
                </div>
                <div className="text-2xl font-mono font-black text-purple-200">
                  +{liquidityPlan.tp1.profitEgp.toLocaleString()}{' '}
                  <span className="text-xs font-sans text-slate-400 font-normal">ج.م</span>
                </div>
                <span className="text-[11px] text-purple-300/90 font-bold mt-1.5 block">
                  ربح +{liquidityPlan.tp1.profitPct}% على إجمالي رأس المال
                </span>
              </div>

              {/* Card 4: Target 2 (TP2) Gains */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-950/40 to-slate-900 border border-amber-500/50 shadow-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-amber-300 font-bold">الهدف 2 (مقاومة {liquidityPlan.tp2.price} ج)</span>
                  <span className="text-[10px] text-amber-300 font-mono">TP2</span>
                </div>
                <div className="text-2xl font-mono font-black text-amber-300">
                  +{liquidityPlan.tp2.profitEgp.toLocaleString()}{' '}
                  <span className="text-xs font-sans text-slate-400 font-normal">ج.م</span>
                </div>
                <span className="text-[11px] text-amber-200 font-bold mt-1.5 block">
                  ربح +{liquidityPlan.tp2.profitPct}% على إجمالي رأس المال
                </span>
              </div>
            </div>

            {/* Risk Control & Exit Protocol Note */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-start gap-3 text-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-white block">
                  استراتيجية الخروج وجني الأرباح الآمن (De-risking Protocol):
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  1. <strong>عند الوصول لسعر التعادل الجديد ({liquidityPlan.finalAvgPrice.toFixed(2)} ج.م):</strong> يمكنك بيع 40% من كميات التبريد لاسترجاع جزء كبير من سيولتك بدون خسارة.
                  <br />
                  2. <strong>عند الهدف الأول TP1 ({liquidityPlan.tp1.price} ج.م):</strong> قم ببيع النصف الآخر لجني الأرباح المحققة وتأمين كاش محفظتك.
                  <br />
                  3. <strong>وقف الخسارة الصارم (Stop Loss):</strong> إغلاق شمعة يومية واضحة أدنى من <strong>{technicalLevels.stopLoss} ج.م</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODE 2: DIRECT QUANTITY DCA (تبريد مباشر بالكمية)
          ========================================================================= */}
      {activeDcaMode === 'DIRECT' && (
        <div className="space-y-6">
          {/* Inputs Grid with Full Support for Arabic/English numerals & Seamless Typing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Input 1: Original Purchase Price */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 focus-within:border-cyan-500 transition-all">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>سعر الشراء القديم (ج.م):</span>
                <span className="text-[10px] text-rose-400 font-mono">سعر التعليقة</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                dir="ltr"
                value={originalPriceStr}
                onChange={(e) => setOriginalPriceStr(normalizeNumericInput(e.target.value))}
                placeholder="مثال: 0.75"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-base font-mono font-black text-white focus:outline-none focus:border-cyan-500 text-center"
              />
              <span className="text-[10px] text-slate-500 block text-right">
                سعر الدخول الأصلي بمحفظتك
              </span>
            </div>

            {/* Input 2: Original Quantity */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 focus-within:border-cyan-500 transition-all">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>الكمية المملوكة حالياً ({assetUnitName}):</span>
                <span className="text-[10px] text-slate-400 font-mono">المركز الحالي</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                value={originalQtyStr}
                onChange={(e) => setOriginalQtyStr(normalizeNumericInput(e.target.value))}
                placeholder="مثال: 75000"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-base font-mono font-black text-white focus:outline-none focus:border-cyan-500 text-center"
              />
              <span className="text-[10px] text-slate-500 block text-right">
                التكلفة الأصلية: {directCalculation.originalCost.toLocaleString()} ج.م
              </span>
            </div>

            {/* Input 3: Proposed DCA Buy Price */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 focus-within:border-cyan-500 transition-all">
              <label className="text-xs font-bold text-cyan-300 flex items-center justify-between">
                <span>سعر التبريد المقترح (ج.م):</span>
                <span className="text-[10px] text-emerald-400 font-mono">دخول جديد</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                dir="ltr"
                value={targetBuyPriceStr}
                onChange={(e) => setTargetBuyPriceStr(normalizeNumericInput(e.target.value))}
                placeholder="مثال: 0.43"
                className="w-full bg-slate-900 border border-cyan-500/50 rounded-xl p-2.5 text-base font-mono font-black text-cyan-300 focus:outline-none focus:border-cyan-400 text-center"
              />
              <span className="text-[10px] text-slate-400 block text-right">
                السعر الحالي: {currentAssetPrice.toFixed(2)} ج.م
              </span>
            </div>

            {/* Input 4: New Quantity to Buy */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 focus-within:border-cyan-500 transition-all">
              <label className="text-xs font-bold text-emerald-300 flex items-center justify-between">
                <span>كمية التبريد الإضافية ({assetUnitName}):</span>
                <span className="text-[10px] text-emerald-400 font-mono">الشراء الإضافي</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                value={newQtyToAddStr}
                onChange={(e) => setNewQtyToAddStr(normalizeNumericInput(e.target.value))}
                placeholder="مثال: 25000"
                className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl p-2.5 text-base font-mono font-black text-emerald-300 focus:outline-none focus:border-emerald-400 text-center"
              />
              <span className="text-[10px] text-slate-400 block text-right">
                السيولة المطلوبة: {directCalculation.additionalCost.toLocaleString()} ج.م
              </span>
            </div>
          </div>

          {/* Results Summary HUD (4 High Precision Executive Cards) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: New Average Price */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-950/40 to-slate-950 border border-emerald-500/40 shadow-lg">
              <span className="text-xs text-slate-400 block mb-1">متوسط السعر الجديد بعد التبريد</span>
              <div className="text-2xl font-mono font-black text-emerald-400">
                {directCalculation.newAveragePrice.toFixed(3)}{' '}
                <span className="text-xs font-sans text-slate-400 font-normal">ج.م</span>
              </div>
              <div className="text-[11px] text-emerald-300/90 font-bold mt-1.5 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>انخفض المتوسط بنسبة {directCalculation.priceReductionPct}%</span>
              </div>
            </div>

            {/* Card 2: Breakeven Recovery Distance */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-cyan-950/40 to-slate-950 border border-cyan-500/40 shadow-lg">
              <span className="text-xs text-slate-400 block mb-1">المسافة لسعر التعادل الجديد</span>
              <div className="text-2xl font-mono font-black text-cyan-300">
                +{directCalculation.newRecoveryNeededPct}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1.5">
                بدلاً من <strong className="text-rose-400 font-mono">+{directCalculation.oldRecoveryNeededPct}%</strong> قبل التبريد!
              </div>
            </div>

            {/* Card 3: Additional Cash Needed */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-950/40 to-slate-950 border border-amber-500/40 shadow-lg">
              <span className="text-xs text-slate-400 block mb-1">السيولة الإضافية المطلوبة</span>
              <div className="text-2xl font-mono font-black text-amber-300">
                {directCalculation.additionalCost.toLocaleString()}{' '}
                <span className="text-xs font-sans text-slate-400 font-normal">ج.م</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1.5 block">
                لشراء {newQtyToAdd.toLocaleString()} {assetUnitName}
              </span>
            </div>

            {/* Card 4: Total Value and Opportunity */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-purple-950/40 to-slate-950 border border-purple-500/40 shadow-lg">
              <span className="text-xs text-slate-400 block mb-1">الربح عند الرجوع لسعر الدخول القديم</span>
              <div className="text-2xl font-mono font-black text-purple-300">
                +{directCalculation.profitAtOriginalPrice.toLocaleString()}{' '}
                <span className="text-xs font-sans text-slate-400 font-normal">ج.م</span>
              </div>
              <span className="text-[11px] text-purple-200/90 font-bold mt-1.5 block">
                عائد +{directCalculation.profitPctAtOriginalPrice}% على إجمالي رأس المال
              </span>
            </div>
          </div>

          {/* Visual DCA Trajectory Bar */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
              <span>مخطط تقليص الفارق السعري:</span>
              <span>
                إجمالي الأسهم بعد التبريد: <strong className="text-white font-mono">{directCalculation.totalQty.toLocaleString()}</strong> سهم | إجمالي التكلفة: <strong className="text-white font-mono">{directCalculation.totalCost.toLocaleString()}</strong> ج.م
              </span>
            </div>
            <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800 relative">
              <div
                className="bg-cyan-500 h-full transition-all"
                style={{ width: `${Math.min(100, Math.max(15, (currentAssetPrice / (originalPrice || 1)) * 100))}%` }}
                title={`السعر الحالي: ${currentAssetPrice.toFixed(2)} ج.م`}
              />
              <div
                className="bg-emerald-500 h-full opacity-80 transition-all"
                style={{ width: `${Math.min(100, Math.max(10, ((directCalculation.newAveragePrice - currentAssetPrice) / (originalPrice || 1)) * 100))}%` }}
                title={`المتوسط الجديد: ${directCalculation.newAveragePrice.toFixed(2)} ج.م`}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span className="text-cyan-400 font-bold">● السعر الحالي: {currentAssetPrice.toFixed(2)} ج.م</span>
              <span className="text-emerald-400 font-bold">● المتوسط الجديد: {directCalculation.newAveragePrice.toFixed(3)} ج.م</span>
              <span className="text-rose-400 font-bold">● سعر الشراء القديم: {originalPrice.toFixed(2)} ج.م</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODE 3: TARGET AVERAGE SOLVER (حل معادلة المتوسط المستهدف)
          ========================================================================= */}
      {activeDcaMode === 'SOLVER' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-200">
            <p className="leading-relaxed">
              <strong>حاسبة الهدف الذكي:</strong> حدد "متوسط السعر الذي ترغب في الوصول إليه"، وسيقوم النظام بحساب عدد الأسهم الدقيقة والسيولة النقدية الإجمالية المطلوبة بالجنيه المصري لتحقيق هذا الهدف بالمليم!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Input: Original Price */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <label className="text-xs font-bold text-slate-300 block">سعر الشراء القديم (ج.م):</label>
              <input
                type="text"
                inputMode="decimal"
                dir="ltr"
                value={originalPriceStr}
                onChange={(e) => setOriginalPriceStr(normalizeNumericInput(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-base font-mono font-bold text-white text-center focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Input: Original Quantity */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <label className="text-xs font-bold text-slate-300 block">الكمية الحالية ({assetUnitName}):</label>
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                value={originalQtyStr}
                onChange={(e) => setOriginalQtyStr(normalizeNumericInput(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-base font-mono font-bold text-white text-center focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Input: Proposed DCA Buy Price */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <label className="text-xs font-bold text-cyan-300 block">سعر الشراء الجديد (ج.م):</label>
              <input
                type="text"
                inputMode="decimal"
                dir="ltr"
                value={targetBuyPriceStr}
                onChange={(e) => setTargetBuyPriceStr(normalizeNumericInput(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-base font-mono font-bold text-cyan-300 text-center focus:outline-none focus:border-purple-500"
              />
              <span className="text-[10px] text-slate-400 block text-right">
                السعر الحالي: {currentAssetPrice.toFixed(2)} ج.م
              </span>
            </div>

            {/* Input: Desired Target Average */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/50">
              <label className="text-xs font-bold text-purple-300 block">المتوسط المستهدف المنشود (ج.م):</label>
              <input
                type="text"
                inputMode="decimal"
                dir="ltr"
                value={desiredAverageStr}
                onChange={(e) => setDesiredAverageStr(normalizeNumericInput(e.target.value))}
                placeholder="مثال: 0.50"
                className="w-full bg-slate-900 border border-purple-500 rounded-xl p-2.5 text-base font-mono font-black text-purple-300 text-center focus:outline-none focus:border-purple-400"
              />
              <span className="text-[10px] text-purple-300 block text-right font-medium">
                الهدف المطلوب الوصول إليه
              </span>
            </div>
          </div>

          {/* Solver Result Display */}
          {solverCalculation.isPossible ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-gradient-to-b from-purple-950/40 to-slate-950 border border-purple-500/50 shadow-xl">
                <span className="text-xs text-purple-300 block mb-1">عدد الأسهم المطلوبة للشراء</span>
                <div className="text-3xl font-mono font-black text-white">
                  {solverCalculation.requiredShares.toLocaleString()}{' '}
                  <span className="text-xs font-sans text-slate-400 font-normal">{assetUnitName}</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-2 block">
                  لتصل لمحفظة إجمالية: {solverCalculation.finalTotalQty.toLocaleString()} {assetUnitName}
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-950/40 to-slate-950 border border-amber-500/50 shadow-xl">
                <span className="text-xs text-amber-300 block mb-1">السيولة النقدية المطلوبة للهدف</span>
                <div className="text-3xl font-mono font-black text-amber-300">
                  {solverCalculation.requiredCash.toLocaleString()}{' '}
                  <span className="text-xs font-sans text-slate-400 font-normal">ج.م</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-2 block">
                  إجمالي التكلفة الكلية بعد الشراء: {solverCalculation.finalTotalCost.toLocaleString()} ج.م
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-b from-emerald-950/40 to-slate-950 border border-emerald-500/50 shadow-xl">
                <span className="text-xs text-emerald-300 block mb-1">المسافة لسعر التعادل المستهدف</span>
                <div className="text-3xl font-mono font-black text-emerald-400">
                  +{solverCalculation.recoveryNeededPct}%
                </div>
                <span className="text-[11px] text-emerald-300/90 font-bold mt-2 block">
                  يصل السهم للتعادل عند صعوده {solverCalculation.recoveryNeededPct}% فقط من سعره الحالي
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{solverCalculation.errorMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODE 4: SMART LADDER / MARTINGALE DCA (التبريد المتدرج الهرمي)
          ========================================================================= */}
      {activeDcaMode === 'LADDER' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-200">
            <p className="leading-relaxed">
              <strong>استراتيجية التبريد الهرمي المحترف:</strong> بدلاً من رمي كل السيولة في أول هبوط، يتم تقسيم ميزانيتك المخصصة للتبريد على 3 دفعات مدروسة فنية عند مستويات الدعم. هذا يضمن الحصول على أفضل متوسط ممكن ويمنع نفاد السيولة إذا استمر الهبوط.
            </p>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 flex-wrap">
            <label className="text-xs font-bold text-slate-300">
              ميزانية السيولة الإجمالية المخصصة للتبريد (ج.م):
            </label>
            <input
              type="text"
              inputMode="numeric"
              dir="ltr"
              value={ladderBudgetStr}
              onChange={(e) => setLadderBudgetStr(normalizeNumericInput(e.target.value))}
              placeholder="50000"
              className="bg-slate-900 border border-emerald-500/50 rounded-xl px-4 py-2 text-sm font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-400 w-44 text-center"
            />
            <span className="text-xs text-slate-400">
              المركز الحالي: {originalQty.toLocaleString()} {assetUnitName} بسعر {originalPrice.toFixed(2)} ج.م
            </span>
          </div>

          {/* Progressive Tiers Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold">
                <tr>
                  <th className="p-3.5">الدفعة</th>
                  <th className="p-3.5">المستوى الفني المستهدف</th>
                  <th className="p-3.5">سعر الشراء</th>
                  <th className="p-3.5">السيولة المخصصة</th>
                  <th className="p-3.5">الكمية المشتراة</th>
                  <th className="p-3.5">المتوسط التراكمي الجديد</th>
                  <th className="p-3.5">المسافة للتعادل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {ladderTiers.map((tier) => (
                  <tr key={tier.tier} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3.5 font-sans font-bold text-white flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center text-[10px] font-mono">
                        {tier.tier}
                      </span>
                      <span>{tier.title}</span>
                    </td>
                    <td className="p-3.5 font-sans text-slate-300">هبوط -{tier.dropPct}%</td>
                    <td className="p-3.5 text-cyan-300 font-bold">{tier.price.toFixed(2)} ج.م</td>
                    <td className="p-3.5 text-amber-300 font-bold">
                      {tier.allocatedMoney.toLocaleString()} ج.م{' '}
                      <span className="text-[10px] text-slate-400 font-sans">({tier.budgetSharePct}%)</span>
                    </td>
                    <td className="p-3.5 text-white">{tier.buyShares.toLocaleString()} {assetUnitName}</td>
                    <td className="p-3.5 text-emerald-400 font-black text-sm">
                      {tier.progressiveAverage.toFixed(3)} ج.م
                    </td>
                    <td className="p-3.5 text-purple-300 font-bold">+{tier.recoveryFromTierPricePct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Advisory Note & Capital Protection Rules */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
        <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h5 className="font-bold text-white">قواعد التبريد الذهبية وإدارة المخاطر (Capital Protection Protocol):</h5>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            1. لا تبرد في سهم كاسر لقاع تاريخي بدون شمعة ارتداد انعكاسية على الإطار اليومي.
            <br />
            2. تجنب تركيز أكثر من 25% من إجمالي محفظتك المالية في سهم واحد مهما كانت إغراءات خفض المتوسط.
            <br />
            3. عند ارتداد السعر ووصوله لنقطة التعادل الجديدة، قم بتخفيف كميات التبريد لاستعادة السيولة النقدية وتأمين رأس المال.
          </p>
        </div>
      </div>
    </div>
  );
};
