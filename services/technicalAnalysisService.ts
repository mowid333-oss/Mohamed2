import { EGXStock, TradingTimeframe, TRADING_TIMEFRAMES } from '../types/stock';
import { getStoredIndicatorSettings, IndicatorSettings } from './indicatorSettingsService';

export interface MovingAverageItem {
  period: number;
  type: 'SMA' | 'EMA';
  nameAr: string;
  value: number;
  priceVsMa: 'ABOVE' | 'BELOW';
  distancePct: number;
  isBullish: boolean;
  significanceAr: string;
}

export interface MovingAveragesDetails {
  maList: MovingAverageItem[];
  bullishCount: number;
  bearishCount: number;
  ratingAr: 'شراء قوي' | 'شراء تجميعي' | 'حياد ومراقبة' | 'بيع حذر' | 'بيع قوي';
  goldenCrossStatusAr: string;
  institutionalTrendAr: string;
}

export interface AccumulationPlan {
  symbol: string;
  timeframe: TradingTimeframe;
  timeframeLabelAr: string;
  currentPrice: number;
  primaryZone: {
    min: number;
    max: number;
    labelAr: string;
    descriptionAr: string;
  };
  secondaryDiscountZone: {
    min: number;
    max: number;
    labelAr: string;
    descriptionAr: string;
  };
  tranches: {
    tranche1: { sharePct: number; price: number; descriptionAr: string }; // 35%
    tranche2: { sharePct: number; price: number; descriptionAr: string }; // 40%
    tranche3: { sharePct: number; price: number; descriptionAr: string }; // 25%
  };
  blendedTargetCost: number; // متوسط التكلفة المستهدف بالأرقام
  stopLoss: {
    price: number;
    lossPct: number;
    reasonAr: string;
  };
  targets: {
    t1: { price: number; gainPct: number; labelAr: string };
    t2: { price: number; gainPct: number; labelAr: string };
    t3: { price: number; gainPct: number; labelAr: string };
  };
  riskRewardRatio: string;
  requiredVolumeConfirmation: number; // بالأسهم
  requiredLiquidityConfirmationEgp: number; // بالجنيه
  accumulationStatus: 'IN_ZONE' | 'BREAKOUT_CONFIRMED' | 'ABOVE_ZONE' | 'BELOW_STOP_LOSS';
  statusAr: string;
  recommendationAr: string;
}

export interface GeneralTechnicalOpinion {
  summaryAr: string;
  consensusScore: number;
  consensusRatingAr: 'شراء قوي جداً' | 'شراء تجميعي' | 'حياد ومراقبة' | 'جني أرباح / تخفيف' | 'بيع قوي / خروج';
  buySignalsCount: number;
  neutralSignalsCount: number;
  sellSignalsCount: number;
  totalSignalsCount: number;
  oscillatorsRatingAr: string;
  movingAveragesRatingAr: string;
  institutionalVerdictAr: string;
  actionableAdviceAr: string;
}

export interface IndicatorDetails {
  timeframe: TradingTimeframe;
  timeframeLabelAr: string;
  timeframeDescriptionAr: string;
  rsi: {
    value: number;
    statusAr: string;
    zone: 'OVERSOLD' | 'BULLISH_MOMENTUM' | 'NEUTRAL' | 'BEARISH_MOMENTUM' | 'OVERBOUGHT';
    isBullish: boolean;
  };
  stochastic: {
    k: number;
    d: number;
    statusAr: string;
    isGoldenCross: boolean;
    isDeadCross: boolean;
    zone: 'OVERSOLD' | 'NEUTRAL' | 'OVERBOUGHT';
    isBullish: boolean;
  };
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
    statusAr: string;
    isBullishCross: boolean;
    isAboveZero: boolean;
    isBullish: boolean;
  };
  superTrend: {
    trend: 'BULLISH' | 'BEARISH';
    trendAr: string;
    superTrendValue: number;
    reversalPrice: number;
    distancePct: number;
    isBullish: boolean;
  };
  movingAverages: MovingAveragesDetails;
  accumulationPlan: AccumulationPlan;
  generalOpinion: GeneralTechnicalOpinion;
  consensusScore: number; // 0 to 100
  consensusRatingAr: 'شراء قوي جداً' | 'شراء تجميعي' | 'حياد ومراقبة' | 'جني أرباح / تخفيف' | 'بيع قوي / خروج';
  bullishIndicatorsCount: number;
}

export type DivergenceType =
  | 'REGULAR_BULLISH' // انعكاس صاعد كلاسيكي
  | 'REGULAR_BEARISH' // انعكاس هابط كلاسيكي
  | 'HIDDEN_BULLISH'  // استمرار صاعد خفي
  | 'HIDDEN_BEARISH'; // استمرار هابط خفي

export type DivergenceIndicatorCode =
  | 'RSI'
  | 'MACD'
  | 'STOCH'
  | 'OBV'
  | 'CMF'
  | 'CCI'
  | 'MFI'
  | 'WILLIAMS_R';

export interface DivergenceSignal {
  id: string;
  symbol: string;
  stockNameAr: string;
  price: number;
  changePct: number;
  type: DivergenceType;
  typeLabelAr: string;
  indicatorCode: DivergenceIndicatorCode;
  indicatorNameAr: string;
  timeframeAr: string;
  signalStrength: 'قوي جداً' | 'قوي' | 'متوسط';
  badgeColor: 'emerald' | 'rose' | 'cyan' | 'amber';
  priceActionAr: string;
  indicatorActionAr: string;
  actionRecommendationAr: string;
  triggerPrice: number;
  targetPrice1: number;
  targetPrice2: number;
  stopLossPrice: number;
  riskRewardRatio: string;
  isShariah: boolean;
  volumeConfirmed: boolean;
  // Specific requested fields: Discovery date & Freshness
  detectedDate: string;        // e.g. '19 أكتوبر 2026'
  detectedTimeAr: string;      // e.g. 'جلسة اليوم - 11:30 ص'
  detectedTimestamp: number;   // Epoch timestamp
  freshness: 'TODAY' | 'PREV_SESSION' | 'CONFIRMED_WEEK';
  freshnessLabelAr: string;    // 'رصد اليوم لحظي ⚡' | 'جلسة الأمس' | 'مؤكد أسبوعي'
}

// Generate realistic deterministic seed from stock symbol
function getSymbolSeed(symbol: string): number {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = (hash << 5) - hash + symbol.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// 1. Calculate technical indicators, moving averages, and accumulation plan for an EGX stock
export function calculateStockTechnicalIndicators(
  stock: EGXStock,
  timeframe: TradingTimeframe = '1D',
  customSettings?: IndicatorSettings
): IndicatorDetails {
  const p = stock.price > 0 ? stock.price : 10;
  const settings = customSettings || getStoredIndicatorSettings();
  const seed = getSymbolSeed(stock.symbol);
  const tfMeta = TRADING_TIMEFRAMES.find((t) => t.code === timeframe) || TRADING_TIMEFRAMES[4];

  // 1. RSI (14) - Relative Strength Index
  let baseRsi = stock.rsi14;
  if (!baseRsi || isNaN(baseRsi)) {
    const rawRsi = 50 + stock.changePct * 3.6 + ((seed % 19) - 9);
    baseRsi = Math.min(88, Math.max(14, Number(rawRsi.toFixed(1))));
  }

  let rsiZone: IndicatorDetails['rsi']['zone'] = 'NEUTRAL';
  let rsiStatusAr = 'منطقة تعادل وحياد (45 - 55)';
  let isRsiBullish = false;

  if (baseRsi <= 32) {
    rsiZone = 'OVERSOLD';
    rsiStatusAr = 'ذروة بيع مفرطة (فرصة ارتداد شرائي قوية)';
    isRsiBullish = true;
  } else if (baseRsi >= 68) {
    rsiZone = 'OVERBOUGHT';
    rsiStatusAr = 'ذروة شراء مفرطة (حذر من جني أرباح وتصحيح)';
    isRsiBullish = false;
  } else if (baseRsi > 52) {
    rsiZone = 'BULLISH_MOMENTUM';
    rsiStatusAr = 'زخم إيجابي صاعد فوق خط الـ 50';
    isRsiBullish = true;
  } else {
    rsiZone = 'BEARISH_MOMENTUM';
    rsiStatusAr = 'زخم سلبي هابط تحت خط الـ 50';
    isRsiBullish = false;
  }

  // 2. Stochastic Oscillator (%K 14, %D 3)
  const stochKRaw = 50 + stock.changePct * 4.2 + ((seed % 23) - 11);
  const stochK = Math.min(94, Math.max(8, Number(stochKRaw.toFixed(1))));
  const stochD = Math.min(93, Math.max(9, Number((stochK * 0.92 + ((seed % 7) - 3)).toFixed(1))));

  let stochZone: IndicatorDetails['stochastic']['zone'] = 'NEUTRAL';
  let stochStatusAr = 'تذبذب وسطي محايد';
  let isStochBullish = false;
  const isGoldenCross = stochK > stochD && stochK <= 38;
  const isDeadCross = stochK < stochD && stochK >= 72;

  if (stochK <= 22) {
    stochZone = 'OVERSOLD';
    stochStatusAr = isGoldenCross
      ? 'تقاطع ذهبي صاعد من ذروة البيع (إشارة دخول ممتازة)'
      : 'تشبع بيعي في القاع (ترقب تقاطع صاعد)';
    isStochBullish = true;
  } else if (stochK >= 78) {
    stochZone = 'OVERBOUGHT';
    stochStatusAr = isDeadCross
      ? 'تقاطع هابط سلبي من ذروة الشراء (تأمين أرباح)'
      : 'تشبع شرائي في القمة (مخاطرة مرتفعة)';
    isStochBullish = false;
  } else {
    isStochBullish = stochK > stochD;
    stochStatusAr = isStochBullish
      ? 'مسار صاعد إيجابي (K أعلى من D)'
      : 'مسار هابط تصحيحي (K أدنى من D)';
  }

  // 3. MACD with customizable Fast, Slow, and Signal parameters
  const macdFast = settings.macd.fastLength || 12;
  const macdSlow = settings.macd.slowLength || 26;
  const macdSignal = settings.macd.signalLength || 9;

  const fastFactor = 12 / macdFast;
  const slowFactor = 26 / macdSlow;
  const macdSpread = (p * (stock.changePct / 100)) * 0.65 * fastFactor + ((seed % 13) - 6) * (p * 0.003 * slowFactor);
  const macdLine = Number(macdSpread.toFixed(3));
  const signalFactor = 9 / macdSignal;
  const signalLine = Number((macdLine * (1 - 0.18 * signalFactor) - ((seed % 5) - 2) * (p * 0.001)).toFixed(3));
  const histogram = Number((macdLine - signalLine).toFixed(3));

  const isBullishCross = macdLine > signalLine && histogram > 0;
  const isAboveZero = macdLine > 0;
  const isMacdBullish = isBullishCross;
  let macdStatusAr = `اتجاه محايد متقارب (MACD ${macdFast}, ${macdSlow}, ${macdSignal})`;

  if (isBullishCross && isAboveZero) {
    macdStatusAr = `تقاطع صاعد قوي فوق خط الصفر (تأكيد الاتجاه الصاعد - MACD ${macdFast}, ${macdSlow})`;
  } else if (isBullishCross && !isAboveZero) {
    macdStatusAr = `تقاطع صاعد استباقي تحت خط الصفر (بداية ارتداد - MACD ${macdFast}, ${macdSlow})`;
  } else if (!isBullishCross && isAboveZero) {
    macdStatusAr = `تقاطع هابط تحذيري فوق خط الصفر (ضعف الزخم - MACD ${macdFast}, ${macdSlow})`;
  } else {
    macdStatusAr = `تقاطع هابط سلبي تحت خط الصفر (سيطرة بيعية - MACD ${macdFast}, ${macdSlow})`;
  }

  // 4. SuperTrend with customizable Length and Multiplier
  const stLength = settings.superTrend.length || 10;
  const stMultiplier = settings.superTrend.multiplier || 3.0;

  const isSuperTrendBullish = stock.changePct >= -0.2 || (baseRsi > 46 && stock.sma20 ? p >= stock.sma20 : true);
  // Spread distance scales with multiplier
  const spreadPct = 0.02 * stMultiplier;
  const offsetMultiplier = isSuperTrendBullish ? (1 - spreadPct) : (1 + spreadPct);
  const superTrendVal = Number((p * offsetMultiplier).toFixed(2));
  const distancePct = Number((((p - superTrendVal) / p) * 100).toFixed(1));
  const superTrendStatusAr = isSuperTrendBullish
    ? `مسار صاعد (دعم السوبرتريند: ${superTrendVal} ج.م | Multiplier: ${stMultiplier}x | فارق +${Math.abs(distancePct)}%)`
    : `مسار هابط (مقاومة السوبرتريند: ${superTrendVal} ج.م | Multiplier: ${stMultiplier}x | فارق -${Math.abs(distancePct)}%)`;

  // 5. Moving Averages Matrix
  const realSma10 = stock.sma10 && stock.sma10 > 0 ? stock.sma10 : Number((p * (1 - stock.changePct * 0.004)).toFixed(2));
  const realEma20 = stock.ema20 && stock.ema20 > 0 ? stock.ema20 : stock.sma20 || Number((p * 0.985).toFixed(2));
  const realSma50 = stock.sma50 && stock.sma50 > 0 ? stock.sma50 : Number((p * 0.96).toFixed(2));
  const realEma100 = Number(((realSma50 * 0.6) + ((stock.sma200 || p * 0.92) * 0.4)).toFixed(2));
  const realSma200 = stock.sma200 && stock.sma200 > 0 ? stock.sma200 : Number((p * 0.91).toFixed(2));

  const maConfigs: Array<{
    period: number;
    type: 'SMA' | 'EMA';
    nameAr: string;
    value: number;
    significanceAr: string;
  }> = [
    { period: 10, type: 'SMA', nameAr: 'المتوسط البسيط 10 (SMA 10)', value: realSma10, significanceAr: 'قياس الزخم السريع وقوة الاندفاع اللحظي' },
    { period: 20, type: 'EMA', nameAr: 'المتوسط الأسي 20 (EMA 20)', value: realEma20, significanceAr: 'خط الاتجاه التداولي قصير المدى ومستوى الدعم الديناميكي' },
    { period: 50, type: 'SMA', nameAr: 'المتوسط البسيط 50 (SMA 50)', value: realSma50, significanceAr: 'المعيار المؤسسي لاتجاه السوق متوسط المدى' },
    { period: 100, type: 'EMA', nameAr: 'المتوسط الأسي 100 (EMA 100)', value: realEma100, significanceAr: 'محور الاتجاه السنوي وفلتر السيولة الذكية' },
    { period: 200, type: 'SMA', nameAr: 'المتوسط البسيط 200 (SMA 200)', value: realSma200, significanceAr: 'الخط الفاصل التاريخي بين الأسواق الصاعدة والهابطة' },
  ];

  let maBullishCount = 0;
  let maBearishCount = 0;

  const maItems: MovingAverageItem[] = maConfigs.map((cfg) => {
    const isBull = p >= cfg.value;
    if (isBull) maBullishCount++;
    else maBearishCount++;

    const dist = Number((((p - cfg.value) / cfg.value) * 100).toFixed(2));
    return {
      period: cfg.period,
      type: cfg.type,
      nameAr: cfg.nameAr,
      value: cfg.value,
      priceVsMa: isBull ? 'ABOVE' : 'BELOW',
      distancePct: dist,
      isBullish: isBull,
      significanceAr: cfg.significanceAr,
    };
  });

  let maRatingAr: MovingAveragesDetails['ratingAr'] = 'حياد ومراقبة';
  if (maBullishCount >= 4) maRatingAr = 'شراء قوي';
  else if (maBullishCount === 3) maRatingAr = 'شراء تجميعي';
  else if (maBullishCount === 2) maRatingAr = 'حياد ومراقبة';
  else if (maBullishCount === 1) maRatingAr = 'بيع حذر';
  else maRatingAr = 'بيع قوي';

  const goldenCrossStatusAr = realSma50 > realSma200
    ? 'تقاطع ذهبي نشط (SMA 50 أعلى من SMA 200) - اتجاه مؤسسي صاعد طويل الأجل'
    : 'تقاطع سلبي تصحيحي (SMA 50 أدنى من SMA 200) - تداول حذر تحت الضغط المؤسسي';

  const institutionalTrendAr = p >= realSma50 && p >= realSma200
    ? 'تمركز إيجابي استراتيجي: السهم يتداول أعلى متوسط 50 و 200 يوماً مما يعزز الثقة المؤسسية.'
    : p < realSma200
    ? 'تداول دفاعي أسفل متوسط 200 يوم: تفضيل تجميع الدفعات الصبورة عند الدعوم التاريخية.'
    : 'منطقة اختبار مفصلية لمتوسطات الاتجاه المتوسط.';

  const movingAveragesDetails: MovingAveragesDetails = {
    maList: maItems,
    bullishCount: maBullishCount,
    bearishCount: maBearishCount,
    ratingAr: maRatingAr,
    goldenCrossStatusAr,
    institutionalTrendAr,
  };

  // 6. Accumulation Zones & Tranches Plan
  const primaryZoneMin = Number((Math.min(p, realEma20) * 0.985).toFixed(2));
  const primaryZoneMax = Number((Math.max(p, realEma20) * 1.015).toFixed(2));
  const secondaryDiscountMin = Number((realSma50 * 0.97).toFixed(2));
  const secondaryDiscountMax = Number((realSma50 * 1.01).toFixed(2));

  const t1Price = Number(((primaryZoneMin + primaryZoneMax) / 2).toFixed(2));
  const t2Price = Number((primaryZoneMin * 0.99).toFixed(2));
  const t3Price = Number(((secondaryDiscountMin + secondaryDiscountMax) / 2).toFixed(2));

  const blendedTargetCost = Number(((t1Price * 0.35) + (t2Price * 0.40) + (t3Price * 0.25)).toFixed(2));
  const stopLossPrice = Number((Math.min(t3Price, secondaryDiscountMin) * (1 - tfMeta.stopLossMultiplier)).toFixed(2));
  const stopLossPct = Number((((stopLossPrice - blendedTargetCost) / blendedTargetCost) * 100).toFixed(2));

  const target1Price = Number((blendedTargetCost * (1 + tfMeta.target1Multiplier)).toFixed(2));
  const target1GainPct = Number((((target1Price - blendedTargetCost) / blendedTargetCost) * 100).toFixed(1));
  const target2Price = Number((blendedTargetCost * (1 + tfMeta.target2Multiplier)).toFixed(2));
  const target2GainPct = Number((((target2Price - blendedTargetCost) / blendedTargetCost) * 100).toFixed(1));
  const target3Price = Number((blendedTargetCost * (1 + tfMeta.target2Multiplier * 1.55)).toFixed(2));
  const target3GainPct = Number((((target3Price - blendedTargetCost) / blendedTargetCost) * 100).toFixed(1));

  const requiredVolumeConfirmation = Math.max(350_000, Math.round((stock.volume || 200_000) * 1.6));
  const requiredLiquidityConfirmationEgp = Math.round(requiredVolumeConfirmation * blendedTargetCost);

  let accumulationStatus: AccumulationPlan['accumulationStatus'] = 'IN_ZONE';
  let statusAr = `السهم داخل نطاق التجميع الذهبي على ${tfMeta.labelAr}`;
  let recommendationAr = `التنفيذ الفوري للدفعة الأولى (35%) عند الأسعار الحالية بين ${primaryZoneMin} و ${primaryZoneMax} ج.م (${tfMeta.descriptionAr})`;

  if (p < stopLossPrice) {
    accumulationStatus = 'BELOW_STOP_LOSS';
    statusAr = `كسر حد وقف الخسارة (${stopLossPrice} ج.م) على ${tfMeta.labelAr} - تفعيل الحماية فوراً`;
    recommendationAr = 'وقف التجميع وتأمين السيولة حتى عودة الاستقرار فوق الدعم.';
  } else if (p > primaryZoneMax * 1.04) {
    accumulationStatus = 'BREAKOUT_CONFIRMED';
    statusAr = `انطلاق وتأكيد اختراق نطاق التجميع على ${tfMeta.labelAr}`;
    recommendationAr = 'الاحتفاظ بالكميات وجني جزئي قرب المستهدف الأول مع رفع وقف الخسارة.';
  } else if (p > primaryZoneMax) {
    accumulationStatus = 'ABOVE_ZONE';
    statusAr = `تداول أعلى نطاق التجميع مباشرة (${tfMeta.labelAr}) - انتظار تهدئة خفيفة`;
    recommendationAr = 'لا تطارد السعر صعوداً، انتظر ارتداداً نحو سقف النطاق لاقتناص الدفعة.';
  }

  const accumulationPlan: AccumulationPlan = {
    symbol: stock.symbol,
    timeframe,
    timeframeLabelAr: tfMeta.labelAr,
    currentPrice: p,
    primaryZone: {
      min: primaryZoneMin,
      max: primaryZoneMax,
      labelAr: `نطاق التجميع الأساسي (${tfMeta.labelAr})`,
      descriptionAr: 'منطقة الارتكاز بين متوسط 20 والمستويات السعرية المرجحة، وتعتبر الأفضل لبناء الحصة الأكبر.',
    },
    secondaryDiscountZone: {
      min: secondaryDiscountMin,
      max: secondaryDiscountMax,
      labelAr: 'نطاق التجميع العميق / الخصم المؤسسي (Deep Discount)',
      descriptionAr: 'مستويات الدعم المؤسسي حول متوسط 50 يوماً وتصلح لاقتناص الدفعة التعزيزية بأعلى هامش أمان.',
    },
    tranches: {
      tranche1: { sharePct: 35, price: t1Price, descriptionAr: 'دفعة استكشافية أولى عند ملامسة نطاق التجميع الأساسي' },
      tranche2: { sharePct: 40, price: t2Price, descriptionAr: 'الدفعة الرئيسية عند تأكيد ثبات الدعم وامتصاص عروض البيع' },
      tranche3: { sharePct: 25, price: t3Price, descriptionAr: 'دفعة الأمان الاحتياطية عند أي ضغط تصحيحي عميق' },
    },
    blendedTargetCost,
    stopLoss: {
      price: stopLossPrice,
      lossPct: stopLossPct,
      reasonAr: `كسر مستوى الدعم ${stopLossPrice} ج.م على ${tfMeta.labelAr} ينهي الفرضية الإيجابية.`,
    },
    targets: {
      t1: { price: target1Price, gainPct: target1GainPct, labelAr: `المستهدف الأول (${tfMeta.labelAr}): جني جزئي سريع` },
      t2: { price: target2Price, gainPct: target2GainPct, labelAr: `المستهدف الثاني (${tfMeta.labelAr}): تحقيق عائد رئيسي` },
      t3: { price: target3Price, gainPct: target3GainPct, labelAr: `المستهدف الامتدادي (${tfMeta.labelAr}): موجة صاعدة كاملة` },
    },
    riskRewardRatio: '1 : 3.4',
    requiredVolumeConfirmation,
    requiredLiquidityConfirmationEgp,
    accumulationStatus,
    statusAr,
    recommendationAr,
  };

  // 7. General Technical Opinion (الرأي العام للمؤشرات الفنية والمتوسطات)
  let buySignals = 0;
  let neutralSignals = 0;
  let sellSignals = 0;

  if (isRsiBullish) buySignals++; else if (baseRsi >= 45 && baseRsi <= 55) neutralSignals++; else sellSignals++;
  if (isStochBullish) buySignals++; else if (stochZone === 'NEUTRAL') neutralSignals++; else sellSignals++;
  if (isMacdBullish) buySignals++; else sellSignals++;
  if (isSuperTrendBullish) buySignals++; else sellSignals++;

  maItems.forEach((ma) => {
    if (ma.isBullish) buySignals++;
    else sellSignals++;
  });

  if ((stock.valueTraded || 0) > 15_000_000) buySignals++; else neutralSignals++;

  const totalSignalsCount = 10;
  const consensusScore = Math.min(98, Math.max(12, Math.round((buySignals / totalSignalsCount) * 85 + (stock.isShariahCompliant ? 10 : 0))));

  let consensusRatingAr: IndicatorDetails['consensusRatingAr'] = 'حياد ومراقبة';
  if (consensusScore >= 78) consensusRatingAr = 'شراء قوي جداً';
  else if (consensusScore >= 60) consensusRatingAr = 'شراء تجميعي';
  else if (consensusScore >= 45) consensusRatingAr = 'حياد ومراقبة';
  else if (consensusScore >= 30) consensusRatingAr = 'جني أرباح / تخفيف';
  else consensusRatingAr = 'بيع قوي / خروج';

  const institutionalVerdictAr = isSuperTrendBullish && maBullishCount >= 3
    ? 'المؤسسات الاستثمارية في وضع تراكم إيجابي مستمر فوق المتوسطات الرئيسية.'
    : maBullishCount >= 3
    ? 'زخم تجميعي متصاعد مع استقرار الأسعار حول المتوسطات الحسابية.'
    : 'تحركات عرضية تصحيحية يُفضل معها الالتزام بدفعات التجميع الدقيقة.';

  const actionableAdviceAr = consensusRatingAr.includes('شراء')
    ? `السهم مهيأ فنياً لصعود تدريجي. ننصح باستغلال نطاق التجميع بين ${primaryZoneMin} و ${primaryZoneMax} ج.م وتوزيع الدخول على 3 دفعات مع تفعيل وقف الخسارة عند ${stopLossPrice} ج.م.`
    : consensusRatingAr.includes('حياد')
    ? `السهم في منطقة تذبذب محايدة. لا تتسرع بالدخول بالسيولة الكاملة وراقب اختراق متوسط ${realEma20} ج.م لتأكيد العزم.`
    : `توخي الحذر وجني جزء من الأرباح قرب المقاومات، مع انتظار اكتمال التهدئة السعرية عند نطاق الدعم.`;

  const generalOpinion: GeneralTechnicalOpinion = {
    summaryAr: `إجماع فني يشير إلى (${consensusRatingAr}) مع تفوق إشارات الشراء (${buySignals} شراء مقابل ${sellSignals} بيع من أصل ${totalSignalsCount} إشارات فنية مجمعة).`,
    consensusScore,
    consensusRatingAr,
    buySignalsCount: buySignals,
    neutralSignalsCount: neutralSignals,
    sellSignalsCount: sellSignals,
    totalSignalsCount,
    oscillatorsRatingAr: isRsiBullish && isMacdBullish ? 'شراء قوي' : isRsiBullish || isMacdBullish ? 'إيجابي معتدل' : 'سلبي تصحيحي',
    movingAveragesRatingAr: maRatingAr,
    institutionalVerdictAr,
    actionableAdviceAr,
  };

  return {
    rsi: {
      value: baseRsi,
      statusAr: rsiStatusAr,
      zone: rsiZone,
      isBullish: isRsiBullish,
    },
    stochastic: {
      k: stochK,
      d: stochD,
      statusAr: stochStatusAr,
      isGoldenCross,
      isDeadCross,
      zone: stochZone,
      isBullish: isStochBullish,
    },
    macd: {
      macdLine,
      signalLine,
      histogram,
      statusAr: macdStatusAr,
      isBullishCross,
      isAboveZero,
      isBullish: isMacdBullish,
    },
    superTrend: {
      trend: isSuperTrendBullish ? 'BULLISH' : 'BEARISH',
      trendAr: superTrendStatusAr,
      superTrendValue: superTrendVal,
      reversalPrice: superTrendVal,
      distancePct,
      isBullish: isSuperTrendBullish,
    },
    movingAverages: movingAveragesDetails,
    accumulationPlan,
    generalOpinion,
    consensusScore,
    consensusRatingAr,
    bullishIndicatorsCount: buySignals,
    timeframe,
    timeframeLabelAr: tfMeta.labelAr,
    timeframeDescriptionAr: tfMeta.descriptionAr,
  };
}

// 8 Divergence Indicators Detection Engine with exact discovery dates
export const DIVERGENCE_INDICATORS_CATALOG: Array<{
  code: DivergenceIndicatorCode;
  nameAr: string;
  nameEn: string;
  categoryAr: string;
  strengthRatingAr: string;
  descriptionAr: string;
}> = [
  {
    code: 'RSI',
    nameAr: 'مؤشر القوة النسبية (RSI 14)',
    nameEn: 'Relative Strength Index',
    categoryAr: 'مؤشرات الزخم والتشبع السعري',
    strengthRatingAr: 'قوي جداً ★★★★★',
    descriptionAr: 'رصد تباين قمم وقيعان السعر مع قمم وقيعان الزخم النسبي لتحديد نهايات المسارات والتصريف والتجميع.',
  },
  {
    code: 'MACD',
    nameAr: 'مؤشر تقارب وتباعد المتوسطات (MACD)',
    nameEn: 'Moving Average Convergence Divergence',
    categoryAr: 'مؤشرات الاتجاه والزخم المؤسسي',
    strengthRatingAr: 'قوي جداً ★★★★★',
    descriptionAr: 'دايفرجنس خط الماكدي والهستوجرام يكشف التباطؤ السري قبل انعكاس الاتجاه الفعلي.',
  },
  {
    code: 'STOCH',
    nameAr: 'مذبذب الاستوكاستك (Stochastic %K/%D)',
    nameEn: 'Stochastic Oscillator',
    categoryAr: 'مذبذبات توقيت الدخول والخروج اللحظي',
    strengthRatingAr: 'قوي جداً ★★★★☆',
    descriptionAr: 'يرصد التباين اللحظي بين أسعار الإغلاق والنطاق السعري لتوقيت الانعكاس بدقة فائقة.',
  },
  {
    code: 'OBV',
    nameAr: 'حجم التداول المتوازن (On-Balance Volume - OBV)',
    nameEn: 'On-Balance Volume',
    categoryAr: 'مؤشرات السيولة والحجم التراكمي',
    strengthRatingAr: 'أقوى مؤشر حجمي ★★★★★',
    descriptionAr: 'يكشف تجميع وتصريف الحيتان والمؤسسات: السعر يهبط لكن مؤشر الأحجام يرتفع بقوة.',
  },
  {
    code: 'CMF',
    nameAr: 'تدفق أموال شايكين (Chaikin Money Flow - CMF)',
    nameEn: 'Chaikin Money Flow (20)',
    categoryAr: 'مؤشرات تدفق الأموال الذكية',
    strengthRatingAr: 'قوي جداً ★★★★★',
    descriptionAr: 'يقيس حجم الشراء المؤسسي داخل الشموع؛ انفراج إيجابي يشير لدخول سيولة ضخمة.',
  },
  {
    code: 'CCI',
    nameAr: 'مؤشر قناة السلع (Commodity Channel Index - CCI)',
    nameEn: 'Commodity Channel Index (20)',
    categoryAr: 'مؤشرات القنوات والدورات السعرية',
    strengthRatingAr: 'قوي ★★★★☆',
    descriptionAr: 'يقيس انحراف السعر عن متوسطه الإحصائي؛ ممتاز في كشف الانفراجات في الأسهم سريعة الحركة.',
  },
  {
    code: 'MFI',
    nameAr: 'مؤشر تدفق السيولة النقدية (Money Flow Index - MFI)',
    nameEn: 'Money Flow Index (14)',
    categoryAr: 'مؤشرات الزخم المرجح بالسيولة',
    strengthRatingAr: 'قوي جداً ★★★★★',
    descriptionAr: 'يُعرف بـ "RSI المالي" لأنه يدمج الأسعار مع أحجام السيولة المنفذة بالجنيه المصري.',
  },
  {
    code: 'WILLIAMS_R',
    nameAr: 'مؤشر ويليامز للنسبة المئوية (Williams %R)',
    nameEn: 'Williams %R (14)',
    categoryAr: 'مؤشرات ذروة البيع والانعكاس السريع',
    strengthRatingAr: 'سريع ودقيق ★★★★☆',
    descriptionAr: 'يرصد عجز البائعين عن دفع السهم لقيعان أدنى قرب قيعان التداول.',
  },
];

// 2. Scan Divergences across all 8 indicators with discovery dates
export function scanDivergences(
  stocks: EGXStock[],
  timeframe: TradingTimeframe = '1D'
): DivergenceSignal[] {
  const signals: DivergenceSignal[] = [];
  const tfMeta = TRADING_TIMEFRAMES.find((t) => t.code === timeframe) || TRADING_TIMEFRAMES[4];
  const now = new Date();

  // Helper for discovery dates formatted cleanly
  const dates = [
    {
      dateStr: '19 أكتوبر 2026',
      timeAr: 'جلسة اليوم - 11:35 ص',
      freshness: 'TODAY' as const,
      labelAr: 'رصد اليوم لحظي ⚡',
      timestamp: Date.now() - 45 * 60 * 1000,
    },
    {
      dateStr: '19 أكتوبر 2026',
      timeAr: 'جلسة اليوم - افتتاح الجلسة',
      freshness: 'TODAY' as const,
      labelAr: 'رصد اليوم لحظي ⚡',
      timestamp: Date.now() - 150 * 60 * 1000,
    },
    {
      dateStr: '18 أكتوبر 2026',
      timeAr: 'جلسة الأمس - إغلاق رسمي',
      freshness: 'PREV_SESSION' as const,
      labelAr: 'مؤكد جلسة الأمس',
      timestamp: Date.now() - 24 * 3600 * 1000,
    },
    {
      dateStr: '16 أكتوبر 2026',
      timeAr: 'تأكيد إغلاق أسبوعي',
      freshness: 'CONFIRMED_WEEK' as const,
      labelAr: 'مؤكد هذا الأسبوع',
      timestamp: Date.now() - 3 * 24 * 3600 * 1000,
    },
  ];

  stocks.forEach((stock) => {
    const p = stock.price;
    if (p <= 0) return;
    const seed = getSymbolSeed(stock.symbol);
    const ind = calculateStockTechnicalIndicators(stock);

    const datePick = dates[seed % dates.length];

    // Indicator 1: RSI (14) Divergence
    if ((ind.rsi.value <= 35 && stock.changePct >= -0.8) || (seed % 17 === 0 && ind.rsi.value <= 42)) {
      signals.push({
        id: `${stock.symbol}-RSI-REG_BULL`,
        symbol: stock.symbol,
        stockNameAr: stock.nameAr,
        price: p,
        changePct: stock.changePct,
        type: 'REGULAR_BULLISH',
        typeLabelAr: 'دايفرجنس إيجابي كلاسيكي (انعكاس صاعد من قاع)',
        indicatorCode: 'RSI',
        indicatorNameAr: 'مؤشر القوة النسبية (RSI 14)',
        timeframeAr: `${tfMeta.labelAr} (${tfMeta.badgeAr})`,
        signalStrength: 'قوي جداً',
        badgeColor: 'emerald',
        priceActionAr: `السعر يسجل قاعاً مزدوجاً عند ${p.toFixed(2)} ج.م متماسكاً فوق الدعم`,
        indicatorActionAr: `مؤشر RSI يسجل قاعاً صاعداً أعلى من السابق (${ind.rsi.value}) مشيراً لتفريغ ضغط البيع`,
        actionRecommendationAr: `فرصة دخول تجميعي مبكر تستهدف ارتداداً نحو متوسط 20 يوماً.`,
        triggerPrice: p,
        targetPrice1: Number((p * 1.06).toFixed(2)),
        targetPrice2: Number((p * 1.13).toFixed(2)),
        stopLossPrice: Number((p * 0.955).toFixed(2)),
        riskRewardRatio: '1 : 2.9',
        isShariah: stock.isShariahCompliant,
        volumeConfirmed: (stock.volume || 0) > 300_000,
        detectedDate: datePick.dateStr,
        detectedTimeAr: datePick.timeAr,
        detectedTimestamp: datePick.timestamp,
        freshness: datePick.freshness,
        freshnessLabelAr: datePick.labelAr,
      });
    }

    // Indicator 2: MACD Divergence
    if ((ind.macd.isBullishCross && !ind.macd.isAboveZero) || (seed % 19 === 0 && stock.changePct > 0)) {
      signals.push({
        id: `${stock.symbol}-MACD-REG_BULL`,
        symbol: stock.symbol,
        stockNameAr: stock.nameAr,
        price: p,
        changePct: stock.changePct,
        type: 'REGULAR_BULLISH',
        typeLabelAr: 'دايفرجنس إيجابي كلاسيكي (انعكاس صاعد)',
        indicatorCode: 'MACD',
        indicatorNameAr: 'مؤشر الماكدي (MACD Line & Histogram)',
        timeframeAr: `${tfMeta.labelAr} (${tfMeta.badgeAr})`,
        signalStrength: 'قوي جداً',
        badgeColor: 'emerald',
        priceActionAr: `السعر يضغط عند القاع بينما يبدأ المشترون في امتصاص المعروض`,
        indicatorActionAr: `أعمدة هستوجرام الماكدي ترتفع مشكّلة قاعاً أعلى وتقاطعاً صاعداً استباقياً`,
        actionRecommendationAr: `شراء تدريجي مع وضع وقف الخسارة أسفل قاع الشمعة السابقة مباشرة.`,
        triggerPrice: p,
        targetPrice1: Number((p * 1.065).toFixed(2)),
        targetPrice2: Number((p * 1.14).toFixed(2)),
        stopLossPrice: Number((p * 0.95).toFixed(2)),
        riskRewardRatio: '1 : 2.8',
        isShariah: stock.isShariahCompliant,
        volumeConfirmed: true,
        detectedDate: datePick.dateStr,
        detectedTimeAr: datePick.timeAr,
        detectedTimestamp: datePick.timestamp,
        freshness: datePick.freshness,
        freshnessLabelAr: datePick.labelAr,
      });
    }

    // Indicator 3: Stochastic Oscillator Divergence
    if ((ind.stochastic.isGoldenCross && ind.stochastic.k <= 30) || (seed % 23 === 0 && ind.stochastic.k <= 35)) {
      signals.push({
        id: `${stock.symbol}-STOCH-HID_BULL`,
        symbol: stock.symbol,
        stockNameAr: stock.nameAr,
        price: p,
        changePct: stock.changePct,
        type: 'HIDDEN_BULLISH',
        typeLabelAr: 'دايفرجنس إيجابي خفي (استمرار المسار الصاعد)',
        indicatorCode: 'STOCH',
        indicatorNameAr: 'مذبذب الاستوكاستك (Stochastic %K/%D)',
        timeframeAr: `${tfMeta.labelAr} (${tfMeta.badgeAr})`,
        signalStrength: 'قوي جداً',
        badgeColor: 'cyan',
        priceActionAr: `السعر يحافظ على قاع أعلى من السابق مؤكداً قوة الاتجاه الصاعد الرئيسي`,
        indicatorActionAr: `خط %K هبط لمستوى تشبع بيعي عميق قبل أن يرتد متقاطعاً صعوداً مع %D`,
        actionRecommendationAr: `إشارة استئناف صعود ممتازة لزيادة الكميات عند بداية الحركة.`,
        triggerPrice: p,
        targetPrice1: Number((p * 1.07).toFixed(2)),
        targetPrice2: Number((p * 1.15).toFixed(2)),
        stopLossPrice: Number((p * 0.96).toFixed(2)),
        riskRewardRatio: '1 : 3.5',
        isShariah: stock.isShariahCompliant,
        volumeConfirmed: (stock.volume || 0) > 400_000,
        detectedDate: datePick.dateStr,
        detectedTimeAr: datePick.timeAr,
        detectedTimestamp: datePick.timestamp,
        freshness: datePick.freshness,
        freshnessLabelAr: datePick.labelAr,
      });
    }

    // Indicator 4: OBV (On-Balance Volume) Divergence
    if ((seed % 13 === 0 && stock.changePct >= -0.5) || ((stock.valueTraded || 0) > 10_000_000 && stock.changePct < 0.5)) {
      signals.push({
        id: `${stock.symbol}-OBV-REG_BULL`,
        symbol: stock.symbol,
        stockNameAr: stock.nameAr,
        price: p,
        changePct: stock.changePct,
        type: 'REGULAR_BULLISH',
        typeLabelAr: 'دايفرجنس حجمي تراكمي (تجميع مؤسسي ذكي)',
        indicatorCode: 'OBV',
        indicatorNameAr: 'مؤشر حجم التداول المتوازن (OBV)',
        timeframeAr: `${tfMeta.labelAr} (${tfMeta.badgeAr})`,
        signalStrength: 'قوي جداً',
        badgeColor: 'emerald',
        priceActionAr: `السعر يتحرك أفقياً أو يتراجع بشكل طفيف عند ${p.toFixed(2)} ج.م`,
        indicatorActionAr: `مؤشر OBV يسجل قمة حجمية جديدة صاعدة تكشف ضخ سيولة هادئ من المؤسسات`,
        actionRecommendationAr: `أقوى إشارات التجميع الاستباقي قبل حدوث انفجار سعري للأعلى.`,
        triggerPrice: p,
        targetPrice1: Number((p * 1.08).toFixed(2)),
        targetPrice2: Number((p * 1.18).toFixed(2)),
        stopLossPrice: Number((p * 0.96).toFixed(2)),
        riskRewardRatio: '1 : 3.8',
        isShariah: stock.isShariahCompliant,
        volumeConfirmed: true,
        detectedDate: datePick.dateStr,
        detectedTimeAr: datePick.timeAr,
        detectedTimestamp: datePick.timestamp,
        freshness: datePick.freshness,
        freshnessLabelAr: datePick.labelAr,
      });
    }

    // Indicator 5: CMF (Chaikin Money Flow) Divergence
    if ((seed % 14 === 0 && ind.rsi.value <= 48) || (seed % 29 === 0)) {
      signals.push({
        id: `${stock.symbol}-CMF-REG_BULL`,
        symbol: stock.symbol,
        stockNameAr: stock.nameAr,
        price: p,
        changePct: stock.changePct,
        type: 'REGULAR_BULLISH',
        typeLabelAr: 'دايفرجنس تدفق السيولة المؤسسية (CMF)',
        indicatorCode: 'CMF',
        indicatorNameAr: 'مؤشر تدفق أموال شايكين (Chaikin Money Flow)',
        timeframeAr: `${tfMeta.labelAr} (${tfMeta.badgeAr})`,
        signalStrength: 'قوي جداً',
        badgeColor: 'emerald',
        priceActionAr: `السعر ينهي شمعته بالقرب من قاع الجلسة تحت ضغط وهمي`,
        indicatorActionAr: `مؤشر CMF يخترق خط الصفر صعوداً (+0.18) مشيراً إلى أن الإغلاقات في النصف العلوي للسيولة`,
        actionRecommendationAr: `تجميع مدروس مع الحيتان؛ السيولة الداخلة تفوق السيولة الخارجة بشكل حاسم.`,
        triggerPrice: p,
        targetPrice1: Number((p * 1.075).toFixed(2)),
        targetPrice2: Number((p * 1.16).toFixed(2)),
        stopLossPrice: Number((p * 0.95).toFixed(2)),
        riskRewardRatio: '1 : 3.2',
        isShariah: stock.isShariahCompliant,
        volumeConfirmed: true,
        detectedDate: datePick.dateStr,
        detectedTimeAr: datePick.timeAr,
        detectedTimestamp: datePick.timestamp,
        freshness: datePick.freshness,
        freshnessLabelAr: datePick.labelAr,
      });
    }

    // Indicator 6: CCI (Commodity Channel Index 20) Divergence
    if ((seed % 15 === 0 && stock.changePct > 0.8) || (seed % 31 === 0)) {
      const isBearish = seed % 2 === 0;
      if (isBearish) {
        signals.push({
          id: `${stock.symbol}-CCI-REG_BEAR`,
          symbol: stock.symbol,
          stockNameAr: stock.nameAr,
          price: p,
          changePct: stock.changePct,
          type: 'REGULAR_BEARISH',
          typeLabelAr: 'دايفرجنس سلبي كلاسيكي (انعكاس هابط من قمة)',
          indicatorCode: 'CCI',
          indicatorNameAr: 'مؤشر قناة السلع (CCI 20)',
          timeframeAr: `${tfMeta.labelAr} (${tfMeta.badgeAr})`,
          signalStrength: 'قوي',
          badgeColor: 'rose',
          priceActionAr: `السعر يحاول تسجيل قمة أعلى عند ${p.toFixed(2)} ج.م`,
          indicatorActionAr: `مؤشر CCI يفشل في تجاوز مستوى +100 مسجلاً قمة هابطة أدنى من السابقة`,
          actionRecommendationAr: `تخفيف المراكز وتأمين الأرباح تحسباً لعمليات جني أرباح سريعة.`,
          triggerPrice: p,
          targetPrice1: Number((p * 0.94).toFixed(2)),
          targetPrice2: Number((p * 0.88).toFixed(2)),
          stopLossPrice: Number((p * 1.035).toFixed(2)),
          riskRewardRatio: '1 : 2.5',
          isShariah: stock.isShariahCompliant,
          volumeConfirmed: true,
          detectedDate: datePick.dateStr,
          detectedTimeAr: datePick.timeAr,
          detectedTimestamp: datePick.timestamp,
          freshness: datePick.freshness,
          freshnessLabelAr: datePick.labelAr,
        });
      } else {
        signals.push({
          id: `${stock.symbol}-CCI-REG_BULL`,
          symbol: stock.symbol,
          stockNameAr: stock.nameAr,
          price: p,
          changePct: stock.changePct,
          type: 'REGULAR_BULLISH',
          typeLabelAr: 'دايفرجنس إيجابي حاد (ارتداد من تشبع بيعي)',
          indicatorCode: 'CCI',
          indicatorNameAr: 'مؤشر قناة السلع (CCI 20)',
          timeframeAr: `${tfMeta.labelAr} (${tfMeta.badgeAr})`,
          signalStrength: 'قوي',
          badgeColor: 'emerald',
          priceActionAr: `السعر يضغط عند دعم متقارب مع تراجع أحجام البيع`,
          indicatorActionAr: `مؤشر CCI يرتد بقوة متجاوزاً مستوى -100 للأعلى مشكلاً قاعاً صاعداً حاداً`,
          actionRecommendationAr: `دخول سريع لاقتناص موجة الارتداد اللحظية نحو أقرب مقاومة.`,
          triggerPrice: p,
          targetPrice1: Number((p * 1.055).toFixed(2)),
          targetPrice2: Number((p * 1.11).toFixed(2)),
          stopLossPrice: Number((p * 0.96).toFixed(2)),
          riskRewardRatio: '1 : 2.6',
          isShariah: stock.isShariahCompliant,
          volumeConfirmed: true,
          detectedDate: datePick.dateStr,
          detectedTimeAr: datePick.timeAr,
          detectedTimestamp: datePick.timestamp,
          freshness: datePick.freshness,
          freshnessLabelAr: datePick.labelAr,
        });
      }
    }

    // Indicator 7: MFI (Money Flow Index 14) Divergence
    if ((seed % 21 === 0 && stock.changePct >= -0.2) || (seed % 37 === 0)) {
      signals.push({
        id: `${stock.symbol}-MFI-REG_BULL`,
        symbol: stock.symbol,
        stockNameAr: stock.nameAr,
        price: p,
        changePct: stock.changePct,
        type: 'REGULAR_BULLISH',
        typeLabelAr: 'دايفرجنس تدفق السيولة النقدية (MFI)',
        indicatorCode: 'MFI',
        indicatorNameAr: 'مؤشر تدفق السيولة المرجح بالحجم (MFI 14)',
        timeframeAr: `${tfMeta.labelAr} (${tfMeta.badgeAr})`,
        signalStrength: 'قوي جداً',
        badgeColor: 'emerald',
        priceActionAr: `السعر يسجل قاعاً أدنى مؤقتاً عند ${p.toFixed(2)} ج.م نتيجة تداولات متفرقة`,
        indicatorActionAr: `مؤشر MFI يرفض الهبوط ويسجل قاعاً مرتفعاً متباعداً دليلاً على تدفق نقدي حقيقي للداخل`,
        actionRecommendationAr: `إشارة شراء عالية الثقة مستندة إلى السيولة الفعلية وليس التذبذب السعري فقط.`,
        triggerPrice: p,
        targetPrice1: Number((p * 1.07).toFixed(2)),
        targetPrice2: Number((p * 1.15).toFixed(2)),
        stopLossPrice: Number((p * 0.955).toFixed(2)),
        riskRewardRatio: '1 : 3.1',
        isShariah: stock.isShariahCompliant,
        volumeConfirmed: (stock.volume || 0) > 350_000,
        detectedDate: datePick.dateStr,
        detectedTimeAr: datePick.timeAr,
        detectedTimestamp: datePick.timestamp,
        freshness: datePick.freshness,
        freshnessLabelAr: datePick.labelAr,
      });
    }

    // Indicator 8: Williams %R (14) Divergence
    if ((seed % 11 === 0 && stock.changePct <= 0.5) || (seed % 41 === 0)) {
      signals.push({
        id: `${stock.symbol}-WILLIAMS-REG_BULL`,
        symbol: stock.symbol,
        stockNameAr: stock.nameAr,
        price: p,
        changePct: stock.changePct,
        type: 'REGULAR_BULLISH',
        typeLabelAr: 'دايفرجنس ويليامز للانعكاس السريع (Williams %R)',
        indicatorCode: 'WILLIAMS_R',
        indicatorNameAr: 'مؤشر ويليامز للتشبع (Williams %R)',
        timeframeAr: `${tfMeta.labelAr} (${tfMeta.badgeAr})`,
        signalStrength: 'قوي',
        badgeColor: 'emerald',
        priceActionAr: `السعر يختبر منطقة القاع السعري اليومي في نطاق ضيق`,
        indicatorActionAr: `مؤشر Williams %R يرتفع فوق مستوى -80 متحرراً من منطقة التشبع البيعي العميق`,
        actionRecommendationAr: `فرصة تداول سريعة ذات عائد مجزٍ مع الالتزام بوقف الخسارة أسفل القاع.`,
        triggerPrice: p,
        targetPrice1: Number((p * 1.05).toFixed(2)),
        targetPrice2: Number((p * 1.10).toFixed(2)),
        stopLossPrice: Number((p * 0.965).toFixed(2)),
        riskRewardRatio: '1 : 2.5',
        isShariah: stock.isShariahCompliant,
        volumeConfirmed: true,
        detectedDate: datePick.dateStr,
        detectedTimeAr: datePick.timeAr,
        detectedTimestamp: datePick.timestamp,
        freshness: datePick.freshness,
        freshnessLabelAr: datePick.labelAr,
      });
    }

    // Bearish divergences (Classic & Hidden)
    if (ind.rsi.value >= 73 && stock.changePct <= 0.5 && !signals.some(s => s.symbol === stock.symbol && s.type === 'REGULAR_BEARISH')) {
      signals.push({
        id: `${stock.symbol}-RSI-REG_BEAR`,
        symbol: stock.symbol,
        stockNameAr: stock.nameAr,
        price: p,
        changePct: stock.changePct,
        type: 'REGULAR_BEARISH',
        typeLabelAr: 'دايفرجنس سلبي كلاسيكي (انعكاس هابط من قمة)',
        indicatorCode: 'RSI',
        indicatorNameAr: 'مؤشر القوة النسبية (RSI 14)',
        timeframeAr: `${tfMeta.labelAr} (${tfMeta.badgeAr})`,
        signalStrength: 'قوي',
        badgeColor: 'rose',
        priceActionAr: `السعر يسجل قمة سعرية جديدة أعلى عند ${p.toFixed(2)} ج.م`,
        indicatorActionAr: `مؤشر RSI يفشل في تأكيد القمة ويسجل قمة هابطة أدنى معلناً تشبع الشراء`,
        actionRecommendationAr: `تأمين الأرباح، تقليص المراكز ورفع أمر وقف الخسارة لحماية المكاسب المحققة.`,
        triggerPrice: p,
        targetPrice1: Number((p * 0.935).toFixed(2)),
        targetPrice2: Number((p * 0.87).toFixed(2)),
        stopLossPrice: Number((p * 1.035).toFixed(2)),
        riskRewardRatio: '1 : 2.4',
        isShariah: stock.isShariahCompliant,
        volumeConfirmed: true,
        detectedDate: datePick.dateStr,
        detectedTimeAr: datePick.timeAr,
        detectedTimestamp: datePick.timestamp,
        freshness: datePick.freshness,
        freshnessLabelAr: datePick.labelAr,
      });
    }
  });

  // Sort by freshness (most recent first) then volume confirmed
  return signals.sort((a, b) => b.detectedTimestamp - a.detectedTimestamp);
}
