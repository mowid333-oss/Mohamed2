import { GoogleGenAI } from '@google/genai';
import { EGXStock } from '../types/stock';
import { ComprehensiveStockAnalysisReport } from './radarAdvancedEngine';
import { generateStock360ViaApmix } from './apmixAiService';

export interface AiStockInsight {
  headlineAr: string;
  institutionalAnalysisAr: string;
  keyLevelsSummaryAr: string;
  smartAdviceAr: string;
  volumeAndLiquidityVerdictAr: string;
  generatedByAi: boolean;
}

export async function fetchAi360StockInsight(
  stock: EGXStock,
  report: ComprehensiveStockAnalysisReport
): Promise<AiStockInsight> {
  const apiKey =
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    '';

  const vol = report.annualVolumeStudy;
  const liq = report.liquidityLineStudy;

  const defaultInsight: AiStockInsight = {
    headlineAr: `تشخيص فني ودراسة حجم وسيولة سنوية لسهم ${stock.nameAr} (${stock.symbol})`,
    institutionalAnalysisAr: `يظهر سهم ${stock.nameAr} نشاطاً تداولياً بسعر ${stock.price.toFixed(2)} ج.م، حيث سجل حجماً قدره ${vol.currentVolume.toLocaleString()} سهم (يمثل ${vol.relativeVolume1Year}x مقارنة بمتوسط العام البالغ ${vol.annualAverageDailyVolume.toLocaleString()} سهم). خط السيولة في وضع (${liq.liquidityLineTrendAr}) بنسبة تدفق شرائي داخل ${liq.netInflowRatio}% وصافي سيولة ${liq.estimatedNetInflowEgp >= 0 ? '+' : ''}${(liq.estimatedNetInflowEgp / 1_000_000).toFixed(1)} مليون ج.م، مع تداول السعر ${liq.isPriceAboveVwap ? 'أعلى' : 'أدنى'} متوسط السعر المرجح بالسيولة VWAP (${liq.vwapPrice} ج.م).`,
    keyLevelsSummaryAr: `مستوى الدعم الوقائي محدد عند ${report.execution.stopLoss} ج.م، بينما المستهدف الفني الأقرب هو ${report.execution.target1} ج.م والمستهدف الاندفاعي عند ${report.execution.target2} ج.م. شرط التأكيد الحجمي هو تجاوز ${vol.volumePositiveThreshold.toLocaleString()} سهم.`,
    smartAdviceAr: `الرأي والتوصية: ${liq.bullishTurnConditions.recommendationSummaryAr}`,
    volumeAndLiquidityVerdictAr: liq.bullishTurnConditions.isCurrentlyPositive
      ? `السهم في مسار إيجابي مدعوم بحجم تداول أعلى من متوسط العام واختراق خط السيولة.`
      : `السهم في انتظار اختراق حاجز الفوليم (${vol.volumePositiveThreshold.toLocaleString()} سهم) وتجاوز خط السيولة للتحول للإيجابية الصريحة.`,
    generatedByAi: false,
  };

  // 1. First priority: Try ApMix Multi-Key Network
  try {
    const apmixInsight = await generateStock360ViaApmix(stock, report);
    if (apmixInsight && apmixInsight.headlineAr) {
      return {
        ...apmixInsight,
        generatedByAi: true,
      };
    }
  } catch (_apmixErr) {
    // Continue to Gemini fallback
  }

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return defaultInsight;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `أنت كبير محللي أسواق المال وخبير التداول المعتمد في البورصة المصرية EGX.
قم بإعداد تحليل 360 درجة موجز واحترافي باللغة العربية الفصحى لسهم شركة، مع التركيز الخاص على دراسة الفوليم على مدار عام وخط السيولة وتحديد متى يكون السهم إيجابياً بدقة:
- السهم: ${stock.nameAr} (${stock.symbol})
- القطاع: ${stock.sectorAr}
- السعر الحالي: ${stock.price.toFixed(2)} جنيه مصري
- التغير اليومي: ${stock.changePct}% (${stock.changeAbs.toFixed(2)} ج.م)
- حجم التداول اليوم: ${vol.currentVolume.toLocaleString()} سهم
- قيمة التداول اليوم: ${(vol.currentValueTraded / 1_000_000).toFixed(2)} مليون ج.م
- متوسط حجم التداول اليومي على مدار عام: ${vol.annualAverageDailyVolume.toLocaleString()} سهم
- معامل الحجم النسبي السنوي RVOL: ${vol.relativeVolume1Year}x
- شرط الحجم الإيجابي: تخطي ${vol.volumePositiveThreshold.toLocaleString()} سهم بقيمة ${(vol.valuePositiveThreshold / 1_000_000).toFixed(1)} مليون ج.م
- خط السيولة ونسبة التدفق: ${liq.liquidityLineTrendAr} (${liq.netInflowRatio}% سيولة داخلة مقابل ${liq.netOutflowRatio}% خارجة)
- صافي السيولة التراكمية: ${(liq.estimatedNetInflowEgp / 1_000_000).toFixed(1)} مليون ج.م
- خط متوسط السعر المرجح بالسيولة (VWAP): ${liq.vwapPrice} ج.م (السعر الحالي ${liq.isPriceAboveVwap ? 'أعلى' : 'أدنى'} منه)
- مؤشر القوة النسبية RSI: ${stock.rsi14 ?? '52'}
- الموقف الشرعي: ${stock.isShariahCompliant ? 'متوافق مع الشريعة الإسلامية' : 'سهم تقليدي'}
- تقييم الرواصد: انفجار (${report.explosionStatus.score}%)، انعكاس (${report.reversalStatus.score}%)، قيعان (${report.bottomStatus.score}%)، قمم (${report.topStatus.score}%)

أجب بصيغة JSON محددة تحتوي على المفاتيح التالية فقط:
{
  "headlineAr": "عنوان تشخيصي جذاب ومحدد يبرز السهم وحجم التداول وخط السيولة",
  "institutionalAnalysisAr": "فقرة تحليلية مكثفة من 3-4 أسطر تشرح سلوك السيولة الذكية، ودراسة الفوليم مقارنة بمتوسط العام، وحالة خط السيولة وVWAP",
  "keyLevelsSummaryAr": "ملخص للمستهدفات والدعوم الهامة ونقطة تأكيد الفوليم",
  "smartAdviceAr": "الرأي الفني والتوصية الدقيقة متى يدخل المتداول ومتى يعتبر السهم إيجابياً للشراء",
  "volumeAndLiquidityVerdictAr": "جملة واحدة حاسمة عن وضع الفوليم وخط السيولة"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim();
    if (text) {
      const parsed = JSON.parse(text);
      return {
        headlineAr: parsed.headlineAr || defaultInsight.headlineAr,
        institutionalAnalysisAr: parsed.institutionalAnalysisAr || defaultInsight.institutionalAnalysisAr,
        keyLevelsSummaryAr: parsed.keyLevelsSummaryAr || defaultInsight.keyLevelsSummaryAr,
        smartAdviceAr: parsed.smartAdviceAr || defaultInsight.smartAdviceAr,
        volumeAndLiquidityVerdictAr: parsed.volumeAndLiquidityVerdictAr || defaultInsight.volumeAndLiquidityVerdictAr,
        generatedByAi: true,
      };
    }
  } catch (error) {
    console.warn('AI 360 insight generation fallback:', error);
  }

  return defaultInsight;
}
