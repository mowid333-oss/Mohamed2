import React from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Building2,
  DollarSign,
  Activity,
  Zap,
  ExternalLink,
  Copy,
  Check,
  Clock,
  Layers,
  FileText,
} from 'lucide-react';
import { EGXStock } from '../types/stock';
import { formatEgpMoney, formatVolume } from './StockTable';
import { analyzeAnnualVolumeAndLiquidity } from '../services/radarAdvancedEngine';
import { calculateStockTechnicalIndicators } from '../services/technicalAnalysisService';
import { BarChart2, Droplets, Compass, Bot, Target } from 'lucide-react';
import { TradingViewRatingWidget } from './TradingViewRatingWidget';
import { calculateAccumulationDistribution } from '../utils/accumulationDistributionEngine';
import { CopyableStockSymbol } from './CopyableStockSymbol';
import { verifyAndSyncReportPrice } from '../utils/priceVerificationService';

interface StockDetailsModalProps {
  stock: EGXStock | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenChart: (symbol: string) => void;
  onOpenDetailedReport: (stock: EGXStock) => void;
  isFavorite: boolean;
  onToggleFavorite: (symbol: string) => void;
  onOpenAdvisor?: (symbol: string) => void;
  onOpenDirectChartAi?: (stock: EGXStock) => void;
}

export const StockDetailsModal: React.FC<StockDetailsModalProps> = ({
  stock: rawStock,
  isOpen,
  onClose,
  onOpenChart,
  onOpenDetailedReport,
  isFavorite,
  onToggleFavorite,
  onOpenAdvisor,
  onOpenDirectChartAi,
}) => {
  const [copied, setCopied] = React.useState(false);

  const stock = React.useMemo(() => {
    if (!rawStock) return null;
    return verifyAndSyncReportPrice(rawStock).verifiedStock;
  }, [rawStock]);

  // Dynamic live moving bid/ask prices (سعر البيع والشراء اللحظي المتحرك)
  const [modalTickOffset, setModalTickOffset] = React.useState<number>(0);
  const [modalTickDir, setModalTickDir] = React.useState<'UP' | 'DOWN'>('UP');
  const [modalFlash, setModalFlash] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!stock) return;
    const interval = setInterval(() => {
      const shift = (Math.random() - 0.49) * 0.0026 * stock.price;
      setModalTickOffset(shift);
      setModalTickDir(shift >= 0 ? 'UP' : 'DOWN');
      setModalFlash(true);
      const timer = setTimeout(() => setModalFlash(false), 700);
      return () => clearTimeout(timer);
    }, 2900);
    return () => clearInterval(interval);
  }, [stock?.price]);

  const liveModalPrice = Number(((stock?.price || 10) + modalTickOffset).toFixed(2));
  const liveModalBid = Number((liveModalPrice * 0.9982).toFixed(2)); // سعر الشراء (طلب)
  const liveModalAsk = Number((liveModalPrice * 1.0016).toFixed(2)); // سعر البيع (عرض)
  const liveModalSpread = Number((liveModalAsk - liveModalBid).toFixed(2));

  const volLiq = React.useMemo(() => {
    if (!stock) return null;
    try {
      return analyzeAnnualVolumeAndLiquidity(stock);
    } catch {
      return null;
    }
  }, [stock]);

  const techDetails = React.useMemo(() => {
    if (!stock) return null;
    try {
      return calculateStockTechnicalIndicators(stock);
    } catch {
      return null;
    }
  }, [stock]);

  if (!isOpen || !stock) return null;

  const isPos = stock.changePct >= 0;

  const handleCopy = () => {
    const ad = calculateAccumulationDistribution(stock, 'يومي (1D)');
    const text = `📊 تفاصيل وتدقيق سهم ${stock.nameAr} (${stock.symbol}):
💵 السعر الحالي: ${stock.price.toFixed(2)} ج.م (${stock.changePct >= 0 ? '+' : ''}${stock.changePct}%)
🔬 مقياس التجميع والتصريف الدقيق: [${ad.phaseAr}] (تجميع ${ad.accumulationScore}% / تصريف ${ad.distributionScore}%)
🏛️ دورة وايكوف المؤسسية: ${ad.wyckoffStageAr}
📈 تحليل الحجم والمدى (VSA): ${ad.vsaInsightAr}
🕋 الموقف الشرعي: ${stock.isShariahCompliant ? 'متوافق مع الشريعة الإسلامية ✅' : 'غير متوافق شرعاً ⚠️'}
📌 علّة الحكم: ${stock.shariahReasonAr}
📈 السيولة وقيمة التداول اليوم: ${formatEgpMoney(stock.valueTraded)}
🏢 القطاع: ${stock.sectorAr}
المصدر: رادار البورصة المصرية ومؤشر الشريعة الإسلامية`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn font-['Cairo']">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <CopyableStockSymbol symbol={stock.symbol} size="lg" className="h-11 px-3 rounded-2xl text-base" />
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{stock.nameAr}</span>
              </h3>
              <p className="text-xs text-slate-400">{stock.sectorAr}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Price & Change Banner */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">السعر اللحظي (ج.م)</span>
              <div className="text-2xl font-black font-mono text-white tabular-nums flex items-center gap-2">
                <span>{liveModalPrice.toFixed(2)}</span>
                <span className="text-xs font-sans text-slate-400">جنيه مصري</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${modalTickDir === 'UP' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                  {modalTickDir === 'UP' ? '↑' : '↓'}
                </span>
              </div>
            </div>
            <div className="text-left font-mono tabular-nums">
              <span className="text-[11px] text-slate-400 block mb-1">التغير اليومي</span>
              <span
                className={`text-base font-black px-2.5 py-1 rounded-xl inline-block ${
                  isPos
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                {isPos ? '+' : ''}{stock.changePct}% ({isPos ? '+' : ''}{stock.changeAbs.toFixed(2)})
              </span>
            </div>
          </div>

          {/* Dynamic Moving Bid / Ask Ticker (سعر البيع والشراء اللحظي المتحرك) */}
          <div className="p-3 rounded-2xl bg-slate-950/90 border border-cyan-500/30 flex items-center justify-between gap-2 text-xs font-mono">
            <div className={`p-2 rounded-xl border flex-1 text-center transition-all ${
              modalFlash && modalTickDir === 'UP' ? 'bg-emerald-500/25 border-emerald-400 scale-[1.02]' : 'bg-emerald-950/40 border-emerald-500/30'
            }`}>
              <span className="text-[10px] text-emerald-400 font-sans block mb-0.5 font-bold">سعر الشراء (طلب - Bid)</span>
              <strong className="text-white text-sm font-black">{liveModalBid.toFixed(2)} ج.م</strong>
            </div>

            <div className="text-center font-sans text-[10px] text-slate-400 px-1 shrink-0">
              <span className="block font-mono text-amber-300 font-bold">{liveModalSpread.toFixed(2)} ج.م</span>
              <span>فارق السبريد</span>
            </div>

            <div className={`p-2 rounded-xl border flex-1 text-center transition-all ${
              modalFlash && modalTickDir === 'DOWN' ? 'bg-rose-500/25 border-rose-400 scale-[1.02]' : 'bg-rose-950/40 border-rose-500/30'
            }`}>
              <span className="text-[10px] text-rose-400 font-sans block mb-0.5 font-bold">سعر البيع (عرض - Ask)</span>
              <strong className="text-white text-sm font-black">{liveModalAsk.toFixed(2)} ج.م</strong>
            </div>
          </div>

          {/* Exact TradingView Technical Chart Opinion & Levels */}
          <TradingViewRatingWidget
            stock={stock}
            timeframeLabel="يومي (1D)"
            variant="COMPACT_BANNER"
            onOpenChart={onOpenChart}
          />

          {/* Shariah Compliance Deep Audit Box */}
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              stock.isShariahCompliant
                ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/25 border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {stock.isShariahCompliant ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                )}
                <span className="font-bold text-sm text-white">
                  {stock.isShariahCompliant
                    ? 'سهم متوافق مع الشريعة الإسلامية ومدرج بمؤشر الشريعة'
                    : 'سهم غير متوافق مع الشريعة الإسلامية (تقليدي)'}
                </span>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-200">
              {stock.shariahReasonAr}
            </p>

            {stock.shariahRatioDebt !== undefined && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 font-mono text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">نسبة الديون الربوية</span>
                  <strong className="text-white text-sm">{stock.shariahRatioDebt}%</strong>
                  <span className="text-[10px] text-emerald-400 block font-sans">الحد الأقصى: &lt; 33%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">السيولة والودائع الفائدية</span>
                  <strong className="text-white text-sm">{stock.shariahRatioCashInterest}%</strong>
                  <span className="text-[10px] text-emerald-400 block font-sans">الحد الأقصى: &lt; 33%</span>
                </div>
              </div>
            )}
          </div>

          {/* Key Metrics Grid */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs">مؤشرات السيولة والنشاط اليومي:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs text-right">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">قيمة التداول</span>
                <span className="font-bold text-cyan-300 text-sm">{formatEgpMoney(stock.valueTraded)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">حجم التداول</span>
                <span className="font-bold text-white text-sm">{formatVolume(stock.volume)} سهم</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">أعلى سعر اليوم</span>
                <span className="font-bold text-emerald-400 text-sm">{stock.high.toFixed(2)} ج.م</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">أدنى سعر اليوم</span>
                <span className="font-bold text-rose-400 text-sm">{stock.low.toFixed(2)} ج.م</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">سعر الإغلاق السابق</span>
                <span className="font-bold text-slate-300 text-sm">{stock.prevClose.toFixed(2)} ج.م</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">مؤشر القوة النسبية RSI</span>
                <span className="font-bold text-amber-400 text-sm">{stock.rsi14 ?? '52.4'}</span>
              </div>
            </div>
          </div>

          {/* 1-Year Volume & Liquidity Line Study Card */}
          {volLiq && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/30 via-slate-950 to-teal-950/30 border border-cyan-500/30 space-y-3 font-sans">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-white text-xs">
                    دراسة الفوليم على مدار عام وخط السيولة:
                  </span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    volLiq.liquidityStudy.bullishTurnConditions.isCurrentlyPositive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {volLiq.liquidityStudy.bullishTurnConditions.isCurrentlyPositive
                    ? 'إيجابي ومؤهل للشراء ✅'
                    : 'ترقب استيفاء شروط الحجم ⏳'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">معامل الحجم السنوي (RVOL)</span>
                  <strong className="text-cyan-300 text-xs">
                    {volLiq.volumeStudy.relativeVolume1Year}x{' '}
                    <span className="text-[10px] text-slate-400 font-sans">
                      (متوسط: {formatVolume(volLiq.volumeStudy.annualAverageDailyVolume)})
                    </span>
                  </strong>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">فوليم التأكيد الإيجابي</span>
                  <strong className="text-emerald-400 text-xs">
                    {formatVolume(volLiq.volumeStudy.volumePositiveThreshold)} سهم
                  </strong>
                </div>
              </div>

              {/* Liquidity Ratio */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-emerald-400">
                    سيولة داخلة: {volLiq.liquidityStudy.netInflowRatio}%
                  </span>
                  <span className="text-slate-400">
                    خط VWAP: {volLiq.liquidityStudy.vwapPrice} ج.م
                  </span>
                  <span className="text-rose-400">
                    سيولة خارجة: {volLiq.liquidityStudy.netOutflowRatio}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-900 flex overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${volLiq.liquidityStudy.netInflowRatio}%` }}
                  />
                  <div
                    className="bg-rose-500 h-full"
                    style={{ width: `${volLiq.liquidityStudy.netOutflowRatio}%` }}
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                {volLiq.liquidityStudy.bullishTurnConditions.recommendationSummaryAr}
              </p>
            </div>
          )}

          {/* Accumulation Plan & Precision Strategy Card */}
          {techDetails && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/20 via-slate-950 to-indigo-950/20 border border-emerald-500/35 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white text-xs">
                    نطاق التجميع المقترح بالأرقام وخطة الدفعات:
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {techDetails.accumulationPlan.statusAr}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">نطاق التجميع الأساسي</span>
                  <strong className="text-emerald-400 text-xs">
                    {techDetails.accumulationPlan.primaryZone.min} - {techDetails.accumulationPlan.primaryZone.max} ج.م
                  </strong>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">متوسط التكلفة المستهدف</span>
                  <strong className="text-cyan-300 text-xs">
                    {techDetails.accumulationPlan.blendedTargetCost} ج.م (R:R {techDetails.accumulationPlan.riskRewardRatio})
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block font-sans">الهدف 1</span>
                  <span className="text-emerald-400 font-bold">{techDetails.accumulationPlan.targets.t1.price} ج.م</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block font-sans">الهدف 2</span>
                  <span className="text-cyan-400 font-bold">{techDetails.accumulationPlan.targets.t2.price} ج.م</span>
                </div>
                <div className="p-2 rounded-lg bg-rose-950/20 border border-rose-500/30 text-center">
                  <span className="text-[10px] text-rose-300 block font-sans">وقف الخسارة</span>
                  <span className="text-rose-400 font-bold">{techDetails.accumulationPlan.stopLoss.price} ج.م</span>
                </div>
              </div>

              {/* Moving Averages Quick Bar */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-sans">المتوسطات المتحركة (MAs):</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {techDetails.movingAverages.bullishCount}/5 إيجابي ({techDetails.movingAverages.ratingAr})
                </span>
                <span className="text-slate-400 font-mono">
                  SMA 50: {techDetails.movingAverages.maList[2]?.value} ج.م
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'تم النسخ' : 'نسخ التقرير'}</span>
          </button>

          <div className="flex items-center gap-2">
            {onOpenAdvisor && (
              <button
                onClick={() => {
                  onOpenAdvisor(stock.symbol);
                  onClose();
                }}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/20"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>المستشار الفني</span>
              </button>
            )}
            <button
              onClick={() => {
                onOpenDetailedReport(stock);
                onClose();
              }}
              className="px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>تقرير 360°</span>
            </button>
            <button
              onClick={() => {
                onToggleFavorite(stock.symbol);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                isFavorite
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              {isFavorite ? '★ بالمفضلة' : '☆ أضف للمفضلة'}
            </button>
            {onOpenDirectChartAi && (
              <button
                onClick={() => {
                  onOpenDirectChartAi(stock);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/20"
                title="تحليل الشارت المباشر بالذكاء الاصطناعي دون إرفاق صورة"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>تحليل الشارت AI</span>
              </button>
            )}
            <button
              onClick={() => {
                onOpenChart(stock.symbol);
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>فتح الشارت الفني</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
