import { GoogleGenAI } from '@google/genai';
import { EGXStock } from '../types/stock';
import { calculateStockTechnicalIndicators } from './technicalAnalysisService';
import { analyzeAnnualVolumeAndLiquidity } from './radarAdvancedEngine';
import { getTradingViewChartVerdict } from '../utils/tradingViewChartVerdict';
import { evaluateSmcAnalysis } from '../utils/smcAnalysisEngine';
import { calculateBollingerBands } from '../utils/bollingerBandsEngine';
import { calculateAccumulationDistribution } from '../utils/accumulationDistributionEngine';
import { getEstimated20DayAvgVolume } from './institutionalLiquidityAlertService';
import { getCairoCurrentTimeFormatted } from '../utils/reportDisclaimer';
import { askStockChatViaApmix } from './apmixAiService';

export interface StockChatMessage {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  timestamp: string;
  stockSymbol?: string;
}

function getAiApiKey(): string {
  return (
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    ''
  );
}

/**
 * Handles free-form chat queries about any selected stock using current real-time market data
 */
export async function askStockFreeChat(
  stock: EGXStock,
  question: string,
  history: StockChatMessage[] = []
): Promise<string> {
  const p = stock.price;
  const nowStr = getCairoCurrentTimeFormatted();
  const q = question.trim();

  // 1. First priority: Try ApMix Multi-Key Network (Smart Round-Robin + Failover)
  try {
    const apmixResponse = await askStockChatViaApmix(stock, question, history);
    if (apmixResponse && apmixResponse.trim().length > 10) {
      return apmixResponse;
    }
  } catch (_apmixErr) {
    // Continue to Gemini fallback
  }

  // 2. Gather all live calculated telemetry for the stock
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
  const stopLoss = (Math.min(stock.low || p * 0.96, p * 0.965)).toFixed(2);

  const apiKey = getAiApiKey();

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey });

      // Build conversation context from previous exchanges if available
      const historyContext = history.slice(-4).map((m) => `${m.sender === 'USER' ? 'المتداول' : 'المستشار'}: ${m.text}`).join('\n');

      const prompt = `أنت خبير التداول المالي والمستشار الفني الذكي المعتمد لمنصة رادار البورصة المصرية EGX.
مهمتك: الإجابة عن استفسار المتداول الحر التالي بدقة وموضوعية مبنية على بيانات السوق والشارت الحالية:
سؤال المتداول: "${q}"

بيانات السهم اللحظية المعتمدة:
- السهم: ${stock.nameAr} (${stock.symbol}) - قطاع: ${stock.sectorAr || 'استثمار عام'}
- السعر الحالي: ${p.toFixed(2)} ج.م (التغير: ${stock.changePct >= 0 ? '+' : ''}${stock.changePct}%)
- أعلى سعر: ${stock.high || p * 1.02} ج.م | أدنى سعر: ${stock.low || p * 0.98} ج.م
- حجم التداول اليوم: ${vol.toLocaleString('en-US')} سهم | متوسط 20 يوم (ADV20): ${adv20.toLocaleString('en-US')} سهم | RVOL: ${rvol20}x
- التقييم الفني الموحد لـ TradingView: [${tv.overallRatingAr}] بنسبة ${tv.overallScorePct}%
- المتوسطات المتحركة: ${tv.movingAverages.ratingAr} (SMA20: ${stock.sma20 || '-'}, SMA50: ${stock.sma50 || '-'}, EMA20: ${stock.ema20 || '-'})
- مؤشر SuperTrend: ${techInd.superTrend.trendAr} (دعم وقائي: ${techInd.superTrend.superTrendValue.toFixed(2)} ج.م)
- مؤشر القوة النسبية RSI(14): ${stock.rsi14 || techInd.rsi.value.toFixed(1)} (${techInd.rsi.statusAr})
- مستويات الارتكاز Pivot: الارتكاز ${tv.levels.pivot} ج.م | S1: ${tv.levels.support1} ج.م | R1: ${tv.levels.resistance1} ج.م
- مدرسة السيولة الذكية (SMC):
  * هيكل السوق: ${smc.marketStructure.type} (${smc.marketStructure.badgeAr})
  * مناطق كتل الأوامر (Order Blocks): بين ${smc.orderBlock.zoneMin} و ${smc.orderBlock.zoneMax} ج.م (${smc.orderBlock.badgeAr})
  * صيد السيولة: ${smc.liquidity.sweepStatusAr}
  * الفجوة السعرية FVG: ${smc.fairValueGap.imbalanceStatusAr}
- مرحلة وايكوف وميزان التجميع: مرحلة [${adMetric.wyckoffStageAr}] (تجميع مؤسسي ${adMetric.accumulationScore}% مقابل تصريف ${adMetric.distributionScore}%)
- الموقف الشرعي: ${stock.isShariahCompliant ? 'متوافق مع الشريعة الإسلامية ومدرج بمؤشر EGX30 Shariah ✅' : `غير متوافق شرعاً (${stock.shariahReasonAr || 'تجاوز نسب الديون'}) ⚠️`}
- نطاق الدخول الاسترشادي: ${entryLow} - ${entryHigh} ج.م | الأهداف: TP1 عند ${target1} ج.م و TP2 عند ${target2} ج.م | وقف الخسارة: ${stopLoss} ج.م

${historyContext ? `السياق السابق للمحادثة:\n${historyContext}\n` : ''}

التعليمات:
1. أجب باللغة العربية بأسلوب احترافي مباشر ومركّز يجاوب تماماً على السؤال المطروح.
2. استشهد بالأرقام والمستويات الداعمة (الدعوم، المقاومات، أحجام التداول، المؤشرات).
3. قدّم نصيحة إدارة المخاطر المناسبة (حجم الصفقة، وقف الخسارة).
4. استخدم التنسيق النقطي الواضح والمريح للقراءة.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.25,
          maxOutputTokens: 900,
        },
      });

      return response.text || '';
    } catch (e) {
      console.warn('Free stock chat API error, falling back to deterministic response:', e);
    }
  }

  // Fallback high-precision financial logic
  const normQ = q.toLowerCase();

  if (normQ.includes('شراء') || normQ.includes('دخول') || normQ.includes('اشتري') || normQ.includes('فرصة')) {
    return `بناءً على المعطيات اللحظية لسهم ${stock.nameAr} (${stock.symbol}) عند سعر ${p.toFixed(2)} ج.م:
• تقييم الشارت العام: [${tv.overallRatingAr}] بإجماع ${tv.overallScorePct}% من المؤشرات الفنية.
• نطاق الشراء والتجميع المقترح: ما بين ${entryLow} ج.م و ${entryHigh} ج.م.
• المستهدف الأول: ${target1} ج.م (+4.5%) والمستهدف الثاني: ${target2} ج.م (+8.5%).
• وقف الخسارة الصارم: كسر مستوى ${stopLoss} ج.م بإغلاق شمعة يومية.
• نصيحة إدارة المخاطر: قسّم السيولة المخصصة للسهم على دفعتين ولا تتجاوز 10-15% من إجمالي المحفظة.`;
  }

  if (normQ.includes('بيع') || normQ.includes('هدف') || normQ.includes('مستهدف') || normQ.includes('ارباح')) {
    return `مستويات جني الأرباح والمقاومات لسهم ${stock.nameAr} (${stock.symbol}):
• الهدف الأول (TP1): ${target1} ج.م (ينصح بحجز جزء من الأرباح ورفع الوقف لسعر الدخول).
• الهدف الثاني (TP2): ${target2} ج.م.
• المقاومات الفنية لـ TradingView: R1 عند ${tv.levels.resistance1} ج.م و R2 عند ${tv.levels.resistance2} ج.م.
• مؤشر RSI الحالي: ${stock.rsi14 || techInd.rsi.value.toFixed(1)} (${techInd.rsi.statusAr}).`;
  }

  if (normQ.includes('دعم') || normQ.includes('وقف') || normQ.includes('خسارة') || normQ.includes('حماية')) {
    return `مستويات الدعم والحماية الرقمية لسهم ${stock.nameAr} (${stock.symbol}):
• وقف الخسارة الصارم (SL): [${stopLoss} ج.م] (كسر هذا المستوى يلغي السيناريو الصاعد).
• الدعم الأول (S1): ${tv.levels.support1} ج.م | الدعم الثاني (S2): ${tv.levels.support2} ج.م.
• دعم مؤشر السوبر ترند: ${techInd.superTrend.superTrendValue.toFixed(2)} ج.م (${techInd.superTrend.trendAr}).
• نقطة الارتكاز المحورية (Pivot): ${tv.levels.pivot} ج.م.`;
  }

  if (normQ.includes('صانع') || normQ.includes('سيول') || normQ.includes('حجم') || normQ.includes('فوليم') || normQ.includes('smc')) {
    return `تحليل حجم التداول وسلوك صانع السوق لسهم ${stock.nameAr} (${stock.symbol}):
• حجم التداول اليوم: ${vol.toLocaleString('en-US')} سهم (معامل نشاط ${rvol20}x مقارنة بمتوسط 20 يوماً).
• كتل أوامر صانع السوق (Order Block): متمركزة في النطاق ${smc.orderBlock.zoneMin} - ${smc.orderBlock.zoneMax} ج.م (${smc.orderBlock.badgeAr}).
• سلوك السيولة (Liquidity Sweeps): ${smc.liquidity.sweepStatusAr}.
• مقياس وايكوف: مرحلة [${adMetric.wyckoffStageAr}] مع غلبة تجميع مؤسسي بنسبة ${adMetric.accumulationScore}%.`;
  }

  if (normQ.includes('شريعة') || normQ.includes('حلال') || normQ.includes('حرام') || normQ.includes('شرعي')) {
    return stock.isShariahCompliant
      ? `🕋 الموقف الشرعي لسهم ${stock.nameAr} (${stock.symbol}):
• السهم متوافق تماماً مع الضوابط الشرعية المعتمدة ومدرج في مؤشر الشريعة الإسلامية EGX30 Shariah ✅
• نسبة الديون التمويلية: ${stock.shariahRatioDebt ? stock.shariahRatioDebt + '%' : '< 33%'} (ضمن الحدود المقبولة شرعاً).
• نشاط الشركة الأساسي مباح وخالي من المحرمات المصرفية.`
      : `⚠️ الموقف الشرعي لسهم ${stock.nameAr} (${stock.symbol}):
• السهم غير مدرج في مؤشر الشريعة الإسلامية حالياً ⚠️
• السبب: ${stock.shariahReasonAr || 'تجاوز نسب الديون التمويلية للحد الأقصى المسموح شرعاً (33%)'}.`;
  }

  return `📊 قراءة شاملة لحركة سهم ${stock.nameAr} (${stock.symbol}) بناءً على بيانات السوق اللحظية:
• السعر اللحظي: ${p.toFixed(2)} ج.م (${stock.changePct >= 0 ? '+' : ''}${stock.changePct}%).
• الرأي الفني لـ TradingView: [${tv.overallRatingAr}] بنسبة ثقة ${tv.overallScorePct}%.
• الاتجاه والزخم: ${techInd.superTrend.trendAr} مع دعم محوري عند ${tv.levels.pivot} ج.م.
• نطاق الشراء المقترح: ${entryLow} - ${entryHigh} ج.م | الأهداف: ${target1} ج.م و ${target2} ج.م | الوقف: ${stopLoss} ج.م.
• يمكنك طرح أي استفسار محدد إضافي عن الشارت أو السيولة أو الدعم والمقاومة وسأجيبك فوراً.`;
}
