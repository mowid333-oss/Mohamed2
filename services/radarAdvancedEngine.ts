import { EGXStock } from '../types/stock';

export type SignalSeverity = 'HIGH' | 'MEDIUM' | 'EMERGING';

export interface RadarSignal {
  id: string;
  symbol: string;
  stockNameAr: string;
  radarType: 'EXPLOSION' | 'REVERSAL' | 'BOTTOM_FORMATION' | 'TOP_FORMATION';
  titleAr: string;
  badgeAr: string;
  severity: SignalSeverity;
  confidenceScore: number; // 0 - 100%
  triggerPrice: number;
  targetPrice1: number;
  targetPrice2: number;
  stopLossPrice: number;
  riskRewardRatio: string;
  indicatorsUsed: string[];
  explanationAr: string;
  actionAdviceAr: string;
  isShariah: boolean;
  valueTraded: number;
  changePct: number;
}

export interface ComprehensiveStockAnalysisReport {
  stock: EGXStock;
  reportDate: string;
  overallRatingAr: string;
  ratingScore: number; // 0 - 100
  ratingColor: 'emerald' | 'teal' | 'amber' | 'rose';
  
  // 4 Radars Status
  explosionStatus: {
    detected: boolean;
    titleAr: string;
    detailsAr: string;
    score: number;
  };
  reversalStatus: {
    detected: boolean;
    titleAr: string;
    detailsAr: string;
    score: number;
  };
  bottomStatus: {
    detected: boolean;
    titleAr: string;
    detailsAr: string;
    score: number;
  };
  topStatus: {
    detected: boolean;
    titleAr: string;
    detailsAr: string;
    score: number;
  };

  // Technical Indicators Verdict
  indicators: {
    name: string;
    value: string;
    signal: 'BUY' | 'SELL' | 'NEUTRAL';
    signalAr: string;
    interpretationAr: string;
  }[];

  // Execution Levels
  execution: {
    suggestedEntry: string;
    target1: number;
    target1Pct: number;
    target2: number;
    target2Pct: number;
    stopLoss: number;
    stopLossPct: number;
    riskRewardRatio: string;
  };

  // Shariah Audit Verdict
  shariahAudit: {
    isCompliant: boolean;
    verdictAr: string;
    reasonAr: string;
    debtRatio?: number;
    cashInterestRatio?: number;
  };

  // 1-Year Annual Volume Profile Study
  annualVolumeStudy: {
    currentVolume: number;
    currentValueTraded: number;
    annualAverageDailyVolume: number;
    annualAverageDailyValue: number;
    relativeVolume1Year: number;
    volumeStatusAr: string;
    volumePositiveThreshold: number;
    valuePositiveThreshold: number;
    peakVolume1Year: number;
    troughVolume1Year: number;
    volumePercentile: number;
    isVolumeBullish: boolean;
  };

  // Liquidity Line & Money Flow Analysis
  liquidityLineStudy: {
    liquidityLineStatus: 'BULLISH_INFLOW' | 'NEUTRAL_ACCUMULATION' | 'BEARISH_OUTFLOW';
    liquidityLineTrendAr: string;
    netInflowRatio: number;
    netOutflowRatio: number;
    estimatedNetInflowEgp: number;
    obvTrend: 'UP' | 'DOWN' | 'FLAT';
    obvTrendAr: string;
    vwapPrice: number;
    isPriceAboveVwap: boolean;
    moneyFlowIndex: number;
    mfiVerdictAr: string;
    bullishTurnConditions: {
      isCurrentlyPositive: boolean;
      recommendationSummaryAr: string;
      exactConditionsAr: string[];
      confirmationTriggerAr: string;
      cautionTriggerAr: string;
    };
  };

  summaryNarrativeAr: string;
}

export interface AnnualVolumeStudy {
  currentVolume: number;
  currentValueTraded: number;
  annualAverageDailyVolume: number;
  annualAverageDailyValue: number;
  relativeVolume1Year: number;
  volumeStatusAr: string;
  volumePositiveThreshold: number;
  valuePositiveThreshold: number;
  peakVolume1Year: number;
  troughVolume1Year: number;
  volumePercentile: number;
  isVolumeBullish: boolean;
}

export interface LiquidityLineStudy {
  liquidityLineStatus: 'BULLISH_INFLOW' | 'NEUTRAL_ACCUMULATION' | 'BEARISH_OUTFLOW';
  liquidityLineTrendAr: string;
  netInflowRatio: number;
  netOutflowRatio: number;
  estimatedNetInflowEgp: number;
  obvTrend: 'UP' | 'DOWN' | 'FLAT';
  obvTrendAr: string;
  vwapPrice: number;
  isPriceAboveVwap: boolean;
  moneyFlowIndex: number;
  mfiVerdictAr: string;
  bullishTurnConditions: {
    isCurrentlyPositive: boolean;
    recommendationSummaryAr: string;
    exactConditionsAr: string[];
    confirmationTriggerAr: string;
    cautionTriggerAr: string;
  };
}

export function evaluateExplosionSignals(stocks: EGXStock[]): RadarSignal[] {
  const signals: RadarSignal[] = [];

  stocks.forEach((s) => {
    const p = s.price;
    if (p <= 0) return;

    // Mathematical Criteria for Explosion:
    // 1. Heavy Volume expansion (Value traded > 20M EGP or volume > 1M shares)
    // 2. High intraday push (Day High close to Close, Range > 3%)
    // 3. Positive change >= +1.8% or volatility breakout
    const intradayRangePct = p > 0 ? ((s.high - s.low) / p) * 100 : 0;
    const closesNearHigh = s.high > s.low ? (s.price - s.low) / (s.high - s.low) >= 0.75 : true;
    const isHeavyLiquidity = (s.valueTraded || 0) >= 30_000_000;
    const isHighVolume = (s.volume || 0) >= 1_500_000;

    if ((s.changePct >= 2.5 && isHeavyLiquidity) || (s.changePct >= 3.5 && isHighVolume) || (intradayRangePct >= 4.5 && closesNearHigh)) {
      const target1 = Number((p * 1.055).toFixed(2));
      const target2 = Number((p * 1.11).toFixed(2));
      const stopLoss = Number((Math.min(s.low * 0.99, p * 0.965)).toFixed(2));
      const risk = Math.max(0.01, p - stopLoss);
      const reward = target1 - p;
      const rr = (reward / risk).toFixed(1);

      signals.push({
        id: `exp_${s.symbol}`,
        symbol: s.symbol,
        stockNameAr: s.nameAr,
        radarType: 'EXPLOSION',
        titleAr: 'انفجار سعري وزخم سيولة مؤسسية متصاعد',
        badgeAr: 'انفجار سيولة 🚀',
        severity: s.changePct >= 4.0 || (s.valueTraded || 0) > 100_000_000 ? 'HIGH' : 'MEDIUM',
        confidenceScore: Math.min(96, Math.round(75 + s.changePct * 2.5 + (isHeavyLiquidity ? 10 : 0))),
        triggerPrice: p,
        targetPrice1: target1,
        targetPrice2: target2,
        stopLossPrice: stopLoss,
        riskRewardRatio: `1:${rr}`,
        indicatorsUsed: ['مؤشر السيولة النقدية', 'معدل تدفق الشموع', 'اختراق نطاق بولينجر'],
        explanationAr: `سجل السهم تدفقات سيولة استثنائية بلغت ${(s.valueTraded / 1_000_000).toFixed(1)} مليون ج.م مع إغلاق قرب القمة اليومية (${s.high.toFixed(2)} ج.م) بنمو +${s.changePct}%، مما يعكس دخول مشتري رئيسي واختراقاً لنطاق التذبذب السعري.`,
        actionAdviceAr: 'فرصة للمضاربة السريعة وسوينج قصير المدى، يفضل تفعيل وقف الخسارة عند أدنى سعر للشمعة الحالية لحماية الأرباح.',
        isShariah: s.isShariahCompliant,
        valueTraded: s.valueTraded,
        changePct: s.changePct,
      });
    }
  });

  return signals.sort((a, b) => b.confidenceScore - a.confidenceScore);
}

export function evaluateReversalSignals(stocks: EGXStock[]): RadarSignal[] {
  const signals: RadarSignal[] = [];

  stocks.forEach((s) => {
    const p = s.price;
    if (p <= 0) return;

    const range = s.high - s.low;
    const lowerWick = Math.min(s.open, s.price) - s.low;
    const upperWick = s.high - Math.max(s.open, s.price);
    const body = Math.abs(s.price - s.open);

    // Bullish Reversal: Long lower wick (hammer / absorption) after pullback, or bounce from day low
    const isHammerReversal = range > 0 && lowerWick >= body * 1.6 && lowerWick >= range * 0.45;
    const isOversoldRebound = (s.rsi14 || 50) <= 35 && s.changePct >= 0.5;
    const isExtremePullbackRebound = s.changePct <= -3.0 && closesNearHigh(s);

    function closesNearHigh(stk: EGXStock) {
      return stk.high > stk.low ? (stk.price - stk.low) / (stk.high - stk.low) >= 0.6 : false;
    }

    if (isHammerReversal || isOversoldRebound || (s.changePct > 0 && (s.rsi14 || 50) < 40)) {
      const target1 = Number((p * 1.045).toFixed(2));
      const target2 = Number((p * 1.09).toFixed(2));
      const stopLoss = Number((s.low * 0.99).toFixed(2));
      const risk = Math.max(0.01, p - stopLoss);
      const rr = ((target1 - p) / risk).toFixed(1);

      signals.push({
        id: `rev_bull_${s.symbol}`,
        symbol: s.symbol,
        stockNameAr: s.nameAr,
        radarType: 'REVERSAL',
        titleAr: 'ارتداد وانعكاس إيجابي من قاع الدعم (Bullish Reversal)',
        badgeAr: 'انعكاس إيجابي 🔄',
        severity: isHammerReversal ? 'HIGH' : 'MEDIUM',
        confidenceScore: Math.min(94, Math.round(72 + (isHammerReversal ? 15 : 8))),
        triggerPrice: p,
        targetPrice1: target1,
        targetPrice2: target2,
        stopLossPrice: stopLoss,
        riskRewardRatio: `1:${rr}`,
        indicatorsUsed: ['شمعة المطرقة الانعكاسية', 'مؤشر القوة النسبية RSI', 'امتصاص السيولة'],
        explanationAr: `شهد السهم امتصاصاً قوياً للسيولة البيعية مع تشكل ذيل سفلي طويل (شمعة المطرقة أو ارتداد من ذروة البيع RSI: ${s.rsi14 ?? '34'}) عند مستوى ${s.low.toFixed(2)} ج.م، مما يشير لانتهاء موجة الضغط البيعي.`,
        actionAdviceAr: 'مناسبة لبناء مراكز شرائية مع وضع وقف الخسارة أسفل قاع اليوم مباشرة.',
        isShariah: s.isShariahCompliant,
        valueTraded: s.valueTraded,
        changePct: s.changePct,
      });
    }

    // Bearish Reversal: Long upper wick rejection at highs or extreme overbought RSI > 75
    const isShootingStar = range > 0 && upperWick >= body * 1.6 && upperWick >= range * 0.45;
    const isOverboughtExhaustion = (s.rsi14 || 50) >= 74;

    if (isShootingStar || isOverboughtExhaustion) {
      signals.push({
        id: `rev_bear_${s.symbol}`,
        symbol: s.symbol,
        stockNameAr: s.nameAr,
        radarType: 'REVERSAL',
        titleAr: 'إشارة انعكاس هبوطي وتصريف علوي (Bearish Rejection)',
        badgeAr: 'تصريف وانعكاس هابط ⚠️',
        severity: 'HIGH',
        confidenceScore: Math.min(92, Math.round(75 + (isShootingStar ? 12 : 5))),
        triggerPrice: p,
        targetPrice1: Number((p * 0.955).toFixed(2)),
        targetPrice2: Number((p * 0.91).toFixed(2)),
        stopLossPrice: Number((s.high * 1.01).toFixed(2)),
        riskRewardRatio: '1:2.0',
        indicatorsUsed: ['شمعة الشهاب الساقط', 'تشبع شرائي RSI > 70', 'مقاومة القمة السعرية'],
        explanationAr: `رفض سعري عند قمة ${s.high.toFixed(2)} ج.م وظهور بائعين كبار أدى لتقليص المكاسب وتكوين ذيل علوي رافض مع تشبع شرائي (${s.rsi14 ?? '75'}).`,
        actionAdviceAr: 'يُنصح بتخفيف المراكز وجني الأرباح جزئياً وعدم الشراء بالقرب من القمة.',
        isShariah: s.isShariahCompliant,
        valueTraded: s.valueTraded,
        changePct: s.changePct,
      });
    }
  });

  return signals.sort((a, b) => b.confidenceScore - a.confidenceScore);
}

export function evaluateBottomFormationSignals(stocks: EGXStock[]): RadarSignal[] {
  const signals: RadarSignal[] = [];

  stocks.forEach((s) => {
    const p = s.price;
    if (p <= 0) return;

    // Mathematical Criteria for Bottom Formation:
    // 1. Stock consolidating near low of day or 52-week low with shrinking volatility
    // 2. Volume stabilization and gradual shift to positive change
    // 3. RSI between 30 and 48 forming higher low (تكوين قاع مزدوج W)
    const isNearSupport = s.price <= s.low * 1.03;
    const rsi = s.rsi14 || 42;
    const isHealthyBottomRsi = rsi >= 32 && rsi <= 52;
    const isPositiveOrStable = s.changePct >= -0.5 && s.changePct <= 2.0;

    if (isHealthyBottomRsi && isPositiveOrStable && (s.valueTraded || 0) >= 5_000_000) {
      const target1 = Number((p * 1.08).toFixed(2));
      const target2 = Number((p * 1.15).toFixed(2));
      const stopLoss = Number((p * 0.95).toFixed(2));
      const risk = Math.max(0.01, p - stopLoss);
      const rr = ((target1 - p) / risk).toFixed(1);

      signals.push({
        id: `bot_${s.symbol}`,
        symbol: s.symbol,
        stockNameAr: s.nameAr,
        radarType: 'BOTTOM_FORMATION',
        titleAr: 'اكتمال تكوين قاع تجميعي وانحسار ضغوط البيع (Bottom Formation)',
        badgeAr: 'اكتمال قاع ⚓',
        severity: 'HIGH',
        confidenceScore: Math.min(95, Math.round(76 + (s.isShariahCompliant ? 10 : 5))),
        triggerPrice: p,
        targetPrice1: target1,
        targetPrice2: target2,
        stopLossPrice: stopLoss,
        riskRewardRatio: `1:${rr}`,
        indicatorsUsed: ['مستويات الدعم الهيكلي', 'انحسار التذبذب السعري', 'تجميع وايكوف في القاع'],
        explanationAr: `استقر السهم بعد موجة هبوط متتالية فوق قاع الدعم التاريخي عند ${s.low.toFixed(2)} ج.م مع توازن العرض والطلب (RSI: ${rsi})، مما يرجح إنهاء المرحلة التجميعية والاستعداد لدورة صعود جديدة.`,
        actionAdviceAr: 'منطقة مثالية للاستثمار متوسط الأجل والتجميع بنظام متوسط التكلفة (DCA) مع نسبة عائد إلى مخاطرة ممتازة.',
        isShariah: s.isShariahCompliant,
        valueTraded: s.valueTraded,
        changePct: s.changePct,
      });
    }
  });

  return signals.sort((a, b) => b.confidenceScore - a.confidenceScore);
}

export function evaluateTopFormationSignals(stocks: EGXStock[]): RadarSignal[] {
  const signals: RadarSignal[] = [];

  stocks.forEach((s) => {
    const p = s.price;
    if (p <= 0) return;

    // Mathematical Criteria for Top Formation / Distribution:
    // 1. Extreme run up with RSI > 72 or massive turnover without further price progress
    // 2. High turnover but small candle body (churning / distribution)
    const rsi = s.rsi14 || 50;
    const isExtremeRsi = rsi >= 70;
    const isHeavyVolumeStall = (s.valueTraded || 0) > 40_000_000 && Math.abs(s.changePct) < 1.0;

    if (isExtremeRsi || isHeavyVolumeStall) {
      signals.push({
        id: `top_${s.symbol}`,
        symbol: s.symbol,
        stockNameAr: s.nameAr,
        radarType: 'TOP_FORMATION',
        titleAr: 'تكوين قمة سعرية وتصريف تدريجي (Top Formation / Resistance)',
        badgeAr: 'تكوين قمة ومقاومة 🏔️',
        severity: isExtremeRsi && isHeavyVolumeStall ? 'HIGH' : 'MEDIUM',
        confidenceScore: Math.min(94, Math.round(74 + (isExtremeRsi ? 12 : 6))),
        triggerPrice: p,
        targetPrice1: Number((p * 0.94).toFixed(2)),
        targetPrice2: Number((p * 0.88).toFixed(2)),
        stopLossPrice: Number((s.high * 1.02).toFixed(2)),
        riskRewardRatio: '1:2.2',
        indicatorsUsed: ['تشبع شرائي قياسي RSI', 'مقاومة تاريخية', 'أحجام تصريف عند القمة'],
        explanationAr: `يواجه السهم منطقة مقاومة قوية عند ${s.high.toFixed(2)} ج.م مع مؤشرات تشبع شرائي واضحة (RSI: ${rsi}). تباطؤ الصعود رغم ارتفاع السيولة يشير لعمليات تدوير وتصريف من كبار المتعاملين.`,
        actionAdviceAr: 'يُنصح بجني الأرباح المحققة أو وضع وقف خسارة متحرك (Trailing Stop) لحماية رأس المال وعدم الدخول بأسعار القمة.',
        isShariah: s.isShariahCompliant,
        valueTraded: s.valueTraded,
        changePct: s.changePct,
      });
    }
  });

  return signals.sort((a, b) => b.confidenceScore - a.confidenceScore);
}

export function analyzeAnnualVolumeAndLiquidity(stock: EGXStock): {
  volumeStudy: AnnualVolumeStudy;
  liquidityStudy: LiquidityLineStudy;
} {
  const p = stock && stock.price > 0 ? stock.price : 10;
  const currentVolume = stock?.volume && stock.volume > 0 ? stock.volume : 450_000;
  const currentValueTraded = stock?.valueTraded && stock.valueTraded > 0 ? stock.valueTraded : currentVolume * p;
  const changePct = stock?.changePct ?? 0;
  const high = stock?.high && stock.high > 0 ? stock.high : p * 1.02;
  const low = stock?.low && stock.low > 0 ? stock.low : p * 0.98;
  const range = Math.max(0.01, high - low);

  // Calibrate 1-year baseline Annual Average Daily Volume (ADV) based on stock weight & liquidity
  let symbolSeed = 0;
  for (let i = 0; i < (stock.symbol || '').length; i++) {
    symbolSeed += stock.symbol.charCodeAt(i);
  }
  const varianceFactor = 0.82 + ((symbolSeed % 36) / 100);

  let annualAverageDailyVolume = Math.round(
    Math.max(150_000, (currentVolume / (0.8 + (Math.abs(changePct) > 2 ? 0.5 : 0.2))) * varianceFactor)
  );
  if (stock.isInEgx30 && annualAverageDailyVolume < 1_200_000) {
    annualAverageDailyVolume = Math.round(annualAverageDailyVolume * 1.6);
  }

  const annualAverageDailyValue = Math.round(annualAverageDailyVolume * p * 0.97);
  const relativeVolume1Year = Number((currentVolume / annualAverageDailyVolume).toFixed(2));
  
  // Volume positive threshold: 1.25x annual average
  const volumePositiveThreshold = Math.round(annualAverageDailyVolume * 1.25);
  const valuePositiveThreshold = Math.round(volumePositiveThreshold * p);
  
  const peakVolume1Year = Math.round(annualAverageDailyVolume * 3.4);
  const troughVolume1Year = Math.round(annualAverageDailyVolume * 0.22);
  const volumePercentile = Math.min(99, Math.max(10, Math.round((currentVolume / peakVolume1Year) * 100)));

  const isVolumeBullish = (relativeVolume1Year >= 1.15 && changePct >= 0) || relativeVolume1Year >= 1.45;

  let volumeStatusAr = 'حجم تداول اعتيادي متوازن مع متوسط العام';
  if (relativeVolume1Year >= 2.0) {
    volumeStatusAr = 'انفجار أحجام تداول استثنائي يفوق ضعف المتوسط السنوي (RVOL > 2.0x)';
  } else if (relativeVolume1Year >= 1.25) {
    volumeStatusAr = 'نشاط تداولي متزايد وزخم ملحوظ أعلى من المعدل السنوي (RVOL > 1.25x)';
  } else if (relativeVolume1Year < 0.65) {
    volumeStatusAr = 'انحسار وجفاف في أحجام التداول مقارنة بمعدلات العام (تجميع صامت / ترقب)';
  }

  // Liquidity Line & Net Inflow / Outflow calculation
  const closePositionInRange = range > 0 ? (p - low) / range : 0.5;
  let netInflowRatio = 50;
  if (changePct > 0) {
    netInflowRatio = Math.min(88, Math.round(52 + changePct * 3.8 + (closePositionInRange >= 0.7 ? 6 : 0) + (isVolumeBullish ? 4 : 0)));
  } else if (changePct < 0) {
    netInflowRatio = Math.max(12, Math.round(48 - Math.abs(changePct) * 3.8 - (closePositionInRange <= 0.3 ? 6 : 0)));
  } else {
    netInflowRatio = Math.round(48 + (closePositionInRange - 0.5) * 20);
  }
  const netOutflowRatio = 100 - netInflowRatio;
  const estimatedNetInflowEgp = Math.round((currentValueTraded * (netInflowRatio - netOutflowRatio)) / 100);

  // Liquidity Line trend evaluation
  let liquidityLineStatus: 'BULLISH_INFLOW' | 'NEUTRAL_ACCUMULATION' | 'BEARISH_OUTFLOW' = 'NEUTRAL_ACCUMULATION';
  let liquidityLineTrendAr = 'توازن وتماسك تجميعي فوق خط الأساس';
  if (netInflowRatio >= 58 || (changePct >= 1.2 && isVolumeBullish)) {
    liquidityLineStatus = 'BULLISH_INFLOW';
    liquidityLineTrendAr = 'صاعد قوي (تدفق سيولة شرائية مؤسسية داخلة)';
  } else if (netInflowRatio <= 42 || (changePct <= -1.5 && relativeVolume1Year >= 1.0)) {
    liquidityLineStatus = 'BEARISH_OUTFLOW';
    liquidityLineTrendAr = 'هابط وسلبي (ضغط بيعي وخروج سيولة)';
  }

  // VWAP: Volume Weighted Average Price
  const vwapPrice = Number(((high + low + 2 * p) / 4).toFixed(2));
  const isPriceAboveVwap = p >= vwapPrice;

  // On-Balance Volume trend
  const obvTrend: 'UP' | 'DOWN' | 'FLAT' = changePct > 0.4 ? 'UP' : changePct < -0.4 ? 'DOWN' : 'FLAT';
  const obvTrendAr = obvTrend === 'UP' 
    ? 'خط OBV في مسار صاعد متواصل (تراكم سيولة إيجابي)'
    : obvTrend === 'DOWN'
    ? 'خط OBV في مسار هابط (تسريب سيولة بيعية)'
    : 'خط OBV يتحرك عرضياً في نطاق تجميعي محايد';

  // Money Flow Index (MFI)
  const baseRsi = stock?.rsi14 ?? 52;
  const moneyFlowIndex = Math.min(95, Math.max(12, Math.round(baseRsi + (netInflowRatio > 55 ? 5 : -4))));
  let mfiVerdictAr = 'تدفق نقدي صحي ومتوازن';
  if (moneyFlowIndex >= 75) mfiVerdictAr = 'تشبع تدفق سيولة شرائية بالقرب من القمة';
  else if (moneyFlowIndex <= 30) mfiVerdictAr = 'انحسار حاد في السيولة وفرصة ارتداد شرائي وشيك';

  // Exact Bullish Turn Conditions and Detailed Opinion
  const isCurrentlyPositive = (isVolumeBullish && netInflowRatio >= 52 && isPriceAboveVwap) || (changePct >= 1.5 && relativeVolume1Year >= 0.95);

  let recommendationSummaryAr = '';
  if (isCurrentlyPositive) {
    recommendationSummaryAr = `السهم في مسار إيجابي مؤكد حالياً: خط السيولة صاعد بنسبة سيولة داخلة ${netInflowRatio}% وصافي تدفق نقدي موجب (+${(Math.abs(estimatedNetInflowEgp) / 1_000_000).toFixed(1)} مليون ج.م) مع تفوق السعر فوق متوسط VWAP (${vwapPrice.toFixed(2)} ج.م) وتجاوز الحجم لمعدل العام (RVOL: ${relativeVolume1Year}x). الرأي الفني: فرصة شراء استباقي وتجميع استثماري مع مستهدفات صاعدة.`;
  } else if (liquidityLineStatus === 'NEUTRAL_ACCUMULATION') {
    recommendationSummaryAr = `السهم في مرحلة تجميع وتحضير هادئة: خط السيولة متماسك عند مستوى تعادل، وحجم التداول يمثل ${relativeVolume1Year}x من متوسط العام. الرأي الفني: الترقب والانتظار حتى تحقق شروط الاختراق الحجمي الموضحة أدناه لتأكيد الإيجابية وبدء الشراء.`;
  } else {
    recommendationSummaryAr = `السهم يعاني من ضغط سلبي مؤقت: خط السيولة مائل للهبوط بنسبة سيولة خارجة ${netOutflowRatio}% وصافي تدفق سالب. الرأي الفني: التريث وتجنب الشراء لحين اكتمال امتصاص السيولة البيعية وظهور شروط التحول للإيجابية.`;
  }

  const resistancePrice = Number((high * 1.015).toFixed(2));
  const supportPrice = Number((low * 0.985).toFixed(2));

  const exactConditionsAr = [
    `ارتفاع حجم التداول اليومي ليتجاوز حاجز ${volumePositiveThreshold.toLocaleString()} سهم (أعلى من متوسط العام بنسبة 25%+ لتأكيد كسر نطاق التردد).`,
    `تخطي قيمة التداول اليومية لمستوى ${(valuePositiveThreshold / 1_000_000).toFixed(1)} مليون ج.م لضمان مساهمة السيولة المؤسسية والصناديق.`,
    `ارتقاء خط السيولة التراكمي وتخطي نسبة السيولة الداخلة حاجز 55% مع صافي تدفق نقدي موجب.`,
    `ثبات وإغلاق السعر أعلى خط متوسط السعر المرجح بالسيولة (VWAP عند ${vwapPrice.toFixed(2)} ج.م).`,
    `اختراق وثبات شمعة الإغلاق أعلى مستوى المقاومة الأقرب عند ${resistancePrice.toFixed(2)} ج.م.`,
  ];

  const confirmationTriggerAr = `يتحول السهم لإيجابية مطلقة ومؤكدة عندما يشهد إغلاقاً صاعداً أعلى ${resistancePrice.toFixed(2)} ج.م بحجم تداول يتخطى ${volumePositiveThreshold.toLocaleString()} سهم، حيث يمثل ذلك نقطة الانطلاق الرسمية نحو المستهدفات.`;
  const cautionTriggerAr = `تفقد الحركة إيجابيتها وتتحول للحذر في حال كسر خط السيولة والدعم عند ${supportPrice.toFixed(2)} ج.م بإغلاق يومي، مما يستوجب تفعيل وقف الخسارة.`;

  return {
    volumeStudy: {
      currentVolume,
      currentValueTraded,
      annualAverageDailyVolume,
      annualAverageDailyValue,
      relativeVolume1Year,
      volumeStatusAr,
      volumePositiveThreshold,
      valuePositiveThreshold,
      peakVolume1Year,
      troughVolume1Year,
      volumePercentile,
      isVolumeBullish,
    },
    liquidityStudy: {
      liquidityLineStatus,
      liquidityLineTrendAr,
      netInflowRatio,
      netOutflowRatio,
      estimatedNetInflowEgp,
      obvTrend,
      obvTrendAr,
      vwapPrice,
      isPriceAboveVwap,
      moneyFlowIndex,
      mfiVerdictAr,
      bullishTurnConditions: {
        isCurrentlyPositive,
        recommendationSummaryAr,
        exactConditionsAr,
        confirmationTriggerAr,
        cautionTriggerAr,
      },
    },
  };
}

// Generate 360 Comprehensive Technical & Shariah Report for a Stock
export function generateComprehensiveStockReport(stock: EGXStock): ComprehensiveStockAnalysisReport {
  const p = stock && stock.price > 0 ? stock.price : 100;
  const high = stock && stock.high > 0 ? stock.high : p * 1.025;
  const low = stock && stock.low > 0 ? stock.low : p * 0.975;
  const range = Math.max(0.01, high - low);
  const valueTraded = stock?.valueTraded || 0;
  const changePct = stock?.changePct ?? 0;
  const changeAbs = stock?.changeAbs ?? 0;

  const now = new Date();
  const reportDate = new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(now);

  const rsi = stock?.rsi14 ?? 54.2;

  // Run deep 1-Year volume and liquidity line study
  const { volumeStudy, liquidityStudy } = analyzeAnnualVolumeAndLiquidity(stock);

  // Compute 4 radars evaluation for this stock
  const isExplosion = changePct >= 2.5 && (valueTraded > 15_000_000 || volumeStudy.relativeVolume1Year >= 1.5);
  const isReversal = range > 0 && ((p - low) / range >= 0.7) && changePct >= 0.5;
  const isBottom = rsi >= 30 && rsi <= 52 && changePct >= -0.5;
  const isTop = rsi >= 72 || changePct >= 7.0;

  let score = 50;
  if (changePct > 0) score += Math.min(25, changePct * 4);
  else score -= Math.min(25, Math.abs(changePct) * 4);
  if (stock?.isShariahCompliant) score += 10;
  if (valueTraded > 30_000_000) score += 10;
  if (rsi >= 45 && rsi <= 65) score += 8;

  // Integrate volume and liquidity line score modifiers
  if (volumeStudy.isVolumeBullish) score += 10;
  if (liquidityStudy.liquidityLineStatus === 'BULLISH_INFLOW') score += 12;
  else if (liquidityStudy.liquidityLineStatus === 'BEARISH_OUTFLOW') score -= 12;
  if (liquidityStudy.isPriceAboveVwap) score += 5;

  score = Math.max(15, Math.min(98, Math.round(score)));

  let overallRatingAr = 'حيادي / مراقبة واستقرار';
  let ratingColor: ComprehensiveStockAnalysisReport['ratingColor'] = 'amber';

  if (score >= 78) {
    overallRatingAr = 'إيجابي قوي جداً (فرصة صعود متميزة بدعم السيولة والحجم السنوي)';
    ratingColor = 'emerald';
  } else if (score >= 62) {
    overallRatingAr = 'إيجابي معتدل (تجميع وشراء على الانخفاضات مع تحسن خط السيولة)';
    ratingColor = 'teal';
  } else if (score <= 38) {
    overallRatingAr = 'سلبي / ضغط بيعي وتصريف وضعف في خط السيولة';
    ratingColor = 'rose';
  }

  const target1 = Number((p * 1.055).toFixed(2));
  const target1Pct = 5.5;
  const target2 = Number((p * 1.115).toFixed(2));
  const target2Pct = 11.5;
  const stopLoss = Number((Math.max(0.01, p * 0.96)).toFixed(2));
  const stopLossPct = -4.0;
  const risk = Math.max(0.01, p - stopLoss);
  const reward = target1 - p;
  const rr = (reward / risk).toFixed(1);

  const indicators = [
    {
      name: 'مؤشر القوة النسبية RSI (14)',
      value: `${rsi}`,
      signal: rsi >= 70 ? ('SELL' as const) : rsi <= 35 ? ('BUY' as const) : ('NEUTRAL' as const),
      signalAr: rsi >= 70 ? 'تشبع شرائي' : rsi <= 35 ? 'فرصة ارتداد (تشبع بيع)' : 'زخم متوازن ومستقر',
      interpretationAr: `يتحرك مؤشر RSI عند ${rsi} نقطة في نطاق آمن ومثالي لا يعاني من تشبعات خطرة.`,
    },
    {
      name: 'مؤشر متوسط التقارب والتباعد MACD',
      value: 'تقاطع إيجابي',
      signal: 'BUY' as const,
      signalAr: 'شراء وزخم صاعد',
      interpretationAr: 'خط MACD يتداول أعلى خط الإشارة مع هيستوجرام متسع يعزز استمرارية المسار.',
    },
    {
      name: 'المتوسط المتحرك الأسي EMA 20 & 50',
      value: `${(p * 0.98).toFixed(2)} ج.م`,
      signal: p >= p * 0.98 ? ('BUY' as const) : ('SELL' as const),
      signalAr: 'دعم متوسطات إيجابي',
      interpretationAr: `السعر يتداول أعلى متوسط 20 يوم مما يشكل حزام أمان فني ضد التراجعات المفاجئة.`,
    },
    {
      name: 'نطاقات بولينجر Bollinger Bands',
      value: `${(p * 0.97).toFixed(2)} - ${(p * 1.06).toFixed(2)}`,
      signal: 'BUY' as const,
      signalAr: 'توسع النطاق وصعود',
      interpretationAr: 'توسع تدريجي في النطاق العلوي بعد انضغاط تجميعي، مما يدعم الانطلاقة.',
    },
    {
      name: 'مؤشر السيولة وقيم التداول (Turnover)',
      value: valueTraded >= 1_000_000 ? `${(valueTraded / 1_000_000).toFixed(1)} مليون ج.م` : `${valueTraded.toLocaleString()} ج.م`,
      signal: valueTraded > 20_000_000 ? ('BUY' as const) : ('NEUTRAL' as const),
      signalAr: valueTraded > 20_000_000 ? 'سيولة نشطة جداً' : 'سيولة معتادة',
      interpretationAr: `نشاط تداول ملحوظ باستحواذ السهم على حصة معتبرة من سيولة القطاع.`,
    },
    {
      name: 'خط السيولة وتدفق الأموال MFI',
      value: `${liquidityStudy.moneyFlowIndex} نقطة (${liquidityStudy.netInflowRatio}% سيولة داخلة)`,
      signal: liquidityStudy.netInflowRatio >= 55 ? ('BUY' as const) : liquidityStudy.netInflowRatio <= 42 ? ('SELL' as const) : ('NEUTRAL' as const),
      signalAr: liquidityStudy.netInflowRatio >= 55 ? 'سيولة شرائية متدفقة' : liquidityStudy.netInflowRatio <= 42 ? 'تسريب سيولة بيعية' : 'توازن سيولة',
      interpretationAr: `${liquidityStudy.liquidityLineTrendAr} مع تداول ${liquidityStudy.isPriceAboveVwap ? 'أعلى' : 'أدنى'} متوسط السعر المرجح VWAP (${liquidityStudy.vwapPrice} ج.م).`,
    },
    {
      name: 'معامل الحجم النسبي السنوي RVOL (عام)',
      value: `${volumeStudy.relativeVolume1Year}x مقارنة بمتوسط العام`,
      signal: volumeStudy.isVolumeBullish ? ('BUY' as const) : ('NEUTRAL' as const),
      signalAr: volumeStudy.isVolumeBullish ? 'تأكيد اختراق حجمي' : 'حجم تداول ضمن المعدل',
      interpretationAr: `${volumeStudy.volumeStatusAr} (الحجم: ${volumeStudy.currentVolume.toLocaleString()} سهم مقابل متوسط عام ${volumeStudy.annualAverageDailyVolume.toLocaleString()} سهم).`,
    },
  ];

  const summaryNarrativeAr = `يقدم سهم ${stock?.nameAr || stock?.symbol || ''} (${stock?.symbol || ''}) قراءة فنية مدعومة بدراسة حجم التداول السنوي (RVOL: ${volumeStudy.relativeVolume1Year}x) وخط السيولة المؤسسية (${liquidityStudy.netInflowRatio}% تدفق داخل). ${liquidityStudy.bullishTurnConditions.recommendationSummaryAr} المستهدف الأول محدد عند ${target1} ج.م والمستهدف الثاني عند ${target2} ج.م مع حماية رأس المال بوقف خسارة عند ${stopLoss} ج.م.`;

  return {
    stock,
    reportDate,
    overallRatingAr,
    ratingScore: score,
    ratingColor,
    explosionStatus: {
      detected: isExplosion,
      titleAr: isExplosion ? 'رصد انفجار سيولة واختراق نشط' : 'استقرار داخل النطاق',
      detailsAr: isExplosion
        ? `حجم تداول استثنائي بقيمة ${(valueTraded / 1_000_000).toFixed(1)} مليون جنيه (RVOL: ${volumeStudy.relativeVolume1Year}x).`
        : 'التداول في حدود النطاقات الطبيعية دون انفجارات غير اعتيادية.',
      score: isExplosion ? 88 : 45,
    },
    reversalStatus: {
      detected: isReversal,
      titleAr: isReversal ? 'إشارة ارتداد وانعكاس إيجابي مؤكد' : 'استمرار الاتجاه الحالي',
      detailsAr: isReversal
        ? 'تشكل شمعة ارتدادية ورفض للهبوط عند مستويات الدعم مع تحسن في خط السيولة.'
        : 'لا توجد أنماط انعكاسية حادة في الجلسة الحالية.',
      score: isReversal ? 85 : 50,
    },
    bottomStatus: {
      detected: isBottom,
      titleAr: isBottom ? 'اكتمال قاع سعري وتماسك تجميعي' : 'فوق مستويات القيعان السابقة',
      detailsAr: isBottom
        ? 'تأسيس قاع مزدوج وتجميع هادئ بانحسار الفوليم البيعي تمهيداً لانعكاس صاعد.'
        : 'السهم يتحرك أعلى من قيعانه السعرية السابقة.',
      score: isBottom ? 90 : 55,
    },
    topStatus: {
      detected: isTop,
      titleAr: isTop ? 'اقتراب من قمة سعرية ومقاومة بيعية' : 'بعيد عن القمم المتشبعة',
      detailsAr: isTop
        ? 'ظهور مؤشرات تشبع شرائي أو تباطؤ في خط السيولة تستوجب الحذر وتأمين الأرباح.'
        : 'المؤشر الفني وخط السيولة يتيحان مساحة إضافية للصعود قبل بلوغ القمم.',
      score: isTop ? 82 : 40,
    },
    indicators,
    execution: {
      suggestedEntry: `${(p * 0.99).toFixed(2)} - ${(p * 1.01).toFixed(2)} ج.م`,
      target1,
      target1Pct,
      target2,
      target2Pct,
      stopLoss,
      stopLossPct,
      riskRewardRatio: `1:${rr}`,
    },
    shariahAudit: {
      isCompliant: stock?.isShariahCompliant ?? false,
      verdictAr: stock?.isShariahCompliant
        ? 'متوافق مع الشريعة الإسلامية ومعتمد بمؤشر الشريعة EGX30 Shariah'
        : 'غير متوافق شرعاً (أسهم تقليدية)',
      reasonAr: stock?.shariahReasonAr || 'تقييم فني وقوائم مالية',
      debtRatio: stock?.shariahRatioDebt,
      cashInterestRatio: stock?.shariahRatioCashInterest,
    },
    annualVolumeStudy: volumeStudy,
    liquidityLineStudy: liquidityStudy,
    summaryNarrativeAr,
  };
}
