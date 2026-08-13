import React, { useState, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { getElectricityLogs, saveElectricityLog, getRolls } from '../../data/index';
import type { ElectricityLog } from '../../data/types';
import { CustomDatePickerModal } from '../../components/CustomDatePickerModal';
import { DataFilterBar } from '../../components/DataFilterBar';
import { Lightbulb, Plus, Search, ListFilter, CheckCircle2, AlertCircle, Zap, Calendar } from 'lucide-react';

export const ElectricityView: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [logs, setLogs] = useState<ElectricityLog[]>(() => getElectricityLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const rolls = getRolls();
  const [elecDateFrom, setElecDateFrom] = useState('');
  const [elecDateTo, setElecDateTo] = useState('');

  const filteredLogs = useMemo(() => {
    let list = logs;
    const q = searchTerm.toLowerCase().trim();
    if (q) {
      list = list.filter(
        l =>
          l.date.toLowerCase().includes(q) ||
          l.operator.toLowerCase().includes(q)
      );
    }
    if (elecDateFrom) list = list.filter(l => l.date >= elecDateFrom);
    if (elecDateTo) list = list.filter(l => l.date <= elecDateTo);
    return list;
  }, [logs, searchTerm, elecDateFrom, elecDateTo]);

  // Form States
  const [dateStr, setDateStr] = useState<string>(() => new Date().toISOString().substring(0, 10));
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [unitsStr, setUnitsStr] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccess('');
    setFormError('');

    const units = parseFloat(unitsStr);
    if (isNaN(units) || units <= 0) {
      setFormError('Units consumed must be a positive number');
      return;
    }

    const finalDate = dateStr || new Date().toISOString().substring(0, 10);

    const newLog: ElectricityLog = {
      id: `elec-${Date.now()}`,
      date: finalDate,
      units,
      operator: user?.displayName || 'System',
    };

    saveElectricityLog(newLog, user?.displayName || 'System');
    setLogs(getElectricityLogs());
    setFormSuccess('Electricity consumption logged successfully!');
    setUnitsStr('');
  };

  // Helper to compute production tons for a given date
  const getProductionTonsForDate = (date: string) => {
    const totalKg = rolls
      .filter(r => r.date === date)
      .reduce((sum, r) => sum + r.weight, 0);
    return totalKg / 1000;
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title & Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-slate-900 border border-amber-200/80 dark:border-amber-900/40 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0">
            <Lightbulb className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Electricity & Power Grid Module
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold uppercase tracking-wider border border-amber-300/50 flex items-center gap-1">
                <Zap className="h-3 w-3" /> kWh / Ton Power Efficiency
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
              Monitor daily grid power consumption and calculate specific power consumption relative to mill paper production.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Entry Form */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-dark border border-slate-200/90 dark:border-slate-700/90 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          
          {/* Header with 3-Line Filter Icon & Accent Lines (as shown in user's image) */}
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 pb-3 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <ListFilter className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  Log Daily Units Consumed (kWh)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Track grid power readings and specific power consumption per ton</p>
              </div>
            </div>
            
            {/* 3 Horizontal Lines Accent Graphic */}
            <div className="hidden sm:flex items-center gap-1">
              <span className="w-6 h-0.5 bg-amber-500 rounded-full" />
              <span className="w-4 h-0.5 bg-yellow-500 rounded-full" />
              <span className="w-2 h-0.5 bg-orange-500 rounded-full" />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Reading Date */}
              <div className="space-y-1.5 relative">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Reading Date
                </label>
                <button
                  type="button"
                  onClick={() => setOpenDatePicker(prev => !prev)}
                  className="w-full flex items-center justify-between py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <span className={dateStr ? 'font-bold text-slate-800 dark:text-white' : 'text-slate-400 font-normal'}>
                    {dateStr || 'dd-mm-yyyy'}
                  </span>
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

              {/* Daily Units Consumed (kWh) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Daily Units Consumed (kWh)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    value={unitsStr}
                    onChange={e => setUnitsStr(e.target.value)}
                    className="block w-full py-2.5 pl-3.5 pr-14 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-extrabold focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white transition shadow-2xs"
                    placeholder="e.g. 1500"
                  />
                  <span className="absolute right-3.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                    kWh
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 via-yellow-600 to-orange-600 hover:from-amber-600 hover:via-yellow-700 hover:to-orange-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Log Electricity Usage</span>
            </button>
          </form>
        </div>

        {/* Recent Logs List */}
        <div className="bg-white dark:bg-surface-dark border border-slate-200/90 dark:border-slate-700/90 rounded-3xl p-6 shadow-sm">
          
          {/* Header with 3-Line Filter Icon & Accent Lines */}
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <ListFilter className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                Recent Electricity Logs
              </h3>
            </div>
            
            {/* 3 Horizontal Lines Graphic */}
            <div className="flex items-center gap-1">
              <span className="w-4 h-0.5 bg-amber-500 rounded-full" />
              <span className="w-3 h-0.5 bg-yellow-500 rounded-full" />
              <span className="w-1.5 h-0.5 bg-orange-500 rounded-full" />
            </div>
          </div>

          {/* Search Input + Filter */}
          <div className="mb-4 flex items-center gap-2">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-2.5 flex items-center gap-2 shadow-2xs flex-1">
              <Search className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by date, operator..."
                className="bg-transparent border-none text-xs font-semibold focus:outline-none w-full dark:text-white"
              />
            </div>
            <DataFilterBar
              dateFrom={elecDateFrom}
              dateTo={elecDateTo}
              onDateFromChange={setElecDateFrom}
              onDateToChange={setElecDateTo}
              onClearAll={() => { setElecDateFrom(''); setElecDateTo(''); }}
            />
          </div>

          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              <Lightbulb className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">No power consumption logs match your criteria.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {filteredLogs
                .slice()
                .sort((a, b) => b.id.localeCompare(a.id))
                .map(log => {
                  const prodTons = getProductionTonsForDate(log.date);
                  const unitsPerTon = prodTons > 0 ? log.units / prodTons : null;

                  return (
                    <div
                      key={log.id}
                      className="p-4 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/80 hover:shadow-md transition-all duration-200 space-y-3 text-left group"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                        <span className="font-mono text-xs font-black text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                          Date: {log.date}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          Logged by: <span className="text-slate-800 dark:text-slate-200 font-extrabold">{log.operator}</span>
                        </span>
                      </div>

                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 font-sans">Units:</span>
                          <span className="font-black text-slate-900 dark:text-white">{log.units.toLocaleString()} kWh</span>
                        </div>
                        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 font-sans">Production:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{prodTons.toFixed(2)} tons</span>
                        </div>

                        <div className="flex items-center justify-between bg-amber-50/80 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200/60 dark:border-amber-800/60">
                          <span className="text-[11px] font-extrabold text-amber-800 dark:text-amber-300 font-sans flex items-center gap-1">
                            <Zap className="h-3 w-3" /> Power / Ton:
                          </span>
                          <span className="font-black text-amber-700 dark:text-amber-300">
                            {unitsPerTon ? `${unitsPerTon.toFixed(2)} kWh/ton` : 'N/A (0 prod)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default ElectricityView;
