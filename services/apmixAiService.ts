/**
 * محرك الذكاء الاصطناعي الموحد (Apinex ← Larprouter)
 * كل الطلبات تمر عبر السيرفر (/api/ai/chat) الذي يطبّق الـ Failover التلقائي.
 * لا توجد أي مفاتيح داخل كود الواجهة.
 * (أُبقي اسم الملف والدوال كما هي لتفادي كسر الاستيرادات الحالية)
 */

import { EGXStock } from '../types/stock';
import { calculateStockTechnicalIndicators } from './technicalAnalysisService';
import { getTradingViewChartVerdict } from '../utils/tradingViewChartVerdict';
import { evaluateSmcAnalysis } from '../utils/smcAnalysisEngine';
import { calculateBollingerBands } from '../utils/bollingerBandsEngine';
import { calculateAccumulationDistribution } from '../utils/accumulationDistributionEngine';
import { getEstimated20DayAvgVolume } from './institutionalLiquidityAlertService';
import { ComprehensiveStockAnalysisReport } from './radarAdvancedEngine';

export interface ApmixChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ApmixRequestOptions {
  messages: ApmixChatMessage[];
  category?: 'NEWS' | 'CHAT' | 'ANALYSIS' | 'CHART';
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ApmixResponseResult {
  text: string;
  providerUsed: string;
  keyLabel: string;
}

/**
 * Executes a chat completion through the server (Apinex first, Larprouter as instant backup)
 */
export async function callApmixChatCompletion(
  options: ApmixRequestOptions
): Promise<ApmixResponseResult> {
  const temperature = options.temperature ?? 0.3;
  const maxTokens = options.maxTokens ?? 1000;

  const resp = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: options.messages, temperature, maxTokens }),
  });

  if (resp.ok) {
    const data = await resp.json();
    if (data.text) {
      return {
        text: data.text,
        providerUsed: data.provider || 'AI Network',
        keyLabel: data.keyLabel || data.provider || 'server',
      };
    }
  }

  throw new Error('AI providers are currently unavailable');
}

/**
 * Free-form Stock Chat via ApMix
 */
export async function askStockChatViaApmix(
  stock: EGXStock,
  question: string,
  history: { sender: 'USER' | 'AI'; text: string }[] = []
): Promise<string> {
  const p = stock.price;
  const techInd = calculateStockTechnicalIndicators(stock, '1D');
  const tv = getTradingViewChartVerdict(stock, 'يومي (1D)');
  const smc = evaluateSmcAnalysis(stock, 'يومي (1D)');
  const bollinger = calculateBollingerBands(stock, 'يومي (1D)');
  const adMetric = calculateAccumulationDistribution(stock, 'يومي (1D)');
  const adv20 = getEstimated20DayAvgVolume(stock);
  const vol = stock.volume || 0;
  const rvol20 = adv20 > 0 ? (vol / adv20).toFixed(2) : '1.0';

  const entryLow = (p * 0.985).toFixed(2);
  const entryHigh = (p * 1.012).toFixed(2);
  const target1 = (p * 1.045).toFixed(2);
  const target2 = (p * 1.085).toFixed(2);
  const stopLoss = Math.min(stock.low || p * 0.96, p * 0.965).toFixed(2);

  const historyContext = history
    .slice(-4)
    .map((m) => `${m.sender === 'USER' ? 'المتداول' : 'المستشار'}: ${m.text}`)
    .join('\n');

  const systemPrompt = `أنت كبير المستشارين الماليين وخبير التداول الذكي المعتمد لمنصة رادار البورصة المصرية EGX.
مهمتك: الإجابة على استفسارات المتداولين بدقة عالية وموضوعية استناداً إلى بيانات الشارت والسيولة اللحظية.
أسلوبك: مهني، مباشر، مدعوم بالأرقام والمستويات ونقاط الدعم والمقاومة، مع تقديم نصيحة إدارة المخاطر المناسبة باللغة العربية الفصحى الواضحة.`;

  const userPrompt = `سؤال المتداول: "${question}"

بيانات السهم اللحظية المعتمدة:
- السهم: ${stock.nameAr} (${stock.symbol}) - قطاع: ${stock.sectorAr || 'استثمار عام'}
- السعر الحالي: ${p.toFixed(2)} ج.م (التغير: ${stock.changePct >= 0 ? '+' : ''}${stock.changePct}%)
- أعلى سعر: ${stock.high || p * 1.02} ج.م | أدنى سعر: ${stock.low || p * 0.98} ج.م
- حجم التداول اليوم: ${vol.toLocaleString('en-US')} سهم | متوسط 20 يوم: ${adv20.toLocaleString('en-US')} سهم | RVOL: ${rvol20}x
- التقييم الفني لـ TradingView: [${tv.overallRatingAr}] بنسبة ثقة ${tv.overallScorePct}%
- مؤشر SuperTrend: ${techInd.superTrend.trendAr} (دعم وقائي: ${techInd.superTrend.superTrendValue.toFixed(2)} ج.م)
- مؤشر القوة النسبية RSI(14): ${stock.rsi14 || techInd.rsi.value.toFixed(1)} (${techInd.rsi.statusAr})
- مستويات الارتكاز Pivot: ${tv.levels.pivot} ج.م | S1: ${tv.levels.support1} ج.م | R1: ${tv.levels.resistance1} ج.م
- مدرسة السيولة الذكية (SMC): كتل أوامر صانع السوق عند ${smc.orderBlock.zoneMin} - ${smc.orderBlock.zoneMax} ج.م (${smc.orderBlock.badgeAr})
- مرحلة وايكوف: [${adMetric.wyckoffStageAr}] (تجميع ${adMetric.accumulationScore}% مقابل تصريف ${adMetric.distributionScore}%)
- الموقف الشرعي: ${stock.isShariahCompliant ? 'متوافق مع الشريعة الإسلامية ومدرج بمؤشر EGX30 Shariah ✅' : `غير مدرج بالشريعة ⚠️`}
- نطاق الشراء الاسترشادي: ${entryLow} - ${entryHigh} ج.م | الأهداف: ${target1} ج.م و ${target2} ج.م | وقف الخسارة: ${stopLoss} ج.م

${historyContext ? `السياق السابق:\n${historyContext}\n` : ''}

أجب باحترافية وتنسيق نقطي مريح، مع ذكر الأرقام الصريحة للمستويات الداعمة.`;

  const result = await callApmixChatCompletion({
    category: 'CHAT',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.25,
    maxTokens: 850,
  });

  return result.text;
}

/**
 * News Analysis via ApMix using Priority Key #7
 */
export async function analyzeStockNewsViaApmix(
  symbol: string,
  nameAr: string,
  stockPrice?: number,
  changePct?: number
): Promise<string> {
  const prompt = `أنت كبير محللي أخبار أسواق المال والمحلل الاقتصادي في البورصة المصرية EGX.
قم بتحليل أحدث الأخبار والإفصاحات وتوزيعات الأرباح والتوسعات لسهم:
- السهم: ${nameAr} (${symbol})
${stockPrice !== undefined ? `- السعر اللحظي: ${stockPrice.toFixed(2)} ج.م (${changePct ?? 0 >= 0 ? '+' : ''}${changePct ?? 0}%)` : ''}

المطلوب:
1. تقرير إخباري موجز واحترافي يغطي الإفصاحات الرسمية، تطورات الأرباح والمشروعات.
2. تقييم معنويات الأخبار (إيجابي / محايد / سلبي) وأثرها على مسار السهم.
3. أهم المحفزات الصاعدة وأبرز المخاطر المحتملة.
4. توصية تنفيذية للمتداولين بناءً على الزخم الإخباري.`;

  const result = await callApmixChatCompletion({
    category: 'NEWS',
    messages: [
      {
        role: 'system',
        content: 'أنت خبير تحليل الأخبار والإفصاحات الرسمية للبورصة المصرية. تقدم تقارير احترافية وموثقة تدعم قرارات الاستثمار والتداول.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.25,
    maxTokens: 800,
  });

  return result.text;
}

/**
 * 360 Stock Comprehensive Insight via ApMix
 */
export async function generateStock360ViaApmix(
  stock: EGXStock,
  report: ComprehensiveStockAnalysisReport
): Promise<{
  headlineAr: string;
  institutionalAnalysisAr: string;
  keyLevelsSummaryAr: string;
  smartAdviceAr: string;
  volumeAndLiquidityVerdictAr: string;
}> {
  const vol = report.annualVolumeStudy;
  const liq = report.liquidityLineStudy;

  const prompt = `قم بإعداد تحليل 360 درجة موجز واحترافي باللغة العربية الفصحى لسهم شركة بالبورصة المصرية:
- السهم: ${stock.nameAr} (${stock.symbol})
- القطاع: ${stock.sectorAr}
- السعر الحالي: ${stock.price.toFixed(2)} ج.م (التغير: ${stock.changePct}%)
- حجم التداول اليوم: ${vol.currentVolume.toLocaleString()} سهم (RVOL السنوي: ${vol.relativeVolume1Year}x)
- شرط الحجم الإيجابي: تخطي ${vol.volumePositiveThreshold.toLocaleString()} سهم
- خط السيولة ونسبة التدفق: ${liq.liquidityLineTrendAr} (${liq.netInflowRatio}% سيولة داخلة)
- صافي السيولة التراكمية: ${(liq.estimatedNetInflowEgp / 1_000_000).toFixed(1)} مليون ج.م
- متوسط السعر المرجح VWAP: ${liq.vwapPrice} ج.م

أجب بصيغة JSON فقط تحتوي على:
{
  "headlineAr": "عنوان تشخيصي جذاب للسهم",
  "institutionalAnalysisAr": "فقرة من 3 أسطر عن سلوك السيولة الذكية والفوليم وخط السيولة",
  "keyLevelsSummaryAr": "ملخص للمستهدفات والدعوم الهامة",
  "smartAdviceAr": "الرأي الفني والتوصية الدقيقة للدخول",
  "volumeAndLiquidityVerdictAr": "جملة واحدة حاسمة عن وضع الفوليم"
}`;

  const result = await callApmixChatCompletion({
    category: 'ANALYSIS',
    messages: [
      {
        role: 'system',
        content: 'أنت كبير محللي البورصة المصرية المتخصص في تحليل السيولة المؤسساتية. أجب بصيغة JSON فقط.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    maxTokens: 600,
  });

  try {
    const jsonStr = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (_e) {
    return {
      headlineAr: `تشخيص فني ودراسة حجم وسيولة سنوية لسهم ${stock.nameAr} (${stock.symbol})`,
      institutionalAnalysisAr: `يظهر سهم ${stock.nameAr} نشاطاً تداولياً بسعر ${stock.price.toFixed(2)} ج.م مع خط سيولة (${liq.liquidityLineTrendAr}) وتدفق شرائي ${liq.netInflowRatio}%.`,
      keyLevelsSummaryAr: `مستوى الدعم: ${report.execution.stopLoss} ج.م والمستهدف: ${report.execution.target1} ج.م.`,
      smartAdviceAr: liq.bullishTurnConditions.recommendationSummaryAr,
      volumeAndLiquidityVerdictAr: `السهم في مسار واعد يتطلب استمرار تدفق السيولة لاختراق المقاومة.`,
    };
  }
}
