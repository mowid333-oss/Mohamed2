import { EGXStock, TradingTimeframe } from '../types/stock';
import { calculateStockTechnicalIndicators, IndicatorDetails } from '../services/technicalAnalysisService';
import { getCairoCurrentTimeFormatted } from './reportDisclaimer';

export type ConfluenceSignalType =
  | 'STRONG_BUY'        // السوبر ترند صاعد أخضر + الماكدي تقاطع إيجابي صاعد
  | 'BUY_ACCUMULATE'    // السوبر ترند صاعد + الماكدي في مسار التقاطع الإيجابي
  | 'EARLY_REBOUND'     // ارتداد قاع: الماكدي أعطى تقاطعاً إيجابياً مبكراً والسوبر ترند يستعد للتحول
  | 'TAKE_PROFIT'       // جني أرباح: السوبر ترند لا يزال صاعداً لكن الماكدي تقاطع سلبياً
  | 'STRONG_SELL'       // كسر هابط: السوبر ترند كسر للأسفل (أحمر) + الماكدي تقاطع سلبي
  | 'NEUTRAL';          // توازن وترقب

export interface SuperTrendMacdSignal {
  symbol: string;
  stockNameAr: string;
  currentPrice: number;
  timeframe: string;
  // Primary Confluence Classification
  signalType: ConfluenceSignalType;
  signalTitleAr: string;
  signalBadgeAr: string;
  signalActionAr: 'شراء فوري' | 'تجميع تدريجي' | 'جني أرباح' | 'وقف خسارة وخروج' | 'انتظار ومراقبة';
  badgeColor: 'emerald' | 'teal' | 'amber' | 'rose' | 'purple' | 'slate';
  confluenceScorePct: number; // 0 - 100%
  // SuperTrend Details
  superTrend: {
    isBullish: boolean;
    trendLabelAr: string;
    linePrice: number;
    distancePct: number;
    isPriceAbove: boolean;
    statusSummaryAr: string;
  };
  // MACD Details
  macd: {
    isBullish: boolean;
    crossoverType: 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'BULLISH_EXPANSION' | 'BEARISH_EXPANSION';
    crossoverLabelAr: string;
    macdLine: number;
    signalLine: number;
    histogram: number;
    histogramStatusAr: string;
    statusSummaryAr: string;
  };
  // Actionable Execution Levels
  executionLevels: {
    suggestedEntry: number;
    target1Price: number;
    target1GainPct: number;
    target2Price: number;
    target2GainPct: number;
    stopLossPrice: number;
    stopLossLossPct: number;
    riskRewardRatio: string;
  };
  // Detailed Analysis Sentence & Strategic Thesis
  strategicVerdictAr: string;
  detailedExplanationAr: string;
  timestampAr: string;
  fullSignalReportText: string;
}

/**
 * SuperTrend & MACD Confluence Engine
 * Evaluates the synchronous convergence between SuperTrend trend filter and MACD momentum crossover
 * to issue high-conviction Buy / Sell signals and exact execution levels.
 */
export function evaluateSuperTrendMacdSignal(
  stock: EGXStock,
  timeframe: TradingTimeframe = '1D',
  timeframeLabel: string = 'يومي (1D)'
): SuperTrendMacdSignal {
  const p = stock.price > 0 ? stock.price : 10;
  const changePct = stock.changePct || 0;
  const nowStr = getCairoCurrentTimeFormatted();

  // 1. Calculate technical indicators for the stock
  const tech = calculateStockTechnicalIndicators(stock, timeframe);
  const st = tech.superTrend;
  const macd = tech.macd;

  const stLine = Number(st.superTrendValue.toFixed(2));
  const isStBullish = st.isBullish;
  const stDistancePct = Number((((p - stLine) / p) * 100).toFixed(2));

  // 2. Classify MACD state
  const isMacdBullish = macd.isBullish;
  const isMacdCrossUp = macd.isBullishCross;
  const hist = macd.histogram;
  let macdCrossoverType: SuperTrendMacdSignal['macd']['crossoverType'] = 'BULLISH_EXPANSION';
  let macdCrossoverLabelAr = 'زخم شرائي إيجابي';
  let histStatusAr = 'الهيستوجرام في المنطقة الإيجابية (قوى شراء نشطة)';

  if (isMacdCrossUp && hist > 0) {
    macdCrossoverType = 'BULLISH_CROSS';
    macdCrossoverLabelAr = 'تقاطع إيجابي صاعد مؤكد (Golden Cross)';
    histStatusAr = `الهيستوجرام صاعد بقوة (+${hist})`;
  } else if (!isMacdBullish && hist < 0 && macd.macdLine < macd.signalLine) {
    macdCrossoverType = 'BEARISH_CROSS';
    macdCrossoverLabelAr = 'تقاطع سلبي هابط (Dead Cross)';
    histStatusAr = `الهيستوجرام سلبي متسع (${hist})`;
  } else if (hist > 0) {
    macdCrossoverType = 'BULLISH_EXPANSION';
    macdCrossoverLabelAr = 'مسار صاعد فوق خط الإشارة';
    histStatusAr = `الهيستوجرام موجب (+${hist})`;
  } else {
    macdCrossoverType = 'BEARISH_EXPANSION';
    macdCrossoverLabelAr = 'مسار هابط تحت خط الإشارة';
    histStatusAr = `الهيستوجرام سالب (${hist})`;
  }

  // 3. Confluence Logic between SuperTrend and MACD
  let signalType: ConfluenceSignalType = 'NEUTRAL';
  let signalTitleAr = 'حالة توازن وترقب فني';
  let signalBadgeAr = 'ترقب ومتابعة ⚖️';
  let signalActionAr: SuperTrendMacdSignal['signalActionAr'] = 'انتظار ومراقبة';
  let badgeColor: SuperTrendMacdSignal['badgeColor'] = 'slate';
  let confluenceScorePct = 50;

  if (isStBullish && (isMacdCrossUp || (isMacdBullish && hist > 0))) {
    // Both SuperTrend is green AND MACD is bullish
    signalType = 'STRONG_BUY';
    signalTitleAr = 'إشارة شراء مؤكدة بقوة (تطابق السوبر ترند والماكدي الصاعد)';
    signalBadgeAr = 'شراء مؤكد 🚀';
    signalActionAr = 'شراء فوري';
    badgeColor = 'emerald';
    confluenceScorePct = Math.min(98, 88 + Math.round(Math.max(0, changePct * 2)));
  } else if (!isStBullish && (!isMacdBullish || hist < -0.05)) {
    // Both SuperTrend is red AND MACD is bearish
    signalType = 'STRONG_SELL';
    signalTitleAr = 'إشارة بيع وخروج مؤكدة (كسر هابط للسوبر ترند مع تأكيد الماكدي السلبي)';
    signalBadgeAr = 'بيع وخروج 🛑';
    signalActionAr = 'وقف خسارة وخروج';
    badgeColor = 'rose';
    confluenceScorePct = Math.min(98, 86 + Math.round(Math.max(0, Math.abs(changePct) * 2)));
  } else if (isStBullish && !isMacdBullish && hist < 0) {
    // SuperTrend is still green, but MACD just crossed down (Divergence / Momentum loss)
    signalType = 'TAKE_PROFIT';
    signalTitleAr = 'إشارة جني أرباح وحذر (تقاطع سلبي في الماكدي مع استمرار السوبر ترند)';
    signalBadgeAr = 'جني أرباح / حذر 🟠';
    signalActionAr = 'جني أرباح';
    badgeColor = 'amber';
    confluenceScorePct = 76;
  } else if (!isStBullish && isMacdCrossUp) {
    // SuperTrend is still red, but MACD generated early bullish bottom bounce
    signalType = 'EARLY_REBOUND';
    signalTitleAr = 'إشارة ارتداد قاع مبكرة (تقاطع ماكدي إيجابي يستبق اختراق السوبر ترند)';
    signalBadgeAr = 'ارتداد مبكر 🔵';
    signalActionAr = 'تجميع تدريجي';
    badgeColor = 'teal';
    confluenceScorePct = 78;
  } else if (isStBullish) {
    // SuperTrend is bullish and MACD is recovering
    signalType = 'BUY_ACCUMULATE';
    signalTitleAr = 'إشارة شراء وتجميع (السوبر ترند صاعد والماكدي في مسار التعافي)';
    signalBadgeAr = 'شراء تجميعي 💎';
    signalActionAr = 'تجميع تدريجي';
    badgeColor = 'emerald';
    confluenceScorePct = 72;
  }

  // 4. Calculate Execution Levels tied to SuperTrend line
  // Stop loss is strictly anchored to the SuperTrend line
  let stopLossPrice = isStBullish ? Number((stLine * 0.992).toFixed(2)) : Number((p * 0.96).toFixed(2));
  if (stopLossPrice >= p) {
    stopLossPrice = Number((p * 0.965).toFixed(2));
  }
  const stopLossLossPct = Number((((stopLossPrice - p) / p) * 100).toFixed(1));

  const riskDistance = Math.max(0.05, p - stopLossPrice);
  const target1Price = Number((p + riskDistance * 1.8).toFixed(2));
  const target1GainPct = Number((((target1Price - p) / p) * 100).toFixed(1));
  const target2Price = Number((p + riskDistance * 3.1).toFixed(2));
  const target2GainPct = Number((((target2Price - p) / p) * 100).toFixed(1));
  const riskRewardRatio = `1 : ${(riskDistance > 0 ? (target1Price - p) / riskDistance : 2.0).toFixed(2)}`;

  // 5. Synthesis & Narrative
  let strategicVerdictAr = '';
  let detailedExplanationAr = '';

  if (signalType === 'STRONG_BUY') {
    strategicVerdictAr = `السهم في مسار صاعد قوي ومثالي؛ السعر يتداول أعلى خط السوبر ترند (${stLine} ج.م) بالتوازي مع تقاطع إيجابي مؤكد لمؤشر الماكدي، مما يعطي إشارة شراء صريحة بنسبة تأكيد ${confluenceScorePct}%.`;
    detailedExplanationAr = `يوفر خط السوبر ترند عند ${stLine} ج.م جدار دعم فولاذي وحزام أمان لحماية رأس المال، بينما يعكس الماكدي استمرار تدفق السيولة الشرائية. الدخول مناسب عند المستويات الحالية أو الارتداد الطفيف مع استهداف ${target1Price} ج.م أولاً.`;
  } else if (signalType === 'STRONG_SELL') {
    strategicVerdictAr = `كسر السهم خط السوبر ترند هبوطاً بالتزامن مع تقاطع سلبي لمؤشر الماكدي؛ يُنصح بتفعيل وقف الخسارة والخروج لحماية رأس المال حتى يستعيد السهم استقراره.`;
    detailedExplanationAr = `الكسر المزدوج يؤكد سيطرة قوى التصريف على الجلسة، والتحول إلى الهيستوجرام السالب يشير إلى احتمالية مواصلة الهبوط لاختبار دعوم أدنى.`;
  } else if (signalType === 'TAKE_PROFIT') {
    strategicVerdictAr = `يحتفظ السهم بمسار السوبر ترند الصاعد، ولكن ظهور تقاطع سلبي في مؤشر الماكدي يشير إلى تباطؤ الزخم الصاعد وتصريف جزئي؛ يُنصح بجني 50% من الأرباح ورفع الوقف إلى نقطة الدخول (Breakeven).`;
    detailedExplanationAr = `التباين بين صعود السعر وضعف قمم الماكدي يمثل انحرافاً سلبياً (Bearish Divergence) يستوجب الحذر وعدم ملاحقة الأسعار في القمم.`;
  } else if (signalType === 'EARLY_REBOUND') {
    strategicVerdictAr = `سجل مؤشر الماكدي تقاطعاً إيجابياً صاعداً من قاع تشبع بيعي، مما يمهد لاختراق وشيك لخط السوبر ترند عند ${stLine} ج.م؛ فرصة تجميعية مبكرة بنسبة عائد إلى مخاطرة عالية.`;
    detailedExplanationAr = `التقاطع الإيجابي في الماكدي يعتبر إشارة استباقية (Leading Indicator) تؤكد امتصاص عروض البيع قرب القيعان.`;
  } else {
    strategicVerdictAr = `تتداول الأسعار داخل نطاق توازن؛ يُفضل التريث حتى يؤكد السعر اختراق خط السوبر ترند أو اكتمال تقاطع الماكدي الصاعد للدخول الآمن.`;
    detailedExplanationAr = `حالة تذبذب عرضي دون اتجاه حاسم، خط السوبر ترند يقف عند ${stLine} ج.م ويمثل مستوى التأكيد الرئيسي.`;
  }

  const fullSignalReportText = `⚡ تقرير إشارات السوبر ترند والماكدي المتوافقة (SuperTrend & MACD Confluence Engine):
📌 السهم: ${stock.nameAr} (${stock.symbol})
💵 السعر الحالي: ${p.toFixed(2)} ج.م (${changePct >= 0 ? '+' : ''}${changePct}%)
⏱️ الفريم الزمني: ${timeframeLabel}
التوقيت: ${nowStr}

🎯 إشارة التوافق الرئيسية: [${signalBadgeAr}]
• القرار الفني: ${signalTitleAr}
• نسبة التأكيد الفني: ${confluenceScorePct}%
• الإجراء الاستراتيجي: ${signalActionAr}

📐 تفاصيل المؤشرات الحاكمة:
1. مؤشر السوبر ترند (SuperTrend 10, 3):
   - الاتجاه: ${isStBullish ? 'صاعد (Bullish) 🟢' : 'هابط (Bearish) 🔴'}
   - خط السوبر ترند: ${stLine} ج.م (المسافة: ${stDistancePct >= 0 ? '+' : ''}${stDistancePct}%)
   - الموقف: ${isStBullish ? 'السعر يتداول بأمان أعلى خط السوبر ترند' : 'السعر يتداول أدنى خط السوبر ترند'}

2. مؤشر الماكدي (MACD 12, 26, 9):
   - التقاطع: ${macdCrossoverLabelAr}
   - خط MACD: ${macd.macdLine} | خط الإشارة: ${macd.signalLine}
   - الهيستوجرام: ${hist >= 0 ? `+${hist}` : hist} (${histStatusAr})

🎯 مستويات التنفيذ الموصى بها:
• سعر الدخول المقترح: ${p.toFixed(2)} ج.م
• الهدف الأول (TP1): ${target1Price} ج.م (+${target1GainPct}%)
• الهدف الثاني (TP2): ${target2Price} ج.م (+${target2GainPct}%)
• وقف الخسارة الصارم (SL): ${stopLossPrice} ج.م (${stopLossLossPct}%) [مربوط بخط السوبر ترند]
• نسبة العائد إلى المخاطرة (R:R): ${riskRewardRatio}

💡 الرأي الفني والاستراتيجي:
${strategicVerdictAr}
${detailedExplanationAr}

المصدر: رادار البورصة المصرية ومؤشر الشريعة TradingView Live Engine`;

  return {
    symbol: stock.symbol,
    stockNameAr: stock.nameAr,
    currentPrice: p,
    timeframe: timeframeLabel,
    signalType,
    signalTitleAr,
    signalBadgeAr,
    signalActionAr,
    badgeColor,
    confluenceScorePct,
    superTrend: {
      isBullish: isStBullish,
      trendLabelAr: isStBullish ? 'صاعد (Bullish) 🟢' : 'هابط (Bearish) 🔴',
      linePrice: stLine,
      distancePct: stDistancePct,
      isPriceAbove: isStBullish,
      statusSummaryAr: isStBullish ? `السعر أعلى من السوبر ترند بـ +${stDistancePct}%` : `السعر أسفل السوبر ترند بـ ${stDistancePct}%`,
    },
    macd: {
      isBullish: isMacdBullish,
      crossoverType: macdCrossoverType,
      crossoverLabelAr: macdCrossoverLabelAr,
      macdLine: macd.macdLine,
      signalLine: macd.signalLine,
      histogram: hist,
      histogramStatusAr: histStatusAr,
      statusSummaryAr: macdCrossoverLabelAr,
    },
    executionLevels: {
      suggestedEntry: p,
      target1Price,
      target1GainPct,
      target2Price,
      target2GainPct,
      stopLossPrice,
      stopLossLossPct,
      riskRewardRatio,
    },
    strategicVerdictAr,
    detailedExplanationAr,
    timestampAr: nowStr,
    fullSignalReportText,
  };
}
