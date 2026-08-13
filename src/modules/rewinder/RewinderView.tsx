import React, { useState, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { getRolls, getReels, getProducts, saveSingleReel, saveReelsFromRoll } from '../../data/index';
import type { MachineRoll, Reel } from '../../data/types';
import { QRCodeSVG } from 'qrcode.react';
import {
  RotateCw,
  Play,
  Plus,
  Trash2,
  Printer,
  CheckCircle,
  Scissors,
  RefreshCw,
  PackageCheck,
  Filter,
  X,
  AlertCircle,
  Search,
} from 'lucide-react';

export const RewinderView: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [rolls] = useState<MachineRoll[]>(() => getRolls());
  const [reels, setReels] = useState<Reel[]>(() => getReels());
  const masterProducts = useMemo(() => getProducts(), []);

  // Filter State
  const [selectedProductFilter, setSelectedProductFilter] = useState('all');

  // Helper functions for Reel No auto-increment
  const parseAndIncrementReelNo = (lastNo: string): string => {
    if (!lastNo || !lastNo.trim()) return 'RL-1001';
    const match = lastNo.match(/^(.*?)(\d+)$/);
    if (match) {
      const prefix = match[1];
      const numStr = match[2];
      const nextNum = parseInt(numStr, 10) + 1;
      const paddedNum = String(nextNum).padStart(numStr.length, '0');
      return `${prefix}${paddedNum}`;
    }
    return `${lastNo}-1`;
  };

  const getInitialReelNo = (existingReels: Reel[], offset = 0): string => {
    if (existingReels.length > 0) {
      const lastReel = existingReels[existingReels.length - 1];
      if (lastReel && lastReel.reelNo) {
        let current = lastReel.reelNo;
        for (let i = 0; i <= offset; i++) {
          current = parseAndIncrementReelNo(current);
        }
        return current;
      }
    }
    return `RL-${1001 + offset}`;
  };

  // Add Reel Modal Form State (Rudra DEMO2 style)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [reelForm, setReelForm] = useState({
    reelNo: getInitialReelNo(getReels(), 0),
    runningRollNo: 'M-001',
    runningSize: '1650 mm',
    productName: masterProducts[0]?.name || 'Napkin Tissue',
    gsm: '16',
    size: '30x30 cm',
    ply: '2',
    dia: '900',
    joint: '0',
    weightKg: '1500',
    brokeKg: '100',
  });

  const [modalError, setModalError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // QR Modal State
  const [recentlyGenerated, setRecentlyGenerated] = useState<Reel[]>([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [printFormat, setPrintFormat] = useState<'tsc_4x3' | 'tsc_3x2' | 'tsc_2x2' | 'a4_grid'>('tsc_4x3');

  // Computed Totals & Metrics
  const totalReelWeightKg = useMemo(() => reels.reduce((sum, r) => sum + Number(r.weight || 0), 0), [reels]);
  const totalBrokeKg = useMemo(() => reels.reduce((sum, r) => sum + (Number(r.joint || 0) * 15 + 20), 0), [reels]);
  const netFinishStockKg = useMemo(() => Math.max(0, totalReelWeightKg - totalBrokeKg), [totalReelWeightKg, totalBrokeKg]);

  const netYieldRate = useMemo(() => {
    if (totalReelWeightKg === 0) return '100.0%';
    const totalInput = totalReelWeightKg + totalBrokeKg;
    if (totalInput === 0) return '100.0%';
    return `${((totalReelWeightKg / totalInput) * 100).toFixed(1)}%`;
  }, [totalReelWeightKg, totalBrokeKg]);

  const uniqueProducts = useMemo(() => {
    const set = new Set<string>();
    masterProducts.forEach(p => set.add(p.name));
    reels.forEach(r => { if (r.product) set.add(r.product); });
    return Array.from(set);
  }, [reels, masterProducts]);

  const filteredReels = useMemo(() => {
    if (selectedProductFilter === 'all') return reels;
    return reels.filter(r => r.product === selectedProductFilter);
  }, [reels, selectedProductFilter]);

  const formatKgOrTon = (kg: number) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(2)} Tons`;
    }
    return `${kg.toLocaleString()} kg`;
  };

  const handleOpenAddModal = () => {
    setModalError('');
    const latestReels = getReels();
    const nextNo = getInitialReelNo(latestReels, 0);
    setReelForm(prev => ({
      ...prev,
      reelNo: nextNo,
    }));
    setIsAddModalOpen(true);
  };

  const handleSaveSingleReel = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!reelForm.reelNo.trim()) {
      setModalError('Please enter a valid Reel No.');
      return;
    }
    if (!reelForm.weightKg || parseFloat(reelForm.weightKg) <= 0) {
      setModalError('Reel Weight must be a positive number.');
      return;
    }

    const brokeKg = parseFloat(reelForm.brokeKg) || 0;
    const weightKg = parseFloat(reelForm.weightKg) || 0;
    const diaVal = parseFloat(reelForm.dia) || 900;
    const jointVal = parseInt(reelForm.joint) || 0;
    const plyVal = parseInt(reelForm.ply) || 2;
    const gsmVal = parseFloat(reelForm.gsm) || 18;

    const newReelRecord: Reel = {
      reelNo: reelForm.reelNo.trim(),
      parentRollNo: reelForm.runningRollNo || 'M-001',
      product: reelForm.productName,
      gsm: gsmVal,
      size: parseFloat(reelForm.size) || 30,
      ply: plyVal,
      weight: weightKg,
      dia: diaVal,
      joint: jointVal,
      status: 'QC_PENDING',
      qcGrade: 'PENDING',
      productionDate: `${new Date().toISOString().substring(0, 10)} ${new Date().toLocaleTimeString('en-US', { hour12: false }).substring(0, 5)}`,
    };

    try {
      saveSingleReel(newReelRecord, brokeKg, user?.displayName || 'System');
      const updatedReels = getReels();
      setReels(updatedReels);

      // Auto-increment Reel No for next entry!
      const nextNo = parseAndIncrementReelNo(newReelRecord.reelNo);
      setReelForm(prev => ({
        ...prev,
        reelNo: nextNo,
        weightKg: '1500',
        brokeKg: '100',
      }));

      setIsAddModalOpen(false);
      setToastMsg(`Reel ${newReelRecord.reelNo} logged successfully!`);
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err: any) {
      setModalError(err.message || 'Error saving reel entry.');
    }
  };

  const handlePrintAllToday = () => {
    const todayStr = new Date().toISOString().substring(0, 10);
    const todaysReels = reels.filter(r => r.productionDate.startsWith(todayStr));
    if (todaysReels.length === 0) {
      alert('No reels have been produced today yet.');
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

    document.body.classList.add(bodyClass);
    const styleEl = document.createElement('style');
    styleEl.id = 'dynamic-label-print-style';
    styleEl.innerHTML = `@page { size: ${pageSize}; margin: 0; }`;
    document.head.appendChild(styleEl);

    window.print();

    const cleanup = () => {
      document.body.classList.remove(bodyClass);
      const el = document.getElementById('dynamic-label-print-style');
      if (el) el.remove();
    };

    window.addEventListener('afterprint', cleanup, { once: true });
    setTimeout(cleanup, 2000);
  };

  return (
    <div className="space-y-6 font-sans pb-12 text-left">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. TOP BANNER STAT CARDS (Rudra DEMO2 style) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 shrink-0">
            <RotateCw className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rewinder Reel Output Today</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{formatKgOrTon(totalReelWeightKg)}</p>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{reels.length} Finished Reels Formed</p>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-800/60 shrink-0">
            <RefreshCw className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Broke (Wastage) Generated (Rule 6)</p>
            <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-0.5">{formatKgOrTon(totalBrokeKg)}</p>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Auto Loop-Back to Raw Material &gt; Broke</p>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
            <PackageCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Net Added to Finish Stock</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{formatKgOrTon(netFinishStockKg)}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Net of Broke (Rule 6 &amp; 10)</p>
          </div>
        </div>
      </div>

      {/* 2. MAIN REELS TABLE CARD */}
      <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Rewinder Reel Production Log</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Date: {new Date().toLocaleDateString('en-GB')} &bull; Broke automatically increases Raw Material Stock (Rule 6)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePrintAllToday}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <Printer className="h-4 w-4 text-slate-500" />
              <span>Print QR Labels ({reels.length})</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-blue-500/20 transition cursor-pointer active:scale-95 shrink-0"
            >
              <Plus className="h-4 w-4 text-white" />
              <span>+ Add Reel Entry</span>
            </button>
          </div>
        </div>

        {/* 4-Card Mini KPI Summary Bar (Rudra DEMO2 style) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Reels</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white">{reels.length} Reels</span>
          </div>
          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Weight</span>
            <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">{formatKgOrTon(totalReelWeightKg)}</span>
          </div>
          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Broke Returned</span>
            <span className="text-base font-extrabold text-red-500">+{totalBrokeKg.toLocaleString()} kg</span>
          </div>
          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Net Yield Rate</span>
            <span className="text-base font-extrabold text-emerald-500">{netYieldRate}</span>
          </div>
        </div>

        {/* Filter Chips Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
            <Filter className="h-3.5 w-3.5 text-slate-400" /> Filter:
          </span>
          <button
            onClick={() => setSelectedProductFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap border ${
              selectedProductFilter === 'all'
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
            }`}
          >
            All Paper Types
          </button>
          {uniqueProducts.map(pName => (
            <button
              key={pName}
              onClick={() => setSelectedProductFilter(pName)}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap border ${
                selectedProductFilter === pName
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
              }`}
            >
              {pName}
            </button>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                <th className="p-3.5 rounded-l-xl">Reel No</th>
                <th className="p-3.5">Running Roll</th>
                <th className="p-3.5">Product</th>
                <th className="p-3.5">GSM / Size / Ply</th>
                <th className="p-3.5">Dia / Joint</th>
                <th className="p-3.5 text-right">Reel Weight</th>
                <th className="p-3.5 text-right text-red-500">Broke (kg)</th>
                <th className="p-3.5 text-right rounded-r-xl font-black">Net Stock Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredReels.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                    No rewinder reels recorded matching filter. Click &quot;+ Add Reel Entry&quot; to log finished reels.
                  </td>
                </tr>
              ) : (
                filteredReels.map(reel => {
                  const brokeVal = Number(reel.joint || 0) * 15 + 20;
                  const netKg = Math.max(0, reel.weight - brokeVal);
                  return (
                    <tr key={reel.reelNo} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-black text-blue-600 dark:text-blue-400">{reel.reelNo}</td>
                      <td className="p-3.5 text-slate-500 dark:text-slate-400 font-mono">{reel.parentRollNo}</td>
                      <td className="p-3.5 font-extrabold text-slate-900 dark:text-white">{reel.product}</td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300">
                        {reel.gsm} GSM | {reel.size} cm | {reel.ply} Ply
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300">
                        {reel.dia} mm | {reel.joint} Joint
                      </td>
                      <td className="p-3.5 text-right font-black text-slate-900 dark:text-white">
                        {reel.weight.toLocaleString()} kg
                      </td>
                      <td className="p-3.5 text-right font-black text-red-500">
                        +{brokeVal} kg
                      </td>
                      <td className="p-3.5 text-right font-black text-slate-900 dark:text-white">
                        {netKg.toLocaleString()} kg
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View Cards */}
        <div className="block md:hidden space-y-3">
          {filteredReels.length === 0 ? (
            <p className="text-center text-slate-400 py-6 text-xs">No rewinder reels recorded.</p>
          ) : (
            filteredReels.map(reel => {
              const brokeVal = Number(reel.joint || 0) * 15 + 20;
              const netKg = Math.max(0, reel.weight - brokeVal);
              return (
                <div key={reel.reelNo} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-blue-600 dark:text-blue-400">{reel.reelNo}</span>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      Net: {netKg.toLocaleString()} kg
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Product</span>
                      <span className="font-bold text-slate-900 dark:text-white">{reel.product}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Reel Weight</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">{reel.weight.toLocaleString()} kg</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">GSM / Size / Ply</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{reel.gsm} GSM &bull; {reel.size}cm &bull; {reel.ply}P</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Broke (Returned)</span>
                      <span className="font-bold text-red-500">+{brokeVal} kg</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ADD REEL ENTRY MODAL (Matching Rudra DEMO2 Screenshot + Auto-Increment Reel No!) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Log Rewinder Reel &amp; Broke (Rule 6)
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSingleReel} className="space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs font-bold">
                  {modalError}
                </div>
              )}

              {/* Row 1: Reel No (Auto-Incremented!), Running Roll No, Running Size */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reel No (Unique)
                  </label>
                  <input
                    type="text"
                    required
                    value={reelForm.reelNo}
                    onChange={e => setReelForm({ ...reelForm, reelNo: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. RL-982"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Running Roll No
                  </label>
                  <input
                    type="text"
                    value={reelForm.runningRollNo}
                    onChange={e => setReelForm({ ...reelForm, runningRollNo: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. M-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Running Size
                  </label>
                  <input
                    type="text"
                    value={reelForm.runningSize}
                    onChange={e => setReelForm({ ...reelForm, runningSize: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. 1650 mm"
                  />
                </div>
              </div>

              {/* Row 2: Product, GSM, Size, Ply */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Product
                  </label>
                  <select
                    value={reelForm.productName}
                    onChange={e => setReelForm({ ...reelForm, productName: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                  >
                    {masterProducts.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    GSM
                  </label>
                  <input
                    type="number"
                    value={reelForm.gsm}
                    onChange={e => setReelForm({ ...reelForm, gsm: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Size
                  </label>
                  <input
                    type="text"
                    value={reelForm.size}
                    onChange={e => setReelForm({ ...reelForm, size: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. 30x30 cm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ply
                  </label>
                  <input
                    type="number"
                    value={reelForm.ply}
                    onChange={e => setReelForm({ ...reelForm, ply: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Reel Weight, Broke/Wastage, Dia, Joint Count */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reel Weight (kg)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="1500"
                    value={reelForm.weightKg}
                    onChange={e => setReelForm({ ...reelForm, weightKg: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Broke / Wastage (kg)
                  </label>
                  <input
                    type="number"
                    placeholder="100"
                    value={reelForm.brokeKg}
                    onChange={e => setReelForm({ ...reelForm, brokeKg: e.target.value })}
                    className="w-full p-3 bg-[#FEF3E1] dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-700/80 text-amber-900 dark:text-amber-300 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Dia (mm)
                  </label>
                  <input
                    type="number"
                    value={reelForm.dia}
                    onChange={e => setReelForm({ ...reelForm, dia: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Joint Count
                  </label>
                  <input
                    type="number"
                    value={reelForm.joint}
                    onChange={e => setReelForm({ ...reelForm, joint: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Info Banner */}
              <div className="p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 bg-[#E7F9EF] text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                <AlertCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                <span>Broke quantity automatically adds back into Raw Material &gt; Broke stock (Rule 6).</span>
              </div>

              {/* Actions */}
              <div className="pt-3 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-black text-xs text-white transition cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/25 active:scale-95"
                >
                  Save Reel &amp; Loop-Back Broke
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Labels printable Modal */}
      {showQRModal && recentlyGenerated.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto print:p-0 print:shadow-none print:max-h-full">
            <div className="flex justify-between items-center border-b pb-3 dark:border-slate-700 print:hidden">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                Print QR Traceability Labels
              </h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border dark:border-slate-700 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Label Format:</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setPrintFormat('tsc_4x3')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                    printFormat === 'tsc_4x3' ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border'
                  }`}
                >
                  TSC 4x3&quot;
                </button>
                <button
                  type="button"
                  onClick={() => setPrintFormat('tsc_3x2')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                    printFormat === 'tsc_3x2' ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border'
                  }`}
                >
                  TSC 3x2&quot;
                </button>
                <button
                  type="button"
                  onClick={() => setPrintFormat('a4_grid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                    printFormat === 'a4_grid' ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border'
                  }`}
                >
                  A4 Grid
                </button>
              </div>
            </div>

            <div className="space-y-4 py-2">
              {recentlyGenerated.map(reel => (
                <div key={reel.reelNo} className="p-4 border dark:border-slate-700 rounded-xl flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="space-y-1 text-xs">
                    <span className="font-black text-blue-600 dark:text-blue-400 text-sm block">{reel.reelNo}</span>
                    <p className="font-bold text-slate-800 dark:text-white">{reel.product} &bull; {reel.gsm} GSM &bull; {reel.size}cm &bull; {reel.ply}P</p>
                    <p className="text-[11px] text-slate-500 font-mono">Weight: {reel.weight} kg | Dia: {reel.dia} mm | Roll: #{reel.parentRollNo}</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border shadow-2xs shrink-0">
                    <QRCodeSVG value={JSON.stringify({ reelNo: reel.reelNo, product: reel.product, weight: reel.weight, gsm: reel.gsm })} size={64} />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t dark:border-slate-700 flex justify-end gap-2 print:hidden">
              <button
                onClick={() => setShowQRModal(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2 rounded-xl bg-primary hover:bg-blue-700 text-white font-extrabold text-xs shadow-md flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                <span>Print Labels</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RewinderView;
