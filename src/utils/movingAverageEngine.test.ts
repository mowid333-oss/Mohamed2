import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSMA,
  calculateEMA,
  computeGlobalMovingAverages,
  detectIndicatorAlerts,
} from './movingAverageEngine';
import { GlobalMarketAsset } from '../types/globalMarket';

test('calculateSMA computes correct arithmetic mean', () => {
  const prices = [10, 20, 30, 40, 50];
  const sma3 = calculateSMA(prices, 3); // (30 + 40 + 50) / 3 = 40
  assert.equal(sma3, 40);

  const sma5 = calculateSMA(prices, 5); // (10 + 20 + 30 + 40 + 50) / 5 = 30
  assert.equal(sma5, 30);
});

test('calculateEMA applies exponential weight correctly', () => {
  const prices = [10, 12, 14, 16, 18, 20, 22];
  const ema = calculateEMA(prices, 5);
  assert.ok(ema > 15 && ema < 22, `Expected EMA between 15 and 22, got ${ema}`);
});

test('computeGlobalMovingAverages classifies Golden Cross and Bullish status', () => {
  // Generate ascending historical prices where price is well above MAs
  const history = Array.from({ length: 220 }, (_, i) => 100 + i * 0.5);
  const currentPrice = 220;
  const ma = computeGlobalMovingAverages(currentPrice, history);

  assert.equal(ma.isPriceAboveSma20, true);
  assert.equal(ma.isPriceAboveSma50, true);
  assert.equal(ma.isPriceAboveSma200, true);
  assert.equal(ma.crossoverStatus, 'BULLISH_ABOVE_MAS');
  assert.ok(ma.priceVsSma50Pct > 0);
  assert.ok(ma.priceVsSma200Pct > 0);
});

test('detectIndicatorAlerts detects price crossing above SMA 50', () => {
  const baseAsset: GlobalMarketAsset = {
    symbol: 'SPX',
    tradingViewSymbol: 'FOREXCOM:SPXUSD',
    nameAr: 'مؤشر إس آند بي 500',
    nameEn: 'S&P 500',
    category: 'INDICES',
    categoryLabelAr: 'المؤشرات العالمية',
    price: 5800,
    prevClose: 5790,
    changePct: 0.17,
    changeAbs: 10,
    high: 5810,
    low: 5780,
    open: 5790,
    unit: 'pts',
    lastUpdatedTime: '10:00:00',
    isLive: true,
    movingAverages: {
      sma20: 5780,
      sma50: 5820, // MA 50 is above price 5800
      sma100: 5750,
      sma200: 5600,
      ema20: 5790,
      ema50: 5810,
      priceVsSma20Pct: 0.3,
      priceVsSma50Pct: -0.34,
      priceVsSma200Pct: 3.5,
      isPriceAboveSma20: true,
      isPriceAboveSma50: false, // Below SMA 50 initially
      isPriceAboveSma200: true,
      crossoverStatus: 'TESTING_MA_RESIST',
      crossoverLabelAr: 'اختبار مقاومة 50 يوم',
      trendVerdictAr: 'حيادي',
      trendStrength: 'NEUTRAL',
    },
  };

  const updatedAsset: GlobalMarketAsset = {
    ...baseAsset,
    price: 5850, // Price breaks above 5820
    changePct: 1.03,
    movingAverages: {
      ...baseAsset.movingAverages,
      sma50: 5820,
      isPriceAboveSma50: true, // Now above SMA 50
    },
  };

  const alerts = detectIndicatorAlerts(baseAsset, updatedAsset, '10:05:00');
  assert.ok(alerts.length >= 1, 'Should generate alert when crossing above MA50');
  const crossAlert = alerts.find((a) => a.triggerType === 'PRICE_CROSS_ABOVE_MA50');
  assert.ok(crossAlert, 'PRICE_CROSS_ABOVE_MA50 alert must be triggered');
  assert.equal(crossAlert?.assetSymbol, 'SPX');
  assert.equal(crossAlert?.severity, 'OPPORTUNITY');
});
