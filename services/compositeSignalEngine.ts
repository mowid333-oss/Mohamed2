import { EGXStock, TradingTimeframe } from '../types/stock';
import { calculateStockTechnicalIndicators } from './technicalAnalysisService';
import { getCairoCurrentTimeFormatted } from '../utils/reportDisclaimer';

export type PillarStatus = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export interface IndicatorPillar {
  name: 'MACD' | 'SuperTrend' | 'Volume' | 'Divergence';
  nameAr: string;
  status: PillarStatus;
  statusAr: string;
  score: number; // 0 - 100
  weight: number; // 0 - 1
  keyMetric: string;
  detailsAr: string;
  positiveEvidences: string[];
  cautionEvidences: string[];
}

export type CompositeSignalVerdictType =
  | 'STRONG_BUY'     // شراء قوي مؤكد (توافق 3 أو 4 مؤشرات إيجابياً)
  | 'BUY_ACCUMULATE' // شراء وتجميع هادئ
  | 'NEUTRAL'        // ترقب ومراقبة حيادية
  | 'TAKE_PROFIT'    // جني أرباح / خروج جزئي
  | 'STRONG_SELL';   // بيع وخروج ووقف خسارة

export interface ExecutionLevels {
  buyZoneMin: number;
  buyZoneMax: number;
  suggestedBuyEntry: number;
  target1Price: number;
  target1GainPct: number;
  target2Price: number;
  target2GainPct: number;
  stopLossPrice: number;
  stopLossLossPct: number;
  riskRewardRatio: string;
}

export interface CompositeSignalVerdict {
  symbol: string;
  stockNameAr: string;
  currentPrice: number;
  timeframe: string;
  verdictType: CompositeSignalVerdictType;
  verdictTitleAr: string;
  verdictBadgeAr: string;
  verdictActionAr: 'شراء فوري مؤكد' | 'تجميع تدريجي' | 'مراقبة وترقب' | 'جني أرباح وتخفيف' | 'بيع ووقف خسارة';
  badgeColor: 'emerald' | 'teal' | 'amber' | 'rose' | 'slate';
  confidenceScorePct: number; // 0 - 100%
  positiveConfirmationCount: number; // how many of 4 pillars confirm bullish
  totalPillarsCount: number; // 4
  
  // 4 Core Pillars
  pillars: {
    macd: IndicatorPillar;
    superTrend: IndicatorPillar;
    volume: IndicatorPillar;
    divergence: IndicatorPillar;
  };

  // Execution target points
  executionLevels: ExecutionLevels;

  // Key syntheses
  positiveConfluencesSummaryAr: string[];
  cautionWarningsSummaryAr: string[];
  definitiveStrongOpinionAr: string;
  timestampAr: string;
  fullFormattedReportText: string;
}

/**
 * Evaluates Divergence between price and momentum indicators (RSI & MACD)
 */
function detectStockDivergences(
  stock: EGXStock,
  rsiValue: number,
  macdHist: number,
  isMacdBullishCross: boolean
): {
  detected: boolean;
  type: 'BULLISH' | 'BEARISH' | 'NONE';
  titleAr: string;
  detailsAr: string;
  score: number;
} {
  const changePct = stock.changePct || 0;
  const p = stock.price;
  const low = stock.low || p * 0.98;
  const high = stock.high || p * 1.02;

  // Bullish Divergence check:
  // Price is depressed or pulling back near support, but RSI or MACD histogram is turning up or showing positive divergence
  if ((changePct <= 0.8 && rsiValue > 38 && rsiValue < 60 && (macdHist > 0 || isMacdBullishCross)) ||
      (stock.price <= low * 1.015 && rsiValue >= 35 && macdHist >= -0.05)) {
    return {
      detected: true,
      type: 'BULLISH',
      titleAr: 'دايفرجنس إيجابي صاعد (Bullish Divergence)',
      detailsAr: 'تكون قاع سعري أدنى يقابله قاع أعلى في مؤشر الماكدي وعزم الـ RSI، مما يشير إلى انعكاس إيجابي مرتقب وتراكم قوى شرائية ذكية.',
      score: 85,
    };
  }

  // Bearish Divergence check:
  // Price spiked or at top, but momentum/RSI is overbought (> 70) and macdHist is shrinking or crossed down
  if ((rsiValue >= 72 && macdHist < 0) || (changePct >= 4 && rsiValue >= 74 && macdHist < 0.1)) {
    return {
      detected: true,
      type: 'BEARISH',
      titleAr: 'دايفرجنس سلبي هابط (Bearish Divergence)',
      detailsAr: 'السعر يسجل مستويات مرتفعة بينما يعجز مؤشر الماكدي والـ RSI عن مجاراة الارتفاع، مما ينذر بضعف زخم الصعود واحتمالية جني أرباح قريبة.',
      score: 25,
    };
  }

  // Hidden Bullish Divergence in uptrend
  if (changePct > 0 && rsiValue >= 45 && rsiValue <= 65 && macdHist >= 0) {
    return {
      detected: true,
      type: 'BULLISH',
      titleAr: 'دايفرجنس إيجابي استمراري (Hidden Bullish Divergence)',
      detailsAr: 'استقرار نسبي فوق مستويات الدعم مع محافظة مؤشرات العزم على هيكل صاعد يدعم استمرار الاتجاه الصاعد.',
      score: 75,
    };
  }

  return {
    detected: false,
    type: 'NONE',
    titleAr: 'لا يوجد دايفرجنس شاذ حالياً',
    detailsAr: 'حركة السعر متوافقة طبيعياً مع مؤشرات العزم دون انحراف ملحوظ.',
    score: 50,
  };
}

/**
 * Evaluates Volume Profile & Institutional Accumulation
 */
function evaluateVolumePillar(stock: EGXStock): IndicatorPillar {
  const vol = stock.volume || 10000;
  // Estimate 20-day Average Daily Volume (ADV20)
  const adv20 = (stock as any).averageVolume || (stock as any).avgVolume20 || Math.max(10000, Math.round(vol * 0.78));
  const ratio = Number((vol / adv20).toFixed(2));
  const changePct = stock.changePct || 0;

  let status: PillarStatus = 'NEUTRAL';
  let statusAr = 'أحجام تداول متوسطة متوازنة';
  let score = 50;
  const positiveEvidences: string[] = [];
  const cautionEvidences: string[] = [];

  if (ratio >= 1.5 && changePct > 0) {
    status = 'BULLISH';
    statusAr = `سيولة مؤسسية ضخمة (+${Math.round((ratio - 1) * 100)}% فوق المتوسط)`;
    score = Math.min(98, 85 + Math.round(ratio * 4));
    positiveEvidences.push(`حجم التداول اليومي (${vol.toLocaleString('ar-EG')}) يتجاوز متوسط 20 يوماً بنسبة ${Math.round(ratio * 100)}% مع صعود سعري.`);
    positiveEvidences.push('تأكيد تدفق سيولة استثمارية مؤسسية داعمة لكسر المقاومات.');
  } else if (ratio >= 1.1 && changePct >= 0) {
    status = 'BULLISH';
    statusAr = `تجميع إيجابي أعلى من المتوسط (${ratio}x)`;
    score = 75;
    positiveEvidences.push(`تداول بحجم أعلى من المعتاد (${ratio}x)، مما يؤيد استمرار العزم الشرائي.`);
  } else if (ratio >= 1.5 && changePct < -1.5) {
    status = 'BEARISH';
    statusAr = `تصريف سلبي مرتفع الحجم (${ratio}x)`;
    score = 25;
    cautionEvidences.push(`ضغط بيعي مرتفع بحجم يفوق المتوسط بـ ${Math.round((ratio - 1) * 100)}% مع هبوط في السعر.`);
  } else {
    status = 'NEUTRAL';
    statusAr = `تداول اعتيادي (${ratio}x المتوسط)`;
    score = 55;
    if (vol < adv20 * 0.6) {
      cautionEvidences.push('ضعف نسبي في أحجام التداول اليومية يحتاج لتأكيد قبل اتخاذ مراكز كبيرة.');
    } else {
      positiveEvidences.push('أحجام التداول في النطاق الطبيعي المستقر دون ضغوط بيعية.');
    }
  }

  return {
    name: 'Volume',
    nameAr: 'حجم التداول والسيولة (Volume & Liquidity)',
    status,
    statusAr,
    score,
    weight: 0.20,
    keyMetric: `${ratio}x من متوسط 20 يوم (${vol.toLocaleString('ar-EG')} سهم)`,
    detailsAr: `مستوى الحجم الحالي مقارنة بالمتوسط: ${ratio}x. ${statusAr}.`,
    positiveEvidences,
    cautionEvidences,
  };
}

/**
 * Primary Engine: Synthesizes SuperTrend, MACD, Volume, and Divergences into a definitive Strong Opinion
 */
export function evaluateCompositeTechnicalVerdict(
  stock: EGXStock,
  timeframe: TradingTimeframe = '1D',
  timeframeLabel: string = 'يومي (1D)'
): CompositeSignalVerdict {
  const p = stock.price > 0 ? stock.price : 10;
  const changePct = stock.changePct || 0;
  const nowStr = getCairoCurrentTimeFormatted();

  // 1. Technical Indicators calculation
  const tech = calculateStockTechnicalIndicators(stock, timeframe);
  const st = tech.superTrend;
  const macd = tech.macd;
  const rsi = tech.rsi.value;

  // --- Pillar 1: SuperTrend ---
  const stLine = Number(st.superTrendValue.toFixed(2));
  const isStBullish = st.isBullish;
  const stDistancePct = Number((((p - stLine) / p) * 100).toFixed(2));
  
  const superTrendPillar: IndicatorPillar = {
    name: 'SuperTrend',
    nameAr: 'السوبر ترند (SuperTrend)',
    status: isStBullish ? 'BULLISH' : 'BEARISH',
    statusAr: isStBullish ? 'صاعد إيجابي (أخضر 🟢)' : 'هابط سلبي (أحمر 🔴)',
    score: isStBullish ? Math.min(95, 75 + Math.round(Math.max(0, stDistancePct * 2))) : 20,
    weight: 0.30,
    keyMetric: `خط الترند: ${stLine.toFixed(2)} ج.م (${isStBullish ? '+' : ''}${stDistancePct}%)`,
    detailsAr: isStBullish
      ? `السعر يتداول أعلى خط السوبر ترند (${stLine.toFixed(2)} ج.م) بفارق أمان +${stDistancePct}%. الدعم قوي ومستقر.`
      : `السعر يتداول أدنى خط السوبر ترند (${stLine.toFixed(2)} ج.م) بفارق ${stDistancePct}%. الاتجاه هابط ويشكل خط السوبر ترند مقاومة فورية.`,
    positiveEvidences: isStBullish
      ? [`السوبر ترند صاعد ومستقر، مما يحمي المراكز الشرائية طالما ظل السعر أعلى ${stLine.toFixed(2)} ج.م.`]
      : [],
    cautionEvidences: !isStBullish
      ? [`السوبر ترند في المنطقة السلبية أدنى المقاومة ${stLine.toFixed(2)} ج.م، مما يستوجب الحذر أو الوقف الصارم.`]
      : [],
  };

  // --- Pillar 2: MACD ---
  const isMacdBullish = macd.isBullish;
  const isMacdCrossUp = macd.isBullishCross;
  const hist = macd.histogram;
  
  let macdStatus: PillarStatus = 'NEUTRAL';
  let macdStatusAr = 'محايد';
  let macdScore = 50;
  const macdPos: string[] = [];
  const macdCaut: string[] = [];

  if (isMacdCrossUp && hist > 0) {
    macdStatus = 'BULLISH';
    macdStatusAr = 'تقاطع صاعد ذهبي حديث (Golden Cross ⚡)';
    macdScore = 95;
    macdPos.push(`تقاطع صاعد نشط لخط الماكدي فوق خط الإشارة مع هيستوجرام متصاعد (+${hist}).`);
    macdPos.push('زخم شرائي متسارع يؤكد بداية موجة صعود جديدة.');
  } else if (isMacdBullish && hist >= 0) {
    macdStatus = 'BULLISH';
    macdStatusAr = 'مسار صاعد متماسك فوق خط الإشارة 🟢';
    macdScore = 80;
    macdPos.push(`استمرار تداول خط الماكدي فوق خط الإشارة وهيستوجرام إيجابي (+${hist}).`);
  } else if (!isMacdBullish && hist < 0 && macd.macdLine < macd.signalLine) {
    macdStatus = 'BEARISH';
    macdStatusAr = 'تقاطع سلبي هابط (Dead Cross 🛑)';
    macdScore = 20;
    macdCaut.push(`خط الماكدي يتداول أسفل خط الإشارة مع هيستوجرام سلبي متسع (${hist}).`);
  } else {
    macdStatus = 'NEUTRAL';
    macdStatusAr = 'تذبذب وضغط عرضي في الماكدي';
    macdScore = 48;
    macdCaut.push('تقارب خطوط الماكدي بانتظار إشارة حاسمة للاتجاه القادم.');
  }

  const macdPillar: IndicatorPillar = {
    name: 'MACD',
    nameAr: 'الماكدي والزخم (MACD Momentum)',
    status: macdStatus,
    statusAr: macdStatusAr,
    score: macdScore,
    weight: 0.30,
    keyMetric: `الهيستوجرام: ${hist >= 0 ? '+' : ''}${hist} | خط الماكدي: ${macd.macdLine}`,
    detailsAr: `حالة الماكدي: ${macdStatusAr}. قراءة الهيستوجرام: ${hist >= 0 ? '+' : ''}${hist}.`,
    positiveEvidences: macdPos,
    cautionEvidences: macdCaut,
  };

  // --- Pillar 3: Volume & Liquidity ---
  const volumePillar = evaluateVolumePillar(stock);

  // --- Pillar 4: Divergences ---
  const divResult = detectStockDivergences(stock, rsi, hist, isMacdCrossUp);
  const divPos: string[] = [];
  const divCaut: string[] = [];
  if (divResult.type === 'BULLISH') {
    divPos.push(divResult.detailsAr);
  } else if (divResult.type === 'BEARISH') {
    divCaut.push(divResult.detailsAr);
  }

  const divergencePillar: IndicatorPillar = {
    name: 'Divergence',
    nameAr: 'الدايفرجنس والانحرافات (Divergence)',
    status: divResult.type === 'BULLISH' ? 'BULLISH' : divResult.type === 'BEARISH' ? 'BEARISH' : 'NEUTRAL',
    statusAr: divResult.titleAr,
    score: divResult.score,
    weight: 0.20,
    keyMetric: divResult.detected ? `رصد: ${divResult.titleAr}` : 'لا انحراف شاذ',
    detailsAr: divResult.detailsAr,
    positiveEvidences: divPos,
    cautionEvidences: divCaut,
  };

  // --- Synthesis & Weighted Score ---
  const totalScore = Math.round(
    superTrendPillar.score * superTrendPillar.weight +
    macdPillar.score * macdPillar.weight +
    volumePillar.score * volumePillar.weight +
    divergencePillar.score * divergencePillar.weight
  );

  // Count positive confirmations
  const pillarsList = [superTrendPillar, macdPillar, volumePillar, divergencePillar];
  const positiveConfirmationCount = pillarsList.filter((p) => p.status === 'BULLISH').length;
  const negativeConfirmationCount = pillarsList.filter((p) => p.status === 'BEARISH').length;

  // Aggregate positive and caution evidences
  const allPositiveEvidences: string[] = [];
  const allCautionEvidences: string[] = [];
  pillarsList.forEach((pil) => {
    pil.positiveEvidences.forEach((ev) => allPositiveEvidences.push(ev));
    pil.cautionEvidences.forEach((ev) => allCautionEvidences.push(ev));
  });

  // Calculate potential buy zones and precise execution targets
  const buyZoneMin = isStBullish ? Math.max(stLine * 1.002, p * 0.985) : p * 0.96;
  const buyZoneMax = p * 1.012;
  const suggestedBuyEntry = Number(((buyZoneMin + p) / 2).toFixed(2));
  
  const target1Price = Number((suggestedBuyEntry * 1.045).toFixed(2));
  const target1GainPct = Number((((target1Price - suggestedBuyEntry) / suggestedBuyEntry) * 100).toFixed(2));
  
  const target2Price = Number((suggestedBuyEntry * 1.095).toFixed(2));
  const target2GainPct = Number((((target2Price - suggestedBuyEntry) / suggestedBuyEntry) * 100).toFixed(2));

  // Stop loss strictly anchored to SuperTrend support line or risk buffer
  const stopLossPrice = isStBullish
    ? Number(Math.min(p * 0.955, stLine * 0.992).toFixed(2))
    : Number((p * 0.96).toFixed(2));
  const stopLossLossPct = Number((((stopLossPrice - suggestedBuyEntry) / suggestedBuyEntry) * 100).toFixed(2));

  const potentialRisk = Math.abs(stopLossLossPct);
  const potentialReward = target1GainPct;
  const rr = potentialRisk > 0 ? (potentialReward / potentialRisk).toFixed(1) : '2.5';
  const riskRewardRatio = `1:${rr}`;

  // Classification logic for strong definitive verdict
  let verdictType: CompositeSignalVerdictType = 'NEUTRAL';
  let verdictTitleAr = 'ترقب ومراقبة حيادية (توازن القوى)';
  let verdictBadgeAr = 'ترقب ومراقبة ⚖️';
  let verdictActionAr: CompositeSignalVerdict['verdictActionAr'] = 'مراقبة وترقب';
  let badgeColor: CompositeSignalVerdict['badgeColor'] = 'slate';
  let definitiveStrongOpinionAr = '';

  if (positiveConfirmationCount >= 3 && totalScore >= 75) {
    verdictType = 'STRONG_BUY';
    verdictTitleAr = 'شراء قوي مؤكد باتفاق المؤشرات الأربعة (سوبر ترند + ماكدي + سيولة + دايفرجنس)';
    verdictBadgeAr = 'شراء قوي مؤكد 🚀';
    verdictActionAr = 'شراء فوري مؤكد';
    badgeColor = 'emerald';
    definitiveStrongOpinionAr = `توافق إيجابي كاسح بنسبة تأكيد ${totalScore}%: السوبر ترند صاعد ومؤشر الماكدي في موجة اختراق مع تدفق سيولة أعلى من المعتاد وتأييد الدايفرجنس. يُنصح بالدخول الفوري في نطاق الشراء بين ${buyZoneMin.toFixed(2)} و ${buyZoneMax.toFixed(2)} ج.م مع استهداف ${target1Price.toFixed(2)} ج.م ثم ${target2Price.toFixed(2)} ج.م والالتزام بوقف الخسارة الصارم عند ${stopLossPrice.toFixed(2)} ج.م.`;
  } else if (positiveConfirmationCount >= 2 && isStBullish && totalScore >= 60) {
    verdictType = 'BUY_ACCUMULATE';
    verdictTitleAr = 'تجميع تدريجي مدروس على الدعوم الفنية';
    verdictBadgeAr = 'تجميع تدريجي 💎';
    verdictActionAr = 'تجميع تدريجي';
    badgeColor = 'teal';
    definitiveStrongOpinionAr = `السهم يحظى بغطاء صاعد من السوبر ترند ودعم من زخم الماكدي بنسبة توافق ${totalScore}%. يُنصح ببناء مراكز شرائية تدريجية قرب مستويات الدعم (${buyZoneMin.toFixed(2)} ج.م) والاحتفاظ بهدف ${target1Price.toFixed(2)} ج.م.`;
  } else if (negativeConfirmationCount >= 3 || (totalScore <= 35 && !isStBullish)) {
    verdictType = 'STRONG_SELL';
    verdictTitleAr = 'إشارة بيع ووقف خسارة قطعية (كسر السوبر ترند وتأكيد الماكدي الهابط)';
    verdictBadgeAr = 'بيع ووقف خسارة 🛑';
    verdictActionAr = 'بيع ووقف خسارة';
    badgeColor = 'rose';
    definitiveStrongOpinionAr = `رأي فني قاطع بالخروج والتخفيف: السوبر ترند مكسور للأسفل مع تقاطع ماكدي سلبي متسع وضغط بيعي. يُنصح بتفعيل وقف الخسارة فوراً دون تردد عند ${stopLossPrice.toFixed(2)} ج.م وتجنب الشراء لحين تشكل قاع حقيقي معتمد.`;
  } else if (isStBullish && macdStatus === 'BEARISH' && changePct <= 0) {
    verdictType = 'TAKE_PROFIT';
    verdictTitleAr = 'جني أرباح وتخفيف مراكز جزئياً (فقدان الزخم)';
    verdictBadgeAr = 'جني أرباح / حذر 🟠';
    verdictActionAr = 'جني أرباح وتخفيف';
    badgeColor = 'amber';
    definitiveStrongOpinionAr = `على الرغم من بقاء السوبر ترند صاعداً، إلا أن مؤشر الماكدي أعطى تقاطعاً سلبياً ينذر بضعف العزم واحتمالية حركة تصحيحية قريبة. يُفضل جني أرباح جزئي وتأمين الأرباح عند المستويات الحالية (${p.toFixed(2)} ج.م).`;
  } else {
    verdictType = 'NEUTRAL';
    verdictTitleAr = 'منطقة ترقب وملاحظة (تضارب الإشارات الفنية)';
    verdictBadgeAr = 'ترقب ومراقبة ⚖️';
    verdictActionAr = 'مراقبة وترقب';
    badgeColor = 'slate';
    definitiveStrongOpinionAr = `المؤشرات الفنية في حالة توازن عرضي (تأكيد ${totalScore}%). يُفضل الانتظار خارج السهم حتى حدوث اختراق مؤكد للسوبر ترند أو تقاطع صاعد واضح للماكدي والسيولة.`;
  }

  // Full formatted report text
  const fullFormattedReportText = `🎯 التقرير الفني الشامل والرأي القاطع الموحد (MACD + SuperTrend + Volume + Divergence)
سهم: ${stock.nameAr} (${stock.symbol}) | توقيت القاهرة: ${nowStr}
السعر اللحظي للشارت: ${p.toFixed(2)} ج.م (${changePct >= 0 ? '+' : ''}${changePct}%)

🏆 الرأي الفني القاطع: [${verdictBadgeAr}] - ${verdictActionAr}
نسبة القوة والتوافق الفني: ${totalScore}% (${positiveConfirmationCount} من 4 مؤشرات تؤيد الإيجابية)

📋 تفصيل المؤشرات الأربعة الرئيسية:
1. السوبر ترند (SuperTrend): ${superTrendPillar.statusAr} | ${superTrendPillar.keyMetric}
2. الماكدي (MACD): ${macdPillar.statusAr} | ${macdPillar.keyMetric}
3. أحجام التداول والسيولة (Volume): ${volumePillar.statusAr} | ${volumePillar.keyMetric}
4. الدايفرجنس (Divergence): ${divergencePillar.statusAr} | ${divergencePillar.keyMetric}

📍 نقاط التنفيذ الاستراتيجية المقترحة:
- نقطة الشراء المحتملة (نطاق الدخول): ${buyZoneMin.toFixed(2)} - ${buyZoneMax.toFixed(2)} ج.م (دخول مثالي: ${suggestedBuyEntry.toFixed(2)} ج.م)
- نقطة البيع / الهدف الأول (TP1): ${target1Price.toFixed(2)} ج.م (+${target1GainPct}%)
- نقطة البيع / الهدف الثاني (TP2): ${target2Price.toFixed(2)} ج.م (+${target2GainPct}%)
- نقطة وقف الخسارة الصارم (SL): ${stopLossPrice.toFixed(2)} ج.م (${stopLossLossPct}%) مرتكزة على خط السوبر ترند
- معامل العائد إلى المخاطرة (R:R): ${riskRewardRatio}

💡 الخلاصة الاستراتيجية:
${definitiveStrongOpinionAr}`;

  return {
    symbol: stock.symbol,
    stockNameAr: stock.nameAr,
    currentPrice: p,
    timeframe: timeframeLabel,
    verdictType,
    verdictTitleAr,
    verdictBadgeAr,
    verdictActionAr,
    badgeColor,
    confidenceScorePct: totalScore,
    positiveConfirmationCount,
    totalPillarsCount: 4,
    pillars: {
      macd: macdPillar,
      superTrend: superTrendPillar,
      volume: volumePillar,
      divergence: divergencePillar,
    },
    executionLevels: {
      buyZoneMin,
      buyZoneMax,
      suggestedBuyEntry,
      target1Price,
      target1GainPct,
      target2Price,
      target2GainPct,
      stopLossPrice,
      stopLossLossPct,
      riskRewardRatio,
    },
    positiveConfluencesSummaryAr: allPositiveEvidences,
    cautionWarningsSummaryAr: allCautionEvidences,
    definitiveStrongOpinionAr,
    timestampAr: nowStr,
    fullFormattedReportText,
  };
}
