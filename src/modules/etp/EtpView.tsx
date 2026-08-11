import React, { useState, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { getEtpLogs, saveEtpLog } from '../../data/index';
import type { EtpLog } from '../../data/types';
import { CustomDatePickerModal } from '../../components/CustomDatePickerModal';
import { Droplet, Plus, ClipboardList, Search, ListFilter, CheckCircle2, AlertCircle, Sparkles, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

export const EtpView: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [logs, setLogs] = useState<EtpLog[]>(() => getEtpLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(5);

  const filteredLogs = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return logs;
    return logs.filter(
      l =>
        l.date.toLowerCase().includes(q) ||
        l.operator.toLowerCase().includes(q)
    );
  }, [logs, searchTerm]);

  // Form States
  const [dateStr, setDateStr] = useState(() => {
    return new Date().toISOString().substring(0, 10);
  });
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [flockLiqStr, setFlockLiqStr] = useState('');
  const [flockMasterStr, setFlockMasterStr] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccess('');
    setFormError('');

    const flockLiq = parseFloat(flockLiqStr);
    const flockMaster = parseFloat(flockMasterStr);

    if (isNaN(flockLiq) || isNaN(flockMaster)) {
      setFormError('Please enter valid numbers for both chemical parameters');
      return;
    }

    if (flockLiq < 0 || flockMaster < 0) {
      setFormError('Values cannot be negative');
      return;
    }

    const newLog: EtpLog = {
      id: `etp-${Date.now()}`,
      date: dateStr,
      flockLiq,
      flockMaster,
      operator: user?.displayName || 'System',
    };

    saveEtpLog(newLog, user?.displayName || 'System');
    setLogs(getEtpLogs());
    setFormSuccess('ETP chemical usage logged successfully!');
    setFlockLiqStr('');
    setFlockMasterStr('');
  };

  const totalFlockLiq = useMemo(() => logs.reduce((acc, l) => acc + (l.flockLiq || 0), 0), [logs]);
  const totalFlockMaster = useMemo(() => logs.reduce((acc, l) => acc + (l.flockMaster || 0), 0), [logs]);

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* 1. HERO GRADIENT HEADER BANNER */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-lg shrink-0">
              <Droplet className="h-8 w-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Effluent Treatment Plant (ETP) Module</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-200 text-[10px] font-extrabold uppercase tracking-wider border border-teal-300/40 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Compliance Active
                </span>
                {user?.role !== 'Admin' && (
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-extrabold tracking-wider uppercase text-white border border-white/30 shadow-xs">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-blue-100/90 font-medium mt-1">
                Track daily chemical dosage (Flock 100 Liquid & Flock Master Solid) for environmental compliance.
              </p>
            </div>
          </div>
        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Entry Form */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          
          {/* Header with 3-Line Filter Icon & Accent Lines (as shown in user's image) */}
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 pb-3 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <ListFilter className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  Log Daily Chemical Usage
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Record Flock 100 liquid and Flock Master solid consumption</p>
              </div>
            </div>
            
            {/* 3 Horizontal Lines Accent Graphic */}
            <div className="hidden sm:flex items-center gap-1">
              <span className="w-6 h-0.5 bg-blue-500 rounded-full" />
              <span className="w-4 h-0.5 bg-teal-500 rounded-full" />
              <span className="w-2 h-0.5 bg-indigo-500 rounded-full" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {formSuccess && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 font-bold animate-fadeIn">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{formSuccess}</span>
              </div>
            )}
            {formError && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded-2xl border border-red-200 dark:border-red-800 flex items-center gap-2 font-bold animate-fadeIn">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Log Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Log Date
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenDatePicker(prev => !prev)}
                    className="w-full flex items-center justify-between py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <span>{dateStr || 'dd-mm-yyyy'}</span>
                    <Calendar className="h-4 w-4 text-primary dark:text-blue-400" />
                  </button>
                  {openDatePicker && (
                    <CustomDatePickerModal
                      selectedDate={dateStr}
                      onSelectDate={(newDate) => {
                        setDateStr(newDate);
                        setOpenDatePicker(false);
                      }}
                      onClose={() => setOpenDatePicker(false)}
                    />
                  )}
                </div>
              </div>

              {/* Flock 100 Liq */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Flock 100 Liq (Liters)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    step="0.1"
                    value={flockLiqStr}
                    onChange={e => setFlockLiqStr(e.target.value)}
                    className="block w-full py-2.5 pl-3.5 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-extrabold focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition shadow-2xs"
                    placeholder="e.g. 14.5"
                  />
                  <span className="absolute right-3.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                    L
                  </span>
                </div>
              </div>

              {/* Flock Master Solid */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Flock Master Solid (kg)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    step="0.1"
                    value={flockMasterStr}
                    onChange={e => setFlockMasterStr(e.target.value)}
                    className="block w-full py-2.5 pl-3.5 pr-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-extrabold focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition shadow-2xs"
                    placeholder="e.g. 7.0"
                  />
                  <span className="absolute right-3.5 text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                    kg
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 hover:from-blue-700 hover:via-teal-700 hover:to-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Log ETP Consumption</span>
            </button>
          </form>
        </div>

        {/* Recent Logs List */}
        <div className="bg-white dark:bg-surface-dark border border-slate-200/90 dark:border-slate-700/90 rounded-3xl p-6 shadow-sm">
          
          {/* Header with 3-Line Filter Icon & Accent Lines */}
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                <ListFilter className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                Recent ETP Logs
              </h3>
            </div>
            
            {/* 3 Horizontal Lines Graphic */}
            <div className="flex items-center gap-1">
              <span className="w-4 h-0.5 bg-teal-500 rounded-full" />
              <span className="w-3 h-0.5 bg-blue-500 rounded-full" />
              <span className="w-1.5 h-0.5 bg-indigo-500 rounded-full" />
            </div>
          </div>

          {/* Search Input */}
          <div className="mb-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-2.5 flex items-center gap-2 shadow-2xs">
            <Search className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search logs by date or operator..."
              className="bg-transparent border-none text-xs font-semibold focus:outline-none w-full dark:text-white"
            />
          </div>

          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              <Droplet className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">No ETP chemical logs match your criteria.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {filteredLogs
                  .slice()
                  .sort((a, b) => b.id.localeCompare(a.id))
                  .slice(0, visibleCount)
                  .map(log => (
                    <div
                      key={log.id}
                      className="p-4 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/80 hover:shadow-md transition-all duration-200 space-y-3 text-left group"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                            Date: {log.date}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          Logged by: <span className="text-slate-800 dark:text-slate-200 font-extrabold">{log.operator}</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="bg-blue-50/80 dark:bg-blue-950/40 p-2 rounded-xl border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 font-sans">Flock 100:</span>
                          <span className="font-black text-blue-700 dark:text-blue-300">{log.flockLiq} L</span>
                        </div>
                        <div className="bg-teal-50/80 dark:bg-teal-950/40 p-2 rounded-xl border border-teal-200/60 dark:border-teal-800/60 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 font-sans">Flock Master:</span>
                          <span className="font-black text-teal-700 dark:text-teal-300">{log.flockMaster} kg</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* View More Controls */}
              {filteredLogs.length > 5 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 font-sans">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Showing <strong className="text-slate-900 dark:text-white font-mono">{Math.min(visibleCount, filteredLogs.length)}</strong> of <strong className="text-slate-900 dark:text-white font-mono">{filteredLogs.length}</strong> logs
                  </span>
                  <div>
                    {visibleCount < filteredLogs.length ? (
                      <button
                        type="button"
                        onClick={() => setVisibleCount(prev => prev + 5)}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-extrabold text-[11px] rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>View More ({filteredLogs.length - visibleCount})</span>
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setVisibleCount(5)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-[11px] rounded-xl transition cursor-pointer flex items-center gap-1"
                      >
                        <span>Show Less</span>
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default EtpView;
