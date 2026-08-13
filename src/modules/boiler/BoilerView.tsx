import React, { useState, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { getBoilerLogs, saveBoilerLog, getRolls } from '../../data/index';
import type { BoilerLog } from '../../data/types';
import { Flame, Droplet, Plus, Info, List, BarChart, QrCode, Printer, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export const BoilerView: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [logs, setLogs] = useState<BoilerLog[]>(() => getBoilerLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);
  const rolls = getRolls();

  const filteredLogs = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return logs;
    return logs.filter(
      l =>
        l.date.toLowerCase().includes(q) ||
        l.operator.toLowerCase().includes(q) ||
        `shift ${l.shift.toLowerCase()}`.includes(q) ||
        l.shift.toLowerCase().includes(q)
    );
  }, [logs, searchTerm]);

  // Operator Entry Form States
  const [woodStr, setWoodStr] = useState('');
  const [waterStr, setWaterStr] = useState('');
  const [pressureStr, setPressureStr] = useState('');
  const [tempStr, setTempStr] = useState('');
  const [shift, setShift] = useState<'A' | 'B'>('A');
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [selectedBoilerLogForQR, setSelectedBoilerLogForQR] = useState<BoilerLog | null>(null);

  const todayStr = useMemo(() => {
    return new Date().toISOString().substring(0, 10);
  }, []);

  const handleOperatorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccess('');
    setFormError('');

    const wood = parseFloat(woodStr);
    const water = parseFloat(waterStr);
    const pressure = parseFloat(pressureStr);
    const temp = parseFloat(tempStr);

    if (isNaN(wood) || isNaN(water) || isNaN(pressure) || isNaN(temp)) {
      setFormError('Please enter valid numeric values for all fields');
      return;
    }

    if (wood < 0 || water < 0 || pressure < 0 || temp < 0) {
      setFormError('Values cannot be negative');
      return;
    }

    const newLog: BoilerLog = {
      id: `BLR-${todayStr.replace(/-/g, '')}-${shift}-${Date.now().toString().slice(-4)}`,
      date: todayStr,
      woodUsed: wood,
      waterUsed: water,
      pressure,
      temperature: temp,
      operator: user?.displayName || 'System',
      shift,
    };

    saveBoilerLog(newLog, user?.displayName || 'System');
    setLogs(getBoilerLogs());
    setFormSuccess('Boiler shift data logged successfully and stock deducted!');
    
    // Reset Form
    setWoodStr('');
    setWaterStr('');
    setPressureStr('');
    setTempStr('');
  };

  // --- STATS CALCS (Admin only) ---
  const totalProductionTons = useMemo(() => {
    const totalKg = rolls.reduce((sum, r) => sum + r.weight, 0);
    return totalKg / 1000;
  }, [rolls]);

  const totalWoodConsumed = useMemo(() => {
    return logs.reduce((sum, l) => sum + l.woodUsed, 0);
  }, [logs]);

  const totalWaterConsumed = useMemo(() => {
    return logs.reduce((sum, l) => sum + l.waterUsed, 0);
  }, [logs]);

  const woodPerTon = useMemo(() => {
    if (totalProductionTons === 0) return null;
    return totalWoodConsumed / totalProductionTons;
  }, [totalWoodConsumed, totalProductionTons]);

  const waterPerTon = useMemo(() => {
    if (totalProductionTons === 0) return null;
    return totalWaterConsumed / totalProductionTons;
  }, [totalWaterConsumed, totalProductionTons]);

  const recentTemp = useMemo(() => {
    if (logs.length === 0) return 0;
    return logs[logs.length - 1].temperature;
  }, [logs]);

  const recentPressure = useMemo(() => {
    if (logs.length === 0) return 0;
    return logs[logs.length - 1].pressure;
  }, [logs]);

  const isOperatorOnly = user?.role === 'BoilerOperator';
  const isAdminOrManagement = user?.role === 'Admin' || user?.role === 'Management';

  // Toggle view for admin (to write shift data or view dashboard)
  const [adminSubView, setAdminSubView] = useState<'dashboard' | 'form'>('dashboard');

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-light dark:border-slate-700 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" />
            Boiler
          </h2>
          <p className="text-sm text-text-light-secondary dark:text-slate-400 mt-1">
            Track daily wood fuel and water consumption metrics.
          </p>
        </div>
        {isAdminOrManagement && (
          <div className="flex bg-slate-100 dark:bg-slate-700 p-0.5 rounded-md text-xs font-semibold self-start sm:self-center">
            <button
              onClick={() => setAdminSubView('dashboard')}
              className={`px-3 py-1.5 rounded-md transition ${
                adminSubView === 'dashboard' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Dashboard View
            </button>
            <button
              onClick={() => setAdminSubView('form')}
              className={`px-3 py-1.5 rounded-md transition ${
                adminSubView === 'form' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Operator Log Form
            </button>
          </div>
        )}
      </div>

      {/* ADMIN DASHBOARD VIEW */}
      {isAdminOrManagement && adminSubView === 'dashboard' && (
        <div className="space-y-6">
          
          {/* KPI Gauges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Wood Metric */}
            <div className="bg-white dark:bg-surface-dark border border-border-light dark:border-slate-700 rounded-lg p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Wood Consumption</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {totalWoodConsumed.toLocaleString()} kg
              </p>
              <div className="text-[10px] text-text-light-secondary dark:text-slate-400 mt-1">
                Wood per Ton of Paper: <span className="font-bold text-primary">{woodPerTon !== null ? `${woodPerTon.toFixed(2)} kg/ton` : 'N/A'}</span>
              </div>
            </div>

            {/* Water Metric */}
            <div className="bg-white dark:bg-surface-dark border border-border-light dark:border-slate-700 rounded-lg p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Water Consumption</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {totalWaterConsumed.toLocaleString()} L
              </p>
              <div className="text-[10px] text-text-light-secondary dark:text-slate-400 mt-1">
                Water Per Ton: <span className="font-bold text-primary">{waterPerTon !== null ? `${waterPerTon.toFixed(2)} L/ton` : 'N/A'}</span>
              </div>
            </div>

            {/* Pressure Metric */}
            <div className="bg-white dark:bg-surface-dark border border-border-light dark:border-slate-700 rounded-lg p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Current Boiler Pressure</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {recentPressure} psi
              </p>
              <div className="text-[10px] text-text-light-secondary dark:text-slate-400">
                Operating standard: 100-150 psi
              </div>
            </div>

            {/* Temp Metric */}
            <div className="bg-white dark:bg-surface-dark border border-border-light dark:border-slate-700 rounded-lg p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Current Steam Temp</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {recentTemp} °C
              </p>
              <div className="text-[10px] text-text-light-secondary dark:text-slate-400">
                Operating standard: 150-200 °C
              </div>
            </div>

          </div>

          {/* Boiler Logs Grid */}
          <div className="bg-white dark:bg-surface-dark border border-border-light dark:border-slate-700 rounded-lg p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 border-b pb-2 dark:border-slate-700 flex items-center gap-2">
              <List className="h-4.5 w-4.5 text-primary" />
              Boiler Daily Operation Registers
            </h3>
            
            {/* Search Input */}
            <div className="mb-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 flex items-center gap-2 max-w-md">
              <Search className="h-4.5 w-4.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search logs by date, operator, or shift..."
                className="bg-transparent border-none text-xs focus:outline-none w-full dark:text-white"
              />
            </div>

            {filteredLogs.length === 0 ? (
              <p className="text-xs text-text-light-secondary py-4 text-center">No logs match your search criteria.</p>
            ) : (
              <div className="space-y-4">
                {/* Desktop/Tablet Table */}
                <div className="hidden md:block">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-700 text-text-light-secondary dark:text-slate-400">
                        <th className="py-2.5 font-bold uppercase">Date</th>
                        <th className="py-2.5 font-bold uppercase">Shift</th>
                        <th className="py-2.5 font-bold uppercase">Wood Used</th>
                        <th className="py-2.5 font-bold uppercase">Water Used</th>
                        <th className="py-2.5 font-bold uppercase">Pressure</th>
                        <th className="py-2.5 font-bold uppercase">Temp</th>
                        <th className="py-2.5 font-bold uppercase text-right">Operator</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {filteredLogs
                        .slice()
                        .sort((a, b) => b.id.localeCompare(a.id))
                        .slice(0, visibleCount)
                        .map(log => (
                          <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                            <td className="py-2.5">{log.date}</td>
                            <td className="py-2.5">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                Shift {log.shift}
                              </span>
                            </td>
                            <td className="py-2.5">{log.woodUsed} kg</td>
                            <td className="py-2.5">{log.waterUsed} L</td>
                            <td className="py-2.5">{log.pressure} psi</td>
                            <td className="py-2.5">{log.temperature} °C</td>
                            <td className="py-2.5 text-right font-semibold">{log.operator}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Stacked Cards */}
                <div className="block md:hidden space-y-3">
                  {filteredLogs
                    .slice()
                    .sort((a, b) => b.id.localeCompare(a.id))
                    .slice(0, visibleCount)
                    .map(log => (
                      <div key={log.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs text-left">
                        <div className="flex justify-between items-center border-b pb-2 dark:border-slate-800">
                          <span className="font-semibold text-slate-800 dark:text-white">{log.date}</span>
                          <span className="px-2 py-0.5 rounded bg-primary/10 text-[9px] font-bold text-primary uppercase">
                            Shift {log.shift}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-y-2 text-[11px] text-slate-600 dark:text-slate-400">
                          <div>
                            <span className="font-medium text-slate-400 block uppercase tracking-wider text-[9px]">Wood Used</span>
                            <span className="font-bold text-slate-800 dark:text-white text-xs">{log.woodUsed} kg</span>
                          </div>
                          <div>
                            <span className="font-medium text-slate-400 block uppercase tracking-wider text-[9px]">Water Used</span>
                            <span className="font-bold text-slate-800 dark:text-white text-xs">{log.waterUsed} L</span>
                          </div>
                          <div>
                            <span className="font-medium text-slate-400 block uppercase tracking-wider text-[9px]">Pressure</span>
                            <span className="font-bold text-slate-800 dark:text-white text-xs">{log.pressure} psi</span>
                          </div>
                          <div>
                            <span className="font-medium text-slate-400 block uppercase tracking-wider text-[9px]">Temp</span>
                            <span className="font-bold text-slate-800 dark:text-white text-xs">{log.temperature} °C</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                          <span>Operator: <strong className="text-slate-600 dark:text-slate-300">{log.operator}</strong></span>
                        </div>
                      </div>
                    ))}
                </div>

                {/* View More / Show Less Controls */}
                {filteredLogs.length > 6 && (
                  <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 font-sans">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Showing <strong className="text-slate-900 dark:text-white font-mono">{Math.min(visibleCount, filteredLogs.length)}</strong> of <strong className="text-slate-900 dark:text-white font-mono">{filteredLogs.length}</strong> operation registers
                    </span>
                    <div className="flex items-center gap-2">
                      {visibleCount < filteredLogs.length ? (
                        <button
                          type="button"
                          onClick={() => setVisibleCount(prev => prev + 6)}
                          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <span>View More Registers ({filteredLogs.length - visibleCount} remaining)</span>
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setVisibleCount(6)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                        >
                          <span>Show Less</span>
                          <ChevronUp className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* OPERATOR VIEW / ENTRY FORM */}
      {((isAdminOrManagement && adminSubView === 'form') || isOperatorOnly) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Entry Form */}
          <div className="lg:col-span-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-7 shadow-lg space-y-6">
            <div className="flex items-center justify-between border-b pb-4 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/30">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white uppercase tracking-wider">
                    Boiler Shift Data Entry Form
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Input current shift wood fuel, water consumption, and steam pressure</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleOperatorSubmit} className="space-y-5">
              {formSuccess && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-2xl border border-emerald-200 font-bold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  {formSuccess}
                </div>
              )}
              {formError && (
                <div className="p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded-2xl border border-red-200 font-bold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="p-1 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400"><Flame className="h-3.5 w-3.5" /></span>
                    Wood/Fuel Used (kg)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      value={woodStr}
                      onChange={e => setWoodStr(e.target.value)}
                      className="block w-full py-3 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition"
                      placeholder="e.g. 500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">kg</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="p-1 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"><Droplet className="h-3.5 w-3.5" /></span>
                    Water Level / Consumed (L)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      value={waterStr}
                      onChange={e => setWaterStr(e.target.value)}
                      className="block w-full py-3 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                      placeholder="e.g. 400"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">L</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Steam Pressure (psi)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      value={pressureStr}
                      onChange={e => setPressureStr(e.target.value)}
                      className="block w-full py-3 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition"
                      placeholder="e.g. 125"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">psi</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Steam Temperature (°C)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      value={tempStr}
                      onChange={e => setTempStr(e.target.value)}
                      className="block w-full py-3 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition"
                      placeholder="e.g. 175"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">°C</span>
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Operator Shift
                  </label>
                  <select
                    value={shift}
                    onChange={e => setShift(e.target.value as 'A' | 'B')}
                    className="block w-full py-3 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-semibold text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition cursor-pointer"
                  >
                    <option value="A">Shift A (Day Shift)</option>
                    <option value="B">Shift B (Night Shift)</option>
                  </select>
                </div>

              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-700 hover:to-amber-700 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:scale-98 transition duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                <Flame className="h-4 w-4" />
                <span>Log Shift Readings</span>
              </button>
            </form>
          </div>

          {/* Operator Log History Panel */}
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-7 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-700">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                Your Recent Logs
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-300">
                {logs.filter(l => l.operator === user?.displayName).length} Entries
              </span>
            </div>
            
            {logs.filter(l => l.operator === user?.displayName).length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-slate-800 text-orange-500 mx-auto flex items-center justify-center">
                  <Flame className="h-6 w-6" />
                </div>
                <p className="text-xs text-slate-400 font-medium">No shift logs recorded yet by you.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {logs
                  .filter(l => l.operator === user?.displayName)
                  .sort((a, b) => b.id.localeCompare(a.id))
                  .map(log => {
                    const shiftBadge =
                      log.shift === 'A' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                      log.shift === 'B' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                      'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300';

                    return (
                      <div key={log.id} className="p-3.5 border border-slate-200 dark:border-slate-700/80 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition duration-150 space-y-2 text-xs">
                        <div className="flex justify-between items-center font-extrabold border-b pb-2 border-slate-200/60 dark:border-slate-700">
                          <span className="text-slate-900 dark:text-white font-bold">{log.date}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${shiftBadge}`}>Shift {log.shift}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div><span className="text-slate-400">Wood:</span> <strong className="text-orange-600 dark:text-orange-400">{log.woodUsed} kg</strong></div>
                          <div><span className="text-slate-400">Water:</span> <strong className="text-blue-600 dark:text-blue-400">{log.waterUsed} L</strong></div>
                          <div><span className="text-slate-400">Pressure:</span> <strong className="text-slate-800 dark:text-slate-200">{log.pressure} psi</strong></div>
                          <div><span className="text-slate-400">Temp:</span> <strong className="text-slate-800 dark:text-slate-200">{log.temperature} °C</strong></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
export default BoilerView;
