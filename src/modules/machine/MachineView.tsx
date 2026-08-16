import React, { useState, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { getRolls, saveRoll, getProducts, getFormulaForDate, getGsmOptionsForProduct } from '../../data/index';
import type { MachineRoll } from '../../data/types';
import { CustomDatePickerModal } from '../../components/CustomDatePickerModal';
import { DataFilterBar } from '../../components/DataFilterBar';
import { StepHeaderBadge } from '../../components/ProcessWorkflowGuide';
import { Cog, Plus, Info, Search, Calendar } from 'lucide-react';

export const MachineView: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

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
  }, [rolls, searchRoll, machDateFrom, machDateTo, machShiftFilter, machProductFilter]);

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

  const [rollNo, setRollNo] = useState(() => localStorage.getItem('draft_roll_no') || '');
  const [selectedProductId, setSelectedProductId] = useState(() => localStorage.getItem('draft_roll_product_id') || '');
  const [weightStr, setWeightStr] = useState(() => localStorage.getItem('draft_roll_weight') || '');
  const [gsmStr, setGsmStr] = useState(() => localStorage.getItem('draft_roll_gsm') || '');
  const [widthStr, setWidthStr] = useState(() => localStorage.getItem('draft_roll_width') || '');
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
    localStorage.setItem('draft_roll_shift', shift);
    localStorage.setItem('draft_roll_start_time', startTime);
    localStorage.setItem('draft_roll_off_time', offTime);
    localStorage.setItem('draft_roll_downtime', downtimeReason);
  }, [dateStr, rollNo, selectedProductId, weightStr, gsmStr, widthStr, shift, startTime, offTime, downtimeReason]);

  const clearDraft = () => {
    localStorage.removeItem('draft_roll_date');
    localStorage.removeItem('draft_roll_no');
    localStorage.removeItem('draft_roll_product_id');
    localStorage.removeItem('draft_roll_weight');
    localStorage.removeItem('draft_roll_gsm');
    localStorage.removeItem('draft_roll_width');
    localStorage.removeItem('draft_roll_shift');
    localStorage.removeItem('draft_roll_start_time');
    localStorage.removeItem('draft_roll_off_time');
    localStorage.removeItem('draft_roll_downtime');
  };

  // Filter products for machine production (all Grade A products)
  const filteredProducts = useMemo(() => {
    return products.filter(p => p.grade === 'A');
  }, [products]);

  // Auto-generate roll number based on count
  const autoRollNo = useMemo(() => {
    const cleanDate = dateStr.replace(/-/g, '');
    const dateRolls = rolls.filter(r => r.date === dateStr);
    const index = dateRolls.length + 1;
    const padIndex = String(index).padStart(4, '0');
    return `R-${cleanDate}-${padIndex}`;
  }, [dateStr, rolls]);

  // Set default GSM when product is selected
  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    const prod = products.find(p => p.id === id);
    if (prod) {
      setGsmStr(String(prod.gsm));
      setWidthStr(String(prod.size * 100)); // size (cm) to width (mm) estimation, e.g. 2700mm
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

    // Check if formula exists for target date
    const formula = getFormulaForDate(dateStr);
    if (!formula) {
      setErrorMsg(t('machine.no_formula_error'));
      return;
    }

    const rollObj: MachineRoll = {
      rollNo: targetRollNo,
      product: prod ? prod.name : 'Unknown Product',
      weight,
      gsm,
      width,
      shift,
      startTime,
      offTime,
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
      setWidthStr('');
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
      
      {/* 1. HERO GRADIENT HEADER BANNER */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-visible z-20">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-lg shrink-0">
              <Cog className="h-8 w-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{t('machine.title')}</h2>
                <StepHeaderBadge stepNumber={4} />
              </div>
            </div>
          </div>
        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Roll Entry Form (2/3 width) */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-sm">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-5 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            {t('machine.log_roll')}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="w-full flex items-center justify-between py-2.5 px-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition"
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
              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Shift
                </label>
                <select
                  value={shift}
                  onChange={e => setShift(e.target.value as 'A' | 'B')}
                  className="block w-full py-2.5 px-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white cursor-pointer"
                >
                  <option value="A">Shift A (Day Shift)</option>
                  <option value="B">Shift B (Night Shift)</option>
                </select>
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
                    className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                    placeholder={autoRollNo}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Product Type
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={e => handleProductSelect(e.target.value)}
                    className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white cursor-pointer"
                  >
                    <option value="">-- Select Product --</option>
                    {filteredProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.gsm} GSM)
                      </option>
                    ))}
                  </select>
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
                    className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                    placeholder="Weight in kg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      GSM ({products.find(p => p.id === selectedProductId)?.name.toLowerCase().includes('toilet') ? '13 - 18' : '15 - 24'})
                    </label>
                    <select
                      value={gsmStr}
                      onChange={e => setGsmStr(e.target.value)}
                      className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white cursor-pointer"
                    >
                      {getGsmOptionsForProduct(products.find(p => p.id === selectedProductId)?.name || '').map(g => (
                        <option key={g} value={g}>{g} GSM</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Roll Width (MM)
                    </label>
                    <input
                      type="number"
                      value={widthStr}
                      onChange={e => setWidthStr(e.target.value)}
                      className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                      placeholder="2700"
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
                    className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
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
                    className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Down Time Reasons / Notes
                </label>
                <textarea
                  rows={2}
                  value={downtimeReason}
                  onChange={e => setDowntimeReason(e.target.value)}
                  className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                  placeholder="Log delays or downtime incidents here (if any)"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              Submit Machine Production Log
            </button>
          </form>
        </div>

        {/* Right Side: Recent Logged Rolls (1/3 width) */}
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-sm">
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
                className="w-full py-2 px-3 pl-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white placeholder-slate-400"
              />
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
            <DataFilterBar
              dateFrom={machDateFrom}
              dateTo={machDateTo}
              onDateFromChange={setMachDateFrom}
              onDateToChange={setMachDateTo}
              filterFields={[
                { id: 'shift', label: 'Shift', options: [{label: 'Shift A', value: 'A'}, {label: 'Shift B', value: 'B'}, {label: 'Shift C', value: 'C'}] },
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
              [...filteredRolls].reverse().slice(0, 15).map(r => (
                <div key={r.rollNo} className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-black font-mono text-xs text-primary dark:text-blue-400">{r.rollNo}</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-primary dark:text-blue-300 text-[9px] font-black uppercase">
                      Shift {r.shift}
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
                      <span className="text-slate-400 uppercase text-[9px] block">Roll Width</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{r.width} mm</span>
                    </div>
                  </div>
                  {r.downtimeReason && (
                    <div className="mt-1 text-[10px] text-amber-600 dark:text-amber-400 flex items-start gap-1 font-medium bg-amber-50/10 p-1.5 rounded-xl border border-amber-200/40">
                      <Info className="h-3.5 w-3.5 shrink-0" />
                      <span>Downtime: {r.downtimeReason}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
export default MachineView;
