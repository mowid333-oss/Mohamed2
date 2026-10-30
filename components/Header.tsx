import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  RefreshCw,
  Search,
  BookOpen,
  X,
  Bell,
  FileText,
  LogIn,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  Bot,
  Image as ImageIcon,
  FileSpreadsheet,
  Download,
  Zap,
  MessageSquare,
  Globe,
  Landmark,
  Monitor,
  ArrowLeftRight,
  Server,
  Sparkles,
  Newspaper,
  ChevronDown,
  Layers,
  Coins,
  Smartphone,
} from 'lucide-react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { EGXStock, WatchlistCategory } from '../types/stock';
import { signInWithGoogle, logOut } from '../services/firebase';
import { EGX_MARKET_INDICES, MarketIndexItem, getLiveCalculatedIndices } from '../data/marketIndices';
import { TradingViewRatingWidget } from './TradingViewRatingWidget';
import { CopyableStockSymbol } from './CopyableStockSymbol';

interface HeaderProps {
  stocks: EGXStock[];
  selectedSymbol: string;
  onExportMasterExcel: () => void;
  onExportPriceAuditExcel?: () => void;
  onOpenGlobalMarkets?: () => void;
  onOpenGoldMarket?: () => void;
  onOpenEgyptianMarket?: () => void;
  isEgyptianMarketActive?: boolean;
  onOpenMarketComparison?: () => void;
  onOpenLiquidityAlerts?: () => void;
  liquidityAlertsCount?: number;
  onSelectStock: (symbol: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
  lastUpdated: string;
  shariahOnly: boolean;
  onToggleShariahOnly: () => void;
  onOpenShariahGuide: () => void;
  currentUser: User | null;
  onOpenAlertsModal: () => void;
  onOpenDailyReportModal: () => void;
  onOpen360Report?: () => void;
  onOpenAdvisor?: () => void;
  onOpenAdvisorWithSymbol?: (symbol: string) => void;
  onOpenReportWithStock?: (stock: EGXStock) => void;
  onSelectStockForTab?: (symbol: string, tab: any) => void;
  onOpenChartVision?: () => void;
  onOpenGoogleAiNews?: () => void;
  onOpenGoogleAiNewsWithSymbol?: (symbol: string) => void;
  onOpenStockChat?: () => void;
  onSelectIndexCategory?: (category: WatchlistCategory) => void;
  onOpenUserGuide?: () => void;
  onOpenWelcomeModal?: () => void;
  onOpenHealthModal?: () => void;
  healthScore?: number;
  alertsCount: number;
  refreshInterval?: number;
  onRefreshIntervalChange?: (intervalSec: number) => void;
  countdownSeconds?: number;
  onOpenPythonBackend?: () => void;
  zoomLevel?: string;
  onZoomLevelChange?: (level: string) => void;
  isMobileMode?: boolean;
  onToggleMobileMode?: () => void;
}

function normalizeArabicText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '')
    .trim();
}

export const Header: React.FC<HeaderProps> = ({
  stocks,
  selectedSymbol,
  onExportMasterExcel,
  onExportPriceAuditExcel,
  onOpenGlobalMarkets,
  onOpenGoldMarket,
  onOpenEgyptianMarket,
  isEgyptianMarketActive,
  onOpenMarketComparison,
  onSelectStock,
  isLoading,
  onRefresh,
  lastUpdated,
  shariahOnly,
  onToggleShariahOnly,
  onOpenShariahGuide,
  currentUser,
  onOpenAlertsModal,
  onOpenLiquidityAlerts,
  liquidityAlertsCount,
  onOpenDailyReportModal,
  onOpen360Report,
  onOpenAdvisor,
  onOpenAdvisorWithSymbol,
  onOpenReportWithStock,
  onSelectStockForTab,
  onOpenChartVision,
  onOpenGoogleAiNews,
  onOpenGoogleAiNewsWithSymbol,
  onOpenStockChat,
  onSelectIndexCategory,
  onOpenUserGuide,
  onOpenWelcomeModal,
  onOpenHealthModal,
  healthScore,
  alertsCount,
  refreshInterval,
  onRefreshIntervalChange,
  countdownSeconds,
  onOpenPythonBackend,
  zoomLevel = '100',
  onZoomLevelChange,
  isMobileMode = false,
  onToggleMobileMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Tools & Reports Dropdown Menu State
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  // Close search & tools menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setIsToolsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter EGX Indices (EGX30, EGX70, EGX100, Shariah Index, etc.)
  const indexResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const normQ = normalizeArabicText(q);

    return getLiveCalculatedIndices(stocks).filter((idx) => {
      const sym = idx.symbol.toLowerCase();
      const normSym = normalizeArabicText(idx.symbol);
      const normNameAr = normalizeArabicText(idx.nameAr);
      const normNameEn = normalizeArabicText(idx.nameEn);

      // Check if user is searching for an index or market category
      const isIndexIntent =
        normQ.includes('مؤشر') ||
        normQ.includes('ايجي') ||
        normQ.includes('ايجى') ||
        normQ.includes('egx') ||
        normQ.includes('index') ||
        normQ === '30' ||
        normQ === '70' ||
        normQ === '100' ||
        normQ.includes('شريع') ||
        normQ.includes('shariah');

      if (!isIndexIntent) {
        return (
          sym.includes(q) ||
          normSym.includes(normQ) ||
          normNameAr.includes(normQ) ||
          normNameEn.includes(normQ)
        );
      }

      // Check specific index number
      if (normQ.includes('30') || q.includes('30')) {
        return idx.symbol.includes('30');
      }
      if (normQ.includes('70') || q.includes('70')) {
        return idx.symbol.includes('70');
      }
      if (normQ.includes('100') || q.includes('100')) {
        return idx.symbol.includes('100');
      }
      if (normQ.includes('شريع') || q.includes('shariah')) {
        return idx.symbol.toLowerCase().includes('shariah');
      }

      return true;
    });
  }, [searchQuery, stocks]);

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const normQ = normalizeArabicText(q);

    return stocks
      .filter((s) => {
        const sym = s.symbol.toLowerCase();
        const normSym = normalizeArabicText(s.symbol);
        const normNameAr = normalizeArabicText(s.nameAr);
        const normNameEn = normalizeArabicText(s.nameEn || '');
        const normSector = normalizeArabicText(s.sectorAr || '');

        return (
          sym.includes(q) ||
          normSym.includes(normQ) ||
          normNameAr.includes(normQ) ||
          normNameEn.includes(normQ) ||
          normSector.includes(normQ)
        );
      })
      .slice(0, 25);
  }, [searchQuery, stocks]);

  return (
    <header className="border-b border-slate-800 bg-[#0b0f17]/95 backdrop-blur-md sticky top-0 z-40 px-2 sm:px-4 lg:px-6 py-2.5 font-['Cairo']">
      <div className="max-w-[1850px] w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* Zone 1: Brand Wordmark & Official Title */}
        <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
              <div className="w-full h-full bg-[#070a0f] rounded-[10px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>مستشار التداول الذكي</span>
                  <span className="text-[11px] font-bold text-amber-300 border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    تحت الاختبار 🧪
                  </span>
                </h1>
                <span className="text-[11px] font-bold text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  مؤشر الشريعة
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                تحليل فني لحظي، الأسواق العالمية والخليجية والبورصة المصرية عبر TradingView
              </p>
            </div>
          </div>

          {/* Mobile Refresh & Mode Buttons */}
          <div className="md:hidden flex items-center gap-1.5">
            {onToggleMobileMode && (
              <button
                type="button"
                onClick={onToggleMobileMode}
                className="p-2 rounded-xl bg-slate-900 text-amber-300 border border-slate-700/80 hover:text-white flex items-center gap-1 text-[11px] font-bold"
                title={isMobileMode ? 'التبديل إلى وضع الديسكتوب' : 'التبديل إلى وضع الموبايل'}
              >
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span>{isMobileMode ? 'موبايل 📱' : 'ديسكتوب'}</span>
              </button>
            )}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 hover:text-white"
              title="تحديث الأسعار الآن"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Zone 2: Instant Search Autocomplete */}
        <div className="relative w-full md:w-72 lg:w-80" ref={searchContainerRef}>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="ابحث برمز السهم أو الاسم (مثل TMGH, السويدي)..."
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pr-10 pl-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showSearchResults && (searchResults.length > 0 || indexResults.length > 0) && (
            <div className="absolute top-full mt-1.5 right-0 left-0 bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 space-y-2 max-h-96 overflow-y-auto">
              {/* Indices Matching Section (EGX30, EGX70, EGX100, Shariah) */}
              {indexResults.length > 0 && (
                <div className="space-y-1.5 pb-2 border-b border-slate-800">
                  <div className="text-[10px] text-amber-400 font-bold px-2 py-1 flex justify-between items-center bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <span>مؤشرات السوق الرئيسية ({indexResults.length}) - اضغط للتحليل المباشر</span>
                    <span className="font-mono text-[9px]">EGX Indices AI Analysis</span>
                  </div>
                  {indexResults.map((idx) => (
                    <div
                      key={idx.id}
                      className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/40 hover:border-amber-400 transition-all space-y-2 shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectStock(idx.symbol);
                          if (onOpenAdvisorWithSymbol) {
                            onOpenAdvisorWithSymbol(idx.symbol);
                          } else if (onOpenAdvisor) {
                            onOpenAdvisor();
                          }
                          setShowSearchResults(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-right flex items-center justify-between text-xs cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-amber-300 text-sm group-hover:text-amber-200">
                            {idx.symbol}
                          </span>
                          <span className="text-white font-bold text-xs truncate max-w-[170px] group-hover:text-cyan-300">
                            {idx.nameAr}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-bold text-white tabular-nums">{idx.points.toLocaleString('ar-EG')}</span>
                          <span
                            className={`text-[10px] font-bold ${
                              idx.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            ({idx.changePct >= 0 ? '+' : ''}{idx.changePct}%)
                          </span>
                        </div>
                      </button>

                      <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-800/80 text-[10px] flex-wrap">
                        {/* Primary Button: Open General Index Analysis */}
                        <button
                          type="button"
                          onClick={() => {
                            onSelectStock(idx.symbol);
                            if (onOpenAdvisorWithSymbol) {
                              onOpenAdvisorWithSymbol(idx.symbol);
                            } else if (onOpenAdvisor) {
                              onOpenAdvisor();
                            }
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                        >
                          <Bot className="w-3 h-3 text-cyan-200" />
                          <span>تحليل المؤشر العام AI 🤖</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onSelectStock(idx.symbol);
                            onSelectStockForTab?.(idx.symbol, 'CHART');
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          className="px-2 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold transition-colors cursor-pointer"
                        >
                          شارت {idx.symbol} 📈
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onSelectIndexCategory?.(idx.categoryFilter);
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold transition-colors cursor-pointer"
                        >
                          أسهم {idx.symbol}
                        </button>
                        {onOpenGoogleAiNewsWithSymbol && (
                          <button
                            onClick={() => {
                              onOpenGoogleAiNewsWithSymbol(idx.symbol);
                              setShowSearchResults(false);
                              setSearchQuery('');
                            }}
                            className="px-2 py-0.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/30 text-teal-300 font-bold transition-colors"
                          >
                            🌐 أخبار Google
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Stocks Matching Section */}
              {searchResults.length > 0 && (
                <div className="text-[10px] text-slate-400 font-bold px-2 py-1 flex justify-between items-center">
                  <span>الأسهم المطابقة ({searchResults.length})</span>
                  <span className="text-cyan-400 font-mono">EGX TradingView</span>
                </div>
              )}
              {searchResults.map((s) => (
                <div
                  key={s.symbol}
                  className="p-2 rounded-xl bg-slate-900/70 hover:bg-slate-800/90 border border-slate-800 transition-colors"
                >
                  <div
                    onClick={() => {
                      onSelectStock(s.symbol);
                      setShowSearchResults(false);
                      setSearchQuery('');
                    }}
                    className="cursor-pointer flex items-center justify-between text-xs group"
                  >
                    <div className="flex items-center gap-2">
                      <CopyableStockSymbol symbol={s.symbol} size="sm" />
                      <span className="text-slate-200 font-semibold truncate max-w-[170px]">
                        {s.nameAr}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          s.isShariahCompliant
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {s.isShariahCompliant ? 'شريعة ✅' : 'تقليدي'}
                      </span>
                      <TradingViewRatingWidget stock={s} variant="MINI_BADGE" />
                      <span className="font-mono font-bold text-slate-200">
                        {s.price > 0 ? s.price.toFixed(2) : '-'} ج.م
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold ${
                          s.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        ({s.changePct >= 0 ? '+' : ''}{s.changePct}%)
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Shortcuts */}
                  <div className="mt-1.5 pt-1.5 border-t border-slate-800/60 flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStockForTab?.(s.symbol, 'TECHNICAL_ANALYST');
                        setShowSearchResults(false);
                        setSearchQuery('');
                      }}
                      className="px-2 py-0.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 text-[10px] font-bold transition-colors"
                    >
                      📈 التحليل الفني
                    </button>
                    {onOpenAdvisorWithSymbol && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAdvisorWithSymbol(s.symbol);
                          setShowSearchResults(false);
                          setSearchQuery('');
                        }}
                        className="px-2 py-0.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-bold transition-colors"
                      >
                        🤖 المستشار
                      </button>
                    )}
                    {onOpenReportWithStock && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenReportWithStock(s);
                          setShowSearchResults(false);
                          setSearchQuery('');
                        }}
                        className="px-2 py-0.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/30 text-teal-300 text-[10px] font-bold transition-colors"
                      >
                        📑 تقرير 360°
                      </button>
                    )}
                    {onOpenGoogleAiNewsWithSymbol && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenGoogleAiNewsWithSymbol(s.symbol);
                          setShowSearchResults(false);
                          setSearchQuery('');
                        }}
                        className="px-2 py-0.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold transition-colors"
                      >
                        🌐 أخبار Google
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStockForTab?.(s.symbol, 'CHART');
                        setShowSearchResults(false);
                        setSearchQuery('');
                      }}
                      className="px-2 py-0.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/30 text-blue-300 text-[10px] font-bold transition-colors"
                    >
                      📊 الشارت
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Zone 3: Executive Action Bar & Tools Menu */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          {/* Screen Display Scale / Zoom Dropdown */}
          {onZoomLevelChange && (
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs shadow-sm">
              <Monitor className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-slate-400 font-bold text-[11px] hidden xl:inline">الشاشة:</span>
              <select
                dir="rtl"
                value={zoomLevel}
                onChange={(e) => onZoomLevelChange(e.target.value)}
                className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer text-xs font-['Cairo'] text-right min-w-[110px]"
                title="تحديد مقياس عرض الشاشة"
              >
                <option value="125" className="bg-slate-950 text-slate-100">125% فائق</option>
                <option value="120" className="bg-slate-950 text-slate-100">120% كبير</option>
                <option value="115" className="bg-slate-950 text-slate-100">115% متوسط</option>
                <option value="110" className="bg-slate-950 text-slate-100">110% مريح</option>
                <option value="105" className="bg-slate-950 text-slate-100">105% طفيف</option>
                <option value="100" className="bg-slate-950 text-emerald-400 font-bold">100% افتراضي ⭐</option>
                <option value="95" className="bg-slate-950 text-slate-100">95% مدمج</option>
                <option value="90" className="bg-slate-950 text-slate-100">90% خفيف</option>
                <option value="85" className="bg-slate-950 text-cyan-300">85% لابتوب</option>
                <option value="80" className="bg-slate-950 text-slate-100">80% مكثف</option>
                <option value="75" className="bg-slate-950 text-slate-100">75% صغير</option>
                <option value="70" className="bg-slate-950 text-slate-100">70% اتساع</option>
              </select>
            </div>
          )}

          {/* Mobile Mode Switcher Button (خيار الموبايل / ديسكتوب) */}
          {onToggleMobileMode && (
            <button
              type="button"
              onClick={onToggleMobileMode}
              className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border active:scale-95 ${
                isMobileMode
                  ? 'bg-amber-500/25 text-amber-200 border-amber-400 shadow-amber-500/20 ring-1 ring-amber-400/50'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:text-amber-300'
              }`}
              title={isMobileMode ? 'التبديل إلى وضع الديسكتوب والجدول الكامل' : 'التبديل إلى وضع الموبايل وبطاقات اللمس الذكية'}
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>{isMobileMode ? 'وضع الموبايل 📱' : 'خيار الموبايل 📱'}</span>
            </button>
          )}

          {/* Egyptian Market Shortcut Button */}
          {onOpenEgyptianMarket && (
            <button
              onClick={onOpenEgyptianMarket}
              className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border active:scale-95 ${
                isEgyptianMarketActive
                  ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-300 border-emerald-400/60 shadow-emerald-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80'
              }`}
              title="الانتقال المباشر لقائمة الأسهم المصرية وشريط الذهب"
            >
              <Landmark className="w-3.5 h-3.5 text-emerald-400" />
              <span>السوق المصري 🇪🇬</span>
            </button>
          )}

          {/* Gold Market Direct Launcher Button */}
          {onOpenGoldMarket && (
            <button
              onClick={onOpenGoldMarket}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-600/20 hover:from-amber-500/35 hover:to-yellow-500/35 text-amber-200 border border-amber-500/50 hover:border-amber-400 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
              title="فتح منصة وأداة أسعار الذهب اللحظية المعتمدة من iSagha"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>بورصة الذهب 🪙</span>
            </button>
          )}

          {/* Shariah-Only Toggle Switch */}
          <button
            onClick={onToggleShariahOnly}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
              shariahOnly
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/15'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="تصفية فورية لعرض أسهم الشريعة الإسلامية فقط"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                shariahOnly ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
              }`}
            />
            <span>أسهم الشريعة</span>
          </button>

          {/* Institutional Liquidity Inflow Alerts (ADV-20 Spike) */}
          {onOpenLiquidityAlerts && (
            <button
              onClick={onOpenLiquidityAlerts}
              className="relative px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/15 hover:from-amber-500/30 hover:to-orange-500/25 text-amber-300 border border-amber-500/50 text-xs font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
              title="رادار تنبيهات تدفق السيولة المؤسساتية اللحظية"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
              <span className="hidden sm:inline">رادار السيولة</span>
              {liquidityAlertsCount !== undefined && liquidityAlertsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-mono text-[10px] font-black">
                  {liquidityAlertsCount}
                </span>
              )}
            </button>
          )}

          {/* User Alerts System Trigger */}
          <button
            onClick={onOpenAlertsModal}
            className="relative px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="تنبيهات الأسعار المخصصة"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">التنبيهات</span>
            {alertsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono text-[9px] font-black">
                {alertsCount}
              </span>
            )}
          </button>

          {/* Quick AI Advisor Trigger */}
          {onOpenAdvisor && (
            <button
              onClick={onOpenAdvisor}
              className="relative px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/25 transition-all border border-cyan-400/40 hover:scale-[1.02] cursor-pointer"
              title="المستشار الفني الذكي المباشر (AI Technical Advisor)"
            >
              <Bot className="w-4 h-4 text-cyan-200" />
              <span>المستشار الذكي 🤖</span>
            </button>
          )}

          {/* Unified Executive "الأدوات والتقارير ⚡" Popover Menu */}
          <div className="relative" ref={toolsMenuRef}>
            <button
              type="button"
              onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer border shadow-md active:scale-95 ${
                isToolsMenuOpen
                  ? 'bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 text-slate-950 border-cyan-300 ring-2 ring-cyan-400/40'
                  : 'bg-gradient-to-r from-slate-900 to-slate-950 hover:bg-slate-800 text-cyan-300 border-cyan-500/40 hover:border-cyan-400'
              }`}
              title="قائمة الأدوات والتقارير الشاملة وإكسل والذكاء الاصطناعي وكود بايثون"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isToolsMenuOpen ? 'text-slate-950' : 'text-cyan-400'}`} />
              <span>الأدوات والتقارير ⚡</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isToolsMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu Content */}
            {isToolsMenuOpen && (
              <div
                dir="rtl"
                className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-[340px] sm:w-[380px] rounded-2xl bg-[#0b0f17] border border-cyan-500/40 shadow-2xl shadow-cyan-950/60 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1.5 text-cyan-300 font-black">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    مركز الأدوات والتقارير الشاملة
                  </span>
                  <span className="text-[10px] text-slate-500">100% متاحة وبدون تكرار</span>
                </div>

                <div className="space-y-3 max-h-[70vh] overflow-y-auto no-scrollbar">
                  {/* Category 1: تقارير الإكسل والبيانات */}
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1.5 px-1">
                      📊 تقارير الإكسل والبيانات الشاملة
                    </span>
                    <div className="space-y-1">
                      {onExportMasterExcel && (
                        <button
                          onClick={() => {
                            onExportMasterExcel();
                            setIsToolsMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-900/90 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/50 text-right transition-all group"
                        >
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                            <div>
                              <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                                تقرير شامل عام Excel لكل الأسهم (290+)
                              </div>
                              <div className="text-[10px] text-slate-400">
                                خطط، أهداف، مخاطر، تجميع وتصريف (.xlsx)
                              </div>
                            </div>
                          </div>
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                      )}

                      {onExportPriceAuditExcel && (
                        <button
                          onClick={() => {
                            onExportPriceAuditExcel();
                            setIsToolsMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-900/90 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/50 text-right transition-all group"
                        >
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                            <div>
                              <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                                تدقيق أسعار الشارت والتقارير Excel
                              </div>
                              <div className="text-[10px] text-slate-400">
                                مقارنة لحظية واكتشاف التباين والتوقيت بدقة
                              </div>
                            </div>
                          </div>
                          <Download className="w-3.5 h-3.5 text-cyan-400" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onOpenDailyReportModal();
                          setIsToolsMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-900/90 hover:bg-teal-950/40 border border-slate-800 hover:border-teal-500/50 text-right transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="text-xs font-bold text-white group-hover:text-teal-300">
                              التقرير اليومي الآلي للسوق
                            </div>
                            <div className="text-[10px] text-slate-400">
                              ملخص أداء المؤشرات وأسهم الشريعة
                            </div>
                          </div>
                        </div>
                      </button>

                      {onOpen360Report && (
                        <button
                          onClick={() => {
                            onOpen360Report();
                            setIsToolsMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-900/90 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/50 text-right transition-all group"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                            <div>
                              <div className="text-xs font-bold text-white group-hover:text-indigo-300">
                                تقرير فني وشرعي 360° للسهم
                              </div>
                              <div className="text-[10px] text-slate-400">
                                فحص شامل ثلاثي الأبعاد للسهم المختار
                              </div>
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category 2: الذكاء الاصطناعي والتحليل اللحظي */}
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1.5 px-1">
                      🤖 الذكاء الاصطناعي والمستشار
                    </span>
                    <div className="space-y-1">
                      {onOpenGoogleAiNews && (
                        <button
                          onClick={() => {
                            onOpenGoogleAiNews();
                            setIsToolsMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-900/90 hover:bg-teal-950/40 border border-slate-800 hover:border-teal-500/50 text-right transition-all group"
                        >
                          <div className="flex items-center gap-2">
                            <Newspaper className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                            <div>
                              <div className="text-xs font-bold text-white group-hover:text-teal-300">
                                أخبار وإفصاحات السهم بالمصادر وبحث Google
                              </div>
                              <div className="text-[10px] text-slate-400">
                                تغطية رسمية موثقة (البورصة، مباشر، رويترز)
                              </div>
                            </div>
                          </div>
                        </button>
                      )}

                      {onOpenStockChat && (
                        <button
                          onClick={() => {
                            onOpenStockChat();
                            setIsToolsMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-900/90 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/50 text-right transition-all group"
                        >
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                            <div>
                              <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                                استفسار حر فوري مع الذكاء الاصطناعي
                              </div>
                              <div className="text-[10px] text-slate-400">
                                دردشة مباشرة بالذكاء الاصطناعي حول أي سهم
                              </div>
                            </div>
                          </div>
                        </button>
                      )}

                      {onOpenChartVision && (
                        <button
                          onClick={() => {
                            onOpenChartVision();
                            setIsToolsMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-900/90 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/50 text-right transition-all group"
                        >
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                            <div>
                              <div className="text-xs font-bold text-white group-hover:text-indigo-300">
                                تحليل صورة شارت بالرؤية الحاسوبية
                              </div>
                              <div className="text-[10px] text-slate-400">
                                رفع صورة شارت والحصول على قراءة فنية فورية
                              </div>
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category 3: أدوات النظام والمساعدة */}
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1.5 px-1">
                      🛠️ كود بايثون والنظام والمساعدة
                    </span>
                    <div className="space-y-1">
                      {onOpenPythonBackend && (
                        <button
                          onClick={() => {
                            onOpenPythonBackend();
                            setIsToolsMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-900/90 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/50 text-right transition-all group"
                        >
                          <div className="flex items-center gap-2">
                            <Server className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                            <div>
                              <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                                كود بايثون 🐍 (FastAPI + Quant Engine)
                              </div>
                              <div className="text-[10px] text-slate-400">
                                كود السيرفر وجدولة التحديثات كل 15 دقيقة
                              </div>
                            </div>
                          </div>
                        </button>
                      )}

                      {onOpenHealthModal && (
                        <button
                          onClick={() => {
                            onOpenHealthModal();
                            setIsToolsMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-900/90 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/50 text-right transition-all group"
                        >
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                            <div>
                              <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                                فحص سلامة النظام والإصلاح الذاتي
                              </div>
                              <div className="text-[10px] text-slate-400">
                                كفاءة النظام الحالية: {healthScore ?? 100}%
                              </div>
                            </div>
                          </div>
                        </button>
                      )}

                      {onOpenUserGuide && (
                        <button
                          onClick={() => {
                            onOpenUserGuide();
                            setIsToolsMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-900/90 hover:bg-teal-950/40 border border-slate-800 hover:border-teal-500/50 text-right transition-all group"
                        >
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                            <div>
                              <div className="text-xs font-bold text-white group-hover:text-teal-300">
                                دليل المستخدم الذكي الشامل 📖
                              </div>
                              <div className="text-[10px] text-slate-400">
                                شرح تفصيلي لجميع مزايا وأدوات التطبيق
                              </div>
                            </div>
                          </div>
                        </button>
                      )}

                      {onOpenWelcomeModal && (
                        <button
                          onClick={() => {
                            onOpenWelcomeModal();
                            setIsToolsMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-900/90 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/50 text-right transition-all group"
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                            <div>
                              <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                                شاشة الترحيب واستعراض المزايا 👋
                              </div>
                              <div className="text-[10px] text-slate-400">
                                نظرة عامة على محرك التحليل والمنصة
                              </div>
                            </div>
                          </div>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onOpenShariahGuide();
                          setIsToolsMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-900/90 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/50 text-right transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="text-xs font-bold text-white group-hover:text-amber-300">
                              معايير وضوابط الفحص الشرعي
                            </div>
                            <div className="text-[10px] text-slate-400">
                              النسب المالية والضوابط المعتمدة
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Refresh Interval Selector & Countdown */}
          {onRefreshIntervalChange && refreshInterval !== undefined && (
            <div className="hidden xl:flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs">
              <span className="text-slate-400 font-bold text-[11px]">التحديث:</span>
              <select
                value={refreshInterval}
                onChange={(e) => onRefreshIntervalChange(Number(e.target.value))}
                className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer text-xs font-['Cairo']"
                title="تحديد فترة التحديث التلقائي لبيانات وأسعار البورصة المصرية"
              >
                <option value={15} className="bg-slate-950 text-slate-200">15 ثانية ⚡</option>
                <option value={30} className="bg-slate-950 text-slate-200">30 ثانية</option>
                <option value={60} className="bg-slate-950 text-emerald-400 font-bold">1 دقيقة (افتراضي ⭐)</option>
                <option value={120} className="bg-slate-950 text-slate-200">2 دقيقة</option>
                <option value={300} className="bg-slate-950 text-slate-200">5 دقائق</option>
                <option value={0} className="bg-slate-950 text-rose-300">يدوي فقط</option>
              </select>
              {refreshInterval > 0 && countdownSeconds !== undefined && (
                <span className="font-mono text-[10px] text-cyan-400 font-bold bg-cyan-950/80 px-1 py-0.5 rounded border border-cyan-800/60 tabular-nums">
                  {countdownSeconds}ث
                </span>
              )}
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            title="تحديث تدقيق الأسعار من TradingView"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-300' : ''}`} />
            <span className="hidden sm:inline">تحديث</span>
          </button>

          {/* Google Auth User Pill */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || ''}
                  className="w-5 h-5 rounded-full border border-emerald-500/50"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                  {currentUser.displayName?.charAt(0) || 'U'}
                </div>
              )}
              <span className="text-[11px] font-bold text-white max-w-[90px] truncate hidden md:inline">
                {currentUser.displayName?.split(' ')[0] || 'حسابي'}
              </span>
              <button
                onClick={() => logOut()}
                className="text-slate-400 hover:text-rose-400 p-0.5 ml-0.5 cursor-pointer"
                title="تسجيل الخروج"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="تسجيل الدخول بحساب Google لمزامنة التنبيهات مع Firestore"
            >
              <LogIn className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">دخول Google</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
