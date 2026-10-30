import { EGXStock, TradingTimeframe, TRADING_TIMEFRAMES } from '../types/stock';
import { calculateStockTechnicalIndicators } from './technicalAnalysisService';
import { analyzeAnnualVolumeAndLiquidity } from './radarAdvancedEngine';
import { GoogleGenAI } from '@google/genai';
import {
  getCairoCurrentTimeFormatted,
  CHART_15_MIN_DELAY_NOTICE_AR,
  LEGAL_DISCLAIMER_AR,
  evaluateChartTechnicalReading,
  ChartTechnicalVerdict,
} from '../utils/reportDisclaimer';
import {
  getTradingViewChartVerdict,
  TradingViewTechnicalBreakdown,
} from '../utils/tradingViewChartVerdict';
import {
  calculateAccumulationDistribution,
  AccumulationDistributionResult,
} from '../utils/accumulationDistributionEngine';

export interface CouncilModelOpinion {
  modelNameAr: string;
  roleAr: string;
  iconType: 'BULL' | 'BEAR' | 'JUDGE';
  scorePct: number;
  badgeAr: string;
  thesisAr: string;
  arguments: string[];
  verdictAr: string;
}

export interface CouncilVerdict {
  symbol: string;
  stockNameAr: string;
  sectorAr: string;
  timeframe: TradingTimeframe;
  timeframeLabelAr: string;
  currentPrice: number;
  changePct: number;
  isShariah: boolean;
  generatedAt: string;
  liveChartTimestamp: string;
  delayNoticeAr: string;
  disclaimerAr: string;

  chartVerdict: ChartTechnicalVerdict;
  tradingViewRating: TradingViewTechnicalBreakdown;

  bullishAdvocate: CouncilModelOpinion;
  bearishSkeptic: CouncilModelOpinion;
  supremeArbiter: {
    modelNameAr: string;
    roleAr: string;
    verdictCode: 'BUY_CONFIRMED' | 'BUY_ACCUMULATE' | 'WAIT_BREAKOUT' | 'TAKE_PROFIT' | 'EXIT_AVOID';
    verdictTitleAr: string;
    bullishWeightPct: number;
    bearishWeightPct: number;
    entryZoneMin: number;
    entryZoneMax: number;
    target1Price: number;
    target2Price: number;
    target3Price: number;
    stopLossPrice: number;
    riskRewardRatio: number;
    recommendedPositionPct: number; // % of capital
    rulingSummaryAr: string;
    executionStepsAr: string[];
  };

  fullReportText: string;
}

export async function evaluateAiCouncil(
  stock: EGXStock,
  timeframe: TradingTimeframe = '1D'
): Promise<CouncilVerdict> {
  const p = stock.price > 0 ? stock.price : 10;
  const indicators = calculateStockTechnicalIndicators(stock, timeframe);
  const volLiq = analyzeAnnualVolumeAndLiquidity(stock);
  const tfMeta = TRADING_TIMEFRAMES.find((t) => t.code === timeframe) || TRADING_TIMEFRAMES[4];

  const now = new Date();
  const cairoTimeStr = getCairoCurrentTimeFormatted(now);
  const chartVerdict = evaluateChartTechnicalReading(stock, tfMeta.labelAr);
  const tvVerdict = getTradingViewChartVerdict(stock, tfMeta.labelAr);
  const adVerdict = calculateAccumulationDistribution(stock, tfMeta.labelAr);

  // 1. Calculate Bullish Metrics
  let bullScore = indicators.consensusScore;
  const bullArgs: string[] = [];
  if (adVerdict.isAccumulation) {
    bullArgs.push(`مقياس التجميع والتصريف الدقيق: السهم في [${adVerdict.phaseAr}] بنسبة تجميع ${adVerdict.accumulationScore}% وفق مرحلة [${adVerdict.wyckoffStageAr}]`);
  }
  if (indicators.superTrend.isBullish) {
    bullArgs.push(`السهم مدعوم بمؤشر السوبرترند الصاعد فوق ${indicators.superTrend.superTrendValue.toFixed(2)} ج.م`);
  }
  if (indicators.rsi.isBullish) {
    bullArgs.push(`مؤشر القوة النسبية RSI عند ${indicators.rsi.value} يعكس زخماً شرائياً نشطاً (${indicators.rsi.statusAr})`);
  }
  if (indicators.stochastic.isBullish) {
    bullArgs.push(`الاستوكاستك يشير لتقاطع إيجابي وصعود مستمر (%K: ${indicators.stochastic.k})`);
  }
  if (indicators.macd.isBullish) {
    bullArgs.push(`الماكدي MACD في منطقة إيجابية ويعطي دلالة تأكيدية لصالح المشترين`);
  }
  if (volLiq.liquidityStudy.netInflowRatio >= 55) {
    bullArgs.push(`تدفق سيولة شرائية داخلة قوية بنسبة ${volLiq.liquidityStudy.netInflowRatio}% تفوق قوى البيع`);
  }
  if (stock.changePct > 0) {
    bullArgs.push(`أداء يومي صاعد بنسبة +${stock.changePct}% يؤكد اهتمام المشترين`);
  }
  if (chartVerdict.candlestickPatternAr.includes('صاعدة')) {
    bullArgs.push(`الشارت يُظهر ${chartVerdict.candlestickPatternAr}`);
  }
  if (bullArgs.length === 0) {
    bullArgs.push(`تداول السهم بالقرب من مستوى دعم محوري عند ${(p * 0.98).toFixed(2)} ج.م يمثل فرصة ارتدادية`);
  }

  // 2. Calculate Bearish Metrics
  let bearScore = 100 - bullScore;
  const bearArgs: string[] = [];
  if (adVerdict.isDistribution) {
    bearArgs.push(`مقياس التجميع والتصريف الدقيق: السهم في [${adVerdict.phaseAr}] بنسبة تصريف ${adVerdict.distributionScore}% وكسر موضع الإغلاق CLV: ${adVerdict.clv}`);
  }
  if (!indicators.superTrend.isBullish) {
    bearArgs.push(`السوبر ترند في اتجاه هابط ويمثل مقاومة ضاغطة عند ${indicators.superTrend.superTrendValue.toFixed(2)} ج.م`);
  }
  if (indicators.rsi.value >= 70) {
    bearArgs.push(`مؤشر RSI وصل لمناطق تشبع شرائي (${indicators.rsi.value}) مما ينذر بجني أرباح قريب`);
  }
  if (indicators.rsi.value <= 35) {
    bearArgs.push(`ضعف حاد في الزخم ومؤشر RSI في قيعان (${indicators.rsi.value})`);
  }
  if (!indicators.macd.isBullish) {
    bearArgs.push(`مؤشر الماكدي MACD يظهر تقاطعاً سلبياً أو ضعفاً في عزم الصعود`);
  }
  if (volLiq.liquidityStudy.netInflowRatio < 45) {
    bearArgs.push(`سيولة ضعيفة وتغلب قوى البيع بنسبة خروج ${100 - volLiq.liquidityStudy.netInflowRatio}%`);
  }
  if (stock.changePct < -1.5) {
    bearArgs.push(`ضغط بيعي يومي واضح بنسبة تراجع ${stock.changePct}%`);
  }
  if (chartVerdict.candlestickPatternAr.includes('هابطة')) {
    bearArgs.push(`الشارت الفني يسجل ${chartVerdict.candlestickPatternAr}`);
  }
  if (bearArgs.length === 0) {
    bearArgs.push(`مقاومة نفسية قريبة عند ${(p * 1.05).toFixed(2)} ج.م قد تعرقل مسار الصعود`);
  }

  // 3. Supreme Arbiter Synthesis
  let verdictCode: CouncilVerdict['supremeArbiter']['verdictCode'] = 'WAIT_BREAKOUT';
  let verdictTitleAr = 'انتظار وتأكيد إشارة الاختراق';
  let rulingSummaryAr = '';
  let recommendedPositionPct = 5; // Default safe % of capital

  if (bullScore >= 72) {
    verdictCode = 'BUY_CONFIRMED';
    verdictTitleAr = 'شراء وتمركز مباشر مع وقف صارم';
    recommendedPositionPct = 15;
    rulingSummaryAr = `يرى الحَكَم الفاصل تفوقاً ساحقاً لحجج النموذج المؤيد بنسبة ${bullScore}%، مع استقرار المؤشرات الزخيمة وحماية السوبر ترند. يوصى بالدخول الفوري مع الالتزام الصارم بوقف الخسارة.`;
  } else if (bullScore >= 55) {
    verdictCode = 'BUY_ACCUMULATE';
    verdictTitleAr = 'تجميع هادئ على دفعتين (Scale-in)';
    recommendedPositionPct = 10;
    rulingSummaryAr = `يرجح الحَكَم الدخول الحذر على دفعتين بنسبة صعود ${bullScore}% مقابل مخاطر ${bearScore}%. تنفيذ 60% من الكمية الآن و40% بعد تأكيد اختراق المقاومة.`;
  } else if (bullScore <= 35) {
    verdictCode = 'EXIT_AVOID';
    verdictTitleAr = 'تجنب الشراء والخروج لحماية رأس المال';
    recommendedPositionPct = 0;
    rulingSummaryAr = `يقضي الحَكَم بقبول طعن النموذج المعارض بنسبة مخاطرة ${bearScore}%. السهم تحت سيطرة البائعين ومؤشرات الهبوط واضحة، ولا ينصح بأي دخول جديد حتى إشعار آخر.`;
  } else if (indicators.rsi.value >= 70) {
    verdictCode = 'TAKE_PROFIT';
    verdictTitleAr = 'جني أرباح تدريجي وتخفيف المراكز';
    recommendedPositionPct = 0;
    rulingSummaryAr = `يحذر الحَكَم من مناطق التشبع الشرائي العالية. يوصى بجني أرباح جزئي وتأمين المكاسب برفع الوقف فوراً.`;
  } else {
    verdictCode = 'WAIT_BREAKOUT';
    verdictTitleAr = 'حياد ومراقبة حتى اكتمال شروط الاختراق';
    recommendedPositionPct = 5;
    rulingSummaryAr = `الموقف متقارب بين المؤيد والمعارض (${bullScore}% مقابل ${bearScore}%). يفضل الانتظار خارج السهم حتى يكسر المقاومة بحجم تداول واضح.`;
  }

  // Exact Prices
  const entryMin = Number((p * 0.985).toFixed(2));
  const entryMax = Number((p * 1.015).toFixed(2));
  const t1 = Number((p * (1 + tfMeta.target1Multiplier)).toFixed(2));
  const t2 = Number((p * (1 + tfMeta.target2Multiplier)).toFixed(2));
  const t3 = Number((p * (1 + tfMeta.target2Multiplier * 1.55)).toFixed(2));
  const sl = Number((p * (1 - tfMeta.stopLossMultiplier)).toFixed(2));

  const rrRatio = Number((((t1 - p) * 0.5 + (t2 - p) * 0.3 + (t3 - p) * 0.2) / Math.max(0.05, p - sl)).toFixed(2));

  const executionStepsAr = [
    `1. نطاق الدخول: بين ${entryMin} ج.م و ${entryMax} ج.م على فريم ${tfMeta.labelAr}.`,
    `2. حجم المركز: لا تتجاوز ${recommendedPositionPct}% من إجمالي رأس مال محفظتك.`,
    `3. الهدف الأول: ${t1} ج.م (+${(tfMeta.target1Multiplier * 100).toFixed(1)}%) - جني 50% من الكمية ونقل الوقف لنقطة الدخول فوراً.`,
    `4. الهدف الثاني: ${t2} ج.م (+${(tfMeta.target2Multiplier * 100).toFixed(1)}%) - جني 30% إضافية.`,
    `5. وقف الخسارة الصارم: ${sl} ج.م (-${(tfMeta.stopLossMultiplier * 100).toFixed(1)}%) - خروج بدون تردد في حال الإغلاق دونه.`,
  ];

  // Try optional Gemini enhancement with explicit prompt to look at the chart structure
  const apiKey =
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    '';

  let geminiSummary = '';
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `أنت ترأس مجلس المستشارين الفنيين في البورصة المصرية EGX المكون من 3 نماذج ذكاء اصطناعي.
السهم: ${stock.nameAr} (${stock.symbol}) | السعر: ${p.toFixed(2)} ج.م | فريم: ${tfMeta.labelAr}
المؤشرات: Consensus: ${indicators.consensusRatingAr} (${bullScore}%), SuperTrend: ${indicators.superTrend.trendAr}, RSI: ${indicators.rsi.value}, Stoch: ${indicators.stochastic.k}, MACD: ${indicators.macd.statusAr}, Net Liquidity Inflow: ${volLiq.liquidityStudy.netInflowRatio}%

قراءة شارت السهم المباشرة:
- الشموع اليابانية: ${chartVerdict.candlestickPatternAr}
- السلوك السعري: ${chartVerdict.priceActionVerdictAr}
- الدعم المرئي على الشارت: ${chartVerdict.chartSupportLevel} ج.م | المقاومة: ${chartVerdict.chartResistanceLevel} ج.م
- المتوسطات المتحركة: ${chartVerdict.movingAveragesVerdictAr}

المطلوب:
1. انظر مباشرة إلى الشارت الفني وأعطِ رأيك الصريح والدقيق في حركة الشارت والشموع وفرص الاختراق أو التصحيح.
2. مرافعة النموذج المؤيد (أسباب الشراء القوية).
3. طعن النموذج المعارض (المخاطر والعوائق).
4. حكم القاضي الفاصل والتوصية الرقمية، مع التنويه بتوقيت الشارت وإخلاء المسؤولية.`;

      const res = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      geminiSummary = res.text || '';
    } catch (e) {
      console.warn('Gemini council enrichment error, using mathematical verdict:', e);
    }
  }

  const fullReportText = `⚖️ *تقرير مجلس المستشارين الفنيين بالذكاء الاصطناعي (EGX AI Council)*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 السهم: ${stock.nameAr} (${stock.symbol}) | القطاع: ${stock.sectorAr}
⏱️ الفريم الزمني: ${tfMeta.labelAr} (${tfMeta.badgeAr})
💵 السعر اللحظي: ${p.toFixed(2)} ج.م (${stock.changePct >= 0 ? '+' : ''}${stock.changePct}%)
🕋 الموقف الشرعي: ${stock.isShariahCompliant ? 'متوافق مع الشريعة الإسلامية ✅' : 'تقليدي ⚠️'}
⏱️ تاريخ ووقت بيانات الشارت اللحظية: ${cairoTimeStr}
${CHART_15_MIN_DELAY_NOTICE_AR}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔬 *مقياس التجميع والتصريف الدقيق (Wyckoff & VSA):*
• حالة السهم الدقيقة: [${adVerdict.phaseAr}]
• ميزان القوى: تجميع مؤسسي ${adVerdict.accumulationScore}% مقابل تصريف ${adVerdict.distributionScore}%
• معامل موضع الإغلاق الشمعي (CLV): ${adVerdict.clv > 0 ? '+' : ''}${adVerdict.clv} (${adVerdict.clvStatusAr})
• مرحلة دورة وايكوف: ${adVerdict.wyckoffStageAr}
• تحليل الحجم والمدى (VSA): ${adVerdict.vsaInsightAr}
• تشخيص المقياس الحاسم: ${adVerdict.detailedVerdictAr}

🎯 *رأي وقراءة شارت TradingView اللحظي المعتمد:*
• التقييم الفني الموحد لـ TradingView: [${tvVerdict.overallRatingAr}] بنسبة قوة ${tvVerdict.overallScorePct}%
• المتوسطات المتحركة (15 MAs): ${tvVerdict.movingAverages.ratingAr} (${tvVerdict.movingAverages.buyCount} شراء / ${tvVerdict.movingAverages.sellCount} بيع)
• مؤشرات التذبذب (11 Oscillators): ${tvVerdict.oscillators.ratingAr} (${tvVerdict.oscillators.buyCount} شراء / ${tvVerdict.oscillators.neutralCount} محايد / ${tvVerdict.oscillators.sellCount} بيع)
• نموذج الشمعة على الشارت: ${tvVerdict.candlestick.patternNameAr}
• مستويات الشارت المحورية: Pivot ${tvVerdict.levels.pivot} ج.م | دعم S1: ${tvVerdict.levels.support1} ج.م | مقاومة R1: ${tvVerdict.levels.resistance1} ج.م
• خلاصة رأي الشارت: ${tvVerdict.explicitChartOpinionAr}

📊 *قراءة الشارت الفني والشموع اليابانية المباشرة (Chart Technical Breakdown):*
• حركة الشموع والبرايس أكشن: ${chartVerdict.candlestickPatternAr}
• هيكل السعر على الشارت: ${chartVerdict.priceActionVerdictAr}
• مستويات الدعم والمقاومة للشارت: دعم محوري عند ${chartVerdict.chartSupportLevel} ج.م | مقاومة هامة عند ${chartVerdict.chartResistanceLevel} ج.م
• موقف المتوسطات المتحركة: ${chartVerdict.movingAveragesVerdictAr}
• الرأي الفني المباشر في الشارت: ${chartVerdict.chartTechnicalOpinionAr}

🟢 *1. النموذج المؤيد (Bullish Advocate) - نسبة القوة: ${bullScore}%*
• الحجج والأدلة:
${bullArgs.map((a) => `  - ${a}`).join('\n')}
• خلاصة المؤيد: السهم يتمتع بزخم صاعد وفرصة حقيقية لتحقيق الأهداف على فريم ${tfMeta.labelAr}.

🔴 *2. النموذج المعارض (Bearish Skeptic) - نسبة المخاطرة: ${bearScore}%*
• المخاطر والتحذيرات:
${bearArgs.map((a) => `  - ${a}`).join('\n')}
• خلاصة المعارض: يجب توخي الحذر وعدم الاندفاع في الشراء قبل تأكيد السيولة والدعوم.

👑 *3. حُكم القاضي الفاصل (Supreme Arbiter):*
• القرار النهائي: [${verdictTitleAr}]
• نسبة ترجيح الصعود: ${bullScore}% مقابل ترجيح الهبوط: ${bearScore}%
• نطاق الشراء الموصى به: ${entryMin} ج.م - ${entryMax} ج.م
• الهدف الأول: ${t1} ج.م (+${(tfMeta.target1Multiplier * 100).toFixed(1)}%)
• الهدف الثاني: ${t2} ج.م (+${(tfMeta.target2Multiplier * 100).toFixed(1)}%)
• الهدف الثالث: ${t3} ج.م (+${(tfMeta.target2Multiplier * 1.55).toFixed(1)}%)
• وقف الخسارة الصارم: ${sl} ج.م (-${(tfMeta.stopLossMultiplier * 100).toFixed(1)}%)
• نسبة المخاطرة للعائد (R:R): 1 إلى ${rrRatio}
• الحجم الأقصى من المحفظة: ${recommendedPositionPct}%

${geminiSummary ? `\n🤖 *تحليل الذكاء الاصطناعي المعمق للمجلس:*\n${geminiSummary}\n` : ''}

${LEGAL_DISCLAIMER_AR}
المصدر: رادار البورصة المصرية ومؤشر الشريعة - مجلس المستشارين الذكي`;

  return {
    symbol: stock.symbol,
    stockNameAr: stock.nameAr,
    sectorAr: stock.sectorAr || 'عام',
    timeframe,
    timeframeLabelAr: tfMeta.labelAr,
    currentPrice: p,
    changePct: stock.changePct,
    isShariah: stock.isShariahCompliant,
    generatedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    liveChartTimestamp: cairoTimeStr,
    delayNoticeAr: CHART_15_MIN_DELAY_NOTICE_AR,
    disclaimerAr: LEGAL_DISCLAIMER_AR,
    chartVerdict,
    tradingViewRating: tvVerdict,
    bullishAdvocate: {
      modelNameAr: 'النموذج المؤيّد (Bullish Advocate)',
      roleAr: 'صقر التداول ومحامي الصعود واقتناص الفرص',
      iconType: 'BULL',
      scorePct: bullScore,
      badgeAr: bullScore >= 60 ? 'زخم شرائي قوي' : 'فرصة ارتداد شرائي',
      thesisAr: `السهم يمتلك مقومات فنية داعمة لتحقيق موجة صاعدة على فريم ${tfMeta.labelAr}، مدعوماً بحماية المؤشرات المحورية.`,
      arguments: bullArgs,
      verdictAr: `يوصي بالشراء والتمركز مستهدفاً مستويات ${t1} ج.م و ${t2} ج.م.`,
    },
    bearishSkeptic: {
      modelNameAr: 'النموذج المعارض (Bearish Skeptic)',
      roleAr: 'المحلل المتشكك ومحامي الشيطان لكشف المخاطر',
      iconType: 'BEAR',
      scorePct: bearScore,
      badgeAr: bearScore >= 60 ? 'مخاطرة عالية وحذر' : 'تصحيح مؤقت تحت السيطرة',
      thesisAr: `حركة السهم محفوفة بعوامل ضغط بيعي وعوائق فنية تستوجب الحيطة وعدم الاندفاع في الشراء قبل تأكيد الاختراق.`,
      arguments: bearArgs,
      verdictAr: `يوصي بالتريث والانتظار خارج السهم حتى تتأكد السيولة الداعمة، مع تفعيل وقف الخسارة عند ${sl} ج.م.`,
    },
    supremeArbiter: {
      modelNameAr: 'الحَكَم الفاصل (Supreme Arbiter)',
      roleAr: 'قاضي المجلس الأعلى لحسم الموقف والتوصية الرقمية',
      verdictCode,
      verdictTitleAr,
      bullishWeightPct: bullScore,
      bearishWeightPct: bearScore,
      entryZoneMin: entryMin,
      entryZoneMax: entryMax,
      target1Price: t1,
      target2Price: t2,
      target3Price: t3,
      stopLossPrice: sl,
      riskRewardRatio: rrRatio,
      recommendedPositionPct,
      rulingSummaryAr,
      executionStepsAr,
    },
    fullReportText,
  };
}
