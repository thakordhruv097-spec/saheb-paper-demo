import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { useDateFilter } from '../context/DateFilterContext';
import { CustomDatePickerModal } from './CustomDatePickerModal';
import { getRawMaterials, getReels, getPendingOrders } from '../data/index';
import {
  LayoutDashboard,
  Warehouse,
  Factory,
  Cog,
  RotateCw,
  Package,
  QrCode,
  Search,
  Settings,
  LogOut,
  Sun,
  Moon,
  Globe,
  Menu,
  X,
  ChevronDown,
  User,
  Shield,
  Flame,
  Droplet,
  Lightbulb,
  Truck,
  BarChart2,
  Wrench,
  GitBranch,
  FileText,
  Bell,
  FlaskConical,
  Layers,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Beaker,
  Tag,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, hasAccess, updateUserProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('saheb_theme') === 'dark';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Dropdown states for mobile compatibility
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  // Global Date & Timeframe Filter Context (Only active for Admin & Management)
  const { timeframe, setTimeframe, selectedDate, setSelectedDate, handlePrevDate, handleNextDate, systemToday } = useDateFilter();
  const [isDatePickerModalOpen, setIsDatePickerModalOpen] = useState(false);

  // Profile Modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileDisplayName, setProfileDisplayName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profilePin, setProfilePin] = useState('');
  const [profileSecurityQuestion, setProfileSecurityQuestion] = useState('What is your favorite color?');
  const [profileSecurityAnswer, setProfileSecurityAnswer] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  const openProfileModal = () => {
    if (user) {
      setProfileDisplayName(user.displayName);
      setProfileEmail(user.email || '');
      setProfilePhone(user.phone || '');
      setProfilePin(user.pin || '');
      setProfileSecurityQuestion(user.securityQuestion || 'What is your favorite color?');
      setProfileSecurityAnswer(user.securityAnswer || '');
    }
    setIsProfileModalOpen(true);
    setProfileDropdownOpen(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileDisplayName.trim()) return;

    const success = await updateUserProfile({
      displayName: profileDisplayName,
      email: profileEmail,
      phone: profilePhone,
      pin: profilePin,
      securityQuestion: profileSecurityQuestion,
      securityAnswer: profileSecurityAnswer,
    });

    if (success) {
      setProfileSaveSuccess(true);
      setTimeout(() => {
        setProfileSaveSuccess(false);
        setIsProfileModalOpen(false);
      }, 1000);
    }
  };

  // Lock background body scroll when profile modal is open
  useEffect(() => {
    if (isProfileModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isProfileModalOpen]);

  const [showBottomNav, setShowBottomNav] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);
  const mainRef = useRef<HTMLElement | null>(null);
  const headerDatePickerRef = useRef<HTMLDivElement | null>(null);

  // Auto-hide top header & bottom nav bar on scroll down, show on scroll up
  useEffect(() => {
    const mainEl = mainRef.current;

    const handleScroll = () => {
      const mainScroll = mainEl ? mainEl.scrollTop : 0;
      const windowScroll = window.scrollY || document.documentElement.scrollTop || 0;
      const currentScrollY = Math.max(mainScroll, windowScroll);

      // Threshold: only trigger if scroll distance is greater than 8px
      const diff = Math.abs(currentScrollY - lastScrollY.current);
      if (diff < 8) return;

      if (currentScrollY <= 15) {
        setShowBottomNav(true);
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY.current) {
        setShowBottomNav(false);
        setShowHeader(false);
      } else {
        setShowBottomNav(true);
        setShowHeader(true);
      }

      lastScrollY.current = currentScrollY;
    };

    if (mainEl) {
      mainEl.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (mainEl) {
        mainEl.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Reset navigation visibility and scroll position on route change to ALWAYS open at the very top of the page
  useEffect(() => {
    setShowBottomNav(true);
    setShowHeader(true);
    lastScrollY.current = 0;

    const resetScroll = () => {
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScroll();

    // Microtask & macrotask fallbacks to guarantee scroll reset even after async route/DOM updates
    const timer1 = setTimeout(resetScroll, 0);
    const timer2 = setTimeout(resetScroll, 40);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [location.pathname, location.search]);

  // Click away handlers for dropdown menu states
  useEffect(() => {
    const handleOutsideClick = () => {
      setLangDropdownOpen(false);
      setProfileDropdownOpen(false);
      setBellOpen(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Lock body scroll when mobile menu is open to prevent background scrolling
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Define Ordered Mobile Tabs (Home -> Production -> Scan -> Dispatch -> More)
  const mobileTabs = useMemo(() => {
    let prodPath = '/machine-production';
    if (user?.role === 'PulpOperator') prodPath = '/pulp-mill-operations';
    else if (user?.role === 'BoilerOperator') prodPath = '/utilities-etp?tab=boiler';
    else if (user?.role === 'RewinderOperator') prodPath = '/rewinding-reel-conversion';
    else if (user?.role === 'EtpOperator') prodPath = '/utilities-etp?tab=etp';

    return [
      { id: 'home', path: '/', label: 'Home', icon: LayoutDashboard, aliases: [] },
      { id: 'production', path: prodPath, label: 'Production', icon: Factory, aliases: ['/machine-production', '/pulp-mill-operations', '/rewinding-reel-conversion', '/utilities-etp'] },
      { id: 'scan', path: '/qr-scanner', label: 'Scan', icon: QrCode, aliases: ['/traceability'] },
      { id: 'dispatch', path: '/finished-stock-dispatch', label: 'Dispatch', icon: Truck, aliases: ['/store-inventory', '/lab-testing'] },
      { id: 'more', path: '/profile', label: 'More', icon: User, aliases: ['/admin-profile', '/role-management', '/user-management', '/monthly-yearly-reporting', '/raw-material-stock', '/experiments'] },
    ];
  }, [user]);

  // Current Active Tab Index (0 to 4)
  const activeTabIndex = useMemo(() => {
    const currentPath = location.pathname;
    // 1. Direct path match
    for (let i = 0; i < mobileTabs.length; i++) {
      const tab = mobileTabs[i];
      if (tab.path === currentPath || tab.path.split('?')[0] === currentPath) return i;
    }
    // 2. Alias match
    for (let i = 0; i < mobileTabs.length; i++) {
      const tab = mobileTabs[i];
      if (tab.aliases?.some(a => currentPath.startsWith(a.split('?')[0]))) return i;
    }
    return 0;
  }, [location.pathname, mobileTabs]);

  // Touch Swipe Gesture State & Handlers
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchStartTimeRef.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null || touchStartTimeRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    const elapsed = Date.now() - touchStartTimeRef.current;

    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchStartTimeRef.current = null;

    // Ignore interactive form controls and horizontal scrollable elements
    const target = e.target as HTMLElement | null;
    if (target) {
      const isInteractive = ['INPUT', 'TEXTAREA', 'SELECT', 'CANVAS'].includes(target.tagName);
      const isInsideScrollable = target.closest('table') || target.closest('.overflow-x-auto') || target.closest('[data-no-swipe="true"]');
      if (isInteractive || isInsideScrollable) return;
    }

    // Minimum distance: 50px, duration < 600ms, and must be predominantly horizontal
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > 1.3 * Math.abs(deltaY) && elapsed < 600) {
      if (deltaX < 0) {
        // Left Swipe -> Move to NEXT Tab (Home -> Production -> Scan -> Dispatch -> More)
        if (activeTabIndex < mobileTabs.length - 1) {
          const nextTab = mobileTabs[activeTabIndex + 1];
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
          navigate(nextTab.path);
        }
      } else {
        // Right Swipe -> Move to PREVIOUS Tab (More -> Dispatch -> Scan -> Production -> Home)
        if (activeTabIndex > 0) {
          const prevTab = mobileTabs[activeTabIndex - 1];
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
          navigate(prevTab.path);
        }
      }
    }
  };

  const toggleLang = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLangDropdownOpen(!langDropdownOpen);
    setProfileDropdownOpen(false);
    setBellOpen(false);
  };

  const toggleProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProfileDropdownOpen(!profileDropdownOpen);
    setLangDropdownOpen(false);
    setBellOpen(false);
  };

  const toggleBell = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBellOpen(!bellOpen);
    setLangDropdownOpen(false);
    setProfileDropdownOpen(false);
  };
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);

  // Computes alert notifications
  const rawNotifications = useMemo(() => {
    const list: { id: string; type: 'stock' | 'qc' | 'order'; title: string; desc: string }[] = [];

    // 1. Low Stock Thresholds
    try {
      const materials = getRawMaterials();
      materials.forEach(m => {
        if (m.stock <= m.minThreshold) {
          list.push({
            id: `stock-${m.id}`,
            type: 'stock',
            title: `Low Stock: ${m.name}`,
            desc: `Current: ${m.stock.toLocaleString()} kg (Min Threshold: ${m.minThreshold} kg)`,
          });
        }
      });
    } catch (e) {
      console.error(e);
    }

    // 2. QC Pending Backlog (>24 hours)
    try {
      const reels = getReels();
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      reels.forEach(r => {
        if (r.status === 'QC_PENDING') {
          const prodTime = new Date(r.productionDate).getTime();
          if (!isNaN(prodTime) && prodTime < oneDayAgo) {
            list.push({
              id: `qc-${r.reelNo}`,
              type: 'qc',
              title: `QC Pending Backlog: ${r.reelNo.substring(r.reelNo.length - 8)}`,
              desc: `Awaiting inspection for >24 hrs. Produced ${r.productionDate.substring(0, 10)}.`,
            });
          }
        }
      });
    } catch (e) {
      console.error(e);
    }

    // 3. Pending Orders Approaching (within 3 days)
    try {
      const orders = getPendingOrders();
      const threeDaysFromNow = Date.now() + 3 * 24 * 60 * 60 * 1000;
      orders.forEach(o => {
        if (o.status === 'PENDING' || o.status === 'PARTIAL') {
          const dueTime = new Date(o.dueDate).getTime();
          if (!isNaN(dueTime) && dueTime <= threeDaysFromNow) {
            const daysLeft = Math.ceil((dueTime - Date.now()) / (24 * 60 * 60 * 1000));
            list.push({
              id: `order-${o.id}`,
              type: 'order',
              title: `Delivery Due Soon`,
              desc: `Due date is ${o.dueDate} (${daysLeft <= 0 ? '0' : daysLeft} days left)`,
            });
          }
        }
      });
    } catch (e) {
      console.error(e);
    }

    return list;
  }, [location.pathname]);

  const activeNotifications = useMemo(() => {
    return rawNotifications
      .filter(n => !dismissedNotificationIds.includes(n.id))
      .filter(n => {
        if (!user) return false;
        if (user.role === 'Admin' || user.role === 'Management') return true;
        // Operators only see notifications relevant to their specific role/access
        if (n.type === 'stock') return hasAccess('raw_material_stock');
        if (n.type === 'qc') return hasAccess('machine_production') || hasAccess('rewinding_reel_conversion');
        if (n.type === 'order') return hasAccess('finished_stock_dispatch');
        return false;
      });
  }, [rawNotifications, dismissedNotificationIds, user, hasAccess]);

  const dismissNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedNotificationIds(prev => [...prev, id]);
  };

  const clearAllNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    const allIds = rawNotifications.map(n => n.id);
    setDismissedNotificationIds(allIds);
  };  // Toggle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('saheb_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('saheb_theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    i18n.changeLanguage('en');
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const menuItems = [
    { id: 'dashboard', path: '/', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { id: 'orders', path: '/orders', label: t('nav.orders', 'Order Bookings'), icon: FileText },
    { id: 'raw_material_stock', path: '/raw-material-stock', label: t('nav.raw_material', 'Raw Material Stock'), icon: Warehouse },
    { id: 'pulp_mill_operations', path: '/pulp-mill-operations', label: t('nav.pulp_mill', 'Pulp Mill Operations'), icon: Factory },
    { id: 'machine_production', path: '/machine-production', label: t('nav.machine', 'Machine Production'), icon: Cog },
    { id: 'rewinding_reel_conversion', path: '/rewinding-reel-conversion', label: t('nav.rewinder', 'Rewinder Section'), icon: RotateCw },
    { id: 'lab', path: '/lab', label: 'Lab Quality Control', icon: Beaker },
    { id: 'utilities_etp', path: '/utilities-etp', label: t('nav.utilities_etp', 'Utilities and ETP'), icon: Flame },
    { id: 'experiment', path: '/experiment', label: t('nav.experiment', 'Dispatch Receipt'), icon: Truck },
    { id: 'finished_stock_dispatch', path: '/stock-categorization', label: t('nav.finished_stock_dispatch', 'Stock Categorization'), icon: Layers },
    { id: 'spareparts_management', path: '/spareparts-management', label: t('nav.store', 'Store Inventory'), icon: Wrench },
    { id: 'label_studio', path: '/label-studio', label: 'Label Studio', icon: Tag },
    { id: 'monthly_yearly_reporting', path: '/monthly-yearly-reporting', label: t('nav.reports', 'Mill Reports'), icon: BarChart2 },
    { id: 'admin_panel_audit', path: '/admin-panel-audit', label: t('nav.admin_masters', 'Settings'), icon: Settings },
  ];

  const visibleMenuItems = menuItems.filter(item => hasAccess(item.id));

  // Dynamic Section Categories for Sidebar
  const sidebarSections = useMemo(() => {
    const core = visibleMenuItems.filter(i => ['dashboard'].includes(i.id));
    const production = visibleMenuItems.filter(i => ['raw_material_stock', 'pulp_mill_operations', 'machine_production', 'rewinding_reel_conversion', 'lab'].includes(i.id));
    const operations = visibleMenuItems.filter(i => ['orders', 'utilities_etp', 'experiment', 'finished_stock_dispatch', 'spareparts_management'].includes(i.id));
    const admin = visibleMenuItems.filter(i => ['label_studio', 'monthly_yearly_reporting', 'admin_panel_audit'].includes(i.id));

    return [
      { title: 'Core Navigation', items: core },
      { title: 'Production & Mill', items: production },
      { title: 'Operations & Logistics', items: operations },
      { title: 'Analytics & Governance', items: admin },
    ].filter(section => section.items.length > 0);
  }, [visibleMenuItems]);

  // Dropdown states for top horizontal navbar (tablet/desktop)
  const toggleDropdown = (name: string) => {
    if (activeDropdown === name) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(name);
    }
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-text-light-primary dark:text-slate-100 flex flex-col transition-colors duration-200">

      {/* 1. Header (Common across all sizes) - Wow Glassmorphic Design */}
      <header className={`sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 shadow-2xs h-16 flex items-center justify-between px-4 lg:px-6 transition-all duration-300 ${user ? 'md:ml-64' : ''
        } ${showHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}>

        {/* Left Side Logo & Back Navigation */}
        <div className="flex items-center gap-3 shrink-0">
          {location.pathname !== '/' ? (
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-primary/10 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 hover:text-primary transition flex items-center gap-1.5 cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
              title="Navigate Back"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
              <span className="text-xs font-bold hidden xs:inline">Back</span>
            </button>
          ) : (
            <>
              {(user?.role === 'Admin' || user?.role === 'Management') && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 md:hidden transition border border-slate-200/60 dark:border-slate-700/60"
                >
                  {mobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <svg className="h-5 w-5 text-primary dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="12" x2="15" y2="12" />
                      <line x1="3" y1="18" x2="9" y2="18" />
                    </svg>
                  )}
                </button>
              )}

              {/* Mobile Only Header Logo (Hidden on Desktop because it is in the Left Sidebar) */}
              <div className="flex md:hidden items-center gap-3 cursor-pointer group select-none" onClick={() => navigate('/')}>
                <img src="/logo.png" alt="Saheb Paper Logo" className="h-9 w-9 object-contain rounded-xl shadow-md shadow-blue-600/10 group-hover:scale-105 transition-transform duration-200 border border-slate-200 dark:border-slate-700 bg-white p-0.5" />
                <div className="block">
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-sm font-black text-slate-900 dark:text-white leading-none tracking-tight">
                      {t('login.title')}
                    </h1>
                    <span className="px-1.5 py-0.2 rounded-full bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-400 text-[9px] font-extrabold uppercase border border-blue-200/60 dark:border-blue-800/60">
                      ERP
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-tight mt-0.5 truncate">
                    {t('login.subtitle')}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Side Combined Controls & Profile Container */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* RIGHT SIDE DATE & TIMEFRAME FILTER CONTROLS BAR (Placed to the left side of Theme Toggle Button) */}
          {(location.pathname === '/' || location.pathname === '/monthly-yearly-reporting') && (
            <div className="flex items-center gap-1 sm:gap-2 bg-slate-100/90 dark:bg-slate-800/90 p-1 sm:p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs mr-1 sm:mr-2">
              {/* Timeframe Selector Pill */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5 flex items-center gap-0.5 shadow-2xs">
                {(['day', 'week', 'month', 'all'] as const).map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-extrabold rounded-lg capitalize transition cursor-pointer ${timeframe === tf
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    {tf === 'day' ? 'Day' : tf === 'week' ? 'Week' : tf === 'month' ? 'Month' : 'All'}
                  </button>
                ))}
              </div>

              {/* Date Stepper & Picker Controls (< 2026-07-26 📅 >) */}
              <div className="hidden xs:flex items-center gap-1">
                <button
                  onClick={handlePrevDate}
                  className="p-1 sm:p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shadow-2xs"
                  title="Previous Date"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>

                <div className="relative" ref={headerDatePickerRef}>
                  <div
                    onClick={() => setIsDatePickerModalOpen(prev => !prev)}
                    className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 sm:px-3 py-1 shadow-2xs group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition select-none"
                    title="Click to select date"
                  >
                    <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white mr-1.5 font-sans">
                      {selectedDate}
                    </span>
                    <Calendar className="h-3.5 w-3.5 text-primary dark:text-blue-400 group-hover:scale-110 transition-transform" />
                  </div>

                  {isDatePickerModalOpen && (
                    <CustomDatePickerModal
                      selectedDate={selectedDate}
                      onSelectDate={(newDateStr) => setSelectedDate(newDateStr)}
                      onClose={() => setIsDatePickerModalOpen(false)}
                      align="right"
                      triggerRef={headerDatePickerRef}
                    />
                  )}
                </div>

                <button
                  onClick={handleNextDate}
                  disabled={selectedDate >= systemToday}
                  className="p-1 sm:p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shadow-2xs disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none"
                  title="Next Date"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}



          {/* Theme Toggle Button */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition cursor-pointer text-slate-600 dark:text-amber-400 shadow-2xs"
            title="Toggle Light/Dark Theme"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Notifications Bell Button */}
          <div className="relative">
            <button
              onClick={toggleBell}
              className="p-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition cursor-pointer text-slate-600 dark:text-slate-300 relative shadow-2xs"
              title="Notifications & Alerts"
            >
              <Bell className="h-4 w-4" />
              {activeNotifications.length > 0 && (
                <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
              )}
            </button>

            {bellOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl py-3 w-80 sm:w-88 z-50 max-h-96 overflow-y-auto font-sans"
              >
                <div className="px-4 pb-2.5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Alerts & Notifications</span>
                  {activeNotifications.length > 0 ? (
                    <button
                      onClick={clearAllNotifications}
                      className="text-xs font-extrabold text-primary dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  ) : (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-extrabold border border-emerald-200 dark:border-emerald-800">Healthy</span>
                  )}
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {activeNotifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                      System healthy. No active alerts.
                    </div>
                  ) : (
                    activeNotifications.map(n => (
                      <div key={n.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition text-left space-y-1.5 relative group">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`h-2 w-2 rounded-full shrink-0 ${n.type === 'stock' ? 'bg-amber-500' :
                                n.type === 'qc' ? 'bg-purple-500' : 'bg-red-500'
                              }`}></span>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{n.title}</span>
                          </div>
                          <button
                            onClick={(e) => dismissNotification(n.id, e)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 dark:text-slate-300 dark:hover:text-red-400 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer shrink-0 transition"
                            title="Dismiss alert"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 pl-4 leading-relaxed pr-2 font-normal">{n.desc}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Top Right Header Profile & User Badges */}
          {user && (
            <div className="flex items-center gap-2 border-l pl-3 border-slate-200 dark:border-slate-700">
              <div className="hidden lg:block text-right">
                <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">{user.displayName}</p>
                <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-primary dark:text-blue-400 bg-primary/10 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-primary/20 mt-0.5">
                  {user.role}
                </span>
              </div>

              {/* Profile Avatar Button (Hidden on Mobile, accessed via Bottom Nav / Drawer) */}
              <div className="relative hidden md:block">
                <button
                  onClick={toggleProfile}
                  className="h-9 w-9 bg-gradient-to-tr from-primary to-indigo-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md shadow-primary/20 hover:scale-105 transition-transform"
                  title="Profile Settings"
                >
                  <User className="h-4 w-4" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden py-1.5 w-56 font-sans">
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                        <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{user.displayName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">@{user.username} ({user.role})</p>
                      </div>

                      <button
                        onClick={() => {
                          navigate('/profile');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700/50 text-left transition border-b border-slate-100 dark:border-slate-700 cursor-pointer"
                      >
                        <User className="h-4 w-4 text-primary dark:text-blue-400" />
                        <span>My Profile & Details</span>
                      </button>

                      {user.role === 'Admin' && (
                        <button
                          onClick={() => {
                            navigate('/role-management');
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-700/50 text-left transition border-b border-slate-100 dark:border-slate-700 cursor-pointer"
                        >
                          <Shield className="h-4 w-4 text-amber-500" />
                          <span>Role Management</span>
                        </button>
                      )}

                      {(user.role === 'Admin' || user.role === 'Management') && (
                        <button
                          onClick={() => {
                            navigate('/user-management');
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-left transition border-b border-slate-100 dark:border-slate-700 cursor-pointer"
                        >
                          <Settings className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <span>User Management</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-left transition cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 text-red-500" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        {/* 2. Left Sidebar (Tablet/Desktop: md:flex) - Completely Locked Stationary Left Sidebar */}
        {user && (
          <aside className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 z-40 select-none shadow-xs overflow-hidden h-screen">
            {/* Sidebar Top Header with Logo (Flush at top-0 with 0 extra space) */}
            <div className="h-16 px-4 flex items-center gap-3 border-b border-slate-200/80 dark:border-slate-800 shrink-0 cursor-pointer group select-none" onClick={() => navigate('/')}>
              <img src="/logo.png" alt="Saheb Paper Logo" className="h-9 w-9 object-contain rounded-xl shadow-md shadow-blue-600/10 group-hover:scale-105 transition-transform duration-200 border border-slate-200 dark:border-slate-700 bg-white p-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xs font-black text-slate-900 dark:text-white leading-none tracking-tight truncate font-heading">
                    {t('login.title')}
                  </h1>
                  <span className="px-1.5 py-0.2 rounded-full bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-400 text-[9px] font-extrabold uppercase border border-blue-200/60 dark:border-blue-800/60 shrink-0">
                    ERP
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-tight truncate mt-0.5">
                  {t('login.subtitle')}
                </p>
              </div>
            </div>

            {/* Locked Sidebar Navigation Sections (No Inner Scroll - Locked In Position) */}
            <div className="flex flex-col gap-2 flex-1 px-3 py-2.5 overflow-hidden select-none">
              
              {/* Render Categorized Dynamic Sections */}
              {sidebarSections.map((section) => (
                <div key={section.title} className="space-y-0.5">
                  <div className="px-3 pt-1 pb-0.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 font-sans">
                    {section.title}
                  </div>

                  <div className="space-y-0.5">
                    {section.items.map(item => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <button
                          key={item.id}
                          onClick={() => navigate(item.path)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 text-left cursor-pointer group ${isActive
                              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-black shadow-md shadow-blue-600/25'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-800/90 hover:text-slate-900 dark:hover:text-white font-bold'
                            }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary dark:group-hover:text-blue-400'
                              }`} />
                            <span className="text-xs font-sans tracking-wide leading-tight truncate">
                              {item.label}
                            </span>
                          </div>

                          {isActive && (
                            <span className="h-1.5 w-1.5 rounded-full bg-white shadow-xs animate-pulse shrink-0"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* 3. Main content area with Touch Gesture Swipe support */}
        <main
          ref={mainRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className={`flex-1 flex flex-col overflow-y-auto pb-32 md:pb-6 relative min-w-0 ${user ? 'md:ml-64' : ''
            } dashboard-main-scrollbar`}
        >
          {/* Actual children page content */}
          <div className="p-2 sm:p-4 lg:p-6 flex-1 flex flex-col">{children}</div>
        </main>
      </div>

      {/* 4. Mobile Slide-out Menu */}
      {mobileMenuOpen && user && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="w-80 bg-white dark:bg-slate-900 h-full p-5 flex flex-col shadow-2xl transition"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Header & Profile Card */}
            <div className="flex items-center justify-between border-b pb-4 mb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">{user.displayName}</h3>
                  <span className="text-[10px] font-black uppercase text-primary dark:text-blue-400 tracking-wider">
                    {user.role === 'Admin' ? 'Master Admin' : user.role}
                  </span>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Navigation List */}
            <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto pr-1">

              {visibleMenuItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition cursor-pointer ${isActive
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-extrabold shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Logout Button inside Mobile Drawer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-extrabold text-xs uppercase tracking-wider border border-red-200 dark:border-red-800 transition cursor-pointer shadow-2xs"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout of Account</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. Floating Dynamic Island Bottom Navigation Bar (Mobile: md:hidden) */}
      {user && (
        <>
          {/* Subtle Background Backdrop Mask to prevent page content bleed */}
          <div className={`fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-100 via-slate-100/90 to-transparent dark:from-slate-950 dark:via-slate-950/90 pointer-events-none z-30 md:hidden transition-all duration-300 ${showBottomNav ? 'opacity-100' : 'opacity-0'
            }`} />
          {/* 5-TAB SYNCHRONIZED MOBILE BOTTOM NAVIGATION (Home -> Production -> Scan -> Dispatch -> More) */}
          <nav className={`fixed bottom-3 left-3 right-3 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-2xl flex md:hidden items-center justify-around px-1.5 z-40 select-none transition-all duration-300 ease-in-out ${showBottomNav ? 'translate-y-0 opacity-100' : 'translate-y-[calc(100%+2rem)] opacity-0 pointer-events-none'
            }`}>
            {mobileTabs.map((tab, idx) => {
              const isActive = activeTabIndex === idx;
              const isScanTab = tab.id === 'scan';
              const Icon = tab.icon;

              if (isScanTab) {
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                      navigate(tab.path);
                    }}
                    className="flex flex-col items-center justify-center flex-1 py-1 group cursor-pointer"
                    title={tab.label}
                  >
                    <div className={`w-11 h-11 rounded-full text-white flex items-center justify-center -mt-5 shadow-xl active:scale-90 transition-all ${isActive
                        ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-500/50 ring-4 ring-white dark:ring-slate-900 scale-105'
                        : 'bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-500/40 ring-4 ring-white dark:ring-slate-900 group-hover:scale-105'
                      }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`text-[10px] mt-0.5 font-extrabold transition-colors ${isActive ? 'text-primary dark:text-blue-400 font-black' : 'text-slate-500 dark:text-slate-400'
                      }`}>
                      {tab.label}
                    </span>
                  </button>
                );
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                    navigate(tab.path);
                  }}
                  className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${isActive
                      ? 'text-primary dark:text-blue-400 font-extrabold scale-105'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  title={tab.label}
                >
                  <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-blue-50 dark:bg-blue-950/60 shadow-xs' : ''}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] mt-0.5 font-bold tracking-tight">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </>
      )}

      {/* MY PROFILE EDIT MODAL */}
      {isProfileModalOpen && user && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-blue-600 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-lg text-white border border-white/30">
                  {user.username.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">{user.displayName}</h3>
                  <span className="text-xs font-mono bg-white/20 px-2.5 py-0.5 rounded-full text-blue-100 border border-white/20">
                    Role: {user.role}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 text-xs">
              {profileSaveSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Profile updated successfully!
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Username (Fixed)</label>
                  <input
                    type="text"
                    disabled
                    value={user.username}
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Account Role</label>
                  <input
                    type="text"
                    disabled
                    value={user.role}
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={profileDisplayName}
                  onChange={(e) => setProfileDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="Your Full Name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="operator@sahebpaper.com"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">Security PIN (4-Digits)</label>
                <div className="relative">
                  <input
                    type={showPin ? "text" : "password"}
                    maxLength={4}
                    required
                    value={profilePin}
                    onChange={(e) => setProfilePin(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-base font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">Security Question</label>
                  <select
                    value={profileSecurityQuestion}
                    onChange={(e) => setProfileSecurityQuestion(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                  >
                    <option value="What is your favorite color?">What is your favorite color?</option>
                    <option value="What is your pet's name?">What is your pet's name?</option>
                    <option value="What town were you born in?">What town were you born in?</option>
                    <option value="What is your favorite food?">What is your favorite food?</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">Security Answer</label>
                  <input
                    type="text"
                    value={profileSecurityAnswer}
                    onChange={(e) => setProfileSecurityAnswer(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="Answer for PIN recovery"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default Layout;
