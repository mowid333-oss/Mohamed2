import React, { useState, useMemo } from 'react';
import {
  X,
  BookOpen,
  Search,
  Sparkles,
  Layers,
  Zap,
  TrendingUp,
  ShieldCheck,
  Compass,
  Target,
  Users,
  Bot,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Printer,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import {
  USER_GUIDE_ITEMS,
  USER_GUIDE_CATEGORIES,
  GuideSectionItem,
} from '../data/userGuideData';

interface SmartUserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tabKey: string) => void;
  onOpenHealthModal?: () => void;
}

export const SmartUserGuideModal: React.FC<SmartUserGuideModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  onOpenHealthModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedItemId, setExpandedItemId] = useState<string>(USER_GUIDE_ITEMS[0]?.id || '');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    let list = USER_GUIDE_ITEMS;
    if (selectedCategory !== 'ALL') {
      list = list.filter((item) => item.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.titleAr.toLowerCase().includes(q) ||
          item.summaryAr.toLowerCase().includes(q) ||
          item.detailedContentAr.some((c) => c.toLowerCase().includes(q)) ||
          item.keyTerms.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const handleToggleExpand = (id: string) => {
    setExpandedItemId(expandedItemId === id ? '' : id);
  };

  const handleCopyItem = (item: GuideSectionItem) => {
    const text = `دليل رادار البورصة المصرية - ${item.titleAr}:\n\n${item.summaryAr}\n\nالتفاصيل:\n${item.detailedContentAr.join(
      '\n'
    )}\n\nنصائح ذهبية:\n${item.tipsAr.join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const getItemIcon = (iconName: string) => {
    switch (iconName) {
      case 'Layers':
        return <Layers className="w-5 h-5 text-cyan-400" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'Compass':
        return <Compass className="w-5 h-5 text-indigo-400" />;
      case 'Target':
        return <Target className="w-5 h-5 text-emerald-400" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'TrendingUp':
        return <TrendingUp className="w-5 h-5 text-teal-400" />;
      case 'Users':
        return <Users className="w-5 h-5 text-cyan-400" />;
      case 'Bot':
        return <Bot className="w-5 h-5 text-purple-400" />;
      case 'HelpCircle':
        return <HelpCircle className="w-5 h-5 text-rose-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-hidden font-['Cairo']">
      <div className="relative w-full max-w-5xl h-[94vh] max-h-[900px] bg-[#0b0f17] border border-cyan-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-[#0a1824] to-cyan-950/70 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/25 shrink-0">
              <div className="w-full h-full bg-[#070a0f] rounded-[14px] flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>دليل المستخدم الذكي والشامل</span>
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                  EGX Smart Guidebook
                </span>
              </div>
              <p className="text-xs text-slate-400">
                شرح تفصيلي ومبسط لكل ميزة وأداة ورادار في منصة رادار البورصة المصرية
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              title="طباعة الدليل"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar & Quick Category Chips */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 space-y-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في الدليل (مثال: الدايفرجنس، التجميع، ASO، الشريعة، فئات المستثمرين، وقف الخسارة)..."
              className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-cyan-400 transition-colors placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                مسح
              </button>
            )}
          </div>

          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {USER_GUIDE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {cat.nameAr}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-slate-950/50 border border-slate-800 rounded-3xl p-6 space-y-3">
              <Search className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-base font-bold text-slate-300">لم يتم العثور على نتائج للبحث</div>
              <p className="text-xs text-slate-500">
                جرب البحث بكلمات أخرى مثل "شريعة"، "دايفرجنس"، "تجميع"، أو اختر "جميع الأقسام".
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isExpanded = expandedItemId === item.id;
              const isCopied = copiedId === item.id;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border transition-all ${
                    isExpanded
                      ? 'bg-gradient-to-br from-[#0c1322] via-[#090e18] to-slate-950 border-cyan-500/50 shadow-xl'
                      : 'bg-[#0a0e17] border-slate-800/90 hover:border-slate-700'
                  } overflow-hidden`}
                >
                  {/* Item Accordion Header */}
                  <div
                    onClick={() => handleToggleExpand(item.id)}
                    className="p-4 sm:p-5 cursor-pointer flex items-start sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 group-hover:border-cyan-500/40 transition-colors shrink-0">
                        {getItemIcon(item.icon)}
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-black text-white group-hover:text-cyan-300 transition-colors">
                          {item.titleAr}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 font-medium">
                          {item.summaryAr}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyItem(item);
                        }}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                        title="نسخ محتوى هذا القسم"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-cyan-300 transition-colors">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-slate-800/80 space-y-4 text-xs sm:text-sm text-slate-300 animate-fadeIn">
                      {/* Summary Banner */}
                      <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-cyan-200 font-medium">
                        {item.summaryAr}
                      </div>

                      {/* Detailed Bullet Points */}
                      <div className="space-y-2.5">
                        <span className="font-bold text-white block text-xs">الشرح والتفاصيل:</span>
                        <div className="space-y-2">
                          {item.detailedContentAr.map((paragraph, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-slate-950/80 border border-slate-850 text-slate-200 leading-relaxed font-sans"
                            >
                              {paragraph}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pro Tips Box */}
                      {item.tipsAr.length > 0 && (
                        <div className="p-4 rounded-xl bg-emerald-950/25 border border-emerald-500/35 space-y-2 text-xs">
                          <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4" />
                            <span>نصيحة ذهبية للمتداول:</span>
                          </span>
                          {item.tipsAr.map((tip, i) => (
                            <p key={i} className="text-emerald-200/90 leading-relaxed font-medium">
                              • {tip}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Key Terms Tags */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-2">
                        <span className="text-[11px] text-slate-500 font-bold">مصطلحات أساسية:</span>
                        {item.keyTerms.map((term, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 font-mono"
                          >
                            {term}
                          </span>
                        ))}
                      </div>

                      {/* Navigation Shortcut if applicable */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[11px] text-slate-500">
                          جاهز للتطبيق العملي على الشاشة المخصصة؟
                        </span>
                        <div className="flex items-center gap-2">
                          {item.category === 'SYSTEM_HEALTH' && onOpenHealthModal && (
                            <button
                              onClick={() => {
                                onClose();
                                onOpenHealthModal();
                              }}
                              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
                            >
                              <span>فتح لوحة فحص النظام الآن</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {item.relatedTabs.length > 0 && onNavigateToTab && (
                            <button
                              onClick={() => {
                                onNavigateToTab(item.relatedTabs[0]);
                                onClose();
                              }}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
                            >
                              <span>الانتقال للشاشة ذات الصلة</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span>دليل رادار البورصة المصرية</span>
            <span>•</span>
            <span className="text-cyan-400">تحديث مستمر 2026</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
          >
            إغلاق الدليل
          </button>
        </div>
      </div>
    </div>
  );
};
