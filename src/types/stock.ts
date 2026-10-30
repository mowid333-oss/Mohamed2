export type ShariahStatus = 'COMPLIANT' | 'NON_COMPLIANT';

export type TabType =
  | 'WATCHLIST'
  | 'SHARIAH'
  | 'INDICES_ANALYST'
  | 'GLOBAL_MARKETS'
  | 'GOLD_MARKET'
  | 'MARKET_COMPARISON'
  | 'TECHNICAL_ANALYST'
  | 'TRADE_MANAGEMENT'
  | 'PORTFOLIO'
  | 'ASO_REGIME'
  | 'DIVERGENCE'
  | 'RADARS'
  | 'INVESTOR_CATEGORIES'
  | 'NEWS'
  | 'DAILY_REPORT'
  | 'ALERTS'
  | 'CHART'
  | 'DCA'
  | 'SECTORS'
  | 'DAY_TRADING'
  | 'SMART_BUY_STUDY';

export interface EGXStock {
  symbol: string;
  tradingViewSymbol: string;
  nameAr: string;
  nameEn: string;
  sectorAr: string;
  sectorEn: string;
  isShariahCompliant: boolean;
  shariahReasonAr: string;
  shariahRatioDebt?: number; // Debt to Market Cap % (must be < 33%)
  shariahRatioCashInterest?: number; // Cash & Interest bearing assets % (must be < 33%)
  isInEgx30: boolean;
  isInEgx70: boolean;
  isInEgx100: boolean;
  isInShariahIndex: boolean;
  // Live / Daily market metrics from TradingView Scanner
  price: number;
  prevClose: number;
  changePct: number;
  changeAbs: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  valueTraded: number; // In EGP
  marketCap?: number;
  peRatio?: number;
  rsi14?: number;
  sma10?: number;
  sma20?: number;
  sma50?: number;
  sma200?: number;
  ema20?: number;
  ema50?: number;
  lastUpdatedTime?: string;
}

export type WatchlistCategory =
  | 'SHARIAH'
  | 'INSTITUTIONAL_LIQUIDITY'
  | 'EGX30'
  | 'EGX70'
  | 'EGX100'
  | 'ALL'
  | 'MOST_ACTIVE'
  | 'GAINERS'
  | 'LOSERS'
  | 'FAVORITES';

export interface MarketSessionStatus {
  isOpen: boolean;
  statusTextAr: string;
  statusTextEn: string;
  nextOpenTextAr: string;
  cairoTimeFormatted: string;
  badgeColor: 'emerald' | 'amber' | 'slate';
}

export type TradingTimeframe = '15m' | '30m' | '1h' | '4h' | '1D' | '1W' | '1M';

export interface TimeframeMeta {
  code: TradingTimeframe;
  labelAr: string;
  badgeAr: string;
  tradingViewInterval: string;
  target1Multiplier: number;
  target2Multiplier: number;
  stopLossMultiplier: number;
  descriptionAr: string;
}

export const TRADING_TIMEFRAMES: TimeframeMeta[] = [
  {
    code: '15m',
    labelAr: '15 دقيقة',
    badgeAr: 'لحظي (Scalp)',
    tradingViewInterval: '15',
    target1Multiplier: 0.022,
    target2Multiplier: 0.045,
    stopLossMultiplier: 0.012,
    descriptionAr: 'مضاربة لحظية سريعة واقتناص قمم وقيعان الشموع اللحظية',
  },
  {
    code: '30m',
    labelAr: '30 دقيقة',
    badgeAr: 'إنتراداي',
    tradingViewInterval: '30',
    target1Multiplier: 0.035,
    target2Multiplier: 0.065,
    stopLossMultiplier: 0.018,
    descriptionAr: 'تمركز تداولي داخل الجلسة (Intraday) لتحديد زخم اليوم',
  },
  {
    code: '1h',
    labelAr: 'ساعة 1H',
    badgeAr: 'سوينغ قصير',
    tradingViewInterval: '60',
    target1Multiplier: 0.048,
    target2Multiplier: 0.09,
    stopLossMultiplier: 0.025,
    descriptionAr: 'فريم المضارب المحترف لصفقات يوم إلى يومين',
  },
  {
    code: '4h',
    labelAr: '4 ساعات 4H',
    badgeAr: 'سوينغ أسبوعي',
    tradingViewInterval: '240',
    target1Multiplier: 0.065,
    target2Multiplier: 0.12,
    stopLossMultiplier: 0.038,
    descriptionAr: 'سوينغ متعدد الأيام واختراق المستويات المحورية',
  },
  {
    code: '1D',
    labelAr: 'يومي 1D',
    badgeAr: 'الاتجاه الرئيسي',
    tradingViewInterval: 'D',
    target1Multiplier: 0.085,
    target2Multiplier: 0.16,
    stopLossMultiplier: 0.048,
    descriptionAr: 'الاتجاه الأساسي المعتمد للبورصة ومستويات السوبر ترند',
  },
  {
    code: '1W',
    labelAr: 'أسبوعي 1W',
    badgeAr: 'استثماري متوسط',
    tradingViewInterval: 'W',
    target1Multiplier: 0.18,
    target2Multiplier: 0.32,
    stopLossMultiplier: 0.08,
    descriptionAr: 'رؤية استثمارية متوسطة المدى للاتجاهات الكبرى وتدفق الصناديق',
  },
  {
    code: '1M',
    labelAr: 'شهري 1M',
    badgeAr: 'استراتيجي',
    tradingViewInterval: 'M',
    target1Multiplier: 0.35,
    target2Multiplier: 0.65,
    stopLossMultiplier: 0.14,
    descriptionAr: 'رؤية استراتيجية كبرى وتمركز طويل الأجل لكبار المستثمرين',
  },
];
