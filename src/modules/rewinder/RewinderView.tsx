import React, { useState, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { getRolls, getReels, saveReelsFromRoll } from '../../data/index';
import type { MachineRoll, Reel } from '../../data/types';
import { QRCodeSVG } from 'qrcode.react';
import { RotateCw, Play, Plus, Trash2, Printer, CheckCircle, Scissors, ListFilter } from 'lucide-react';

export const RewinderView: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [rolls, setRolls] = useState<MachineRoll[]>(() => getRolls());
  const [reels, setReels] = useState<Reel[]>(() => getReels());

  // Conversion Form States
  const [selectedRollNo, setSelectedRollNo] = useState('');
  const [brokeWeightStr, setBrokeWeightStr] = useState('0');
  const [reelRows, setReelRows] = useState<Array<{
    weight: string;
    dia: string;
    joint: string;
    ply: string;
    size: string;
  }>>([
    { weight: '200', dia: '800', joint: '0', ply: '2', size: '30' }
  ]);

  const [recentlyGenerated, setRecentlyGenerated] = useState<Reel[]>([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [printFormat, setPrintFormat] = useState<'tsc_4x3' | 'tsc_3x2' | 'tsc_2x2' | 'a4_grid'>('tsc_4x3');

  // Success / Error States
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const selectedRoll = useMemo(() => {
    return rolls.find(r => r.rollNo === selectedRollNo);
  }, [selectedRollNo, rolls]);

  const handleAddReelRow = () => {
    // Duplicate last row values for convenience
    const lastRow = reelRows[reelRows.length - 1] || { weight: '200', dia: '800', joint: '0', ply: '2', size: '30' };
    setReelRows([...reelRows, { ...lastRow }]);
  };

  const handleRemoveReelRow = (index: number) => {
    if (reelRows.length === 1) return;
    setReelRows(reelRows.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: string, val: string) => {
    const updated = [...reelRows];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    setReelRows(updated);
  };

  const handleRewindSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!selectedRoll) {
      setErrorMsg('Please select a parent Machine Roll');
      return;
    }

    const brokeWeight = parseFloat(brokeWeightStr) || 0;
    if (brokeWeight < 0) {
      setErrorMsg('Broke weight cannot be negative');
      return;
    }

    // Verify row numbers
    const processedReels: Reel[] = [];
    const baseDate = selectedRoll.date.replace(/-/g, '');
    const timestampSeed = Date.now().toString().slice(-4);

    for (let i = 0; i < reelRows.length; i++) {
      const row = reelRows[i];
      const weight = parseFloat(row.weight);
      const dia = parseFloat(row.dia);
      const joint = parseInt(row.joint);
      const ply = parseInt(row.ply);
      const size = parseFloat(row.size);

      if (isNaN(weight) || isNaN(dia) || isNaN(joint) || isNaN(ply) || isNaN(size)) {
        setErrorMsg(`Reel Row #${i + 1} contains invalid numeric data.`);
        return;
      }
      if (weight <= 0 || dia <= 0 || ply <= 0 || size <= 0) {
        setErrorMsg(`Reel Row #${i + 1} dimensions/weights must be positive numbers.`);
        return;
      }

      // Generate unique QR Reel No (e.g. REEL-20260716-0001)
      const reelIndex = reels.length + i + 1;
      const padIndex = String(reelIndex).padStart(4, '0');
      const reelNo = `REEL-${baseDate}-${padIndex}`;

      processedReels.push({
        reelNo,
        parentRollNo: selectedRoll.rollNo,
        product: selectedRoll.product,
        gsm: selectedRoll.gsm,
        size,
        ply,
        weight,
        dia,
        joint,
        status: 'QC_PENDING',
        qcGrade: 'PENDING',
        productionDate: `${selectedRoll.date} ${new Date().toLocaleTimeString('en-US', { hour12: false }).substring(0, 5)}`,
      });
    }

    // Call data access layer to process
    try {
      saveReelsFromRoll(selectedRoll.rollNo, processedReels, brokeWeight, user?.displayName || 'System');
      
      // Update states
      setReels(getReels());
      setRecentlyGenerated(processedReels);
      setShowQRModal(true);
      setSuccessMsg(`Roll rewound successfully! Returned ${brokeWeight} kg Broke waste.`);
      
      // Reset Form
      setSelectedRollNo('');
      setBrokeWeightStr('0');
      setReelRows([{ weight: '200', dia: '800', joint: '0', ply: '2', size: '30' }]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing roll rewinding');
    }
  };

  const handlePrintAllToday = () => {
    const todayStr = new Date().toISOString().substring(0, 10);
    const todaysReels = reels.filter(r => r.productionDate.startsWith(todayStr));
    if (todaysReels.length === 0) {
      alert("No reels have been produced today yet.");
      return;
    }
    setRecentlyGenerated(todaysReels);
    setShowQRModal(true);
  };

  const handlePrint = () => {
    let bodyClass = '';
    let pageSize = '';

    if (printFormat === 'tsc_4x3') {
      bodyClass = 'print-thermal-labels';
      pageSize = '4in 3in';
    } else if (printFormat === 'tsc_3x2') {
      bodyClass = 'print-thermal-labels';
      pageSize = '3in 2in';
    } else if (printFormat === 'tsc_2x2') {
      bodyClass = 'print-thermal-labels';
      pageSize = '2in 2in';
    } else {
      bodyClass = 'print-a4-labels';
      pageSize = 'A4 portrait';
    }

    // Set body class for scoped print CSS
    document.body.classList.add(bodyClass);

    // Create dynamic style tag for @page size
    const styleEl = document.createElement('style');
    styleEl.id = 'dynamic-label-print-style';
    styleEl.innerHTML = `@page { size: ${pageSize}; margin: 0; }`;
    document.head.appendChild(styleEl);

    // Trigger printing
    window.print();

    // Cleanup style and body class
    const cleanup = () => {
      document.body.classList.remove(bodyClass);
      const el = document.getElementById('dynamic-label-print-style');
      if (el) el.remove();
    };

    // Use standard window event or timeout for cleanup
    window.addEventListener('afterprint', cleanup, { once: true });
    setTimeout(cleanup, 2000);
  };

  const totalReelsConverted = useMemo(() => reels.length, [reels]);
  const totalReelWeightKg = useMemo(() => reels.reduce((acc, r) => acc + r.weight, 0), [reels]);
  const totalBrokeKg = useMemo(() => reels.reduce((acc, r) => acc + (r.joint * 15), 0), [reels]);

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* 1. HERO GRADIENT HEADER BANNER */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-lg shrink-0">
              <RotateCw className="h-8 w-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{t('rewinder.title')}</h2>
              </div>
              <p className="text-xs sm:text-sm text-blue-100/90 font-medium mt-1">
                Log roll-to-reel conversions, manage broke recycling loops, and output unique QR tracking labels.
              </p>
            </div>
          </div>

          <button
            onClick={handlePrintAllToday}
            className="px-5 py-3 rounded-2xl bg-white text-indigo-700 hover:bg-blue-50 font-black text-xs uppercase tracking-wider shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Printer className="h-4 w-4" />
            <span>Print All Today ({reels.filter(r => r.productionDate.startsWith(new Date().toISOString().substring(0, 10))).length})</span>
          </button>
        </div>
      </div>

      {/* 2. TOP METRIC SCORECARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
            <RotateCw className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Converted Reels</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalReelsConverted} <span className="text-xs text-slate-400 font-normal">reels</span></p>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
            <Play className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reel Stock Output</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalReelWeightKg.toLocaleString()} <span className="text-xs text-slate-400 font-normal">kg</span></p>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
            <Printer className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Broke Generated</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalBrokeKg.toLocaleString()} <span className="text-xs text-slate-400 font-normal">kg</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Form: Conversion Details (2/3 width) */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-sm">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-5 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Scissors className="h-4 w-4 text-primary" />
            {t('rewinder.convert_reels')}
          </h3>

          <form onSubmit={handleRewindSubmit} className="space-y-6">
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

            {/* Input Selection Block */}
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Select Parent Machine Roll
              </label>
              <select
                value={selectedRollNo}
                onChange={e => setSelectedRollNo(e.target.value)}
                className="block w-full py-2.5 px-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white cursor-pointer"
              >
                <option value="">-- Choose Roll --</option>
                {rolls.slice().sort((a, b) => b.rollNo.localeCompare(a.rollNo)).map(r => (
                  <option key={r.rollNo} value={r.rollNo}>
                    Roll #{r.rollNo} [{r.product}] - {r.weight}kg (GSM {r.gsm})
                  </option>
                ))}
              </select>
            </div>

            {/* Parent Details Card */}
            {selectedRoll && (
              <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 rounded-2xl border border-blue-200/60 dark:border-blue-800/60 text-xs space-y-2">
                <span className="font-black text-blue-900 dark:text-blue-300 uppercase tracking-wider text-[10px]">Parent Roll Specifications:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-800 dark:text-white font-semibold">
                  <div><span className="text-slate-400 text-[10px] uppercase font-bold block">Product</span> {selectedRoll.product}</div>
                  <div><span className="text-slate-400 text-[10px] uppercase font-bold block">GSM</span> {selectedRoll.gsm}</div>
                  <div><span className="text-slate-400 text-[10px] uppercase font-bold block">Width</span> {selectedRoll.width} mm</div>
                  <div><span className="text-slate-400 text-[10px] uppercase font-bold block">Weight</span> {selectedRoll.weight} kg</div>
                </div>
              </div>
            )}

            {/* 1. Broke Generation Section */}
            <div className="border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 bg-slate-50 dark:bg-slate-900 space-y-3">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider border-b pb-2 border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                Broke Generation
              </h4>
              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Broke / Wastage generated (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={brokeWeightStr}
                  onChange={e => setBrokeWeightStr(e.target.value)}
                  className="block w-full py-2.5 px-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Reels rows inputs */}
            <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Reel Output Configurations
                </span>
                <button
                  type="button"
                  onClick={handleAddReelRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm hover:scale-105 transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t('rewinder.add_reel')}</span>
                </button>
              </div>

              {reelRows.map((row, index) => (
                <div key={index} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/60 dark:bg-slate-900/40 space-y-3 relative">
                  
                  {/* Row Header */}
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Reel Output #{index + 1}
                    </span>
                    {reelRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveReelRow(index)}
                        className="text-red-500 hover:text-red-600 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {/* General Weight */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Reel Weight (kg)
                      </label>
                      <input
                        type="number"
                        value={row.weight}
                        onChange={e => handleRowChange(index, 'weight', e.target.value)}
                        className="block w-full py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono"
                      />
                    </div>

                    {/* Running Sizes */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Running Sizes (cm)
                      </label>
                      <input
                        type="number"
                        value={row.size}
                        onChange={e => handleRowChange(index, 'size', e.target.value)}
                        className="block w-full py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono"
                      />
                    </div>

                    {/* Ply and Diameter */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Ply and Diameter
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="number"
                          placeholder="Ply"
                          value={row.ply}
                          onChange={e => handleRowChange(index, 'ply', e.target.value)}
                          className="block w-full py-2 px-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono"
                          title="Ply"
                        />
                        <input
                          type="number"
                          placeholder="Dia (mm)"
                          value={row.dia}
                          onChange={e => handleRowChange(index, 'dia', e.target.value)}
                          className="block w-full py-2 px-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono"
                          title="Diameter (mm)"
                        />
                      </div>
                    </div>

                    {/* Joints */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Joints
                      </label>
                      <input
                        type="number"
                        value={row.joint}
                        onChange={e => handleRowChange(index, 'joint', e.target.value)}
                        className="block w-full py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCw className="h-4.5 w-4.5" />
              Save Reel Outputs & Return Broke
            </button>
          </form>
        </div>

        {/* Right Side: Logged List (1/3 width) */}
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <RotateCw className="h-4 w-4 text-primary" />
            Recent Converted Reels
          </h3>

          {reels.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center font-medium">
              No reels produced yet.
            </p>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {reels
                .slice()
                .sort((a, b) => b.productionDate.localeCompare(a.productionDate))
                .map(r => (
                  <div key={r.reelNo} className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/60 dark:bg-slate-900/60 hover:bg-blue-50/40 transition space-y-2.5 text-xs">
                    <div className="flex justify-between items-center border-b pb-2 dark:border-slate-800">
                      <span className="font-black text-slate-900 dark:text-white text-xs">{r.reelNo}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        r.status === 'QC_PENDING' ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200' :
                        r.status === 'IN_STOCK_B' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200' :
                        'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 text-[11px] text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="font-black text-slate-400 block uppercase tracking-wider text-[9px]">Reel No</span>
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{r.reelNo}</span>
                      </div>
                      <div>
                        <span className="font-black text-slate-400 block uppercase tracking-wider text-[9px]">Weight</span>
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{r.weight} kg</span>
                      </div>
                      <div>
                        <span className="font-black text-slate-400 block uppercase tracking-wider text-[9px]">Diameter</span>
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{r.dia} mm</span>
                      </div>
                      <div>
                        <span className="font-black text-slate-400 block uppercase tracking-wider text-[9px]">Joints</span>
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{r.joint}</span>
                      </div>
                      <div>
                        <span className="font-black text-slate-400 block uppercase tracking-wider text-[9px]">Produced</span>
                        <span className="font-bold text-slate-800 dark:text-white text-xs">{r.productionDate}</span>
                      </div>
                      <div>
                        <span className="font-black text-slate-400 block uppercase tracking-wider text-[9px]">GSM</span>
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{r.gsm}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t dark:border-slate-800 text-[10px] text-slate-400 font-medium">
                      Parent Roll: <span className="font-bold text-slate-800 dark:text-slate-200">#{r.parentRollNo}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

      </div>

      {/* QR Code Labels printable Modal */}
      {showQRModal && recentlyGenerated.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto print:p-0 print:shadow-none print:max-h-full">
            
            <div className="flex justify-between items-center border-b pb-3 dark:border-slate-700 print:hidden">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                Print QR Traceability Labels
              </h3>
              <button
                onClick={() => { setShowQRModal(false); setRecentlyGenerated([]); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Close
              </button>
            </div>

            {/* Layout Format Selection */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-200 dark:border-slate-700 print:hidden">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-0.5">
                  TSC Printer & Label Layout
                </label>
                <p className="text-[10px] text-text-light-secondary dark:text-slate-400">
                  Select dimensions matching your TSC thermal label roll or standard sheet.
                </p>
              </div>
              <select
                value={printFormat}
                onChange={(e) => setPrintFormat(e.target.value as any)}
                className="text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-52"
              >
                <option value="tsc_4x3">TSC Thermal Roll (4" x 3")</option>
                <option value="tsc_3x2">TSC Thermal Roll (3" x 2")</option>
                <option value="tsc_2x2">TSC Thermal Roll (2" x 2")</option>
                <option value="a4_grid">A4 Label Sheet (Grid)</option>
              </select>
            </div>

            {/* Labels Printable Area */}
            <div id="printable-qr-labels" className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 print:grid-cols-2 print:gap-8 bg-slate-100 dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              {recentlyGenerated.map(reel => (
                <div
                  key={reel.reelNo}
                  className="qr-label-card p-5 border-2 border-slate-900 rounded-xl bg-white text-slate-900 flex flex-col items-center text-center space-y-3 shadow-md print:border-2 print:border-black print:bg-white print:p-6 print:m-2"
                >
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1.5 w-full font-heading">
                    SAHEB PAPER PVT. LTD.
                  </h4>
                  
                  {/* QR SVG */}
                  <div className="bg-white p-2 border border-slate-200 rounded-lg shadow-2xs print:border-none">
                    <QRCodeSVG value={reel.reelNo} size={120} level="H" />
                  </div>
                  
                  {/* Text details */}
                  <div className="w-full text-left space-y-1.5 text-xs text-slate-900 font-sans">
                    <div className="flex justify-between border-b pb-1 border-dashed border-slate-300">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">REEL NO:</span>
                      <span className="font-black text-slate-900 font-mono text-xs tracking-tight">{reel.reelNo}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1 border-dashed border-slate-300">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">PRODUCT:</span>
                      <span className="font-black text-slate-900">{reel.product}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] border-b pb-1 border-dashed border-slate-300">
                      <div className="flex justify-between">
                        <span className="text-[10px] font-black text-slate-500">GSM:</span>
                        <span className="font-black text-slate-900">{reel.gsm}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] font-black text-slate-500">SIZE:</span>
                        <span className="font-black text-slate-900">{reel.size} cm</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[10px] font-black text-slate-500">PLY:</span>
                        <span className="font-black text-slate-900">{reel.ply}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] font-black text-slate-500">WEIGHT:</span>
                        <span className="font-black text-slate-900">{reel.weight} kg</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Controls */}
            <div className="flex justify-end gap-3 border-t pt-3 dark:border-slate-700 print:hidden">
              <button
                onClick={() => { setShowQRModal(false); setRecentlyGenerated([]); }}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Done
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-primary hover:bg-blue-800 text-white rounded text-xs font-semibold shadow flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                <span>{t('rewinder.print_label')}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
export default RewinderView;
