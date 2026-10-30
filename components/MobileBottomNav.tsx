import React from 'react';
import {
  Layers,
  LineChart,
  Coins,
  Flame,
  Bot,
  Grid,
  Sparkles,
  Smartphone,
  Monitor,
  Menu,
} from 'lucide-react';
import { TabType } from '../types/stock';

interface MobileBottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenAdvisor: () => void;
  onOpenToolsMenu: () => void;
  isMobileMode: boolean;
  onToggleMobileMode: () => void;
  unreadAlertsCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenAdvisor,
  onOpenToolsMenu,
  isMobileMode,
  onToggleMobileMode,
  unreadAlertsCount = 0,
}) => {
  const navButtons = [
    {
      id: 'WATCHLIST' as TabType,
      label: 'الأسهم',
      icon: Layers,
      isActive: activeTab === 'WATCHLIST' || activeTab === 'SHARIAH',
    },
    {
      id: 'CHART' as TabType,
      label: 'الشارت',
      icon: LineChart,
      isActive: activeTab === 'CHART',
    },
    {
      id: 'GOLD_MARKET' as TabType,
      label: 'الذهب 🪙',
      icon: Coins,
      isActive: activeTab === 'GOLD_MARKET',
      highlightColor: 'text-amber-400',
    },
    {
      id: 'DAY_TRADING' as TabType,
      label: 'المضاربة',
      icon: Flame,
      isActive: activeTab === 'DAY_TRADING',
      highlightColor: 'text-orange-400',
    },
  ];

  return (
    <div
      dir="rtl"
      className={`fixed bottom-0 left-0 right-0 z-40 bg-[#070b14]/95 backdrop-blur-xl border-t border-slate-800 shadow-[0_-8px_30px_rgba(0,0,0,0.7)] px-2 py-1.5 font-['Cairo'] select-none safe-area-bottom ${
        isMobileMode ? 'block' : 'block md:hidden'
      }`}
    >
      <div className="max-w-md mx-auto flex items-center justify-around gap-1">
        {/* Navigation Tabs */}
        {navButtons.map((btn) => {
          const Icon = btn.icon;
          return (
            <button
              key={btn.id}
              type="button"
              onClick={() => onSelectTab(btn.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
                btn.isActive
                  ? 'text-cyan-300 bg-cyan-950/50 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 ${
                    btn.isActive ? btn.highlightColor || 'text-cyan-400' : 'text-slate-400'
                  }`}
                />
                {btn.isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium leading-none">
                {btn.label}
              </span>
            </button>
          );
        })}

        {/* AI Advisor Direct Trigger */}
        <button
          type="button"
          onClick={onOpenAdvisor}
          className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-white"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-cyan-600/30">
            <Bot className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold text-cyan-300 tracking-tight leading-none">
            المستشار
          </span>
        </button>

        {/* Tools Menu Trigger */}
        <button
          type="button"
          onClick={onOpenToolsMenu}
          className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-white relative"
        >
          <div className="relative">
            <Grid className="w-5 h-5 text-slate-300" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium leading-none">
            الأدوات
          </span>
        </button>

        {/* Device Mode Toggle Button (Mobile/Desktop) */}
        <button
          type="button"
          onClick={onToggleMobileMode}
          className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-amber-300"
          title={isMobileMode ? 'التبديل إلى وضع سطح المكتب الكامل' : 'التبديل إلى وضع الموبايل المخصص'}
        >
          {isMobileMode ? (
            <Smartphone className="w-5 h-5 text-amber-400" />
          ) : (
            <Monitor className="w-5 h-5 text-slate-400" />
          )}
          <span className="text-[9px] mt-0.5 font-bold text-amber-300 tracking-tight leading-none">
            {isMobileMode ? 'موبايل 📱' : 'ديسكتوب'}
          </span>
        </button>
      </div>
    </div>
  );
};
