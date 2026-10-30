import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  X,
  Minus,
  Maximize2,
  Bot,
  Send,
  Sparkles,
  Search,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Target,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { EGXStock } from '../types/stock';
import { askStockFreeChat, StockChatMessage } from '../services/freeStockChatService';

interface AiStockChatDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  stocks: EGXStock[];
  currentStock?: EGXStock | null;
  onSelectStock: (symbol: string) => void;
  hideLauncherButton?: boolean;
}

const QUICK_PROMPTS = [
  'ما رأيك الفني في حركة السهم اليوم؟',
  'أين أفضل نقطة للشراء والدخول؟',
  'ما هي المستهدفات ووقف الخسارة الصارم؟',
  'ماذا يعكس حجم التداول وموقف صانع السوق؟',
  'ما هو الموقف الشرعي ونسب الديون؟',
];

export const AiStockChatDrawer: React.FC<AiStockChatDrawerProps> = ({
  isOpen,
  onToggle,
  stocks,
  currentStock,
  onSelectStock,
  hideLauncherButton,
}) => {
  const effectiveStock = currentStock || stocks[0] || null;

  const [messages, setMessages] = useState<StockChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Stock selector dropdown state
  const [isStockDropdownOpen, setIsStockDropdownOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initialize or greet when effectiveStock changes
  useEffect(() => {
    if (!effectiveStock) return;
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-' + Date.now(),
          sender: 'AI',
          text: `أهلاً بك! أنا المستشار الذكي المباشر لأسهم البورصة المصرية EGX.
السهم المختار حالياً هو: **${effectiveStock.nameAr} (${effectiveStock.symbol})** بسعر **${effectiveStock.price.toFixed(2)} ج.م** (${effectiveStock.changePct >= 0 ? '+' : ''}${effectiveStock.changePct}%).
يمكنك طرح أي استفسار حر يدور ببالك عن الشارت، الدعوم والمقاومات، أحجام التداول، أو التوافق الشرعي وسأجيبك فوراً!`,
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          stockSymbol: effectiveStock.symbol,
        },
      ]);
    }
  }, [effectiveStock?.symbol]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsStockDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, isOpen]);

  // Filter stocks for the quick switcher
  const filteredStocks = useMemo(() => {
    if (!searchFilter.trim()) return stocks.slice(0, 30);
    const q = searchFilter.toLowerCase().trim();
    return stocks
      .filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.nameAr.toLowerCase().includes(q) ||
          (s.nameEn && s.nameEn.toLowerCase().includes(q))
      )
      .slice(0, 35);
  }, [stocks, searchFilter]);

  const handleSend = async (customPrompt?: string) => {
    const queryToSend = customPrompt || inputText.trim();
    if (!queryToSend || isThinking) return;

    setInputText('');

    // Check if the user mentioned another stock in the database
    const lowerQuery = queryToSend.toLowerCase();
    const mentioned = stocks.find((s) => {
      const sym = s.symbol.toLowerCase();
      const arName = s.nameAr.toLowerCase();
      return lowerQuery.includes(sym) || (arName.length > 3 && lowerQuery.includes(arName));
    });

    const targetStock = mentioned || effectiveStock;

    // If a different stock was mentioned, automatically switch to it
    if (mentioned && mentioned.symbol !== effectiveStock.symbol) {
      onSelectStock(mentioned.symbol);
    }

    const userMsg: StockChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'USER',
      text: queryToSend,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      stockSymbol: targetStock.symbol,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const response = await askStockFreeChat(targetStock, queryToSend, messages);
      const aiMsg: StockChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'AI',
        text: response,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        stockSymbol: targetStock.symbol,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      console.error('Error in free stock chat:', e);
    } finally {
      setIsThinking(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!effectiveStock) return null;

  const isPos = effectiveStock.changePct >= 0;

  return (
    <>
      {/* 1. Floating Launcher Button (Visible when Drawer is Closed and not managed externally) */}
      {!isOpen && !hideLauncherButton && (
        <button
          onClick={onToggle}
          className="fixed bottom-5 left-5 z-40 group flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-slate-950 via-cyan-950 to-slate-950 text-white border border-cyan-500/50 shadow-2xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all font-['Cairo'] cursor-pointer"
          title="افتح شريط المحادثة المباشر للاستفسارات الحرة عن الأسهم بالذكاء الاصطناعي"
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <MessageSquare className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <span>استفسار حر AI 💬</span>
              <span className="font-mono text-cyan-300 bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-500/40 text-[10px]">
                {effectiveStock.symbol}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <span>{effectiveStock.price.toFixed(2)} ج.م</span>
              <span className={isPos ? 'text-emerald-400' : 'text-rose-400'}>
                ({isPos ? '+' : ''}{effectiveStock.changePct}%)
              </span>
            </div>
          </div>
        </button>
      )}

      {/* 2. Floating Collapsible Chat Drawer (When Open) */}
      {isOpen && (
        <div className="fixed bottom-0 left-0 sm:bottom-5 sm:left-5 z-50 w-full sm:w-[420px] h-[590px] max-h-[92vh] bg-[#090e17]/95 backdrop-blur-xl border border-cyan-500/40 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden font-['Cairo'] animate-fadeIn">
          
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-slate-950 via-[#081824] to-cyan-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center shadow-inner">
                <Bot className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                  <span>مستشار الأسهم • محادثة حرة</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    AI ⚡
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">
                  إجابات فورية عبر الذكاء الاصطناعي ومؤشرات السوق اللحظية
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={onToggle}
                className="p-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                title="تصغير شريط المحادثة"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={onToggle}
                className="p-1.5 rounded-xl bg-slate-900/90 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/40 transition-colors cursor-pointer"
                title="إغلاق المحادثة"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Stock Selector Strip with Live Metrics */}
          <div className="p-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2 text-xs shrink-0">
            <div className="relative flex-1" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsStockDropdownOpen(!isStockDropdownOpen)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-cyan-500/60 text-slate-200 transition-colors cursor-pointer"
                title="اضغط لاختيار أو تبديل السهم"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="font-mono text-cyan-300 font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                    {effectiveStock.symbol}
                  </span>
                  <span className="font-bold truncate text-white max-w-[130px]">
                    {effectiveStock.nameAr}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {/* Stock Selector Dropdown */}
              {isStockDropdownOpen && (
                <div className="absolute top-full mt-1.5 right-0 left-0 bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 space-y-1 max-h-56 overflow-y-auto custom-scrollbar">
                  <div className="relative mb-1">
                    <Search className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="ابحث بالاسم أو الرمز..."
                      className="w-full pr-7 pl-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-[11px] focus:outline-none focus:border-cyan-400"
                      autoFocus
                    />
                  </div>
                  {filteredStocks.map((stk) => (
                    <button
                      key={stk.symbol}
                      onClick={() => {
                        onSelectStock(stk.symbol);
                        setIsStockDropdownOpen(false);
                        setSearchFilter('');
                      }}
                      className={`w-full text-right p-1.5 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        stk.symbol === effectiveStock.symbol
                          ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/40'
                          : 'hover:bg-slate-900 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold">{stk.symbol}</span>
                        <span className="truncate max-w-[120px]">{stk.nameAr}</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">
                        {stk.price.toFixed(2)} ج.م
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Live Price Tag */}
            <div className="flex items-center gap-1.5 font-mono text-[11px] shrink-0">
              <strong className="text-white">{effectiveStock.price.toFixed(2)} ج.م</strong>
              <span
                className={`px-1.5 py-0.2 rounded font-bold ${
                  isPos ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                }`}
              >
                {isPos ? '+' : ''}{effectiveStock.changePct}%
              </span>
            </div>
          </div>

          {/* Quick Prompts Ribbon */}
          <div className="px-3 py-1.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-[10px]">
            <span className="text-slate-400 font-bold shrink-0">اقتراحات:</span>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={isThinking}
                className="px-2 py-0.5 rounded-lg bg-slate-900/90 hover:bg-cyan-950/70 text-slate-300 hover:text-cyan-200 border border-slate-800 hover:border-cyan-500/30 whitespace-nowrap transition-all cursor-pointer disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 custom-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'USER' ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[90%] p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'USER'
                      ? 'bg-cyan-950/80 text-cyan-100 border border-cyan-500/40 rounded-tr-none'
                      : 'bg-slate-900/90 text-slate-200 border border-slate-800/90 rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 mb-1 border-b border-white/5 pb-0.5">
                    <span className="font-bold flex items-center gap-1">
                      {msg.sender === 'USER' ? (
                        'أنت'
                      ) : (
                        <span className="text-cyan-400 flex items-center gap-1 font-bold">
                          <Bot className="w-3 h-3 text-cyan-400" />
                          المستشار الذكي
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[9px]">{msg.timestamp}</span>
                      {msg.sender === 'AI' && (
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="hover:text-white p-0.5 rounded hover:bg-slate-800 transition-colors"
                          title="نسخ الرد"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="whitespace-pre-line leading-relaxed font-sans">{msg.text}</div>
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex items-end justify-end">
                <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl rounded-tl-none p-3 text-xs text-cyan-300 flex items-center gap-2 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>المستشار يفحص مؤشرات سهم {effectiveStock.symbol} ويحلل السؤال...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input Footer Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`اسأل عن سهم ${effectiveStock.symbol} أو اكتب أي استفسار حر...`}
              disabled={isThinking}
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 text-white placeholder-slate-500 text-xs outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isThinking}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/20 disabled:opacity-50 transition-all cursor-pointer shrink-0"
            >
              <span>إرسال</span>
              <Send className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
