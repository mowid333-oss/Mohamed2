import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Bot,
  Sparkles,
  Zap,
  TrendingUp,
  TrendingDown,
  Target,
  ShieldAlert,
  Copy,
  Check,
  Send,
  HelpCircle,
  Clock,
  Layers,
  ArrowRight,
  Maximize2,
  FileText,
  Activity,
  Droplets,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { EGXStock, TradingTimeframe, TRADING_TIMEFRAMES } from '../types/stock';
import {
  analyzeTradingViewChartDirectly,
  askChartFreeFormQuestion,
  DirectChartAiAnalysis,
  ChartChatMessage,
} from '../services/directChartAiService';
import { verifyAndSyncReportPrice } from '../utils/priceVerificationService';

import { useReportLock } from '../hooks/useReportLock';
import { ReportStabilityLockBar } from './ReportStabilityLockBar';

interface DirectChartAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: EGXStock;
  onOpenTradeManagement?: (symbol: string) => void;
  onOpenDetailedReport?: (stock: EGXStock) => void;
}

const QUICK_QUESTIONS = [
  'هل السعر الحالي مناسب للشراء والدخول؟',
  'أين أضع وقف الخسارة الدقيق لحماية رأس المال؟',
  'ما هو الهدف القادم في حال استمرار الصعود؟',
  'ماذا يعكس حجم التداول وموقف صانع السوق اليوم؟',
];

interface CachedDirectAnalysis {
  analysis: DirectChartAiAnalysis;
  timestamp: number;
}

const directAnalysisMemoryCache = new Map<string, CachedDirectAnalysis>();

export const DirectChartAnalysisModal: React.FC<DirectChartAnalysisModalProps> = ({
  isOpen,
  onClose,
  stock: rawStock,
  onOpenTradeManagement,
  onOpenDetailedReport,
}) => {
  const stock = useMemo(() => {
    return verifyAndSyncReportPrice(rawStock).verifiedStock;
  }, [rawStock]);

  const [selectedTimeframe, setSelectedTimeframe] = useState<TradingTimeframe>('1D');
  const [analysis, setAnalysis] = useState<DirectChartAiAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // 180-second state-based lock
  const lockState = useReportLock('direct_chart_ai', stock?.symbol || 'GLOBAL', 180);

  // Free-form Q&A state
  const [userQuery, setUserQuery] = useState<string>('');
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChartChatMessage[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Load direct analysis when stock or timeframe changes (guaranteed stable for minimum 3 minutes / 180s)
  useEffect(() => {
    if (!isOpen || !stock?.symbol) return;

    let isMounted = true;
    const cleanSym = stock.symbol.toUpperCase();
    const cacheKey = cleanSym + "_" + selectedTimeframe;
    const cached = directAnalysisMemoryCache.get(cacheKey);
    const now = Date.now();

    // If cache exists and lock is active, reuse analysis without re-fetching
    if (cached && lockState.isLocked) {
      setAnalysis(cached.analysis);
      setIsLoading(false);
      return;
    }

    async function fetchAnalysis() {
      setIsLoading(true);
      try {
        const tfMeta = TRADING_TIMEFRAMES.find((t) => t.code === selectedTimeframe);
        const res = await analyzeTradingViewChartDirectly(stock, tfMeta?.labelAr || 'يومي (1D)');
        if (isMounted) {
          setAnalysis(res);
          directAnalysisMemoryCache.set(cacheKey, { analysis: res, timestamp: Date.now() });
        }
      } catch (err) {
        console.error('Error analyzing chart directly:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchAnalysis();

    return () => {
      isMounted = false;
    };
  }, [isOpen, stock?.symbol, selectedTimeframe, lockState.refreshNonce]);

  // Scroll to bottom of chat when new message arrives
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isAsking]);

  if (!isOpen || !stock) return null;

  const handleCopy = () => {
    if (!analysis) return;
    const fullText = `🤖 تقرير تحليل شارت TradingView المباشر بالذكاء الاصطناعي
السهم: ${stock.nameAr} (${stock.symbol})
السعر: ${stock.price.toFixed(2)} ج.م (${stock.changePct >= 0 ? '+' : ''}${stock.changePct}%)
الفريم: ${analysis.timeframe}
التقييم الفني: ${analysis.verdictRating} (${analysis.consensusScore}%)
نطاق الدخول: ${analysis.entryZone}
المستهدفات: 1: ${analysis.target1} | 2: ${analysis.target2} | 3: ${analysis.target3}
وقف الخسارة: ${analysis.stopLoss}

${analysis.analysisText}`;

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendQuestion = async (customText?: string) => {
    const textToSend = customText || userQuery.trim();
    if (!textToSend || !analysis || isAsking) return;

    setUserQuery('');
    const userMsg: ChartChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'USER',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsAsking(true);

    try {
      const reply = await askChartFreeFormQuestion(stock, analysis, textToSend, chatMessages);
      const aiMsg: ChartChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'AI',
        text: reply,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      console.error('Error getting reply:', e);
    } finally {
      setIsAsking(false);
    }
  };

  const isPos = stock.changePct >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-hidden font-['Cairo']">
      <div className="relative w-full max-w-5xl h-[94vh] max-h-[890px] bg-[#090d16] border border-cyan-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-[#061824] to-cyan-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/25 shrink-0">
              <div className="w-full h-full bg-[#070a0f] rounded-[14px] flex items-center justify-center">
                <Bot className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  تحليل شارت TradingView المباشر بالذكاء الاصطناعي 🤖
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  مباشر بدون رفع صورة
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                قراءة فورية لحركة السعر والمؤشرات وكتل أوامر صانع السوق (SMC & Wyckoff) لـ{' '}
                <strong className="text-white">{stock.nameAr} ({stock.symbol})</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!analysis || isLoading}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              title="نسخ نص التحليل بالكامل"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'تم النسخ!' : 'نسخ التقرير'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/40 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stock HUD & Timeframe Switcher Strip */}
        <div className="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-xs font-black text-white bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg">
              {stock.symbol}
            </span>
            <span className="font-bold text-white text-sm">{stock.nameAr}</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-slate-400">السعر:</span>
              <strong className="text-white text-sm font-bold">{stock.price.toFixed(2)} ج.م</strong>
              <span
                className={`px-1.5 py-0.2 rounded font-bold text-[11px] ${
                  isPos ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                }`}
              >
                {isPos ? '+' : ''}{stock.changePct}%
              </span>
            </div>
          </div>

          {/* Timeframe Selector Buttons */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
            <span className="text-slate-400 px-1 font-bold">الفريم:</span>
            {TRADING_TIMEFRAMES.slice(0, 6).map((tf) => (
              <button
                key={tf.code}
                onClick={() => setSelectedTimeframe(tf.code)}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                  selectedTimeframe === tf.code
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf.badgeAr}
              </button>
            ))}
          </div>

          {/* 3-Minute Stability & Manual Refresh HUD (Requested by User) */}
          <ReportStabilityLockBar
            lockState={lockState}
            reportTitle={`${stock.nameAr} - ${selectedTimeframe}`}
            isRefreshing={isLoading}
            compact={true}
          />
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
          {/* Full Stability Lock Bar with 180s Progress Bar & Countdown */}
          <ReportStabilityLockBar
            lockState={lockState}
            reportTitle={`تحليل مباشر: ${stock.nameAr} (${stock.symbol})`}
            isRefreshing={isLoading}
          />

          {isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-3 text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center animate-pulse">
                  <Bot className="w-8 h-8 text-cyan-400" />
                </div>
                <Sparkles className="w-5 h-5 text-emerald-400 absolute -top-1 -right-1 animate-spin" />
              </div>
              <h4 className="text-base font-bold text-white">جارٍ قراءة وتحليل شارت TradingView المباشر...</h4>
              <p className="text-xs text-slate-400 max-w-md">
                فحص فني متعدد الطبقات يشمل المتوسطات، المذبذبات، كتل أوامر صانع السوق SMC، ومستويات الدخول والأهداف بدقة.
              </p>
            </div>
          ) : analysis ? (
            <>
              {/* Verdict Summary Ribbon */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-cyan-950/40 to-slate-950 border border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-bold">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-bold">التقييم الفني لشارت TradingView:</span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-xs">
                        {analysis.verdictRating}
                      </span>
                      <span className="font-mono text-cyan-300 font-bold text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                        قوة الشارت: {analysis.consensusScore}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 font-mono">
                      {analysis.volumeStatus}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  {onOpenTradeManagement && (
                    <button
                      onClick={() => onOpenTradeManagement(stock.symbol)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Target className="w-3.5 h-3.5" />
                      <span>إدارة الصفقة 🎯</span>
                    </button>
                  )}
                  {onOpenDetailedReport && (
                    <button
                      onClick={() => onOpenDetailedReport(stock)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>تقرير 360°</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Four Core Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Entry Zone */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mb-1.5">
                    <Target className="w-4 h-4 text-cyan-400" />
                    <span>نطاق الدخول والتجميع:</span>
                  </div>
                  <div className="font-mono text-sm font-bold text-cyan-300">
                    {analysis.entryZone}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">تجميع هادئ على دفعتين</span>
                </div>

                {/* Targets */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mb-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>المستهدفات المقترحة:</span>
                  </div>
                  <div className="font-mono text-xs text-emerald-300 space-y-0.5">
                    <div>1️⃣ {analysis.target1}</div>
                    <div>2️⃣ {analysis.target2}</div>
                  </div>
                </div>

                {/* Stop Loss */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mb-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>وقف الخسارة الصارم:</span>
                  </div>
                  <div className="font-mono text-sm font-bold text-rose-300">
                    {analysis.stopLoss}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">إغلاق شمعة فريم {analysis.timeframe}</span>
                </div>

                {/* Order Block / SMC */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mb-1.5">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>كتل أوامر صانع السوق:</span>
                  </div>
                  <div className="font-mono text-xs font-bold text-amber-300">
                    {analysis.smcSummary.orderBlockZone}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">مرحلة: {analysis.wyckoffSummary.phase}</span>
                </div>
              </div>

              {/* Comprehensive Direct AI Analysis Text */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 text-slate-200 text-xs leading-relaxed space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>التقرير الفني الموسع والمفصل لشارت TradingView</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    توقيت التحليل: {analysis.timestamp}
                  </span>
                </div>

                <div className="whitespace-pre-line leading-relaxed text-slate-300 space-y-2">
                  {analysis.analysisText}
                </div>
              </div>

              {/* Dedicated Universal Free-Form Questions Section */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-[#0a121e] to-[#080d15] border border-cyan-500/30 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                        <span>خانة الأسئلة الحرة والاستفسارات المفتوحة</span>
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          محادثة حية
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        اكتب أي سؤال حر يدور ببالك عن هذا الشارت أو الصفقة وسيجيبك المستشار فوراً بالأرقام والمستويات:
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Suggestion Pills */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-slate-400 font-bold">أسئلة سريعة:</span>
                  {QUICK_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendQuestion(q)}
                      disabled={isAsking}
                      className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-cyan-950/60 text-slate-300 hover:text-cyan-200 border border-slate-800 hover:border-cyan-500/40 text-[11px] font-medium transition-all cursor-pointer disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {/* Chat conversation history */}
                {chatMessages.length > 0 && (
                  <div
                    ref={chatScrollRef}
                    className="max-h-60 overflow-y-auto space-y-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 custom-scrollbar"
                  >
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${msg.sender === 'USER' ? 'items-start' : 'items-end'}`}
                      >
                        <div
                          className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                            msg.sender === 'USER'
                              ? 'bg-cyan-950/70 text-cyan-100 border border-cyan-500/40 rounded-tr-none'
                              : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none whitespace-pre-line'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 mb-1 border-b border-white/5 pb-0.5">
                            <span className="font-bold flex items-center gap-1">
                              {msg.sender === 'USER' ? 'أنت' : 'المستشار الفني 🤖'}
                            </span>
                            <span className="font-mono">{msg.timestamp}</span>
                          </div>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isAsking && (
                      <div className="flex items-center gap-2 text-cyan-400 text-xs p-2 animate-pulse">
                        <Bot className="w-4 h-4 animate-spin" />
                        <span>جارٍ التفكير والإجابة عن استفسارك الفني...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Text input form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendQuestion();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="اكتب استفسارك المفتوح هنا (مثال: هل أبيع عند المقاومة الأولى؟ أو أين أقوى دعم؟)..."
                    disabled={isAsking}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white placeholder-slate-500 text-xs outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!userQuery.trim() || isAsking}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/20 disabled:opacity-50 transition-all cursor-pointer shrink-0"
                  >
                    <span>إرسال</span>
                    <Send className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </form>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
