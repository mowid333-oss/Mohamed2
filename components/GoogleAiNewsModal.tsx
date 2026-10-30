import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Bot,
  Search,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Globe,
  Newspaper,
  FileText,
  DollarSign,
  AlertTriangle,
  Flame,
  CheckCircle2,
  ChevronDown,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { EGXStock } from '../types/stock';
import {
  analyzeStockWithGoogleSearch,
  GoogleAiAnalysisResult,
  StockNewsItem,
} from '../services/googleSearchAiAnalystService';
import { TradingViewRatingWidget } from './TradingViewRatingWidget';
import { verifyAndSyncReportPrice } from '../utils/priceVerificationService';
import { CopyableStockSymbol } from './CopyableStockSymbol';
import { useReportLock } from '../hooks/useReportLock';
import { ReportStabilityLockBar } from './ReportStabilityLockBar';

interface GoogleAiNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: EGXStock[];
  initialSymbol?: string;
  onSelectStockForChart?: (symbol: string) => void;
  onOpenTradeManagement?: (symbol: string) => void;
}

export const GoogleAiNewsModal: React.FC<GoogleAiNewsModalProps> = ({
  isOpen,
  onClose,
  stocks,
  initialSymbol,
  onSelectStockForChart,
  onOpenTradeManagement,
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(
    initialSymbol || (stocks[0]?.symbol ?? 'TMGH')
  );
  const [customSearchQuery, setCustomSearchQuery] = useState('');
  const [activeQueryTitle, setActiveQueryTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<GoogleAiAnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);

  // 180-second state-based lock
  const lockState = useReportLock('google_ai_news', selectedSymbol || 'GLOBAL', 180);

  // Stock dropdown search
  const [isStockDropdownOpen, setIsStockDropdownOpen] = useState(false);
  const [stockFilterText, setStockFilterText] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync initial symbol
  useEffect(() => {
    if (initialSymbol) {
      setSelectedSymbol(initialSymbol);
    }
  }, [initialSymbol]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsStockDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const currentStock = useMemo(() => {
    const raw =
      stocks.find((s) => s.symbol.toUpperCase() === selectedSymbol.toUpperCase()) ||
      stocks[0] ||
      ({
        symbol: 'TMGH',
        nameAr: 'طلعت مصطفى',
        price: 60.0,
        changePct: 1.5,
        isShariahCompliant: true,
      } as EGXStock);

    const verified = verifyAndSyncReportPrice(raw, stocks);
    return verified.verifiedStock;
  }, [stocks, selectedSymbol]);

  // Filter stocks
  const filteredStocks = useMemo(() => {
    if (!stockFilterText.trim()) return stocks.slice(0, 35);
    const q = stockFilterText.toLowerCase().trim();
    return stocks
      .filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.nameAr.toLowerCase().includes(q) ||
          (s.nameEn && s.nameEn.toLowerCase().includes(q))
      )
      .slice(0, 40);
  }, [stocks, stockFilterText]);

  // Execute Search
  const runAnalysis = async (queryText?: string) => {
    const targetQuery = queryText || customSearchQuery.trim() || `${currentStock.nameAr} (${currentStock.symbol})`;
    setActiveQueryTitle(targetQuery);
    setIsLoading(true);

    try {
      const res = await analyzeStockWithGoogleSearch(targetQuery, currentStock);
      setAnalysisResult(res);
    } catch (e) {
      console.error('Error in Google AI Search analysis:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Run initial analysis when modal opens or selected stock changes (stable for 180s)
  useEffect(() => {
    if (!isOpen) return;
    if (lockState.isLocked && analysisResult) {
      return;
    }
    runAnalysis(`${currentStock.nameAr} (${currentStock.symbol})`);
  }, [isOpen, selectedSymbol, lockState.refreshNonce]);

  const handleCopyReport = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult.fullReportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-hidden font-['Cairo']">
      <div className="relative w-full max-w-5xl h-[94vh] max-h-[890px] bg-[#0b0f17] border border-teal-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-[#0a1b18] to-teal-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-cyan-400 p-0.5 shadow-lg shadow-teal-500/25 shrink-0">
              <div className="w-full h-full bg-[#070a0f] rounded-[14px] flex items-center justify-center">
                <Globe className="w-6 h-6 text-teal-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  أخبار وإفصاحات السهم بالمصادر المعتمدة • رصد لحظي
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 font-mono flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  مصادر رسمية موثقة + Google
                </span>
              </div>
              <p className="text-xs text-slate-400">
                رصد مباشر لجميع إفصاحات البورصة المصرية وأخبار ومحفزات وتوزيعات السهم مع روابط المصادر الرسمية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ReportStabilityLockBar
              lockState={lockState}
              reportTitle={currentStock.nameAr}
              isRefreshing={isLoading}
              compact={true}
            />
            <button
              onClick={handleCopyReport}
              disabled={!analysisResult}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-500/30'
              }`}
              title="نسخ تقرير الأخبار والتحليل"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>تم نسخ التقرير ✅</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-teal-400" />
                  <span>نسخ التقرير 📋</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stock Selector & Custom Search Query Bar */}
        <div className="p-3.5 bg-slate-900/95 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs shrink-0">
          {/* Stock Searchable Combobox */}
          <div className="relative w-full md:w-80" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsStockDropdownOpen(!isStockDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 hover:border-teal-400 text-slate-200 font-bold transition-colors"
            >
              <div className="flex items-center gap-2">
                <CopyableStockSymbol symbol={currentStock.symbol} size="sm" />
                <span className="truncate max-w-[150px]">{currentStock.nameAr}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {isStockDropdownOpen && (
              <div className="absolute top-full mt-1 right-0 left-0 bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 space-y-1 max-h-64 overflow-y-auto">
                <input
                  type="text"
                  value={stockFilterText}
                  onChange={(e) => setStockFilterText(e.target.value)}
                  placeholder="ابحث بالاسم أو الرمز (مثل SIPC, سبأ)..."
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-teal-400 mb-1"
                  autoFocus
                />
                {filteredStocks.map((stk) => (
                  <button
                    key={stk.symbol}
                    onClick={() => {
                      setSelectedSymbol(stk.symbol);
                      setIsStockDropdownOpen(false);
                      setStockFilterText('');
                    }}
                    className={`w-full text-right p-2 rounded-xl flex items-center justify-between text-xs transition-colors ${
                      stk.symbol === currentStock.symbol
                        ? 'bg-teal-950/60 text-teal-300 border border-teal-500/40'
                        : 'hover:bg-slate-900 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{stk.symbol}</span>
                      <span className="truncate max-w-[160px]">{stk.nameAr}</span>
                    </div>
                    <span className="font-mono text-slate-300 font-bold">{stk.price.toFixed(2)} ج.م</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom Search Input */}
          <div className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={customSearchQuery}
                onChange={(e) => setCustomSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') runAnalysis();
                }}
                placeholder={`ابحث عن أخبار أو إفصاحات أو موضوع عام (مثال: أرباح ${currentStock.symbol} أو EGX30 أو الفائدة)...`}
                className="w-full pr-8 pl-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-teal-400"
              />
            </div>
            <button
              onClick={() => runAnalysis()}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              <span>بحث وتحليل</span>
            </button>
          </div>
        </div>

        {/* Quick Query Shortcuts Ribbon */}
        <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs shrink-0">
          <span className="text-slate-400 font-bold whitespace-nowrap text-[11px]">رصد سريع:</span>
          <button
            onClick={() => runAnalysis(`أحدث أخبار وإفصاحات سهم ${currentStock.nameAr} (${currentStock.symbol}) اليوم`)}
            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-500/30 whitespace-nowrap font-bold text-[11px] transition-colors"
          >
            📰 أخبار وإفصاحات السهم
          </button>
          <button
            onClick={() => runAnalysis(`توزيعات الأرباح والكوبونات المعلنة لشركة ${currentStock.nameAr} (${currentStock.symbol})`)}
            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 whitespace-nowrap font-bold text-[11px] transition-colors"
          >
            💰 توزيعات الأرباح والكوبونات
          </button>
          <button
            onClick={() => runAnalysis(`نتائج أعمال وقوائم مالية لشركة ${currentStock.nameAr} (${currentStock.symbol})`)}
            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 whitespace-nowrap font-bold text-[11px] transition-colors"
          >
            📊 نتائج الأعمال والقوائم
          </button>
          <button
            onClick={() => runAnalysis(`أخبار البورصة المصرية ومؤشر EGX30 وقرارات البنك المركزي الأخيرة`)}
            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 whitespace-nowrap font-bold text-[11px] transition-colors"
          >
            🏛️ أخبار المؤشر العام EGX30
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* 180s Stability Lock Bar with Progress Bar & Instant Refresh */}
          <ReportStabilityLockBar
            lockState={lockState}
            reportTitle={`أخبار وتحليل AI: ${currentStock.nameAr} (${currentStock.symbol})`}
            isRefreshing={isLoading}
          />

          {isLoading ? (
            <div className="text-center py-20 space-y-3">
              <Globe className="w-10 h-10 text-teal-400 animate-spin mx-auto" />
              <div className="text-base font-bold text-white">
                محلل AI يبحث في محركات بحث Google والمنصات المالية الرسمية...
              </div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                جاري مسح إفصاحات البورصة المصرية ومباشر وإنفستنج لتحليل أحدث الأخبار ومعنويات المستثمرين.
              </p>
            </div>
          ) : analysisResult ? (
            <div className="space-y-5">
              {/* Top Sentiment & Executive Highlight Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-[#0a1815] to-teal-950/70 border border-teal-500/40 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-teal-500/20 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        {activeQueryTitle ? (
                          <span className="text-sm sm:text-base font-black text-white">{activeQueryTitle}</span>
                        ) : (
                          <>
                            <CopyableStockSymbol symbol={currentStock.symbol} size="sm" />
                            <span className="text-sm sm:text-base font-black text-white">{currentStock.nameAr}</span>
                          </>
                        )}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        رصد مباشر
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      تحليل معنويات الأخبار والإفصاحات اللحظية
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 block font-bold">معنويات الأخبار (Sentiment)</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">
                        {analysisResult.overallSentimentAr} ({analysisResult.newsSentimentScore}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                  {analysisResult.breakingNewsSummaryAr}
                </div>

                <div className="p-3 rounded-2xl bg-teal-950/40 border border-teal-500/30 text-xs text-teal-200 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>التوصية التنفيذية: {analysisResult.executiveRecommendationAr}</span>
                </div>
              </div>

              {/* Grid: Corporate Disclosures vs Catalysts/Risks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Disclosures & Dividends */}
                <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>الإفصاحات وتوزيعات الأرباح والكوبونات</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {analysisResult.corporateDisclosuresAr}
                  </p>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                    💡 <span className="font-semibold">{analysisResult.dividendsAndEarningsInsightAr}</span>
                  </div>
                </div>

                {/* Catalysts & Risks */}
                <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>المحفزات الصاعدة والمخاطر</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-emerald-300">المحفزات الصاعدة:</div>
                    {analysisResult.catalystsAndRisksAr.catalysts.map((c, i) => (
                      <div key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                        <span className="text-emerald-400 shrink-0 mt-0.5">✔</span>
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-slate-800">
                    <div className="text-[11px] font-bold text-rose-300">المخاطر المحتملة:</div>
                    {analysisResult.catalystsAndRisksAr.risks.map((r, i) => (
                      <div key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                        <span className="text-rose-400 shrink-0 mt-0.5">✖</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* News Feed Stream */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-teal-400" />
                    <h4 className="text-sm font-bold text-white">شريط الأخبار الموثقة والإفصاحات الرسمية</h4>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {analysisResult.newsItems.length} أخبار مرصودة
                  </span>
                </div>

                <div className="space-y-2.5">
                  {analysisResult.newsItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-teal-500/40 transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white hover:text-teal-300 transition-colors">
                          {item.title}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                              item.sentiment === 'BULLISH'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : item.sentiment === 'BEARISH'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {item.sentimentLabelAr}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.publishedAt}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{item.snippet}</p>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                        <span className="text-slate-400 font-medium">{item.source}</span>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-400 hover:text-teal-300 flex items-center gap-1 font-bold"
                          >
                            <span>فتح المصدر</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Official TradingView Technical Chart Opinion & Speedometer Gauge */}
              <TradingViewRatingWidget
                stock={currentStock}
                timeframeLabel="يومي (1D)"
                variant="COMPACT_BANNER"
              />

              {/* Dedicated Chart Technical Breakdown Card (User requirement: examine chart & provide opinion) */}
              {analysisResult.chartVerdict && (
                <div className="p-4 rounded-3xl bg-[#08101a] border border-teal-500/40 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-teal-500/20 pb-2.5 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
                        📊
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-teal-200">
                          القراءة الفنية المباشرة لشارت السهم والسلوك السعري (Chart Action)
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          فحص حركة الشموع اليابانية، الدعوم والمقاومات، ورأي المحلل في الشارت
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-slate-400">توقيت بيانات الشارت:</span>
                      <span className="text-teal-300 font-bold">{analysisResult.liveChartTimestamp}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        متأخر 15 دقيقة للدقة
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400">حركة الشموع اليابانية (Candlesticks):</span>
                      <p className="text-white font-medium leading-relaxed">
                        {analysisResult.chartVerdict.candlestickPatternAr}
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400">مستويات الشارت المرئية:</span>
                      <p className="text-slate-200 font-medium leading-relaxed">
                        دعم الشارت: <span className="font-mono text-emerald-400 font-bold">{analysisResult.chartVerdict.chartSupportLevel} ج.م</span> | 
                        مقاومة الشارت: <span className="font-mono text-rose-400 font-bold">{analysisResult.chartVerdict.chartResistanceLevel} ج.م</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-teal-950/30 border border-teal-500/30 text-xs text-teal-100 leading-relaxed font-medium">
                    <span className="font-bold text-teal-300 ml-1">💡 رأي المحلل الصريح في الشارت:</span>
                    {analysisResult.chartVerdict.chartTechnicalOpinionAr}
                  </div>
                </div>
              )}

              {/* Direct Search Sources Links */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                <span className="font-bold text-slate-300 block">روابط الرصد والمتابعة المباشرة:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {analysisResult.searchSources.map((src, i) => (
                    <a
                      key={i}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <span>{src.title}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Disclaimer and 15-minute notice banner */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1.5 leading-relaxed">
                <div className="text-amber-300/90 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{analysisResult.delayNoticeAr}</span>
                </div>
                <p className="text-slate-400 border-t border-slate-800/80 pt-1.5">
                  {analysisResult.disclaimerAr}
                </p>
              </div>

              {/* Bottom Quick Action Link to Chart & Trade Management */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                {onSelectStockForChart && (
                  <button
                    onClick={() => {
                      onSelectStockForChart(currentStock.symbol);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <span>عرض الشارت اللحظي</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {onOpenTradeManagement && (
                  <button
                    onClick={() => {
                      onOpenTradeManagement(currentStock.symbol);
                      onClose();
                    }}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                  >
                    <span>إدارة صفقة السهم 🎯</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Permanent Bottom Free-Form Question Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (customSearchQuery.trim()) {
              runAnalysis(customSearchQuery);
            }
          }}
          className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2 shrink-0"
        >
          <div className="hidden sm:flex items-center gap-1.5 text-teal-400 text-xs font-bold shrink-0">
            <Globe className="w-4 h-4" />
            <span>سؤال حر:</span>
          </div>
          <input
            type="text"
            value={customSearchQuery}
            onChange={(e) => setCustomSearchQuery(e.target.value)}
            placeholder={`اسأل عن أي خبر أو إفصاح مالي أو شائعة أو توزيعات تخص ${currentStock.nameAr} (${currentStock.symbol})...`}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
          />
          <button
            type="submit"
            disabled={!customSearchQuery.trim() || isLoading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
          >
            <span>استفسار</span>
            <Search className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
