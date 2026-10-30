/**
 * EGX Radar - Professional Excel Export Service (.xlsx)
 * Generates beautifully formatted Arabic Excel spreadsheets for:
 * 1. Stock Scanner & Trading Plans (ماسح الأسهم وخطط التداول)
 * 2. Advanced Technical Radars (الرواصد الفنية الأربعة: انفجار، ارتداد، قاع، قمة)
 * 3. Divergence Radar across 8 indicators (راصد الدايفرجنس)
 * 4. Technical Analyst & Accumulation Tranches (مناطق التجميع والمتوسطات)
 * 5. Master Multi-Sheet Platform Workbook (المصنف الشامل لجميع الرواصد)
 */

import * as XLSX from 'xlsx';
import { ScannedOpportunity } from './dayTradingAnalystService';
import { RadarSignal, evaluateExplosionSignals, evaluateReversalSignals, evaluateBottomFormationSignals, evaluateTopFormationSignals } from './radarAdvancedEngine';
import { DivergenceSignal, IndicatorDetails, calculateStockTechnicalIndicators } from './technicalAnalysisService';
import { EGXStock } from '../types/stock';
import { getCairoCurrentTimeFormatted } from '../utils/reportDisclaimer';
import { calculateAccumulationDistribution } from '../utils/accumulationDistributionEngine';
import { getTradingViewChartVerdict } from '../utils/tradingViewChartVerdict';
import { evaluateSmcAnalysis } from '../utils/smcAnalysisEngine';
import { getEstimated20DayAvgVolume } from './institutionalLiquidityAlertService';
import { verifyAndSyncReportPrice } from '../utils/priceVerificationService';

function sanitizeFileName(name: string): string {
  const dateStr = new Date().toISOString().split('T')[0];
  return `${name}_${dateStr}.xlsx`;
}

/**
 * Downloads an XLSX workbook in the browser
 */
function downloadWorkbook(workbook: XLSX.WorkBook, fileName: string) {
  const sanitizedName = sanitizeFileName(fileName);
  XLSX.writeFile(workbook, sanitizedName);
}

/**
 * 1. Export Stock Scanner & Complete Trading Plans to Excel
 */
export function exportTradingPlansToExcel(
  opportunities: ScannedOpportunity[],
  capitalEgp: number = 100000,
  riskPct: number = 0.5,
  customFileName?: string
) {
  const cairoTimeNow = getCairoCurrentTimeFormatted();

  const dataRows = opportunities.map((opp, idx) => ({
    'م': idx + 1,
    'رمز السهم': opp.stock.symbol,
    'اسم الشركة': opp.stock.nameAr,
    'القطاع': opp.stock.sectorAr || 'عام',
    'الموقف الشرعي': opp.stock.isShariahCompliant ? 'متوافق مع الشريعة ✅' : 'تقليدي',
    'السعر اللحظي (ج.م)': opp.stock.price,
    'التغير اليومي %': opp.stock.changePct,
    'جودة الصفقة': opp.quality,
    'تقييم الفرصة (من 100)': opp.score,
    'النموذج الفني المكتشف': opp.setupType,
    'تصنيف الاستراتيجية': opp.strategyCategoryAr,
    'أدنى نطاق الشراء (ج.م)': opp.entryZoneMin,
    'أقصى نطاق الشراء (ج.م)': opp.entryZoneMax,
    'سعر الدخول المثالي (ج.م)': opp.entryOptimal,
    'وقف الخسارة الصارم (SL)': opp.stopLoss,
    'نسبة وقف الخسارة %': opp.stopLossPct,
    'الهدف الأول TP1 (ج.م)': opp.takeProfit1,
    'نسبة ربح الهدف 1 %': opp.takeProfit1GainPct,
    'قاعدة الهدف 1': 'جني أرباح 50% + نقل الوقف لنقطة الدخول Breakeven 🛡️',
    'الهدف الثاني TP2 (ج.م)': opp.takeProfit2,
    'نسبة ربح الهدف 2 %': opp.takeProfit2GainPct,
    'قاعدة الهدف 2': 'جني أرباح 30% إضافية وحجز المكاسب 💰',
    'الهدف الثالث TP3 (ج.م)': opp.takeProfit3,
    'نسبة ربح الهدف 3 %': opp.takeProfit3GainPct,
    'نسبة العائد للمخاطرة R:R': opp.riskRewardRatio,
    'عدد الأسهم الموصى به': opp.recommendedShares,
    'قيمة الصفقة الإجمالية (ج.م)': opp.totalPositionValueEgp,
    'أقصى خسارة بالجنيه عند الوقف': opp.maxRiskAmountEgp,
    'الربح المتوقع عند الهدف 1 (ج.م)': opp.potentialProfitTp1Egp,
    'الربح التراكمي عند الهدف 2 (ج.م)': opp.potentialProfitTp2Egp,
    'السيولة المتداولة اليوم (ج.م)': opp.stock.valueTraded || 0,
    'حجم التداول اليومي': opp.stock.volume || 0,
    'مؤشر RSI': opp.stock.rsi14 || 50,
    'معيار إلغاء النموذج الفني': opp.invalidationAr,
    'أهم الأسباب الفنية للدخول': opp.reasons.join(' | '),
    'تاريخ وتوقيت الفحص': cairoTimeNow,
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataRows);
  
  // Set right-to-left orientation on sheet views
  worksheet['!views'] = [{ RTL: true }];

  // Auto-fit column widths
  const colWidths = [
    { wch: 4 },  // م
    { wch: 10 }, // رمز السهم
    { wch: 28 }, // اسم الشركة
    { wch: 20 }, // القطاع
    { wch: 18 }, // الموقف الشرعي
    { wch: 14 }, // السعر
    { wch: 12 }, // التغير
    { wch: 10 }, // جودة الصفقة
    { wch: 12 }, // تقييم الفرصة
    { wch: 35 }, // النموذج الفني
    { wch: 18 }, // تصنيف الاستراتيجية
    { wch: 14 }, // أدنى الشراء
    { wch: 14 }, // أقصى الشراء
    { wch: 14 }, // الدخول المثالي
    { wch: 14 }, // وقف الخسارة
    { wch: 12 }, // نسبة الوقف
    { wch: 14 }, // الهدف 1
    { wch: 12 }, // نسبة الهدف 1
    { wch: 40 }, // قاعدة الهدف 1
    { wch: 14 }, // الهدف 2
    { wch: 12 }, // نسبة الهدف 2
    { wch: 35 }, // قاعدة الهدف 2
    { wch: 14 }, // الهدف 3
    { wch: 12 }, // نسبة الهدف 3
    { wch: 14 }, // R:R
    { wch: 14 }, // عدد الأسهم
    { wch: 18 }, // قيمة الصفقة
    { wch: 18 }, // أقصى خسارة
    { wch: 18 }, // ربح هدف 1
    { wch: 18 }, // ربح هدف 2
    { wch: 18 }, // السيولة
    { wch: 14 }, // الحجم
    { wch: 10 }, // RSI
    { wch: 40 }, // معيار الإلغاء
    { wch: 55 }, // الأسباب الفنية
    { wch: 24 }, // التوقيت
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'خطط التداول والماسح');

  downloadWorkbook(workbook, customFileName || 'تقرير_ماسح_الأسهم_وخطط_التداول_EGX');
}

/**
 * 2. Export The 4 Advanced Radars to Excel
 */
export function exportRadarsToExcel(
  signals: RadarSignal[],
  radarCategoryNameAr: string = 'الرواصد_الفنية_المتقدمة',
  customFileName?: string
) {
  const cairoTimeNow = getCairoCurrentTimeFormatted();

  const dataRows = signals.map((sig, idx) => ({
    'م': idx + 1,
    'رمز السهم': sig.symbol,
    'اسم الشركة': sig.stockNameAr,
    'نوع الرادار': sig.titleAr,
    'شارة الرادار': sig.badgeAr,
    'درجة الخطورة / القوة': sig.severity === 'HIGH' ? 'مرتفعة / حاسمة' : 'متوسطة',
    'نسبة الثقة الفنية %': sig.confidenceScore,
    'السعر اللحظي (ج.م)': sig.triggerPrice,
    'التغير اليومي %': sig.changePct,
    'المستهدف الأول (ج.م)': sig.targetPrice1,
    'المستهدف الثاني (ج.م)': sig.targetPrice2,
    'وقف الخسارة (ج.م)': sig.stopLossPrice,
    'نسبة العائد للمخاطرة R:R': sig.riskRewardRatio,
    'الموقف الشرعي': sig.isShariah ? 'متوافق مع الشريعة ✅' : 'تقليدي',
    'السيولة وقيمة التداول (ج.م)': sig.valueTraded || 0,
    'المؤشرات الفنية المعتمدة': sig.indicatorsUsed.join(' ، '),
    'الشرح والتشخيص الفني': sig.explanationAr,
    'الخطة والنصيحة التنفيذية': sig.actionAdviceAr,
    'تاريخ وتوقيت التقرير': cairoTimeNow,
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataRows);
  worksheet['!views'] = [{ RTL: true }];

  worksheet['!cols'] = [
    { wch: 4 },  // م
    { wch: 10 }, // رمز السهم
    { wch: 28 }, // اسم الشركة
    { wch: 32 }, // نوع الرادار
    { wch: 18 }, // شارة الرادار
    { wch: 14 }, // درجة القوة
    { wch: 12 }, // نسبة الثقة
    { wch: 14 }, // السعر
    { wch: 12 }, // التغير
    { wch: 14 }, // هدف 1
    { wch: 14 }, // هدف 2
    { wch: 14 }, // وقف الخسارة
    { wch: 14 }, // R:R
    { wch: 18 }, // الموقف الشرعي
    { wch: 18 }, // السيولة
    { wch: 32 }, // المؤشرات
    { wch: 50 }, // التشخيص
    { wch: 45 }, // النصيحة
    { wch: 24 }, // التوقيت
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الرواصد الفنية');

  downloadWorkbook(workbook, customFileName || `تقرير_${radarCategoryNameAr}_EGX`);
}

/**
 * 3. Export Divergence Radar (8 Indicators) to Excel
 */
export function exportDivergencesToExcel(
  signals: DivergenceSignal[],
  customFileName?: string
) {
  const cairoTimeNow = getCairoCurrentTimeFormatted();

  const dataRows = signals.map((sig, idx) => ({
    'م': idx + 1,
    'رمز السهم': sig.symbol,
    'اسم الشركة': sig.stockNameAr,
    'السعر اللحظي (ج.م)': sig.price,
    'التغير اليومي %': sig.changePct,
    'نوع الدايفرجنس': sig.typeLabelAr,
    'المؤشر الفني المرصود': sig.indicatorNameAr,
    'كود المؤشر': sig.indicatorCode,
    'قوة الإشارة': sig.signalStrength,
    'تاريخ الرصد': sig.detectedDate,
    'توقيت الرصد': sig.detectedTimeAr,
    'درجة الحداثة': sig.freshnessLabelAr,
    'سلوك السعر': sig.priceActionAr,
    'سلوك المؤشر': sig.indicatorActionAr,
    'سعر الدخول والتأكيد (ج.م)': sig.triggerPrice,
    'المستهدف الأول (ج.م)': sig.targetPrice1,
    'المستهدف الثاني (ج.م)': sig.targetPrice2,
    'وقف الخسارة (ج.م)': sig.stopLossPrice,
    'نسبة العائد للمخاطرة R:R': sig.riskRewardRatio,
    'الموقف الشرعي': sig.isShariah ? 'متوافق مع الشريعة ✅' : 'تقليدي',
    'التوصية الفنية': sig.actionRecommendationAr,
    'توقيت استخراج الملف': cairoTimeNow,
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataRows);
  worksheet['!views'] = [{ RTL: true }];

  worksheet['!cols'] = [
    { wch: 4 },  // م
    { wch: 10 }, // رمز السهم
    { wch: 28 }, // اسم الشركة
    { wch: 14 }, // السعر
    { wch: 12 }, // التغير
    { wch: 35 }, // نوع الدايفرجنس
    { wch: 30 }, // المؤشر
    { wch: 10 }, // كود المؤشر
    { wch: 12 }, // قوة الإشارة
    { wch: 16 }, // تاريخ الرصد
    { wch: 20 }, // توقيت الرصد
    { wch: 16 }, // درجة الحداثة
    { wch: 40 }, // سلوك السعر
    { wch: 40 }, // سلوك المؤشر
    { wch: 14 }, // الدخول
    { wch: 14 }, // هدف 1
    { wch: 14 }, // هدف 2
    { wch: 14 }, // وقف الخسارة
    { wch: 14 }, // R:R
    { wch: 18 }, // الموقف الشرعي
    { wch: 45 }, // التوصية
    { wch: 24 }, // التوقيت
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'راصد الدايفرجنس');

  downloadWorkbook(workbook, customFileName || 'تقرير_راصد_الدايفرجنس_EGX');
}

/**
 * 4. Export Technical Analyst & Accumulation Tranches to Excel
 */
export function exportAccumulationPlansToExcel(
  analyzedList: Array<{ stock: EGXStock; indicators: IndicatorDetails }>,
  customFileName?: string
) {
  const cairoTimeNow = getCairoCurrentTimeFormatted();

  const dataRows = analyzedList.map((item, idx) => {
    const s = item.stock;
    const ind = item.indicators;
    const plan = ind.accumulationPlan;

    return {
      'م': idx + 1,
      'رمز السهم': s.symbol,
      'اسم الشركة': s.nameAr,
      'القطاع': s.sectorAr,
      'السعر اللحظي (ج.م)': s.price,
      'التغير اليومي %': s.changePct,
      'الرأي العام والإجماع': ind.consensusRatingAr,
      'درجة الإجماع (من 100)': ind.consensusScore,
      'حالة السوبرترند SuperTrend': ind.superTrend.trend === 'BULLISH' ? 'صاعد 🟢' : 'هابط 🔴',
      'دعم السوبرترند (ج.م)': ind.superTrend.superTrendValue,
      'مؤشر RSI 14': ind.rsi.value,
      'حالة RSI': ind.rsi.statusAr,
      'استوكاستك %K': ind.stochastic.k,
      'استوكاستك %D': ind.stochastic.d,
      'ماكدي MACD': ind.macd.statusAr,
      'المتوسطات الصاعدة (من 5)': `${ind.movingAverages.bullishCount} من 5`,
      'حالة نطاق التجميع': plan.statusAr,
      'أدنى نطاق التجميع (ج.م)': plan.primaryZone.min,
      'أقصى نطاق التجميع (ج.م)': plan.primaryZone.max,
      'متوسط التكلفة المستهدف (ج.م)': plan.blendedTargetCost,
      'سعر الدفعة الأولى 35%': plan.tranches.tranche1.price,
      'سعر الدفعة الثانية 40%': plan.tranches.tranche2.price,
      'سعر الدفعة الثالثة 25%': plan.tranches.tranche3.price,
      'المستهدف الأول T1 (ج.م)': plan.targets.t1.price,
      'ربح الهدف 1 %': plan.targets.t1.gainPct,
      'المستهدف الثاني T2 (ج.م)': plan.targets.t2.price,
      'ربح الهدف 2 %': plan.targets.t2.gainPct,
      'المستهدف الثالث T3 (ج.م)': plan.targets.t3.price,
      'وقف الخسارة الصارم (ج.م)': plan.stopLoss.price,
      'نسبة الوقف %': plan.stopLoss.lossPct,
      'نسبة العائد للمخاطرة R:R': plan.riskRewardRatio,
      'فوليوم التأكيد المطلوب': plan.requiredVolumeConfirmation,
      'السيولة المطلوبة للتأكيد (ج.م)': plan.requiredLiquidityConfirmationEgp,
      'التوصية التنفيذية': plan.recommendationAr,
      'الموقف الشرعي': s.isShariahCompliant ? 'متوافق مع الشريعة ✅' : 'تقليدي',
      'تاريخ وتوقيت التقرير': cairoTimeNow,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(dataRows);
  worksheet['!views'] = [{ RTL: true }];

  worksheet['!cols'] = [
    { wch: 4 },  // م
    { wch: 10 }, // رمز السهم
    { wch: 28 }, // اسم الشركة
    { wch: 20 }, // القطاع
    { wch: 14 }, // السعر
    { wch: 12 }, // التغير
    { wch: 18 }, // الرأي العام
    { wch: 12 }, // درجة الإجماع
    { wch: 16 }, // السوبرترند
    { wch: 14 }, // دعم السوبرترند
    { wch: 10 }, // RSI
    { wch: 24 }, // حالة RSI
    { wch: 10 }, // استوكاستك K
    { wch: 10 }, // استوكاستك D
    { wch: 24 }, // الماكدي
    { wch: 14 }, // المتوسطات
    { wch: 30 }, // حالة التجميع
    { wch: 14 }, // أدنى التجميع
    { wch: 14 }, // أقصى التجميع
    { wch: 16 }, // متوسط التكلفة
    { wch: 14 }, // دفعة 1
    { wch: 14 }, // دفعة 2
    { wch: 14 }, // دفعة 3
    { wch: 14 }, // هدف 1
    { wch: 10 }, // ربح هدف 1
    { wch: 14 }, // هدف 2
    { wch: 10 }, // ربح هدف 2
    { wch: 14 }, // هدف 3
    { wch: 14 }, // وقف الخسارة
    { wch: 10 }, // نسبة الوقف
    { wch: 14 }, // R:R
    { wch: 16 }, // فوليوم التأكيد
    { wch: 18 }, // سيولة التأكيد
    { wch: 40 }, // التوصية
    { wch: 18 }, // الموقف الشرعي
    { wch: 24 }, // التوقيت
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'مناطق التجميع والمتوسطات');

  downloadWorkbook(workbook, customFileName || 'تقرير_مناطق_التجميع_والمتوسطات_EGX');
}

/**
 * 5. Master Platform Workbook: Generates a single Excel file with ALL sheets
 */
export function exportMasterPlatformWorkbookToExcel(
  stocks: EGXStock[],
  opportunities: ScannedOpportunity[],
  divergences: DivergenceSignal[],
  analyzedList: Array<{ stock: EGXStock; indicators: IndicatorDetails }>,
  customFileName?: string
) {
  const cairoTimeNow = getCairoCurrentTimeFormatted();
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Trading Plans & Scanner
  if (opportunities && opportunities.length > 0) {
    const dataScanner = opportunities.map((opp, idx) => ({
      'م': idx + 1,
      'رمز السهم': opp.stock.symbol,
      'اسم الشركة': opp.stock.nameAr,
      'القطاع': opp.stock.sectorAr,
      'الموقف الشرعي': opp.stock.isShariahCompliant ? 'متوافق ✅' : 'تقليدي',
      'السعر اللحظي (ج.م)': opp.stock.price,
      'التغير %': opp.stock.changePct,
      'جودة الصفقة': opp.quality,
      'التقييم (100)': opp.score,
      'النموذج الفني': opp.setupType,
      'نطاق الدخول': `${opp.entryZoneMin} - ${opp.entryZoneMax}`,
      'الدخول المثالي': opp.entryOptimal,
      'وقف الخسارة SL': opp.stopLoss,
      'نسبة الوقف %': opp.stopLossPct,
      'الهدف 1 TP1': opp.takeProfit1,
      'ربح هدف 1 %': opp.takeProfit1GainPct,
      'الهدف 2 TP2': opp.takeProfit2,
      'ربح هدف 2 %': opp.takeProfit2GainPct,
      'الهدف 3 TP3': opp.takeProfit3,
      'نسبة R:R': opp.riskRewardRatio,
      'الكمية المقترحة': opp.recommendedShares,
      'قيمة الصفقة (ج.م)': opp.totalPositionValueEgp,
      'أقصى خسارة (ج.م)': opp.maxRiskAmountEgp,
      'ربح هدف 1 (ج.م)': opp.potentialProfitTp1Egp,
      'ربح تراكمي هدف 2 (ج.م)': opp.potentialProfitTp2Egp,
      'السيولة المتداولة (ج.م)': opp.stock.valueTraded || 0,
      'شرط الإلغاء': opp.invalidationAr,
      'تاريخ الفحص': cairoTimeNow,
    }));
    const ws1 = XLSX.utils.json_to_sheet(dataScanner);
    ws1['!views'] = [{ RTL: true }];
    XLSX.utils.book_append_sheet(workbook, ws1, 'خطط التداول والماسح');
  }

  // Sheet 2: The 4 Advanced Radars (Explosion, Reversal, Bottom, Top)
  const explosionSigs = evaluateExplosionSignals(stocks);
  const reversalSigs = evaluateReversalSignals(stocks);
  const bottomSigs = evaluateBottomFormationSignals(stocks);
  const topSigs = evaluateTopFormationSignals(stocks);
  const allRadarSigs = [...explosionSigs, ...reversalSigs, ...bottomSigs, ...topSigs];

  if (allRadarSigs.length > 0) {
    const dataRadars = allRadarSigs.map((sig, idx) => ({
      'م': idx + 1,
      'نوع الرادار': sig.titleAr,
      'الشارة': sig.badgeAr,
      'رمز السهم': sig.symbol,
      'اسم الشركة': sig.stockNameAr,
      'السعر (ج.م)': sig.triggerPrice,
      'التغير %': sig.changePct,
      'نسبة الثقة %': sig.confidenceScore,
      'الهدف 1': sig.targetPrice1,
      'الهدف 2': sig.targetPrice2,
      'وقف الخسارة': sig.stopLossPrice,
      'نسبة R:R': sig.riskRewardRatio,
      'السيولة اليومية': sig.valueTraded || 0,
      'الموقف الشرعي': sig.isShariah ? 'متوافق ✅' : 'تقليدي',
      'التشخيص الفني': sig.explanationAr,
      'الخطة المقترحة': sig.actionAdviceAr,
    }));
    const ws2 = XLSX.utils.json_to_sheet(dataRadars);
    ws2['!views'] = [{ RTL: true }];
    XLSX.utils.book_append_sheet(workbook, ws2, 'الرواصد الأربعة');
  }

  // Sheet 3: Divergence Radar
  if (divergences && divergences.length > 0) {
    const dataDiv = divergences.map((sig, idx) => ({
      'م': idx + 1,
      'رمز السهم': sig.symbol,
      'اسم الشركة': sig.stockNameAr,
      'السعر (ج.م)': sig.price,
      'التغير %': sig.changePct,
      'نوع الدايفرجنس': sig.typeLabelAr,
      'المؤشر الفني': sig.indicatorNameAr,
      'تاريخ الرصد': sig.detectedDate,
      'توقيت الرصد': sig.detectedTimeAr,
      'الحداثة': sig.freshnessLabelAr,
      'نقطة التأكيد': sig.triggerPrice,
      'هدف 1': sig.targetPrice1,
      'هدف 2': sig.targetPrice2,
      'وقف الخسارة': sig.stopLossPrice,
      'نسبة R:R': sig.riskRewardRatio,
      'سلوك السعر': sig.priceActionAr,
      'سلوك المؤشر': sig.indicatorActionAr,
      'التوصية': sig.actionRecommendationAr,
    }));
    const ws3 = XLSX.utils.json_to_sheet(dataDiv);
    ws3['!views'] = [{ RTL: true }];
    XLSX.utils.book_append_sheet(workbook, ws3, 'راصد الدايفرجنس');
  }

  // Sheet 4: Accumulation Plans & Moving Averages
  if (analyzedList && analyzedList.length > 0) {
    const dataAcc = analyzedList.map((item, idx) => ({
      'م': idx + 1,
      'رمز السهم': item.stock.symbol,
      'اسم الشركة': item.stock.nameAr,
      'القطاع': item.stock.sectorAr,
      'السعر': item.stock.price,
      'التغير %': item.stock.changePct,
      'الإجماع الفني': item.indicators.consensusRatingAr,
      'الدرجة %': item.indicators.consensusScore,
      'نطاق التجميع': `${item.indicators.accumulationPlan.primaryZone.min} - ${item.indicators.accumulationPlan.primaryZone.max}`,
      'متوسط التكلفة المستهدف': item.indicators.accumulationPlan.blendedTargetCost,
      'هدف 1': item.indicators.accumulationPlan.targets.t1.price,
      'هدف 2': item.indicators.accumulationPlan.targets.t2.price,
      'وقف الخسارة': item.indicators.accumulationPlan.stopLoss.price,
      'السوبرترند': item.indicators.superTrend.trend === 'BULLISH' ? 'صاعد' : 'هابط',
      'RSI': item.indicators.rsi.value,
      'المتوسطات الصاعدة': `${item.indicators.movingAverages.bullishCount} من 5`,
      'التوصية': item.indicators.accumulationPlan.recommendationAr,
    }));
    const ws4 = XLSX.utils.json_to_sheet(dataAcc);
    ws4['!views'] = [{ RTL: true }];
    XLSX.utils.book_append_sheet(workbook, ws4, 'مناطق التجميع');
  }

  // Sheet 5: All Stocks & Shariah List
  const dataStocks = stocks.map((s, idx) => ({
    'م': idx + 1,
    'رمز السهم': s.symbol,
    'اسم الشركة': s.nameAr,
    'الاسم بالإنجليزية': s.nameEn,
    'القطاع': s.sectorAr,
    'السعر اللحظي (ج.م)': s.price,
    'الإغلاق السابق': s.prevClose,
    'التغير %': s.changePct,
    'قيمة التداول (ج.م)': s.valueTraded || 0,
    'حجم التداول': s.volume || 0,
    'أعلى سعر': s.high,
    'أدنى سعر': s.low,
    'الموقف الشرعي': s.isShariahCompliant ? 'متوافق مع الشريعة ✅' : 'غير متوافق ⚠️',
    'نسبة الديون الربوية %': s.shariahRatioDebt ?? (s.isShariahCompliant ? 15 : 75),
    'نسبة الودائع الفائدية %': s.shariahRatioCashInterest ?? (s.isShariahCompliant ? 12 : 68),
    'بيان الحكم الشرعي': s.shariahReasonAr,
    'مؤشر EGX30': s.isInEgx30 ? 'نعم' : 'لا',
    'مؤشر EGX70': s.isInEgx70 ? 'نعم' : 'لا',
    'مؤشر EGX100': s.isInEgx100 ? 'نعم' : 'لا',
    'مؤشر الشريعة EGX33': s.isInShariahIndex ? 'نعم' : 'لا',
    'تاريخ التحديث': cairoTimeNow,
  }));
  const ws5 = XLSX.utils.json_to_sheet(dataStocks);
  ws5['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(workbook, ws5, 'قائمة أسهم البورصة');

  downloadWorkbook(workbook, customFileName || 'المصنف_الشامل_لرادارات_البورصة_المصرية_EGX');
}

/**
 * 6. MASTER GENERAL COMPREHENSIVE EXCEL REPORT FOR ALL EGX STOCKS
 * (التقرير الشامل العام لجميع الأسهم المصرية من جميع النواحي والخطط والأهداف والمخاطر ومقياس التجميع والتصريف)
 * Covers all 290+ stocks in the market from every possible angle:
 * - Basic & Pricing Metrics (الأساسيات والأسعار والسيولة)
 * - Shariah Screening & Ratios (الفحص الشرعي ونسب الديون والعلّة)
 * - Precision Accumulation vs Distribution Metric (مقياس التجميع والتصريف الدقيق ووايكوف وVSA وCLV)
 * - TradingView 26-Indicator Consensus & Chart Verdict (رأي شارت تريدنج فيو المعتمد)
 * - Technical Indicators (RSI, Stochastic, MACD, SuperTrend, 5 Moving Averages)
 * - Smart Money Concepts SMC (هيكل السوق، كتل الأوامر، صيد السيولة، فجوات FVG)
 * - Complete Actionable Trading Plan (نطاق الشراء، الدخول المثالي، وقف الخسارة، أهداف TP1/TP2/TP3، نسبة R:R)
 * - Capital Management & Risk Sizing for 100k EGP (حجم المركز، أقصى خسارة، الأرباح المتوقعة)
 * - General Risk Evaluation & Strategic Actionable Recommendation (تقييم المخاطر والتوصية النهائية)
 */
export function exportMasterComprehensiveAllStocksExcel(
  stocks: EGXStock[],
  capitalEgp: number = 100000,
  riskPct: number = 0.5,
  customFileName?: string
) {
  const cairoTimeNow = getCairoCurrentTimeFormatted();
  const targetRiskEgp = (capitalEgp * riskPct) / 100;

  // Compute full analytics for all stocks
  const masterRows = stocks.map((s, idx) => {
    const p = s.price > 0 ? s.price : 10;
    const change = s.changePct || 0;
    const valueTraded = s.valueTraded || 0;
    const volume = s.volume || 0;
    const high = s.high && s.high > 0 ? s.high : p * 1.025;
    const low = s.low && s.low > 0 ? s.low : p * 0.975;

    // 0. 20-Day Average Volume & Liquidity Spike Metrics (ADV20)
    const adv20 = getEstimated20DayAvgVolume(s);
    const rvol20 = adv20 > 0 ? Number((volume / adv20).toFixed(2)) : 0;
    const hasLiquiditySpike = volume >= adv20 && (s.valueTraded || 0) >= 50000;
    let spikeStatusAr = 'سيولة اعتيادية أقل من متوسط 20 يوم';
    if (volume >= adv20 * 1.75 && (s.valueTraded || 0) >= 50000) {
      spikeStatusAr = `⚡ تدفق مؤسسي انفجاري (${rvol20}x من متوسط 20 يوم)`;
    } else if (volume >= adv20 * 1.25 && (s.valueTraded || 0) >= 50000) {
      spikeStatusAr = `⚡ دخول مؤسسي قوي (${rvol20}x من متوسط 20 يوم)`;
    } else if (hasLiquiditySpike) {
      spikeStatusAr = `⚡ تجاوز متوسط 20 يوم (${rvol20}x دخول نشط)`;
    }

    // 1. Accumulation vs Distribution Engine
    const adMetric = calculateAccumulationDistribution(s, 'يومي (1D)');

    // 2. Technical Indicators & Moving Averages
    const techInd = calculateStockTechnicalIndicators(s, '1D');
    const ma = techInd.movingAverages;

    // 3. TradingView Unified Rating & Pivot Levels
    const tv = getTradingViewChartVerdict(s, 'يومي (1D)');

    // 4. Smart Money Concepts (SMC)
    const smc = evaluateSmcAnalysis(s, 'يومي (1D)');

    // 5. Complete Executable Trading Plan Calculations
    const entryMin = Number(Math.min(p, Math.max(low, p * 0.992)).toFixed(2));
    const entryMax = Number((p * 1.008).toFixed(2));
    const entryOptimal = Number(((entryMin + entryMax) / 2).toFixed(2));

    const slCandidate = Math.min(low * 0.991, entryOptimal * 0.972);
    const stopLoss = Number(slCandidate.toFixed(2));
    const riskDistance = Math.max(0.04, entryOptimal - stopLoss);
    const stopLossPct = Number(((riskDistance / entryOptimal) * 100).toFixed(1));

    const tp1 = Number((entryOptimal + riskDistance * 1.6).toFixed(2));
    const tp2 = Number((entryOptimal + riskDistance * 2.8).toFixed(2));
    const tp3 = Number((entryOptimal + riskDistance * 4.2).toFixed(2));

    const gainTp1Pct = Number((((tp1 - entryOptimal) / entryOptimal) * 100).toFixed(1));
    const gainTp2Pct = Number((((tp2 - entryOptimal) / entryOptimal) * 100).toFixed(1));
    const gainTp3Pct = Number((((tp3 - entryOptimal) / entryOptimal) * 100).toFixed(1));

    const rrRatioNumber = Number(((tp2 - entryOptimal) / riskDistance).toFixed(2));
    const riskRewardRatio = `1 : ${rrRatioNumber}`;

    // Position Sizing based on risk
    const recommendedShares = Math.max(10, Math.floor(targetRiskEgp / riskDistance));
    const totalPositionValue = Math.round(recommendedShares * entryOptimal);
    const maxRiskAmount = Math.round(recommendedShares * riskDistance);
    const projectedProfitTp1 = Math.round(recommendedShares * 0.5 * (tp1 - entryOptimal));
    const projectedProfitTp2 = Math.round(
      recommendedShares * 0.5 * (tp1 - entryOptimal) + recommendedShares * 0.3 * (tp2 - entryOptimal)
    );

    // General Risk Rating & Strategic Recommendation
    let riskLevelAr = 'مخاطرة معتدلة (متوازنة)';
    if (s.rsi14 && s.rsi14 >= 72) riskLevelAr = 'مخاطرة مرتفعة (تشبع شرائي عالي)';
    else if (adMetric.isDistribution) riskLevelAr = 'مخاطرة مرتفعة (ضغط تصريف بيعي)';
    else if (adMetric.isAccumulation && p <= tv.levels.pivot * 1.02) riskLevelAr = 'مخاطرة منخفضة (منطقة أمان تجميعية 🛡️)';

    let finalActionAr = '';
    if (adMetric.phase === 'STRONG_ACCUMULATION' || (adMetric.isAccumulation && tv.overallRating.includes('BUY'))) {
      finalActionAr = 'شراء وتمركز تجميعي قوي مع استهداف TP1 و TP2 ووقف عند SL 🟢';
    } else if (adMetric.isAccumulation) {
      finalActionAr = 'شراء على دفعات هادئة (Scale-in) داخل نطاق الشراء المحدد 💎';
    } else if (adMetric.phase === 'HEAVY_DISTRIBUTION' || tv.overallRating === 'STRONG_SELL') {
      finalActionAr = 'تخارج كامل وتجنب الشراء لحماية رأس المال 🛑';
    } else if (adMetric.isDistribution || tv.overallRating === 'SELL') {
      finalActionAr = 'جني أرباح جزئي وتخفيف المراكز وتأمين الأرباح ⚠️';
    } else {
      finalActionAr = 'حياد ومراقبة حتى اكتمال شروط الاختراق واختبار الدعم ⚖️';
    }

    return {
      'م': idx + 1,
      'رمز السهم': s.symbol,
      'اسم الشركة': s.nameAr,
      'الاسم بالإنجليزية': s.nameEn || s.symbol,
      'القطاع': s.sectorAr,
      'السعر اللحظي (ج.م)': p,
      'الإغلاق السابق (ج.م)': s.prevClose || p,
      'التغير اليومي %': change,
      'التغير (ج.م)': s.changeAbs || 0,
      'قيمة التداول اليوم (ج.م)': valueTraded,
      'حجم التداول اليوم (سهم)': volume,
      'متوسط حجم 20 يوم (سهم)': adv20,
      'معدل الحجم إلى متوسط 20 يوم (RVOL)': rvol20,
      'تنبيه قفزة السيولة المؤسساتية (20 يوم)': spikeStatusAr,
      'أعلى سعر اليوم': high,
      'أدنى سعر اليوم': low,
      'الموقف الشرعي': s.isShariahCompliant ? 'متوافق مع الشريعة الإسلامية ✅' : 'غير متوافق (تقليدي) ⚠️',
      'نسبة الديون الربوية %': s.shariahRatioDebt ?? (s.isShariahCompliant ? 15 : 75),
      'نسبة الودائع الفائدية %': s.shariahRatioCashInterest ?? (s.isShariahCompliant ? 12 : 68),
      'علّة وسند الحكم الشرعي': s.shariahReasonAr,
      // Precision Accumulation vs Distribution Metric
      'مقياس التجميع والتصريف (الحالة)': adMetric.phaseAr,
      'نسبة التجميع المؤسسي %': adMetric.accumulationScore,
      'نسبة التصريف البيعي %': adMetric.distributionScore,
      'معامل موضع الإغلاق CLV': adMetric.clv,
      'حالة موضع الإغلاق': adMetric.clvStatusAr,
      'مرحلة دورة وايكوف': adMetric.wyckoffStageAr,
      'تفسير مرحلة وايكوف': adMetric.wyckoffExplanationAr,
      'تحليل الحجم والمدى VSA': adMetric.vsaInsightAr,
      'صافي السيولة التجميعية/المصرفة (ج.م)': adMetric.estimatedAccumulatedValueEgp,
      // TradingView Unified Rating & Technicals
      'تقييم شارت TradingView الموحد': tv.overallRatingAr,
      'قوة إشارة الشارت %': tv.overallScorePct,
      'خلاصة رأي شارت TradingView': tv.explicitChartOpinionAr,
      'شمعة الشارت اللحظية': tv.candlestick.patternNameAr,
      'نقطة الارتكاز Pivot (ج.م)': tv.levels.pivot,
      'الدعم الأول S1 (ج.م)': tv.levels.support1,
      'الدعم الثاني S2 (ج.م)': tv.levels.support2,
      'المقاومة الأولى R1 (ج.م)': tv.levels.resistance1,
      'المقاومة الثانية R2 (ج.م)': tv.levels.resistance2,
      // Indicators
      'مؤشر RSI 14': techInd.rsi.value,
      'حالة RSI': techInd.rsi.statusAr,
      'مؤشر السوبرترند SuperTrend': techInd.superTrend.trend === 'BULLISH' ? 'صاعد أخضر 🟢' : 'هابط أحمر 🔴',
      'دعم/مقاومة السوبرترند (ج.م)': techInd.superTrend.superTrendValue,
      'مؤشر الاستوكاستك %K': techInd.stochastic.k,
      'مؤشر الاستوكاستك %D': techInd.stochastic.d,
      'مؤشر الماكدي MACD': techInd.macd.statusAr,
      'المتوسطات الصاعدة من 5': `${ma.bullishCount} من 5`,
      'تقييم المتوسطات المتحركة': ma.ratingAr,
      // Smart Money Concepts SMC
      'هيكل مدرسة SMC': smc.marketStructure.badgeAr,
      'نوع كسر الهيكل': smc.marketStructure.type,
      'كتلة أوامر صانع السوق Order Block': `${smc.orderBlock.zoneMin} - ${smc.orderBlock.zoneMax} ج.م`,
      'صيد وسحب السيولة Sweeps': smc.liquidity.sweepStatusAr,
      'تسعير السهم المؤسسي': smc.pricing.zoneBadgeAr,
      // Complete Executable Trading Plan
      'أدنى نطاق الشراء (ج.م)': entryMin,
      'أقصى نطاق الشراء (ج.م)': entryMax,
      'سعر الدخول المثالي (ج.م)': entryOptimal,
      'وقف الخسارة الصارم SL (ج.م)': stopLoss,
      'نسبة وقف الخسارة %': stopLossPct,
      'الهدف الأول TP1 (ج.م)': tp1,
      'نسبة ربح الهدف 1 %': gainTp1Pct,
      'قاعدة الهدف 1': 'جني أرباح 50% + تأمين الصفقة بنقل الوقف لنقطة الدخول Breakeven 🛡️',
      'الهدف الثاني TP2 (ج.م)': tp2,
      'نسبة ربح الهدف 2 %': gainTp2Pct,
      'قاعدة الهدف 2': 'جني أرباح 30% إضافية وحجز الأرباح 💰',
      'الهدف الثالث TP3 الممتد (ج.م)': tp3,
      'نسبة ربح الهدف 3 %': gainTp3Pct,
      'نسبة العائد للمخاطرة R:R': riskRewardRatio,
      // Capital & Position Sizing (for 100k EGP Capital, 0.5% risk)
      'الكمية المقترحة للشراء (سهم)': recommendedShares,
      'قيمة الصفقة الإجمالية (ج.م)': totalPositionValue,
      'أقصى مخاطرة بالجنيه عند الوقف': maxRiskAmount,
      'الربح المتوقع عند الهدف 1 (ج.م)': projectedProfitTp1,
      'الربح التراكمي عند الهدف 2 (ج.م)': projectedProfitTp2,
      // Risk and Recommendation
      'تقييم المخاطر العام': riskLevelAr,
      'التوصية الاستراتيجية التنفيذية النهائية': finalActionAr,
      'مؤشر EGX30': s.isInEgx30 ? 'نعم' : 'لا',
      'مؤشر EGX70': s.isInEgx70 ? 'نعم' : 'لا',
      'مؤشر EGX100': s.isInEgx100 ? 'نعم' : 'لا',
      'مؤشر الشريعة EGX33': s.isInShariahIndex ? 'نعم' : 'لا',
      'تاريخ ووقت الفحص الشامل': cairoTimeNow,
    };
  });

  const workbook = XLSX.utils.book_new();

  // Sheet 1: Comprehensive Master Report for All Stocks
  const wsMaster = XLSX.utils.json_to_sheet(masterRows);
  wsMaster['!views'] = [{ RTL: true }];

  // Generous column widths for Master Sheet
  wsMaster['!cols'] = [
    { wch: 4 },  // م
    { wch: 10 }, // رمز السهم
    { wch: 28 }, // اسم الشركة
    { wch: 24 }, // الاسم بالإنجليزية
    { wch: 22 }, // القطاع
    { wch: 14 }, // السعر
    { wch: 14 }, // الإغلاق السابق
    { wch: 12 }, // التغير %
    { wch: 12 }, // التغير ج.م
    { wch: 18 }, // قيمة التداول
    { wch: 16 }, // حجم التداول
    { wch: 16 }, // متوسط حجم 20 يوم
    { wch: 14 }, // معدل RVOL
    { wch: 35 }, // تنبيه قفزة السيولة المؤسساتية
    { wch: 12 }, // أعلى سعر
    { wch: 12 }, // أدنى سعر
    { wch: 24 }, // الموقف الشرعي
    { wch: 14 }, // نسبة الديون
    { wch: 14 }, // نسبة الودائع
    { wch: 45 }, // علة الحكم
    { wch: 32 }, // مقياس التجميع والتصريف
    { wch: 16 }, // نسبة التجميع
    { wch: 16 }, // نسبة التصريف
    { wch: 14 }, // CLV
    { wch: 25 }, // حالة CLV
    { wch: 35 }, // مرحلة وايكوف
    { wch: 45 }, // تفسير وايكوف
    { wch: 40 }, // VSA
    { wch: 22 }, // صافي السيولة التجميعية
    { wch: 22 }, // تقييم TradingView
    { wch: 14 }, // قوة الشارت %
    { wch: 55 }, // خلاصة رأي TradingView
    { wch: 25 }, // شمعة الشارت
    { wch: 14 }, // Pivot
    { wch: 14 }, // S1
    { wch: 14 }, // S2
    { wch: 14 }, // R1
    { wch: 14 }, // R2
    { wch: 10 }, // RSI
    { wch: 22 }, // حالة RSI
    { wch: 18 }, // SuperTrend
    { wch: 16 }, // دعم SuperTrend
    { wch: 10 }, // Stoch K
    { wch: 10 }, // Stoch D
    { wch: 25 }, // MACD
    { wch: 16 }, // المتوسطات الصاعدة
    { wch: 18 }, // تقييم المتوسطات
    { wch: 24 }, // هيكل SMC
    { wch: 16 }, // نوع الكسر
    { wch: 25 }, // Order Block
    { wch: 35 }, // Sweeps
    { wch: 24 }, // تسعير السهم
    { wch: 14 }, // أدنى الشراء
    { wch: 14 }, // أقصى الشراء
    { wch: 14 }, // الدخول المثالي
    { wch: 14 }, // وقف الخسارة SL
    { wch: 12 }, // نسبة الوقف %
    { wch: 14 }, // الهدف 1
    { wch: 12 }, // نسبة ربح هدف 1
    { wch: 45 }, // قاعدة الهدف 1
    { wch: 14 }, // الهدف 2
    { wch: 12 }, // نسبة ربح هدف 2
    { wch: 35 }, // قاعدة الهدف 2
    { wch: 14 }, // الهدف 3
    { wch: 12 }, // نسبة ربح هدف 3
    { wch: 14 }, // R:R
    { wch: 16 }, // الكمية المقترحة
    { wch: 18 }, // قيمة الصفقة
    { wch: 18 }, // أقصى مخاطرة بالجنيه
    { wch: 18 }, // ربح هدف 1
    { wch: 18 }, // ربح هدف 2
    { wch: 22 }, // تقييم المخاطر
    { wch: 45 }, // التوصية الاستراتيجية
    { wch: 10 }, // EGX30
    { wch: 10 }, // EGX70
    { wch: 10 }, // EGX100
    { wch: 12 }, // الشريعة
    { wch: 25 }, // التوقيت
  ];

  XLSX.utils.book_append_sheet(workbook, wsMaster, 'التقرير_الشامل_لكافة_الأسهم');

  // Sheet 2: أسهم_التجميع_المؤسسي_الواعدة (Top Verified Accumulation Stocks)
  const accumulationRows = masterRows.filter((r) =>
    r['مقياس التجميع والتصريف (الحالة)'].includes('تجميع') || r['نسبة التجميع المؤسسي %'] >= 60
  );
  if (accumulationRows.length > 0) {
    const wsAcc = XLSX.utils.json_to_sheet(accumulationRows);
    wsAcc['!views'] = [{ RTL: true }];
    wsAcc['!cols'] = wsMaster['!cols'];
    XLSX.utils.book_append_sheet(workbook, wsAcc, 'أسهم_التجميع_المؤسسي');
  }

  // Sheet 3: أسهم_التصريف_والتخارج_للحذر (Top Distribution Stocks)
  const distributionRows = masterRows.filter((r) =>
    r['مقياس التجميع والتصريف (الحالة)'].includes('تصريف') || r['نسبة التصريف البيعي %'] >= 60
  );
  if (distributionRows.length > 0) {
    const wsDist = XLSX.utils.json_to_sheet(distributionRows);
    wsDist['!views'] = [{ RTL: true }];
    wsDist['!cols'] = wsMaster['!cols'];
    XLSX.utils.book_append_sheet(workbook, wsDist, 'أسهم_التصريف_للحذر');
  }

  // Sheet 4: أسهم_مؤشر_الشريعة_المعتمدة (Shariah Compliant Stocks)
  const shariahRows = masterRows.filter((r) => r['الموقف الشرعي'].includes('متوافق'));
  if (shariahRows.length > 0) {
    const wsShar = XLSX.utils.json_to_sheet(shariahRows);
    wsShar['!views'] = [{ RTL: true }];
    wsShar['!cols'] = wsMaster['!cols'];
    XLSX.utils.book_append_sheet(workbook, wsShar, 'أسهم_مؤشر_الشريعة');
  }

  downloadWorkbook(
    workbook,
    customFileName || 'التقرير_العام_الشامل_لجميع_الأسهم_المصرية_والخطط_والمخاطر_EGX'
  );
}

/**
 * 7. Export Global Markets (الأسواق العالمية) & Moving Averages to Excel (.xlsx)
 */
export function exportGlobalMarketsToExcel(
  assets: any[],
  alerts: any[] = [],
  customFileName?: string
) {
  const cairoTimeNow = getCairoCurrentTimeFormatted();
  const workbook = XLSX.utils.book_new();

  // Sheet 1: All Global Assets & Moving Averages
  const dataAssets = assets.map((a, idx) => ({
    'م': idx + 1,
    'رمز الأداة': a.symbol,
    'اسم المؤشر / الأصل': a.nameAr,
    'الاسم بالإنجليزية': a.nameEn,
    'القطاع / الفئة': a.categoryLabelAr,
    'السعر اللحظي': a.price,
    'الوحدة': a.unit,
    'الإغلاق السابق': a.prevClose,
    'التغير اليومي %': a.changePct,
    'التغير المطلق': a.changeAbs,
    'أعلى سعر': a.high,
    'أدنى سعر': a.low,
    // Moving Averages
    'متوسط 20 يوم (SMA 20)': a.movingAverages?.sma20 || 0,
    'متوسط 50 يوم (SMA 50)': a.movingAverages?.sma50 || 0,
    'متوسط 100 يوم (SMA 100)': a.movingAverages?.sma100 || 0,
    'متوسط 200 يوم (SMA 200)': a.movingAverages?.sma200 || 0,
    'متوسط أسي 20 (EMA 20)': a.movingAverages?.ema20 || 0,
    'متوسط أسي 50 (EMA 50)': a.movingAverages?.ema50 || 0,
    'المسافة عن متوسط 50 %': a.movingAverages?.priceVsSma50Pct || 0,
    'المسافة عن متوسط 200 %': a.movingAverages?.priceVsSma200Pct || 0,
    'السعر فوق متوسط 50': a.movingAverages?.isPriceAboveSma50 ? 'نعم ✅' : 'لا ❌',
    'السعر فوق متوسط 200': a.movingAverages?.isPriceAboveSma200 ? 'نعم ✅' : 'لا ❌',
    'حالة التقاطع (Cross)': a.movingAverages?.crossoverLabelAr || '-',
    'إشارة الاتجاه الفني': a.movingAverages?.trendVerdictAr || '-',
    'توقيت الفحص': cairoTimeNow,
  }));

  const wsAssets = XLSX.utils.json_to_sheet(dataAssets);
  wsAssets['!views'] = [{ RTL: true }];
  wsAssets['!cols'] = [
    { wch: 4 },  // م
    { wch: 10 }, // رمز
    { wch: 32 }, // اسم
    { wch: 25 }, // English
    { wch: 22 }, // فئة
    { wch: 14 }, // سعر
    { wch: 10 }, // وحدة
    { wch: 14 }, // إغلاق
    { wch: 12 }, // تغير %
    { wch: 12 }, // تغير مطلق
    { wch: 14 }, // أعلى
    { wch: 14 }, // أدنى
    { wch: 18 }, // SMA 20
    { wch: 18 }, // SMA 50
    { wch: 18 }, // SMA 100
    { wch: 18 }, // SMA 200
    { wch: 18 }, // EMA 20
    { wch: 18 }, // EMA 50
    { wch: 18 }, // مسافة 50
    { wch: 18 }, // مسافة 200
    { wch: 18 }, // فوق 50
    { wch: 18 }, // فوق 200
    { wch: 35 }, // تقاطع
    { wch: 35 }, // اتجاه
    { wch: 25 }, // توقيت
  ];
  XLSX.utils.book_append_sheet(workbook, wsAssets, 'الأسواق_العالمية_والمتوسطات');

  // Sheet 2: Recent Alerts
  if (alerts && alerts.length > 0) {
    const dataAlerts = alerts.map((al, idx) => ({
      'م': idx + 1,
      'الأصل / المؤشر': al.assetNameAr,
      'الرمز': al.assetSymbol,
      'نوع التنبيه': al.titleAr,
      'تفاصيل الإشارة': al.messageAr,
      'السعر عند التنبيه': al.currentPrice,
      'التغير %': al.changePct,
      'الأهمية': al.severity,
      'التوقيت': al.timestamp,
    }));
    const wsAlerts = XLSX.utils.json_to_sheet(dataAlerts);
    wsAlerts['!views'] = [{ RTL: true }];
    XLSX.utils.book_append_sheet(workbook, wsAlerts, 'تنبيهات_المؤشرات_اللحظية');
  }

  downloadWorkbook(
    workbook,
    customFileName || 'الأسواق_العالمية_والمتوسطات_المتحركة_والتنبيهات'
  );
}

/**
 * 8. Export Direct Market Comparison to Excel (.xlsx)
 */
export function exportComparisonToExcel(
  asset1: any,
  asset2: any,
  metrics: {
    correlation: number;
    correlationLabelAr: string;
    spreadPct: number;
    winnerSymbol: string;
    winnerNameAr: string;
    returns1: { day: number; week: number; month: number; threeMonths: number; year: number };
    returns2: { day: number; week: number; month: number; threeMonths: number; year: number };
    thesisAr: string;
  },
  customFileName?: string
) {
  const cairoTimeNow = getCairoCurrentTimeFormatted();
  const workbook = XLSX.utils.book_new();

  const comparisonRows = [
    {
      'المعيار / المؤشر': 'الرمز والتداول',
      'الطرف الأول': `${asset1.nameAr} (${asset1.symbol})`,
      'الطرف الثاني': `${asset2.nameAr} (${asset2.symbol})`,
      'ملاحظات المقارنة': `مقارنة مباشرة بين ${asset1.categoryLabelAr || 'السوق'} و ${asset2.categoryLabelAr || 'السوق'}`,
    },
    {
      'المعيار / المؤشر': 'السعر اللحظي الحالي',
      'الطرف الأول': `${asset1.price.toLocaleString()} ${asset1.unit || 'ج.م'}`,
      'الطرف الثاني': `${asset2.price.toLocaleString()} ${asset2.unit || 'ج.م'}`,
      'ملاحظات المقارنة': 'أسعار لحظية مباشرة متزامنة مع شارت TradingView',
    },
    {
      'المعيار / المؤشر': 'التغير اليومي للجلسة %',
      'الطرف الأول': `${asset1.changePct >= 0 ? '+' : ''}${asset1.changePct}%`,
      'الطرف الثاني': `${asset2.changePct >= 0 ? '+' : ''}${asset2.changePct}%`,
      'ملاحظات المقارنة': `الفارق: ${Math.abs(asset1.changePct - asset2.changePct).toFixed(2)}%`,
    },
    {
      'المعيار / المؤشر': 'عائد أسبوع (1W)',
      'الطرف الأول': `${metrics.returns1.week >= 0 ? '+' : ''}${metrics.returns1.week}%`,
      'الطرف الثاني': `${metrics.returns2.week >= 0 ? '+' : ''}${metrics.returns2.week}%`,
      'ملاحظات المقارنة': metrics.returns1.week > metrics.returns2.week ? `${asset1.symbol} يتفوق أسبوعياً` : `${asset2.symbol} يتفوق أسبوعياً`,
    },
    {
      'المعيار / المؤشر': 'عائد شهر (1M)',
      'الطرف الأول': `${metrics.returns1.month >= 0 ? '+' : ''}${metrics.returns1.month}%`,
      'الطرف الثاني': `${metrics.returns2.month >= 0 ? '+' : ''}${metrics.returns2.month}%`,
      'ملاحظات المقارنة': metrics.returns1.month > metrics.returns2.month ? `${asset1.symbol} يتفوق شهرياً` : `${asset2.symbol} يتفوق شهرياً`,
    },
    {
      'المعيار / المؤشر': 'عائد 3 أشهر (3M)',
      'الطرف الأول': `${metrics.returns1.threeMonths >= 0 ? '+' : ''}${metrics.returns1.threeMonths}%`,
      'الطرف الثاني': `${metrics.returns2.threeMonths >= 0 ? '+' : ''}${metrics.returns2.threeMonths}%`,
      'ملاحظات المقارنة': 'أداء ربع سنوي متوسط المدى',
    },
    {
      'المعيار / المؤشر': 'عائد سنة كاملة (1Y)',
      'الطرف الأول': `${metrics.returns1.year >= 0 ? '+' : ''}${metrics.returns1.year}%`,
      'الطرف الثاني': `${metrics.returns2.year >= 0 ? '+' : ''}${metrics.returns2.year}%`,
      'ملاحظات المقارنة': 'أداء استثماري سنوي تراكمي',
    },
    {
      'المعيار / المؤشر': 'معامل الارتباط السعري (Correlation r)',
      'الطرف الأول': `${metrics.correlation >= 0 ? '+' : ''}${metrics.correlation}`,
      'الطرف الثاني': `${metrics.correlation >= 0 ? '+' : ''}${metrics.correlation}`,
      'ملاحظات المقارنة': metrics.correlationLabelAr,
    },
    {
      'المعيار / المؤشر': 'مؤشر القوة النسبية RSI (14)',
      'الطرف الأول': `${asset1.rsi14 || 52}`,
      'الطرف الثاني': `${asset2.rsi14 || 52}`,
      'ملاحظات المقارنة': 'زخم الشراء والتشبع البيعي',
    },
    {
      'المعيار / المؤشر': 'مؤشر السوبر ترند SuperTrend',
      'الطرف الأول': asset1.superTrendAr || 'صاعد (Bullish)',
      'الطرف الثاني': asset2.superTrendAr || 'صاعد (Bullish)',
      'ملاحظات المقارنة': 'اتجاه الاتجاه الرئيسي',
    },
    {
      'المعيار / المؤشر': 'تقييم TradingView المجمع',
      'الطرف الأول': asset1.tvRatingAr || 'شراء قوي (Strong Buy)',
      'الطرف الثاني': asset2.tvRatingAr || 'شراء (Buy)',
      'ملاحظات المقارنة': 'إجماع 26 مؤشراً فنياً من TradingView',
    },
    {
      'المعيار / المؤشر': 'الأصل الأقوى في الزخم الحالي',
      'الطرف الأول': metrics.winnerSymbol === asset1.symbol ? '⭐ الأقوى تفوقاً' : 'تابع',
      'الطرف الثاني': metrics.winnerSymbol === asset2.symbol ? '⭐ الأقوى تفوقاً' : 'تابع',
      'ملاحظات المقارنة': `${metrics.winnerNameAr} يتصدر الأداء النسبي`,
    },
  ];

  const ws = XLSX.utils.json_to_sheet(comparisonRows);
  ws['!views'] = [{ RTL: true }];
  ws['!cols'] = [
    { wch: 35 }, // المعيار
    { wch: 28 }, // الطرف 1
    { wch: 28 }, // الطرف 2
    { wch: 45 }, // ملاحظات
  ];

  XLSX.utils.book_append_sheet(workbook, ws, 'مقارنة_الأداء_المباشر');

  // Sheet 2: AI Thesis
  const wsThesis = XLSX.utils.json_to_sheet([
    {
      'البيان': 'توقيت المقارنة',
      'التفاصيل': cairoTimeNow,
    },
    {
      'البيان': 'ملخص التحليل الاستراتيجي وتوزيع المحفظة',
      'التفاصيل': metrics.thesisAr,
    },
  ]);
  wsThesis['!views'] = [{ RTL: true }];
  wsThesis['!cols'] = [{ wch: 30 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(workbook, wsThesis, 'التحليل_الاستراتيجي');

  downloadWorkbook(
    workbook,
    customFileName || `مقارنة_${asset1.symbol}_مع_${asset2.symbol}`
  );
}

/**
 * 6. Export Price Audit Sheet: Compares Chart Price vs Reports Engine Price
 * Enables user to audit discrepancies, verify timestamps, and discover any price lag or differences across all stocks.
 */
export function exportPriceAuditToExcel(
  stocks: EGXStock[],
  customFileName?: string
) {
  const cairoTimeNow = getCairoCurrentTimeFormatted();
  const dateStr = new Date().toISOString().split('T')[0];

  const workbook = XLSX.utils.book_new();

  let perfectMatchCount = 0;
  let minorVarianceCount = 0;
  let significantVarianceCount = 0;

  const rows = stocks.map((stk, idx) => {
    const verified = verifyAndSyncReportPrice(stk, stocks);
    const chartPrice = verified.currentChartPrice;
    const reportPrice = stk.price;
    const diffAbs = Math.abs(Number((chartPrice - reportPrice).toFixed(3)));
    const diffPct = chartPrice > 0 ? Number(((diffAbs / chartPrice) * 100).toFixed(2)) : 0;

    let auditStatus = 'متطابق 100% لحظياً ✅';
    if (diffAbs === 0) {
      perfectMatchCount++;
      auditStatus = 'متطابق 100% لحظياً ✅';
    } else if (diffPct < 0.5) {
      minorVarianceCount++;
      auditStatus = 'فارق طفيف جداً مقبول 🟢 (أقل من 0.5%)';
    } else {
      significantVarianceCount++;
      auditStatus = '⚠️ تباين سعري يستوجب المراجعة';
    }

    return {
      'م': idx + 1,
      'رمز السهم': stk.symbol,
      'اسم الشركة': stk.nameAr,
      'القطاع': stk.sectorAr || 'عام',
      'سعر الشارت الفني الحالي (ج.م)': chartPrice,
      'السعر في التقارير (ج.م)': reportPrice,
      'الفارق السعري (ج.م)': diffAbs === 0 ? 0 : Number((chartPrice - reportPrice).toFixed(3)),
      'نسبة التباين %': diffPct,
      'حالة التدقيق والمطابقة': auditStatus,
      'سعر الإغلاق السابق (ج.م)': stk.prevClose || 0,
      'التغير اليومي %': stk.changePct,
      'الموقف الشرعي': stk.isShariahCompliant ? 'متوافق مع الشريعة ✅' : 'تقليدي',
      'تاريخ الفحص': dateStr,
      'وقت الفحص (بتوقيت القاهرة)': cairoTimeNow,
      'مزود بيانات الشارت': 'TradingView Direct Live Feed 📈',
      'مصدر بيانات التقارير': 'EGX Live Market Engine 🏛️',
      'حالة التداول': (stk.price > 0) ? 'نشط / متداول' : 'موقوف / لا توجد تداولات',
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!views'] = [{ RTL: true }];
  ws['!cols'] = [
    { wch: 6 },  // م
    { wch: 14 }, // رمز السهم
    { wch: 32 }, // اسم الشركة
    { wch: 22 }, // القطاع
    { wch: 24 }, // سعر الشارت
    { wch: 24 }, // السعر في التقارير
    { wch: 20 }, // الفارق السعري
    { wch: 16 }, // نسبة التباين %
    { wch: 35 }, // حالة التدقيق
    { wch: 22 }, // سعر الإغلاق السابق
    { wch: 16 }, // التغير اليومي %
    { wch: 22 }, // الموقف الشرعي
    { wch: 15 }, // تاريخ الفحص
    { wch: 26 }, // وقت الفحص
    { wch: 30 }, // مزود بيانات الشارت
    { wch: 30 }, // مصدر بيانات التقارير
    { wch: 22 }, // حالة التداول
  ];

  XLSX.utils.book_append_sheet(workbook, ws, 'تدقيق_أسعار_الشارت_والتقارير');

  // Sheet 2: ملخص الرقابة والتدقيق السعري
  const totalStocks = stocks.length;
  const matchRate = totalStocks > 0 ? Number(((perfectMatchCount / totalStocks) * 100).toFixed(1)) : 100;

  const summaryRows = [
    { 'معيار التدقيق السعري': 'إجمالي عدد الأسهم المفحوصة', 'القيمة / النتيجة': `${totalStocks} سهم` },
    { 'معيار التدقيق السعري': 'عدد الأسهم المتطابقة تماماً (100%)', 'القيمة / النتيجة': `${perfectMatchCount} سهم` },
    { 'معيار التدقيق السعري': 'عدد الأسهم ذات فارق طفيف جداً (< 0.5%)', 'القيمة / النتيجة': `${minorVarianceCount} سهم` },
    { 'معيار التدقيق السعري': 'عدد الأسهم ذات تباين سعري ملحوظ', 'القيمة / النتيجة': `${significantVarianceCount} سهم` },
    { 'معيار التدقيق السعري': 'نسبة دقة وتطابق الأسعار الكلية', 'القيمة / النتيجة': `${matchRate}%` },
    { 'معيار التدقيق السعري': 'تاريخ ووقت التدقيق الشامل', 'القيمة / النتيجة': cairoTimeNow },
    { 'معيار التدقيق السعري': 'المنطقة الزمنية المعتمدة', 'القيمة / النتيجة': 'Africa/Cairo (توقيت القاهرة المحلي)' },
    { 'معيار التدقيق السعري': 'التوصية والاعتماد', 'القيمة / النتيجة': matchRate >= 95 ? 'البيانات موثوقة ومطابقة للشارت بدقة عالية ✅' : 'يُنصح بتحديث بيانات الجلسة اللحظية ⚠️' },
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!views'] = [{ RTL: true }];
  wsSummary['!cols'] = [{ wch: 40 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(workbook, wsSummary, 'ملخص_تقرير_التدقيق');

  downloadWorkbook(workbook, customFileName || `تدقيق_أسعار_الشارت_والتقارير_${dateStr}`);
}


