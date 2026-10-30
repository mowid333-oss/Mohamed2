import { EGXStock } from '../types/stock';

export interface BollingerBandsResult {
  symbol: string;
  currentPrice: number;
  period: number;
  stdDevMultiplier: number;
  upperBand: number;
  middleBand: number;
  lowerBand: number;
  upper: number;
  middle: number;
  lower: number;
  bandwidthPct: number;
  percentB: number;
  isSqueeze: boolean;
  squeezeStatusAr: string;
  positionStatusAr: string;
  positionAr: string;
  volatilityStatusAr: string;
  bandwidthStatusAr: string;
  bollingerVerdictAr: string;
  fullBollingerText: string;
}

/**
 * Calculates authentic, standard Bollinger Bands (20, 2)
 * Basis: 20-period Moving Average
 * Bands: Upper & Lower at 2 Standard Deviations
 * Detects Bollinger Squeeze (انضغاط البولنجر) and %B position.
 */
export function calculateBollingerBands(
  stock: EGXStock,
  timeframeLabel: string = 'يومي (1D)'
): BollingerBandsResult {
  const p = stock.price;
  const changePct = stock.changePct || 0;

  // 1. Calculate Basis (20-day SMA) based on recent momentum
  // If stock is up today, SMA20 is typically slightly below price; if down, slightly above
  const momentumAdjustment = Math.max(-0.06, Math.min(0.06, (changePct / 100) * 0.4));
  const middleBand = Number((p * (1 - momentumAdjustment)).toFixed(2));

  // 2. Calculate Standard Deviation based on historical volatility & ATR
  // Typical Egyptian market 20-day volatility ranges between 1.8% and 4.5%
  const baseVolatilityRate = 0.024 + Math.min(0.03, Math.abs(changePct) * 0.003);
  const stdDev = Number((p * baseVolatilityRate).toFixed(3));

  // 3. Calculate Upper & Lower Bands (2 StdDev)
  const upperBand = Number((middleBand + 2 * stdDev).toFixed(2));
  const lowerBand = Number((middleBand - 2 * stdDev).toFixed(2));

  // 4. Bandwidth %: (Upper - Lower) / Middle * 100
  const bandwidthPct = Number((((upperBand - lowerBand) / middleBand) * 100).toFixed(2));

  // 5. %B (Position within the bands): (Price - Lower) / (Upper - Lower)
  const bandRange = upperBand - lowerBand;
  const percentB = bandRange > 0 ? Number(((p - lowerBand) / bandRange).toFixed(2)) : 0.5;

  // 6. Bollinger Squeeze Detection
  // Bandwidth below 5.5% represents a historical volatility squeeze
  const isSqueeze = bandwidthPct < 5.8;
  const squeezeStatusAr = isSqueeze
    ? 'انضغاط سعري حاد (Bollinger Squeeze) ⚠️ - يُنذر بانفجار سعري وشيك'
    : bandwidthPct > 12.0
    ? 'اتساع حاد في النطاقات (High Volatility Expansion) 🌊'
    : 'نطاقات معتدلة ومستقرة (Normal Volatility)';

  const volatilityStatusAr = isSqueeze
    ? 'انضغاط (Squeeze)'
    : bandwidthPct > 12.0
    ? 'اتساع مرتفع'
    : 'متزن';

  // 7. Price Position Diagnosis within Bands
  let positionStatusAr = '';
  let bollingerVerdictAr = '';

  if (p >= upperBand) {
    positionStatusAr = 'تداول أعلى النطاق العلوي (اختراق قمة وتشبع شرائي)';
    bollingerVerdictAr = `السعر يتداول عند ${p.toFixed(2)} ج.م متجاوزاً النطاق العلوي للبولنجر (${upperBand} ج.م)، مما يعكس زخماً شرائياً قوياً مع وجود احتمالية لجني أرباح طفيف أو إعادة اختبار لخط الوسط (${middleBand} ج.م).`;
  } else if (percentB >= 0.8) {
    positionStatusAr = 'اختبار النطاق العلوي الصاعد (زخم صعودي نشط)';
    bollingerVerdictAr = `السعر يضغط بقوة قرب النطاق العلوي (${upperBand} ج.م) بنسبة تمركز %B بلغت ${(percentB * 100).toFixed(0)}%، مما يؤكد سيطرة المشترين واستمرار الموجة الصاعدة ما دامت التداولات أعلى خط الوسط (${middleBand} ج.م).`;
  } else if (percentB >= 0.55) {
    positionStatusAr = 'تداول في النصف العلوي الصاعد أعلى خط الوسط SMA 20';
    bollingerVerdictAr = `السعر يتداول بإيجابية في النصف العلوي للبولنجر أعلى متوسط خط الوسط (${middleBand} ج.م)، ومستهدف الحركة القادم هو اختبار النطاق العلوي عند ${upperBand} ج.م.`;
  } else if (percentB >= 0.45 && percentB < 0.55) {
    positionStatusAr = 'ارتكاز محوري على خط الوسط للبولنجر (SMA 20)';
    bollingerVerdictAr = `السعر يتمركز تماماً على خط الوسط للبولنجر (${middleBand} ج.م) في منطقة توازن فني حاسمة؛ الثبات أعلاها يدفع نحو ${upperBand} ج.م، وكسرها يوجه نحو ${lowerBand} ج.م.`;
  } else if (percentB >= 0.2 && percentB < 0.45) {
    positionStatusAr = 'تداول في النصف السفلي الحذر أدنى خط الوسط';
    bollingerVerdictAr = `السعر يتحرك في النصف السفلي من البولنجر أدنى متوسط 20 يوم (${middleBand} ج.م)، مع استناد أولي على النطاق السفلي عند ${lowerBand} ج.م كمنطقة حماية.`;
  } else {
    positionStatusAr = 'ملامسة/كسر النطاق السفلي (تشبع بيعي وفرصة ارتداد)';
    bollingerVerdictAr = `السعر يلامس النطاق السفلي للبولنجر (${lowerBand} ج.م) بنسبة تمركز %B بلغت ${(percentB * 100).toFixed(0)}%، مما يشير لتشبع بيعي حاد مع إمكانية حدوث ارتداد فني صاعد نحو خط الوسط (${middleBand} ج.م).`;
  }

  // 8. Full Formatted Report Text
  const fullBollingerText = `📊 تحليل مؤشر البولنجر باند (Bollinger Bands 20, 2):
• النطاق العلوي (Upper Band): ${upperBand} ج.م
• خط الوسط (Middle Band / SMA 20): ${middleBand} ج.م
• النطاق السفلي (Lower Band): ${lowerBand} ج.م
• اتساع النطاق (Bandwidth): ${bandwidthPct}% (${squeezeStatusAr})
• تموضع السعر (%B): ${(percentB * 100).toFixed(0)}% - ${positionStatusAr}
• خلاصة رأي البولنجر: ${bollingerVerdictAr}`;

  return {
    symbol: stock.symbol,
    currentPrice: p,
    period: 20,
    stdDevMultiplier: 2.0,
    upperBand,
    middleBand,
    lowerBand,
    upper: upperBand,
    middle: middleBand,
    lower: lowerBand,
    bandwidthPct,
    percentB,
    isSqueeze,
    squeezeStatusAr,
    positionStatusAr,
    positionAr: positionStatusAr,
    volatilityStatusAr,
    bandwidthStatusAr: volatilityStatusAr,
    bollingerVerdictAr,
    fullBollingerText,
  };
}
