import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Sparkles,
  Layers,
  Activity,
  Calculator,
  PieChart,
  BookOpen,
  LineChart,
  ShieldCheck,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  TrendingUp,
  Zap,
  Target,
  FileText,
  Bell,
  Scale,
  Compass,
  Users,
  Newspaper,
  Bot,
  Image as ImageIcon,
  Flame,
  Play,
  Pause,
  FileSpreadsheet,
  Download,
  MessageSquare,
  Globe,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  X,
  Coins,
  Landmark,
} from 'lucide-react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { exportMasterComprehensiveAllStocksExcel, exportPriceAuditToExcel } from './services/excelExportService';
import { EGXStock, WatchlistCategory, MarketSessionStatus } from './types/stock';
import { fetchLiveEgxStocks } from './services/marketDataService';
import { Header } from './components/Header';
import { GlobalMarketsTab } from './components/GlobalMarketsTab';
import { MarketComparisonTab } from './components/MarketComparisonTab';
import { GlobalMarketAlertToast } from './components/GlobalMarketAlertToast';
import { MarketIndicatorAlert } from './types/globalMarket';
import { EgyptGoldTickerBar } from './components/EgyptGoldTickerBar';
import { DailyEgxMarketStatusBar } from './components/DailyEgxMarketStatusBar';
import { LiveTickerTape } from './components/LiveTickerTape';
import { LiveOpportunitiesTape } from './components/LiveOpportunitiesTape';
import { BarsVisibilityControlBar } from './components/BarsVisibilityControlBar';
import { UnifiedMarketCommandRibbon } from './components/UnifiedMarketCommandRibbon';
import { TopQuickAccessToolbar } from './components/TopQuickAccessToolbar';
import { getEgxMarketStatus } from './utils/marketHours';
import { WatchlistSelector } from './components/WatchlistSelector';
import { StockTable } from './components/StockTable';
import { TradingViewWidget } from './components/TradingViewWidget';
import { MomentumMatrixCard } from './components/MomentumMatrixCard';
import { ShariahStocksTab } from './components/ShariahStocksTab';
import { EgxIndicesAnalystTab } from './components/EgxIndicesAnalystTab';
import { AdvancedRadarsTab } from './components/AdvancedRadarsTab';
import { DailyAnalysisReportTab } from './components/DailyAnalysisReportTab';
import { AlertsManagerTab } from './components/AlertsManagerTab';
import { TechnicalAnalystTab } from './components/TechnicalAnalystTab';
import { DivergenceRadarTab } from './components/DivergenceRadarTab';
import { AsoMarketIndicator } from './components/AsoMarketIndicator';
import { InvestorCategoriesTab } from './components/InvestorCategoriesTab';
import { EgxNewsTab } from './components/EgxNewsTab';
import { TechnicalAdvisorModal } from './components/TechnicalAdvisorModal';
import { ChartImageAnalyzerModal } from './components/ChartImageAnalyzerModal';
import { GoogleAiNewsModal } from './components/GoogleAiNewsModal';
import { PythonBackendModal } from './components/PythonBackendModal';
import { ShariahScreeningGuideModal } from './components/ShariahScreeningGuideModal';
import { StockDetailsModal } from './components/StockDetailsModal';
import { ComprehensiveStockReportModal } from './components/ComprehensiveStockReportModal';
import { UserAlertsModal } from './components/UserAlertsModal';
import { DailyAnalysisReportModal } from './components/DailyAnalysisReportModal';
import { DirectChartAnalysisModal } from './components/DirectChartAnalysisModal';
import { AiStockChatDrawer } from './components/AiStockChatDrawer';
import { DcaCalculator } from './components/DcaCalculator';
import { SmartStockStudyTerminal } from './components/SmartStockStudyTerminal';
import { SectorsOverview } from './components/SectorsOverview';
import { AnalystForecastsWidget } from './components/AnalystForecastsWidget';
import { TradeManagementTab } from './components/TradeManagementTab';
import { PortfolioJournalTab } from './components/PortfolioJournalTab';
import { loadPortfolioAccount, savePortfolioAccount } from './services/portfolioService';
import { PortfolioAccount } from './types/portfolio';
import { auth } from './services/firebase';
import {
  FirestoreUserAlert,
  subscribeToUserAlerts,
  subscribeToUserWatchlist,
  getOrGenerateDailyReport,
  DailyReportData,
  saveUserAlert,
  toggleAlertStatus,
  deleteUserAlert,
} from './services/userFirestoreService';
import { playBullishAlertSound, playSonarPingSound } from './services/soundAlerts';
import {
  scanInstitutionalLiquidityAlerts,
  getNewUnseenLiquidityAlerts,
  markLiquidityAlertsAsSeen,
  InstitutionalLiquidityAlert,
} from './services/institutionalLiquidityAlertService';
import { LiveLiquidityAlertsDrawer } from './components/LiveLiquidityAlertsDrawer';
import { FloatingLiquidityAlertToast } from './components/FloatingLiquidityAlertToast';
import { CopiedSymbolToast } from './components/CopiedSymbolToast';
import { SmartUserGuideModal } from './components/SmartUserGuideModal';
import { WelcomeModal } from './components/WelcomeModal';
import { SystemHealthDiagnosticModal } from './components/SystemHealthDiagnosticModal';
import { DayTradingAnalystTab } from './components/DayTradingAnalystTab';
import { MobileBottomNav } from './components/MobileBottomNav';
import {
  runFullSystemDiagnostics,
  SystemHealthReport,
  getStoredHealthReport,
  getHealthCheckIntervalSec,
  setHealthCheckIntervalSec,
  autoRepairSystem,
  AUTO_REPAIR_THRESHOLD_PCT,
} from './services/systemHealthService';

const DEFAULT_FAVORITES = [
  'TMGH',
  'SWDY',
  'FWRY',
  'ABUK',
  'MFPC',
  'AMOC',
  'ESRS',
  'EGAL',
  'ETEL',
  'ADIB',
  'FAIT',
  'JUFO',
  'DOMT',
  'SUGR',
  'ISPH',
  'PHDC',
];

export default function App() {
  const [stocks, setStocks] = useState<EGXStock[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('جاري التحديث...');
  const [isLiveFeed, setIsLiveFeed] = useState<boolean>(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('TMGH');
  const [activeCategory, setActiveCategory] = useState<WatchlistCategory>('ALL');
  const [shariahOnly, setShariahOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'liquidity' | 'gainers' | 'losers' | 'price'>('liquidity');

  // Main Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    | 'WATCHLIST'
    | 'SHARIAH'
    | 'INDICES_ANALYST'
    | 'GLOBAL_MARKETS'
    | 'GOLD_MARKET'
    | 'MARKET_COMPARISON'
    | 'TECHNICAL_ANALYST'
    | 'TRADE_MANAGEMENT'
    | 'PORTFOLIO'
    | 'ASO_REGIME'
    | 'DIVERGENCE'
    | 'RADARS'
    | 'INVESTOR_CATEGORIES'
    | 'NEWS'
    | 'DAILY_REPORT'
    | 'ALERTS'
    | 'CHART'
    | 'DCA'
    | 'SECTORS'
    | 'DAY_TRADING'
    | 'SMART_BUY_STUDY'
  >('WATCHLIST');

  // Real-time Global Indicator Alert Toast State
  const [activeGlobalToastAlert, setActiveGlobalToastAlert] = useState<MarketIndicatorAlert | null>(null);

  // Live Market Hours & Session Status State
  const [sessionStatus, setSessionStatus] = useState<MarketSessionStatus>(() => getEgxMarketStatus());

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionStatus(getEgxMarketStatus());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Navigation Tabs Category Filter State
  const [activeTabCategory, setActiveTabCategory] = useState<
    'ALL' | 'TRADING' | 'AI' | 'RADARS' | 'PORTFOLIO' | 'GLOBAL'
  >('ALL');

  // Screen Display Scale / Zoom state supporting full range (from 70% up to 125%)
  const [zoomLevel, setZoomLevel] = useState<string>(() => {
    return localStorage.getItem('egx_zoom_level') || '100';
  });

  const handleZoomLevelChange = (level: string) => {
    setZoomLevel(level);
    localStorage.setItem('egx_zoom_level', level);
  };

  // Mobile Mode & Device Viewport State (خيار وضع الموبايل المخصص)
  const [deviceMode, setDeviceMode] = useState<'AUTO' | 'MOBILE' | 'DESKTOP'>(() => {
    try {
      const stored = localStorage.getItem('egx_device_mode');
      if (stored === 'AUTO' || stored === 'MOBILE' || stored === 'DESKTOP') return stored;
    } catch {}
    return 'AUTO';
  });

  const [isScreenMobile, setIsScreenMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsScreenMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileView = deviceMode === 'MOBILE' || (deviceMode === 'AUTO' && isScreenMobile);

  const handleToggleDeviceMode = () => {
    setDeviceMode((prev) => {
      const next = prev === 'MOBILE' ? 'DESKTOP' : 'MOBILE';
      try {
        localStorage.setItem('egx_device_mode', next);
      } catch {}
      return next;
    });
  };

  // Live Bars Visibility State
  const [showGoldBar, setShowGoldBar] = useState<boolean>(() => {
    const saved = localStorage.getItem('egx_bar_gold_visible');
    return saved !== null ? saved === 'true' : true;
  });

  const [showMarketStatusBar, setShowMarketStatusBar] = useState<boolean>(() => {
    const saved = localStorage.getItem('egx_bar_market_status_visible');
    return saved !== null ? saved === 'true' : false;
  });

  const [showPriceTicker, setShowPriceTicker] = useState<boolean>(() => {
    const saved = localStorage.getItem('egx_bar_price_ticker_visible');
    return saved !== null ? saved === 'true' : false;
  });

  const [showOpportunitiesTape, setShowOpportunitiesTape] = useState<boolean>(() => {
    const saved = localStorage.getItem('egx_bar_opportunities_visible');
    return saved !== null ? saved === 'true' : false;
  });

  const [showNavTabsBar, setShowNavTabsBar] = useState<boolean>(() => {
    const saved = localStorage.getItem('egx_bar_nav_tabs_visible');
    return saved !== null ? saved === 'true' : false;
  });

  const [showWatchlistCategoriesBar, setShowWatchlistCategoriesBar] = useState<boolean>(() => {
    const saved = localStorage.getItem('egx_bar_watchlist_categories_visible');
    return saved !== null ? saved === 'true' : false;
  });

  const handleToggleGoldBar = () => {
    setShowGoldBar((prev) => {
      const next = !prev;
      localStorage.setItem('egx_bar_gold_visible', String(next));
      return next;
    });
  };

  const handleToggleMarketStatusBar = () => {
    setShowMarketStatusBar((prev) => {
      const next = !prev;
      localStorage.setItem('egx_bar_market_status_visible', String(next));
      return next;
    });
  };

  const handleTogglePriceTicker = () => {
    setShowPriceTicker((prev) => {
      const next = !prev;
      localStorage.setItem('egx_bar_price_ticker_visible', String(next));
      return next;
    });
  };

  const handleToggleOpportunitiesTape = () => {
    setShowOpportunitiesTape((prev) => {
      const next = !prev;
      localStorage.setItem('egx_bar_opportunities_visible', String(next));
      return next;
    });
  };

  const handleToggleNavTabsBar = () => {
    setShowNavTabsBar((prev) => {
      const next = !prev;
      localStorage.setItem('egx_bar_nav_tabs_visible', String(next));
      return next;
    });
  };

  const handleToggleWatchlistCategoriesBar = () => {
    setShowWatchlistCategoriesBar((prev) => {
      const next = !prev;
      localStorage.setItem('egx_bar_watchlist_categories_visible', String(next));
      return next;
    });
  };

  const handleShowAllBars = () => {
    setShowGoldBar(true);
    setShowMarketStatusBar(true);
    setShowPriceTicker(true);
    setShowOpportunitiesTape(true);
    setShowNavTabsBar(true);
    setShowWatchlistCategoriesBar(true);
    localStorage.setItem('egx_bar_gold_visible', 'true');
    localStorage.setItem('egx_bar_market_status_visible', 'true');
    localStorage.setItem('egx_bar_price_ticker_visible', 'true');
    localStorage.setItem('egx_bar_opportunities_visible', 'true');
    localStorage.setItem('egx_bar_nav_tabs_visible', 'true');
    localStorage.setItem('egx_bar_watchlist_categories_visible', 'true');
  };

  const handleHideAllBars = () => {
    setShowGoldBar(false);
    setShowMarketStatusBar(false);
    setShowPriceTicker(false);
    setShowOpportunitiesTape(false);
    setShowNavTabsBar(false);
    setShowWatchlistCategoriesBar(false);
    localStorage.setItem('egx_bar_gold_visible', 'false');
    localStorage.setItem('egx_bar_market_status_visible', 'false');
    localStorage.setItem('egx_bar_price_ticker_visible', 'false');
    localStorage.setItem('egx_bar_opportunities_visible', 'false');
    localStorage.setItem('egx_bar_nav_tabs_visible', 'false');
    localStorage.setItem('egx_bar_watchlist_categories_visible', 'false');
  };

  const handleResetDefaultBars = () => {
    setShowGoldBar(true);
    setShowMarketStatusBar(true);
    setShowPriceTicker(false); // Default: hidden
    setShowOpportunitiesTape(true);
    setShowNavTabsBar(true);
    setShowWatchlistCategoriesBar(true);
    localStorage.setItem('egx_bar_gold_visible', 'true');
    localStorage.setItem('egx_bar_market_status_visible', 'true');
    localStorage.setItem('egx_bar_price_ticker_visible', 'false');
    localStorage.setItem('egx_bar_opportunities_visible', 'true');
    localStorage.setItem('egx_bar_nav_tabs_visible', 'true');
    localStorage.setItem('egx_bar_watchlist_categories_visible', 'true');
  };

  // Ref for Navigation Tabs ribbon horizontal scrolling
  const navTabsRef = useRef<HTMLDivElement>(null);

  // Smart Portfolio Account & Journal State
  const [portfolioAccount, setPortfolioAccount] = useState<PortfolioAccount>(() =>
    loadPortfolioAccount()
  );

  // Firebase Auth & Firestore User Data State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userAlerts, setUserAlerts] = useState<FirestoreUserAlert[]>([]);
  const [dailyReport, setDailyReport] = useState<DailyReportData | null>(null);

  // Modals state
  const [isShariahGuideOpen, setIsShariahGuideOpen] = useState(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [isDailyReportModalOpen, setIsDailyReportModalOpen] = useState(false);
  const [selectedStockForModal, setSelectedStockForModal] = useState<EGXStock | null>(null);
  const [selectedStockForReport, setSelectedStockForReport] = useState<EGXStock | null>(null);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [isChartVisionOpen, setIsChartVisionOpen] = useState(false);
  const [chartVisionPreloadedImage, setChartVisionPreloadedImage] = useState<string | null>(null);
  const [advisorTargetSymbol, setAdvisorTargetSymbol] = useState<string>('TMGH');
  const [isGoogleNewsOpen, setIsGoogleNewsOpen] = useState(false);
  const [googleNewsTargetSymbol, setGoogleNewsTargetSymbol] = useState<string>('TMGH');

  // Direct AI Chart Analysis from TradingView screen without image
  const [isDirectChartAiOpen, setIsDirectChartAiOpen] = useState<boolean>(false);
  const [directChartSymbol, setDirectChartSymbol] = useState<string>('TMGH');

  // Global Free-form AI Stock Chat Sidebar Drawer
  const [isGlobalStockChatOpen, setIsGlobalStockChatOpen] = useState<boolean>(false);

  // Real-time Institutional Liquidity Alerts (ADV-20 Spike)
  const [isLiquidityDrawerOpen, setIsLiquidityDrawerOpen] = useState<boolean>(false);
  const [isLiquiditySoundMuted, setIsLiquiditySoundMuted] = useState<boolean>(false);
  const [activeToastAlert, setActiveToastAlert] = useState<InstitutionalLiquidityAlert | null>(null);

  // Smart User Guidebook modal state
  const [isUserGuideOpen, setIsUserGuideOpen] = useState<boolean>(false);

  // Welcome Screen Modal state (shown by default on first visit)
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(() => {
    return localStorage.getItem('has_seen_egx_welcome') !== 'true';
  });

  // Python Backend Code Viewer modal state
  const [isPythonBackendOpen, setIsPythonBackendOpen] = useState<boolean>(false);

  // System Health & Diagnostics state (Default: 30 minutes = 1800s)
  const [isHealthModalOpen, setIsHealthModalOpen] = useState<boolean>(false);
  const [healthReport, setHealthReport] = useState<SystemHealthReport | null>(() => getStoredHealthReport());
  const [healthAutoCheckInterval, setHealthAutoCheckInterval] = useState<number>(() => getHealthCheckIntervalSec());
  const [healthCountdownSeconds, setHealthCountdownSeconds] = useState<number>(() => getHealthCheckIntervalSec());

  const handleHealthIntervalChange = (newSec: number) => {
    setHealthAutoCheckInterval(newSec);
    setHealthCountdownSeconds(newSec);
    setHealthCheckIntervalSec(newSec);
  };

  // Automated self-healing watchdog state (< 90% health)
  const [isAutoRepairing, setIsAutoRepairing] = useState<boolean>(false);
  const [autoRepairToast, setAutoRepairToast] = useState<{
    id: string;
    messageAr: string;
    scoreBefore: number;
    scoreAfter: number;
    repairedCount: number;
    actions: string[];
    timestamp: string;
  } | null>(null);
  const lastAutoRepairRef = useRef<number>(0);

  // Auto-refresh interval state in seconds (Default: 60 = 1 minute as requested)
  const [refreshInterval, setRefreshInterval] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('egx_market_refresh_interval');
      if (stored !== null) {
        const val = parseInt(stored, 10);
        if (!isNaN(val)) return val;
      }
    } catch (e) {
      console.warn('Could not read refresh interval', e);
    }
    return 60; // Default: every 1 minute
  });

  const [countdownSeconds, setCountdownSeconds] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('egx_market_refresh_interval');
      if (stored !== null) {
        const val = parseInt(stored, 10);
        if (!isNaN(val) && val > 0) return val;
      }
    } catch {}
    return 60;
  });

  const handleRefreshIntervalChange = (newInterval: number) => {
    setRefreshInterval(newInterval);
    setCountdownSeconds(newInterval);
    try {
      localStorage.setItem('egx_market_refresh_interval', newInterval.toString());
    } catch (e) {
      console.warn('Could not save refresh interval', e);
    }
  };

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('egx_user_favorites');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Could not read favorites from localStorage', e);
    }
    return DEFAULT_FAVORITES;
  });

  // Track Firebase Auth Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to user Firestore alerts & watchlist (with local guest fallback)
  useEffect(() => {
    if (!currentUser) {
      try {
        const stored = localStorage.getItem('egx_guest_alerts');
        if (stored) {
          setUserAlerts(JSON.parse(stored));
          return;
        }
      } catch (e) {
        console.warn('Failed to parse guest alerts', e);
      }
      setUserAlerts([]);
      return;
    }

    const unsubAlerts = subscribeToUserAlerts(currentUser.uid, (alerts) => {
      setUserAlerts(alerts);
    });

    const unsubWatchlist = subscribeToUserWatchlist(currentUser.uid, (cloudSymbols) => {
      if (cloudSymbols.length > 0) {
        setFavorites((prev) => Array.from(new Set([...prev, ...cloudSymbols])));
      }
    });

    return () => {
      unsubAlerts();
      unsubWatchlist();
    };
  }, [currentUser]);

  const handleQuickSaveAlert = async (
    alertData: Omit<FirestoreUserAlert, 'id' | 'userId' | 'createdAt'>
  ) => {
    if (currentUser) {
      await saveUserAlert(currentUser.uid, alertData);
    } else {
      const alertId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newAlert: FirestoreUserAlert = {
        ...alertData,
        id: alertId,
        userId: 'guest',
        createdAt: new Date().toISOString(),
      };
      setUserAlerts((prev) => {
        const next = [newAlert, ...prev];
        try {
          localStorage.setItem('egx_guest_alerts', JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  };

  const handleQuickToggleAlert = async (alertId: string, currentActive: boolean) => {
    if (currentUser) {
      await toggleAlertStatus(currentUser.uid, alertId, !currentActive);
    } else {
      setUserAlerts((prev) => {
        const next = prev.map((a) =>
          a.id === alertId ? { ...a, isActive: !currentActive } : a
        );
        try {
          localStorage.setItem('egx_guest_alerts', JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  };

  const handleQuickDeleteAlert = async (alertId: string) => {
    if (currentUser) {
      await deleteUserAlert(currentUser.uid, alertId);
    } else {
      setUserAlerts((prev) => {
        const next = prev.filter((a) => a.id !== alertId);
        try {
          localStorage.setItem('egx_guest_alerts', JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  };

  const toggleFavorite = (sym: string) => {
    const clean = sym.trim().toUpperCase();
    const updated = favorites.includes(clean)
      ? favorites.filter((s) => s !== clean)
      : [...favorites, clean];
    setFavorites(updated);
    try {
      localStorage.setItem('egx_user_favorites', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save favorites', e);
    }
  };

  const handleOpenAdvisor = (symbol?: string) => {
    if (symbol) {
      setAdvisorTargetSymbol(symbol);
    } else if (selectedSymbol) {
      setAdvisorTargetSymbol(selectedSymbol);
    }
    setIsAdvisorOpen(true);
  };

  // Load stock data from TradingView scanner
  const loadMarketData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchLiveEgxStocks();
      if (res.stocks && res.stocks.length > 0) {
        setStocks(res.stocks);
        setLastUpdated(res.lastUpdated);
        setIsLiveFeed(res.isLive);

        // Generate / Update daily report
        const rep = await getOrGenerateDailyReport(res.stocks);
        setDailyReport(rep);
      }
    } catch (err) {
      console.error('Error fetching EGX market data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMarketData();
  }, [loadMarketData]);

  // Initial & periodic full system health diagnostics (Default: 30 minutes = 1800s)
  useEffect(() => {
    if (stocks.length > 0 && !healthReport) {
      runFullSystemDiagnostics(stocks).then((rep) => setHealthReport(rep));
    }
  }, [stocks]);

  useEffect(() => {
    if (healthAutoCheckInterval <= 0) return;
    const healthTimer = setInterval(() => {
      runFullSystemDiagnostics(stocks).then((rep) => {
        setHealthReport(rep);
        setHealthCountdownSeconds(healthAutoCheckInterval);
      });
    }, healthAutoCheckInterval * 1000);
    return () => clearInterval(healthTimer);
  }, [stocks, healthAutoCheckInterval]);

  // Automated self-healing watchdog: Triggers auto-diagnostics & auto-repair when health score drops below 90% (< 90%)
  useEffect(() => {
    if (!healthReport || stocks.length === 0 || isAutoRepairing) return;

    if (healthReport.overallScore < AUTO_REPAIR_THRESHOLD_PCT) {
      const now = Date.now();
      // 45 seconds cooldown between auto-repairs to prevent loops
      if (now - lastAutoRepairRef.current < 45000) return;

      lastAutoRepairRef.current = now;
      setIsAutoRepairing(true);

      const scoreBefore = healthReport.overallScore;

      autoRepairSystem(stocks)
        .then((result) => {
          setHealthReport(result.refreshedReport);
          setAutoRepairToast({
            id: `repair_${Date.now()}`,
            messageAr: `تم تفعيل الفحص والإصلاح الآلي الذاتي بنجاح نظراً لانخفاض كفاءة النظام عن 90% (${scoreBefore}%). تم تصحيح وإعادة موازنة ${result.repairedActionsAr.length} عمليات، وارتفعت كفاءة النظام إلى ${result.refreshedReport.overallScore}%.`,
            scoreBefore,
            scoreAfter: result.refreshedReport.overallScore,
            repairedCount: result.repairedActionsAr.length,
            actions: result.repairedActionsAr,
            timestamp: new Date().toLocaleTimeString('ar-EG'),
          });
          playBullishAlertSound();
        })
        .catch((err) => {
          console.error('Automated health repair error:', err);
        })
        .finally(() => {
          setIsAutoRepairing(false);
        });
    }
  }, [healthReport, stocks, isAutoRepairing]);

  // 1-second countdown ticker for the 30-minute system health check
  useEffect(() => {
    if (healthAutoCheckInterval <= 0) return;
    const healthTicker = setInterval(() => {
      setHealthCountdownSeconds((prev) => {
        if (prev <= 1) {
          return healthAutoCheckInterval;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(healthTicker);
  }, [healthAutoCheckInterval]);

  // Auto-sync interval based on user-chosen interval (Default: 60 seconds = 1 minute)
  useEffect(() => {
    if (refreshInterval <= 0) return; // Manual only, no auto-refresh

    const timer = setInterval(() => {
      loadMarketData();
      setCountdownSeconds(refreshInterval);
    }, refreshInterval * 1000);

    return () => clearInterval(timer);
  }, [loadMarketData, refreshInterval]);

  // 1-second countdown ticker for the UI
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const ticker = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(ticker);
  }, [refreshInterval]);

  // Real-time Institutional Liquidity Alerts (Volume > 20-Day Average Volume)
  const liquidityAlerts = useMemo(
    () => scanInstitutionalLiquidityAlerts(stocks, 1.0),
    [stocks]
  );

  // Audio chime & Floating Toast notification for new institutional liquidity spikes
  useEffect(() => {
    if (stocks.length === 0 || liquidityAlerts.length === 0) return;
    const unseen = getNewUnseenLiquidityAlerts(liquidityAlerts);
    if (unseen.length > 0) {
      const topSpike = unseen[0];
      setActiveToastAlert(topSpike);
      if (!isLiquiditySoundMuted) {
        playSonarPingSound();
      }
      markLiquidityAlertsAsSeen(unseen.map((u) => u.id));
    }
  }, [liquidityAlerts, isLiquiditySoundMuted, stocks.length]);

  // Filtered & Sorted Stocks for the General Watchlist
  const displayedStocks = useMemo(() => {
    let list = [...stocks];

    switch (activeCategory) {
      case 'SHARIAH':
        list = list.filter((s) => s.isShariahCompliant);
        break;
      case 'INSTITUTIONAL_LIQUIDITY': {
        const spikeSymbols = new Set(liquidityAlerts.map((a) => a.symbol));
        list = list.filter((s) => spikeSymbols.has(s.symbol));
        break;
      }
      case 'EGX30':
        list = list.filter((s) => s.isInEgx30);
        break;
      case 'EGX70':
        list = list.filter((s) => s.isInEgx70);
        break;
      case 'EGX100':
        list = list.filter((s) => s.isInEgx100);
        break;
      case 'FAVORITES':
        list = list.filter((s) => favorites.includes(s.symbol));
        break;
      case 'MOST_ACTIVE':
        list = list.sort((a, b) => (b.valueTraded || 0) - (a.valueTraded || 0)).slice(0, 30);
        break;
      case 'GAINERS':
        list = list.filter((s) => s.changePct > 0).sort((a, b) => b.changePct - a.changePct);
        break;
      case 'LOSERS':
        list = list.filter((s) => s.changePct < 0).sort((a, b) => a.changePct - b.changePct);
        break;
      case 'ALL':
      default:
        break;
    }

    if (shariahOnly && activeCategory !== 'SHARIAH') {
      list = list.filter((s) => s.isShariahCompliant);
    }

    if (activeCategory !== 'GAINERS' && activeCategory !== 'LOSERS') {
      if (sortBy === 'liquidity') {
        list.sort((a, b) => (b.valueTraded || 0) - (a.valueTraded || 0));
      } else if (sortBy === 'gainers') {
        list.sort((a, b) => b.changePct - a.changePct);
      } else if (sortBy === 'losers') {
        list.sort((a, b) => a.changePct - b.changePct);
      } else if (sortBy === 'price') {
        list.sort((a, b) => b.price - a.price);
      }
    }

    return list;
  }, [stocks, activeCategory, shariahOnly, sortBy, favorites, liquidityAlerts]);

  // Category Counts
  const counts = useMemo(() => {
    return {
      shariah: stocks.filter((s) => s.isShariahCompliant).length,
      egx30: stocks.filter((s) => s.isInEgx30).length,
      egx70: stocks.filter((s) => s.isInEgx70).length,
      egx100: stocks.filter((s) => s.isInEgx100).length,
      all: stocks.length,
      favorites: stocks.filter((s) => favorites.includes(s.symbol)).length,
      institutionalLiquidity: liquidityAlerts.length,
    };
  }, [stocks, favorites, liquidityAlerts]);

  const activeStock = stocks.find((s) => s.symbol === selectedSymbol) || stocks[0];
  const directChartStock = useMemo(() => {
    return stocks.find((s) => s.symbol === directChartSymbol) || activeStock || stocks[0];
  }, [stocks, directChartSymbol, activeStock]);

  type NavigationTabCategory = 'ALL' | 'TRADING' | 'AI' | 'RADARS' | 'PORTFOLIO' | 'GLOBAL';

  interface AppTabDefinition {
    id: typeof activeTab;
    label: string;
    category: NavigationTabCategory;
    badge?: string;
    badgeStyle?: string;
    icon: React.ComponentType<{ className?: string }>;
  }

  const allNavigationTabs: AppTabDefinition[] = useMemo(
    () => [
      {
        id: 'WATCHLIST',
        label: 'قوائم البورصة العامة',
        category: 'TRADING',
        badge: `${displayedStocks.length}`,
        icon: Layers,
      },
      {
        id: 'SHARIAH',
        label: 'مؤشر الشريعة',
        category: 'TRADING',
        badge: `${counts.shariah}`,
        badgeStyle: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        icon: Sparkles,
      },
      {
        id: 'INDICES_ANALYST',
        label: 'تحليل المؤشرات (30 و 33 و 70 و 100)',
        category: 'TRADING',
        badge: 'مؤشرات 🏛️',
        badgeStyle: 'bg-gradient-to-r from-cyan-950 to-teal-950 text-cyan-300 border-cyan-700/60 font-bold',
        icon: Landmark,
      },
      {
        id: 'CHART',
        label: 'الشارت اللحظي',
        category: 'TRADING',
        badge: activeStock?.symbol,
        badgeStyle: 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-mono',
        icon: LineChart,
      },
      {
        id: 'SECTORS',
        label: 'قطاعات السوق',
        category: 'TRADING',
        icon: PieChart,
      },
      {
        id: 'DCA',
        label: 'حاسبة DCA',
        category: 'TRADING',
        icon: Calculator,
      },
      {
        id: 'TECHNICAL_ANALYST',
        label: 'المحلل الفني ومناطق التجميع',
        category: 'AI',
        badge: 'التجميع والمتوسطات 🎯',
        badgeStyle: 'bg-cyan-950 text-cyan-300 border-cyan-800',
        icon: Compass,
      },
      {
        id: 'DAY_TRADING',
        label: 'محلل وماسح المضاربة',
        category: 'AI',
        badge: 'خطط SMC ⚡',
        badgeStyle: 'bg-amber-950 text-amber-300 border-amber-800',
        icon: Flame,
      },
      {
        id: 'NEWS',
        label: 'الأخبار وروابط إنفستنج',
        category: 'AI',
        badge: 'روابط ↗',
        badgeStyle: 'bg-teal-950 text-teal-300 border-teal-800',
        icon: Newspaper,
      },
      {
        id: 'DAILY_REPORT',
        label: 'التقرير اليومي الآلي',
        category: 'AI',
        icon: FileText,
      },
      {
        id: 'RADARS',
        label: 'الرواصد الفنية الأربعة',
        category: 'RADARS',
        icon: Target,
      },
      {
        id: 'DIVERGENCE',
        label: 'راصد الدايفرجنس',
        category: 'RADARS',
        badge: '8 مؤشرات ⚡',
        badgeStyle: 'bg-indigo-950 text-indigo-300 border-indigo-800',
        icon: Zap,
      },
      {
        id: 'ASO_REGIME',
        label: 'مؤشر حالة السوق (ASO)',
        category: 'RADARS',
        badge: 'ميزان القوى 🔥',
        badgeStyle: 'bg-amber-950 text-amber-300 border-amber-800',
        icon: Activity,
      },
      {
        id: 'ALERTS',
        label: 'تنبيهات الأسعار',
        category: 'RADARS',
        badge: userAlerts.length > 0 ? `${userAlerts.length}` : undefined,
        badgeStyle: 'bg-rose-950 text-rose-300 border-rose-800 font-mono',
        icon: Bell,
      },
      {
        id: 'TRADE_MANAGEMENT',
        label: 'إدارة الصفقات والوقف',
        category: 'PORTFOLIO',
        badge: 'مباشر 🚀',
        badgeStyle: 'bg-emerald-950 text-emerald-300 border-emerald-800',
        icon: Target,
      },
      {
        id: 'PORTFOLIO',
        label: 'سجل المحفظة الذكية',
        category: 'PORTFOLIO',
        badge: 'رأس المال 💼',
        badgeStyle: 'bg-cyan-950 text-cyan-300 border-cyan-800',
        icon: Layers,
      },
      {
        id: 'GLOBAL_MARKETS',
        label: 'الأسواق العالمية والنفط',
        category: 'GLOBAL',
        badge: 'مباشر 🌐',
        badgeStyle: 'bg-teal-950 text-teal-300 border-teal-800',
        icon: Globe,
      },
      {
        id: 'GOLD_MARKET',
        label: 'بورصة الذهب والصاغة',
        category: 'GLOBAL',
        badge: 'iSagha مباشر 🪙',
        badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold',
        icon: Coins,
      },
      {
        id: 'MARKET_COMPARISON',
        label: 'مقارنة الأسواق بالشارت',
        category: 'GLOBAL',
        icon: ArrowLeftRight,
      },
      {
        id: 'INVESTOR_CATEGORIES',
        label: 'فئات المستثمرين والمؤسسات',
        category: 'GLOBAL',
        icon: Users,
      },
    ],
    [displayedStocks.length, counts.shariah, activeStock?.symbol, userAlerts.length]
  );

  const tabCategories: { id: NavigationTabCategory; label: string; count: number; icon: string }[] = [
    { id: 'ALL', label: 'الكل', count: 19, icon: '🌟' },
    { id: 'TRADING', label: 'التداول والأسهم', count: 5, icon: '📊' },
    { id: 'AI', label: 'الذكاء الاصطناعي', count: 4, icon: '🤖' },
    { id: 'RADARS', label: 'الرواصد الفنية', count: 4, icon: '⚡' },
    { id: 'PORTFOLIO', label: 'المحفظة والصفقات', count: 2, icon: '💼' },
    { id: 'GLOBAL', label: 'الأسواق والذهب', count: 4, icon: '🌐' },
  ];

  const filteredNavigationTabs = useMemo(() => {
    if (activeTabCategory === 'ALL') return allNavigationTabs;
    return allNavigationTabs.filter((t) => t.category === activeTabCategory);
  }, [allNavigationTabs, activeTabCategory]);

  const handleExportPriceAuditExcel = useCallback(() => {
    try {
      exportPriceAuditToExcel(stocks);
      window.dispatchEvent(
        new CustomEvent('egx-stock-symbol-copied', {
          detail: { symbol: `تم بنجاح تصدير شيت إكسل تدقيق أسعار الشارت والتقارير لـ ${stocks.length} سهم 📊` },
        })
      );
    } catch (err) {
      console.error('Failed to export price audit excel:', err);
    }
  }, [stocks]);

  return (
    <div
      className="min-h-screen bg-[#070a0f] text-slate-100 flex flex-col font-['Cairo',sans-serif] selection:bg-cyan-500/30 selection:text-cyan-300 transition-[zoom] duration-200"
      style={{
        zoom: (parseInt(zoomLevel, 10) || 100) / 100,
      }}
    >
      {/* Top Header */}
      <Header
        stocks={stocks}
        selectedSymbol={selectedSymbol}
        zoomLevel={zoomLevel}
        onZoomLevelChange={handleZoomLevelChange}
        onOpenEgyptianMarket={() => setActiveTab('WATCHLIST')}
        isEgyptianMarketActive={activeTab === 'WATCHLIST'}
        onSelectStock={(sym) => {
          setSelectedSymbol(sym);
          setAdvisorTargetSymbol(sym);
          setActiveTab('CHART');
        }}
        onSelectStockForTab={(sym, tab) => {
          setSelectedSymbol(sym);
          setAdvisorTargetSymbol(sym);
          setActiveTab(tab as any);
        }}
        onOpenAdvisorWithSymbol={(sym) => {
          setSelectedSymbol(sym);
          handleOpenAdvisor(sym);
        }}
        onOpenReportWithStock={(stk) => {
          setSelectedSymbol(stk.symbol);
          setAdvisorTargetSymbol(stk.symbol);
          setSelectedStockForReport(stk);
        }}
        isLoading={isLoading}
        onRefresh={loadMarketData}
        lastUpdated={lastUpdated}
        shariahOnly={shariahOnly}
        onToggleShariahOnly={() => setShariahOnly(!shariahOnly)}
        onOpenShariahGuide={() => setIsShariahGuideOpen(true)}
        currentUser={currentUser}
        onOpenAlertsModal={() => setIsAlertsModalOpen(true)}
        onOpenLiquidityAlerts={() => setIsLiquidityDrawerOpen(true)}
        liquidityAlertsCount={liquidityAlerts.length}
        onOpenDailyReportModal={() => setIsDailyReportModalOpen(true)}
        onOpen360Report={() => activeStock && setSelectedStockForReport(activeStock)}
        onOpenAdvisor={() => handleOpenAdvisor(selectedSymbol)}
        onOpenGoldMarket={() => {
          setShowGoldBar(true);
          setActiveTab('GOLD_MARKET');
        }}
        onOpenChartVision={() => setIsChartVisionOpen(true)}
        onOpenGoogleAiNews={() => {
          setGoogleNewsTargetSymbol(selectedSymbol);
          setIsGoogleNewsOpen(true);
        }}
        onOpenGoogleAiNewsWithSymbol={(sym) => {
          setSelectedSymbol(sym);
          setGoogleNewsTargetSymbol(sym);
          setIsGoogleNewsOpen(true);
        }}
        onOpenStockChat={() => setIsGlobalStockChatOpen(true)}
        onSelectIndexCategory={(cat) => {
          setActiveCategory(cat);
          setActiveTab('WATCHLIST');
        }}
        alertsCount={userAlerts.length}
        refreshInterval={refreshInterval}
        onRefreshIntervalChange={handleRefreshIntervalChange}
        countdownSeconds={countdownSeconds}
        onOpenPythonBackend={() => setIsPythonBackendOpen(true)}
        onOpenUserGuide={() => setIsUserGuideOpen(true)}
        onOpenWelcomeModal={() => setIsWelcomeModalOpen(true)}
        onOpenHealthModal={() => setIsHealthModalOpen(true)}
        healthScore={healthReport?.overallScore ?? 100}
        onExportMasterExcel={() => exportMasterComprehensiveAllStocksExcel(stocks)}
        onExportPriceAuditExcel={handleExportPriceAuditExcel}
        isMobileMode={isMobileView}
        onToggleMobileMode={handleToggleDeviceMode}
      />

      {/* Unified Semantic Market Command Ribbon (يجمع التبويبات والتصنيفات والأشرطة في قوائم منسدلة ذكية موحدة) */}
      <UnifiedMarketCommandRibbon
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        counts={counts}
        sortBy={sortBy}
        onSortChange={setSortBy}
        shariahOnly={shariahOnly}
        onToggleShariahOnly={() => setShariahOnly(!shariahOnly)}
        barsVisibility={{
          showGoldBar,
          showMarketStatusBar,
          showPriceTicker,
          showOpportunitiesTape,
        }}
        onToggleGoldBar={handleToggleGoldBar}
        onToggleMarketStatusBar={handleToggleMarketStatusBar}
        onTogglePriceTicker={handleTogglePriceTicker}
        onToggleOpportunitiesTape={handleToggleOpportunitiesTape}
        onShowAllBars={handleShowAllBars}
        onHideAllBars={handleHideAllBars}
        onResetDefaultBars={handleResetDefaultBars}
        session={sessionStatus}
        lastUpdated={lastUpdated}
        refreshInterval={refreshInterval}
        onRefreshIntervalChange={handleRefreshIntervalChange}
        countdownSeconds={countdownSeconds}
        onRefresh={loadMarketData}
        isLoading={isLoading}
      />

      {/* 1. Egyptian Gold Market Snapshot Bar (عيار 21، 24، الجنيه الذهب، الأونصة، والتحوط) */}
      {showGoldBar && (
        <div className="max-w-[1850px] w-full mx-auto px-2 sm:px-4 lg:px-6 pt-2">
          <EgyptGoldTickerBar onClose={handleToggleGoldBar} />
        </div>
      )}

      {/* 2. Cairo Market Hours & Feed Status Bar with User-Controlled Refresh Interval & Health Badge */}
      {showMarketStatusBar && (
        <DailyEgxMarketStatusBar
          lastUpdated={lastUpdated}
          totalStocksCount={stocks.length}
          shariahCount={counts.shariah}
          isLiveFeed={isLiveFeed}
          onRefresh={loadMarketData}
          isLoading={isLoading}
          refreshInterval={refreshInterval}
          onRefreshIntervalChange={handleRefreshIntervalChange}
          countdownSeconds={countdownSeconds}
          onOpenHealthModal={() => setIsHealthModalOpen(true)}
          healthScore={healthReport?.overallScore ?? 100}
          healthStatus={healthReport?.overallLevel ?? 'OPTIMAL'}
          onOpenUserGuide={() => setIsUserGuideOpen(true)}
          onNavigateToDayTradingScanner={() => setActiveTab('DAY_TRADING')}
          onSelectCategory={(cat) => {
            setActiveCategory(cat);
            setActiveTab('WATCHLIST');
          }}
          stocks={stocks}
          onClose={handleToggleMarketStatusBar}
        />
      )}

      {/* 3. Continuous Real-time Price Ticker Tape (مخفي افتراضياً لتوفير المساحة) */}
      {showPriceTicker && (
        <LiveTickerTape
          stocks={stocks}
          selectedSymbol={selectedSymbol}
          onSelectStock={(sym) => {
            setSelectedSymbol(sym);
            setAdvisorTargetSymbol(sym);
            setActiveTab('CHART');
          }}
          isLoading={isLoading}
          onClose={handleTogglePriceTicker}
        />
      )}

      {/* 4. Live Opportunities Ticker Tape (شريط الفرص اللحظية ورادار السيولة الذكية) */}
      {showOpportunitiesTape && (
        <LiveOpportunitiesTape
          stocks={stocks}
          selectedSymbol={selectedSymbol}
          onSelectStock={(sym) => {
            setSelectedSymbol(sym);
            setAdvisorTargetSymbol(sym);
          }}
          onSelectStockForChart={(sym) => {
            setSelectedSymbol(sym);
            setAdvisorTargetSymbol(sym);
            setActiveTab('CHART');
          }}
          onNavigateToScanner={() => {
            setActiveTab('DAY_TRADING');
          }}
          shariahOnly={shariahOnly}
          onOpenAdvisorWithSymbol={(sym) => handleOpenAdvisor(sym)}
          onOpenReportWithStock={(stk) => setSelectedStockForReport(stk)}
          onClose={handleToggleOpportunitiesTape}
        />
      )}

      {/* Main Container */}
      <main className={`flex-1 max-w-[1850px] w-full mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-5 ${isMobileView ? 'pb-28' : 'pb-24 md:pb-6'}`}>
        {/* Top Quick Access Navigation Hub (صفين الأيقونات في المقدمة بترتيب ونظام أنيق) */}
        <TopQuickAccessToolbar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          onOpenChartVision={() => setIsChartVisionOpen(true)}
          onOpenShariahGuide={() => setIsShariahGuideOpen(true)}
          onOpenUserGuide={() => setIsUserGuideOpen(true)}
          onOpenHealthModal={() => setIsHealthModalOpen(true)}
          isMobileMode={isMobileView}
          onToggleMobileMode={handleToggleDeviceMode}
        />

        {/* Harmonized Navigation Command Hub with Category Filters & Stable Horizontal Scroll */}
        {showNavTabsBar && (
          <div className="space-y-2 border-b border-slate-800/80 pb-3">
            {/* Row 1: Category Filter Pills */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {tabCategories.map((cat) => {
                  const isActive = activeTabCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveTabCategory(cat.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer active:scale-95 border ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500/25 to-teal-500/20 text-cyan-300 border-cyan-400/60 shadow-sm shadow-cyan-500/20'
                          : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                          isActive
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Close Navigation Bar Toggle Button */}
              <button
                onClick={handleToggleNavTabsBar}
                className="p-1 rounded-xl bg-slate-900/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800/60 transition-colors shrink-0 cursor-pointer text-xs flex items-center gap-1 px-2"
                title="إخفاء شريط التبويبات الرئيسي (يمكنك إعادته بأي وقت من شريط مفاتيح الأشرطة)"
              >
                <X className="w-3 h-3" />
                <span className="text-[10px] hidden sm:inline">إخفاء التبويبات</span>
              </button>
            </div>

            {/* Row 2: Clean, Stable Horizontal Scrollable Tab Strip */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => navTabsRef.current?.scrollBy({ left: -260, behavior: 'smooth' })}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors shrink-0 cursor-pointer shadow-sm"
                title="تمرير التبويبات لليمين"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <div
                dir="rtl"
                ref={navTabsRef}
                className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 py-1 scroll-smooth"
              >
                {filteredNavigationTabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer border ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500/20 via-teal-500/20 to-emerald-500/15 text-cyan-300 border-cyan-400/60 shadow-md shadow-cyan-500/15 font-black scale-[1.02]'
                          : 'bg-slate-900/60 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-cyan-400' : 'text-slate-400'
                        }`}
                      />
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${
                            tab.badgeStyle ||
                            'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => navTabsRef.current?.scrollBy({ left: 260, behavior: 'smooth' })}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors shrink-0 cursor-pointer shadow-sm"
                title="تمرير التبويبات لليسار"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: GENERAL WATCHLIST */}
        {activeTab === 'WATCHLIST' && (
          <div className="space-y-4">
            {/* Watchlist Categories Carousel (الشريط الثاني بالصورة) */}
            {showWatchlistCategoriesBar && (
              <WatchlistSelector
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
                counts={counts}
                sortBy={sortBy}
                onSortChange={setSortBy}
                shariahOnly={shariahOnly}
                onClose={handleToggleWatchlistCategoriesBar}
              />
            )}

            <StockTable
              stocks={displayedStocks}
              selectedSymbol={selectedSymbol}
              onSelectStock={(sym) => {
                setSelectedSymbol(sym);
                setActiveTab('CHART');
              }}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onOpenStockDetails={(s) => setSelectedStockForModal(s)}
              onOpenDetailedReport={(stock) => setSelectedStockForReport(stock)}
              onOpenChart={(sym) => {
                setSelectedSymbol(sym);
                setActiveTab('CHART');
              }}
              onOpenGoogleAiNews={(sym) => {
                setSelectedSymbol(sym);
                setGoogleNewsTargetSymbol(sym);
                setIsGoogleNewsOpen(true);
              }}
              onOpenDirectChartAi={(stock) => {
                setSelectedSymbol(stock.symbol);
                setDirectChartSymbol(stock.symbol);
                setIsDirectChartAiOpen(true);
              }}
              userAlerts={userAlerts}
              onSaveAlert={handleQuickSaveAlert}
              onToggleAlert={handleQuickToggleAlert}
              onDeleteAlert={handleQuickDeleteAlert}
              isLoggedIn={Boolean(currentUser)}
              onOpenAuthModal={() => setIsAlertsModalOpen(true)}
              isMobileMode={isMobileView}
              onToggleMobileMode={handleToggleDeviceMode}
            />
          </div>
        )}

        {/* Tab 2: SEPARATE DEDICATED SHARIAH STOCKS LIST */}
        {activeTab === 'SHARIAH' && (
          <ShariahStocksTab
            stocks={stocks}
            selectedSymbol={selectedSymbol}
            onSelectStock={(sym) => {
              setSelectedSymbol(sym);
              setActiveTab('CHART');
            }}
            onOpenDetailedReport={(stock) => setSelectedStockForReport(stock)}
            onOpenShariahGuide={() => setIsShariahGuideOpen(true)}
            onOpenChart={(sym) => {
              setSelectedSymbol(sym);
              setActiveTab('CHART');
            }}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {/* Tab: INDICES_ANALYST (التحليل المستقل لمؤشرات البورصة العامة 30 و 33 و 70 و 100) */}
        {activeTab === 'INDICES_ANALYST' && (
          <div className="space-y-6 animate-fadeIn">
            <EgxIndicesAnalystTab
              stocks={stocks}
              onSelectStockForChart={(sym) => {
                setSelectedSymbol(sym);
                setActiveTab('CHART');
              }}
              onOpenReportModal={(stock) => setSelectedStockForReport(stock)}
              onOpenAdvisor={(sym) => handleOpenAdvisor(sym)}
            />
          </div>
        )}

        {/* Tab: GLOBAL MARKETS & MOVING AVERAGES (الأسواق العالمية والمتوسطات) */}
        {activeTab === 'GLOBAL_MARKETS' && (
          <GlobalMarketsTab
            onSelectStockForChart={(sym) => {
              setSelectedSymbol(sym);
              setActiveTab('CHART');
            }}
            onOpenAdvisor={(sym) => handleOpenAdvisor(sym)}
            onOpenEgyptianMarket={() => setActiveTab('WATCHLIST')}
          />
        )}

        {/* Tab: GOLD_MARKET (منصة وأداة الذهب المتكاملة - الصاغة المصرية والأسواق العالمية) */}
        {activeTab === 'GOLD_MARKET' && (
          <div className="space-y-6 animate-fadeIn">
            <EgyptGoldTickerBar
              onOpenGlobalChart={(sym) => {
                setSelectedSymbol(sym);
                setActiveTab('CHART');
              }}
            />
          </div>
        )}

        {/* Tab: MARKET COMPARISON (مقارنة الأسواق في شارت موحد) */}
        {activeTab === 'MARKET_COMPARISON' && (
          <MarketComparisonTab
            stocks={stocks}
            onSelectStockForChart={(sym) => {
              setSelectedSymbol(sym);
              setActiveTab('CHART');
            }}
            onOpenAdvisor={(sym) => handleOpenAdvisor(sym)}
          />
        )}

        {/* Tab 3: TECHNICAL ANALYST (RSI, Stochastic, MACD, SuperTrend) */}
        {activeTab === 'TECHNICAL_ANALYST' && (
          <TechnicalAnalystTab
            stocks={stocks}
            selectedSymbol={selectedSymbol}
            onSelectStock={(sym) => {
              setSelectedSymbol(sym);
            }}
            onSelectStockForChart={(sym) => {
              setSelectedSymbol(sym);
              setActiveTab('CHART');
            }}
            onOpenReportModal={(stock) => setSelectedStockForReport(stock)}
            onOpenAdvisor={(sym) => handleOpenAdvisor(sym)}
            shariahOnly={shariahOnly}
            onToggleShariahOnly={() => setShariahOnly(!shariahOnly)}
          />
        )}

        {/* Tab: TRADE MANAGEMENT LIFECYCLE */}
        {activeTab === 'TRADE_MANAGEMENT' && (
          <TradeManagementTab
            stocks={stocks}
            selectedSymbol={selectedSymbol}
            onSelectStock={(sym) => {
              setSelectedSymbol(sym);
              setAdvisorTargetSymbol(sym);
            }}
            portfolio={portfolioAccount}
            onUpdatePortfolio={(upd) => {
              setPortfolioAccount(upd);
              savePortfolioAccount(upd);
            }}
            onSwitchToPortfolioTab={() => setActiveTab('PORTFOLIO')}
            onOpenAdvisor={(sym) => handleOpenAdvisor(sym)}
          />
        )}

        {/* Tab: AI DAY-TRADING ANALYST (XAUUSD & EGX STOCKS) (Requested) */}
        {activeTab === 'DAY_TRADING' && (
          <DayTradingAnalystTab
            stocks={stocks}
            selectedSymbol={selectedSymbol}
            onSelectStock={(sym) => {
              setSelectedSymbol(sym);
              setAdvisorTargetSymbol(sym);
            }}
            onSelectStockForChart={(sym) => {
              setSelectedSymbol(sym);
              setAdvisorTargetSymbol(sym);
              setActiveTab('CHART');
            }}
          />
        )}

        {/* Tab: SMART PORTFOLIO JOURNAL */}
        {activeTab === 'PORTFOLIO' && (
          <PortfolioJournalTab
            stocks={stocks}
            portfolio={portfolioAccount}
            onUpdatePortfolio={(upd) => {
              setPortfolioAccount(upd);
              savePortfolioAccount(upd);
            }}
            onSelectStock={(sym) => {
              setSelectedSymbol(sym);
              setAdvisorTargetSymbol(sym);
            }}
            onSwitchToTradeManagement={() => setActiveTab('TRADE_MANAGEMENT')}
          />
        )}

        {/* Tab: ASO MARKET REGIME & SENTIMENT OSCILLATOR */}
        {activeTab === 'ASO_REGIME' && (
          <AsoMarketIndicator
            stocks={stocks}
            onSelectStock={(sym) => {
              setSelectedSymbol(sym);
              setActiveTab('CHART');
            }}
            onOpenReportModal={(stock) => setSelectedStockForReport(stock)}
          />
        )}

        {/* Tab 4: DIVERGENCE RADAR (8 Indicators & Detection Dates) */}
        {activeTab === 'DIVERGENCE' && (
          <DivergenceRadarTab
            stocks={stocks}
            onSelectStockForChart={(sym) => {
              setSelectedSymbol(sym);
              setActiveTab('CHART');
            }}
            onOpenReportModal={(stock) => setSelectedStockForReport(stock)}
            onOpenAdvisor={(sym) => handleOpenAdvisor(sym)}
            shariahOnly={shariahOnly}
            onToggleShariahOnly={() => setShariahOnly(!shariahOnly)}
          />
        )}

        {/* Tab 5: THE 4 ADVANCED RADARS */}
        {activeTab === 'RADARS' && (
          <AdvancedRadarsTab
            stocks={stocks}
            onSelectStockForChart={(sym) => {
              setSelectedSymbol(sym);
              setActiveTab('CHART');
            }}
            onOpenDetailedReport={(stock) => setSelectedStockForReport(stock)}
            shariahOnly={shariahOnly}
            onToggleShariahOnly={() => setShariahOnly(!shariahOnly)}
          />
        )}

        {/* Tab 6: INVESTOR CATEGORIES & NET FLOWS */}
        {activeTab === 'INVESTOR_CATEGORIES' && (
          <InvestorCategoriesTab
            stocks={stocks}
            onSelectStockForChart={(sym) => {
              setSelectedSymbol(sym);
              setActiveTab('CHART');
            }}
            onOpenReportModal={(stock) => setSelectedStockForReport(stock)}
            onOpenAdvisor={(sym) => handleOpenAdvisor(sym)}
          />
        )}

        {/* Tab 7: VERIFIED ACCURATE NEWS SOURCES */}
        {activeTab === 'NEWS' && (
          <EgxNewsTab
            stocks={stocks}
            onSelectStockForChart={(sym) => {
              setSelectedSymbol(sym);
              setActiveTab('CHART');
            }}
            onOpenReportModal={(stock) => setSelectedStockForReport(stock)}
            onOpenAdvisor={(sym) => handleOpenAdvisor(sym)}
          />
        )}

        {/* Tab 8: DAILY AUTOMATED REPORT */}
        {activeTab === 'DAILY_REPORT' && dailyReport && (
          <DailyAnalysisReportTab
            report={dailyReport}
            stocks={stocks}
            onSelectStock={(sym) => {
              setSelectedSymbol(sym);
              setActiveTab('CHART');
            }}
            onOpenDetailedReport={(stock) => setSelectedStockForReport(stock)}
          />
        )}

        {/* Tab 9: ALERTS MANAGER & FIRESTORE */}
        {activeTab === 'ALERTS' && (
          <AlertsManagerTab
            currentUser={currentUser}
            alerts={userAlerts}
            stocks={stocks}
            selectedSymbol={selectedSymbol}
            onSelectStock={(sym) => {
              setSelectedSymbol(sym);
              setActiveTab('CHART');
            }}
          />
        )}

        {/* Tab 10: REAL-TIME TRADINGVIEW CHART */}
        {activeTab === 'CHART' && activeStock && (
          <div className="space-y-4">
            <TradingViewWidget
              stock={activeStock}
              liveStocks={stocks}
              onOpenShariahGuide={() => setIsShariahGuideOpen(true)}
              onOpenDetailedReport={(stock) => setSelectedStockForReport(stock)}
              onOpenDirectChartAi={(stk) => {
                setDirectChartSymbol(stk.symbol);
                setIsDirectChartAiOpen(true);
              }}
              onOpenChartVision={(img) => {
                setChartVisionPreloadedImage(img || null);
                setIsChartVisionOpen(true);
              }}
            />

            {/* شاشة ومصفوفة تقييم الزخم (Momentum Matrix Screen) مباشرة تحت الشارت - بناءً على طلب المستخدم والمرفق */}
            <MomentumMatrixCard
              stock={activeStock}
              timeframe="1D"
              onOpenChart={(sym) => {
                setSelectedSymbol(sym);
                setAdvisorTargetSymbol(sym);
              }}
              onOpenAdvisor={(sym) => handleOpenAdvisor(sym)}
            />

            {/* المكون الجديد تحت TradingViewWidget: آراء وتوقعات المحللين الماليين المعتمدين والمصادر المرتبطة بالسهم المختار مع ضمان الجلب والتحديث الدوري المنتظم */}
            <AnalystForecastsWidget
              stock={activeStock}
              onSelectRelatedStock={(sym) => {
                setSelectedSymbol(sym);
                setAdvisorTargetSymbol(sym);
              }}
            />

            {/* Quick Switcher Carousel below chart */}
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-bold block">
                تبديل سريع لأسهم مؤشر الشريعة الإسلامية:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {stocks
                  .filter((s) => s.isShariahCompliant)
                  .slice(0, 25)
                  .map((s) => (
                    <button
                      key={s.symbol}
                      onClick={() => setSelectedSymbol(s.symbol)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all shrink-0 ${
                        s.symbol === selectedSymbol
                          ? 'bg-emerald-500/25 border-emerald-500 text-white shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{s.symbol}</span>
                      <span className="text-[10px] text-emerald-400 mr-1.5">
                        {s.price.toFixed(1)}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 11: DCA CALCULATOR */}
        {activeTab === 'DCA' && (
          <DcaCalculator
            stocks={stocks}
            selectedSymbol={selectedSymbol}
            onSelectStock={setSelectedSymbol}
          />
        )}

        {/* Tab: SMART BUY STUDY TERMINAL (محدد أماكن الشراء الـ 3 والفحص الشامل) */}
        {activeTab === 'SMART_BUY_STUDY' && (
          <SmartStockStudyTerminal
            stocks={stocks}
            selectedSymbol={selectedSymbol}
            onSelectStock={setSelectedSymbol}
            onOpenAdvisor={(sym) => handleOpenAdvisor(sym)}
            onSwitchToDca={(sym) => {
              setSelectedSymbol(sym);
              setActiveTab('DCA');
            }}
          />
        )}

        {/* Tab 12: SECTORS BREAKDOWN */}
        {activeTab === 'SECTORS' && (
          <SectorsOverview
            stocks={stocks}
            onSelectSectorStock={(sym) => {
              setSelectedSymbol(sym);
              setActiveTab('CHART');
            }}
          />
        )}
      </main>

      {/* Unified Side-by-Side Floating AI Dock at bottom-left (Zero Overlap on Mobile) */}
      {!isGlobalStockChatOpen && !isMobileView && (
        <div className="fixed bottom-20 md:bottom-5 left-4 md:left-5 z-30 hidden sm:flex items-center gap-2.5 sm:gap-3 font-['Cairo'] flex-wrap">
          {/* Button 1: AI Technical Advisor */}
          <button
            onClick={() => handleOpenAdvisor(selectedSymbol)}
            className="bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-black text-xs sm:text-sm px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl shadow-2xl shadow-cyan-500/30 border border-cyan-400/50 flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 group cursor-pointer shrink-0"
            title="استشارة المستشار الفني الذكي المباشر (AI Technical Advisor)"
          >
            <div className="w-8 h-8 rounded-xl bg-black/30 flex items-center justify-center border border-cyan-300/30 shrink-0">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-200 group-hover:rotate-12 transition-transform" />
            </div>
            <div className="text-right">
              <span className="block text-[9px] sm:text-[10px] text-cyan-200 leading-none">مستشارك الفني</span>
              <span className="font-bold text-xs sm:text-sm whitespace-nowrap">المستشار المباشر 🤖</span>
            </div>
          </button>

          {/* Button 2: Free-form AI Stock Chat */}
          <button
            onClick={() => setIsGlobalStockChatOpen(true)}
            className="group flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl bg-gradient-to-r from-slate-950 via-cyan-950 to-slate-950 text-white border border-cyan-500/50 shadow-2xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
            title="افتح شريط المحادثة المباشر للاستفسارات الحرة عن الأسهم بالذكاء الاصطناعي"
          >
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shrink-0">
              <MessageSquare className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>

            <div className="text-right">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white whitespace-nowrap">
                <span>استفسار حر AI 💬</span>
                {activeStock && (
                  <span className="font-mono text-cyan-300 bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-500/40 text-[10px]">
                    {activeStock.symbol}
                  </span>
                )}
              </div>
              {activeStock && (
                <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono whitespace-nowrap">
                  <span>{activeStock.price.toFixed(2)} ج.م</span>
                  <span className={activeStock.changePct >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    ({activeStock.changePct >= 0 ? '+' : ''}{activeStock.changePct}%)
                  </span>
                </div>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (شريط التبويبات السفلي المخصص للموبايل واللمس) */}
      <MobileBottomNav
        activeTab={activeTab as any}
        onSelectTab={(tab) => setActiveTab(tab as any)}
        onOpenAdvisor={() => handleOpenAdvisor(selectedSymbol)}
        onOpenToolsMenu={() => setIsUserGuideOpen(true)}
        isMobileMode={isMobileView}
        onToggleMobileMode={handleToggleDeviceMode}
        unreadAlertsCount={userAlerts.length + (liquidityAlerts?.length || 0)}
      />

      {/* World-Class Footer */}
      <footer className="border-t border-slate-800/80 bg-[#06090e] py-6 px-2 sm:px-4 lg:px-6 text-xs text-slate-500 mt-auto font-['Cairo']">
        <div className="max-w-[1850px] w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-right">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-bold text-slate-200 text-sm">
                مستشار التداول والتحليل الفني الذكي
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                تحديث لحظي مؤكد
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              بيانات الأسعار اللحظية والإغلاقات مؤكدة عبر TradingView والمصادر الإخبارية المعتمدة وهيئة الرقابة المالية ومؤشر الشريعة والأسواق العالمية
            </p>
          </div>

          <div className="flex items-center gap-3 text-slate-400 font-medium flex-wrap justify-center text-[11px]">
            <span className="text-slate-600">منظومة الرقابة المالية والتداول الذكي</span>
            <span className="text-slate-700">·</span>
            <span className="text-emerald-400 font-bold">توقيت القاهرة GMT+2</span>
            <span className="text-slate-700">·</span>
            <span className="text-slate-400">جميع الحقوق محفوظة © 2026</span>
          </div>
        </div>
      </footer>

      {/* AI Technical Advisor Modal */}
      <TechnicalAdvisorModal
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        stocks={stocks}
        initialSymbol={advisorTargetSymbol}
        onSelectStock={(sym) => {
          setSelectedSymbol(sym);
          setAdvisorTargetSymbol(sym);
        }}
        onSelectStockForChart={(sym) => {
          setSelectedSymbol(sym);
          setAdvisorTargetSymbol(sym);
          setActiveTab('CHART');
        }}
        onOpenTradeManagement={(sym) => {
          setSelectedSymbol(sym);
          setAdvisorTargetSymbol(sym);
          setActiveTab('TRADE_MANAGEMENT');
        }}
      />

      {/* Google AI Search & News Analyst Modal */}
      <GoogleAiNewsModal
        isOpen={isGoogleNewsOpen}
        onClose={() => setIsGoogleNewsOpen(false)}
        stocks={stocks}
        initialSymbol={googleNewsTargetSymbol || selectedSymbol}
        onSelectStockForChart={(sym) => {
          setSelectedSymbol(sym);
          setAdvisorTargetSymbol(sym);
          setActiveTab('CHART');
        }}
        onOpenTradeManagement={(sym) => {
          setSelectedSymbol(sym);
          setAdvisorTargetSymbol(sym);
          setActiveTab('TRADE_MANAGEMENT');
        }}
      />

      {/* Chart Image Analyzer Modal (Gemini Vision) */}
      <ChartImageAnalyzerModal
        isOpen={isChartVisionOpen}
        onClose={() => {
          setIsChartVisionOpen(false);
          setChartVisionPreloadedImage(null);
        }}
        defaultSymbol={selectedSymbol}
        preloadedImage={chartVisionPreloadedImage}
        onOpenDirectChartAi={(sym) => {
          setDirectChartSymbol(sym);
          setIsDirectChartAiOpen(true);
        }}
      />

      {/* Direct TradingView AI Chart Analysis Modal without Images (Requested) */}
      {directChartStock && (
        <DirectChartAnalysisModal
          isOpen={isDirectChartAiOpen}
          onClose={() => setIsDirectChartAiOpen(false)}
          stock={directChartStock}
          onOpenDetailedReport={(stk) => {
            setSelectedStockForReport(stk);
            setIsDirectChartAiOpen(false);
          }}
          onOpenTradeManagement={(sym) => {
            setSelectedSymbol(sym);
            setAdvisorTargetSymbol(sym);
            setIsDirectChartAiOpen(false);
            setActiveTab('TRADE_MANAGEMENT');
          }}
        />
      )}

      {/* Shariah Screening Standards Modal */}
      <ShariahScreeningGuideModal
        isOpen={isShariahGuideOpen}
        onClose={() => setIsShariahGuideOpen(false)}
      />

      {/* Stock Deep Details Modal */}
      <StockDetailsModal
        stock={selectedStockForModal}
        isOpen={!!selectedStockForModal}
        onClose={() => setSelectedStockForModal(null)}
        onOpenChart={(sym) => {
          setSelectedSymbol(sym);
          setActiveTab('CHART');
        }}
        onOpenDetailedReport={(stock) => setSelectedStockForReport(stock)}
        onOpenAdvisor={(sym) => handleOpenAdvisor(sym)}
        isFavorite={selectedStockForModal ? favorites.includes(selectedStockForModal.symbol) : false}
        onToggleFavorite={toggleFavorite}
      />

      {/* Comprehensive 360 Stock Technical & Shariah Report Modal */}
      <ComprehensiveStockReportModal
        stock={selectedStockForReport}
        liveStocks={stocks}
        isOpen={!!selectedStockForReport}
        onClose={() => setSelectedStockForReport(null)}
        onOpenChart={(sym) => {
          setSelectedSymbol(sym);
          setActiveTab('CHART');
        }}
      />

      {/* User Alerts Configuration & Google Auth Modal */}
      <UserAlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        currentUser={currentUser}
        alerts={userAlerts}
        stocks={stocks}
        selectedSymbol={selectedSymbol}
      />

      {/* Daily Automated Analysis Market Report Modal */}
      {dailyReport && (
        <DailyAnalysisReportModal
          isOpen={isDailyReportModalOpen}
          onClose={() => setIsDailyReportModalOpen(false)}
          report={dailyReport}
          stocks={stocks}
        />
      )}

      {/* Welcome Screen Modal (Requested: pops up on first visit) */}
      <WelcomeModal
        isOpen={isWelcomeModalOpen}
        onClose={() => setIsWelcomeModalOpen(false)}
        onExploreFeature={(tab) => {
          setActiveTab(tab as any);
        }}
      />

      {/* Smart Interactive User Guidebook Modal (Requested) */}
      <SmartUserGuideModal
        isOpen={isUserGuideOpen}
        onClose={() => setIsUserGuideOpen(false)}
        onNavigateToTab={(tab) => {
          setActiveTab(tab as any);
          setIsUserGuideOpen(false);
        }}
        onOpenHealthModal={() => {
          setIsUserGuideOpen(false);
          setIsHealthModalOpen(true);
        }}
      />

      {/* System Health Diagnostics & Self-Healing Modal (Default: every 30 mins) (Requested) */}
      <SystemHealthDiagnosticModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        report={healthReport}
        stocks={stocks}
        onRefreshReport={(rep) => setHealthReport(rep)}
        countdownSeconds={healthCountdownSeconds}
        autoCheckInterval={healthAutoCheckInterval}
        onIntervalChange={handleHealthIntervalChange}
      />

      {/* Real-time Institutional Liquidity Alerts Drawer (ADV-20 Spike Monitor) */}
      <LiveLiquidityAlertsDrawer
        isOpen={isLiquidityDrawerOpen}
        onClose={() => setIsLiquidityDrawerOpen(false)}
        alerts={liquidityAlerts}
        stocks={stocks}
        isSoundMuted={isLiquiditySoundMuted}
        onToggleSound={() => setIsLiquiditySoundMuted((prev) => !prev)}
        onSelectStockForChart={(sym) => {
          setSelectedSymbol(sym);
          setAdvisorTargetSymbol(sym);
          setActiveTab('CHART');
          setIsLiquidityDrawerOpen(false);
        }}
        onOpenReportModal={(stock) => {
          setSelectedStockForReport(stock);
          setIsLiquidityDrawerOpen(false);
        }}
        onOpenAdvisor={(sym) => {
          handleOpenAdvisor(sym);
          setIsLiquidityDrawerOpen(false);
        }}
      />

      {/* Floating Bottom Notification Toast on New Institutional Spikes */}
      <FloatingLiquidityAlertToast
        alert={activeToastAlert}
        onOpenDrawer={() => {
          setActiveToastAlert(null);
          setIsLiquidityDrawerOpen(true);
        }}
        onSelectStockForChart={(sym) => {
          setSelectedSymbol(sym);
          setAdvisorTargetSymbol(sym);
          setActiveTab('CHART');
          setActiveToastAlert(null);
        }}
        onDismiss={() => setActiveToastAlert(null)}
      />

      {/* Floating Global Market Indicator Alert Toast (الأسواق العالمية والمتوسطات) */}
      <GlobalMarketAlertToast
        alert={activeGlobalToastAlert}
        onSelectAssetForChart={(sym) => {
          setActiveTab('GLOBAL_MARKETS');
          setActiveGlobalToastAlert(null);
        }}
        onDismiss={() => setActiveGlobalToastAlert(null)}
      />

      {/* Global Free-form AI Stock Chat Sidebar Drawer */}
      <AiStockChatDrawer
        isOpen={isGlobalStockChatOpen}
        onToggle={() => setIsGlobalStockChatOpen((prev) => !prev)}
        stocks={stocks}
        currentStock={activeStock}
        hideLauncherButton={true}
        onSelectStock={(sym) => {
          setSelectedSymbol(sym);
          setAdvisorTargetSymbol(sym);
        }}
      />
      {/* Floating Auto-Repair Watchdog Notification Toast (< 90% Self-Healing) */}
      {autoRepairToast && (
        <div className="fixed bottom-6 left-6 z-50 max-w-md bg-slate-950/95 border-2 border-emerald-500/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 font-['Cairo'] text-xs space-y-2.5">
          <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                🩺
              </div>
              <div>
                <strong className="text-white text-xs block">
                  التدخل الذاتي للنظام (الفحص والإصلاح الآلي):
                </strong>
                <span className="text-[10px] text-slate-400 font-mono">
                  {autoRepairToast.timestamp} | انخفضت الكفاءة عن 90%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-emerald-950 text-emerald-300 font-bold border border-emerald-800 text-[11px]">
                {autoRepairToast.scoreBefore}% ➔ {autoRepairToast.scoreAfter}% 🟢
              </span>
              <button
                onClick={() => setAutoRepairToast(null)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                title="إغلاق التنبيه"
              >
                ✕
              </button>
            </div>
          </div>

          <p className="text-slate-300 leading-relaxed font-sans">
            {autoRepairToast.messageAr}
          </p>

          <div className="flex items-center justify-between pt-1 text-[11px]">
            <span className="text-emerald-400 font-bold">
              ✓ تم إصلاح وإعادة تهيئة {autoRepairToast.repairedCount} وظائف
            </span>
            <button
              onClick={() => {
                setIsHealthModalOpen(true);
                setAutoRepairToast(null);
              }}
              className="text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer transition-colors"
            >
              عرض تقرير الفحص 🛡️
            </button>
          </div>
        </div>
      )}

      {/* Python Backend & API Source Code Explorer Modal */}
      <PythonBackendModal
        isOpen={isPythonBackendOpen}
        onClose={() => setIsPythonBackendOpen(false)}
      />
      {/* Global Floating Toast for Stock Symbol Copy */}
      <CopiedSymbolToast />
    </div>
  );
}
