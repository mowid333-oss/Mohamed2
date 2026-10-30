import { EGXStock, TradingTimeframe, TRADING_TIMEFRAMES } from '../types/stock';
import {
  ManagedTrade,
  PortfolioAccount,
  PortfolioSummary,
  TradeActionRecommendation,
  TradeExitReason,
} from '../types/portfolio';
import { calculateStockTechnicalIndicators } from './technicalAnalysisService';

const PORTFOLIO_STORAGE_KEY = 'egx_smart_portfolio_data_v1';

const DEFAULT_INITIAL_CAPITAL = 150000; // 150,000 EGP default

const SEED_TRADES: ManagedTrade[] = [
  {
    id: 'seed-trade-1',
    symbol: 'TMGH',
    stockNameAr: 'مجموعة طلعت مصطفى القابضة',
    sectorAr: 'العقارات',
    status: 'ACTIVE',
    timeframe: '1D',
    createdAt: '2025-02-10',
    entryDate: '2025-02-12',
    entryZoneMin: 58.0,
    entryZoneMax: 60.5,
    entryBatch1Price: 58.8,
    entryBatch1Shares: 400,
    entryBatch2Price: 60.2,
    entryBatch2Shares: 200,
    totalPlannedShares: 600,
    totalPlannedCapital: 35560,
    entryTriggerCondition: 'تأكيد الارتداد الإيجابي من مؤشر السوبرترند مع تقاطع صاعد في الماكد',
    actualEntryPrice: 59.2,
    actualShares: 600,
    initialStopLoss: 55.8,
    trailingStopLoss: 59.2,
    isBreakevenTriggered: true,
    riskAmount: 2040,
    riskPctOfCapital: 1.36,
    riskRewardRatio: 2.8,
    targets: [
      { level: 1, price: 64.2, pctGain: 8.4, exitSharePct: 50, isHit: true, hitDate: '2025-02-24' },
      { level: 2, price: 68.5, pctGain: 15.7, exitSharePct: 30, isHit: false },
      { level: 3, price: 74.0, pctGain: 25.0, exitSharePct: 20, isHit: false },
    ],
    highestPriceSinceEntry: 65.5,
    liveRecommendation: 'HOLD',
    liveAdviceAr: 'تم تحقيق الهدف الأول بنجاح وتأمين الصفقة على نقطة الدخول (Breakeven). استمر في المركز للهدف الثاني 68.50 ج.م.',
    warningFlags: ['اقتراب السهم من مقاومة فرعية عند 66.00 ج.م'],
  },
  {
    id: 'seed-trade-2',
    symbol: 'SWDY',
    stockNameAr: 'السويدي إليكتريك',
    sectorAr: 'السلع الرأسمالية والخدمات الصناعية',
    status: 'ACTIVE',
    timeframe: '4h',
    createdAt: '2025-02-18',
    entryDate: '2025-02-19',
    entryZoneMin: 62.0,
    entryZoneMax: 64.5,
    entryBatch1Price: 63.0,
    entryBatch1Shares: 300,
    entryBatch2Price: 64.2,
    entryBatch2Shares: 150,
    totalPlannedShares: 450,
    totalPlannedCapital: 28530,
    entryTriggerCondition: 'اختراق القمة السابقة مع سيولة مؤسسية متزايدة ودايفرجنس إيجابي',
    actualEntryPrice: 63.4,
    actualShares: 450,
    initialStopLoss: 60.5,
    trailingStopLoss: 61.5,
    isBreakevenTriggered: false,
    riskAmount: 1305,
    riskPctOfCapital: 0.87,
    riskRewardRatio: 3.1,
    targets: [
      { level: 1, price: 68.0, pctGain: 7.25, exitSharePct: 50, isHit: false },
      { level: 2, price: 72.5, pctGain: 14.35, exitSharePct: 30, isHit: false },
      { level: 3, price: 78.0, pctGain: 23.0, exitSharePct: 20, isHit: false },
    ],
    highestPriceSinceEntry: 65.0,
    liveRecommendation: 'HOLD',
    liveAdviceAr: 'الزخم إيجابي والاتجاه صاعد مدعوم بالمتوسطات المتحركة 20 و 50. التزم بوقف الخسارة 61.50 ج.م.',
    warningFlags: [],
  },
  {
    id: 'seed-trade-3',
    symbol: 'FWRY',
    stockNameAr: 'فوري لتكنولوجيا البنوك والمدفوعات الإلكترونية',
    sectorAr: 'خدمات التكنولوجيا والدفع',
    status: 'CLOSED',
    timeframe: '1D',
    createdAt: '2025-01-10',
    entryDate: '2025-01-12',
    exitDate: '2025-02-05',
    entryZoneMin: 7.8,
    entryZoneMax: 8.2,
    entryBatch1Price: 7.95,
    entryBatch1Shares: 2500,
    entryBatch2Price: 8.15,
    entryBatch2Shares: 1500,
    totalPlannedShares: 4000,
    totalPlannedCapital: 32100,
    entryTriggerCondition: 'ارتداد كلاسيكي من دعم فيبوناتشي 61.8% مع تشبع بيعي حاد في RSI',
    actualEntryPrice: 8.02,
    actualShares: 4000,
    initialStopLoss: 7.55,
    trailingStopLoss: 8.8,
    isBreakevenTriggered: true,
    riskAmount: 1880,
    riskPctOfCapital: 1.25,
    riskRewardRatio: 2.6,
    targets: [
      { level: 1, price: 8.65, pctGain: 7.8, exitSharePct: 50, isHit: true, hitDate: '2025-01-22' },
      { level: 2, price: 9.3, pctGain: 15.9, exitSharePct: 30, isHit: true, hitDate: '2025-02-04' },
      { level: 3, price: 9.9, pctGain: 23.4, exitSharePct: 20, isHit: false },
    ],
    exitPrice: 9.25,
    exitReason: 'TARGET_1_PARTIAL',
    realizedPnL: 4920,
    realizedPnLPct: 15.33,
    notes: 'تم جني أرباح الهدف الأول والثاني والخروج عند ظهور إشارة ضعف الزخم اليومي.',
    ratingStars: 5,
    lessonsLearned: 'الالتزام بسلم الأهداف وجني الأرباح الجزئي كان ممتازاً لحجز المكاسب قبل التصحيح.',
  },
];

export function loadPortfolioAccount(): PortfolioAccount {
  try {
    const raw = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (raw) {
      const parsed: PortfolioAccount = JSON.parse(raw);
      if (parsed && typeof parsed.initialCapital === 'number') {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse portfolio from localStorage', e);
  }

  // Initial seed
  const defaultAccount: PortfolioAccount = {
    initialCapital: DEFAULT_INITIAL_CAPITAL,
    cashBalance: 85910,
    currency: 'EGP',
    updatedAt: new Date().toISOString(),
    trades: SEED_TRADES,
    settings: {
      maxRiskPerTradePct: 2.0,
      defaultTarget1ExitPct: 50,
      autoMoveStopToBreakevenAtTarget1: true,
    },
  };
  savePortfolioAccount(defaultAccount);
  return defaultAccount;
}

export function savePortfolioAccount(account: PortfolioAccount): void {
  try {
    account.updatedAt = new Date().toISOString();
    localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(account));
  } catch (e) {
    console.error('Failed to save portfolio to localStorage', e);
  }
}

// Calculate full portfolio metrics and summaries given live market stocks
export function calculatePortfolioSummary(
  account: PortfolioAccount,
  liveStocks: EGXStock[]
): PortfolioSummary {
  const stockMap = new Map<string, EGXStock>();
  liveStocks.forEach((s) => stockMap.set(s.symbol, s));

  let investedValue = 0;
  let unrealizedPnL = 0;
  let riskExposureTotal = 0;
  const sectorValueMap = new Map<string, number>();
  const stockValueMap = new Map<string, { symbol: string; nameAr: string; value: number }>();

  let openTradesCount = 0;
  let closedTradesCount = 0;
  let winCount = 0;
  let lossCount = 0;
  let totalRealizedPnL = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let largestWin = 0;
  let largestLoss = 0;
  let sumRealizedPct = 0;

  account.trades.forEach((trade) => {
    if (trade.status === 'ACTIVE') {
      openTradesCount++;
      const live = stockMap.get(trade.symbol);
      const currentPrice = live && live.price > 0 ? live.price : trade.actualEntryPrice || 10;
      const shares = trade.actualShares || trade.totalPlannedShares;
      const currentTradeVal = shares * currentPrice;
      const costBasis = shares * (trade.actualEntryPrice || trade.entryBatch1Price);

      investedValue += currentTradeVal;
      const pnl = currentTradeVal - costBasis;
      unrealizedPnL += pnl;

      // Risk exposure = shares * (currentPrice - stopLoss)
      const currentStop = trade.trailingStopLoss || trade.initialStopLoss;
      const risk = shares * Math.max(0, currentPrice - currentStop);
      riskExposureTotal += risk;

      // Sector
      const sector = trade.sectorAr || 'أخرى';
      sectorValueMap.set(sector, (sectorValueMap.get(sector) || 0) + currentTradeVal);

      // Stock
      const existing = stockValueMap.get(trade.symbol) || {
        symbol: trade.symbol,
        nameAr: trade.stockNameAr,
        value: 0,
      };
      existing.value += currentTradeVal;
      stockValueMap.set(trade.symbol, existing);
    } else if (trade.status === 'CLOSED') {
      closedTradesCount++;
      const pnl = trade.realizedPnL || 0;
      totalRealizedPnL += pnl;
      const pct = trade.realizedPnLPct || 0;
      sumRealizedPct += pct;

      if (pnl > 0) {
        winCount++;
        grossProfit += pnl;
        if (pnl > largestWin) largestWin = pnl;
      } else if (pnl < 0) {
        lossCount++;
        grossLoss += Math.abs(pnl);
        if (pnl < largestLoss) largestLoss = pnl;
      }
    }
  });

  const cashBalance = account.cashBalance;
  const totalEquity = cashBalance + investedValue;
  const cashPct = totalEquity > 0 ? Number(((cashBalance / totalEquity) * 100).toFixed(1)) : 100;
  const investedPct = totalEquity > 0 ? Number(((investedValue / totalEquity) * 100).toFixed(1)) : 0;

  const unrealizedPnLPct =
    investedValue - unrealizedPnL > 0
      ? Number(((unrealizedPnL / (investedValue - unrealizedPnL)) * 100).toFixed(2))
      : 0;

  const realizedPnLPct =
    account.initialCapital > 0
      ? Number(((totalRealizedPnL / account.initialCapital) * 100).toFixed(2))
      : 0;

  const totalPnL = unrealizedPnL + totalRealizedPnL;
  const totalPnLPct =
    account.initialCapital > 0
      ? Number(((totalPnL / account.initialCapital) * 100).toFixed(2))
      : 0;

  const winRatePct =
    closedTradesCount > 0 ? Number(((winCount / closedTradesCount) * 100).toFixed(1)) : 0;

  const profitFactor =
    grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 99.9 : 0;

  const averageTradePnLPct =
    closedTradesCount > 0 ? Number((sumRealizedPct / closedTradesCount).toFixed(2)) : 0;

  // Sector breakdown
  const sectorAllocation = Array.from(sectorValueMap.entries()).map(([sector, val]) => ({
    sector,
    value: Math.round(val),
    pct: totalEquity > 0 ? Number(((val / totalEquity) * 100).toFixed(1)) : 0,
  }));

  // Top concentrated stocks (> 20% of equity)
  const topOverconcentratedStocks = Array.from(stockValueMap.values())
    .map((s) => ({
      symbol: s.symbol,
      nameAr: s.nameAr,
      pctOfEquity: totalEquity > 0 ? Number(((s.value / totalEquity) * 100).toFixed(1)) : 0,
    }))
    .filter((s) => s.pctOfEquity >= 15)
    .sort((a, b) => b.pctOfEquity - a.pctOfEquity);

  const riskExposurePct =
    totalEquity > 0 ? Number(((riskExposureTotal / totalEquity) * 100).toFixed(2)) : 0;

  return {
    initialCapital: account.initialCapital,
    totalEquity: Math.round(totalEquity),
    cashBalance: Math.round(cashBalance),
    investedValue: Math.round(investedValue),
    cashPct,
    investedPct,
    unrealizedPnL: Math.round(unrealizedPnL),
    unrealizedPnLPct,
    realizedPnL: Math.round(totalRealizedPnL),
    realizedPnLPct,
    totalPnL: Math.round(totalPnL),
    totalPnLPct,
    openTradesCount,
    closedTradesCount,
    winCount,
    lossCount,
    winRatePct,
    profitFactor,
    largestWin: Math.round(largestWin),
    largestLoss: Math.round(largestLoss),
    averageTradePnLPct,
    sectorAllocation,
    riskExposurePct,
    topOverconcentratedStocks,
  };
}

// Automatically generate a full Smart Trade Plan with position sizing, scale-in batches, stops, targets, and triggers
export function generateSmartTradePlan(
  stock: EGXStock,
  timeframe: TradingTimeframe,
  totalCapital: number,
  maxRiskPct: number = 2.0
): ManagedTrade {
  const p = stock.price > 0 ? stock.price : 10;
  const indicators = calculateStockTechnicalIndicators(stock, timeframe);
  const tfMeta = TRADING_TIMEFRAMES.find((t) => t.code === timeframe) || TRADING_TIMEFRAMES[4];

  // 1. Entry zones & batches
  // Batch 1: at current market price or slight pullback (60% of planned position)
  // Batch 2: at breakout confirmation or secondary dip (40% of planned position)
  const entryBatch1Price = Number(p.toFixed(2));
  const entryBatch2Price = Number((p * (1 + tfMeta.target1Multiplier * 0.35)).toFixed(2));
  const entryZoneMin = Number((p * 0.985).toFixed(2));
  const entryZoneMax = Number((p * 1.015).toFixed(2));

  // 2. Stop loss & Risk Calculation
  // Stop loss from indicator's recommended stopLoss or ATR
  const stopLoss = Number(
    (indicators.accumulationPlan.stopLoss?.price && indicators.accumulationPlan.stopLoss.price > 0
      ? indicators.accumulationPlan.stopLoss.price
      : p * (1 - tfMeta.stopLossMultiplier)
    ).toFixed(2)
  );

  const priceRiskPerShare = Math.max(0.05, entryBatch1Price - stopLoss);

  // Position Sizing: Risk Amount = Total Capital * (Risk % / 100)
  const maxRiskAmount = totalCapital * (maxRiskPct / 100);
  const rawShares = Math.floor(maxRiskAmount / priceRiskPerShare);
  const safeShares = Math.max(10, Math.min(rawShares, Math.floor((totalCapital * 0.3) / p))); // cap at 30% of total capital

  const batch1Shares = Math.round(safeShares * 0.6);
  const batch2Shares = safeShares - batch1Shares;
  const totalPlannedCapital = Number((batch1Shares * entryBatch1Price + batch2Shares * entryBatch2Price).toFixed(0));

  // 3. Targets Ladder (1, 2, 3)
  const t1Price = Number((p * (1 + tfMeta.target1Multiplier)).toFixed(2));
  const t2Price = Number((p * (1 + tfMeta.target2Multiplier)).toFixed(2));
  const t3Price = Number((p * (1 + tfMeta.target2Multiplier * 1.55)).toFixed(2));

  const t1Gain = Number(((tfMeta.target1Multiplier) * 100).toFixed(1));
  const t2Gain = Number(((tfMeta.target2Multiplier) * 100).toFixed(1));
  const t3Gain = Number(((tfMeta.target2Multiplier * 1.55) * 100).toFixed(1));

  const avgGain = (t1Gain * 0.5 + t2Gain * 0.3 + t3Gain * 0.2);
  const riskPct = ((entryBatch1Price - stopLoss) / entryBatch1Price) * 100;
  const riskReward = Number((avgGain / (riskPct > 0 ? riskPct : 1)).toFixed(2));

  // 4. Trigger Condition in Arabic
  const triggers: string[] = [];
  if (indicators.superTrend.isBullish) {
    triggers.push(`استمرار السهم أعلى دعوم السوبر ترند (${indicators.superTrend.superTrendValue.toFixed(2)} ج.م)`);
  }
  if (indicators.stochastic.isBullish) {
    triggers.push('تأكيد تقاطع استوكاستيك الإيجابي');
  }
  if (indicators.macd.isBullish) {
    triggers.push('زخم الماكد الإيجابي فوق خط الإشارة');
  }
  if (triggers.length === 0) {
    triggers.push('تأكيد اختراق القمة اللحظية مع ارتفاع أحجام التداول');
  }
  const entryTriggerCondition = triggers.join(' + ');

  const tradeId = `trade-${Date.now()}-${stock.symbol}`;

  return {
    id: tradeId,
    symbol: stock.symbol,
    stockNameAr: stock.nameAr,
    sectorAr: stock.sectorAr || 'عام',
    status: 'PLANNED',
    timeframe,
    createdAt: new Date().toISOString().split('T')[0],
    entryZoneMin,
    entryZoneMax,
    entryBatch1Price,
    entryBatch1Shares: batch1Shares,
    entryBatch2Price,
    entryBatch2Shares: batch2Shares,
    totalPlannedShares: safeShares,
    totalPlannedCapital,
    entryTriggerCondition,
    initialStopLoss: stopLoss,
    trailingStopLoss: stopLoss,
    isBreakevenTriggered: false,
    riskAmount: Number((safeShares * priceRiskPerShare).toFixed(0)),
    riskPctOfCapital: maxRiskPct,
    riskRewardRatio: riskReward,
    targets: [
      { level: 1, price: t1Price, pctGain: t1Gain, exitSharePct: 50, isHit: false },
      { level: 2, price: t2Price, pctGain: t2Gain, exitSharePct: 30, isHit: false },
      { level: 3, price: t3Price, pctGain: t3Gain, exitSharePct: 20, isHit: false },
    ],
    liveRecommendation: 'HOLD',
    liveAdviceAr: 'الصفقة في مرحلة التخطيط المسبق. انتظر تحقيق شرط الدخول والتنفيذ في نطاق الدخول المحدد.',
    warningFlags: [],
  };
}

// Evaluate active trade against live price and indicators
export function evaluateLiveTrade(
  trade: ManagedTrade,
  liveStock?: EGXStock
): ManagedTrade {
  if (trade.status !== 'ACTIVE' || !liveStock) return trade;

  const currentPrice = liveStock.price;
  if (!currentPrice || currentPrice <= 0) return trade;

  const updated = { ...trade };
  const entry = updated.actualEntryPrice || updated.entryBatch1Price;

  // Track highest price
  const highest = Math.max(updated.highestPriceSinceEntry || entry, currentPrice);
  updated.highestPriceSinceEntry = highest;

  const targets = [...updated.targets];
  let recommendation: TradeActionRecommendation = 'HOLD';
  const adviceList: string[] = [];
  const warnings: string[] = [];

  // Check Target 1
  if (currentPrice >= targets[0].price && !targets[0].isHit) {
    targets[0].isHit = true;
    targets[0].hitDate = new Date().toISOString().split('T')[0];
    // Automatically trigger Breakeven move
    updated.isBreakevenTriggered = true;
    updated.trailingStopLoss = Math.max(updated.trailingStopLoss, entry);
    recommendation = 'TAKE_PARTIAL_PROFIT';
    adviceList.push(
      `🎯 مبروك! تم تحقيق الهدف الأول عند ${targets[0].price.toFixed(2)} ج.م (+${targets[0].pctGain}%). قم بجني أرباح 50% من الكمية ونقل الوقف إلى سعر الدخول ${entry.toFixed(2)} ج.م لتأمين الصفقة بالكامل خالية من المخاطر!`
    );
  }

  // Check Target 2
  if (currentPrice >= targets[1].price && !targets[1].isHit) {
    targets[1].isHit = true;
    targets[1].hitDate = new Date().toISOString().split('T')[0];
    updated.trailingStopLoss = Math.max(updated.trailingStopLoss, targets[0].price);
    recommendation = 'TAKE_PARTIAL_PROFIT';
    adviceList.push(
      `🚀 تم تحقيق الهدف الثاني عند ${targets[1].price.toFixed(2)} ج.م (+${targets[1].pctGain}%). جني 30% إضافية ورفع الوقف المتحرك إلى ${targets[0].price.toFixed(2)} ج.م لحماية المكاسب.`
    );
  }

  // Check Target 3
  if (currentPrice >= targets[2].price && !targets[2].isHit) {
    targets[2].isHit = true;
    targets[2].hitDate = new Date().toISOString().split('T')[0];
    recommendation = 'EXIT_FULL';
    adviceList.push(
      `🏆 تم الوصول إلى الهدف الثالث والأخير ${targets[2].price.toFixed(2)} ج.م (+${targets[2].pctGain}%). يوصى بإغلاق الصفقة بالكامل وحصد الأرباح الممتازة!`
    );
  }

  // Stop loss violation
  if (currentPrice <= updated.trailingStopLoss) {
    recommendation = 'EXIT_FULL';
    adviceList.push(
      `⚠️ كسر وقف الخسارة المتحرك عند ${updated.trailingStopLoss.toFixed(2)} ج.م. التزم بقواعد التداول وأغلق المركز فوراً لحماية رأس المال من المزيد من التراجع.`
    );
    warnings.push('السعر الحالي كسر مستوى وقف الخسارة المحدد');
  }

  // Check technical indicators for warnings
  if (liveStock.changePct <= -3.0) {
    warnings.push(`هبوط يومي حاد في السهم (${liveStock.changePct.toFixed(2)}%) مصحوب بضغط بيعي`);
  }

  updated.targets = targets;
  updated.liveRecommendation = recommendation;
  updated.liveAdviceAr = adviceList.length > 0
    ? adviceList.join(' | ')
    : updated.isBreakevenTriggered
    ? `الصفقة مؤمنة بربح فوق نقطة الدخول. السهم يتداول عند ${currentPrice.toFixed(2)} ج.م. استمر مع الاتجاه نحو الهدف التالي.`
    : `الصفقة نشطة وتتداول عند ${currentPrice.toFixed(2)} ج.م. الوقف محدد عند ${updated.trailingStopLoss.toFixed(2)} ج.م.`;
  updated.warningFlags = warnings;

  return updated;
}

// Generate formatted Arabic text report for clipboard copying
export function generatePortfolioAiReportText(
  summary: PortfolioSummary,
  account: PortfolioAccount,
  stocks: EGXStock[]
): string {
  const dateStr = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const activeTrades = account.trades.filter((t) => t.status === 'ACTIVE');
  const closedTrades = account.trades.filter((t) => t.status === 'CLOSED');

  return `📊 *تقرير حالة المحفظة وسجل التداول الذكي - رادار البورصة المصرية EGX*
📅 التاريخ: ${dateStr}

💼 *المؤشرات المالية الكلية للمحفظة:*
• رأس المال الابتدائي المودع: ${summary.initialCapital.toLocaleString('ar-EG')} ج.م
• إجمالي قيمة المحفظة (Equity): ${summary.totalEquity.toLocaleString('ar-EG')} ج.م
• السيولة النقدية المتاحة (Cash): ${summary.cashBalance.toLocaleString('ar-EG')} ج.م (${summary.cashPct}%)
• القيمة المستثمرة في الأسهم: ${summary.investedValue.toLocaleString('ar-EG')} ج.م (${summary.investedPct}%)
• الأرباح/الخسائر غير المحققة (العائمة): ${summary.unrealizedPnL >= 0 ? '+' : ''}${summary.unrealizedPnL.toLocaleString('ar-EG')} ج.م (${summary.unrealizedPnLPct}%)
• الأرباح المحققة من الصفقات المغلقة: ${summary.realizedPnL >= 0 ? '+' : ''}${summary.realizedPnL.toLocaleString('ar-EG')} ج.م (${summary.realizedPnLPct}%)
• صافي إجمالي عائد المحفظة العام: ${summary.totalPnL >= 0 ? '+' : ''}${summary.totalPnL.toLocaleString('ar-EG')} ج.م (${summary.totalPnLPct}%)

🎯 *إحصائيات الأداء ودقة الصفقات (Trading Metrics):*
• عدد الصفقات المفتوحة حالياً: ${summary.openTradesCount}
• عدد الصفقات المغلقة: ${summary.closedTradesCount}
• نسبة النجاح (Win Rate): ${summary.winRatePct}% (${summary.winCount} رابحة / ${summary.lossCount} خاسرة)
• معامل الربحية (Profit Factor): ${summary.profitFactor}
• أكبر صفقة رابحة: +${summary.largestWin.toLocaleString('ar-EG')} ج.م
• متوسط عائد الصفقة: ${summary.averageTradePnLPct}%

🏢 *توزيع السيولة والتعرض القطاعي:*
${summary.sectorAllocation.map((s) => `• قطاع ${s.sector}: ${s.pct}% (${s.value.toLocaleString('ar-EG')} ج.م)`).join('\n')}

${summary.topOverconcentratedStocks.length > 0 ? `⚠️ *تحذيرات التركيز العالي في الأسهم:*
${summary.topOverconcentratedStocks.map((s) => `• سهم ${s.nameAr} (${s.symbol}): يستحوذ على ${s.pctOfEquity}% من المحفظة (يوصى بعدم تجاوز 20%).`).join('\n')}` : '✅ توزيع الأوزان متوازن ولا يوجد تركز عالي في سهم منفرد.'}

📋 *حالة الصفقات النشطة المفتوحة:*
${activeTrades.length > 0 ? activeTrades.map((t) => {
  const p = stocks.find((s) => s.symbol === t.symbol)?.price || t.actualEntryPrice || 0;
  const pnlPct = t.actualEntryPrice ? (((p - t.actualEntryPrice) / t.actualEntryPrice) * 100).toFixed(2) : '0';
  return `• [${t.symbol}] ${t.stockNameAr} (فريم ${t.timeframe}):
   - سعر الدخول: ${t.actualEntryPrice || t.entryBatch1Price} ج.م | السعر الحالي: ${p.toFixed(2)} ج.م | العائد: ${Number(pnlPct) >= 0 ? '+' : ''}${pnlPct}%
   - الوقف الحالي: ${t.trailingStopLoss} ج.م ${t.isBreakevenTriggered ? '(مؤمن على الدخول ✅)' : ''}
   - الأهداف: H1 (${t.targets[0].price} ج.م) ${t.targets[0].isHit ? '✅' : '⏳'} | H2 (${t.targets[1].price} ج.م) ${t.targets[1].isHit ? '✅' : '⏳'}
   - توصية المساعد: ${t.liveAdviceAr || 'استمر في الصفقة'}`;
}).join('\n\n') : 'لا توجد صفقات مفتوحة حالياً.'}

💡 *توصيات الذكاء الاصطناعي لإدارة المحفظة:*
${summary.cashPct < 20 ? '• نسبة السيولة منخفضة (أقل من 20%). يوصى بعدم فتح مراكز جديدة والاحتفاظ بالسيولة لاقتناص الفرص عند تصحيح السوق.' : '• نسبة السيولة كافية ومناسبة لاقتناص صفقات جديدة بأمان.'}
• التزم بحجم المخاطرة الأقصى 1% - 2% لكل صفقة جديدة لحماية رأس المال من الهبوط المتتالي.
• قم دائماً بتفعيل قاعدة نقل الوقف لنقطة الدخول (Breakeven) بمجرد تحقيق الهدف الأول.

⏱️ تاريخ ووقت بيانات الشارت اللحظية: ${new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}
⚠️ تنويه للدقة والمصداقية: أسعار وبيانات الشارت الفني اللحظية قد تكون متأخرة 15 دقيقة بحسب اشتراطات البورصة المصرية ومزود البيانات TradingView.

⚠️ إخلاء مسؤولية: هذا التقرير وسجل المحفظة لأغراض إدارة التداول والتتبع التعليمي والشخصي ولا يمثل استشارة استثمارية أو دعوة للبيع أو الشراء. القرار الاستثماري وإدارة المخاطر مسؤولية المستثمر بالكامل.
تم إنشاء التقرير آلياً عبر رادار البورصة المصرية EGX
`;
}

// Delete any trade from portfolio (active, planned, closed, or cancelled)
export function deleteTradeFromPortfolio(
  account: PortfolioAccount,
  tradeId: string
): PortfolioAccount {
  const target = account.trades.find((t) => t.id === tradeId);
  if (!target) return account;

  let newCash = account.cashBalance;

  // If deleting an ACTIVE trade, refund the invested capital to cash
  if (target.status === 'ACTIVE') {
    const cost = (target.actualShares || target.totalPlannedShares) * (target.actualEntryPrice || target.entryBatch1Price);
    newCash += cost;
  }

  const updatedTrades = account.trades.filter((t) => t.id !== tradeId);

  const updatedAccount: PortfolioAccount = {
    ...account,
    cashBalance: Math.round(newCash),
    trades: updatedTrades,
    updatedAt: new Date().toISOString(),
  };

  savePortfolioAccount(updatedAccount);
  return updatedAccount;
}

// Clear all closed trades history
export function clearAllClosedTrades(account: PortfolioAccount): PortfolioAccount {
  const updatedTrades = account.trades.filter((t) => t.status !== 'CLOSED');
  const updatedAccount: PortfolioAccount = {
    ...account,
    trades: updatedTrades,
    updatedAt: new Date().toISOString(),
  };

  savePortfolioAccount(updatedAccount);
  return updatedAccount;
}

// Reopen a closed trade back to ACTIVE status
export function reopenClosedTrade(
  account: PortfolioAccount,
  tradeId: string
): PortfolioAccount {
  const updatedTrades = account.trades.map((t) => {
    if (t.id === tradeId) {
      return {
        ...t,
        status: 'ACTIVE' as const,
        exitDate: undefined,
        exitPrice: undefined,
        exitReason: undefined,
        realizedPnL: undefined,
        realizedPnLPct: undefined,
      };
    }
    return t;
  });

  const updatedAccount: PortfolioAccount = {
    ...account,
    trades: updatedTrades,
    updatedAt: new Date().toISOString(),
  };

  savePortfolioAccount(updatedAccount);
  return updatedAccount;
}

