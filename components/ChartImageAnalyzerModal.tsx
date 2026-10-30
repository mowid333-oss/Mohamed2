import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Target,
  ShieldAlert,
  TrendingUp,
  BarChart2,
  Layers,
  FileText,
  Bot,
  PenTool,
} from 'lucide-react';
import { analyzeChartImage, ChartImageAnalysisResult } from '../services/chartVisionService';

interface ChartImageAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSymbol?: string;
  onOpenDirectChartAi?: (symbol: string) => void;
  preloadedImage?: string | null;
}

const SAMPLE_CHARTS = [
  {
    id: 'sample-1',
    title: 'نموذج اختراق تجميعي (TMGH)',
    subtitle: 'شمعة ابتلاعية صاعدة مع انفجار حجم تداول',
    dataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340"><rect width="600" height="340" fill="%230b0f17"/><line x1="50" y1="280" x2="550" y2="280" stroke="%23334155" stroke-dasharray="4"/><line x1="50" y1="170" x2="550" y2="170" stroke="%23334155" stroke-dasharray="4"/><line x1="50" y1="70" x2="550" y2="70" stroke="%23334155" stroke-dasharray="4"/><path d="M70,240 L130,220 L180,250 L230,190 L290,210 L350,150 L420,165 L500,85" fill="none" stroke="%2310b981" stroke-width="3"/><rect x="475" y="85" width="22" height="80" fill="%2310b981"/><line x1="486" y1="65" x2="486" y2="190" stroke="%2310b981" stroke-width="2"/><text x="495" y="60" fill="%2334d399" font-family="sans-serif" font-size="14" font-weight="bold">Breakout + Volume</text><rect x="60" y="290" width="20" height="25" fill="%23334155"/><rect x="120" y="290" width="20" height="30" fill="%23334155"/><rect x="180" y="290" width="20" height="20" fill="%23334155"/><rect x="240" y="290" width="20" height="40" fill="%23334155"/><rect x="300" y="290" width="20" height="35" fill="%23334155"/><rect x="360" y="290" width="20" height="50" fill="%23334155"/><rect x="420" y="290" width="20" height="45" fill="%23334155"/><rect x="476" y="270" width="20" height="65" fill="%2310b981"/><text x="50" y="35" fill="%2394a3b8" font-family="sans-serif" font-size="16" font-weight="bold">EGX30: TMGH Daily Chart [Resistance Breakout]</text></svg>',
  },
  {
    id: 'sample-2',
    title: 'نموذج ارتداد قاع مزدوج ودايفرجنس (SWDY)',
    subtitle: 'انعكاس صاعد من دعم رئيسي وتفريغ RSI',
    dataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340"><rect width="600" height="340" fill="%230b0f17"/><line x1="50" y1="240" x2="550" y2="240" stroke="%2306b6d4" stroke-width="1.5"/><text x="430" y="235" fill="%2306b6d4" font-family="sans-serif" font-size="12">Key Support Line</text><path d="M70,120 L150,238 L220,180 L290,235 L380,140 L480,110" fill="none" stroke="%2338bdf8" stroke-width="3"/><circle cx="150" cy="238" r="6" fill="%230284c7"/><circle cx="290" cy="235" r="6" fill="%230284c7"/><text x="210" y="260" fill="%2338bdf8" font-family="sans-serif" font-size="13" font-weight="bold">Double Bottom (W Pattern)</text><text x="50" y="35" fill="%2394a3b8" font-family="sans-serif" font-size="16" font-weight="bold">SWDY: Bullish Divergence on Daily Support</text></svg>',
  },
];

export const ChartImageAnalyzerModal: React.FC<ChartImageAnalyzerModalProps> = ({
  isOpen,
  onClose,
  defaultSymbol,
  onOpenDirectChartAi,
  preloadedImage,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/png');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ChartImageAnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [stockSymbolInput, setStockSymbolInput] = useState(defaultSymbol || '');

  // Preload image if provided via props
  useEffect(() => {
    if (preloadedImage) {
      setImagePreview(preloadedImage);
      setImageMime('image/png');
      setAnalysisResult(null);
    }
  }, [preloadedImage, isOpen]);

  // Enable clipboard paste (Ctrl+V) anywhere inside modal
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileSelect(file);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setAnalysisResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRunAnalysis = async () => {
    if (!imagePreview) return;
    setIsAnalyzing(true);
    try {
      const res = await analyzeChartImage(imagePreview, imageMime, stockSymbolInput);
      setAnalysisResult(res);
    } catch (err) {
      console.error('Error analyzing chart:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyReport = () => {
    if (!analysisResult) return;
    const cairoTimeNow = new Date().toLocaleString('ar-EG', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const drawingsText = (analysisResult.detectedDrawingsList || [])
      .map((d, i) => `  ${i + 1}. [${d.name}] (${d.type}) | الحالة: ${d.status}\n     الموقع والتفاصيل: ${d.details}\n     الأثر الفني المباشر: ${d.technicalImplication}`)
      .join('\n');

    const indicatorsText = (analysisResult.visibleIndicatorsList || [])
      .map((ind, i) => `  ${i + 1}. [${ind.name}] | القراءة: ${ind.reading} | الإشارة: ${ind.signal}\n     الرأي: ${ind.opinion}`)
      .join('\n');

    const text = `📊 تقرير تحليل الشارت بالرؤية الحاسوبية (Gemini Vision AI):
السهم المرصود: ${analysisResult.detectedSymbolOrName}
⏱️ تاريخ ووقت تحليل الشارت اللحظي: ${cairoTimeNow}
⚠️ تنويه للدقة والمصداقية: أسعار وبيانات الشارت الفني اللحظية قد تكون متأخرة 15 دقيقة بحسب اشتراطات البورصة المصرية ومزود البيانات TradingView.

💡 الرأي الفني الحالي الشامل:
${analysisResult.currentStanceOpinionAr}

🎯 القرار التكتيكي النهائي: ${analysisResult.strategicDecisionAr} (نسبة الثقة: ${analysisResult.confidenceScore}%)

📐 تحليل الرسم الآلي ونماذج الشارت الهندسية المرصودة:
${analysisResult.automatedDrawingsAnalysisAr || 'تم رصد نماذج وقنوات سعرية مرسومة تدعم الحركة.'}
${drawingsText ? '\n' + drawingsText : ''}

📈 قراءة وتفسير المؤشرات الفنية المرصودة بالصورة:
${indicatorsText}

هيكل الاتجاه: ${analysisResult.trendStructureAr}
الشموع اليابانية: ${analysisResult.candlestickPatternsAr}
الدعوم والمقاومات: ${analysisResult.supportResistanceLevelsAr}
أحجام التداول والفوليم: ${analysisResult.volumeAndLiquidityInsightAr}
رصد الدايفرجنس: ${analysisResult.divergenceDetectionAr}

🎯 خطة التداول الموصى بها بالأرقام:
- الدخول: ${analysisResult.entryPriceFormatted}
- المستهدف الأول: ${analysisResult.target1Formatted}
- المستهدف الثاني: ${analysisResult.target2Formatted}
- وقف الخسارة: ${analysisResult.stopLossFormatted}
- نسبة العائد للمخاطرة: ${analysisResult.riskRewardRatio}

⚠️ إخلاء مسؤولية: كافة التحليلات الصادرة بالذكاء الاصطناعي هي لأغراض تعليمية واسترشادية فقط ولا تمثل توصية بالبيع أو الشراء. القرار الاستثماري وإدارة المخاطر مسؤولية المستثمر بالكامل.
المصدر: رادار البورصة المصرية EGX`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-hidden font-['Cairo']">
      <div className="relative w-full max-w-4xl h-[92vh] max-h-[880px] bg-[#0b0f17] border border-cyan-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/70 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-indigo-500 p-0.5 shadow-lg shadow-cyan-500/25 shrink-0">
              <div className="w-full h-full bg-[#070a0f] rounded-[14px] flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">
                  المحلل البصري الذكي للشارتات (Chart Vision AI)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                  Gemini 3.8 Flash Vision
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ارفع لقطة شاشة لأي شارت فني، أو الصقها مباشرة (Ctrl+V) لاستخراج النماذج والدعوم والدايفرجنس فوراً
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Upload Zone & Samples */}
          {!imagePreview ? (
            <div className="space-y-4">
              {/* Direct Analysis Shortcut without Image */}
              {onOpenDirectChartAi && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-teal-950/40 to-slate-900 border border-cyan-500/35 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        لا تملك لقطة شاشة للشارت؟
                      </span>
                      <span className="text-[11px] text-slate-300">
                        يمكنك تحليل شارت {stockSymbolInput || 'السهم'} مباشرة بالذكاء الاصطناعي دون إرفاق صور.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDirectChartAi(stockSymbolInput || 'TMGH');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-md shadow-cyan-600/20 self-end sm:self-center"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                    <span>تحليل مباشر بدون صورة ⚡</span>
                  </button>
                </div>
              )}

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-3xl p-8 sm:p-12 text-center bg-slate-950/60 transition-colors flex flex-col items-center justify-center space-y-4 cursor-pointer"
                onClick={() => document.getElementById('chart-file-input')?.click()}
              >
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">
                    اسحب وأفلت صورة الشارت هنا أو اضغط للاختيار
                  </h4>
                  <p className="text-xs text-slate-400">
                    أو اضغط <kbd className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[11px]">Ctrl + V</kbd> للصق لقطة الشاشة مباشرة من الحافظة
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">يدعم PNG, JPG, WebP من TradingView أو تطبيقات التداول</p>
                </div>
                <input
                  id="chart-file-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
              </div>

              {/* Sample Charts to Test with */}
              <div className="space-y-2 pt-2">
                <span className="text-xs text-slate-400 font-bold block">
                  أو جرّب مباشرة باستخدام نماذج شارتات حقيقية من البورصة المصرية:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SAMPLE_CHARTS.map((sc) => (
                    <button
                      key={sc.id}
                      onClick={() => {
                        setImagePreview(sc.dataUrl);
                        setStockSymbolInput(sc.title.includes('TMGH') ? 'TMGH' : 'SWDY');
                        setAnalysisResult(null);
                      }}
                      className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-right transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white group-hover:text-cyan-400">
                          {sc.title}
                        </span>
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-1">{sc.subtitle}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Image Preview & Controls */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-bold">رمز السهم (اختياري):</span>
                    <input
                      type="text"
                      value={stockSymbolInput}
                      onChange={(e) => setStockSymbolInput(e.target.value.toUpperCase())}
                      placeholder="مثل TMGH أو FWRY..."
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setImagePreview(null);
                        setAnalysisResult(null);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 text-xs font-bold transition-colors"
                    >
                      تغيير الصورة
                    </button>

                    <button
                      onClick={handleRunAnalysis}
                      disabled={isAnalyzing}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-cyan-600/25 disabled:opacity-50"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                      <span>{isAnalyzing ? 'جاري التحليل بالذكاء الاصطناعي...' : 'تحليل الشارت الآن'}</span>
                    </button>
                  </div>
                </div>

                {/* The Preview Canvas */}
                <div className="relative rounded-2xl overflow-hidden bg-black/60 border border-slate-800 max-h-72 flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Chart preview"
                    className="max-h-72 object-contain w-auto rounded-xl"
                  />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin" />
                      <span className="text-xs font-bold text-cyan-300 animate-pulse">
                        الذكاء الاصطناعي يقوم بفحص الشموع، خطوط الاتجاه، الدعوم، وأحجام الفوليم...
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Analysis Results View */}
              {analysisResult && (
                <div className="space-y-4">
                  {/* Master Decision Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/60 border border-cyan-500/40 shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">القرار التكتيكي النهائي</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <h4 className="text-xl font-black text-white">
                            {analysisResult.strategicDecisionAr}
                          </h4>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/40">
                            نسبة الثقة: {analysisResult.confidenceScore}%
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleCopyReport}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'تم النسخ' : 'نسخ التقرير الكامل'}</span>
                      </button>
                    </div>

                    {/* Current Stance Opinion Banner (الرأي الحالي لحركة السعر) */}
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/70 via-slate-950 to-teal-950/70 border border-cyan-500/35 flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-cyan-300 text-xs block font-bold mb-0.5">
                          الرأي الفني الحالي الشامل لحركة السعر:
                        </strong>
                        <p className="text-xs text-slate-200 leading-relaxed font-sans">
                          {analysisResult.currentStanceOpinionAr}
                        </p>
                      </div>
                    </div>

                    {/* Trade Plan Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-slate-800/80">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">نقطة الدخول</span>
                        <span className="text-xs font-bold text-white font-mono mt-0.5 block">
                          {analysisResult.entryPriceFormatted}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-emerald-400 block">المستهدف الأول</span>
                        <span className="text-xs font-bold text-emerald-300 font-mono mt-0.5 block">
                          {analysisResult.target1Formatted}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-cyan-400 block">المستهدف الثاني</span>
                        <span className="text-xs font-bold text-cyan-300 font-mono mt-0.5 block">
                          {analysisResult.target2Formatted}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-rose-400 block">وقف الخسارة</span>
                        <span className="text-xs font-bold text-rose-300 font-mono mt-0.5 block">
                          {analysisResult.stopLossFormatted}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-amber-400 block">العائد للمخاطرة</span>
                        <span className="text-xs font-bold text-amber-300 font-mono mt-0.5 block">
                          {analysisResult.riskRewardRatio}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Automated Drawings & Geometry Breakdown Section (تحليل الرسم الآلي والأنماط الهندسية) */}
                  {analysisResult.detectedDrawingsList && analysisResult.detectedDrawingsList.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/40 shadow-xl space-y-3.5">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                          <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                            <PenTool className="w-4 h-4 text-cyan-400" />
                            <span>تحليل الرسم الآلي والأنماط الهندسية المرصودة على الشارت:</span>
                          </h4>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-cyan-300 px-2.5 py-0.5 rounded-lg bg-cyan-950 border border-cyan-500/40">
                          {analysisResult.detectedDrawingsList.length} رسومات ونماذج آلية 📐
                        </span>
                      </div>

                      {/* Synthesis narrative for automated drawings */}
                      {analysisResult.automatedDrawingsAnalysisAr && (
                        <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/25 flex items-start gap-2.5">
                          <Sparkles className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[11px] font-bold text-cyan-300 block mb-0.5">
                              الخلاصة الفنية للرسم الآلي وهندسة الشارت:
                            </span>
                            <p className="text-xs text-slate-200 leading-relaxed font-sans">
                              {analysisResult.automatedDrawingsAnalysisAr}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Individual Drawings Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {analysisResult.detectedDrawingsList.map((drawing, i) => (
                          <div
                            key={i}
                            className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-2 shadow-sm"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                                <span>{drawing.name}</span>
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md font-sans bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                                {drawing.type}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-0.5">
                              <span className="text-[11px] font-mono font-bold text-slate-300">
                                الحالة المرصودة:
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-sans ${
                                  drawing.status.includes('مخترق') ||
                                  drawing.status.includes('صاعد') ||
                                  drawing.status.includes('مرتد') ||
                                  drawing.status.includes('مكتمل')
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : drawing.status.includes('مكسور')
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                }`}
                              >
                                {drawing.status}
                              </span>
                            </div>

                            <div className="text-[11px] font-sans text-cyan-200 bg-slate-950/80 p-2 rounded-lg border border-slate-800 leading-relaxed">
                              <strong className="text-slate-400 font-bold ml-1">الموقع والتفاصيل:</strong>
                              {drawing.details}
                            </div>

                            <p className="text-[11px] text-slate-300 leading-relaxed font-sans pt-0.5">
                              <strong className="text-emerald-400 font-bold ml-1">الأثر الفني المباشر:</strong>
                              {drawing.technicalImplication}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Individual Indicators Breakdown Section (رأي أي مؤشرات تظهر في الصورة) */}
                  {analysisResult.visibleIndicatorsList && analysisResult.visibleIndicatorsList.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 shadow-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                          <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                            <Zap className="w-4 h-4 text-emerald-400" />
                            <span>المؤشرات الفنية المرصودة في الصورة ورأي المحلل لكل مؤشر:</span>
                          </h4>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-emerald-300 px-2 py-0.5 rounded-lg bg-emerald-950 border border-emerald-500/40">
                          {analysisResult.visibleIndicatorsList.length} مؤشرات مرصودة 👁️
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {analysisResult.visibleIndicatorsList.map((ind, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-white text-xs flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                <span>{ind.name}</span>
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-sans ${
                                  ind.signal.includes('صاعد')
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : ind.signal.includes('هابط')
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                    : ind.signal.includes('تشبع')
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}
                              >
                                {ind.signal}
                              </span>
                            </div>

                            <div className="text-[11px] font-mono text-cyan-300 bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
                              <span className="text-slate-400 font-sans ml-1 text-[10px]">القراءة المرصودة:</span>
                              {ind.reading}
                            </div>

                            <p className="text-[11px] text-slate-300 leading-relaxed font-sans pt-0.5">
                              <strong className="text-slate-400 font-bold ml-1">الرأي والتفسير:</strong>
                              {ind.opinion}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 6 Diagnostic Pillar Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-1.5">
                      <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                        <TrendingUp className="w-4 h-4" />
                        <span>هيكل الاتجاه (Trend & Price Action)</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        {analysisResult.trendStructureAr}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-1.5">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                        <Layers className="w-4 h-4" />
                        <span>الشموع اليابانية المرصودة (Candlestick Patterns)</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        {analysisResult.candlestickPatternsAr}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-1.5">
                      <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                        <Target className="w-4 h-4" />
                        <span>مستويات الدعم والمقاومة (Support & Resistance)</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        {analysisResult.supportResistanceLevelsAr}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-1.5">
                      <div className="flex items-center gap-2 text-teal-400 font-bold text-xs">
                        <BarChart2 className="w-4 h-4" />
                        <span>أحجام التداول والسيولة (Volume Profile)</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        {analysisResult.volumeAndLiquidityInsightAr}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-1.5">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                        <Zap className="w-4 h-4" />
                        <span>المؤشرات الفنية المقروءة (RSI, MACD, etc)</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        {analysisResult.visibleIndicatorsAnalysisAr}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-1.5">
                      <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                        <ShieldAlert className="w-4 h-4" />
                        <span>راصد الدايفرجنس (Divergence Detection)</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        {analysisResult.divergenceDetectionAr}
                      </p>
                    </div>
                  </div>

                  {/* Detailed Narrative */}
                  {analysisResult.fullNarrativeAr && (
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        التقرير السردي المفصل للمحلل المعتمد
                      </span>
                      <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                        {analysisResult.fullNarrativeAr}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
