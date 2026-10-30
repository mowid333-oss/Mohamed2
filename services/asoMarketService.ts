import { EGXStock } from '../types/stock';

export type AsoRegime =
  | 'BULLISH_EXPANSION'
  | 'ACCUMULATION'
  | 'CONSOLIDATION'
  | 'DISTRIBUTION'
  | 'BEARISH_CAPITULATION';

export interface StockAsoData {
  symbol: string;
  nameAr: string;
  price: number;
  changePct: number;
  bullsPower: number;   // 0 - 100
  bearsPower: number;   // 0 - 100
  asoSpread: number;    // bulls - bears (-100 to +100)
  asoScore: number;     // 0 - 100 (sentiment gauge)
  regime: AsoRegime;
  regimeAr: string;
  regimeColor: 'emerald' | 'cyan' | 'amber' | 'rose' | 'purple';
  actionableGuidanceAr: string;
}

export interface MarketAsoSummary {
  marketAsoScore: number;        // 0 - 100 (Overall EGX sentiment)
  bullsMarketPower: number;      // %
  bearsMarketPower: number;      // %
  asoSpread: number;             // bulls - bears
  marketRegime: AsoRegime;
  regimeTitleAr: string;
  regimeDescriptionAr: string;
  regimeBadgeColor: 'emerald' | 'cyan' | 'amber' | 'rose' | 'purple';
  strategyAdviceAr: string;
  advancingStocksCount: number;
  decliningStocksCount: number;
  unchangedStocksCount: number;
  bullishBreadthPct: number;     // % of stocks positive
  institutionalInflowEgp: number;
  institutionalOutflowEgp: number;
  netLiquidityFlowEgp: number;
  sectorSentiment: Array<{
    sectorAr: string;
    asoScore: number;
    bullsPower: number;
    statusAr: 'تجميع قوي' | 'صعود مستقر' | 'توازن عرضي' | 'جني أرباح' | 'تصريف';
  }>;
  topAccumulatedStocks: StockAsoData[];
  topDistributedStocks: StockAsoData[];
}

// Compute individual stock ASO
export function calculateStockAso(stock: EGXStock): StockAsoData {
  const p = stock.price > 0 ? stock.price : 10;
  const high = stock.high && stock.high >= p ? stock.high : p * 1.015;
  const low = stock.low && stock.low <= p ? stock.low : p * 0.985;
  const open = stock.open && stock.open > 0 ? stock.open : p;
  const range = Math.max(0.01, high - low);

  // Bullish thrust calculation
  const closeLocation = (p - low) / range; // 0 to 1
  const upwardWick = (high - Math.max(open, p)) / range;
  const downwardWick = (Math.min(open, p) - low) / range;

  let rawBulls = (closeLocation * 55) + (downwardWick * 25) + (stock.changePct > 0 ? Math.min(20, stock.changePct * 4) : 0);
  let rawBears = ((1 - closeLocation) * 55) + (upwardWick * 25) + (stock.changePct < 0 ? Math.min(20, Math.abs(stock.changePct) * 4) : 0);

  // Moving average alignment modifier
  if (stock.sma20 && p > stock.sma20) rawBulls += 10;
  else if (stock.sma20 && p < stock.sma20) rawBears += 10;

  if (stock.sma50 && p > stock.sma50) rawBulls += 10;
  else if (stock.sma50 && p < stock.sma50) rawBears += 10;

  const total = Math.max(1, rawBulls + rawBears);
  const bullsPower = Math.round(Math.min(99, Math.max(1, (rawBulls / total) * 100)));
  const bearsPower = Math.round(100 - bullsPower);
  const asoSpread = bullsPower - bearsPower;
  const asoScore = bullsPower;

  let regime: AsoRegime = 'CONSOLIDATION';
  let regimeAr = 'تذبذب عرضي محايد';
  let regimeColor: StockAsoData['regimeColor'] = 'amber';
  let actionableGuidanceAr = 'تعادل بين قوى المشترين والبائعين. يُفضل التريث حتى اختراق مستويات المقاومة.';

  if (bullsPower >= 72 && stock.changePct >= 0.5) {
    regime = 'BULLISH_EXPANSION';
    regimeAr = 'توسع صاعد قوي (سيطرة الثيران)';
    regimeColor = 'emerald';
    actionableGuidanceAr = 'زخم شرائي طاغٍ مع سيطرة المشترين المؤسسيين. احتفظ بالمراكز مع رفع وقف الخسارة المتحرك.';
  } else if (bullsPower >= 58 && asoSpread > 10) {
    regime = 'ACCUMULATION';
    regimeAr = 'تجميع مؤسسي صامت (سيولة ذكية)';
    regimeColor = 'cyan';
    actionableGuidanceAr = 'امتصاص مستمر للسيولة البيعية مع ميل الميزان لصالح المشتري. فرصة مثالية للدخول التراكمي.';
  } else if (bearsPower >= 72 && stock.changePct <= -1.0) {
    regime = 'BEARISH_CAPITULATION';
    regimeAr = 'ذروة بيع واستسلام (فرصة ارتداد وشيكة)';
    regimeColor = 'purple';
    actionableGuidanceAr = 'بلوغ البيع مستويات تشبع قصوى واستسلام البائعين. راقب إشارات الانعكاس لاقتناص قاع سعري.';
  } else if (bearsPower >= 58 && asoSpread < -10) {
    regime = 'DISTRIBUTION';
    regimeAr = 'تصريف بيعي مستمر (هيمنة الدببة)';
    regimeColor = 'rose';
    actionableGuidanceAr = 'تخفيف المراكز وتفعيل وقف الخسارة لحماية رأس المال، مع تجنب الشراء المبكر.';
  }

  return {
    symbol: stock.symbol,
    nameAr: stock.nameAr,
    price: p,
    changePct: stock.changePct,
    bullsPower,
    bearsPower,
    asoSpread,
    asoScore,
    regime,
    regimeAr,
    regimeColor,
    actionableGuidanceAr,
  };
}

// Calculate comprehensive market-wide ASO
export function calculateMarketAso(stocks: EGXStock[]): MarketAsoSummary {
  const validStocks = stocks.filter((s) => s.price > 0);
  if (validStocks.length === 0) {
    return {
      marketAsoScore: 50,
      bullsMarketPower: 50,
      bearsMarketPower: 50,
      asoSpread: 0,
      marketRegime: 'CONSOLIDATION',
      regimeTitleAr: 'حياد وتوازن عرضي',
      regimeDescriptionAr: 'تعادل نسبي بين قوى العرض والطلب في السوق.',
      regimeBadgeColor: 'amber',
      strategyAdviceAr: 'الانتقائية العالية والتداول في الأسهم ذات الزخم الخاص.',
      advancingStocksCount: 0,
      decliningStocksCount: 0,
      unchangedStocksCount: 0,
      bullishBreadthPct: 50,
      institutionalInflowEgp: 0,
      institutionalOutflowEgp: 0,
      netLiquidityFlowEgp: 0,
      sectorSentiment: [],
      topAccumulatedStocks: [],
      topDistributedStocks: [],
    };
  }

  const stockAsos = validStocks.map((s) => calculateStockAso(s));

  let advancingCount = 0;
  let decliningCount = 0;
  let unchangedCount = 0;
  let totalBullsWeighted = 0;
  let totalBearsWeighted = 0;
  let totalWeight = 0;
  let inflowEgp = 0;
  let outflowEgp = 0;

  const sectorMap: Record<string, { bulls: number; count: number; totalScore: number }> = {};

  validStocks.forEach((stock, idx) => {
    const aso = stockAsos[idx];
    const val = Math.max(100_000, stock.valueTraded || stock.volume * stock.price || 1_000_000);
    const weight = Math.sqrt(val);

    totalBullsWeighted += aso.bullsPower * weight;
    totalBearsWeighted += aso.bearsPower * weight;
    totalWeight += weight;

    if (stock.changePct > 0.05) {
      advancingCount++;
      inflowEgp += (stock.valueTraded || 0) * (aso.bullsPower / 100);
    } else if (stock.changePct < -0.05) {
      decliningCount++;
      outflowEgp += (stock.valueTraded || 0) * (aso.bearsPower / 100);
    } else {
      unchangedCount++;
    }

    const sec = stock.sectorAr || 'قطاعات أخرى';
    if (!sectorMap[sec]) sectorMap[sec] = { bulls: 0, count: 0, totalScore: 0 };
    sectorMap[sec].bulls += aso.bullsPower;
    sectorMap[sec].totalScore += aso.asoScore;
    sectorMap[sec].count += 1;
  });

  const bullsMarketPower = Math.round(totalBullsWeighted / Math.max(1, totalWeight));
  const bearsMarketPower = 100 - bullsMarketPower;
  const marketAsoScore = bullsMarketPower;
  const asoSpread = bullsMarketPower - bearsMarketPower;
  const bullishBreadthPct = Math.round((advancingCount / Math.max(1, validStocks.length)) * 100);

  let marketRegime: AsoRegime = 'CONSOLIDATION';
  let regimeTitleAr = 'تذبذب وتوازن عرضي (Consolidation)';
  let regimeDescriptionAr = 'تعادل بين قوى المشترين والبائعين في عموم البورصة مع سيطرة الحذر المؤسسي وانتظار محفزات سيولة جديدة.';
  let regimeBadgeColor: MarketAsoSummary['regimeBadgeColor'] = 'amber';
  let strategyAdviceAr = 'التركيز على الأسهم القيادية المقيدة في قيعان التجميع، وعدم الاندفاع في مطاردة الارتفاعات السريعة.';

  if (marketAsoScore >= 65 && asoSpread >= 25) {
    marketRegime = 'BULLISH_EXPANSION';
    regimeTitleAr = 'توسع صاعد كاسح (Bullish Expansion)';
    regimeDescriptionAr = 'سيطرة شبه كاملة لقوى الثيران والمؤسسات الشرائية، مع اتساع نطاق السوق (Market Breadth) وتدفقات سيولة قياسية.';
    regimeBadgeColor = 'emerald';
    strategyAdviceAr = 'استثمار الاتجاه الصاعد، الاحتفاظ بالأسهم الرابحة، وفتح مراكز تداول جديدة عند أي تهدئة سعرية طفيفة.';
  } else if (marketAsoScore >= 54 && asoSpread > 5) {
    marketRegime = 'ACCUMULATION';
    regimeTitleAr = 'تجميع مؤسسي صامت (Smart Accumulation)';
    regimeDescriptionAr = 'بناء مراكز هادئ من المؤسسات والسيولة الذكية، مع امتصاص ملحوظ لعروض البيع وبداية تفوق المشترين.';
    regimeBadgeColor = 'cyan';
    strategyAdviceAr = 'اقتناص الأسهم التي اخترقت متوسط 20 يوماً والتركيز على قطاعات الكيماويات والبنوك والعقارات.';
  } else if (marketAsoScore <= 35 && asoSpread <= -25) {
    marketRegime = 'BEARISH_CAPITULATION';
    regimeTitleAr = 'ذروة بيعية وتشبع هابط (Panic Selling / Capitulation)';
    regimeDescriptionAr = 'استسلام أصحاب المراكز الهامشية وتراجع السوق لمناطق دعم تاريخية تشكل بيئة مثالية لارتداد قوي.';
    regimeBadgeColor = 'purple';
    strategyAdviceAr = 'تجهيز السيولة لاقتناص فرص الارتداد السريع في الأسهم الدفاعية ذات التوزيعات النقدية والديون المنخفضة.';
  } else if (marketAsoScore < 46) {
    marketRegime = 'DISTRIBUTION';
    regimeTitleAr = 'تصريف وضغط بيعي (Distribution Pressure)';
    regimeDescriptionAr = 'تفوق عروض البيع وجني أرباح مكثف في قطاعات رئيسية مع خروج سيولة مضاربية.';
    regimeBadgeColor = 'rose';
    strategyAdviceAr = 'تقليص المراكز ذات المخاطر العالية، تفعيل مستويات حماية الأرباح، وتجنب الشراء بالهامش.';
  }

  // Sector breakdown sorted by highest ASO score
  const sectorSentiment = Object.entries(sectorMap)
    .map(([sectorAr, data]) => {
      const avgScore = Math.round(data.totalScore / Math.max(1, data.count));
      const bulls = Math.round(data.bulls / Math.max(1, data.count));
      let statusAr: 'تجميع قوي' | 'صعود مستقر' | 'توازن عرضي' | 'جني أرباح' | 'تصريف' = 'توازن عرضي';
      if (avgScore >= 68) statusAr = 'تجميع قوي';
      else if (avgScore >= 56) statusAr = 'صعود مستقر';
      else if (avgScore <= 35) statusAr = 'تصريف';
      else if (avgScore <= 45) statusAr = 'جني أرباح';
      return { sectorAr, asoScore: avgScore, bullsPower: bulls, statusAr };
    })
    .sort((a, b) => b.asoScore - a.asoScore);

  // Top accumulated and top distributed stocks
  const sortedByAso = [...stockAsos].sort((a, b) => b.asoScore - a.asoScore);
  const topAccumulatedStocks = sortedByAso.slice(0, 6);
  const topDistributedStocks = [...stockAsos].sort((a, b) => a.asoScore - b.asoScore).slice(0, 6);

  return {
    marketAsoScore,
    bullsMarketPower,
    bearsMarketPower,
    asoSpread,
    marketRegime,
    regimeTitleAr,
    regimeDescriptionAr,
    regimeBadgeColor,
    strategyAdviceAr,
    advancingStocksCount: advancingCount,
    decliningStocksCount: decliningCount,
    unchangedStocksCount: unchangedCount,
    bullishBreadthPct,
    institutionalInflowEgp: Math.round(inflowEgp),
    institutionalOutflowEgp: Math.round(outflowEgp),
    netLiquidityFlowEgp: Math.round(inflowEgp - outflowEgp),
    sectorSentiment,
    topAccumulatedStocks,
    topDistributedStocks,
  };
}
