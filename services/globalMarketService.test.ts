import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchLiveGlobalMarketData, GLOBAL_MARKET_REGISTRY } from './globalMarketService';

test('fetchLiveGlobalMarketData returns all registry assets with computed moving averages', async () => {
  const result = await fetchLiveGlobalMarketData();
  assert.ok(result.assets.length >= GLOBAL_MARKET_REGISTRY.length, 'Should return all registered assets');

  const spx = result.assets.find((a) => a.symbol === 'SPX');
  assert.ok(spx, 'SPX S&P 500 should exist in global assets');
  assert.ok(spx.price > 0, 'Price must be positive');
  assert.ok(spx.movingAverages.sma20 > 0, 'SMA20 must be calculated');
  assert.ok(spx.movingAverages.sma50 > 0, 'SMA50 must be calculated');
  assert.ok(spx.movingAverages.sma200 > 0, 'SMA200 must be calculated');
  assert.ok(typeof spx.movingAverages.isPriceAboveSma50 === 'boolean');
  assert.ok(spx.movingAverages.crossoverStatus.length > 0);

  const gold = result.assets.find((a) => a.symbol === 'XAUUSD');
  assert.ok(gold, 'Gold XAUUSD should exist in global assets');
  assert.ok(gold.price > 2000, 'Gold price should be reasonable');
  assert.equal(gold.category, 'COMMODITIES');
});
