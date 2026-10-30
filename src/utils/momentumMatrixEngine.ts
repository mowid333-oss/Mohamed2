import { EGXStock, TradingTimeframe } from '../types/stock';
import { calculateStockTechnicalIndicators } from '../services/technicalAnalysisService';

export type MomentumQuadrantId =
  | 'BULLISH_EXPANSION'     // الربع الأول: زخم صاعد قوي ومؤسسي
  | 'OVERBOUGHT_RISK'       // الربع الثاني: تشبع شرائي وزخم ممتد عالي المخاطر
  | 'BOTTOM_ACCUMULATION'   // الربع الثالث: ارتداد تجميعي من القاع
  | 'BEARISH_MOMENTUM';     // الربع الرابع: زخم هابط وتصحيحي

export interface MomentumMatrixResult {
  symbol: string;
  quadrantId: MomentumQuadrantId;
  quadrantNameAr: string;
  quadrantBadge: string;
  quadrantColor: 'emerald' | 'amber' | 'cyan' | 'rose';

  // Plot Coordinates (0 to 100% for UI positioning)
  xRsi: number;              // 0 to 100
  yTrendScore: number;       // -100 to +100
  xPlotPercent: number;      // 0% to 100% (CSS left)
  yPlotPercent: number;      // 0% to 100% (CSS top, inverted)

  // Moving Average metrics
  sma50: number;
  sma200: number;
  priceVsSma50Pct: number;
  priceVsSma200Pct: number;
  goldenCrossSpreadPct: number; // (SMA 50 - SMA 200) / SMA 200 * 100
  crossStatus: 'GOLDEN_CROSS' | 'DEATH_CROSS' | 'CONVERGING';
  crossStatusAr: string;

  // RSI metrics
  rsiValue: number;
  rsiZoneAr: string;

  // Overall Momentum Diagnostic
  overallMomentumScore: number; // 0 to 100
  momentumLevelAr: string;
  actionableAdviceAr: string;
  riskRewardAr: string;
}

/**
 * High-Precision Momentum Matrix Engine for EGX Stocks
 * Maps the confluence between major Moving Averages (SMA 50, 200) and RSI 14
 */
export function calculateMomentumMatrix(
  stock: EGXStock,
  timeframe: TradingTimeframe = '1D'
): MomentumMatrixResult {
  const p = stock.price > 0 ? stock.price : 10;
  const tech = calculateStockTechnicalIndicators(stock, timeframe);

  const ma50Item = tech.movingAverages.maList.find((m) => m.period === 50) || {
    value: stock.sma50 || p * 0.96,
  };
  const ma200Item = tech.movingAverages.maList.find((m) => m.period === 200) || {
    value: stock.sma200 || p * 0.92,
  };

  const sma50 = Number(ma50Item.value.toFixed(2));
  const sma200 = Number(ma200Item.value.toFixed(2));

  const priceVsSma50Pct = Number((((p - sma50) / sma50) * 100).toFixed(2));
  const priceVsSma200Pct = Number((((p - sma200) / sma200) * 100).toFixed(2));
  const goldenCrossSpreadPct = Number((((sma50 - sma200) / sma200) * 100).toFixed(2));

  // Determine Cross Status
  let crossStatus: MomentumMatrixResult['crossStatus'] = 'CONVERGING';
  let crossStatusAr = 'تقارب وتماسك بين المتوسطات 50 و 200';

  if (sma50 > sma200 * 1.01) {
    crossStatus = 'GOLDEN_CROSS';
    crossStatusAr = `تقاطع ذهبي نشط (SMA 50 أعلى بـ ${goldenCrossSpreadPct}%) 🌟`;
  } else if (sma50 < sma200 * 0.99) {
    crossStatus = 'DEATH_CROSS';
    crossStatusAr = `تقاطع الموت تصريفي (SMA 50 أدنى بـ ${Math.abs(goldenCrossSpreadPct)}%) ⚠️`;
  } else {
    crossStatus = 'CONVERGING';
    crossStatusAr = 'تقارب حاسم واختبار مفصلي لمتوسطات 50 و 200 ⚖️';
  }

  // RSI Metrics
  const rsiValue = Math.max(5, Math.min(95, tech.rsi.value));
  let rsiZoneAr = tech.rsi.statusAr;
  if (rsiValue >= 70) rsiZoneAr = 'تشبع شرائي عالي (Overbought) ⚠️';
  else if (rsiValue >= 55) rsiZoneAr = 'زخم صاعد قوي وصحي (Bullish Momentum) 🟢';
  else if (rsiValue >= 45) rsiZoneAr = 'منطقة اتزان وحياد (Neutral Balance) ⚖️';
  else if (rsiValue >= 30) rsiZoneAr = 'زخم هابط وتصحيحي (Bearish Momentum) 🔴';
  else rsiZoneAr = 'تشبع بيعي وارتداد قاع محتمل (Oversold) 💎';

  // Calculate Y-Trend Score (-100 to +100)
  // Combines (SMA50 vs SMA200 spread) + (Price vs SMA50 distance)
  let yTrendRaw = (goldenCrossSpreadPct * 4) + (priceVsSma50Pct * 2.5);
  // Clamp between -100 and +100
  const yTrendScore = Number(Math.max(-100, Math.min(100, yTrendRaw)).toFixed(1));

  // Plot percentage coordinates for CSS (0% to 100%)
  // X: RSI (0 -> 0%, 100 -> 100%)
  const xPlotPercent = Number(Math.max(5, Math.min(95, rsiValue)).toFixed(1));
  // Y: trend score (-100 -> 95% bottom, +100 -> 5% top)
  const yPlotPercent = Number(Math.max(5, Math.min(95, 50 - (yTrendScore * 0.45))).toFixed(1));

  // Determine Quadrant Classification
  let quadrantId: MomentumQuadrantId = 'BULLISH_EXPANSION';
  let quadrantNameAr = 'الربع الأول: زخم صاعد قوي ومؤسسي';
  let quadrantBadge = 'زخم صاعد مؤسسي 🟢';
  let quadrantColor: MomentumMatrixResult['quadrantColor'] = 'emerald';
  let actionableAdviceAr = 'ركوب الاتجاه الصاعد مع الحفاظ على وقف الخسارة أسفل الدعم.';
  let riskRewardAr = 'ممتازة (مواتية لصالح المشتري)';

  if (rsiValue >= 68 && yTrendScore > 20) {
    quadrantId = 'OVERBOUGHT_RISK';
    quadrantNameAr = 'الربع الثاني: تشبع شرائي وزخم ممتد عالي المخاطر';
    quadrantBadge = 'تشبع شرائي ممتد ⚠️';
    quadrantColor = 'amber';
    actionableAdviceAr = 'جني أرباح جزئي، رفع مستويات حماية الأرباح، وتجنب الدخول الجديد في القمم.';
    riskRewardAr = 'غير متكافئة (مخاطر تصحيح مفاجئ مرتفعة)';
  } else if (rsiValue <= 42 && (priceVsSma200Pct <= 3 || rsiValue <= 35)) {
    quadrantId = 'BOTTOM_ACCUMULATION';
    quadrantNameAr = 'الربع الثالث: ارتداد تجميعي من القاع';
    quadrantBadge = 'ارتداد تجميعي 💎';
    quadrantColor = 'cyan';
    actionableAdviceAr = 'تجميع تدريجي على دفعات هادئة مع وضع وقف خسارة حاسم أسفل القاع.';
    riskRewardAr = 'عالية جداً (عائد مجزٍ مقابل مخاطرة محدودة)';
  } else if (yTrendScore < -10 || (crossStatus === 'DEATH_CROSS' && rsiValue < 50)) {
    quadrantId = 'BEARISH_MOMENTUM';
    quadrantNameAr = 'الربع الرابع: زخم هابط وتصريفي';
    quadrantBadge = 'زخم هابط وتصحيحي 🔴';
    quadrantColor = 'rose';
    actionableAdviceAr = 'تجنب الشراء والانتظار حتى انتهاء الموجة الهابطة وتشكيل نموذج انعكاس مؤكد.';
    riskRewardAr = 'سلبية (الاحتمالية الأكبر لاستمرار الهبوط)';
  } else {
    // Default: Bullish or Consolidating Expansion
    quadrantId = 'BULLISH_EXPANSION';
    quadrantNameAr = 'الربع الأول: زخم صاعد قوي ومؤسسي';
    quadrantBadge = 'زخم صاعد مؤسسي 🟢';
    quadrantColor = 'emerald';
    actionableAdviceAr = 'السهم يتمتع بقوة دفع إيجابية وتمركز سليم، مناسب للتمركز وزيادة المراكز.';
    riskRewardAr = 'إيجابية (اتجاه صاعد مدعوم بالمتوسطات)';
  }

  // Overall Momentum Score (0 to 100)
  let momentumScore = Math.round(
    (rsiValue * 0.45) +
    (Math.max(0, yTrendScore + 50) * 0.40) +
    (crossStatus === 'GOLDEN_CROSS' ? 15 : crossStatus === 'CONVERGING' ? 7 : 0)
  );
  momentumScore = Math.max(5, Math.min(99, momentumScore));

  let momentumLevelAr = 'زخم معتدل';
  if (momentumScore >= 80) momentumLevelAr = 'زخم انفجاري صاعد 🔥';
  else if (momentumScore >= 65) momentumLevelAr = 'زخم إيجابي قوي 🟢';
  else if (momentumScore >= 45) momentumLevelAr = 'زخم متوازن ومستقر ⚖️';
  else if (momentumScore >= 30) momentumLevelAr = 'زخم ضعيف تصحيحي ⚠️';
  else momentumLevelAr = 'ضغط بيعي حاد 🛑';

  return {
    symbol: stock.symbol,
    quadrantId,
    quadrantNameAr,
    quadrantBadge,
    quadrantColor,
    xRsi: rsiValue,
    yTrendScore,
    xPlotPercent,
    yPlotPercent,
    sma50,
    sma200,
    priceVsSma50Pct,
    priceVsSma200Pct,
    goldenCrossSpreadPct,
    crossStatus,
    crossStatusAr,
    rsiValue,
    rsiZoneAr,
    overallMomentumScore: momentumScore,
    momentumLevelAr,
    actionableAdviceAr,
    riskRewardAr,
  };
}
