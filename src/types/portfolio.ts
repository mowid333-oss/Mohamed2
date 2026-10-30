import { TradingTimeframe } from './stock';

export type TradeStatus = 'PLANNED' | 'ACTIVE' | 'CLOSED' | 'CANCELLED';

export type TradeExitReason =
  | 'TARGET_ALL_HIT'
  | 'TARGET_1_PARTIAL'
  | 'STOP_LOSS_HIT'
  | 'TRAILING_STOP_HIT'
  | 'MANUAL_EXIT_PROFIT'
  | 'MANUAL_EXIT_LOSS'
  | 'MARKET_REGIME_EXIT';

export type TradeActionRecommendation =
  | 'HOLD'
  | 'TAKE_PARTIAL_PROFIT'
  | 'TRAIL_STOP_TO_BE'
  | 'TIGHTEN_STOP'
  | 'ADD_BATCH_2'
  | 'EXIT_FULL';

export interface TargetLadderStep {
  level: 1 | 2 | 3;
  price: number;
  pctGain: number;
  exitSharePct: number; // e.g. 50% on Target 1, 30% on Target 2, 20% on Target 3
  isHit: boolean;
  hitDate?: string;
}

export interface ManagedTrade {
  id: string;
  symbol: string;
  stockNameAr: string;
  sectorAr: string;
  status: TradeStatus;
  timeframe: TradingTimeframe;
  createdAt: string;
  entryDate?: string;
  exitDate?: string;

  // 1. Entry Plan (خطة الدخول)
  entryZoneMin: number;
  entryZoneMax: number;
  entryBatch1Price: number;
  entryBatch1Shares: number;
  entryBatch2Price: number;
  entryBatch2Shares: number;
  totalPlannedShares: number;
  totalPlannedCapital: number;
  entryTriggerCondition: string; // شرط الدخول والتأكيد
  actualEntryPrice?: number;
  actualShares?: number;

  // 2. Risk Management & Stops (إدارة المخاطر والوقف)
  initialStopLoss: number;
  trailingStopLoss: number;
  isBreakevenTriggered: boolean; // هل تم نقل الوقف لنقطة الدخول
  riskAmount: number; // المبلغ المعرض للمخاطرة (ج.م)
  riskPctOfCapital: number; // نسبة المخاطرة من رأس المال (مثلاً 1.5%)
  riskRewardRatio: number; // R:R ratio

  // 3. Profit Targets Ladder (سلم الأهداف وجني الأرباح)
  targets: TargetLadderStep[];

  // 4. Live Assistant Monitoring (المتابعة اللحظية وتوصيات المساعد)
  highestPriceSinceEntry?: number;
  liveRecommendation?: TradeActionRecommendation;
  liveAdviceAr?: string;
  warningFlags?: string[];

  // 5. Exit & Review (إنهاء الصفقة والتقييم)
  exitPrice?: number;
  exitReason?: TradeExitReason;
  realizedPnL?: number; // صافي الربح/الخسارة بالجنيه
  realizedPnLPct?: number; // صافي النسبة المئوية
  notes?: string;
  ratingStars?: number; // 1 to 5
  lessonsLearned?: string;
}

export interface PortfolioSettings {
  maxRiskPerTradePct: number; // Default 2%
  defaultTarget1ExitPct: number; // Default 50%
  autoMoveStopToBreakevenAtTarget1: boolean; // Default true
}

export interface PortfolioAccount {
  initialCapital: number;
  cashBalance: number;
  currency: 'EGP';
  updatedAt: string;
  trades: ManagedTrade[];
  settings: PortfolioSettings;
}

export interface PortfolioSummary {
  initialCapital: number;
  totalEquity: number;
  cashBalance: number;
  investedValue: number;
  cashPct: number;
  investedPct: number;
  unrealizedPnL: number;
  unrealizedPnLPct: number;
  realizedPnL: number;
  realizedPnLPct: number;
  totalPnL: number;
  totalPnLPct: number;
  openTradesCount: number;
  closedTradesCount: number;
  winCount: number;
  lossCount: number;
  winRatePct: number;
  profitFactor: number;
  largestWin: number;
  largestLoss: number;
  averageTradePnLPct: number;
  sectorAllocation: { sector: string; value: number; pct: number }[];
  riskExposurePct: number;
  topOverconcentratedStocks: { symbol: string; nameAr: string; pctOfEquity: number }[];
}
