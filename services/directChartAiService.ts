import { EGXStock } from '../types/stock';
import { calculateStockTechnicalIndicators } from './technicalAnalysisService';
import { analyzeAnnualVolumeAndLiquidity } from './radarAdvancedEngine';
import { getTradingViewChartVerdict } from '../utils/tradingViewChartVerdict';
import { evaluateSmcAnalysis } from '../utils/smcAnalysisEngine';
import { calculateBollingerBands } from '../utils/bollingerBandsEngine';
import { calculateAccumulationDistribution } from '../utils/accumulationDistributionEngine';
import { getEstimated20DayAvgVolume } from './institutionalLiquidityAlertService';
import { getCairoCurrentTimeFormatted } from '../utils/reportDisclaimer';
import { callApmixChatCompletion } from './apmixAiService';

export interface DirectChartAiAnalysis {
  stockSymbol: string;
  stockNameAr: string;
  timeframe: string;
  price: number;
  changePct: number;
  verdictRating: string;
  consensusScore: number;
  analysisText: string;
  entryZone: string;
  target1: string;
  target2: string;
  target3: string;
  stopLoss: string;
  keyLevels: {
    pivot: number;
    support1: number;
    support2: number;
    resistance1: number;
    resistance2: number;
  };
  smcSummary: {
    marketStructure: string;
    orderBlockZone: string;
    liquiditySweep: string;
    fairValueGap: string;
  };
  wyckoffSummary: {
    phase: string;
    clvStatus: string;
    accumulationScore: number;
  };
  volumeStatus: string;
  timestamp: string;
}

export interface ChartChatMessage {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  timestamp: string;
}

/**
 * Analyzes the TradingView chart directly using all calculated technical telemetry
 * without requiring any uploaded images or screenshots.
 */
export async function analyzeTradingViewChartDirectly(
  stock: EGXStock,
  timeframe: string = 'يومي (1D)'
): Promise<DirectChartAiAnalysis> {
  const p = stock.price;
  const nowStr = getCairoCurrentTimeFormatted();

  // 1. Technical Indicators & Oscillators
  const tfCode = timeframe.includes('15')
    ? '15m'
    : timeframe.includes('30')
    ? '30m'
    : timeframe.includes('1h')
    ? '1h'
    : timeframe.includes('4h')
    ? '4h'
    : timeframe.includes('أسبوعي')
    ? '1W'
    : timeframe.includes('شهري')
    ? '1M'
    : '1D';

  const techInd = calculateStockTechnicalIndicators(stock, tfCode as any);
  const tv = getTradingViewChartVerdict(stock, timeframe);
  const smc = evaluateSmcAnalysis(stock, timeframe);
  const bollinger = calculateBollingerBands(stock, timeframe);
  const adMetric = calculateAccumulationDistribution(stock, timeframe);
  const volLiq = analyzeAnnualVolumeAndLiquidity(stock);
  const adv20 = getEstimated20DayAvgVolume(stock);
  const vol = stock.volume || 0;
  const rvol20 = adv20 > 0 ? (vol / adv20).toFixed(2) : '1.0';

  // Key Entry and Target Calculations
  const entryLow = Number((p * 0.985).toFixed(2));
  const entryHigh = Number((p * 1.012).toFixed(2));
  const t1 = Number((p * 1.045).toFixed(2));
  const t2 = Number((p * 1.085).toFixed(2));
  const t3 = Number((p * 1.14).toFixed(2));
  const sl = Number((Math.min(stock.low || p * 0.96, p * 0.965)).toFixed(2));

  let volumeStatusText = `حجم التداول اليوم ${vol.toLocaleString('en-US')} سهم`;
  if (vol >= adv20 * 1.5) {
    volumeStatusText += ` (⚡ انفجار حجم تداول ${rvol20}x ضعف متوسط 20 يوم)`;
  } else if (vol >= adv20) {
    volumeStatusText += ` (⚡ تجاوز متوسط 20 يوم بمعدل ${rvol20}x)`;
  } else {
    volumeStatusText += ` (ضمن المعدلات الطبيعية)`;
  }

  let aiText = '';

  const prompt = `أنت كبير المحللين الفنيين المعتمدين في البورصة المصرية EGX ومستشار التداول الذكي.
مهمتك: تقديم تحليل فني دقيق ومباشر لشارت سهم "${stock.nameAr}" (${stock.symbol}) المعروض حالياً على منصة TradingView على فريم [${timeframe}].

بيانات الشارت اللحظية الدقيقة:
- السعر الحالي: ${p.toFixed(2)} ج.م (التغير: ${stock.changePct >= 0 ? '+' : ''}${stock.changePct}%)
- أعلى سعر اليوم: ${stock.high || p * 1.02} ج.م | أدنى سعر: ${stock.low || p * 0.98} ج.م
- حجم التداول: ${vol.toLocaleString('en-US')} سهم | متوسط 20 يوم (ADV20): ${adv20.toLocaleString('en-US')} سهم | RVOL: ${rvol20}x
- التقييم الفني الموحد لـ TradingView: ${tv.overallRatingAr} (${tv.overallScorePct}%)
- المتوسطات المتحركة: ${tv.movingAverages.ratingAr} (SMA20: ${stock.sma20 || '-'}, SMA50: ${stock.sma50 || '-'}, EMA20: ${stock.ema20 || '-'})
- مؤشر SuperTrend: ${techInd.superTrend.trendAr} (دعم: ${techInd.superTrend.superTrendValue.toFixed(2)} ج.م)
- مذبذبات العزم: RSI(14) عند ${stock.rsi14 || techInd.rsi.value.toFixed(1)} (${techInd.rsi.statusAr})
- مستويات Pivot: الارتكاز ${tv.levels.pivot} ج.م | الدعم S1: ${tv.levels.support1} ج.م | المقاومة R1: ${tv.levels.resistance1} ج.م
- مدرسة السيولة الذكية (SMC):
  * هيكل السوق: ${smc.marketStructure.type} (${smc.marketStructure.badgeAr})
  * منطقة كتل أوامر صانع السوق (Order Block): ${smc.orderBlock.badgeAr} ما بين ${smc.orderBlock.zoneMin} و ${smc.orderBlock.zoneMax} ج.م
  * صيد السيولة (Liquidity Sweeps): ${smc.liquidity.sweepType} (${smc.liquidity.sweepStatusAr})
  * الفجوة السعرية (Fair Value Gap): ${smc.fairValueGap.imbalanceStatusAr}
- مقياس وايكوف وحجم الإغلاق (CLV): مرحلة [${adMetric.wyckoffStageAr}] - تجميع مؤسسي ${adMetric.accumulationScore}% مقابل تصريف ${adMetric.distributionScore}%

المطلوب:
صياغة تقرير فني مباشر، تطبيقي وواضح في نقاط احترافية باللغة العربية تشمل:
1. قراءة سلوك السعر والشمعة الحالية على شارت TradingView.
2. تقييم الاتجاه وقوة الزخم الفني.
3. خطة التداول التنفيذية (منطقة الشراء والتجميع المثالية، مستويات جني الأرباح TP1 و TP2، ومستوى وقف الخسارة الصارم).
4. سلوك صانع السوق والسيولة المؤسسية (Order Blocks & Volume).
5. نصيحة الحسم للمتداول اليوم.`;

  // 1. Try ApMix Multi-Key Network
  try {
    const apmixResult = await callApmixChatCompletion({
      category: 'CHART',
      messages: [
        {
          role: 'system',
          content: 'أنت كبير المحللين الفنيين المعتمدين في البورصة المصرية EGX ومستشار التداول الذكي.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.25,
      maxTokens: 1200,
    });
    if (apmixResult && apmixResult.text && apmixResult.text.trim().length > 50) {
      aiText = apmixResult.text;
    }
  } catch (_apmixErr) {
    // Continue to server endpoint fallback
  }

  if (!aiText) {
    try {
      const response = await fetch('/api/gemini/analyze-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock,
          timeframe,
          prompt,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.text) {
          aiText = data.text;
        }
      }
    } catch (e) {
      console.warn('Server-side AI Chart Analysis API call failed, using deterministic engine:', e);
    }
  }

  // Fallback to high-precision deterministic financial analysis if API is offline
  if (!aiText) {
    aiText = `📊 **قراءة شارت TradingView الفنية اللحظية لسهم ${stock.nameAr} (${stock.symbol}):**

1️⃣ **الاتجاه الفني العام وسلوك السعر:**
السهم يتداول حالياً عند **${p.toFixed(2)} ج.م** بـ ${tv.overallRatingAr} وإجماع بنسبة **${tv.overallScorePct}%** من مؤشرات منصة TradingView. السعر يتحرك في اتجاه ${stock.changePct >= 0 ? 'صاعد إيجابي' : 'عرضي تصحيحي'} ومؤشر SuperTrend يعطي إشارة **${techInd.superTrend.trendAr}** مع مستوى حماية رئيسي عند **${techInd.superTrend.superTrendValue.toFixed(2)} ج.م**.

2️⃣ **مستويات ومحاور الشارت (Pivot & Levels):**
• نقطة الارتكاز المحورية (Pivot): **${tv.levels.pivot} ج.م** (التداول أعلاها يعزز الاستمرار الإيجابي).
• مستوى المقاومة الأول (R1): **${tv.levels.resistance1} ج.م** | المقاومة الثانية (R2): **${tv.levels.resistance2} ج.م**.
• مستوى الدعم الأول (S1): **${tv.levels.support1} ج.م** | الدعم الثاني (S2): **${tv.levels.support2} ج.م**.

3️⃣ **قراءة مدرسة السيولة الذكية (SMC) وسلوك صانع السوق:**
• هيكل السوق (Market Structure): **${smc.marketStructure.type}** (${smc.marketStructure.explanationAr}).
• منطقة أوامر صانع السوق (Order Block): تتمركز في النطاق السعري **${smc.orderBlock.zoneMin} - ${smc.orderBlock.zoneMax} ج.م** (${smc.orderBlock.statusAr}).
• صيد السيولة: ${smc.liquidity.sweepStatusAr}.
• التسعير العادل: السهم في نطاق **${smc.pricing.zoneBadgeAr}** مقارنة بالسعر التوازني (${smc.pricing.equilibriumPrice} ج.م).

4️⃣ **حجم التداول والسيولة المؤسسية (VSA & Wyckoff):**
حجم التداول يسجل **${vol.toLocaleString('en-US')} سهم** مع معامل نشاط نسبي **${rvol20}x** مقارنة بمتوسط الـ 20 يوماً. مرحلة وايكوف تشير إلى **[${adMetric.wyckoffStageAr}]** مع غلبة تجميع مؤسسي بنسبة **${adMetric.accumulationScore}%** وموضع إغلاق شمعي إيجابي (CLV: ${adMetric.clvStatusAr}).

5️⃣ **الخلاصة والتوصية التنفيذية:**
${tv.explicitChartOpinionAr}. يوصى بالشراء المتدرج داخل نطاق **${entryLow} - ${entryHigh} ج.م** مع تفعيل وقف الخسارة بكسر **${sl} ج.م**.`;
  }

  return {
    stockSymbol: stock.symbol,
    stockNameAr: stock.nameAr,
    timeframe,
    price: p,
    changePct: stock.changePct,
    verdictRating: tv.overallRatingAr,
    consensusScore: tv.overallScorePct,
    analysisText: aiText,
    entryZone: `${entryLow} - ${entryHigh} ج.م`,
    target1: `${t1} ج.م (+${Math.round((t1 / p - 1) * 100)}%)`,
    target2: `${t2} ج.م (+${Math.round((t2 / p - 1) * 100)}%)`,
    target3: `${t3} ج.م (+${Math.round((t3 / p - 1) * 100)}%)`,
    stopLoss: `${sl} ج.م (-${Math.round((1 - sl / p) * 100)}%)`,
    keyLevels: {
      pivot: tv.levels.pivot,
      support1: tv.levels.support1,
      support2: tv.levels.support2,
      resistance1: tv.levels.resistance1,
      resistance2: tv.levels.resistance2,
    },
    smcSummary: {
      marketStructure: `${smc.marketStructure.type} (${smc.marketStructure.badgeAr})`,
      orderBlockZone: `${smc.orderBlock.zoneMin} - ${smc.orderBlock.zoneMax} ج.م`,
      liquiditySweep: smc.liquidity.sweepStatusAr,
      fairValueGap: smc.fairValueGap.imbalanceStatusAr,
    },
    wyckoffSummary: {
      phase: adMetric.phaseAr,
      clvStatus: adMetric.clvStatusAr,
      accumulationScore: adMetric.accumulationScore,
    },
    volumeStatus: volumeStatusText,
    timestamp: nowStr,
  };
}

/**
 * Free-Form Q&A engine for any user question regarding this stock's chart
 */
export async function askChartFreeFormQuestion(
  stock: EGXStock,
  chartAnalysis: DirectChartAiAnalysis,
  userQuestion: string,
  chatHistory: ChartChatMessage[] = []
): Promise<string> {
  const q = userQuestion.trim();

  const prompt = `أنت المستشار الفني والمحلل المالي المباشر لسوق الأسهم المصري EGX.
السهم قيد المناقشة: ${stock.nameAr} (${stock.symbol})
السعر اللحظي: ${stock.price.toFixed(2)} ج.م (${stock.changePct >= 0 ? '+' : ''}${stock.changePct}%)
الفريم الزمني: ${chartAnalysis.timeframe}
تقييم TradingView الحالي: ${chartAnalysis.verdictRating} (${chartAnalysis.consensusScore}%)
نطاق الدخول المقترح: ${chartAnalysis.entryZone}
المستهدفات: 1: ${chartAnalysis.target1} | 2: ${chartAnalysis.target2} | 3: ${chartAnalysis.target3}
وقف الخسارة الصارم: ${chartAnalysis.stopLoss}
مناطق كتل الأوامر SMC: ${chartAnalysis.smcSummary.orderBlockZone}
مرحلة وايكوف: ${chartAnalysis.wyckoffSummary.phase} (تجميع ${chartAnalysis.wyckoffSummary.accumulationScore}%)

سؤال المتداول: "${q}"

أجب باللغة العربية باحترافية، وضوح، وأمانة مالية. اذكر الأرقام والمستويات الداعمة لسؤال المتداول مباشرة مع نصيحة إدارة المخاطر.`;

  // 1. Try ApMix Multi-Key Network
  try {
    const apmixChat = await callApmixChatCompletion({
      category: 'CHART',
      messages: [
        {
          role: 'system',
          content: 'أنت المستشار الفني والمحلل المالي المباشر لسوق الأسهم المصري EGX. تجيب بإخلاص ودقة بالأرقام والمستويات الفنية.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.25,
      maxTokens: 850,
    });
    if (apmixChat && apmixChat.text && apmixChat.text.trim().length > 10) {
      return apmixChat.text;
    }
  } catch (_apmixErr) {
    // Continue to server endpoint fallback
  }

  try {
    const response = await fetch('/api/gemini/chart-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.text) {
        return data.text;
      }
    }
  } catch (e) {
    console.warn('Server-side chart chat call failed, using heuristic answers:', e);
  }

  // Fallback intelligent response based on keywords
  const normQ = q.toLowerCase();
  const p = stock.price;

  if (normQ.includes('دخول') || normQ.includes('شراء') || normQ.includes('اشتري')) {
    return `بناءً على الشارت اللحظي لسهم ${stock.nameAr} (${stock.symbol}) على فريم ${chartAnalysis.timeframe}:
• نطاق الشراء المثالي هو: [${chartAnalysis.entryZone}].
• تقييم الشارت حالياً: ${chartAnalysis.verdictRating} بقوة ${chartAnalysis.consensusScore}%.
• نصيحة التنفيذ: يفضل تقسيم السيولة إلى دفعتين وعدم الدخول بكامل المحفظة في نقطة واحدة مع الالتزام التام بوقف الخسارة عند ${chartAnalysis.stopLoss}.`;
  }

  if (normQ.includes('هدف') || normQ.includes('مستهدف') || normQ.includes('ارباح') || normQ.includes('ابيع')) {
    return `مستويات جني الأرباح المحددة فنياً لسهم ${stock.symbol}:
• الهدف الأول: ${chartAnalysis.target1}
• الهدف الثاني: ${chartAnalysis.target2}
• الهدف الثالث: ${chartAnalysis.target3}
• المقاومات الفنية الحاسمة: R1 عند ${chartAnalysis.keyLevels.resistance1} ج.م و R2 عند ${chartAnalysis.keyLevels.resistance2} ج.م.`;
  }

  if (normQ.includes('وقف') || normQ.includes('خسار') || normQ.includes('دعم')) {
    return `مستويات الحماية والدعوم لسهم ${stock.symbol}:
• وقف الخسارة الصارم: [${chartAnalysis.stopLoss}] بإغلاق شمعة فريم ${chartAnalysis.timeframe}.
• أقرب دعم فني لحظي: S1 عند ${chartAnalysis.keyLevels.support1} ج.م ويليه S2 عند ${chartAnalysis.keyLevels.support2} ج.م.
• كسر مستوى الدعم يلغي السيناريو الصاعد فوراً.`;
  }

  if (normQ.includes('صانع') || normQ.includes('سيول') || normQ.includes('مؤسس') || normQ.includes('smc')) {
    return `تشخيص سيولة صانع السوق لسهم ${stock.symbol}:
• كتلة أوامر صانع السوق (Order Block): تتمركز بين [${chartAnalysis.smcSummary.orderBlockZone}].
• سلوك السيولة: ${chartAnalysis.smcSummary.liquiditySweep}.
• وضع وايكوف: مرحلة [${chartAnalysis.wyckoffSummary.phase}] مع نسبة تجميع مؤسسي ${chartAnalysis.wyckoffSummary.accumulationScore}%.
• نشاط الفوليم: ${chartAnalysis.volumeStatus}.`;
  }

  return `بشأن استفسارك عن سهم ${stock.nameAr} (${stock.symbol}) عند سعر ${p.toFixed(2)} ج.م:
الشارت يعطي تقييماً عاماً بـ [${chartAnalysis.verdictRating}] (قوة الإشارة: ${chartAnalysis.consensusScore}%). الاتجاه العام مدعوم بنقطة الارتكاز ${chartAnalysis.keyLevels.pivot} ج.م ومستوى وقف الخسارة عند ${chartAnalysis.stopLoss}. يمكنك متابعة الحركة باحترافية عبر تقسيم مراكزك وفق سلم الأهداف.`;
}
