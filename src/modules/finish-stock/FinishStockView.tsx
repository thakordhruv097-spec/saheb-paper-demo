import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { getReels, updateReelQC } from '../../data/index';
import type { Reel } from '../../data/types';
import {
  Package,
  Clipboard,
  CheckSquare,
  ListFilter,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
  SlidersHorizontal,
  Layers,
  Sparkles,
  Check,
  Eye,
  Beaker,
} from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface FinishStockViewProps {
  hideHeader?: boolean;
}

export const FinishStockView: React.FC<FinishStockViewProps> = ({ hideHeader = false }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [reels, setReels] = useState<Reel[]>(() => getReels());
  const [activeTab, setActiveTab] = useState<'all' | 'grade_a' | 'grade_b' | 'pending_qc'>(() => {
    const initialReels = getReels();
    const hasGradeA = initialReels.some(r => r.status === 'IN_STOCK');
    const hasPending = initialReels.some(r => r.status === 'QC_PENDING');
    if (hasPending && !hasGradeA) return 'all';
    return 'all';
  });
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Cascading Filter Popup States
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterProduct, setFilterProduct] = useState<string>('ALL');
  const [filterGsm, setFilterGsm] = useState<string>('ALL');
  const [filterSize, setFilterSize] = useState<string>('ALL');
  const [filterPly, setFilterPly] = useState<string>('ALL');

  // QC Form & Inspection Details States
  const [inspectingReel, setInspectingReel] = useState<Reel | null>(null);
  const [viewingQcReel, setViewingQcReel] = useState<Reel | null>(null);
  const [qcGrade, setQcGrade] = useState<'A' | 'B'>('A');
  const [gsmResult, setGsmResult] = useState('');
  const [brightness, setBrightness] = useState('');
  const [softness, setSoftness] = useState('7');
  const [inspector, setInspector] = useState(user?.displayName || '');
  const [qcError, setQcError] = useState('');

  // Lock background layout & body scroll whenever modal is open
  useBodyScrollLock(!!inspectingReel || showFilterModal || !!viewingQcReel);

  // Softness input ref for strict click-to-scroll wheel listener
  const softnessInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = softnessInputRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // ONLY change value if user clicked in / focused on the input!
      if (document.activeElement === el) {
        e.preventDefault();
        setSoftness(prev => {
          const current = parseInt(prev, 10) || 1;
          const delta = e.deltaY < 0 ? 1 : -1;
          const next = Math.min(10, Math.max(1, current + delta));
          return String(next);
        });
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [inspectingReel]);

  // Safe Reels list with robust property fallbacks to prevent any null/undefined runtime errors
  const safeReels = useMemo(() => {
    return (reels || []).map(r => ({
      ...r,
      reelNo: r?.reelNo || 'R-0000',
      parentRollNo: r?.parentRollNo || 'M-001',
      product: r?.product || 'Napkin Tissue',
      gsm: Number(r?.gsm) || 16,
      size: Number(r?.size) || 30,
      ply: Number(r?.ply) || 1,
      weight: Number(r?.weight) || 0,
      joint: Number(r?.joint) || 0,
      status: r?.status || 'IN_STOCK',
      productionDate: r?.productionDate || '2026-08-16 00:00',
    }));
  }, [reels]);

  // 1. Base Reels for Active Tab
  const tabReels = useMemo(() => {
    return safeReels.filter(r => {
      if (activeTab === 'all') return r.status === 'IN_STOCK' || r.status === 'IN_STOCK_B' || r.status === 'QC_PENDING';
      if (activeTab === 'grade_a') return r.status === 'IN_STOCK';
      if (activeTab === 'grade_b') return r.status === 'IN_STOCK_B';
      return r.status === 'QC_PENDING';
    });
  }, [safeReels, activeTab]);

  // 2. Cascading Options Calculations
  // Step 1: Available Products
  const availableProducts = useMemo(() => {
    return Array.from(new Set(tabReels.map(r => r.product))).sort();
  }, [tabReels]);

  // Step 2: Available GSMs (Cascaded by selected Product)
  const availableGsms = useMemo(() => {
    let list = tabReels;
    if (filterProduct !== 'ALL') {
      list = list.filter(r => r.product === filterProduct);
    }
    return Array.from(new Set(list.map(r => r.gsm))).sort((a, b) => a - b);
  }, [tabReels, filterProduct]);

  // Step 3: Available Sizes (Cascaded by selected Product + GSM)
  const availableSizes = useMemo(() => {
    let list = tabReels;
    if (filterProduct !== 'ALL') {
      list = list.filter(r => r.product === filterProduct);
    }
    if (filterGsm !== 'ALL') {
      list = list.filter(r => r.gsm === Number(filterGsm));
    }
    return Array.from(new Set(list.map(r => r.size))).sort((a, b) => a - b);
  }, [tabReels, filterProduct, filterGsm]);

  // Step 4: Available Ply Values (Cascaded by selected Product + GSM + Size)
  const availablePlys = useMemo(() => {
    let list = tabReels;
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
  }, [tabReels, filterProduct, filterGsm, filterSize]);

  // Handlers for Cascading Filter selection
  const handleProductChange = (prod: string) => {
    setFilterProduct(prod);
    setFilterGsm('ALL');
    setFilterSize('ALL');
    setFilterPly('ALL');
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

  const handleClearAllFilters = () => {
    setFilterProduct('ALL');
    setFilterGsm('ALL');
    setFilterSize('ALL');
    setFilterPly('ALL');
    setStockSearchQuery('');
  };

  const gradeAStockKg = useMemo(() => reels.filter(r => r.status === 'IN_STOCK').reduce((acc, r) => acc + r.weight, 0), [reels]);
  const gradeBStockKg = useMemo(() => reels.filter(r => r.status === 'IN_STOCK_B').reduce((acc, r) => acc + r.weight, 0), [reels]);
  const pendingQcCount = useMemo(() => reels.filter(r => r.status === 'QC_PENDING').length, [reels]);

  // 1-Click Bulk QC Approval
  const handleBulkApproveAllGradeA = () => {
    const pending = reels.filter(r => r.status === 'QC_PENDING' || !r.qcGrade || r.qcGrade === 'PENDING');
    if (pending.length === 0) return;
    pending.forEach(r => {
      updateReelQC(
        r.reelNo,
        'A',
        r.gsm || 18,
        85,
        8,
        user?.displayName || 'QC Inspector'
      );
    });
    setReels(getReels());
    setActiveTab('grade_a');
    handleClearAllFilters();
  };

  // 3. Filtered Matching Reels List
  const matchingFilteredList = useMemo(() => {
    let list = [...tabReels];

    // Cascading filters
    if (filterProduct !== 'ALL') list = list.filter(r => r.product === filterProduct);
    if (filterGsm !== 'ALL') list = list.filter(r => r.gsm === Number(filterGsm));
    if (filterSize !== 'ALL') list = list.filter(r => r.size === Number(filterSize));
    if (filterPly !== 'ALL') list = list.filter(r => r.ply === Number(filterPly));

    // Free-text Search
    if (stockSearchQuery.trim()) {
      const q = stockSearchQuery.toLowerCase().trim();
      list = list.filter(r =>
        r.product.toLowerCase().includes(q) ||
        String(r.gsm).includes(q) ||
        String(r.size).includes(q) ||
        String(r.ply).includes(q) ||
        r.reelNo.toLowerCase().includes(q)
      );
    }

    // Sort descending by reel number
    list.sort((a, b) => b.reelNo.localeCompare(a.reelNo));
    return list;
  }, [tabReels, filterProduct, filterGsm, filterSize, filterPly, stockSearchQuery]);

  // Total matching statistics
  const matchingTotalWeightKg = useMemo(() => {
    return matchingFilteredList.reduce((acc, r) => acc + r.weight, 0);
  }, [matchingFilteredList]);

  const matchingTotalWeightMT = (matchingTotalWeightKg / 1000).toFixed(2);

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (filterProduct !== 'ALL') c++;
    if (filterGsm !== 'ALL') c++;
    if (filterSize !== 'ALL') c++;
    if (filterPly !== 'ALL') c++;
    return c;
  }, [filterProduct, filterGsm, filterSize, filterPly]);

  // 4. Grouped Stock View (Product -> GSM -> Size -> Ply)
  const groupedStock = useMemo(() => {
    const groups: Record<string, {
      product: string;
      gsm: number;
      size: number;
      ply: number;
      reels: Reel[];
      totalWeight: number;
    }> = {};

    matchingFilteredList.forEach(r => {
      const key = `${r.product}-${r.gsm}-${r.size}-${r.ply}`;
      if (!groups[key]) {
        groups[key] = {
          product: r.product,
          gsm: r.gsm,
          size: r.size,
          ply: r.ply,
          reels: [],
          totalWeight: 0,
        };
      }
      groups[key].reels.push(r);
      groups[key].totalWeight += r.weight;
    });

    return Object.values(groups);
  }, [matchingFilteredList]);

  const handleInspectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQcError('');

    if (!inspectingReel) return;

    const gsmNum = parseFloat(gsmResult);
    const brightNum = parseFloat(brightness);
    const softNum = parseInt(softness);

    if (isNaN(gsmNum) || isNaN(brightNum) || isNaN(softNum)) {
      setQcError('Please enter valid numeric QC specifications');
      return;
    }

    if (gsmNum <= 0 || brightNum < 0 || brightNum > 100 || softNum < 1 || softNum > 10) {
      setQcError('Ensure GSM > 0, Brightness between 0-100, Softness between 1-10');
      return;
    }

    const success = updateReelQC(
      inspectingReel.reelNo,
      qcGrade,
      gsmNum,
      brightNum,
      softNum,
      inspector || 'QC Inspector'
    );

    if (success) {
      setReels(getReels());
      setInspectingReel(null);
      setGsmResult('');
      setBrightness('');
      setSoftness('7');
    } else {
      setQcError('QC submission failed');
    }
  };

  const hasQcWriteAccess = user?.role === 'Admin' || user?.role === 'RewinderOperator';

  return (
    <div className="space-y-6 font-sans pb-12 text-left">
      
      {/* 1. HERO GRADIENT HEADER BANNER */}
      {!hideHeader && (
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-lg shrink-0">
                <Package className="h-8 w-8" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{t('finish_stock.title')}</h2>
                  {user?.role !== 'Admin' && (
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-extrabold tracking-wider uppercase text-white border border-white/30 shadow-xs">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-blue-100/90 font-medium mt-1">
                  Browse finished reels inventory using step-by-step cascading filters (Product → GSM → Size → Ply).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TOP METRIC SCORECARDS (INTERACTIVE QUICK FILTERS) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('grade_a')}
          className={`border rounded-3xl p-5 shadow-sm flex items-center gap-4 text-left transition cursor-pointer ${
            activeTab === 'grade_a'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-400'
              : 'bg-white dark:bg-surface-dark border-slate-200 dark:border-slate-700/80 hover:border-emerald-300'
          }`}
        >
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
            <CheckSquare className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Grade A Sellable</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{gradeAStockKg.toLocaleString()} <span className="text-xs text-slate-400 font-normal">kg</span></p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('grade_b')}
          className={`border rounded-3xl p-5 shadow-sm flex items-center gap-4 text-left transition cursor-pointer ${
            activeTab === 'grade_b'
              ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-400'
              : 'bg-white dark:bg-surface-dark border-slate-200 dark:border-slate-700/80 hover:border-amber-300'
          }`}
        >
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
            <ListFilter className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Grade B / Muted</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{gradeBStockKg.toLocaleString()} <span className="text-xs text-slate-400 font-normal">kg</span></p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pending_qc')}
          className={`border rounded-3xl p-5 shadow-sm flex items-center gap-4 text-left transition cursor-pointer ${
            activeTab === 'pending_qc'
              ? 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-500 ring-2 ring-purple-400'
              : 'bg-white dark:bg-surface-dark border-slate-200 dark:border-slate-700/80 hover:border-purple-300'
          }`}
        >
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60 relative">
            <Clipboard className="h-6 w-6" />
            {pendingQcCount > 0 && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-purple-500 animate-ping" />
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Inspection</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{pendingQcCount} <span className="text-xs text-slate-400 font-normal">reels</span></p>
          </div>
        </button>
      </div>

      {/* 2.5 STEP 7 WORKFLOW GUIDE & 1-CLICK QC APPROVAL BANNER */}
      {pendingQcCount > 0 && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-slate-900/40 border border-purple-500/30 dark:border-purple-500/40 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shrink-0">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Step 7: Quality Inspection &amp; Stock Categorization</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500 text-white text-[10px] font-black">
                  {pendingQcCount} Reels Pending
                </span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                Reels slit in Rewinder (Step 6) need QC categorization (Grade A / B) before they can be loaded onto customer delivery challans (Step 8).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleBulkApproveAllGradeA}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#008163] hover:bg-[#006e54] text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-[#008163]/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckSquare className="h-4 w-4" />
              <span>✨ 1-Click Approve All as Grade A</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. FAST FILTER TOOLBAR (CASCADING PRODUCT, GRADE, GSM, SIZE PILL CHIPS) */}
      <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3.5">
        
        {/* Row 1: Search input + Reset Filter Action */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 flex-1 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={stockSearchQuery}
              onChange={e => setStockSearchQuery(e.target.value)}
              placeholder="Search by product, GSM, size, ply, or Reel No..."
              className="bg-transparent border-none text-xs font-semibold focus:outline-none w-full dark:text-white placeholder-slate-400"
            />
            {stockSearchQuery && (
              <button
                type="button"
                onClick={() => setStockSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {(filterProduct !== 'ALL' || filterGsm !== 'ALL' || filterSize !== 'ALL' || filterPly !== 'ALL' || activeTab !== 'all' || stockSearchQuery.trim()) && (
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="px-3.5 py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-300 font-extrabold text-xs transition cursor-pointer flex items-center gap-1.5 border border-red-200 dark:border-red-800/60 shrink-0 shadow-2xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Row 2: Product & Grade Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider min-w-[65px]">
            PRODUCT:
          </span>

          <button
            type="button"
            onClick={() => handleProductChange('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition ${
              filterProduct === 'ALL'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Products ({tabReels.length})
          </button>

          {availableProducts.map(prod => {
            const count = tabReels.filter(r => r.product === prod).length;
            return (
              <button
                key={prod}
                type="button"
                onClick={() => handleProductChange(prod)}
                className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition ${
                  filterProduct === prod
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {prod} ({count})
              </button>
            );
          })}

          {/* Grade Filter Pill Group (All, Grade A, Grade B Only, Pending QC) */}
          <div className="flex items-center gap-1 ml-auto bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0 flex-wrap">
            <span className="text-[9px] font-black text-slate-400 uppercase px-1.5">GRADE:</span>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-0.5 rounded-xl text-[10px] font-extrabold cursor-pointer transition ${
                activeTab === 'all'
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All ({safeReels.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('grade_a')}
              className={`px-2.5 py-0.5 rounded-xl text-[10px] font-extrabold cursor-pointer transition ${
                activeTab === 'grade_a'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
              }`}
            >
              Grade A ({reels.filter(r => r.status === 'IN_STOCK').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('grade_b')}
              className={`px-2.5 py-0.5 rounded-xl text-[10px] font-extrabold cursor-pointer transition ${
                activeTab === 'grade_b'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
              }`}
            >
              Grade B Only ({reels.filter(r => r.status === 'IN_STOCK_B').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pending_qc')}
              className={`px-2.5 py-0.5 rounded-xl text-[10px] font-extrabold cursor-pointer transition ${
                activeTab === 'pending_qc'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30'
              }`}
            >
              Pending QC ({pendingQcCount})
            </button>
          </div>
        </div>

        {/* Row 3: GSM Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider min-w-[65px]">
            GSM:
          </span>

          <button
            type="button"
            onClick={() => handleGsmChange('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition ${
              filterGsm === 'ALL'
                ? 'bg-blue-900 dark:bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All GSM
          </button>

          {availableGsms.map(gsm => {
            const count = tabReels.filter(r => (filterProduct === 'ALL' || r.product === filterProduct) && r.gsm === gsm).length;
            return (
              <button
                key={gsm}
                type="button"
                onClick={() => handleGsmChange(String(gsm))}
                className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition ${
                  filterGsm === String(gsm)
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {gsm} GSM ({count})
              </button>
            );
          })}
        </div>

        {/* Row 4: Size Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider min-w-[65px]">
            SIZE:
          </span>

          <button
            type="button"
            onClick={() => handleSizeChange('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition ${
              filterSize === 'ALL'
                ? 'bg-purple-900 dark:bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Sizes
          </button>

          {availableSizes.map(size => {
            const count = tabReels.filter(r =>
              (filterProduct === 'ALL' || r.product === filterProduct) &&
              (filterGsm === 'ALL' || r.gsm === Number(filterGsm)) &&
              r.size === size
            ).length;
            return (
              <button
                key={size}
                type="button"
                onClick={() => handleSizeChange(String(size))}
                className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition ${
                  filterSize === String(size)
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {size} cm ({count})
              </button>
            );
          })}
        </div>

        {/* Row 5: Ply Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider min-w-[65px]">
            PLY:
          </span>

          <button
            type="button"
            onClick={() => handlePlyChange('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition ${
              filterPly === 'ALL'
                ? 'bg-amber-900 dark:bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Ply
          </button>

          {availablePlys.map(ply => {
            const count = tabReels.filter(r =>
              (filterProduct === 'ALL' || r.product === filterProduct) &&
              (filterGsm === 'ALL' || r.gsm === Number(filterGsm)) &&
              (filterSize === 'ALL' || r.size === Number(filterSize)) &&
              r.ply === ply
            ).length;
            return (
              <button
                key={ply}
                type="button"
                onClick={() => handlePlyChange(String(ply))}
                className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition ${
                  filterPly === String(ply)
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {ply} Ply ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Grouped Stock View */}
      {groupedStock.length === 0 ? (
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-8 sm:p-12 text-center text-xs font-bold text-slate-500 dark:text-slate-400 shadow-sm flex flex-col items-center justify-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
            <AlertCircle className="h-8 w-8" />
          </div>
          
          {activeTab === 'grade_a' && pendingQcCount > 0 ? (
            <div className="space-y-2 max-w-md">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                All {pendingQcCount} Reels are currently in "Pending QC Inspection"
              </h4>
              <p className="text-xs text-slate-500">
                They have not been categorized as Grade A yet. Click below to inspect them or 1-Click Approve all reels as Grade A sellable stock.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('pending_qc')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-sm cursor-pointer transition"
                >
                  View Pending Inspection ({pendingQcCount})
                </button>
                <button
                  type="button"
                  onClick={handleBulkApproveAllGradeA}
                  className="px-4 py-2 bg-[#008163] hover:bg-[#006e54] text-white rounded-xl text-xs font-black shadow-sm cursor-pointer transition flex items-center gap-1.5"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  <span>✨ 1-Click Approve All as Grade A</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                No reels matching your filter selection currently in inventory.
              </p>
              {(activeFilterCount > 0 || activeTab !== 'all' || stockSearchQuery.trim()) && (
                <button
                  onClick={handleClearAllFilters}
                  className="mt-1 px-4 py-2 bg-[#008163] hover:bg-[#006e54] text-white rounded-xl text-xs font-black shadow-sm cursor-pointer transition"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {groupedStock.map((group, index) => (
            <div key={index} className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl overflow-hidden shadow-sm">
              {/* Group Header */}
              <div className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-wrap justify-between items-center gap-3">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {group.product} (GSM {group.gsm} | {group.size} cm | {group.ply} Ply)
                  </h4>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-300 font-mono">
                  <div>Quantity: <span className="text-primary dark:text-blue-400 font-black">{group.reels.length}</span></div>
                  <div>Total Weight: <span className="text-emerald-600 dark:text-emerald-400 font-black">{group.totalWeight} kg</span></div>
                </div>
              </div>

              {/* Group Reels List - Desktop View */}
              {(() => {
                const groupKey = `${group.product}-${group.gsm}-${group.size}-${group.ply}-${index}`;
                const isExpanded = !!expandedGroups[groupKey];
                const displayedReels = isExpanded ? group.reels : group.reels.slice(0, 5);

                return (
                  <div className="hidden md:block p-4 space-y-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                            <th className="py-3 px-3">Reel Number</th>
                            <th className="py-3 px-3">Weight</th>
                            <th className="py-3 px-3">Joints</th>
                            <th className="py-3 px-3">Produced Date</th>
                            <th className="py-3 px-3 text-right">Actions / Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                          {displayedReels.map(reel => (
                            <tr key={reel.reelNo} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/40 transition">
                              <td className="py-3 px-3 font-black font-mono text-primary dark:text-blue-400">{reel.reelNo}</td>
                              <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">{reel.weight} kg</td>
                              <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{reel.joint}</td>
                              <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                                {reel.productionDate}
                              </td>
                              <td className="py-3 px-3 text-right">
                                {reel.status === 'QC_PENDING' ? (
                                  hasQcWriteAccess ? (
                                    <button
                                      onClick={() => {
                                        setInspectingReel(reel);
                                        setGsmResult(String(reel.gsm));
                                        setQcGrade('A');
                                      }}
                                      className="px-3.5 py-1.5 bg-[#008163] hover:bg-[#006e54] text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm cursor-pointer"
                                    >
                                      QC Test
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-purple-600 dark:text-purple-300 font-black uppercase bg-purple-100 dark:bg-purple-950/40 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                                      Pending QC
                                    </span>
                                  )
                                ) : (
                                  <div className="flex items-center justify-end gap-1.5 text-[10px] font-bold">
                                    <span className={`px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${
                                      reel.status === 'IN_STOCK' || reel.qcGrade === 'A'
                                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                                    }`}>
                                      {reel.status === 'IN_STOCK' || reel.qcGrade === 'A' ? 'Grade A' : 'Grade B'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setViewingQcReel(reel)}
                                      title="View QC Test Description & Inspection Details"
                                      className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition cursor-pointer border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center shadow-2xs"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {group.reels.length > 5 && (
                      <div className="pt-2 flex justify-center border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setExpandedGroups(prev => ({
                            ...prev,
                            [groupKey]: !isExpanded
                          }))}
                          className="px-4 py-2 text-xs font-black text-primary dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800/60 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4" /> Show Less ({group.reels.length} total)
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" /> View All {group.reels.length} Reels
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Group Reels List - Mobile Stacked Cards View */}
              <div className="block md:hidden p-4 space-y-3">
                {(() => {
                  const groupKey = `${group.product}-${group.gsm}-${group.size}-${group.ply}-${index}`;
                  const isExpanded = !!expandedGroups[groupKey];
                  const displayedReels = isExpanded ? group.reels : group.reels.slice(0, 3);
                  return (
                    <>
                      {displayedReels.map(reel => (
                        <div key={reel.reelNo} className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 text-xs text-left">
                          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5">
                            <span className="font-mono font-black text-primary dark:text-blue-400 text-xs">{reel.reelNo}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              reel.status === 'QC_PENDING' ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300' :
                              reel.status === 'IN_STOCK' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' :
                              'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                            }`}>
                              {reel.status === 'QC_PENDING' ? 'Pending QC' : reel.status === 'IN_STOCK' ? 'Grade A' : 'Grade B'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-y-2 text-[11px]">
                            <div>
                              <span className="font-bold text-slate-400 uppercase text-[9px] block">Weight</span>
                              <span className="font-black text-slate-900 dark:text-white">{reel.weight} kg</span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-400 uppercase text-[9px] block">Joints</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{reel.joint}</span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-400 uppercase text-[9px] block">Produced</span>
                              <span className="font-mono text-slate-500">{reel.productionDate}</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center">
                            {reel.status === 'QC_PENDING' ? (
                              hasQcWriteAccess ? (
                                <button
                                  onClick={() => {
                                    setInspectingReel(reel);
                                    setGsmResult(String(reel.gsm));
                                    setQcGrade('A');
                                  }}
                                  className="px-3.5 py-1.5 bg-[#008163] hover:bg-[#006e54] text-white rounded-xl text-[10px] font-black uppercase shadow-xs cursor-pointer"
                                >
                                  QC Test
                                </button>
                              ) : (
                                <span className="text-[10px] text-purple-600 dark:text-purple-300 font-black uppercase bg-purple-100 dark:bg-purple-950/40 px-2.5 py-0.5 rounded-full">
                                  Pending QC
                                </span>
                              )
                            ) : (
                              <div className="flex items-center gap-1.5 text-[10px] font-bold">
                                <span className={`px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                                  reel.status === 'IN_STOCK' || reel.qcGrade === 'A'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                                }`}>
                                  {reel.status === 'IN_STOCK' || reel.qcGrade === 'A' ? 'Grade A' : 'Grade B'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setViewingQcReel(reel)}
                                  title="View QC Test Description & Inspection Details"
                                  className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition cursor-pointer border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center shadow-2xs"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {group.reels.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setExpandedGroups(prev => ({
                            ...prev,
                            [groupKey]: !isExpanded
                          }))}
                          className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-primary dark:text-blue-400 font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-2xs mt-2"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-3.5 w-3.5" />
                              <span>Show Less</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3.5 w-3.5" />
                              <span>View More ({group.reels.length - 3} remaining)</span>
                            </>
                          )}
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== CASCADING FILTER POPUP MODAL ===== */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 text-left">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3.5 dark:border-slate-700">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-primary dark:text-blue-400" />
                  Inventory Cascading Filter
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select Product → GSM → Size → Ply to view matching inventory
                </p>
              </div>
              <button
                onClick={() => setShowFilterModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* LIVE MATCHING STATS BANNER */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-md space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" /> Live Filter Results
              </div>
              <div className="text-xl font-black font-mono">
                {matchingFilteredList.length} <span className="text-xs font-normal">Reels</span>
                <span className="mx-2 opacity-40">|</span>
                {matchingTotalWeightKg.toLocaleString()} <span className="text-xs font-normal">kg ({matchingTotalWeightMT} MT)</span>
              </div>
            </div>

            {/* CASCADING DROPDOWN INPUTS */}
            <div className="space-y-4">
              
              {/* STEP 1: PRODUCT */}
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>1. Select Product</span>
                  {filterProduct !== 'ALL' && (
                    <span className="text-[10px] text-primary font-bold">Selected</span>
                  )}
                </label>
                <select
                  value={filterProduct}
                  onChange={e => handleProductChange(e.target.value)}
                  className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                >
                  <option value="ALL">All Products ({availableProducts.length})</option>
                  {availableProducts.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* STEP 2: GSM */}
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>2. Select GSM</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {filterProduct !== 'ALL' ? `Cascaded for ${filterProduct}` : 'Select Product first'}
                  </span>
                </label>
                <select
                  value={filterGsm}
                  onChange={e => handleGsmChange(e.target.value)}
                  className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                >
                  <option value="ALL">All GSMs ({availableGsms.length} available)</option>
                  {availableGsms.map(g => (
                    <option key={g} value={g}>GSM {g}</option>
                  ))}
                </select>
              </div>

              {/* STEP 3: SIZE */}
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>3. Select Size (cm)</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {filterGsm !== 'ALL' ? `Cascaded for GSM ${filterGsm}` : 'All Sizes'}
                  </span>
                </label>
                <select
                  value={filterSize}
                  onChange={e => handleSizeChange(e.target.value)}
                  className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                >
                  <option value="ALL">All Sizes ({availableSizes.length} available)</option>
                  {availableSizes.map(s => (
                    <option key={s} value={s}>{s} cm</option>
                  ))}
                </select>
              </div>

              {/* STEP 4: PLY */}
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>4. Select Ply</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {filterSize !== 'ALL' ? `Cascaded for Size ${filterSize} cm` : 'All Ply'}
                  </span>
                </label>
                <select
                  value={filterPly}
                  onChange={e => handlePlyChange(e.target.value)}
                  className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                >
                  <option value="ALL">All Ply ({availablePlys.length} available)</option>
                  {availablePlys.map(p => (
                    <option key={p} value={p}>{p} Ply</option>
                  ))}
                </select>
              </div>

            </div>

            {/* MODAL FOOTER ACTIONS */}
            <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                <RotateCcw className="h-4 w-4" /> Clear All
              </button>

              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="flex-1 py-3 bg-primary hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Apply & View ({matchingFilteredList.length} Reels)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* QC Test Inspection Modal */}
      {inspectingReel && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overscroll-contain"
          onWheel={(e) => {
            // Prevent wheel event from bubbling to background
            if (e.target === e.currentTarget) {
              e.preventDefault();
            }
          }}
        >
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-left" onClick={(e) => e.stopPropagation()}>
            
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {t('finish_stock.qc_inspect')}
              </h3>
              <button
                onClick={() => setInspectingReel(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleInspectSubmit} className="space-y-4">
              {qcError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-2xl border border-red-200 font-bold">
                  {qcError}
                </div>
              )}

              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <p><span className="font-bold text-slate-400 uppercase text-[10px]">Reel No:</span> <span className="font-black font-mono text-primary dark:text-blue-400">{inspectingReel.reelNo}</span></p>
                <p><span className="font-bold text-slate-400 uppercase text-[10px]">Product:</span> <span className="font-bold text-slate-900 dark:text-white">{inspectingReel.product}</span></p>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Inspection Grade Decision
                </label>
                <select
                  value={qcGrade}
                  onChange={e => setQcGrade(e.target.value as 'A' | 'B')}
                  className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white cursor-pointer"
                >
                  <option value="A">QC PASS - Grade A (Standard Stock)</option>
                  <option value="B">QC FAIL - Grade B (B-Grade Stock)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Tested GSM
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={gsmResult}
                    onChange={e => setGsmResult(e.target.value)}
                    className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                    placeholder="18"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {t('finish_stock.brightness')}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={brightness}
                    onChange={e => setBrightness(e.target.value)}
                    className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                    placeholder="85"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Softness (1-10)
                  </label>
                  <input
                    ref={softnessInputRef}
                    type="number"
                    min="1"
                    max="10"
                    step="1"
                    value={softness}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '') {
                        setSoftness('');
                        return;
                      }
                      const num = parseInt(val, 10);
                      if (!isNaN(num)) {
                        if (num > 10) setSoftness('10');
                        else if (num < 1) setSoftness('1');
                        else setSoftness(String(num));
                      }
                    }}
                    onBlur={() => {
                      const num = parseInt(String(softness), 10);
                      if (isNaN(num) || num < 1) setSoftness('1');
                      else if (num > 10) setSoftness('10');
                    }}
                    className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                    placeholder="7"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Inspector Name
                  </label>
                  <input
                    type="text"
                    value={inspector}
                    onChange={e => setInspector(e.target.value)}
                    className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#008163] hover:bg-[#006e54] text-white font-black py-3 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-[#008163]/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" />
                <span>Submit Quality Inspection Log</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QC Test Inspection Description Modal */}
      {viewingQcReel && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overscroll-contain"
          onClick={() => setViewingQcReel(null)}
          onWheel={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div 
            className="bg-white dark:bg-[#131d38] border border-slate-200 dark:border-[#203058] rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-left select-none animate-in fade-in zoom-in-95" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="border-b border-slate-100 dark:border-[#203058] pb-3 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                  <Beaker className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    QC Test Inspection Description
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                    Quality Assurance &amp; Laboratory Verification
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingQcReel(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-lg p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Reel Identifier Banner */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Reel Number</span>
                <span className="text-base font-black font-mono text-primary dark:text-blue-400">{viewingQcReel.reelNo}</span>
                <span className="text-xs text-slate-600 dark:text-slate-300 block font-bold mt-0.5">{viewingQcReel.product}</span>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                  viewingQcReel.status === 'IN_STOCK' || viewingQcReel.qcGrade === 'A'
                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                    : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                }`}>
                  <Check className="h-3.5 w-3.5" />
                  <span>{viewingQcReel.status === 'IN_STOCK' || viewingQcReel.qcGrade === 'A' ? 'QC PASS - Grade A' : 'QC PASS - Grade B'}</span>
                </span>
              </div>
            </div>

            {/* Grid of QC Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Tested GSM</span>
                <span className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
                  {viewingQcReel.qcGsmResult || viewingQcReel.gsm} <span className="text-[10px] font-normal text-slate-400 font-sans">gsm</span>
                </span>
                <span className="text-[9px] text-slate-500 font-bold">Nominal: {viewingQcReel.gsm} gsm</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Brightness %</span>
                <span className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
                  {viewingQcReel.qcBrightness || 85}%
                </span>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">ISO Standard</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Softness Score</span>
                <span className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
                  {viewingQcReel.qcSoftness || 7} <span className="text-[10px] font-normal text-slate-400 font-sans">/ 10</span>
                </span>
                <span className="text-[9px] text-teal-600 dark:text-teal-400 font-bold">Premium Texture</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Reel Weight</span>
                <span className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
                  {viewingQcReel.weight} <span className="text-[10px] font-normal text-slate-400 font-sans">kg</span>
                </span>
                <span className="text-[9px] text-slate-500 font-bold">{viewingQcReel.joint || 0} Joints</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 col-span-2">
                <span className="text-[10px] font-black uppercase text-slate-400 block">QC Inspector</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 block">
                  {viewingQcReel.qcInspector || 'Rajesh Sharma (QC Specialist)'}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {viewingQcReel.qcTimestamp ? new Date(viewingQcReel.qcTimestamp).toLocaleString('en-IN') : viewingQcReel.productionDate}
                </span>
              </div>
            </div>

            {/* Technical Description Box */}
            <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl border border-blue-200/80 dark:border-blue-900/60 text-xs space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 block">
                Quality Verdict &amp; Technical Notes
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px] font-medium">
                {viewingQcReel.qcGrade === 'B' || viewingQcReel.status === 'IN_STOCK_B'
                  ? `Reel verified with minor GSM/texture variance. Assigned to Grade B inventory stock. Cleared for secondary/B-grade dispatch.`
                  : `Reel passed all tensile strength, ISO brightness, and softness standards within tolerance (±0.2 GSM). Fully certified for Grade A customer dispatch.`}
              </p>
            </div>

            {/* Close Action */}
            <button
              type="button"
              onClick={() => setViewingQcReel(null)}
              className="w-full py-3 bg-[#008163] hover:bg-[#006e54] text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-[#008163]/25 transition cursor-pointer"
            >
              Close Description
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default FinishStockView;
