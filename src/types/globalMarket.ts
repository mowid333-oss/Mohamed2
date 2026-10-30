/**
 * Global & Gulf Markets (الأسواق الخليجية والعالمية) Data Types
 * Covers Gulf Markets (TASI, DFM, ADX, Qatar, Kuwait), Global Indices, Commodities, Forex, Crypto,
 * Moving Averages (SMA/EMA), News & Real-time Indicator Alerts.
 */

export type GlobalMarketCategory =
  | 'ALL'
  | 'GULF'          // الأسواق الخليجية والعربية
  | 'INDICES'       // المؤشرات الأمريكية والعالمية
  | 'COMMODITIES'   // السلع والمعادن والطاقة
  | 'FOREX'         // العملات والفوركس ومؤشر الدولار
  | 'CRYPTO';       // العملات الرقمية

export type MaCrossoverStatus =
  | 'GOLDEN_CROSS'        // SMA 50 crossed above SMA 200 (Long-term Bullish)
  | 'DEATH_CROSS'         // SMA 50 crossed below SMA 200 (Long-term Bearish)
  | 'BULLISH_ABOVE_MAS'   // Price trading above SMA 50 & SMA 200
  | 'BEARISH_BELOW_MAS'   // Price trading below SMA 50 & SMA 200
  | 'TESTING_MA_SUPPORT'  // Price pulling back to test SMA 50/200 as support
  | 'TESTING_MA_RESIST';  // Price testing SMA 50/200 as resistance

export interface GlobalMovingAverages {
  sma20: number;
  sma50: number;
  sma100: number;
  sma200: number;
  ema20: number;
  ema50: number;
  priceVsSma20Pct: number;
  priceVsSma50Pct: number;
  priceVsSma200Pct: number;
  isPriceAboveSma20: boolean;
  isPriceAboveSma50: boolean;
  isPriceAboveSma200: boolean;
  crossoverStatus: MaCrossoverStatus;
  crossoverLabelAr: string;
  trendVerdictAr: string;
  trendStrength: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH';
}

export interface GlobalMarketAsset {
  symbol: string;             // e.g. TASI, DFMGI, SPX, NDX, DJI, XAUUSD, UKOIL, BTCUSD, DXY, EURUSD, USDEGP
  tradingViewSymbol: string;  // e.g. TADAWUL:TASI, DFM:DFMGI, FOREXCOM:SPXUSD, NASDAQ:NDX, OANDA:XAUUSD, TVC:UKOIL
  nameAr: string;
  nameEn: string;
  category: 'GULF' | 'INDICES' | 'COMMODITIES' | 'FOREX' | 'CRYPTO';
  categoryLabelAr: string;
  price: number;
  prevClose: number;
  changePct: number;
  changeAbs: number;
  high: number;
  low: number;
  open: number;
  volume?: number;
  unit: string;               // 'نقطة', '$', 'SAR', 'AED', 'EGP'
  lastUpdatedTime: string;
  movingAverages: GlobalMovingAverages;
  isLive: boolean;
  sparkline?: number[];
}

export interface GlobalMarketNewsItem {
  id: string;
  headlineAr: string;
  headlineEn?: string;
  summaryAr: string;
  source: string;             // Reuters, Bloomberg, Investing.com, CNBC, Argaam, Mubasher
  publishedAt: string;
  timeAgoAr: string;
  relatedSymbols: string[];
  impact: 'HIGH_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'HIGH_BEARISH';
  impactLabelAr: string;
  categoryAr: string;
  isVerifiedNoRumors: boolean;
  url: string;
}

export type AlertTriggerType =
  | 'MA_GOLDEN_CROSS'
  | 'MA_DEATH_CROSS'
  | 'PRICE_CROSS_ABOVE_MA50'
  | 'PRICE_CROSS_BELOW_MA50'
  | 'PRICE_CROSS_ABOVE_MA200'
  | 'PRICE_CROSS_BELOW_MA200'
  | 'INDEX_SURGE_UP'
  | 'INDEX_DROP_DOWN'
  | 'BREAKING_NEWS_IMPACT';

export interface MarketIndicatorAlert {
  id: string;
  assetSymbol: string;
  assetNameAr: string;
  triggerType: AlertTriggerType;
  titleAr: string;
  messageAr: string;
  currentPrice: number;
  referenceMaValue?: number;
  changePct: number;
  timestamp: string;
  timestampEpoch: number;
  severity: 'OPPORTUNITY' | 'WARNING' | 'CRITICAL' | 'INFO';
  badgeColor: 'emerald' | 'amber' | 'rose' | 'cyan';
  isRead: boolean;
}

export interface UserGlobalCustomAlert {
  id: string;
  symbol: string;
  assetNameAr: string;
  condition: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'CROSS_MA_50' | 'CROSS_MA_200' | 'CHANGE_PCT_UP' | 'CHANGE_PCT_DOWN';
  targetValue: number;
  currentPriceAtCreation: number;
  isActive: boolean;
  createdAt: string;
  note?: string;
}
