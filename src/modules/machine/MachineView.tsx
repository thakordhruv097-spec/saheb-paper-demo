import React, { useState, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getRolls, saveRoll, getProducts, getFormulaForDate, getFormulaInfoForDate } from '../../data/index';
import type { MachineRoll } from '../../data/types';
import { CustomDatePickerModal } from '../../components/CustomDatePickerModal';
import { DataFilterBar } from '../../components/DataFilterBar';
import { CustomSearchableSelect } from '../../components/CustomSearchableSelect';
import { Cog, Plus, Info, Search, Calendar, Clock } from 'lucide-react';

import { WorkflowStepBadge, WORKFLOW_STEPS } from '../../components/WorkflowStepBadge';
import { useDateFilter, isDateInTimeframe } from '../../context/DateFilterContext';

export const MachineView: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { timeframe, selectedDate } = useDateFilter();

  const [rolls, setRolls] = useState<MachineRoll[]>(() => getRolls());
  const products = getProducts();

  // Success / Error States
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Search State
  const [searchRoll, setSearchRoll] = useState('');
  const [machDateFrom, setMachDateFrom] = useState('');
  const [machDateTo, setMachDateTo] = useState('');
  const [machShiftFilter, setMachShiftFilter] = useState('all');
  const [machProductFilter, setMachProductFilter] = useState('all');

  // Filtered Rolls Memo
  const filteredRolls = useMemo(() => {
    let list = rolls;
    // 1. Timeframe Filter (Day, Week, Month, All)
    if (timeframe && selectedDate) {
      list = list.filter(r => isDateInTimeframe(r.date, selectedDate, timeframe));
    }
    if (searchRoll.trim()) {
      const term = searchRoll.toLowerCase();
      list = list.filter(r => 
        r.rollNo.toLowerCase().includes(term) ||
        r.product.toLowerCase().includes(term) ||
        String(r.gsm).includes(term) ||
        String(r.width).includes(term)
      );
    }
    if (machDateFrom) list = list.filter(r => r.date >= machDateFrom);
    if (machDateTo) list = list.filter(r => r.date <= machDateTo);
    if (machShiftFilter && machShiftFilter !== 'all') list = list.filter(r => r.shift === machShiftFilter);
    if (machProductFilter && machProductFilter !== 'all') list = list.filter(r => r.product === machProductFilter);
    return list;
  }, [rolls, searchRoll, machDateFrom, machDateTo, machShiftFilter, machProductFilter, timeframe, selectedDate]);

  // Form States - load from localStorage if present
  const [dateStr, setDateStr] = useState(() => {
    return localStorage.getItem('draft_roll_date') || (() => {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    })();
  });
  const [openDatePicker, setOpenDatePicker] = useState(false);

  // Check if today's date is using previous day's formula
  const formulaInfo = useMemo(() => getFormulaInfoForDate(dateStr), [dateStr]);

  const [rollNo, setRollNo] = useState(() => localStorage.getItem('draft_roll_no') || '');
  const [selectedProductId, setSelectedProductId] = useState(() => localStorage.getItem('draft_roll_product_id') || '');
  const [weightStr, setWeightStr] = useState(() => localStorage.getItem('draft_roll_weight') || '');
  const [gsmStr, setGsmStr] = useState(() => localStorage.getItem('draft_roll_gsm') || '');
  const [widthStr, setWidthStr] = useState(() => localStorage.getItem('draft_roll_width') || '30');
  const [jointStr, setJointStr] = useState(() => localStorage.getItem('draft_roll_joint') || '0');
  const [diaStr, setDiaStr] = useState(() => localStorage.getItem('draft_roll_dia') || '1150');
  const [shift, setShift] = useState<'A' | 'B'>(() => (localStorage.getItem('draft_roll_shift') as 'A' | 'B') || 'A');
  const [startTime, setStartTime] = useState(() => localStorage.getItem('draft_roll_start_time') || '08:00');
  const [offTime, setOffTime] = useState(() => localStorage.getItem('draft_roll_off_time') || '16:00');
  const [downtimeReason, setDowntimeReason] = useState(() => localStorage.getItem('draft_roll_downtime') || '');
  
  // Persist values to localStorage
  React.useEffect(() => {
    localStorage.setItem('draft_roll_date', dateStr);
    localStorage.setItem('draft_roll_no', rollNo);
    localStorage.setItem('draft_roll_product_id', selectedProductId);
    localStorage.setItem('draft_roll_weight', weightStr);
    localStorage.setItem('draft_roll_gsm', gsmStr);
    localStorage.setItem('draft_roll_width', widthStr);
    localStorage.setItem('draft_roll_joint', jointStr);
    localStorage.setItem('draft_roll_dia', diaStr);
    localStorage.setItem('draft_roll_shift', shift);
    localStorage.setItem('draft_roll_start_time', startTime);
    localStorage.setItem('draft_roll_off_time', offTime);
    localStorage.setItem('draft_roll_downtime', downtimeReason);
  }, [dateStr, rollNo, selectedProductId, weightStr, gsmStr, widthStr, jointStr, diaStr, shift, startTime, offTime, downtimeReason]);

  const clearDraft = () => {
    localStorage.removeItem('draft_roll_date');
    localStorage.removeItem('draft_roll_no');
    localStorage.removeItem('draft_roll_product_id');
    localStorage.removeItem('draft_roll_weight');
    localStorage.removeItem('draft_roll_gsm');
    localStorage.removeItem('draft_roll_width');
    localStorage.removeItem('draft_roll_joint');
    localStorage.removeItem('draft_roll_dia');
    localStorage.removeItem('draft_roll_shift');
    localStorage.removeItem('draft_roll_start_time');
    localStorage.removeItem('draft_roll_off_time');
    localStorage.removeItem('draft_roll_downtime');
  };

  // Helper for working time calculation in minutes
  const calculateWorkingMinutes = (start: string, off: string): number => {
    if (!start || !off) return 0;
    const [sH, sM] = start.split(':').map(Number);
    const [oH, oM] = off.split(':').map(Number);
    if (isNaN(sH) || isNaN(sM) || isNaN(oH) || isNaN(oM)) return 0;
    let startMin = sH * 60 + sM;
    let offMin = oH * 60 + oM;
    if (offMin < startMin) {
      offMin += 24 * 60; // Overnight
    }
    return Math.max(0, offMin - startMin);
  };

  // Filter products for machine production (all Grade A products)
  const filteredProducts = useMemo(() => {
    return products.filter(p => p.grade === 'A');
  }, [products]);

  // Auto-generate roll number based on date and count (e.g. R-YYYYMMDD-0001, R-YYYYMMDD-0002)
  const autoRollNo = useMemo(() => {
    const cleanDate = (dateStr || '').replace(/-/g, '');
    const prefix = `R-${cleanDate}-`;
    let maxSeq = 0;

    rolls.forEach(r => {
      if (r && r.rollNo) {
        const rUpper = r.rollNo.toUpperCase();
        const pUpper = prefix.toUpperCase();
        if (rUpper.startsWith(pUpper)) {
          const suffix = rUpper.slice(pUpper.length);
          const num = parseInt(suffix, 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        } else if (r.date === dateStr) {
          const match = r.rollNo.match(/(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxSeq) {
              maxSeq = num;
            }
          }
        }
      }
    });

    const nextIndex = maxSeq + 1;
    const padIndex = String(nextIndex).padStart(4, '0');
    return `R-${cleanDate}-${padIndex}`;
  }, [dateStr, rolls]);

  // Set default GSM & Size when product is selected
  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    const prod = products.find(p => p.id === id);
    if (prod) {
      setGsmStr(String(prod.gsm));
      setWidthStr(String(prod.size || 30));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const targetRollNo = rollNo.trim() || autoRollNo;
    const prod = products.find(p => p.id === selectedProductId);
    const weight = parseFloat(weightStr);
    const gsm = parseFloat(gsmStr);
    const width = parseFloat(widthStr);

    if (!selectedProductId || isNaN(weight) || isNaN(gsm) || isNaN(width)) {
      setErrorMsg('Please enter a valid product, weight, GSM, and width.');
      return;
    }

    if (weight <= 0 || gsm <= 0 || width <= 0) {
      setErrorMsg('Weight, GSM, and Width must be positive numbers.');
      return;
    }

    // Verify if roll number is already used
    if (rolls.some(r => r.rollNo.toUpperCase() === targetRollNo.toUpperCase())) {
      setErrorMsg(`Roll number #${targetRollNo} has already been logged.`);
      return;
    }

    // Get pulp mill recipe formula for target date (with automatic fallback)
    const formula = getFormulaForDate(dateStr);

    const rollObj: MachineRoll = {
      rollNo: targetRollNo,
      product: prod ? prod.name : 'Unknown Product',
      weight,
      gsm,
      width,
      dia: parseFloat(diaStr) || 1150,
      joint: parseInt(jointStr) || 0,
      shift,
      startTime,
      offTime,
      workingMinutes: calculateWorkingMinutes(startTime, offTime),
      downtimeReason,
      date: dateStr,
      formulaId: formula.id,
    };

    try {
      saveRoll(rollObj, user?.displayName || 'System');
      setRolls(getRolls());
      setSuccessMsg(t('machine.save_success'));
      // Reset Form & clear draft
      setRollNo('');
      setWeightStr('');
      setGsmStr('');
      setWidthStr('30');
      setJointStr('0');
      setDowntimeReason('');
      clearDraft();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error logging roll');
    }
  };

  // Dynamic KPI Metrics
  const totalProductionKg = useMemo(() => rolls.reduce((acc, r) => acc + r.weight, 0), [rolls]);
  const avgRollWeight = useMemo(() => rolls.length > 0 ? Math.round(totalProductionKg / rolls.length) : 0, [rolls, totalProductionKg]);

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* 1. CLEAN MINIMAL HEADER CARD (OPTION A) */}
      <div className="bg-white dark:bg-[#131d38] rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-slate-900 dark:text-white shadow-xs relative z-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/50 text-primary dark:text-blue-400 shadow-2xs shrink-0">
              <Cog className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
                  {t('machine.title')}
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Log production parent rolls, monitor machine shifts, and manage jumbo roll output.
              </p>
            </div>
          </div>
        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Roll Entry Form (2/3 width) */}
        <div className="lg:col-span-2 neumorphic-card p-6">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-5 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            {t('machine.log_roll')}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {formulaInfo.isPreviousDay && (
              <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/30 text-blue-950 dark:text-blue-200 text-xs rounded-2xl border border-blue-200 dark:border-blue-800/60 font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 shrink-0">
                    <Info className="h-4 w-4" />
                  </div>
                  <span>Notice: No Pulp Mill formula saved for {dateStr}. Using previous day's formula ({formulaInfo.formulaDate}) for raw material auto-deduction.</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/pulp-mill-operations')}
                  className="px-3.5 py-1.5 bg-[#6C4FE0] hover:bg-[#5B3DC9] text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition shrink-0 cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
                >
                  <span>Set Today's Formula</span>
                  <span>→</span>
                </button>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-2xl border border-emerald-200 dark:border-emerald-800 font-bold">
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-2xl border border-red-200 dark:border-red-800 font-bold">
                {errorMsg}
              </div>
            )}

            {/* General Log Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="relative">
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Production Date
                </label>
                <button
                  type="button"
                  onClick={() => setOpenDatePicker(prev => !prev)}
                  className="w-full flex items-center justify-between py-2.5 px-3.5 bg-white dark:bg-slate-800 rounded-2xl text-xs font-bold text-slate-800 dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition"
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
                      setRollNo('');
                    }}
                    onClose={() => setOpenDatePicker(false)}
                  />
                )}
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Shift
                </label>
                <div className="grid grid-cols-2 gap-1 p-1 bg-white dark:bg-slate-800 rounded-2xl h-[42px] items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShift('A');
                      setStartTime('08:00');
                      setOffTime('16:00');
                    }}
                    className={`h-full rounded-xl text-xs transition-all duration-150 flex items-center justify-center cursor-pointer ${
                      shift === 'A'
                        ? 'bg-gradient-to-r from-[#6C4FE0] to-[#7C3AED] text-white shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold'
                    }`}
                  >
                    Day Shift
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShift('B');
                      setStartTime('20:00');
                      setOffTime('04:00');
                    }}
                    className={`h-full rounded-xl text-xs transition-all duration-150 flex items-center justify-center cursor-pointer ${
                      shift === 'B'
                        ? 'bg-gradient-to-r from-[#6C4FE0] to-[#7C3AED] text-white shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold'
                    }`}
                  >
                    Night Shift
                  </button>
                </div>
              </div>
            </div>

            {/* 1. Roll Data Section */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider border-b pb-2 border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Roll Data Parameters
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    value={rollNo}
                    onChange={e => setRollNo(e.target.value)}
                    className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                    placeholder={autoRollNo}
                  />
                </div>
                <div>
                  <CustomSearchableSelect
                    label="PRODUCT TYPE"
                    placeholder="-- Select Product --"
                    value={selectedProductId}
                    onChange={(val) => {
                      setSelectedProductId(val);
                      handleProductSelect(val);
                    }}
                    options={filteredProducts.map(p => ({
                      value: p.id,
                      label: p.name,
                    }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Weight (KG)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={weightStr}
                    onChange={e => setWeightStr(e.target.value)}
                    className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                    placeholder="Weight in kg"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      GSM
                    </label>
                    <input
                      type="number"
                      value={gsmStr}
                      onChange={e => setGsmStr(e.target.value)}
                      className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                      placeholder="17"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Roll Size (cm)
                    </label>
                    <input
                      type="number"
                      value={widthStr}
                      onChange={e => setWidthStr(e.target.value)}
                      className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Dia (mm)
                    </label>
                    <input
                      type="number"
                      value={diaStr}
                      onChange={e => setDiaStr(e.target.value)}
                      className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                      placeholder="1150"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Joint
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={jointStr}
                      onChange={e => setJointStr(e.target.value)}
                      className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Time & Downtime Section */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider border-b pb-2 border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                Time Tracking & Downtime Incidents
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Off Time
                  </label>
                  <input
                    type="time"
                    value={offTime}
                    onChange={e => setOffTime(e.target.value)}
                    className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                  />
                </div>
              </div>

              {/* Working Time Live Calculation Badge */}
              {(() => {
                const mins = calculateWorkingMinutes(startTime, offTime);
                const hrs = Math.floor(mins / 60);
                const remMins = mins % 60;
                return (
                  <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-primary dark:text-blue-400" />
                      Calculated Working Time:
                    </span>
                    <span className="text-primary dark:text-blue-400 font-mono font-black text-sm">
                      {mins} mins <span className="text-xs font-normal text-slate-500">({hrs}h {String(remMins).padStart(2, '0')}m)</span>
                    </span>
                  </div>
                );
              })()}

              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Down Time Reasons / Notes
                </label>
                <textarea
                  rows={2}
                  value={downtimeReason}
                  onChange={e => setDowntimeReason(e.target.value)}
                  className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                  placeholder="Log delays or downtime incidents here (if any)"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary-gradient w-full py-3.5 text-xs uppercase tracking-wider cursor-pointer"
            >
              Submit Machine Production Log
            </button>
          </form>
        </div>

        {/* Right Side: Recent Logged Rolls (1/3 width) */}
        <div className="neumorphic-card p-6">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Cog className="h-4 w-4 text-primary" />
            Recent Logged Rolls
          </h3>

          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchRoll}
                onChange={e => setSearchRoll(e.target.value)}
                placeholder="Search roll no, product..."
                className="w-full py-2 px-3 pl-8 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white placeholder-slate-400"
              />
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
            <DataFilterBar
              dateFrom={machDateFrom}
              dateTo={machDateTo}
              onDateFromChange={setMachDateFrom}
              onDateToChange={setMachDateTo}
              filterFields={[
                { id: 'shift', label: 'Shift', options: [{label: 'Day Shift', value: 'A'}, {label: 'Night Shift', value: 'B'}] },
                { id: 'product', label: 'Product', options: [...new Set(rolls.map(r => r.product))].map(p => ({label: p, value: p})) },
              ]}
              activeFilters={{ shift: machShiftFilter, product: machProductFilter }}
              onFilterChange={(fieldId, value) => {
                if (fieldId === 'shift') setMachShiftFilter(value);
                if (fieldId === 'product') setMachProductFilter(value);
              }}
              onClearAll={() => { setMachDateFrom(''); setMachDateTo(''); setMachShiftFilter('all'); setMachProductFilter('all'); }}
            />
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredRolls.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center font-medium">No production rolls found.</p>
            ) : (
              [...filteredRolls].reverse().slice(0, 15).map(r => {
                const isDay = (r.shift as string) === 'A' || (r.shift as string) === 'Day';
                const isNight = (r.shift as string) === 'B' || (r.shift as string) === 'Night';
                const shiftDisplay = isDay ? 'Day' : isNight ? 'Night' : r.shift;
                return (
                  <div key={r.rollNo} className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-black font-mono text-xs text-primary dark:text-blue-400">{r.rollNo}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        isDay 
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' 
                          : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                      }`}>
                        {shiftDisplay}
                      </span>
                    </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-slate-400 uppercase text-[9px] block">Product</span>
                      <span className="font-bold text-slate-900 dark:text-white truncate block">{r.product}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase text-[9px] block">Weight</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 block">{r.weight} kg</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase text-[9px] block">GSM</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{r.gsm}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase text-[9px] block">Roll Size</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{r.width} cm</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase text-[9px] block">Dia</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block font-mono">{r.dia || 1150} mm</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase text-[9px] block">Working Time</span>
                      <span className="font-bold text-primary dark:text-blue-400 block font-mono">
                        {r.workingMinutes ?? calculateWorkingMinutes(r.startTime, r.offTime)} mins
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase text-[9px] block">Joints</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block font-mono">{r.joint ?? 0}</span>
                    </div>
                  </div>
                  {r.downtimeReason && (
                    <div className="mt-1 text-[10px] text-amber-600 dark:text-amber-400 flex items-start gap-1 font-medium bg-amber-50/10 p-1.5 rounded-xl border border-amber-200/40">
                      <Info className="h-3.5 w-3.5 shrink-0" />
                      <span>Downtime: {r.downtimeReason}</span>
                    </div>
                  )}
                </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
export default MachineView;
