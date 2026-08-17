import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';

interface FinishStockViewProps {
  hideHeader?: boolean;
}

export const FinishStockView: React.FC<FinishStockViewProps> = ({ hideHeader = false }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [reels, setReels] = useState<Reel[]>(() => getReels());
  const [activeTab, setActiveTab] = useState<'all' | 'grade_a' | 'grade_b' | 'pending_qc'>('grade_a');
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [expandedMobileGroups, setExpandedMobileGroups] = useState<Record<string, boolean>>({});

  // Cascading Filter Popup States
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterProduct, setFilterProduct] = useState<string>('ALL');
  const [filterGsm, setFilterGsm] = useState<string>('ALL');
  const [filterSize, setFilterSize] = useState<string>('ALL');
  const [filterPly, setFilterPly] = useState<string>('ALL');

  // QC Form States
  const [inspectingReel, setInspectingReel] = useState<Reel | null>(null);
  const [qcGrade, setQcGrade] = useState<'A' | 'B'>('A');
  const [gsmResult, setGsmResult] = useState('');
  const [brightness, setBrightness] = useState('');
  const [softness, setSoftness] = useState('7');
  const [inspector, setInspector] = useState(user?.displayName || '');
  const [qcError, setQcError] = useState('');

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

  const gradeAStockKg = useMemo(() => reels.filter(r => r.status === 'IN_STOCK').reduce((acc, r) => acc + r.weight, 0), [reels]);
  const gradeBStockKg = useMemo(() => reels.filter(r => r.status === 'IN_STOCK_B').reduce((acc, r) => acc + r.weight, 0), [reels]);
  const pendingQcCount = useMemo(() => reels.filter(r => r.status === 'QC_PENDING').length, [reels]);

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

      {/* 2. TOP METRIC SCORECARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
            <CheckSquare className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Grade A Sellable</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{gradeAStockKg.toLocaleString()} <span className="text-xs text-slate-400 font-normal">kg</span></p>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
            <ListFilter className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Grade B / Muted</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{gradeBStockKg.toLocaleString()} <span className="text-xs text-slate-400 font-normal">kg</span></p>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60">
            <Clipboard className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Inspection</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{pendingQcCount} <span className="text-xs text-slate-400 font-normal">reels</span></p>
          </div>
        </div>
      </div>

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

          {(filterProduct !== 'ALL' || filterGsm !== 'ALL' || filterSize !== 'ALL' || filterPly !== 'ALL' || activeTab !== 'grade_a' || stockSearchQuery.trim()) && (
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

          {/* Grade Filter Pill Group (All, Grade A, Grade B Only) */}
          <div className="flex items-center gap-1 ml-auto bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0">
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
              All
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
              Grade A
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
              Grade B Only
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
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-12 text-center text-xs font-bold text-slate-500 dark:text-slate-400 shadow-sm flex flex-col items-center justify-center gap-3">
          <AlertCircle className="h-10 w-10 text-slate-400" />
          <span>No reels matching your filter selection currently in inventory.</span>
          {activeFilterCount > 0 && (
            <button
              onClick={handleClearAllFilters}
              className="mt-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-black shadow-sm cursor-pointer"
            >
              Reset Filters
            </button>
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
              <div className="hidden md:block overflow-x-auto p-4">
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
                    {group.reels.map(reel => (
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
                                className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm cursor-pointer"
                              >
                                QC Test
                              </button>
                            ) : (
                              <span className="text-[10px] text-purple-600 font-black uppercase bg-purple-100 dark:bg-purple-950/40 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                                Pending QC
                              </span>
                            )
                          ) : (
                            <div className="flex justify-end gap-1.5 text-[10px] font-bold">
                              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-extrabold">
                                GSM: {reel.qcGsmResult || reel.gsm}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Group Reels List - Mobile Stacked Cards View */}
              <div className="block md:hidden p-4 space-y-3">
                {(() => {
                  const groupKey = `${group.product}-${index}`;
                  const isExpanded = !!expandedMobileGroups[groupKey];
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
                                  className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-xs"
                                >
                                  QC Test
                                </button>
                              ) : (
                                <span className="text-[10px] text-purple-600 font-black uppercase bg-purple-100 dark:bg-purple-950/40 px-2.5 py-0.5 rounded-full">
                                  Pending QC
                                </span>
                              )
                            ) : (
                              <div className="flex gap-1.5 text-[10px] font-bold">
                                <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-300 font-extrabold">
                                  GSM: {reel.qcGsmResult || reel.gsm}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {group.reels.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setExpandedMobileGroups(prev => ({
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
                              <span>View More Reels (Showing 3 of {group.reels.length})</span>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-left">
            
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
                  <select
                    value={softness}
                    onChange={e => setSoftness(e.target.value)}
                    className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
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
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                Submit Quality Inspection Log
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default FinishStockView;
