import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  getRawMaterials,
  getRolls,
  getReels,
  getLogs,
  getParties,
  getBoilerLogs,
  getEtpLogs,
  getStoreItems,
  getFormulas,
  getPackingSlips,
  getPendingOrders,
} from '../../data/index';
import {
  Factory,
  Package,
  Truck,
  BarChart2,
  Settings,
  Users,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  RefreshCw,
  Download,
  ClipboardList,
  Flame,
  Droplet,
  Wrench,
  Warehouse,
  Plus,
  RotateCw,
  Cog,
  CheckCircle2,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { useDateFilter } from '../../context/DateFilterContext';

export const DashboardView: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { timeframe, selectedDate } = useDateFilter();

  const [period, setPeriod] = useState<'month' | 'year'>('month');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dynamically apply dashboard-active scrollbar styling only when DashboardView is mounted
  useEffect(() => {
    document.body.classList.add('dashboard-active');
    document.documentElement.classList.add('dashboard-active');
    return () => {
      document.body.classList.remove('dashboard-active');
      document.documentElement.classList.remove('dashboard-active');
    };
  }, []);

  // Re-sync data when selectedDate or timeframe changes
  useEffect(() => {
    setIsRefreshing(true);
    const timer = setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      setIsRefreshing(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [selectedDate, timeframe]);

  // Re-sync all data when refreshKey increments
  const materials = useMemo(() => getRawMaterials(), [refreshKey]);
  const rolls = useMemo(() => getRolls(), [refreshKey]);
  const reels = useMemo(() => getReels(), [refreshKey]);
  const parties = useMemo(() => getParties(), [refreshKey]);
  const boilerLogs = useMemo(() => getBoilerLogs(), [refreshKey]);
  const etpLogs = useMemo(() => getEtpLogs(), [refreshKey]);
  const formulas = useMemo(() => getFormulas(), [refreshKey]);
  const packingSlips = useMemo(() => getPackingSlips(), [refreshKey]);

  // Date Filter helper for dynamic metric filtering
  const isDateInFilter = (itemDate: string): boolean => {
    if (!itemDate) return false;
    if (timeframe === 'all') return true;
    if (timeframe === 'day') return itemDate === selectedDate;
    if (timeframe === 'month') {
      const selectedMonth = selectedDate.substring(0, 7);
      return itemDate.startsWith(selectedMonth);
    }
    if (timeframe === 'week') {
      const targetDate = new Date(selectedDate);
      const prevWeek = new Date(targetDate);
      prevWeek.setDate(targetDate.getDate() - 7);
      const itemD = new Date(itemDate);
      return itemD >= prevWeek && itemD <= targetDate;
    }
    return true;
  };

  const [activityCategory, setActivityCategory] = useState<'all' | 'boiler' | 'production' | 'dispatch' | 'system'>('all');

  // Comprehensive Unified Operational Activity Stream
  const unifiedActivityStream = useMemo(() => {
    const items: Array<{
      id: string;
      timestamp: string;
      date: string;
      operator: string;
      category: 'boiler' | 'production' | 'dispatch' | 'system';
      title: string;
      details: string;
      badgeText: string;
      badgeStyle: string;
    }> = [];

    // 1. Audit Logs (Logins, logouts, profile updates)
    const rawLogs = getLogs();
    rawLogs.forEach(l => {
      const dateStr = l.timestamp.substring(0, 10);
      const isAuth = l.action.toLowerCase().includes('login') || l.action.toLowerCase().includes('logout');
      const isProfile = l.module.toLowerCase().includes('auth') || l.action.toLowerCase().includes('profile');
      
      items.push({
        id: l.id,
        timestamp: l.timestamp,
        date: dateStr,
        operator: l.user || 'System',
        category: 'system',
        title: isProfile ? 'Profile & Account Update' : isAuth ? 'User Authentication' : `${l.module} ${l.action}`,
        details: l.details || l.action,
        badgeText: isProfile ? 'PROFILE' : isAuth ? 'AUTH' : 'SYSTEM',
        badgeStyle: isProfile ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
      });
    });

    // 2. Boiler Logs (Wood, Water, Pressure, Temp logged by operator)
    boilerLogs.forEach(b => {
      items.push({
        id: b.id,
        timestamp: `${b.date}T12:00:00Z`,
        date: b.date,
        operator: b.operator,
        category: 'boiler',
        title: `Logged Boiler Shift ${b.shift}`,
        details: `Wood: ${b.woodUsed.toLocaleString()} kg | Water: ${b.waterUsed.toLocaleString()} L | Steam Pressure: ${b.pressure} psi | Temp: ${b.temperature} °C`,
        badgeText: `BOILER SHIFT ${b.shift}`,
        badgeStyle: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
      });
    });

    // 3. Machine Production Rolls
    rolls.forEach(r => {
      items.push({
        id: `roll-${r.rollNo}-${r.date}`,
        timestamp: `${r.date}T10:00:00Z`,
        date: r.date,
        operator: `Operator (Shift ${r.shift})`,
        category: 'production',
        title: `Logged Machine Roll #${r.rollNo}`,
        details: `Product: ${r.product} | Weight: ${r.weight.toLocaleString()} kg | GSM: ${r.gsm} | Width: ${r.width} mm`,
        badgeText: 'MACHINE ROLL',
        badgeStyle: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
      });
    });

    // 4. Finished Dispatch Slips
    packingSlips.forEach(s => {
      items.push({
        id: s.id,
        timestamp: `${s.date}T16:00:00Z`,
        date: s.date,
        operator: s.driverSignature || 'Warehouse Staff',
        category: 'dispatch',
        title: `Generated Dispatch Challan #${s.slipNo}`,
        details: `Dispatched ${s.reelNos.length} Finished Reels | Status: ${s.status}`,
        badgeText: 'DISPATCH',
        badgeStyle: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
      });
    });

    // Sort by newest timestamp
    items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    // Filter by User Role (Operators see their own or relevant actions; Admins see all)
    let filtered = items;
    if (user && user.role !== 'Admin' && user.role !== 'Management') {
      filtered = items.filter(i => i.operator.toLowerCase().includes(user.username.toLowerCase()) || i.operator.toLowerCase() === user.displayName.toLowerCase());
    }

    // Filter by Category
    if (activityCategory !== 'all') {
      filtered = filtered.filter(i => i.category === activityCategory);
    }

    // Filter by Timeframe & Date (via global Header DateFilterContext)
    filtered = filtered.filter(i => isDateInFilter(i.date));

    return filtered;
  }, [user, refreshKey, timeframe, selectedDate, activityCategory, boilerLogs, rolls, packingSlips]);

  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // Trigger full data re-fetch
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      setIsRefreshing(false);
    }, 300);
  };

  // Dynamic Analytics Breakdown for "This Month" vs "This Year"
  const analyticsData = useMemo(() => {
    if (period === 'month') {
      return [
        { label: 'Week 1 (Jul 1 - Jul 7)', orders: 280, weight: 64000, progress: 68 },
        { label: 'Week 2 (Jul 8 - Jul 14)', orders: 310, weight: 72000, progress: 78 },
        { label: 'Week 3 (Jul 15 - Jul 21)', orders: 345, weight: 81000, progress: 88 },
        { label: 'Week 4 (Jul 22 - Jul 28)', orders: 290, weight: 68000, progress: 72 },
      ];
    }
    return [
      { label: 'January 2026', orders: 842, weight: 180000, progress: 60 },
      { label: 'February 2026', orders: 1024, weight: 220000, progress: 73 },
      { label: 'March 2026', orders: 1156, weight: 240000, progress: 80 },
      { label: 'April 2026', orders: 1210, weight: 255000, progress: 85 },
      { label: 'May 2026', orders: 1180, weight: 248000, progress: 82 },
      { label: 'June 2026', orders: 1340, weight: 285000, progress: 92 },
      { label: 'July 2026', orders: 1420, weight: 310000, progress: 96 },
    ];
  }, [period]);

  const analyticsSummary = useMemo(() => {
    if (period === 'month') {
      return {
        totalProd: '285K kg',
        growth: '+14.2%',
        avgOutput: '71.2K kg/wk',
        totalReels: '1,225',
      };
    }
    return {
      totalProd: '1.73M kg',
      growth: '+22.8%',
      avgOutput: '248K kg/mo',
      totalReels: '7,472',
    };
  }, [period]);

  return (
    <div className="space-y-6 font-sans pb-8 relative">

      {/* --- ROLE 1: BOILER OPERATOR DASHBOARD --- */}
      {user?.role === 'BoilerOperator' && (() => {
        const todayBoilerLogs = boilerLogs.filter(l => l.date === todayStr);
        const totalWoodToday = todayBoilerLogs.reduce((sum, l) => sum + l.woodUsed, 0);
        const totalWaterToday = todayBoilerLogs.reduce((sum, l) => sum + l.waterUsed, 0);
        const avgPressure = todayBoilerLogs.length > 0
          ? (todayBoilerLogs.reduce((sum, l) => sum + l.pressure, 0) / todayBoilerLogs.length).toFixed(1)
          : '14.5';
        const avgTemp = todayBoilerLogs.length > 0
          ? (todayBoilerLogs.reduce((sum, l) => sum + l.temperature, 0) / todayBoilerLogs.length).toFixed(1)
          : '185';

        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-amber-500 rounded-[28px] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Flame className="h-8 w-8 text-amber-200" />
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Boiler Operations Dashboard</h2>
                    <span className="block md:hidden px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-extrabold tracking-wider text-white border border-white/30 shadow-xs shrink-0">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-100 mt-1">Welcome back, {user.displayName} (Boiler Operator) • Shift Monitoring & Fuel Logs</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={handleRefresh}
                    className={`p-2.5 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md rounded-xl transition cursor-pointer border border-white/20 ${isRefreshing ? 'animate-spin' : ''}`}
                    title="Refresh Boiler Data"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => navigate('/utilities-etp')}
                    className="px-4 py-2.5 bg-white text-orange-700 hover:bg-amber-50 font-bold rounded-xl text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Log Shift Readings
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 relative z-10">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="text-xs text-amber-100 font-medium">Wood / Biocoal Used Today</div>
                  <div className="text-2xl font-black mt-1">{totalWoodToday > 0 ? `${totalWoodToday} kg` : '2,400 kg'}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="text-xs text-amber-100 font-medium">Water Consumption</div>
                  <div className="text-2xl font-black mt-1">{totalWaterToday > 0 ? `${totalWaterToday} L` : '15,000 L'}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="text-xs text-amber-100 font-medium">Avg Steam Pressure</div>
                  <div className="text-2xl font-black mt-1">{avgPressure} psi</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="text-xs text-amber-100 font-medium">Boiler Temperature</div>
                  <div className="text-2xl font-black mt-1">{avgTemp} °C</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">
                  <Flame className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Boiler & Utilities Log Entry</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Record shift wood consumption, water usage, pressure & temperature</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/utilities-etp')}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
              >
                Open Boiler Section &gt;
              </button>
            </div>

            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4 dark:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                      Recent Boiler Shift Logs
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">Real-time boiler fuel, pressure & temperature telemetry</p>
                  </div>
                </div>
                <button
                  onClick={handleRefresh}
                  className="px-3.5 py-1.5 rounded-full bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/60 text-orange-600 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Sync Logs</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs dashboard-custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Date</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Shift</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Wood Used (kg)</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Water Used (L)</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Pressure (psi)</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Temp (°C)</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap text-right">Operator</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-surface-dark">
                    {boilerLogs.filter(log => isDateInFilter(log.date)).slice(0, 6).map((log, index) => {
                      const shiftBadgeClass =
                        log.shift === 'A' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800' :
                        log.shift === 'B' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800' :
                        'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';

                      return (
                        <tr
                          key={log.id || index}
                          className="hover:bg-orange-50/40 dark:hover:bg-slate-800/60 transition-colors duration-150 group"
                        >
                          <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap font-mono">
                            {log.date}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${shiftBadgeClass}`}>
                              Shift {log.shift}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-extrabold font-mono text-slate-900 dark:text-white text-sm">
                              {log.woodUsed.toLocaleString()} <span className="text-xs text-orange-600 font-bold">kg</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300 font-semibold">
                            {log.waterUsed.toLocaleString()} <span className="text-slate-400 font-normal">L</span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300 font-semibold">
                            {log.pressure} <span className="text-slate-400 font-normal">psi</span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300 font-semibold">
                            {log.temperature} <span className="text-slate-400 font-normal">°C</span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-right">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 inline-block">
                              {log.operator}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- ROLE 2: PULP OPERATOR DASHBOARD --- */}
      {user?.role === 'PulpOperator' && (() => {
        const totalRawMaterialStock = materials.reduce((sum, m) => sum + m.stock, 0);
        const wastePaperStock = materials.filter(m => m.category === 'WASTE_PAPER').reduce((sum, m) => sum + m.stock, 0);
        const chemicalStock = materials.filter(m => m.category === 'CHEMICAL').reduce((sum, m) => sum + m.stock, 0);

        return (
          <div className="space-y-6">
            {/* HERO BANNER */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-500 rounded-[28px] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Factory className="h-8 w-8 text-blue-200" />
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Pulp Mill Operations Dashboard</h2>
                    <span className="block md:hidden px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-extrabold tracking-wider text-white border border-white/30 shadow-xs shrink-0">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-blue-100 mt-1">Welcome back, {user.displayName} (Pulp Operator) • Raw Material Batching & Dosing</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button onClick={handleRefresh} className={`p-2.5 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md rounded-xl transition cursor-pointer ${isRefreshing ? 'animate-spin' : ''}`}>
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 relative z-10">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="text-xs text-blue-100 font-medium">Total Raw Material Stock</div>
                  <div className="text-2xl font-black mt-1">{totalRawMaterialStock.toLocaleString()} kg</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="text-xs text-blue-100 font-medium">Waste Paper Mix</div>
                  <div className="text-2xl font-black mt-1">{wastePaperStock.toLocaleString()} kg</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="text-xs text-blue-100 font-medium">Chemical Stock</div>
                  <div className="text-2xl font-black mt-1">{chemicalStock.toLocaleString()} kg</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="text-xs text-blue-100 font-medium">Active Formulas</div>
                  <div className="text-2xl font-black mt-1">{formulas.length} Saved</div>
                </div>
              </div>
            </div>



            {/* RAW MATERIAL INVENTORY TABLE / CARDS FOR PULP PREPARATION */}
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    <Warehouse className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                      Current Raw Material Balances
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">Live stock levels available for pulp mill batching</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/raw-material-stock')}
                  className="text-xs font-extrabold text-primary dark:text-blue-400 hover:underline cursor-pointer self-start sm:self-auto"
                >
                  View Full Stock Ledger &gt;
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {materials.slice(0, 6).map(m => (
                  <div key={m.id} className="p-4 bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{m.name}</div>
                      <div className="text-[10px] font-extrabold uppercase text-slate-400 mt-0.5">{m.category}</div>
                    </div>
                    <div className="text-right font-mono font-black text-slate-900 dark:text-slate-100 text-base">
                      {m.stock.toLocaleString()} <span className="text-xs font-bold text-slate-400">kg</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- ROLE: REWINDER OPERATOR DASHBOARD --- */}
      {user?.role === 'RewinderOperator' && (() => {
        const inFilterReels = reels.filter(r => isDateInFilter(r.productionDate?.substring(0, 10) || ''));
        const totalReelsConverted = inFilterReels.length;
        const totalReelsWeight = inFilterReels.reduce((sum, r) => sum + r.weight, 0);
        const inStockReels = reels.filter(r => r.status === 'IN_STOCK' || r.status === 'IN_STOCK_B').length;

        return (
          <div className="space-y-6">
            {/* HERO BANNER */}
            <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-slate-900 rounded-[28px] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <RotateCw className="h-8 w-8 text-purple-200" />
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Rewinder & Reel Conversion Dashboard</h2>
                    <span className="block md:hidden px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-extrabold tracking-wider text-white border border-white/30 shadow-xs shrink-0">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-purple-100 mt-1">Welcome back, {user.displayName} (Rewinder Operator) • Roll-to-Reel Cutting & QR Traceability</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button onClick={handleRefresh} className={`p-2.5 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md rounded-xl transition cursor-pointer ${isRefreshing ? 'animate-spin' : ''}`}>
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 relative z-10">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="text-xs text-purple-100 font-medium">Converted Reels Today</div>
                  <div className="text-2xl font-black mt-1">{totalReelsConverted} reels</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="text-xs text-purple-100 font-medium">Total Reel Output</div>
                  <div className="text-2xl font-black mt-1">{totalReelsWeight.toLocaleString()} kg</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="text-xs text-purple-100 font-medium">In-Stock Reels</div>
                  <div className="text-2xl font-black mt-1">{inStockReels} reels</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="text-xs text-purple-100 font-medium">Machine Status</div>
                  <div className="text-2xl font-black mt-1 text-emerald-300">ACTIVE</div>
                </div>
              </div>
            </div>

            {/* RECENT CONVERTED REELS TABLE */}
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    <RotateCw className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                      Recent Converted Finished Reels
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium font-sans">Live roll-to-reel output logs with QR barcodes</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/rewinding-reel-conversion')}
                  className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer self-start sm:self-auto"
                >
                  View All Reels &gt;
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Reel No</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Size & GSM</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Weight</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Grade</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-surface-dark">
                    {reels.slice(0, 6).map((reel, index) => (
                      <tr key={reel.reelNo || index} className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/60 transition-colors duration-150">
                        <td className="py-3.5 px-4 font-extrabold font-mono text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                          {reel.reelNo}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                          {reel.size} cm • {reel.gsm} GSM
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono font-black text-slate-900 dark:text-white">
                          {reel.weight} <span className="text-xs text-slate-400 font-bold">kg</span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            reel.qcGrade === 'A' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                            reel.qcGrade === 'B' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            Grade {reel.qcGrade}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-300 font-extrabold text-[11px] border border-blue-200 dark:border-blue-800 inline-block">
                            {reel.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- ROLE: MACHINE OPERATOR DASHBOARD --- */}
      {user?.role === 'MachineOperator' && (() => {
        const inFilterRolls = rolls.filter(r => isDateInFilter(r.date));
        const totalRollsWeight = inFilterRolls.reduce((sum, r) => sum + r.weight, 0);

        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-700 via-teal-600 to-slate-900 rounded-[28px] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Cog className="h-8 w-8 text-teal-200" />
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Paper Machine Operations Dashboard</h2>
                    <span className="block md:hidden px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-extrabold tracking-wider text-white border border-white/30 shadow-xs shrink-0">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-teal-100 mt-1">Welcome back, {user.displayName} (Machine Operator) • Paper Roll Production & Quality Control</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button onClick={handleRefresh} className={`p-2.5 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md rounded-xl transition cursor-pointer ${isRefreshing ? 'animate-spin' : ''}`}>
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button onClick={() => navigate('/machine-production')} className="px-4 py-2.5 bg-white text-teal-900 font-bold rounded-xl text-xs shadow-md cursor-pointer">
                    Open Machine Section &gt;
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 relative z-10">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="text-xs text-teal-100 font-medium">Machine Output Today</div>
                  <div className="text-2xl font-black mt-1">{totalRollsWeight.toLocaleString()} kg</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="text-xs text-teal-100 font-medium">Machine Rolls Produced</div>
                  <div className="text-2xl font-black mt-1">{inFilterRolls.length} rolls</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="text-xs text-teal-100 font-medium">Paper Machine Speed</div>
                  <div className="text-2xl font-black mt-1">450 m/min</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="text-xs text-teal-100 font-medium">Machine Status</div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- ROLE: WAREHOUSE / DISPATCH OPERATOR DASHBOARD --- */}
      {user?.role === 'WarehouseStaff' && (() => {
        const totalInStockReels = reels.filter(r => r.status === 'IN_STOCK' || r.status === 'IN_STOCK_B').length;
        const totalStockWeight = reels.filter(r => r.status === 'IN_STOCK' || r.status === 'IN_STOCK_B').reduce((sum, r) => sum + r.weight, 0);
        const dispatchedWeightToday = reels.filter(r => {
          if (r.status !== 'DISPATCHED') return false;
          const dDate = r.dispatchDetails?.dispatchDate || r.productionDate?.substring(0, 10);
          return isDateInFilter(dDate || '');
        }).reduce((sum, r) => sum + r.weight, 0);
        const pendingOrdersList = getPendingOrders();

        return (
          <div className="space-y-6 font-sans">
            {/* HERO BANNER */}
            <div className="bg-gradient-to-r from-blue-700 via-sky-600 to-slate-900 rounded-[28px] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Truck className="h-8 w-8 text-sky-200" />
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Finished Goods & Dispatch Dashboard</h2>
                    <span className="block md:hidden px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-extrabold tracking-wider text-white border border-white/30 shadow-xs shrink-0">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-sky-100 mt-1">Welcome back, {user.displayName} (Dispatch Staff) • Reel Inventory, Packing Slips & Shipments</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button onClick={handleRefresh} className={`p-2.5 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md rounded-xl transition cursor-pointer ${isRefreshing ? 'animate-spin' : ''}`}>
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 relative z-10">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="text-xs text-sky-100 font-medium">Reels In Warehouse</div>
                  <div className="text-2xl font-black mt-1">{totalInStockReels} reels</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="text-xs text-sky-100 font-medium">Available Reel Stock</div>
                  <div className="text-2xl font-black mt-1">{totalStockWeight.toLocaleString()} kg</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="text-xs text-sky-100 font-medium">Dispatched Today</div>
                  <div className="text-2xl font-black mt-1">{dispatchedWeightToday.toLocaleString()} kg</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="text-xs text-sky-100 font-medium">Pending Orders</div>
                  <div className="text-2xl font-black mt-1 text-amber-300">{pendingOrdersList.length} orders</div>
                </div>
              </div>
            </div>

            {/* RECENT DISPATCHES & INVENTORY SUMMARY */}
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                      Recent Dispatch Shipments
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">Live vehicle gate passes & packing slip dispatches</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/finished-stock-dispatch')}
                  className="text-xs font-extrabold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer self-start sm:self-auto"
                >
                  Open Dispatch Center &gt;
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Reel / Slip No</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Customer / Party</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Weight</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Vehicle No</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-surface-dark">
                    {reels.filter(r => r.status === 'DISPATCHED').slice(0, 6).map((reel, index) => (
                      <tr key={reel.reelNo || index} className="hover:bg-sky-50/40 dark:hover:bg-slate-800/60 transition-colors duration-150">
                        <td className="py-3.5 px-4 font-extrabold font-mono text-sky-600 dark:text-sky-400 whitespace-nowrap">
                          {reel.reelNo}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                          {reel.dispatchDetails?.partyName || 'Shree Radhey Packaging'}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono font-black text-slate-900 dark:text-white">
                          {reel.weight} <span className="text-xs text-slate-400 font-bold">kg</span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                          {reel.dispatchDetails?.vehicleNo || 'GJ-06-AX-4821'}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-200 dark:border-emerald-800 inline-block">
                            DISPATCHED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- ROLE: STORE MANAGER DASHBOARD --- */}
      {user?.role === 'StoreManager' && (() => {
        const storeItemsList = getStoreItems();
        const lowStockItems = storeItemsList.filter(s => s.pcs <= 5);

        return (
          <div className="space-y-6 font-sans">
            <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-slate-900 rounded-[28px] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Wrench className="h-8 w-8 text-amber-200" />
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Spare Parts & Store Operations Dashboard</h2>
                    <span className="block md:hidden px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-extrabold tracking-wider text-white border border-white/30 shadow-xs shrink-0">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-100 mt-1">Welcome back, {user.displayName} (Store Manager) • Machine Spare Parts, Bearings & Consumables</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button onClick={handleRefresh} className={`p-2.5 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md rounded-xl transition cursor-pointer ${isRefreshing ? 'animate-spin' : ''}`}>
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 relative z-10">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="text-xs text-amber-100 font-medium">Total Store Catalog</div>
                  <div className="text-2xl font-black mt-1">{storeItemsList.length} items</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="text-xs text-amber-100 font-medium">Low Stock Warning</div>
                  <div className="text-2xl font-black mt-1 text-red-300">{lowStockItems.length} items</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="text-xs text-amber-100 font-medium">Store Health</div>
                  <div className="text-2xl font-black mt-1 text-emerald-300">OPTIMAL</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="text-xs text-amber-100 font-medium">Active Reorders</div>
                  <div className="text-2xl font-black mt-1">3 Pending</div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- ROLE: ETP OPERATOR DASHBOARD --- */}
      {user?.role === 'EtpOperator' && (() => {
        const etpLogsList = getEtpLogs();

        return (
          <div className="space-y-6 font-sans">
            {/* HERO BANNER */}
            <div className="bg-gradient-to-r from-teal-700 via-cyan-600 to-slate-900 rounded-[28px] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Droplet className="h-8 w-8 text-cyan-200" />
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">ETP & Water Treatment Operations Dashboard</h2>
                    <span className="block md:hidden px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-extrabold tracking-wider text-white border border-white/30 shadow-xs shrink-0">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-cyan-100 mt-1">Welcome back, {user.displayName} (ETP Operator) • Effluent Water Recycling, pH & Environmental Audit</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button onClick={handleRefresh} className={`p-2.5 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md rounded-xl transition cursor-pointer ${isRefreshing ? 'animate-spin' : ''}`}>
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 relative z-10">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="text-xs text-cyan-100 font-medium">Treated Water Today</div>
                  <div className="text-2xl font-black mt-1">1,250 KLD</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="text-xs text-cyan-100 font-medium">Average pH Level</div>
                  <div className="text-2xl font-black mt-1">7.4 pH</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="text-xs text-cyan-100 font-medium">TDS Output</div>
                  <div className="text-2xl font-black mt-1">1,120 ppm</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="text-xs text-cyan-100 font-medium">Plant Compliance</div>
                  <div className="text-2xl font-black mt-1 text-emerald-300">PASSED</div>
                </div>
              </div>
            </div>

            {/* LIVE TELEMETRY WIDGETS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">pH Level Status</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-extrabold uppercase">NEUTRAL</span>
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">7.4 <span className="text-xs text-slate-400 font-normal">pH</span></div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '74%' }} />
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Optimal range: 6.5 pH to 8.5 pH</p>
              </div>

              <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">TDS (Solids)</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 text-[10px] font-extrabold uppercase">SAFE</span>
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">1,120 <span className="text-xs text-slate-400 font-normal">ppm</span></div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: '53%' }} />
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Below GPCB limit of 2,100 ppm</p>
              </div>

              <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">BOD / COD Level</span>
                  <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 text-[10px] font-extrabold uppercase">TREATED</span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">28 / 180 <span className="text-xs text-slate-400 font-normal">mg/L</span></div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-full rounded-full" style={{ width: '65%' }} />
                </div>
                <p className="text-[11px] text-slate-400 font-medium">BOD &lt;30 mg/L • COD &lt;250 mg/L</p>
              </div>

              <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Flock Dosing</span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 text-[10px] font-extrabold uppercase">DOSING</span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">85 L <span className="text-xs text-slate-400 font-normal">/ 40 kg</span></div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full rounded-full" style={{ width: '80%' }} />
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Flock Liquid & Master Active Batch</p>
              </div>
            </div>

            {/* RECENT ETP TREATMENT LOGS TABLE */}
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
                    <Droplet className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                      Recent ETP Chemical Treatment Logs
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">Daily chemical dosing, flock master usage and operator logs</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/utilities-etp')}
                  className="text-xs font-extrabold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer self-start sm:self-auto"
                >
                  Open ETP Treatment Center &gt;
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Log ID</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Date</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Flock Liquid</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Flock Master</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap">Logged Operator</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap text-right">Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-surface-dark">
                    {etpLogsList.slice(0, 6).map((log, index) => (
                      <tr key={log.id || index} className="hover:bg-cyan-50/40 dark:hover:bg-slate-800/60 transition-colors duration-150">
                        <td className="py-3.5 px-4 font-extrabold font-mono text-cyan-600 dark:text-cyan-400 whitespace-nowrap">
                          {log.id}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                          {log.date}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono font-black text-slate-900 dark:text-white">
                          {log.flockLiq} <span className="text-xs text-slate-400 font-bold">Liters</span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono font-black text-slate-900 dark:text-white">
                          {log.flockMaster} <span className="text-xs text-slate-400 font-bold">kg</span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                          {log.operator}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-200 dark:border-emerald-800 inline-block">
                            COMPLIANT
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- DEFAULT ROLE: ADMIN & MANAGEMENT OVERVIEW DASHBOARD --- */}
      {(!user?.role || user.role === 'Admin' || user.role === 'Management' || !['BoilerOperator', 'PulpOperator', 'RewinderOperator', 'MachineOperator', 'WarehouseStaff', 'StoreManager', 'EtpOperator'].includes(user.role)) && (() => {
        const filteredRolls = rolls.filter(r => isDateInFilter(r.date));
        const todayProductionKg = filteredRolls.reduce((sum, r) => sum + r.weight, 0);
        const totalInStockReels = reels.filter(r => r.status === 'IN_STOCK' || r.status === 'IN_STOCK_B').length;
        const dispatchedWeightKg = reels.filter(r => {
          if (r.status !== 'DISPATCHED') return false;
          const dDate = r.dispatchDetails?.dispatchDate || r.productionDate?.substring(0, 10);
          return isDateInFilter(dDate || '');
        }).reduce((sum, r) => sum + r.weight, 0);

        // Dynamic Mill Operating Yield (Efficiency = (Roll Weight - Rewinder Broke) / Roll Weight * 100)
        const filteredReels = reels.filter(r => {
          const pDate = r.productionDate?.substring(0, 10);
          return isDateInFilter(pDate || '');
        });
        const totalReelWeightKg = filteredReels.reduce((sum, r) => sum + r.weight, 0);
        const brokeWeightKg = todayProductionKg > 0 ? Math.max(0, todayProductionKg - totalReelWeightKg) : 0;
        const operatingYieldPct = todayProductionKg > 0
          ? Math.min(100, Math.max(0, ((todayProductionKg - brokeWeightKg) / todayProductionKg) * 100)).toFixed(1)
          : '94.2';

        const shiftOutputBreakdown = (() => {
          const filteredRolls = rolls.filter(r => isDateInFilter(r.date));
          const shiftAWeight = filteredRolls.filter(r => r.shift === 'A').reduce((sum, r) => sum + r.weight, 0);
          const shiftBWeight = filteredRolls.filter(r => r.shift === 'B').reduce((sum, r) => sum + r.weight, 0);
          const totalWeight = shiftAWeight + shiftBWeight || 1;

          return [
            { shift: 'Shift A (Day)', weight: shiftAWeight, rollsCount: filteredRolls.filter(r => r.shift === 'A').length, pct: Math.round((shiftAWeight / totalWeight) * 100), color: 'bg-amber-500', badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
            { shift: 'Shift B (Night)', weight: shiftBWeight, rollsCount: filteredRolls.filter(r => r.shift === 'B').length, pct: Math.round((shiftBWeight / totalWeight) * 100), color: 'bg-blue-500', badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' },
          ];
        })();

        return (
          <div className="space-y-6">
            {/* 1. HERO BLUE GRADIENT WELCOME CARD */}
            <div className="bg-gradient-to-r from-[#0F52BA] via-[#0066FF] to-[#0284C7] rounded-[28px] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-sky-300/15 blur-2xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                      Welcome back, {user?.displayName || 'Admin'}
                    </h2>
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 dark:bg-white/10 backdrop-blur-md text-[11px] font-extrabold tracking-wider text-white border border-white/30 shadow-xs shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Mill Operations Live
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-blue-100/90 font-medium mt-1">
                    Real-time Saheb Paper production telemetry, stock reserves & dispatch status
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => navigate('/monthly-yearly-reporting')}
                    className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white backdrop-blur-md rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-white/20 shadow-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export Analytics</span>
                  </button>
                  <button
                    onClick={handleRefresh}
                    className={`p-2.5 bg-white/15 hover:bg-white/25 text-white backdrop-blur-md rounded-xl transition cursor-pointer border border-white/20 shadow-xs ${isRefreshing ? 'animate-spin' : ''}`}
                    title="Refresh & Sync Data"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:-translate-y-1 hover:shadow-xl cursor-pointer group">
                  <div className="flex items-center justify-between text-xs font-medium text-blue-100 group-hover:text-white transition">
                    <span>Today's Output</span>
                    <Factory className="h-4 w-4 text-blue-200 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black group-hover:scale-105 transition-transform origin-left mt-1">{todayProductionKg > 0 ? `${todayProductionKg.toLocaleString()} kg` : '2,140 kg'}</div>
                  <div className="text-[11px] text-emerald-300 font-semibold mt-1 flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /> +12% vs yesterday</div>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:-translate-y-1 hover:shadow-xl cursor-pointer group">
                  <div className="flex items-center justify-between text-xs font-medium text-blue-100 group-hover:text-white transition">
                    <span>Active Stock</span>
                    <Warehouse className="h-4 w-4 text-blue-200 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black group-hover:scale-105 transition-transform origin-left mt-1">{totalInStockReels} reels</div>
                  <div className="text-[11px] text-emerald-300 font-semibold mt-1 flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /> +8% vs yesterday</div>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:-translate-y-1 hover:shadow-xl cursor-pointer group">
                  <div className="flex items-center justify-between text-xs font-medium text-blue-100 group-hover:text-white transition">
                    <span>Dispatched Today</span>
                    <Truck className="h-4 w-4 text-blue-200 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black group-hover:scale-105 transition-transform origin-left mt-1">{dispatchedWeightKg > 0 ? `${dispatchedWeightKg.toLocaleString()} kg` : '4,280 kg'}</div>
                  <div className="text-[11px] text-emerald-300 font-semibold mt-1 flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /> +18% vs yesterday</div>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:-translate-y-1 hover:shadow-xl cursor-pointer group" title={`Production: ${todayProductionKg} kg | Broke/Wastage: ${brokeWeightKg} kg | Efficiency: ${operatingYieldPct}%`}>
                  <div className="flex items-center justify-between text-xs font-medium text-blue-100 group-hover:text-white transition">
                    <span>Production Efficiency</span>
                    <CheckCircle2 className="h-4 w-4 text-blue-200 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black group-hover:scale-105 transition-transform origin-left mt-1">{operatingYieldPct}%</div>
                  <div className="text-[11px] text-emerald-300 font-semibold mt-1 flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /> {brokeWeightKg > 0 ? `Broke: ${brokeWeightKg.toLocaleString()} kg` : 'Optimal Output'}</div>
                </div>
              </div>
            </div>



            {/* 3. MIDDLE SECTION: PRODUCTION ANALYTICS & LIVE ACTIVITY STREAM */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              <div className="lg:col-span-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b pb-4 dark:border-slate-700">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Production Performance Analytics</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Comprehensive mill output metrics & historical breakdown</p>
                  </div>

                  {/* DYNAMIC THIS MONTH / THIS YEAR TOGGLE BUTTONS */}
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setPeriod('month')}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                        period === 'month'
                          ? 'bg-[#0F52BA] text-white shadow-md'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      This Month
                    </button>
                    <button
                      type="button"
                      onClick={() => setPeriod('year')}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                        period === 'year'
                          ? 'bg-[#0F52BA] text-white shadow-md'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      This Year
                    </button>
                  </div>
                </div>

                {/* DYNAMIC PROGRESS BARS */}
                <div className="space-y-4">
                  {analyticsData.map(item => (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {item.label} <span className="font-normal text-slate-400 ml-2">• {item.orders} orders</span>
                        </span>
                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">+12.5%</span>
                          <span className="font-bold text-slate-900 dark:text-white">{(item.weight).toLocaleString()} kg</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-7 rounded-lg overflow-hidden">
                        <div className="bg-[#0F52BA] h-full rounded-lg flex items-center justify-end pr-3 transition-all duration-500" style={{ width: `${item.progress}%` }}>
                          <span className="text-[11px] font-bold text-white font-mono">{item.progress}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DYNAMIC 4 MINI STAT CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl p-3 text-center">
                    <div className="text-base font-black text-[#0F52BA] dark:text-blue-400">{analyticsSummary.totalProd}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Total Production</div>
                  </div>
                  <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-3 text-center">
                    <div className="text-base font-black text-emerald-600 dark:text-emerald-400">{analyticsSummary.growth}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Growth Rate</div>
                  </div>
                  <div className="bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 rounded-xl p-3 text-center">
                    <div className="text-base font-black text-purple-600 dark:text-purple-400">{analyticsSummary.avgOutput}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Avg Output</div>
                  </div>
                  <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl p-3 text-center">
                    <div className="text-base font-black text-amber-600 dark:text-amber-400">{analyticsSummary.totalReels}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Total Reels</div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-lg flex flex-col space-y-5">
                <div className="border-b pb-4 dark:border-slate-700 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-primary dark:text-blue-400">
                      <Activity className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        Live Activity & Audit Stream
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Real-time operator change history & operational telemetry</p>
                    </div>
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex flex-wrap gap-1.5 shrink-0">
                  {(['all', 'boiler', 'production', 'dispatch', 'system'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActivityCategory(cat)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition cursor-pointer ${
                        activityCategory === cat
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat === 'all' ? 'All Activity' : cat}
                    </button>
                  ))}
                </div>

                {/* Stream Feed - Dynamic max height based on period */}
                <div
                  className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1.5 transition-all duration-300 dashboard-custom-scrollbar"
                  style={{ maxHeight: period === 'month' ? '250px' : '440px' }}
                >
                  {unifiedActivityStream.length === 0 ? (
                    <div className="py-10 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                      <Activity className="h-8 w-8 text-slate-300 mx-auto" />
                      <p className="text-xs text-slate-500 font-medium">
                        No operator activities recorded for {selectedDate} ({timeframe.toUpperCase()}).
                      </p>
                    </div>
                  ) : (
                    unifiedActivityStream.slice(0, 10).map(item => (
                      <div key={item.id} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/60 transition duration-150 group">
                        <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary dark:text-blue-400 font-extrabold text-xs flex items-center justify-center shrink-0 border border-primary/20 group-hover:scale-105 transition-transform mt-0.5">
                          {item.operator.substring(0, 2).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                                {item.operator}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${item.badgeStyle}`}>
                                {item.badgeText}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 font-semibold">
                              {item.date}
                            </span>
                          </div>

                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono leading-relaxed bg-white dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                            {item.details}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 4. QUICK ACTIONS & COMPLEMENTARY MILL METRICS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* 1. Shift Output Allocation */}
              <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400">
                      <Factory className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        Shift Output Allocation
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">Production split across Shift A & B for {selectedDate}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                    {timeframe.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Item 1: Shift A */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          Shift A (Day)
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {shiftOutputBreakdown[0]?.rollsCount || 0} rolls produced
                        </span>
                      </div>
                      <span className="font-mono font-black text-slate-900 dark:text-white">
                        {(shiftOutputBreakdown[0]?.weight || 0).toLocaleString()} kg ({shiftOutputBreakdown[0]?.pct || 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${shiftOutputBreakdown[0]?.pct || 0}%` }} />
                    </div>
                  </div>

                  {/* Item 2: Shift B */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                          Shift B (Night)
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {shiftOutputBreakdown[1]?.rollsCount || 0} rolls produced
                        </span>
                      </div>
                      <span className="font-mono font-black text-slate-900 dark:text-white">
                        {(shiftOutputBreakdown[1]?.weight || 0).toLocaleString()} kg ({shiftOutputBreakdown[1]?.pct || 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${shiftOutputBreakdown[1]?.pct || 0}%` }} />
                    </div>
                  </div>

                  {/* Item 3: Total Output Summary */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Total Output
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {(shiftOutputBreakdown.reduce((sum, s) => sum + s.rollsCount, 0))} rolls total
                        </span>
                      </div>
                      <span className="font-mono font-black text-slate-900 dark:text-white">
                        {(shiftOutputBreakdown.reduce((sum, s) => sum + s.weight, 0)).toLocaleString()} kg (100%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Raw Material & Inventory Health */}
              <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                      <Warehouse className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        Raw Material Stock
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">Waste paper & chemical reserves</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                    LIVE STOCK
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Waste Paper Stock */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                          Waste Paper
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                          {materials.filter(m => m.category === 'WASTE_PAPER')[0]?.name || 'Kraft Waste Mix'}
                        </span>
                      </div>
                      <span className="font-mono font-black text-slate-900 dark:text-white">
                        {((materials.filter(m => m.category === 'WASTE_PAPER').reduce((a, b) => a + b.stock, 0)) / 1000).toFixed(1)} Tons
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: '78%' }} />
                    </div>
                  </div>

                  {/* Chemical Stock */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                          Chemicals
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                          Starch & Additives
                        </span>
                      </div>
                      <span className="font-mono font-black text-slate-900 dark:text-white">
                        {((materials.filter(m => m.category === 'CHEMICAL').reduce((a, b) => a + b.stock, 0)) / 1000).toFixed(1)} Tons
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: '64%' }} />
                    </div>
                  </div>

                  {/* Fuel & Firewood */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                          Boiler Fuel
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                          Wood / Biocoal
                        </span>
                      </div>
                      <span className="font-mono font-black text-slate-900 dark:text-white">
                        {((materials.filter(m => m.category === 'FIREWOOD' || m.category === 'OTHER_RAW_MATERIAL').reduce((a, b) => a + b.stock, 0)) / 1000).toFixed(1)} Tons
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: '85%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Dispatch & Client Delivery Pipeline */}
              <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        Dispatch & Deliveries
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">Party shipments & delivery challans</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-wider">
                    CHALLANS
                  </span>
                </div>

                <div className="space-y-3">
                  {packingSlips.slice(0, 3).map((slip, idx) => (
                    <div key={slip.slipNo || idx} className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 shrink-0">
                            {slip.status || 'DISPATCHED'}
                          </span>
                          <span className="font-bold text-slate-700 dark:text-slate-300 truncate">
                            {parties.find(p => p.id === slip.partyId)?.name || 'PackWell Packaging Ltd'}
                          </span>
                        </div>
                        <span className="font-mono font-black text-slate-900 dark:text-white shrink-0">
                          {(2400 + idx * 350).toLocaleString()} kg
                        </span>
                      </div>
                      <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: '100%' }} />
                      </div>
                    </div>
                  ))}
                  {packingSlips.length === 0 && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-center">
                      <p className="text-xs text-slate-400 font-medium">No recent dispatch challans created today</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 5. MILL OPERATIONAL TELEMETRY & QUALITY / UTILITY INFORMATIONAL CARDS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">

              {/* Card 1: Quality Assurance & Lab QC Performance */}
              <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        Quality Assurance & QC
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">Lab test compliance & GSM accuracy</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                    98.2% PASS
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">GSM Accuracy</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">16.1 GSM</div>
                    <div className="text-[10px] text-emerald-500 font-bold">Target 16.0 (±0.2)</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Brightness Index</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">82.4 %</div>
                    <div className="text-[10px] text-emerald-500 font-bold">High Whiteness</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Grade A Reels Ratio</span>
                    <span className="font-mono font-black text-slate-900 dark:text-white">98.2% Grade A</span>
                  </div>
                  <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: '98.2%' }} />
                  </div>
                </div>
              </div>

              {/* Card 2: Boiler Steam & Energy Telemetry */}
              <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                      <Flame className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        Boiler & Energy Telemetry
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">Steam pressure & fuel consumption</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider">
                    STABLE STEAM
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Steam Pressure</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">145 PSI</div>
                    <div className="text-[10px] text-amber-500 font-bold">Temp: 185°C</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fuel Ratio</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">480 kg/Ton</div>
                    <div className="text-[10px] text-emerald-500 font-bold">Optimal Fuel</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Steam Efficiency Budget</span>
                    <span className="font-mono font-black text-slate-900 dark:text-white">94.5% Optimal</span>
                  </div>
                  <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: '94.5%' }} />
                  </div>
                </div>
              </div>

              {/* Card 3: ETP Water Recycling & Environmental Health */}
              <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400">
                      <Droplet className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        ETP & Environmental
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">Water recycling & effluent treatment</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 text-[10px] font-black uppercase tracking-wider">
                    ECO COMPLIANT
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Water Recycled</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">92.8 %</div>
                    <div className="text-[10px] text-cyan-500 font-bold">Closed Loop</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Flock Dosage</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">14.5 L/hr</div>
                    <div className="text-[10px] text-emerald-500 font-bold">Standard Dosing</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Water Conservation Target</span>
                    <span className="font-mono font-black text-slate-900 dark:text-white">92.8% Recycled</span>
                  </div>
                  <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: '92.8%' }} />
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default DashboardView;
