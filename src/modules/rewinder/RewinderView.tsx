import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { getRolls, getReels, getProducts, saveSingleReel, saveReelsFromRoll } from '../../data/index';
import type { MachineRoll, Reel } from '../../data/types';
import { CustomSearchableSelect } from '../../components/CustomSearchableSelect';
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
  SlidersHorizontal,
  Layers,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

import { WorkflowStepBadge, WORKFLOW_STEPS } from '../../components/WorkflowStepBadge';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

export const RewinderView: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [rolls] = useState<MachineRoll[]>(() => getRolls());
  const [reels, setReels] = useState<Reel[]>(() => getReels());
  const masterProducts = useMemo(() => getProducts(), []);

  // Filter State
  const [selectedProductFilter, setSelectedProductFilter] = useState('all');

  // Helper functions for Reel No auto-increment (Paper Mill Format e.g. 260500571)
  const parseAndIncrementReelNo = (lastNo: string): string => {
    if (!lastNo || !lastNo.trim()) return '260500571';
    const cleanNo = lastNo.trim();
    if (/^\d+$/.test(cleanNo)) {
      const num = parseInt(cleanNo, 10);
      return String(num + 1);
    }
    const match = cleanNo.match(/^(.*?)(\d+)$/);
    if (match) {
      const prefix = match[1];
      const numStr = match[2];
      const nextNum = parseInt(numStr, 10) + 1;
      const paddedNum = String(nextNum).padStart(numStr.length, '0');
      return `${prefix}${paddedNum}`;
    }
    return '260500571';
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
    return String(260500571 + offset);
  };

  // Add Reel Modal Form State (Rudra DEMO2 style)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [reelForm, setReelForm] = useState({
    reelNo: getInitialReelNo(getReels(), 0),
    runningRollNo: 'M-001',
    runningSize: '',
    productName: masterProducts[0]?.name || 'Napkin Tissue',
    gsm: '16',
    size: '30 cm',
    ply: '1',
    dia: '900',
    joint: '0',
    weightKg: '',
    brokeKg: '0',
  });

  const [reelsCutCount, setReelsCutCount] = useState<number>(3);
  const [cutReels, setCutReels] = useState<Array<{ id: string; reelNo: string; size: string; weightKg: string; joint: string }>>([
    { id: 'cut-0', reelNo: '260500571', size: '30 cm', weightKg: '', joint: '' },
    { id: 'cut-1', reelNo: '260500572', size: '30 cm', weightKg: '', joint: '' },
    { id: 'cut-2', reelNo: '260500573', size: '30 cm', weightKg: '', joint: '' },
  ]);

  useEffect(() => {
    if (isAddModalOpen && cutReels.length === 0) {
      const existing = getReels();
      let curNo = getInitialReelNo(existing, 0);
      const items = [];
      for (let i = 0; i < reelsCutCount; i++) {
        items.push({
          id: `cut-${i}`,
          reelNo: i === 0 ? curNo : (curNo = parseAndIncrementReelNo(curNo)),
          size: '30 cm',
          weightKg: '',
          joint: '',
        });
      }
      setCutReels(items);
    }
  }, [isAddModalOpen]);

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

  // Cascading Filter States
  const [showCascadingModal, setShowCascadingModal] = useState(false);
  const [filterProduct, setFilterProduct] = useState<string>('ALL');
  const [filterGsm, setFilterGsm] = useState<string>('ALL');
  const [filterSize, setFilterSize] = useState<string>('ALL');
  const [filterPly, setFilterPly] = useState<string>('ALL');

  // Lock background scroll when any modal is open
  useBodyScrollLock(isAddModalOpen || showQRModal || showCascadingModal);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const uniqueProducts = useMemo(() => {
    const set = new Set<string>();
    masterProducts.forEach(p => set.add(p.name));
    reels.forEach(r => { if (r.product) set.add(r.product); });
    return Array.from(set);
  }, [reels, masterProducts]);

  // Step 1: Available Products
  const availableProducts = useMemo(() => {
    return Array.from(new Set(reels.map(r => r.product))).sort();
  }, [reels]);

  // Step 2: Available GSMs (Cascaded by selected Product)
  const availableGsms = useMemo(() => {
    let list = reels;
    if (filterProduct !== 'ALL') {
      list = list.filter(r => r.product === filterProduct);
    }
    return Array.from(new Set(list.map(r => r.gsm))).sort((a, b) => a - b);
  }, [reels, filterProduct]);

  // Step 3: Available Sizes (Cascaded by selected Product + GSM)
  const availableSizes = useMemo(() => {
    let list = reels;
    if (filterProduct !== 'ALL') {
      list = list.filter(r => r.product === filterProduct);
    }
    if (filterGsm !== 'ALL') {
      list = list.filter(r => r.gsm === Number(filterGsm));
    }
    return Array.from(new Set(list.map(r => r.size))).sort((a, b) => a - b);
  }, [reels, filterProduct, filterGsm]);

  // Step 4: Available Ply Values (Cascaded by selected Product + GSM + Size)
  const availablePlys = useMemo(() => {
    let list = reels;
    if (filterProduct !== 'ALL') {
      list = list.filter(r => r.product === filterProduct);
    }
    if (filterGsm !== 'ALL') {
      list = list.filter(r => r.gsm === Number(filterGsm));
    }
    if (filterSize !== 'ALL') {
      list = list.filter(r => r.size === Number(filterSize));
    }
    return Array.from(new Set(list.map(r => r.ply))).sort((a, b) => a - b);
  }, [reels, filterProduct, filterGsm, filterSize]);

  // Handlers for Cascading Selection
  const handleProductChange = (prod: string) => {
    setFilterProduct(prod);
    setFilterGsm('ALL');
    setFilterSize('ALL');
    setFilterPly('ALL');
    if (prod !== 'ALL') setSelectedProductFilter(prod);
    else setSelectedProductFilter('all');
  };

  const handleGsmChange = (gsmVal: string) => {
    setFilterGsm(gsmVal);
    setFilterSize('ALL');
    setFilterPly('ALL');
  };

  const handleSizeChange = (sizeVal: string) => {
    setFilterSize(sizeVal);
    setFilterPly('ALL');
  };

  const handlePlyChange = (plyVal: string) => {
    setFilterPly(plyVal);
  };

  const filteredReels = useMemo(() => {
    return reels.filter(r => {
      // 1. Cascading Filters
      if (filterProduct !== 'ALL' && r.product !== filterProduct) return false;
      if (filterGsm !== 'ALL' && r.gsm !== Number(filterGsm)) return false;
      if (filterSize !== 'ALL' && r.size !== Number(filterSize)) return false;
      if (filterPly !== 'ALL' && r.ply !== Number(filterPly)) return false;

      // 2. Paper Chips Filter
      if (selectedProductFilter !== 'all' && r.product !== selectedProductFilter) return false;

      // 3. QC Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'QC_PENDING' && r.status !== 'QC_PENDING') return false;
        if (statusFilter === 'GRADE_A' && r.qcGrade !== 'A') return false;
        if (statusFilter === 'GRADE_B' && r.qcGrade !== 'B') return false;
      }
      // 4. Date Filter
      if (dateFilter === 'today') {
        const todayStr = new Date().toISOString().substring(0, 10);
        if (!r.productionDate.startsWith(todayStr)) return false;
      } else if (dateFilter === '7days') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (new Date(r.productionDate) < weekAgo) return false;
      }
      // 5. Search Term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchNo = r.reelNo.toLowerCase().includes(q);
        const matchRoll = r.parentRollNo.toLowerCase().includes(q);
        const matchProduct = r.product.toLowerCase().includes(q);
        const matchGsm = String(r.gsm).includes(q);
        const matchSize = String(r.size).includes(q);
        if (!matchNo && !matchRoll && !matchProduct && !matchGsm && !matchSize) {
          return false;
        }
      }
      return true;
    });
  }, [reels, filterProduct, filterGsm, filterSize, filterPly, selectedProductFilter, statusFilter, dateFilter, searchTerm]);

  // Group filtered reels into distinct cut entry batches (by parent roll + production timestamp)
  const groupedBatches = useMemo(() => {
    const groups: {
      batchId: string;
      parentRollNo: string;
      product: string;
      productionDate: string;
      reels: Reel[];
      totalWeight: number;
      totalBroke: number;
      netWeight: number;
    }[] = [];

    [...filteredReels].reverse().forEach(reel => {
      const key = `${reel.parentRollNo}_${reel.productionDate}`;
      let group = groups.find(g => g.batchId === key);
      const brokeVal = Number(reel.joint || 0) * 15 + 20;
      const netKg = Math.max(0, reel.weight - brokeVal);

      if (!group) {
        group = {
          batchId: key,
          parentRollNo: reel.parentRollNo,
          product: reel.product,
          productionDate: reel.productionDate,
          reels: [],
          totalWeight: 0,
          totalBroke: 0,
          netWeight: 0,
        };
        groups.push(group);
      }
      group.reels.push(reel);
      group.totalWeight += reel.weight;
      group.totalBroke += brokeVal;
      group.netWeight += netKg;
    });

    return groups;
  }, [filteredReels]);

  const activeCascadingFilterCount = useMemo(() => {
    let c = 0;
    if (filterProduct !== 'ALL') c++;
    if (filterGsm !== 'ALL') c++;
    if (filterSize !== 'ALL') c++;
    if (filterPly !== 'ALL') c++;
    return c;
  }, [filterProduct, filterGsm, filterSize, filterPly]);

  const hasActiveFilters = selectedProductFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all' || searchTerm.trim() !== '' || activeCascadingFilterCount > 0;

  const handleClearFilters = () => {
    setFilterProduct('ALL');
    setFilterGsm('ALL');
    setFilterSize('ALL');
    setFilterPly('ALL');
    setSelectedProductFilter('all');
    setStatusFilter('all');
    setDateFilter('all');
    setSearchTerm('');
  };

  const formatKgOrTon = (kg: number) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(2)} Tons`;
    }
    return `${kg.toLocaleString()} kg`;
  };

  const handleOpenAddModal = () => {
    setModalError('');
    const latestReels = getReels();
    const availableRolls = getRolls();
    const nextNo = getInitialReelNo(latestReels, 0);

    if (availableRolls.length > 0) {
      const firstRoll = availableRolls[0];
      setReelForm({
        reelNo: nextNo,
        runningRollNo: firstRoll.rollNo,
        productName: firstRoll.product,
        gsm: String(firstRoll.gsm),
        runningSize: `${firstRoll.width} cm`,
        weightKg: String(firstRoll.weight),
        size: '30 cm',
        ply: '1',
        dia: '900',
        joint: '',
        brokeKg: '0',
      });
    } else {
      setReelForm({
        reelNo: nextNo,
        runningRollNo: 'M-001',
        productName: masterProducts[0]?.name || 'Napkin Tissue',
        gsm: '16',
        runningSize: '',
        weightKg: '',
        size: '30 cm',
        ply: '1',
        dia: '900',
        joint: '',
        brokeKg: '0',
      });
    }
    setIsAddModalOpen(true);
  };

  const handleSaveSingleReel = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    const availableRolls = getRolls();
    if (availableRolls.length === 0) {
      setModalError('Roll not in stock');
      return;
    }

    if (!reelForm.runningRollNo.trim()) {
      setModalError('Please enter Roll No');
      return;
    }

    const selectedRoll = availableRolls.find(r => r.rollNo === reelForm.runningRollNo);
    if (!selectedRoll) {
      setModalError('Roll not in stock');
      return;
    }

    if (!cutReels || cutReels.length === 0) {
      setModalError('Please configure at least 1 cut reel.');
      return;
    }

    const totalRollWeight = parseFloat(reelForm.weightKg) || 0;
    const gsmVal = parseFloat(reelForm.gsm) || 16;
    const plyVal = parseInt(reelForm.ply) || 1;
    const diaVal = parseFloat(reelForm.dia) || 900;

    let sumCutWeight = 0;
    const savedRecords: Reel[] = [];

    for (let i = 0; i < cutReels.length; i++) {
      const item = cutReels[i];
      if (!item.reelNo.trim()) {
        setModalError(`Please enter a valid Reel No for cut reel #${i + 1}.`);
        return;
      }
      const weightKg = parseFloat(item.weightKg) || 0;
      sumCutWeight += weightKg;
      const sizeNum = parseFloat(item.size) || parseFloat(reelForm.size) || 30;

      const record: Reel = {
        reelNo: item.reelNo.trim(),
        parentRollNo: reelForm.runningRollNo || 'M-001',
        product: reelForm.productName,
        gsm: gsmVal,
        size: sizeNum,
        ply: plyVal,
        weight: weightKg,
        dia: diaVal,
        joint: parseInt(item.joint) || 0,
        status: 'QC_PENDING',
        qcGrade: 'PENDING',
        productionDate: `${new Date().toISOString().substring(0, 10)} ${new Date().toLocaleTimeString('en-US', { hour12: false }).substring(0, 5)}`,
      };
      savedRecords.push(record);
    }

    const brokeKg = Math.max(0, totalRollWeight - sumCutWeight);

    try {
      savedRecords.forEach((rec, idx) => {
        saveSingleReel(rec, idx === savedRecords.length - 1 ? brokeKg : 0, user?.displayName || 'System');
      });

      const updatedReels = getReels();
      setReels(updatedReels);

      setIsAddModalOpen(false);
      setToastMsg(`${savedRecords.length} Cut Reels logged successfully!`);
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err: any) {
      setModalError(err.message || 'Error saving cut reel entries.');
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

      {/* 1. TOP BANNER STAT CARDS (4 Hero Scorecards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-4 sm:p-5 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
            <RotateCw className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reel Output Today</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">{formatKgOrTon(totalReelWeightKg)}</p>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{reels.length} Finished Reels</p>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-4 sm:p-5 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-800/60 shrink-0">
            <RefreshCw className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Broke Generated</p>
            <p className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-400 mt-0.5">{formatKgOrTon(totalBrokeKg)}</p>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Auto Loop-Back (Rule 6)</p>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-4 sm:p-5 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
            <PackageCheck className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Net Stock Added</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">{formatKgOrTon(netFinishStockKg)}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Net of Broke</p>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-4 sm:p-5 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60 shrink-0">
            <Scissors className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Net Yield Rate</p>
            <p className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">{netYieldRate}</p>
            <p className="text-[11px] text-purple-500 font-semibold mt-0.5">Yield Efficiency</p>
          </div>
        </div>
      </div>

      {/* 2. MAIN REELS TABLE CARD */}
      <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Rewinder Reel Production Log</h3>
              <WorkflowStepBadge stepInfo={WORKFLOW_STEPS.rewinder} />
            </div>
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



        {/* Search & Cascading Filter Controls */}
        <div className="space-y-3 bg-slate-50/80 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search Reel No, Roll No, Product..."
                className="w-full pl-10 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Dropdowns & Reset */}
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
              {/* Cascading Filter Trigger Button */}
              <button
                type="button"
                onClick={() => setShowCascadingModal(true)}
                className="flex items-center gap-1.5 py-2 px-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Cascading Filter</span>
                {activeCascadingFilterCount > 0 && (
                  <span className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-black">
                    {activeCascadingFilterCount}
                  </span>
                )}
              </button>

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
              </select>

              {/* QC Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="QC_PENDING">QC Pending</option>
                <option value="GRADE_A">Grade A (Passed)</option>
                <option value="GRADE_B">Grade B</option>
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="flex items-center gap-1 py-2 px-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 border border-red-200 dark:border-red-800 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Chips Row */}
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-200/50 dark:border-slate-800 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 shrink-0">
              <Filter className="h-3 w-3 text-slate-400" /> Filter:
            </span>
            <button
              onClick={() => setSelectedProductFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap border ${selectedProductFilter === 'all'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
            >
              All Paper Types ({reels.length})
            </button>
            {uniqueProducts.map(pName => (
              <button
                key={pName}
                onClick={() => setSelectedProductFilter(pName)}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap border ${selectedProductFilter === pName
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
              >
                {pName}
              </button>
            ))}
          </div>
        </div>

        {/* Distinct Grouped Cut Batches View (Matching Reference UI) */}
        {groupedBatches.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-medium bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            No rewinder reels recorded matching filter. Click &quot;+ Add Reel Entry&quot; to log finished reels.
          </div>
        ) : (
          <div className="space-y-6">
            {groupedBatches.map(batch => (
              <div key={batch.batchId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs space-y-0">
                {/* Batch Header Bar */}
                <div className="bg-slate-50/90 dark:bg-slate-800/80 p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700/60 text-blue-700 dark:text-blue-300 text-xs font-black font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <span>RUNNING ROLL: #{batch.parentRollNo}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{batch.product}</span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="text-blue-600 dark:text-blue-400 font-extrabold">{batch.reels.length} {batch.reels.length === 1 ? 'Reel Cut' : 'Reels Cut'}</span>
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      ({batch.productionDate ? batch.productionDate.split(' ')[0].split('T')[0] : ''})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-300">Total: <strong className="text-slate-900 dark:text-white">{batch.totalWeight.toLocaleString()} kg</strong></span>
                    <span className="text-red-500">Broke: <strong>+{batch.totalBroke.toLocaleString()} kg</strong></span>
                    <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-800/60">
                      Net Stock: <strong>{batch.netWeight.toLocaleString()} kg</strong>
                    </span>
                  </div>
                </div>

                {/* Desktop Reels Table for this Batch */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-slate-500 dark:text-slate-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <th className="py-3 px-4">REEL NO</th>
                        <th className="py-3 px-4">RUNNING ROLL</th>
                        <th className="py-3 px-4">PRODUCT</th>
                        <th className="py-3 px-4">GSM / SIZE / PLY</th>
                        <th className="py-3 px-4">JOINT</th>
                        <th className="py-3 px-4 text-right">REEL WEIGHT</th>
                        <th className="py-3 px-4 text-right text-red-500">BROKE (KG)</th>
                        <th className="py-3 px-4 text-right font-black">NET STOCK WEIGHT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                      {batch.reels.map(reel => {
                        const brokeVal = Number(reel.joint || 0) * 15 + 20;
                        const netKg = Math.max(0, reel.weight - brokeVal);
                        return (
                          <tr key={reel.reelNo} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition duration-150">
                            <td className="py-3.5 px-4 font-black text-primary dark:text-blue-400 font-mono text-xs">{reel.reelNo}</td>
                            <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{reel.parentRollNo}</td>
                            <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">{reel.product}</td>
                            <td className="py-3.5 px-4 text-slate-700 dark:text-slate-200 font-bold">
                              {reel.gsm} GSM | {reel.size} cm | {reel.ply} Ply
                            </td>
                            <td className="py-3.5 px-4 text-slate-700 dark:text-slate-200 font-bold">
                              {reel.joint} Joint
                            </td>
                            <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                              {reel.weight.toLocaleString()} kg
                            </td>
                            <td className="py-3.5 px-4 text-right font-black text-red-500">
                              +{brokeVal} kg
                            </td>
                            <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                              {netKg.toLocaleString()} kg
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Stacked Cards for this Batch */}
                <div className="block md:hidden p-3 space-y-2.5">
                  {batch.reels.map(reel => {
                    const brokeVal = Number(reel.joint || 0) * 15 + 20;
                    const netKg = Math.max(0, reel.weight - brokeVal);
                    return (
                      <div key={reel.reelNo} className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-primary dark:text-blue-400">{reel.reelNo}</span>
                          <span className="font-bold px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[10px]">
                            Net: {netKg.toLocaleString()} kg
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block text-[9px] uppercase font-bold">Roll / Specs</span>
                            <span className="font-bold text-slate-900 dark:text-white">{reel.parentRollNo} &bull; {reel.gsm}GSM &bull; {reel.size}cm</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block text-[9px] uppercase font-bold">Reel / Broke</span>
                            <span className="font-extrabold text-slate-900 dark:text-white">{reel.weight.toLocaleString()} kg <span className="text-red-500">(+{brokeVal}kg)</span></span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD REEL ENTRY MODAL (Matching Rudra DEMO2 Screenshot + Single Outer GSM Input + 1-17 Cut Reels!) */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddModalOpen(false);
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Log Rewinder Reel &amp; Broke (Rule 6)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSingleReel} className="space-y-4">
              {modalError && (
                <div className="px-3 py-2 bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Row 1: Running Roll No (Select from Stock), Reels Cut (1-17 Max), Running Size */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Running Roll No
                  </label>
                  <input
                    type="text"
                    required
                    list="running-rolls-list"
                    value={reelForm.runningRollNo}
                    onChange={e => {
                      const selectedNo = e.target.value;
                      const rollsList = getRolls();
                      const matched = rollsList.find(
                        r => r.rollNo.trim().toLowerCase() === selectedNo.trim().toLowerCase()
                      );
                      if (matched) {
                        setReelForm(prev => ({
                          ...prev,
                          runningRollNo: matched.rollNo,
                          productName: matched.product,
                          gsm: String(matched.gsm),
                          runningSize: `${matched.width} cm`,
                          weightKg: String(matched.weight),
                        }));
                      } else {
                        setReelForm(prev => ({ ...prev, runningRollNo: selectedNo }));
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="e.g. M-001"
                  />
                  <datalist id="running-rolls-list">
                    {getRolls().map(roll => (
                      <option key={roll.rollNo} value={roll.rollNo}>
                        {roll.rollNo} ({roll.product} &bull; {roll.gsm} GSM &bull; {roll.weight}kg)
                      </option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reels Cut (1 to 17 Max)
                  </label>
                  <select
                    value={reelsCutCount}
                    onChange={e => {
                      const count = Math.min(17, Math.max(1, Number(e.target.value)));
                      setReelsCutCount(count);

                      // Auto regenerate cut reels list
                      const existing = getReels();
                      let curNo = getInitialReelNo(existing, 0);
                      const items = [];
                      for (let i = 0; i < count; i++) {
                        const prev = cutReels[i];
                        items.push({
                          id: `cut-${i}`,
                          reelNo: prev?.reelNo || (i === 0 ? curNo : (curNo = parseAndIncrementReelNo(curNo))),
                          size: prev?.size || reelForm.size || '30',
                          weightKg: prev?.weightKg || '',
                          joint: prev?.joint || '',
                        });
                      }
                      setCutReels(items);
                    }}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                  >
                    {Array.from({ length: 17 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'Reel' : 'Reels'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Running Size (cm)
                  </label>
                  <input
                    type="text"
                    value={reelForm.runningSize}
                    onChange={e => setReelForm({ ...reelForm, runningSize: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="e.g. 165 cm"
                  />
                </div>
              </div>

              {/* Row 2: Product, Total Weight (kg), Ply, GSM (SINGLE GSM BOX OUTSIDE CONFIGURE CUT REELS) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <CustomSearchableSelect
                    label="PRODUCT"
                    placeholder="-- Select Product --"
                    value={reelForm.productName}
                    onChange={(val) => setReelForm({ ...reelForm, productName: val })}
                    options={masterProducts.map(p => ({
                      value: p.name,
                      label: p.name,
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Total Weight (kg)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="5000"
                    value={reelForm.weightKg}
                    onChange={e => setReelForm({ ...reelForm, weightKg: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ply
                  </label>
                  <select
                    value={reelForm.ply}
                    onChange={e => setReelForm({ ...reelForm, ply: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                  >
                    <option value="1">1 Ply</option>
                    <option value="2">2 Ply</option>
                    <option value="3">3 Ply</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    GSM
                  </label>
                  <input
                    type="number"
                    required
                    value={reelForm.gsm}
                    onChange={e => setReelForm({ ...reelForm, gsm: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="16"
                  />
                </div>
              </div>

              {/* Total Summary Meter Banner */}
              {(() => {
                const sumCutWeight = cutReels.reduce((sum, r) => sum + (parseFloat(r.weightKg) || 0), 0);
                const totalRollWeight = parseFloat(reelForm.weightKg) || 0;
                return (
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-mono font-bold">
                    <span className="text-slate-600 dark:text-slate-400">
                      Sum of Cut Reels:{' '}
                      <span className={sumCutWeight > 0 ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-700 dark:text-slate-300'}>
                        {sumCutWeight.toLocaleString()} kg
                      </span>{' '}
                      / Total Roll: {totalRollWeight.toLocaleString()} kg
                    </span>
                    {totalRollWeight > 0 && (
                      <span className="text-[11px] text-primary dark:text-blue-400 font-sans font-bold">
                        Broke: {Math.max(0, totalRollWeight - sumCutWeight).toLocaleString()} kg
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* CONFIGURE CUT REELS CARD (WITHOUT INDIVIDUAL GSM INPUTS) */}
              <div className="border border-blue-200/80 dark:border-blue-900/40 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-blue-200 dark:border-blue-900/50 pb-2">
                  <h4 className="text-xs font-black uppercase text-primary dark:text-blue-400 tracking-wider">
                    CONFIGURE CUT REELS [{reelsCutCount} REELS CUT]
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Set individual Size, Weight &amp; Joints for each reel
                  </p>
                </div>

                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                  {cutReels.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-center shadow-2xs"
                    >
                      {/* Reel No Badge */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-primary dark:text-blue-400 font-mono">#{idx + 1}</span>
                        <input
                          type="text"
                          required
                          value={item.reelNo}
                          onChange={e => {
                            const val = e.target.value;
                            setCutReels(prev => prev.map((r, i) => i === idx ? { ...r, reelNo: val } : r));
                          }}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-bold font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>

                      {/* Size */}
                      <div>
                        <input
                          type="text"
                          placeholder="Size (e.g. 30 cm)"
                          value={item.size}
                          onChange={e => {
                            const val = e.target.value;
                            setCutReels(prev => prev.map((r, i) => i === idx ? { ...r, size: val } : r));
                          }}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-bold focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>

                      {/* Weight (kg) */}
                      <div>
                        <input
                          type="number"
                          required
                          placeholder="Weight (kg)"
                          value={item.weightKg}
                          onChange={e => {
                            const val = e.target.value;
                            setCutReels(prev => prev.map((r, i) => i === idx ? { ...r, weightKg: val } : r));
                          }}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-bold font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>

                      {/* Joints */}
                      <div>
                        <input
                          type="number"
                          placeholder="Joints"
                          value={item.joint}
                          onChange={e => {
                            const val = e.target.value;
                            setCutReels(prev => prev.map((r, i) => i === idx ? { ...r, joint: val } : r));
                          }}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-bold font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-black text-xs text-white transition cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/25 active:scale-95"
                >
                  Save Reel Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Labels printable Modal */}
      {showQRModal && recentlyGenerated.length > 0 && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowQRModal(false);
          }}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto print:p-0 print:shadow-none print:max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${printFormat === 'tsc_4x3' ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border'
                    }`}
                >
                  TSC 4x3&quot;
                </button>
                <button
                  type="button"
                  onClick={() => setPrintFormat('tsc_3x2')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${printFormat === 'tsc_3x2' ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border'
                    }`}
                >
                  TSC 3x2&quot;
                </button>
                <button
                  type="button"
                  onClick={() => setPrintFormat('a4_grid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${printFormat === 'a4_grid' ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border'
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
                    <p className="text-[11px] text-slate-500 font-mono">Weight: {reel.weight} kg | Roll: #{reel.parentRollNo}</p>
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
      {/* INVENTORY CASCADING FILTER MODAL (Matching Screenshot) */}
      {showCascadingModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCascadingModal(false);
          }}
        >
          <div
            className="bg-white dark:bg-[#181D35] text-slate-900 dark:text-white border border-slate-200 dark:border-[#262D4A] rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-left"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-700/60 pb-3">
              <div>
                <h3 className="text-base font-black tracking-wider flex items-center gap-2 text-white">
                  <SlidersHorizontal className="h-5 w-5 text-blue-400" />
                  INVENTORY CASCADING FILTER
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Select Product &rarr; GSM &rarr; Size &rarr; Ply to view matching inventory
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCascadingModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Hero Live Filter Results Card */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-2xl p-4 border border-blue-400/30 shadow-lg text-white space-y-1">
              <span className="text-[10px] font-black tracking-widest text-blue-200 uppercase flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" /> LIVE FILTER RESULTS
              </span>
              <div className="flex items-baseline gap-3 pt-1">
                <span className="text-2xl font-black">{filteredReels.length} <span className="text-sm font-normal text-blue-100">Reels</span></span>
                <span className="text-slate-400">|</span>
                <span className="text-xl font-extrabold">
                  {filteredReels.reduce((acc, r) => acc + r.weight, 0).toLocaleString()} <span className="text-xs font-normal text-blue-100">kg ({(filteredReels.reduce((acc, r) => acc + r.weight, 0) / 1000).toFixed(2)} MT)</span>
                </span>
              </div>
            </div>

            {/* 4 Step Cascading Dropdowns */}
            <div className="space-y-4 text-xs font-bold">

              {/* STEP 1: PRODUCT */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex justify-between">
                  <span>1. SELECT PRODUCT</span>
                  <span className="text-[10px] text-blue-500 font-medium">Step 1</span>
                </label>
                <select
                  value={filterProduct}
                  onChange={e => handleProductChange(e.target.value)}
                  className="w-full py-3 px-3.5 bg-slate-50 dark:bg-[#12162B] border border-slate-200 dark:border-[#262D4A] rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ALL">All Products ({availableProducts.length})</option>
                  {availableProducts.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* STEP 2: GSM */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex justify-between">
                  <span>2. SELECT GSM</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {filterProduct !== 'ALL' ? `Cascaded for ${filterProduct}` : 'SELECT PRODUCT FIRST'}
                  </span>
                </label>
                <select
                  value={filterGsm}
                  onChange={e => handleGsmChange(e.target.value)}
                  className="w-full py-3 px-3.5 bg-slate-50 dark:bg-[#12162B] border border-slate-200 dark:border-[#262D4A] rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ALL">All GSMs ({availableGsms.length} available)</option>
                  {availableGsms.map(g => (
                    <option key={g} value={g}>{g} GSM</option>
                  ))}
                </select>
              </div>

              {/* STEP 3: SIZE */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex justify-between">
                  <span>3. SELECT SIZE (CM)</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {filterGsm !== 'ALL' ? `Cascaded for ${filterGsm} GSM` : 'ALL SIZES'}
                  </span>
                </label>
                <select
                  value={filterSize}
                  onChange={e => handleSizeChange(e.target.value)}
                  className="w-full py-3 px-3.5 bg-slate-50 dark:bg-[#12162B] border border-slate-200 dark:border-[#262D4A] rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ALL">All Sizes ({availableSizes.length} available)</option>
                  {availableSizes.map(s => (
                    <option key={s} value={s}>{s} cm</option>
                  ))}
                </select>
              </div>

              {/* STEP 4: PLY */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex justify-between">
                  <span>4. SELECT PLY</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {filterSize !== 'ALL' ? `Cascaded for Size ${filterSize} cm` : 'ALL PLY'}
                  </span>
                </label>
                <select
                  value={filterPly}
                  onChange={e => handlePlyChange(e.target.value)}
                  className="w-full py-3 px-3.5 bg-slate-50 dark:bg-[#12162B] border border-slate-200 dark:border-[#262D4A] rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ALL">All Ply ({availablePlys.length} available)</option>
                  {availablePlys.map(p => (
                    <option key={p} value={p}>{p} Ply</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-3 border-t border-slate-200 dark:border-slate-700/60">
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-3 border border-red-300 dark:border-red-500/40 rounded-2xl text-xs font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                <RotateCcw className="h-4 w-4" /> Clear All
              </button>

              <button
                type="button"
                onClick={() => setShowCascadingModal(false)}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>APPLY &amp; VIEW ({filteredReels.length} REELS)</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default RewinderView;
