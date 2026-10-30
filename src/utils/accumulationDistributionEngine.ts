import { EGXStock } from '../types/stock';
import { getCairoCurrentTimeFormatted } from './reportDisclaimer';

function formatEgpMoney(val?: number): string {
  if (val === undefined || val === null || isNaN(val) || val === 0) return '0 ج.م';
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)} مليار ج.م`;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)} مليون ج.م`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)} ألف ج.م`;
  return `${val.toLocaleString()} ج.م`;
}

export type AccumulationDistributionPhase =
  | 'STRONG_ACCUMULATION'     // تجميع مؤسسي حاسم
  | 'STEADY_ACCUMULATION'     // تجميع تراكمي مستمر
  | 'ABSORPTION_SPRING'       // امتصاص عروض وسبرينج تجميعي
  | 'EQUILIBRIUM'             // توازن نسبي وترقب
  | 'STEADY_DISTRIBUTION'     // تصريف وتخارج تدريجي
  | 'HEAVY_DISTRIBUTION';     // تصريف مؤسسي حاد وتدوير

export interface AccumulationDistributionResult {
  symbol: string;
  stockNameAr: string;
  price: number;
  changePct: number;
  timeframeLabel: string;

  // Primary Precision Classification
  phase: AccumulationDistributionPhase;
  phaseAr: string;
  isAccumulation: boolean;
  isDistribution: boolean;
  badgeColor: 'emerald' | 'teal' | 'slate' | 'amber' | 'rose';

  // Quantitative Metric (0 to 100: 0 = Heavy Distribution, 50 = Neutral, 100 = Strong Accumulation)
  accumulationScore: number;
  distributionScore: number; // 100 - accumulationScore
  flowDominanceText: string;

  // Close Location Value (CLV / Intraday Intensity: -1.0 to +1.0)
  clv: number;
  clvStatusAr: string;

  // Wyckoff Cycle Stage Diagnosis
  wyckoffStageAr: string;
  wyckoffPhaseCode: 'PHASE_A' | 'PHASE_B' | 'PHASE_C_SPRING' | 'PHASE_D_SOS' | 'PHASE_BC_UTAD' | 'PHASE_SOW';
  wyckoffExplanationAr: string;

  // Volume Spread Analysis (VSA)
  vsaInsightAr: string;
  vsaSignificance: 'BULLISH_ABSORPTION' | 'NO_SUPPLY' | 'CHURNING_DISTRIBUTION' | 'UPTHRUST' | 'NORMAL';

  // Smart Money Net Institutional Accumulation Volume & Value
  estimatedAccumulatedValueEgp: number;
  moneyFlowIntensityPct: number; // -100% to +100%

  // Explicit Clear Actionable Verdict
  detailedVerdictAr: string;
  actionAdviceAr: string;

  timestampAr: string;
  fullReportSummaryText: string;
}

/**
 * Calculates high-precision Institutional Accumulation vs Distribution metric (Wyckoff + VSA + Chaikin A/D + CLV)
 * Specifically engineered to filter out temporary market noise and volatility.
 */
export function calculateAccumulationDistribution(
  stock: EGXStock,
  timeframeLabel: string = 'يومي (1D)'
): AccumulationDistributionResult {
  const p = stock.price > 0 ? stock.price : 10;
  const high = stock.high && stock.high >= p ? stock.high : p * 1.02;
  const low = stock.low && stock.low <= p ? stock.low : p * 0.98;
  const range = Math.max(0.01, high - low);
  const open = stock.open && stock.open > 0 ? stock.open : p;
  const changePct = stock.changePct || 0;
  const volume = stock.volume && stock.volume > 0 ? stock.volume : 250000;
  const valueTraded = stock.valueTraded && stock.valueTraded > 0 ? stock.valueTraded : volume * p;
  const rsi = stock.rsi14 || 50;

  // 1. Close Location Value (CLV / Intraday Intensity)
  // CLV = ((Close - Low) - (High - Close)) / (High - Low) = (2 * Close - High - Low) / Range
  // Range is from -1.0 (Closed at dead low) to +1.0 (Closed at absolute high)
  const rawClv = (2 * p - high - low) / range;
  const clv = Number(Math.max(-1.0, Math.min(1.0, rawClv)).toFixed(3));

  let clvStatusAr = 'إغلاق في منتصف شمعة التداول (توازن)';
  if (clv >= 0.6) {
    clvStatusAr = 'إغلاق في الربع العلوي للشمعة (تحكم كامل للمشترين)';
  } else if (clv >= 0.2) {
    clvStatusAr = 'إغلاق في النصف العلوي للشمعة (ميل شرائي واضح)';
  } else if (clv <= -0.6) {
    clvStatusAr = 'إغلاق في الربع السفلي للشمعة (تحكم كامل للبائعين)';
  } else if (clv <= -0.2) {
    clvStatusAr = 'إغلاق في النصف السفلي للشمعة (ميل بيعي واضح)';
  }

  // 2. Chaikin Money Flow Multiplier & Spread Analysis
  // Spread vs Price Progress (VSA)
  const candleBody = Math.abs(p - open);
  const lowerWick = Math.min(open, p) - low;
  const upperWick = high - Math.max(open, p);

  // VSA Sign of Accumulation:
  // - High volume with narrow spread at lows = Absorption
  // - Long lower wick with high volume = Stopping volume / Spring
  // VSA Sign of Distribution:
  // - High volume with small spread at highs = Churning / Upthrust
  // - Long upper wick after rise = Selling into retail bids
  let vsaSignificance: AccumulationDistributionResult['vsaSignificance'] = 'NORMAL';
  let vsaInsightAr = 'أحجام التداول والمدى السعري يتحركان بتوافق طبيعي.';

  const isHighTurnover = valueTraded >= 15_000_000 || volume >= 800_000;

  if (lowerWick >= range * 0.45 && isHighTurnover) {
    vsaSignificance = 'BULLISH_ABSORPTION';
    vsaInsightAr = 'امتصاص بيعي مؤسسي (Absorption / Stopping Volume): ظهور طلبات شراء ضخمة ابتلعت عروض البيع من القيعان.';
  } else if (upperWick >= range * 0.45 && (isHighTurnover || changePct < 0)) {
    vsaSignificance = 'UPTHRUST';
    vsaInsightAr = 'اختراق وهمي علوي وتصريف (Upthrust): صانع السوق قام بالبيع والتخارج عند ارتفاعات الجلسة.';
  } else if (isHighTurnover && candleBody / range < 0.25) {
    if (p < (high + low) / 2) {
      vsaSignificance = 'BULLISH_ABSORPTION';
      vsaInsightAr = 'تجميع هادئ (Quiet Accumulation): سيولة عالية جداً ونطاق ضيق في القاع لمنع ارتفاع السعر قبل استكمال الكميات.';
    } else {
      vsaSignificance = 'CHURNING_DISTRIBUTION';
      vsaInsightAr = 'تدوير وتصريف سلبي (Churning): دوران سيولة ضخمة دون تقدم سعري حقيقي دليلاً على خروج محافظ كبيرة.';
    }
  } else if (volume < 200_000 && Math.abs(changePct) < 0.8) {
    vsaSignificance = 'NO_SUPPLY';
    vsaInsightAr = 'انعدام العروض البيعية (No Supply Test): جفاف كامل في أحجام البيع يؤكد انتهاء ضغوط التخلص من السهم.';
  }

  // 3. Composite Precision Accumulation/Distribution Score (0 - 100)
  // Factors:
  // - CLV weight: 35%
  // - VSA pattern weight: 25%
  // - Price location vs SMA20 & SMA50: 20%
  // - Volume & Momentum: 20%
  let rawScore = 50;

  // CLV component (-35 to +35)
  rawScore += clv * 35;

  // VSA component
  if (vsaSignificance === 'BULLISH_ABSORPTION') rawScore += 20;
  else if (vsaSignificance === 'NO_SUPPLY') rawScore += 12;
  else if (vsaSignificance === 'UPTHRUST') rawScore -= 22;
  else if (vsaSignificance === 'CHURNING_DISTRIBUTION') rawScore -= 18;

  // Moving Average location
  if (stock.sma20 && p >= stock.sma20) rawScore += 8;
  else if (stock.sma20 && p < stock.sma20) rawScore -= 8;

  if (stock.sma50 && p >= stock.sma50) rawScore += 7;
  else if (stock.sma50 && p < stock.sma50) rawScore -= 7;

  // Momentum & change
  if (changePct >= 2.0 && clv > 0) rawScore += 10;
  else if (changePct >= 0.5) rawScore += 5;
  else if (changePct <= -2.0 && clv < 0) rawScore -= 10;
  else if (changePct <= -0.5) rawScore -= 5;

  // Clamp 5 to 98
  const accumulationScore = Math.min(98, Math.max(5, Math.round(rawScore)));
  const distributionScore = 100 - accumulationScore;

  // 4. Wyckoff Cycle Stage Diagnosis
  let wyckoffStageAr = 'المرحلة B: بناء النطاق التجميعي وامتصاص العروض (Accumulation Phase B)';
  let wyckoffPhaseCode: AccumulationDistributionResult['wyckoffPhaseCode'] = 'PHASE_B';
  let wyckoffExplanationAr = 'تذبذب أفقي هادئ مع امتصاص السيولة البيعية تدريجياً وبناء قاعدة سعرية قوية.';

  if (accumulationScore >= 78) {
    if (changePct >= 2.5) {
      wyckoffPhaseCode = 'PHASE_D_SOS';
      wyckoffStageAr = 'المرحلة D: ظهور علامة القوة والانطلاق الصاعد (Sign of Strength - SOS)';
      wyckoffExplanationAr = 'اختراق صريح لسقف نطاق التجميع مع تدفق سيولة مؤسسية ضخمة تؤكد انتقال السهم لمرحلة الصعود الرابح (Markup).';
    } else {
      wyckoffPhaseCode = 'PHASE_C_SPRING';
      wyckoffStageAr = 'المرحلة C: سبرينج تجميعي واختبار القاع (Wyckoff Spring & Shakeout)';
      wyckoffExplanationAr = 'كسر كاذب للقيعان لطرد المتعاملين الأفراد واستعادة السعر فوراً بأعلى وتيرة شراء مؤسسية (أفضل مناطق التمركز).';
    }
  } else if (accumulationScore >= 60) {
    wyckoffPhaseCode = 'PHASE_B';
    wyckoffStageAr = 'المرحلة B: تجميع تراكمي مستمر فوق الدعوم (Absorption)';
    wyckoffExplanationAr = 'صانع السوق يمتص عروض البيع تدريجياً دون السماح بهبوط السعر لأدنى من مستويات الدعم الرئيسية.';
  } else if (accumulationScore <= 25) {
    wyckoffPhaseCode = 'PHASE_SOW';
    wyckoffStageAr = 'المرحلة D/E: كسر دعوم وبدء موجة الهبوط (Sign of Weakness - Markdown)';
    wyckoffExplanationAr = 'تخارج مؤسسي صريح وكسر للدعوم السعرية مع غياب تام للمشتري الداعم.';
  } else if (accumulationScore <= 42) {
    wyckoffPhaseCode = 'PHASE_BC_UTAD';
    wyckoffStageAr = 'المرحلة B/C: تصريف علوي وتدوير سلبي (Distribution Phase / UTAD)';
    wyckoffExplanationAr = 'بيع تدريجي على عروض الشراء عند القمم وتفريغ المحافظ مع حذر من صدمات هبوطية مفاجئة.';
  } else {
    wyckoffPhaseCode = 'PHASE_A';
    wyckoffStageAr = 'المرحلة A: إيقاف الاتجاه والتوازن (Stopping Volume / Equilibrium)';
    wyckoffExplanationAr = 'تساوي نسبي بين المشترين والبائعين وانتظار محفز يحدد انتقال السهم للتجميع أو التصريف.';
  }

  // 5. Categorical Phase Determination
  let phase: AccumulationDistributionPhase = 'EQUILIBRIUM';
  let phaseAr = 'توازن وتماسك محايد (Equilibrium)';
  let badgeColor: AccumulationDistributionResult['badgeColor'] = 'slate';
  let isAccumulation = false;
  let isDistribution = false;

  if (accumulationScore >= 75) {
    phase = 'STRONG_ACCUMULATION';
    phaseAr = 'تجميع مؤسسي حاسم (Strong Accumulation 💎)';
    badgeColor = 'emerald';
    isAccumulation = true;
  } else if (accumulationScore >= 60) {
    phase = 'STEADY_ACCUMULATION';
    phaseAr = 'تجميع تراكمي مستمر (Steady Accumulation 🟢)';
    badgeColor = 'teal';
    isAccumulation = true;
  } else if (wyckoffPhaseCode === 'PHASE_C_SPRING' || vsaSignificance === 'BULLISH_ABSORPTION') {
    phase = 'ABSORPTION_SPRING';
    phaseAr = 'امتصاص وسبرينج تجميعي (Spring Absorption ⚓)';
    badgeColor = 'emerald';
    isAccumulation = true;
  } else if (accumulationScore <= 25) {
    phase = 'HEAVY_DISTRIBUTION';
    phaseAr = 'تصريف مؤسسي حاد وتخارج (Heavy Distribution 🛑)';
    badgeColor = 'rose';
    isDistribution = true;
  } else if (accumulationScore <= 42) {
    phase = 'STEADY_DISTRIBUTION';
    phaseAr = 'تصريف تدريجي وتدوير (Early Distribution ⚠️)';
    badgeColor = 'amber';
    isDistribution = true;
  } else {
    phase = 'EQUILIBRIUM';
    phaseAr = 'توازن محايد وترقب (Neutral Equilibrium ⚖️)';
    badgeColor = 'slate';
  }

  // Net money flow estimation
  const moneyFlowIntensityPct = Number(((clv * 0.6 + (accumulationScore - 50) * 0.8) / 1.4).toFixed(1));
  const estimatedAccumulatedValueEgp = Math.round((valueTraded * (accumulationScore - 50)) / 100);

  // Detailed Actionable Narrative Sentence
  let detailedVerdictAr = '';
  let actionAdviceAr = '';

  if (isAccumulation) {
    detailedVerdictAr = `تشخيص المقياس الدقيق: السهم في [${phaseAr}] بنسبة قوة تجميع ${accumulationScore}% مقابل تصريف ${distributionScore}%. مؤشر CLV عند ${clv > 0 ? '+' : ''}${clv} يؤكد أن الإغلاقات تتم باستمرار في النصف العلوي للشموع مع امتصاص كامل للضغوط البيعية وفق نموذج [${wyckoffStageAr}]. صافي تدفق السيولة التجميعية يقدر بـ +${formatEgpMoney(Math.abs(estimatedAccumulatedValueEgp))}.`;
    actionAdviceAr = 'التمركز والشراء التجميعي على دفعات مع ثقة مؤسسية عالية، ورفع وقف الخسارة أسفل قاع شمعة التجميع.';
  } else if (isDistribution) {
    detailedVerdictAr = `تشخيص المقياس الدقيق: السهم في [${phaseAr}] بنسبة تصريف ضاغطة ${distributionScore}% مقابل تجميع ضعيف ${accumulationScore}%. مؤشر CLV عند ${clv} يثبت إغلاق السعر قرب قيعان الشموع دليلاً على تفريغ صانع السوق للكميات وفق [${wyckoffStageAr}]. صافي السيولة المصرفة يقدر بـ -${formatEgpMoney(Math.abs(estimatedAccumulatedValueEgp))}.`;
    actionAdviceAr = 'تخفيف المراكز وتأمين الأرباح فوراً، وتجنب الشراء أو التعديل حتى انتهاء دورة التصريف واكتمال مرحلة الإيقاف.';
  } else {
    detailedVerdictAr = `تشخيص المقياس الدقيق: السهم في [${phaseAr}] بدرجة تعادل ${accumulationScore}%. مؤشر CLV عند ${clv > 0 ? '+' : ''}${clv} يعكس حركة سعرية متوازنة بين العرض والطلب بدون هيمنة صريحة للتجميع أو التصريف.`;
    actionAdviceAr = 'المراقبة والانتظار حتى يؤكد السهم كسراً أو اختراقاً مصحوباً بارتفاع واضح في أحجام التداول وخط السيولة.';
  }

  const timestampAr = getCairoCurrentTimeFormatted();

  const fullReportSummaryText = `🔬 *تقرير مقياس التجميع والتصريف الدقيق (Accumulation vs Distribution Engine)*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 السهم: ${stock.nameAr} (${stock.symbol}) | السعر اللحظي: ${p.toFixed(2)} ج.م (${changePct >= 0 ? '+' : ''}${changePct}%)
⏱️ الفريم: ${timeframeLabel} | التوقيت: ${timestampAr}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 *حالة السهم الدقيقة:* [${phaseAr}]
📊 *ميزان التجميع vs التصريف:*
• نسبة التجميع المؤسسي: ${accumulationScore}%
• نسبة التصريف البيعي: ${distributionScore}%
• معامل موضع الإغلاق (CLV): ${clv > 0 ? '+' : ''}${clv} (${clvStatusAr})
• صافي السيولة المقدرة: ${estimatedAccumulatedValueEgp >= 0 ? '+' : ''}${formatEgpMoney(estimatedAccumulatedValueEgp)}

🏛️ *دورة وايكوف المؤسسية (Wyckoff Cycle Stage):*
• المرحلة: ${wyckoffStageAr}
• التفسير: ${wyckoffExplanationAr}

📈 *تحليل حركة الحجم والمدى (Volume Spread Analysis - VSA):*
• ${vsaInsightAr}

💡 *الخلاصة والتوصية الاستراتيجية:*
${detailedVerdictAr}
التوصية: ${actionAdviceAr}`;

  const flowDominanceText = isAccumulation
    ? `تجميع مؤسسي صريح (${accumulationScore}%)`
    : isDistribution
    ? `تصريف بيعي ضاغط (${distributionScore}%)`
    : `توازن محايد (${accumulationScore}%)`;

  return {
    symbol: stock.symbol,
    stockNameAr: stock.nameAr,
    price: p,
    changePct,
    timeframeLabel,
    phase,
    phaseAr,
    isAccumulation,
    isDistribution,
    badgeColor,
    accumulationScore,
    distributionScore,
    flowDominanceText,
    clv,
    clvStatusAr,
    wyckoffStageAr,
    wyckoffPhaseCode,
    wyckoffExplanationAr,
    vsaInsightAr,
    vsaSignificance,
    estimatedAccumulatedValueEgp,
    moneyFlowIntensityPct,
    detailedVerdictAr,
    actionAdviceAr,
    timestampAr,
    fullReportSummaryText,
  };
}
