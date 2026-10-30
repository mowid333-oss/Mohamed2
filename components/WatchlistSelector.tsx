import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Layers,
  TrendingUp,
  TrendingDown,
  Activity,
  Star,
  CheckCheck,
  Building2,
  DollarSign,
  Play,
  Pause,
  Zap,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { WatchlistCategory } from '../types/stock';

interface WatchlistSelectorProps {
  activeCategory: WatchlistCategory;
  onSelectCategory: (cat: WatchlistCategory) => void;
  counts: {
    shariah: number;
    egx30: number;
    egx70: number;
    egx100: number;
    all: number;
    favorites: number;
    institutionalLiquidity?: number;
  };
  sortBy: 'liquidity' | 'gainers' | 'losers' | 'price';
  onSortChange: (sort: 'liquidity' | 'gainers' | 'losers' | 'price') => void;
  shariahOnly: boolean;
  onClose?: () => void;
}

export const WatchlistSelector: React.FC<WatchlistSelectorProps> = ({
  activeCategory,
  onSelectCategory,
  counts,
  sortBy,
  onSortChange,
  shariahOnly,
  onClose,
}) => {
  const tabs: {
    id: WatchlistCategory;
    labelAr: string;
    icon: React.ReactNode;
    count: number;
    badgeStyle?: string;
  }[] = [
    {
      id: 'SHARIAH',
      labelAr: 'أسهم الشريعة الإسلامية (EGX Shariah)',
      icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />,
      count: counts.shariah,
      badgeStyle: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    {
      id: 'INSTITUTIONAL_LIQUIDITY',
      labelAr: '⚡ أسهم السيولة المؤسساتية (قفزة 20 يوم)',
      icon: <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />,
      count: counts.institutionalLiquidity ?? 0,
      badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      id: 'EGX30',
      labelAr: 'مؤشر EGX 30',
      icon: <Layers className="w-3.5 h-3.5 text-cyan-400" />,
      count: counts.egx30,
    },
    {
      id: 'EGX70',
      labelAr: 'مؤشر EGX 70 EWI',
      icon: <Layers className="w-3.5 h-3.5 text-blue-400" />,
      count: counts.egx70,
    },
    {
      id: 'EGX100',
      labelAr: 'مؤشر EGX 100 الأوسع',
      icon: <Layers className="w-3.5 h-3.5 text-indigo-400" />,
      count: counts.egx100,
    },
    {
      id: 'MOST_ACTIVE',
      labelAr: 'الأعلى سيولة وتداولاً',
      icon: <Activity className="w-3.5 h-3.5 text-amber-400" />,
      count: 25,
    },
    {
      id: 'GAINERS',
      labelAr: 'الأكثر صعوداً اليوم',
      icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />,
      count: 20,
    },
    {
      id: 'LOSERS',
      labelAr: 'الأكثر تراجعاً',
      icon: <TrendingDown className="w-3.5 h-3.5 text-rose-400" />,
      count: 20,
    },
    {
      id: 'FAVORITES',
      labelAr: 'قائمتي المفضلة',
      icon: <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />,
      count: counts.favorites,
    },
    {
      id: 'ALL',
      labelAr: 'كافة أسهم السوق (290+)',
      icon: <Building2 className="w-3.5 h-3.5 text-slate-400" />,
      count: counts.all,
    },
  ];

  const [isPaused, setIsPaused] = useState(false);

  const renderTabButton = (tab: typeof tabs[0], keySuffix: string) => {
    const isActive = activeCategory === tab.id;
    const isAmber = tab.id === 'INSTITUTIONAL_LIQUIDITY';

    return (
      <button
        key={`${tab.id}-${keySuffix}`}
        dir="rtl"
        onClick={() => onSelectCategory(tab.id)}
        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
          isActive
            ? isAmber
              ? 'bg-gradient-to-r from-amber-500/25 to-orange-500/25 text-amber-200 border border-amber-400/60 shadow-md shadow-amber-500/25'
              : 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-200 border border-emerald-400/60 shadow-md shadow-emerald-500/20'
            : isAmber
              ? 'bg-amber-950/30 border border-amber-500/35 text-amber-300 hover:text-white hover:border-amber-400 hover:bg-amber-900/40'
              : 'bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800'
        }`}
      >
        {tab.icon}
        <span>{tab.labelAr}</span>
        <span
          className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
            isActive
              ? isAmber
                ? 'bg-amber-500/30 text-amber-100 border border-amber-400/50'
                : 'bg-emerald-500/30 text-emerald-100 border border-emerald-400/40'
              : isAmber
                ? 'bg-amber-900/50 text-amber-300 border border-amber-700/50'
                : 'bg-slate-800 text-slate-400'
          }`}
        >
          {tab.count}
        </span>
      </button>
    );
  };

  const trackRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (trackRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      trackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-3">
      {/* Category Tabs Moving Ribbon (شريط تصنيفات وقوائم الأسهم والمؤشرات) */}
      <div className="flex items-center gap-1.5 sm:gap-2 bg-[#080d16] p-1.5 rounded-2xl border border-slate-800/80 shadow-sm">
        {/* Play / Pause Controller */}
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors shrink-0 cursor-pointer shadow-sm"
          title={isPaused ? 'استئناف حركة شريط تصنيفات الأسهم' : 'إيقاف حركة شريط التصنيفات مؤقتاً'}
        >
          {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
        </button>

        {/* Manual Arrow Scroll (Right Side) */}
        <button
          onClick={() => handleScroll('right')}
          className="p-1 sm:p-1.5 text-slate-400 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-lg cursor-pointer transition-colors shrink-0 shadow-sm"
          title="تمرير التصنيفات لليمين"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Continuous Seamless Moving Track */}
        <div
          dir="ltr"
          ref={trackRef}
          className="relative overflow-x-auto no-scrollbar flex-1 group marquee-track scroll-smooth"
          onWheel={(e) => {
            if (trackRef.current) {
              trackRef.current.scrollLeft += e.deltaY;
            }
          }}
        >
          <div
            className={`flex items-center gap-2 will-change-transform flex-nowrap ${
              isPaused ? 'ticker-paused' : 'animate-categories-marquee'
            }`}
          >
            {/* Set A */}
            {tabs.map((tab) => renderTabButton(tab, 'set-a'))}
            {/* Set B (Duplicate for Endless Seamless Continuous Loop) */}
            {tabs.map((tab) => renderTabButton(tab, 'set-b'))}
          </div>
        </div>

        {/* Manual Arrow Scroll (Left Side) */}
        <button
          onClick={() => handleScroll('left')}
          className="p-1 sm:p-1.5 text-slate-400 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-lg cursor-pointer transition-colors shrink-0 shadow-sm"
          title="تمرير التصنيفات لليسار"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Close / Hide Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 sm:p-1.5 text-slate-400 hover:text-rose-400 bg-slate-900/90 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-800 rounded-lg cursor-pointer transition-colors shrink-0 shadow-sm"
            title="إخفاء شريط تصنيفات وقوائم الأسهم"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Secondary Sort & Quick Metric Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-bold text-[11px]">ترتيب القائمة حسب:</span>
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => onSortChange('liquidity')}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                sortBy === 'liquidity'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              السيولة وقيمة التداول
            </button>
            <button
              onClick={() => onSortChange('gainers')}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                sortBy === 'gainers'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              الأعلى صعوداً %
            </button>
            <button
              onClick={() => onSortChange('losers')}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                sortBy === 'losers'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              الأكثر انخفاضاً %
            </button>
            <button
              onClick={() => onSortChange('price')}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                sortBy === 'price'
                  ? 'bg-slate-800 text-cyan-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              سعر السهم
            </button>
          </div>
        </div>

        {shariahOnly && (
          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/25">
            <Sparkles className="w-3.5 h-3.5" />
            <span>يتم الآن استعراض أسهم الشريعة الإسلامية حصراً</span>
          </div>
        )}

        {activeCategory === 'INSTITUTIONAL_LIQUIDITY' && (
          <div className="flex items-center gap-1.5 text-amber-300 text-[11px] font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
            <span>يتم الآن استعراض الأسهم التي تشهد تنبيه سيولة مؤسساتية نشط (حجم التداول تجاوز متوسط 20 يوم)</span>
          </div>
        )}
      </div>
    </div>
  );
};
