import { EGXStock } from '../types/stock';
import {
  EGX_STATIC_STOCKS,
  STATIC_STOCKS_MAP,
  EGX_ARABIC_NAMES_DICTIONARY,
} from '../data/shariahRegistry';
import {
  getLiveCalculatedIndices,
  MarketIndexItem,
  fetchLiveTradingViewIndices,
} from '../data/marketIndices';

const CACHE_KEY = 'egx_market_data_cache_v4';
const CACHE_TIME_KEY = 'egx_market_data_timestamp_v4';

// Market Indices symbols that are NOT corporate stocks and must not be mixed into the equities list
export const INDEX_SYMBOLS = new Set([
  'EGX30',
  'EGX70',
  'EGX100',
  'EGX33',
  'EGX30SHARIAH',
  'EGX30CAPPED',
  'EGXTAMAYUZ',
]);

// Helper to sanitize sector names into clean Arabic
function translateSector(sectorEn?: string): string {
  if (!sectorEn) return 'خدمات واستثمارات متنوعة';
  const sec = sectorEn.toLowerCase();
  if (sec.includes('real estate') || (sec.includes('finance') && sec.includes('land'))) return 'العقارات والإنشاءات';
  if (sec.includes('bank') && (sec.includes('isla') || sec.includes('sharia'))) return 'البنوك والمصارف الإسلامية';
  if (sec.includes('bank') || sec.includes('commercial')) return 'البنوك والخدمات المصرفية التقليدية';
  if (sec.includes('finance') || sec.includes('invest') || sec.includes('capital')) return 'الخدمات المالية والاستثمار';
  if (sec.includes('process') || sec.includes('chemical') || sec.includes('fertiliz')) return 'الكيماويات والأسمدة';
  if (sec.includes('steel') || sec.includes('metal') || sec.includes('mineral') || sec.includes('basic')) return 'المعادن والموارد الأساسية';
  if (sec.includes('communication') || sec.includes('telecom') || sec.includes('tech')) return 'الاتصالات وتكنولوجيا المعلومات';
  if (sec.includes('health') || sec.includes('pharma') || sec.includes('medic')) return 'الرعاية الصحية والأدوية';
  if (sec.includes('consumer') || sec.includes('food') || sec.includes('beverage') || sec.includes('poultry')) return 'الأغذية والمشروبات';
  if (sec.includes('industrial') || sec.includes('contract') || sec.includes('cable') || sec.includes('engineer')) return 'السلع الصناعية والمقاولات';
  if (sec.includes('energy') || sec.includes('oil') || sec.includes('petro')) return 'الطاقة والخدمات البترولية';
  if (sec.includes('utilit') || sec.includes('gas') || sec.includes('electric')) return 'المرافق والطاقة النظيفة';
  if (sec.includes('transport') || sec.includes('shipping') || sec.includes('logist')) return 'خدمات النقل والشحن واللوجستيات';
  if (sec.includes('textil') || sec.includes('apparel') || sec.includes('garment')) return 'المنسوجات والملابس الجاهزة';
  if (sec.includes('touris') || sec.includes('hotel') || sec.includes('travel')) return 'السياحة والفنادق والترفيه';
  if (sec.includes('tobacco')) return 'التبغ والسجائر';
  return sectorEn;
}

// Non-Compliant conventional bank or tobacco tickers
const NON_COMPLIANT_SYMBOLS = new Set([
  'COMI', 'EAST', 'CIEB', 'QNBA', 'HDBK', 'CANA', 'EXPA', 'EGBX', 'SAIB',
  'FAITA', 'BBEP', 'BLOM', 'NSGB', 'AUB'
]);

// Official constituent sets for EGX indices
export const OFFICIAL_EGX30_SYMBOLS = new Set([
  'COMI', 'TMGH', 'ETEL', 'HRHO', 'SWDY', 'FWRY', 'EAST', 'ABUK', 'ORAS', 'HELI',
  'PHDC', 'EGAL', 'ESRS', 'AMOC', 'MFPC', 'JUFO', 'EFID', 'ORWE', 'SCTS', 'BINV',
  'RAYA', 'MCQE', 'ARCC', 'ELEC', 'ALCN', 'EIPICO', 'SKPC', 'CICH', 'QNBA', 'CLHO'
]);

export const OFFICIAL_EGX33_SHARIAH_SYMBOLS = new Set([
  'TMGH', 'ETEL', 'SWDY', 'ABUK', 'EAST', 'JUFO', 'FWRY', 'AMOC', 'MFPC', 'PHDC',
  'EGAL', 'HELI', 'RAYA', 'MCQE', 'ARCC', 'EIPICO', 'ALCN', 'ELEC', 'SKPC', 'CICH',
  'QNBA', 'ORAS', 'SCTS', 'BINV', 'ESRS', 'EFID', 'ORWE', 'CIRA', 'GMFL', 'ATQA',
  'KIMA', 'PRE', 'MASR'
]);

export const OFFICIAL_EGX70_SYMBOLS = new Set([
  'ELSWEDY', 'ACTF', 'AIH', 'MEMP', 'ASPIRE', 'CERA', 'OBOUR', 'CONTACT', 'ATLEASE',
  'GIZA', 'HDBK', 'UNIT', 'ATLAS', 'OIHC', 'KAHH', 'GADWA', 'BONYAN', 'MCRO',
  'BTFH', 'SUGR', 'DSCW', 'AUTO', 'POUL', 'ISMA', 'MOIL', 'PHAR', 'RMDA', 'SPMD',
  'OFH', 'ORHD', 'EGTS', 'MPRC', 'ACAMD', 'ELSH', 'ADIB', 'FAIT', 'SAUD', 'DOMT',
  'ISPH', 'CCAP', 'CIEB', 'EFIH', 'EKHO', 'MNHD', 'AMIA', 'ANFI', 'BINH', 'BIOC',
  'CSAG', 'DAPH', 'ECOS', 'EFIC', 'EGAS', 'ELNA', 'EPCO', 'EXPA', 'GGCC', 'IFAP',
  'KZPC', 'MBSC', 'MENA', 'MIPH', 'MOCO', 'PACH', 'PRDC', 'ROTO', 'SDTI', 'SWDY2',
  'TALM', 'ZMID'
]);

export const OFFICIAL_EGX100_SYMBOLS = new Set([
  ...Array.from(OFFICIAL_EGX30_SYMBOLS),
  ...Array.from(OFFICIAL_EGX70_SYMBOLS),
]);

export async function fetchLiveEgxStocks(): Promise<{
  stocks: EGXStock[];
  lastUpdated: string;
  isLive: boolean;
  totalCount: number;
}> {
  // Proactively fetch live EGX index points (EGX30, EGX70, EGX100) from TradingView in parallel
  fetchLiveTradingViewIndices().catch(() => {});

  const queryPayload = {
    filter: [
      {
        left: 'exchange',
        operation: 'equal',
        right: 'EGX',
      },
    ],
    options: { lang: 'en' },
    symbols: { query: { types: [] }, tickers: [] },
    columns: [
      'name',                 // 0
      'description',          // 1
      'close',                // 2
      'change',               // 3
      'change_abs',           // 4
      'volume',               // 5
      'Value.Traded',         // 6
      'open',                 // 7
      'high',                 // 8
      'low',                  // 9
      'market_cap_basic',     // 10
      'sector',               // 11
      'RSI',                  // 12
      'SMA10',                // 13
      'SMA20',                // 14
      'SMA50',                // 15
      'SMA200',               // 16
      'EMA20',                // 17
      'EMA50',                // 18
      'price_earnings_ttm',   // 19
    ],
    sort: { sortBy: 'Value.Traded', sortOrder: 'desc' },
    range: [0, 350],
  };

  let rawData: any[] = [];
  let fetchSucceeded = false;

  // Prioritize internal proxy to guarantee zero CORS issues in the browser
  const isBrowser = typeof window !== 'undefined';
  const endpoints = isBrowser
    ? ['/api/tv-scan/egypt/scan', 'https://scanner.tradingview.com/egypt/scan']
    : ['https://scanner.tradingview.com/egypt/scan'];

  for (const url of endpoints) {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(queryPayload),
      });

      if (resp.ok) {
        const json = await resp.json();
        if (json && Array.isArray(json.data) && json.data.length > 0) {
          rawData = json.data;
          fetchSucceeded = true;
          break;
        }
      }
    } catch (e) {
      console.warn(`TradingView fetch via ${url} failed:`, e);
    }
  }

  const now = new Date();
  const cairoTimeFormatted = new Intl.DateTimeFormat('ar-EG', {
    timeZone: 'Africa/Cairo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(now);

  let mergedStocks: EGXStock[] = [];

  if (fetchSucceeded && rawData.length > 0) {
    const seenSymbols = new Set<string>();

    for (const item of rawData) {
      const fullTicker = item.s || '';
      const cleanSym = fullTicker.replace(/^EGX:/i, '').trim().toUpperCase();

      // Filter out bond / debt ISIN identifiers like EGS370O1C013 or EGS30AJ1C016-EGP
      if (cleanSym.startsWith('EGS') && cleanSym.length > 8) {
        continue;
      }
      if (cleanSym.includes('C01') || cleanSym.includes('-EGP') && cleanSym.length > 7) {
        continue;
      }

      // Ensure Market Indices are never treated as corporate stocks
      if (INDEX_SYMBOLS.has(cleanSym)) {
        continue;
      }

      seenSymbols.add(cleanSym);

      const d = item.d || [];
      const tickerName = d[0] || cleanSym;
      const descEn = d[1] || tickerName;
      const price = Number(d[2] || 0);
      const changePct = Number(Number(d[3] || 0).toFixed(2));
      const changeAbs = Number(Number(d[4] || 0).toFixed(2));
      const volume = Math.round(Number(d[5] || 0));
      const valueTraded = Math.round(Number(d[6] || 0));
      const openPrice = Number(d[7] || price);
      const highPrice = Number(d[8] || price);
      const lowPrice = Number(d[9] || price);
      const marketCap = Number(d[10] || 0);
      const sectorEn = d[11] || '';
      const rsi14 = d[12] ? Number(Number(d[12]).toFixed(1)) : undefined;
      const sma10 = d[13] ? Number(Number(d[13]).toFixed(2)) : undefined;
      const sma20 = d[14] ? Number(Number(d[14]).toFixed(2)) : undefined;
      const sma50 = d[15] ? Number(Number(d[15]).toFixed(2)) : undefined;
      const sma200 = d[16] ? Number(Number(d[16]).toFixed(2)) : undefined;
      const ema20 = d[17] ? Number(Number(d[17]).toFixed(2)) : undefined;
      const ema50 = d[18] ? Number(Number(d[18]).toFixed(2)) : undefined;
      const peRatio = d[19] ? Number(Number(d[19]).toFixed(1)) : undefined;

      const staticInfo = STATIC_STOCKS_MAP[cleanSym];
      const dictInfo = EGX_ARABIC_NAMES_DICTIONARY[cleanSym];

      // Determine Shariah compliance
      let isShariah = true;
      let shariahReason = '';

      if (staticInfo) {
        isShariah = staticInfo.isShariahCompliant;
        shariahReason = staticInfo.shariahReasonAr;
      } else if (dictInfo) {
        isShariah = dictInfo.isShariah;
        shariahReason = dictInfo.isShariah
          ? 'متوافق: شركة تشغيلية صناعية/خدمية مدرجة ضمن القطاعات المتوافقة مع الشريعة.'
          : 'غير متوافق: معاملات بنكية تقليدية أو أنشطة محرمة.';
      } else if (NON_COMPLIANT_SYMBOLS.has(cleanSym)) {
        isShariah = false;
        shariahReason = 'غير متوافق: معاملات بنكية تقليدية تعتمد على الفوائد الربوية.';
      } else {
        const sLower = sectorEn.toLowerCase();
        if (sLower.includes('bank') || sLower.includes('tobacco') || sLower.includes('liquor')) {
          isShariah = false;
          shariahReason = 'غير متوافق لاشتمال القطاع على فوائد بنكية تقليدية أو منتجات محرمة.';
        } else {
          isShariah = true;
          shariahReason = 'متوافق مبدئياً: نشاط صناعي وخدمي حقيقي ضمن قطاع تشغيلي مباح.';
        }
      }

      const prevClose = price > 0 ? Number((price - changeAbs).toFixed(2)) : price;
      const resolvedNameAr = staticInfo?.nameAr || dictInfo?.nameAr || descEn;
      const resolvedSectorAr = staticInfo?.sectorAr || dictInfo?.sectorAr || translateSector(sectorEn);

      mergedStocks.push({
        symbol: cleanSym,
        tradingViewSymbol: `EGX:${cleanSym}`,
        nameAr: resolvedNameAr,
        nameEn: staticInfo?.nameEn || descEn,
        sectorAr: resolvedSectorAr,
        sectorEn: staticInfo?.sectorEn || sectorEn || 'General',
        isShariahCompliant: isShariah,
        shariahReasonAr: shariahReason,
        shariahRatioDebt: staticInfo?.shariahRatioDebt ?? (isShariah ? 15 : 75),
        shariahRatioCashInterest: staticInfo?.shariahRatioCashInterest ?? (isShariah ? 12 : 68),
        isInEgx30: OFFICIAL_EGX30_SYMBOLS.has(cleanSym) || (staticInfo?.isInEgx30 ?? false),
        isInEgx70: OFFICIAL_EGX70_SYMBOLS.has(cleanSym) || (staticInfo?.isInEgx70 ?? false),
        isInEgx100: OFFICIAL_EGX100_SYMBOLS.has(cleanSym) || OFFICIAL_EGX30_SYMBOLS.has(cleanSym) || (staticInfo?.isInEgx100 ?? false),
        isInShariahIndex: OFFICIAL_EGX33_SHARIAH_SYMBOLS.has(cleanSym) || (staticInfo?.isInShariahIndex ?? isShariah),
        price,
        prevClose,
        changePct,
        changeAbs,
        open: openPrice,
        high: highPrice,
        low: lowPrice,
        volume,
        valueTraded,
        marketCap: marketCap > 0 ? marketCap : undefined,
        peRatio,
        rsi14,
        sma10,
        sma20,
        sma50,
        sma200,
        ema20,
        ema50,
        lastUpdatedTime: cairoTimeFormatted,
      });
    }

    // Merge static stocks if not in scanner result (strictly excluding indices)
    EGX_STATIC_STOCKS.forEach((staticStock) => {
      if (INDEX_SYMBOLS.has(staticStock.symbol.toUpperCase())) return;
      if (!seenSymbols.has(staticStock.symbol)) {
        mergedStocks.push({
          symbol: staticStock.symbol,
          tradingViewSymbol: `EGX:${staticStock.symbol}`,
          nameAr: staticStock.nameAr,
          nameEn: staticStock.nameEn,
          sectorAr: staticStock.sectorAr,
          sectorEn: staticStock.sectorEn,
          isShariahCompliant: staticStock.isShariahCompliant,
          shariahReasonAr: staticStock.shariahReasonAr,
          shariahRatioDebt: staticStock.shariahRatioDebt,
          shariahRatioCashInterest: staticStock.shariahRatioCashInterest,
          isInEgx30: OFFICIAL_EGX30_SYMBOLS.has(staticStock.symbol) || staticStock.isInEgx30,
          isInEgx70: OFFICIAL_EGX70_SYMBOLS.has(staticStock.symbol) || staticStock.isInEgx70,
          isInEgx100: OFFICIAL_EGX100_SYMBOLS.has(staticStock.symbol) || OFFICIAL_EGX30_SYMBOLS.has(staticStock.symbol) || staticStock.isInEgx100,
          isInShariahIndex: OFFICIAL_EGX33_SHARIAH_SYMBOLS.has(staticStock.symbol) || staticStock.isInShariahIndex,
          price: staticStock.baselinePrice,
          prevClose: staticStock.baselinePrice,
          changePct: 0.0,
          changeAbs: 0.0,
          open: staticStock.baselinePrice,
          high: staticStock.baselinePrice,
          low: staticStock.baselinePrice,
          volume: 250000,
          valueTraded: Math.round(staticStock.baselinePrice * 250000),
          lastUpdatedTime: cairoTimeFormatted,
        });
      }
    });

    // Final purge of any accidental indices from the equities list
    mergedStocks = mergedStocks.filter((s) => !INDEX_SYMBOLS.has(s.symbol.toUpperCase()));

    // Save to local cache
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(mergedStocks));
        localStorage.setItem(CACHE_TIME_KEY, cairoTimeFormatted);
      }
    } catch (e) {
      console.warn('Could not persist market cache', e);
    }
  } else {
    // Read from cache if available
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const cached = localStorage.getItem(CACHE_KEY);
        const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const cleanList = parsed.filter((s) => !INDEX_SYMBOLS.has(s.symbol.toUpperCase()));
            return {
              stocks: cleanList,
              lastUpdated: cachedTime || cairoTimeFormatted,
              isLive: false,
              totalCount: cleanList.length,
            };
          }
        }
      }
    } catch (e) {
      console.warn('Failed reading market cache', e);
    }

    // Fallback to static stocks (excluding indices)
    mergedStocks = EGX_STATIC_STOCKS
      .filter((s) => !INDEX_SYMBOLS.has(s.symbol.toUpperCase()))
      .map((s) => ({
        symbol: s.symbol,
        tradingViewSymbol: `EGX:${s.symbol}`,
        nameAr: s.nameAr,
        nameEn: s.nameEn,
        sectorAr: s.sectorAr,
        sectorEn: s.sectorEn,
        isShariahCompliant: s.isShariahCompliant,
        shariahReasonAr: s.shariahReasonAr,
        shariahRatioDebt: s.shariahRatioDebt,
        shariahRatioCashInterest: s.shariahRatioCashInterest,
        isInEgx30: s.isInEgx30,
        isInEgx70: s.isInEgx70,
        isInEgx100: s.isInEgx100,
        isInShariahIndex: s.isInShariahIndex,
        price: s.baselinePrice,
        prevClose: s.baselinePrice,
        changePct: 0.0,
        changeAbs: 0.0,
        open: s.baselinePrice,
        high: s.baselinePrice,
        low: s.baselinePrice,
        volume: 350000,
        valueTraded: Math.round(s.baselinePrice * 350000),
        lastUpdatedTime: cairoTimeFormatted,
      }));
  }

  return {
    stocks: mergedStocks,
    lastUpdated: cairoTimeFormatted,
    isLive: fetchSucceeded,
    totalCount: mergedStocks.length,
  };
}

/**
 * Returns the live calculated market indices based on active constituent equities
 */
export function fetchLiveMarketIndices(stocks?: EGXStock[]): MarketIndexItem[] {
  return getLiveCalculatedIndices(stocks);
}
