/**
 * Pure Mathematical & Indicator Engine for Moving Averages (SMA / EMA) and Alert Detection
 * Decoupled from UI to allow fast deterministic unit testing.
 */

import {
  GlobalMovingAverages,
  MaCrossoverStatus,
  MarketIndicatorAlert,
  GlobalMarketAsset,
} from '../types/globalMarket';

/**
 * Calculates Simple Moving Average (SMA) for an array of numbers
 */
export function calculateSMA(prices: number[], period: number): number {
  if (!prices || prices.length === 0) return 0;
  const slice = prices.slice(-period);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return Number((sum / slice.length).toFixed(4));
}

/**
 * Calculates Exponential Moving Average (EMA) for an array of numbers
 */
export function calculateEMA(prices: number[], period: number): number {
  if (!prices || prices.length === 0) return 0;
  if (prices.length <= period) {
    return calculateSMA(prices, period);
  }

  const multiplier = 2 / (period + 1);
  // Start with SMA of first 'period' elements
  let ema = calculateSMA(prices.slice(0, period), period);

  // Apply EMA formula sequentially
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return Number(ema.toFixed(4));
}

/**
 * Generates full Moving Average suite for a given asset price and reference historical prices
 */
export function computeGlobalMovingAverages(
  currentPrice: number,
  historicalCloses: number[]
): GlobalMovingAverages {
  const allPrices = [...historicalCloses, currentPrice];

  const sma20 = calculateSMA(allPrices, 20);
  const sma50 = calculateSMA(allPrices, 50);
  const sma100 = calculateSMA(allPrices, 100);
  const sma200 = calculateSMA(allPrices, 200);
  const ema20 = calculateEMA(allPrices, 20);
  const ema50 = calculateEMA(allPrices, 50);

  const priceVsSma20Pct = sma20 > 0 ? Number((((currentPrice - sma20) / sma20) * 100).toFixed(2)) : 0;
  const priceVsSma50Pct = sma50 > 0 ? Number((((currentPrice - sma50) / sma50) * 100).toFixed(2)) : 0;
  const priceVsSma200Pct = sma200 > 0 ? Number((((currentPrice - sma200) / sma200) * 100).toFixed(2)) : 0;

  const isPriceAboveSma20 = currentPrice >= sma20;
  const isPriceAboveSma50 = currentPrice >= sma50;
  const isPriceAboveSma200 = currentPrice >= sma200;

  // Determine Crossover Status
  let crossoverStatus: MaCrossoverStatus = 'BULLISH_ABOVE_MAS';
  let crossoverLabelAr = 'أعلى من المتوسطات الرئيسية';
  let trendVerdictAr = 'اتجاه صاعد';
  let trendStrength: GlobalMovingAverages['trendStrength'] = 'BULLISH';

  const isGoldenCross = sma50 > sma200 && (historicalCloses.length >= 2 ? historicalCloses[historicalCloses.length - 1] <= sma200 : false);
  const isDeathCross = sma50 < sma200 && (historicalCloses.length >= 2 ? historicalCloses[historicalCloses.length - 1] >= sma200 : false);

  if (isGoldenCross) {
    crossoverStatus = 'GOLDEN_CROSS';
    crossoverLabelAr = 'تقاطع ذهبي تاريخي (Golden Cross: 50 فوق 200)';
    trendVerdictAr = 'إشارة شراء مؤسسية صاعدة قوية جداً';
    trendStrength = 'STRONG_BULLISH';
  } else if (isDeathCross) {
    crossoverStatus = 'DEATH_CROSS';
    crossoverLabelAr = 'تقاطع الموت الهابط (Death Cross: 50 تحت 200)';
    trendVerdictAr = 'إشارة بيع وتصحيح هابط مؤسسي';
    trendStrength = 'STRONG_BEARISH';
  } else if (isPriceAboveSma50 && isPriceAboveSma200) {
    crossoverStatus = 'BULLISH_ABOVE_MAS';
    crossoverLabelAr = 'تداول آمن أعلى متوسط 50 و 200 يوم';
    trendVerdictAr = 'المسار صاعد بقوة والدعوم محمية';
    trendStrength = 'STRONG_BULLISH';
  } else if (!isPriceAboveSma50 && !isPriceAboveSma200) {
    crossoverStatus = 'BEARISH_BELOW_MAS';
    crossoverLabelAr = 'تداول سلبي أسفل متوسط 50 و 200 يوم';
    trendVerdictAr = 'المسار هابط تحت ضغط المتوسطات';
    trendStrength = 'STRONG_BEARISH';
  } else if (isPriceAboveSma200 && !isPriceAboveSma50) {
    crossoverStatus = 'TESTING_MA_SUPPORT';
    crossoverLabelAr = 'تصحيح واختبار دعم متوسط 200 يوم';
    trendVerdictAr = 'منطقة ارتداد وترقب للدعم طويل الأجل';
    trendStrength = 'NEUTRAL';
  } else {
    crossoverStatus = 'TESTING_MA_RESIST';
    crossoverLabelAr = 'محاولة اختراق مقاومة متوسط 50/200';
    trendVerdictAr = 'تذبذب ومحاولة اختراق للمتوسط';
    trendStrength = 'NEUTRAL';
  }

  return {
    sma20,
    sma50,
    sma100,
    sma200,
    ema20,
    ema50,
    priceVsSma20Pct,
    priceVsSma50Pct,
    priceVsSma200Pct,
    isPriceAboveSma20,
    isPriceAboveSma50,
    isPriceAboveSma200,
    crossoverStatus,
    crossoverLabelAr,
    trendVerdictAr,
    trendStrength,
  };
}

/**
 * Scans for Market Indicator alerts between previous snapshot and current snapshot
 */
export function detectIndicatorAlerts(
  previousAsset: GlobalMarketAsset | undefined,
  currentAsset: GlobalMarketAsset,
  timestampStr: string = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
): MarketIndicatorAlert[] {
  const alerts: MarketIndicatorAlert[] = [];
  const now = Date.now();

  if (!previousAsset) {
    // If initial load and notable condition exists, emit one initial opportunity alert
    if (currentAsset.movingAverages.crossoverStatus === 'GOLDEN_CROSS') {
      alerts.push({
        id: `alert-${currentAsset.symbol}-golden-${now}`,
        assetSymbol: currentAsset.symbol,
        assetNameAr: currentAsset.nameAr,
        triggerType: 'MA_GOLDEN_CROSS',
        titleAr: `تقاطع ذهبي صاعد في ${currentAsset.nameAr}`,
        messageAr: `متوسط 50 يوماً يتجاوز متوسط 200 يوماً إيجابياً، السعر الحالي ${currentAsset.price.toLocaleString()} ${currentAsset.unit}`,
        currentPrice: currentAsset.price,
        referenceMaValue: currentAsset.movingAverages.sma50,
        changePct: currentAsset.changePct,
        timestamp: timestampStr,
        timestampEpoch: now,
        severity: 'OPPORTUNITY',
        badgeColor: 'emerald',
        isRead: false,
      });
    }
    return alerts;
  }

  const prevMA = previousAsset.movingAverages;
  const currMA = currentAsset.movingAverages;

  // 1. Price crossed above MA 50
  if (!prevMA.isPriceAboveSma50 && currMA.isPriceAboveSma50) {
    alerts.push({
      id: `alert-${currentAsset.symbol}-cross-up-ma50-${now}`,
      assetSymbol: currentAsset.symbol,
      assetNameAr: currentAsset.nameAr,
      triggerType: 'PRICE_CROSS_ABOVE_MA50',
      titleAr: `اختراق صاعد لمتوسط 50 يوم: ${currentAsset.nameAr}`,
      messageAr: `ارتفع السعر متجاوزاً متوسط 50 يوماً (${currMA.sma50.toLocaleString()}) مسجلاً ${currentAsset.price.toLocaleString()} ${currentAsset.unit}`,
      currentPrice: currentAsset.price,
      referenceMaValue: currMA.sma50,
      changePct: currentAsset.changePct,
      timestamp: timestampStr,
      timestampEpoch: now,
      severity: 'OPPORTUNITY',
      badgeColor: 'emerald',
      isRead: false,
    });
  }

  // 2. Price crossed below MA 50
  if (prevMA.isPriceAboveSma50 && !currMA.isPriceAboveSma50) {
    alerts.push({
      id: `alert-${currentAsset.symbol}-cross-down-ma50-${now}`,
      assetSymbol: currentAsset.symbol,
      assetNameAr: currentAsset.nameAr,
      triggerType: 'PRICE_CROSS_BELOW_MA50',
      titleAr: `كسر هابط لمتوسط 50 يوم: ${currentAsset.nameAr}`,
      messageAr: `انخفض السعر تحت متوسط 50 يوماً (${currMA.sma50.toLocaleString()}) إلى ${currentAsset.price.toLocaleString()} ${currentAsset.unit}`,
      currentPrice: currentAsset.price,
      referenceMaValue: currMA.sma50,
      changePct: currentAsset.changePct,
      timestamp: timestampStr,
      timestampEpoch: now,
      severity: 'WARNING',
      badgeColor: 'rose',
      isRead: false,
    });
  }

  // 3. Price crossed above MA 200 (Long-term Bullish breakthrough)
  if (!prevMA.isPriceAboveSma200 && currMA.isPriceAboveSma200) {
    alerts.push({
      id: `alert-${currentAsset.symbol}-cross-up-ma200-${now}`,
      assetSymbol: currentAsset.symbol,
      assetNameAr: currentAsset.nameAr,
      triggerType: 'PRICE_CROSS_ABOVE_MA200',
      titleAr: `اختراق تاريخي لمتوسط 200 يوم: ${currentAsset.nameAr}`,
      messageAr: `السعر يخترق حاجز متوسط 200 يوم الرئيسي (${currMA.sma200.toLocaleString()}) عند ${currentAsset.price.toLocaleString()} ${currentAsset.unit}`,
      currentPrice: currentAsset.price,
      referenceMaValue: currMA.sma200,
      changePct: currentAsset.changePct,
      timestamp: timestampStr,
      timestampEpoch: now,
      severity: 'OPPORTUNITY',
      badgeColor: 'emerald',
      isRead: false,
    });
  }

  // 4. Sudden index price surge (>= +0.8% delta between snapshots or overall > 1.5%)
  const priceDeltaPct = previousAsset.price > 0 ? ((currentAsset.price - previousAsset.price) / previousAsset.price) * 100 : 0;
  if (priceDeltaPct >= 0.75 || (previousAsset.changePct < 1.5 && currentAsset.changePct >= 1.5)) {
    alerts.push({
      id: `alert-${currentAsset.symbol}-surge-${now}`,
      assetSymbol: currentAsset.symbol,
      assetNameAr: currentAsset.nameAr,
      triggerType: 'INDEX_SURGE_UP',
      titleAr: `تسارع صاعد قوي في مؤشر ${currentAsset.nameAr}`,
      messageAr: `تسارع لحظي بنسبة ${currentAsset.changePct > 0 ? '+' : ''}${currentAsset.changePct.toFixed(2)}% وصولاً إلى ${currentAsset.price.toLocaleString()} ${currentAsset.unit}`,
      currentPrice: currentAsset.price,
      changePct: currentAsset.changePct,
      timestamp: timestampStr,
      timestampEpoch: now,
      severity: 'OPPORTUNITY',
      badgeColor: 'cyan',
      isRead: false,
    });
  }

  // 5. Sudden index price drop (<= -0.75% delta or overall < -1.5%)
  if (priceDeltaPct <= -0.75 || (previousAsset.changePct > -1.5 && currentAsset.changePct <= -1.5)) {
    alerts.push({
      id: `alert-${currentAsset.symbol}-drop-${now}`,
      assetSymbol: currentAsset.symbol,
      assetNameAr: currentAsset.nameAr,
      triggerType: 'INDEX_DROP_DOWN',
      titleAr: `هبوط حاد مفاجئ في مؤشر ${currentAsset.nameAr}`,
      messageAr: `تراجع لحظي بنسبة ${currentAsset.changePct.toFixed(2)}% إلى ${currentAsset.price.toLocaleString()} ${currentAsset.unit}`,
      currentPrice: currentAsset.price,
      changePct: currentAsset.changePct,
      timestamp: timestampStr,
      timestampEpoch: now,
      severity: 'CRITICAL',
      badgeColor: 'rose',
      isRead: false,
    });
  }

  return alerts;
}
