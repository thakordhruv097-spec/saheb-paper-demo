import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { getFormulas, saveFormula } from '../../data/index';
import type { PulpFormula } from '../../data/types';
import { CustomDatePickerModal } from '../../components/CustomDatePickerModal';
import { DataFilterBar } from '../../components/DataFilterBar';
import { StepHeaderBadge } from '../../components/ProcessWorkflowGuide';
import {
  Factory,
  Plus,
  Scale,
  Search,
  CheckCircle2,
  ListFilter,
  Beaker,
  Calendar,
  Clock,
  Save,
  AlertCircle,
  TrendingUp,
  FileText,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Copy,
  Package,
  ArrowUpDown,
} from 'lucide-react';

interface DowntimeLog {
  id: string;
  durationMinutes: number;
  reason: string;
  timestamp: string;
}

export const PulpMillView: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showAllHistory, setShowAllHistory] = useState(false);

  const [formulas, setFormulas] = useState<PulpFormula[]>(() => getFormulas());
  const [searchTerm, setSearchTerm] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');

  // Date selection state
  const [dateStr, setDateStr] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const dateBtnRef = useRef<HTMLButtonElement | null>(null);

  // Downtime state
  const [downtimeLogs, setDowntimeLogs] = useState<DowntimeLog[]>(() => {
    const saved = localStorage.getItem('saheb_pulp_downtimes');
    return saved ? JSON.parse(saved) : [
      { id: 'dt-1', durationMinutes: 25, reason: 'Hydrapulper rotor belt inspection', timestamp: '2026-08-08 11:30' },
      { id: 'dt-2', durationMinutes: 15, reason: 'Pulp pump valve cleaning', timestamp: '2026-08-08 14:15' },
    ];
  });
  const [downtimeMinutes, setDowntimeMinutes] = useState('');
  const [downtimeReason, setDowntimeReason] = useState('');

  // Feedback states
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 6 Waste Mix items
  const [wasteMix, setWasteMix] = useState<Record<string, number>>({
    'Indian Tissue Waste': 50,
    'Imported Tissue Waste': 0,
    SMK: 20,
    Cupstock: 0,
    'Pulp Sheet': 10,
    Broke: 20,
  });

  // Top Chemical items
  const [chemicals, setChemicals] = useState<Record<string, number>>({
    DSR: 10,
    WSR: 15,
    'Hydrogen Peroxide': 0,
    Hypo: 0,
    'Bleaching Powder': 0,
    Caustic: 0,
    OBA: 0,
  });

  // Load formula if already exists for dateStr
  useEffect(() => {
    const existing = formulas.find(f => f.date === dateStr);
    if (existing) {
      if (existing.wasteMix) setWasteMix({ ...existing.wasteMix });
      if (existing.chemicals) setChemicals({ ...existing.chemicals });
    }
  }, [dateStr, formulas]);

  const handleWasteChange = (name: string, val: string) => {
    const num = parseFloat(val) || 0;
    setWasteMix(prev => ({
      ...prev,
      [name]: num,
    }));
  };

  const handleChemicalChange = (name: string, val: string) => {
    const num = parseFloat(val) || 0;
    setChemicals(prev => ({
      ...prev,
      [name]: num,
    }));
  };

  const totalWastePct = useMemo(() => {
    return Object.values(wasteMix).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }, [wasteMix]);

  const isFormula100 = Math.abs(totalWastePct - 100) < 0.001;

  const handleSubmitFormula = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!dateStr) {
      setErrorMsg('Date is required');
      return;
    }

    if (!isFormula100) {
      setErrorMsg(`Waste paper formula share must equal exactly 100% (Current sum: ${totalWastePct}%)`);
      return;
    }

    const formulaObj: PulpFormula = {
      id: `form-${dateStr}`,
      date: dateStr,
      wasteMix: { ...wasteMix },
      chemicals: { ...chemicals },
    };

    saveFormula(formulaObj, user?.displayName || 'System');
    setFormulas(getFormulas());
    setSuccessMsg(`Pulp Mill Formula & Chemical Rates for ${dateStr} saved successfully!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleAddDowntime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!downtimeMinutes || !downtimeReason.trim()) return;

    const newLog: DowntimeLog = {
      id: `dt-${Date.now()}`,
      durationMinutes: parseInt(downtimeMinutes, 10),
      reason: downtimeReason.trim(),
      timestamp: new Date().toLocaleString('en-IN', { hour12: false }),
    };

    const updated = [newLog, ...downtimeLogs];
    setDowntimeLogs(updated);
    localStorage.setItem('saheb_pulp_downtimes', JSON.stringify(updated));
    setDowntimeMinutes('');
    setDowntimeReason('');
    setSuccessMsg(`Downtime entry (${newLog.durationMinutes} mins) recorded.`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const [sortAscending, setSortAscending] = useState(true);

  const filteredFormulas = useMemo(() => {
    let list = [...formulas];
    // Text search
    const q = searchTerm.toLowerCase().trim();
    if (q) {
      list = list.filter(f => {
        const formattedDate = f.date.split('-').reverse().join('-');
        return (
          f.date.toLowerCase().includes(q) ||
          formattedDate.toLowerCase().includes(q)
        );
      });
    }
    // Date range filter
    if (historyDateFrom) {
      list = list.filter(f => f.date >= historyDateFrom);
    }
    if (historyDateTo) {
      list = list.filter(f => f.date <= historyDateTo);
    }

    // Sort by date based on sortAscending
    list.sort((a, b) => {
      if (sortAscending) {
        return a.date.localeCompare(b.date);
      } else {
        return b.date.localeCompare(a.date);
      }
    });

    return list;
  }, [formulas, searchTerm, historyDateFrom, historyDateTo, sortAscending]);

  // Detect formulas identical to chronological previous day
  const sameAsPrevSet = useMemo(() => {
    const sorted = [...formulas].sort((a, b) => a.date.localeCompare(b.date));
    const set = new Set<string>();

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const prev = sorted[i - 1];

      const currentWaste = Object.entries(current.wasteMix || {}).filter(([_, v]) => Number(v) > 0);
      const prevWaste = Object.entries(prev.wasteMix || {}).filter(([_, v]) => Number(v) > 0);

      let matches = currentWaste.length === prevWaste.length;
      if (matches) {
        for (const [k, v] of currentWaste) {
          if (prev.wasteMix[k] !== v) {
            matches = false;
            break;
          }
        }
      }

      if (matches) {
        const currentChem = Object.entries(current.chemicals || {}).filter(([_, v]) => Number(v) > 0);
        const prevChem = Object.entries(prev.chemicals || {}).filter(([_, v]) => Number(v) > 0);
        if (currentChem.length !== prevChem.length) {
          matches = false;
        } else {
          for (const [k, v] of currentChem) {
            if (prev.chemicals[k] !== v) {
              matches = false;
              break;
            }
          }
        }
      }

      if (matches) {
        set.add(current.id);
      }
    }

    return set;
  }, [formulas]);

  const getWasteBadgeStyle = (name: string, index: number) => {
    const n = name.toLowerCase();
    if (n.includes('broke') || n.includes('mill')) {
      return 'bg-amber-100/80 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300/80 dark:border-amber-700/80';
    }
    if (n.includes('craft') || n.includes('corrugat') || n.includes('occ')) {
      return 'bg-blue-100/80 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-300/80 dark:border-blue-700/80';
    }
    if (n.includes('office') || n.includes('white') || n.includes('sheet')) {
      return 'bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-700/80';
    }
    const fallbackStyles = [
      'bg-blue-100/80 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-300/80 dark:border-blue-700/80',
      'bg-amber-100/80 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300/80 dark:border-amber-700/80',
      'bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-700/80',
      'bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300/80 dark:border-slate-700',
      'bg-indigo-100/80 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 border-indigo-300/80 dark:border-indigo-700/80',
    ];
    return fallbackStyles[index % fallbackStyles.length];
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header with Saheb Paper Branding */}
      <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider font-heading">
                  Pulp Mill Daily Setup & Formula Rules
                </h2>
                <StepHeaderBadge stepNumber={3} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-tight">
                Date: <strong className="text-slate-900 dark:text-white font-mono">{dateStr.split('-').reverse().join('/')}</strong> &bull; Governs automatic raw material deduction on Machine Production.
              </p>
            </div>
          </div>
        </div>

        {/* Date Switcher Pill */}
        <div className="flex items-center gap-2">
          <button
            ref={dateBtnRef}
            type="button"
            onClick={() => setOpenDatePicker(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black text-slate-700 dark:text-slate-200 cursor-pointer transition"
          >
            <Calendar className="h-4 w-4 text-primary dark:text-blue-400" />
            <span>Select Date: {dateStr.split('-').reverse().join('/')}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-2xl border border-emerald-200 dark:border-emerald-800 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs rounded-2xl border border-red-200 dark:border-red-800 font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Dual Cards Grid */}
      <form onSubmit={handleSubmitFormula} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Waste Paper Consumption Share (%) */}
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" />
                1. Waste Paper Consumption (%)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Total mix share must sum to exactly 100%
              </p>
            </div>
            
            <div className={`px-3 py-1.5 rounded-2xl text-xs font-black flex items-center gap-1.5 border transition-all ${
              isFormula100
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
            }`}>
              {!isFormula100 && <AlertCircle className="h-3.5 w-3.5" />}
              <span>Total: {totalWastePct}% {isFormula100 ? '(Valid)' : '(Warning)'}</span>
            </div>
          </div>

          <div className="space-y-3">
            {Object.keys(wasteMix).map(name => (
              <div key={name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{name}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={wasteMix[name] !== undefined ? wasteMix[name] : ''}
                    onChange={e => handleWasteChange(name, e.target.value)}
                    className="w-24 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-right dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0"
                  />
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Chemical Consumption Rates (kg / Ton) */}
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Beaker className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                2. Chemical Dosage Rates (kg / Ton of Paper)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Deducted automatically based on machine production weight
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.keys(chemicals).map(chemName => (
                <div key={chemName} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-2">{chemName}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={chemicals[chemName] !== undefined ? chemicals[chemName] : ''}
                      onChange={e => handleChemicalChange(chemName, e.target.value)}
                      className="w-20 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-right dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0"
                    />
                    <span className="text-[10px] font-bold text-slate-400">kg/T</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              <span>Save Formula & Chemical Rates</span>
            </button>
          </div>
        </div>

      </form>

      {/* Pulp Mill Downtime Logger Section */}
      <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Pulp Mill Downtime Logger (Date: {dateStr.split('-').reverse().join('/')})
            </h3>
          </div>
        </div>

        <form onSubmit={handleAddDowntime} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="number"
            min="1"
            placeholder="Duration (Minutes)"
            value={downtimeMinutes}
            onChange={e => setDowntimeMinutes(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white focus:ring-2 focus:ring-primary focus:outline-none font-mono"
            required
          />
          <input
            type="text"
            placeholder="Downtime Reason (e.g. Rotor belt inspection / Pump cleaning)"
            value={downtimeReason}
            onChange={e => setDowntimeReason(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white focus:ring-2 focus:ring-primary focus:outline-none sm:col-span-2"
            required
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 cursor-pointer transition flex items-center justify-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Record Downtime</span>
          </button>
        </form>

        {/* Saved Downtimes List */}
        <div className="space-y-2 pt-2">
          {downtimeLogs.length === 0 ? (
            <p className="text-xs text-slate-400 font-medium italic">No downtime recorded for today.</p>
          ) : (
            downtimeLogs.map(dt => (
              <div key={dt.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{dt.reason}</span>
                  <span className="block text-[10px] text-slate-400 font-mono">{dt.timestamp}</span>
                </div>
                <span className="font-black px-3 py-1 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 font-mono">
                  {dt.durationMinutes} Mins
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Saved Formulas History Table */}
      <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Saved Pulp Formulas History
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Historical waste paper mix & chemical dosage records
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-2 flex items-center gap-2 w-full md:w-56">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search date..."
                className="bg-transparent border-none text-xs font-semibold focus:outline-none w-full dark:text-white placeholder-slate-400"
              />
            </div>
            <DataFilterBar
              dateFrom={historyDateFrom}
              dateTo={historyDateTo}
              onDateFromChange={setHistoryDateFrom}
              onDateToChange={setHistoryDateTo}
              onClearAll={() => { setHistoryDateFrom(''); setHistoryDateTo(''); }}
            />
            <button
              type="button"
              onClick={() => setSortAscending(prev => !prev)}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shrink-0"
              title={sortAscending ? 'Order: Ascending (Oldest First)' : 'Order: Descending (Newest First)'}
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
              <span>{sortAscending ? 'Ascending' : 'Descending'}</span>
            </button>
          </div>
        </div>

        {/* Card-Based Layout for History Records */}
        {filteredFormulas.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 font-medium bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            No formula records match your search or date filter.
          </div>
        ) : (
          <div className="space-y-3.5">
            {(showAllHistory || searchTerm || historyDateFrom || historyDateTo
              ? filteredFormulas
              : filteredFormulas.slice(0, 3)
            ).map(f => {
              const wasteEntries = Object.entries(f.wasteMix || {}).filter(([_, val]) => Number(val) > 0);
              const chemEntries = Object.entries(f.chemicals || {}).filter(([_, val]) => Number(val) > 0);
              const isSameAsPrev = sameAsPrevSet.has(f.id);

              return (
                <div
                  key={f.id}
                  className="p-4 sm:p-5 bg-slate-50/60 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-2xs"
                >
                  {/* Card Header: Date & Indicators */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-xl bg-primary/10 text-primary dark:bg-blue-950/60 dark:text-blue-400">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                          {f.date.split('-').reverse().join('/')}
                        </span>
                      </div>

                      {isSameAsPrev && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-300/80 dark:border-sky-700/80">
                          <Copy className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                          <span>Same as previous day</span>
                        </span>
                      )}
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800">
                      Active Engine
                    </span>
                  </div>

                  {/* Card Body: Separated Sections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Section 1: Waste Paper Mix */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          Waste Paper Mix (100% Total)
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 font-mono">
                          {wasteEntries.reduce((sum, [_, v]) => sum + Number(v), 0)}%
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {wasteEntries.length === 0 ? (
                          <span className="text-slate-400 italic text-[11px]">No waste mix logged</span>
                        ) : (
                          wasteEntries.map(([name, val], idx) => {
                            const badgeStyle = getWasteBadgeStyle(name, idx);
                            return (
                              <span
                                key={name}
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 shadow-2xs ${badgeStyle}`}
                              >
                                <span>{name}</span>
                                <strong className="font-mono font-black text-[11px] bg-white/60 dark:bg-black/30 px-1.5 py-0.5 rounded-lg">
                                  {val}%
                                </strong>
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Section 2: Chemical Dosage Rates */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Beaker className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                          Chemical Rates (kg/Ton)
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {chemEntries.length === 0 ? (
                          <span className="text-slate-400 italic text-[11px]">Standard dosage</span>
                        ) : (
                          chemEntries.map(([name, val]) => (
                            <span
                              key={name}
                              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-100/80 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border border-purple-300/80 dark:border-purple-700/80 flex items-center gap-1.5 shadow-2xs"
                            >
                              <span>{name}</span>
                              <strong className="font-mono font-black text-[11px] bg-white/60 dark:bg-black/30 px-1.5 py-0.5 rounded-lg">
                                {val} kg/T
                              </strong>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredFormulas.length > 3 && !searchTerm && !historyDateFrom && !historyDateTo && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowAllHistory(!showAllHistory)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-primary/10 dark:hover:bg-blue-950/50 text-primary dark:text-blue-400 font-black text-xs rounded-2xl border border-slate-200/80 dark:border-slate-700 transition cursor-pointer inline-flex items-center gap-2 shadow-2xs"
                >
                  <span>{showAllHistory ? 'Show Less History' : `View More History (${filteredFormulas.length - 3} more records)`}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showAllHistory ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Date Picker Modal */}
      {openDatePicker && (
        <CustomDatePickerModal
          selectedDate={dateStr}
          onSelectDate={(newDate) => {
            setDateStr(newDate);
            setOpenDatePicker(false);
          }}
          onClose={() => setOpenDatePicker(false)}
          triggerRef={dateBtnRef}
        />
      )}
    </div>
  );
};
