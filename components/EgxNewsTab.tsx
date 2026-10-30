import React, { useState, useMemo } from 'react';
import {
  Newspaper,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  Filter,
  Copy,
  Check,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  FileText,
  Activity,
  Bot,
  Globe,
  Share2,
  Bookmark,
  Layers,
} from 'lucide-react';
import {
  EgxNewsItem,
  MOCK_VERIFIED_NEWS,
  OFFICIAL_NEWS_SOURCES,
  DIRECT_VERIFIED_PORTALS,
} from '../services/egxNewsService';
import { EGXStock } from '../types/stock';
import { filterAndPrioritizeFreshNews, NewsFreshnessFilter } from '../utils/newsRecencyService';

interface EgxNewsTabProps {
  stocks: EGXStock[];
  onSelectStockForChart: (symbol: string) => void;
  onOpenReportModal: (stock: EGXStock) => void;
  onOpenAdvisor: (symbol: string) => void;
}

export const EgxNewsTab: React.FC<EgxNewsTabProps> = ({
  stocks,
  onSelectStockForChart,
  onOpenReportModal,
  onOpenAdvisor,
}) => {
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [filterImpact, setFilterImpact] = useState<string>('ALL');
  const [freshnessFilter, setFreshnessFilter] = useState<NewsFreshnessFilter>('ALL_RECENT');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Guarantee that news is strictly sorted by recency and filtered against stale news
  const prioritizedNews = useMemo(() => {
    return filterAndPrioritizeFreshNews(MOCK_VERIFIED_NEWS, freshnessFilter, 72);
  }, [freshnessFilter]);

  const filteredNews = useMemo(() => {
    let list = prioritizedNews;

    if (selectedSource !== 'ALL') {
      list = list.filter((n) => n.sourceCategory === selectedSource);
    }

    if (filterImpact !== 'ALL') {
      list = list.filter((n) => n.impact === filterImpact);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (n) =>
          n.headlineAr.toLowerCase().includes(q) ||
          n.summaryAr.toLowerCase().includes(q) ||
          n.relatedSymbols.some((s) => s.toLowerCase().includes(q)) ||
          n.sourceNameAr.toLowerCase().includes(q)
      );
    }

    return list;
  }, [prioritizedNews, selectedSource, filterImpact, searchQuery]);

  const handleCopy = (item: EgxNewsItem) => {
    const text = `📰 [${item.categoryLabelAr}] ${item.headlineAr}
المصدر المعتمد: ${item.sourceNameAr} (${item.timeAgoAr})
التأثير: ${item.impactLabelAr}
التفاصيل: ${item.summaryAr}
الأسهم المرتبطة: ${item.relatedSymbols.join(', ')}
رابط المصدر: ${item.url}
عبر: منصة رادار البورصة المصرية EGX`;

    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 font-['Cairo']">
      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 via-cyan-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/25 shrink-0">
              <Newspaper className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  المصادر الإخبارية المعتمدة والروابط المباشرة للبورصة المصرية
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                  إنفستنج + البورصة الرسمية + مباشر + بلومبرغ الشرق ✅
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                تغطية إخبارية حصرية موثوقة بروابط مباشرة إلى بوابة إنفستنج دوت كوم (Investing.com)، شاشات إفصاحات البورصة المصرية (EGX)، الهيئة العامة للرقابة المالية (FRA)، تحليلات بلومبرغ الشرق، ونشرة إنتربرايز مصر.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">
              التحديث الإخباري: <strong className="text-cyan-400">فوري ومباشر</strong>
            </span>
          </div>
        </div>

        {/* Source Categories Quick Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-slate-800/80">
          {OFFICIAL_NEWS_SOURCES.map((src) => (
            <button
              key={src.id}
              onClick={() => setSelectedSource(src.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedSource === src.id
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
              }`}
            >
              {src.nameAr}
            </button>
          ))}
        </div>
      </div>

      {/* Direct Verified Portals Directory (دليل الروابط الرسمية المباشرة) */}
      <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-black text-white">
              دليل بوابات وروابط المصادر المعتمدة المباشرة (انقر للانتقال المباشر):
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            10 مصادر معتمدة دولياً ومحلياً
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {DIRECT_VERIFIED_PORTALS.map((portal) => (
            <a
              key={portal.id}
              href={portal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-2xl bg-[#0b0f17] hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 transition-all group flex flex-col justify-between space-y-2.5 shadow-md"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-1.5">
                  <strong className="text-xs font-black text-white group-hover:text-cyan-300 transition-colors leading-tight">
                    {portal.nameAr}
                  </strong>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0 transition-colors" />
                </div>
                <span className="text-[10px] text-cyan-400 font-bold block">{portal.categoryAr}</span>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {portal.descriptionAr}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-[10px]">
                <span className="font-bold text-amber-300">{portal.badgeAr}</span>
                <span className="text-cyan-400 group-hover:underline font-bold">فتح الرابط ↗</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Freshness Recency Filter & Impact Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full lg:w-auto">
          {/* Freshness / Recency Filter Buttons (Requested) */}
          <button
            onClick={() => setFreshnessFilter('ALL_RECENT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              freshnessFilter === 'ALL_RECENT'
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            كافة الأخبار الحديثة
          </button>
          <button
            onClick={() => setFreshnessFilter('TODAY_ONLY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
              freshnessFilter === 'TODAY_ONLY'
                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-sm'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>أخبار اليوم اللحظية فقط ⚡</span>
          </button>
          <button
            onClick={() => setFreshnessFilter('LAST_24_HOURS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              freshnessFilter === 'LAST_24_HOURS'
                ? 'bg-teal-500/25 text-teal-300 border border-teal-500/40'
                : 'text-slate-400 hover:text-teal-400'
            }`}
          >
            آخر 24 ساعة 🕒
          </button>
          <button
            onClick={() => setFreshnessFilter('LAST_48_HOURS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              freshnessFilter === 'LAST_48_HOURS'
                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            آخر 48 ساعة
          </button>

          <span className="text-slate-700 hidden sm:inline">|</span>

          {/* Impact Filter */}
          <button
            onClick={() => setFilterImpact('ALL')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filterImpact === 'ALL'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            الكل ({filteredNews.length})
          </button>
          <button
            onClick={() => setFilterImpact('POSITIVE')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filterImpact === 'POSITIVE'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            إيجابي 🟢
          </button>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في الأخبار أو الرمز أو المصدر..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* News Feed List */}
      <div className="space-y-4">
        {filteredNews.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-3xl bg-[#0b0f17] border border-slate-800 hover:border-slate-700 transition-all shadow-xl space-y-3"
          >
            {/* Top Metadata Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  {item.categoryLabelAr}
                </span>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {item.freshnessBadgeAr || 'حديث'}
                </span>

                <span className="text-xs text-slate-300 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>المصدر:</span>
                  <strong className="text-white">{item.sourceNameAr}</strong>
                </span>

                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  {item.timeAgoAr}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    item.impact === 'POSITIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.impactLabelAr}
                </span>

                <button
                  onClick={() => handleCopy(item)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                  title="نسخ الخبر"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Headline */}
            <h3 className="text-base font-black text-white leading-snug hover:text-cyan-300 transition-colors">
              {item.headlineAr}
            </h3>

            {/* Summary */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans bg-slate-950/60 p-3.5 rounded-2xl border border-slate-850">
              {item.summaryAr}
            </p>

            {/* Bottom Row: Related Stocks & External Link */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400 font-bold">الأسهم المرتبطة بالخبر:</span>
                {item.relatedSymbols.map((sym) => {
                  const stockObj = stocks.find((s) => s.symbol === sym);
                  return (
                    <div key={sym} className="flex items-center gap-1">
                      <button
                        onClick={() => onSelectStockForChart(sym)}
                        className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-cyan-300 hover:text-white transition-all flex items-center gap-1"
                      >
                        <span>{sym}</span>
                        {stockObj && (
                          <span className="text-[10px] text-slate-400">({stockObj.price.toFixed(2)} ج.م)</span>
                        )}
                      </button>
                      {stockObj && (
                        <button
                          onClick={() => onOpenAdvisor(sym)}
                          className="p-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px]"
                          title="استشارة المستشار الفني حول السهم"
                        >
                          <Bot className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Direct External Link */}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>المصدر الأصلي للخبر</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
