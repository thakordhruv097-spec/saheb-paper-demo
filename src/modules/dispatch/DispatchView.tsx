import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  getPackingSlips,
  savePackingSlip,
  confirmDispatch,
  getReels,
  getParties,
  getVehicles,
  getPendingOrders,
  savePendingOrder,
  getProducts,
} from '../../data/index';
import type { PackingSlip, Reel, PendingOrder } from '../../data/types';
import * as XLSX from 'xlsx';
import { CustomDatePickerModal } from '../../components/CustomDatePickerModal';
import {
  Truck,
  Plus,
  FileText,
  CheckCircle,
  FileSpreadsheet,
  AlertTriangle,
  Printer,
  Trash2,
  Search,
  ListFilter,
  PackageCheck,
  Package,
  Calendar,
  ChevronDown,
  ChevronUp,
  Zap,
  SlidersHorizontal,
  LayoutGrid,
  List,
  CheckSquare,
  Square,
  X,
  RotateCcw,
  ScanBarcode,
} from 'lucide-react';

interface DispatchViewProps {
  initialTab?: 'orders' | 'create_slip' | 'slips_list';
  hideTabs?: boolean;
  hideHeader?: boolean;
  onOpenScanner?: () => void;
}

export const DispatchView: React.FC<DispatchViewProps> = ({ initialTab = 'orders', hideTabs = false, hideHeader = false, onOpenScanner }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [slips, setSlips] = useState<PackingSlip[]>(() => getPackingSlips());
  const [reels, setReels] = useState<Reel[]>(() => getReels());
  const [orders, setOrders] = useState<PendingOrder[]>(() => getPendingOrders());
  const parties = getParties();
  const vehicles = getVehicles();
  const products = getProducts();

  // Tab View Toggle
  const [activeTab, setActiveTab] = useState<'orders' | 'create_slip' | 'slips_list'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Tactile Web Audio Beep Sound
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) {}
  };

  // Success / Error States
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Search Queries
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [slipSearchQuery, setSlipSearchQuery] = useState('');
  const [showAllReels, setShowAllReels] = useState(false);

  // Fast Reel Selection Filter States
  const [reelSearchQuery, setReelSearchQuery] = useState('');
  const [reelProductFilter, setReelProductFilter] = useState<'ALL' | string>('ALL');
  const [reelGsmFilter, setReelGsmFilter] = useState<'ALL' | number>('ALL');
  const [reelSizeFilter, setReelSizeFilter] = useState<'ALL' | number>('ALL');
  const [reelGradeFilter, setReelGradeFilter] = useState<'ALL' | 'A' | 'B'>('ALL');
  const [reelViewMode, setReelViewMode] = useState<'grid' | 'table'>('grid');
  const [barcodeGunInput, setBarcodeGunInput] = useState('');

  const filteredOrders = useMemo(() => {
    const q = orderSearchQuery.toLowerCase().trim();
    if (!q) return orders;
    return orders.filter(order => {
      const partyObj = parties.find(p => p.id === order.partyId);
      const prodObj = products.find(p => p.id === order.productId);
      return (
        (partyObj && partyObj.name.toLowerCase().includes(q)) ||
        (prodObj && prodObj.name.toLowerCase().includes(q)) ||
        order.id.toLowerCase().includes(q)
      );
    });
  }, [orders, orderSearchQuery, parties, products]);

  const filteredSlips = useMemo(() => {
    const q = slipSearchQuery.toLowerCase().trim();
    if (!q) return slips;
    return slips.filter(slip => {
      const partyObj = parties.find(p => p.id === slip.partyId);
      const vehicleObj = vehicles.find(v => v.id === slip.vehicleId);
      return (
        slip.slipNo.toLowerCase().includes(q) ||
        slip.date.toLowerCase().includes(q) ||
        (partyObj && partyObj.name.toLowerCase().includes(q)) ||
        (vehicleObj && vehicleObj.vehicleNo.toLowerCase().includes(q))
      );
    });
  }, [slips, slipSearchQuery, parties, vehicles]);

  // 1. Order Creation States
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [orderQty, setOrderQty] = useState('');
  const [orderDue, setOrderDue] = useState(() => new Date().toISOString().substring(0, 10));
  const [openOrderDuePicker, setOpenOrderDuePicker] = useState(false);

  // 2. Packing Slip Form States
  const [slipNo, setSlipNo] = useState('');
  const [slipDate, setSlipDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [openSlipDatePicker, setOpenSlipDatePicker] = useState(false);
  const [slipPartyId, setSlipPartyId] = useState('');
  const [slipVehicleId, setSlipVehicleId] = useState('');
  const [selectedReelNos, setSelectedReelNos] = useState<string[]>([]);
  const [driverSig, setDriverSig] = useState('');
  const [receiverSig, setReceiverSig] = useState('');

  // 3. Active Challan Detail Modal (for PDF/Excel print review)
  const [viewingSlip, setViewingSlip] = useState<PackingSlip | null>(null);

  // Auto-generate slip number
  const autoSlipNo = useMemo(() => {
    const cleanDate = slipDate.replace(/-/g, '');
    const index = slips.length + 1;
    const padIndex = String(index).padStart(4, '0');
    return `CHALLAN-${cleanDate}-${padIndex}`;
  }, [slipDate, slips]);

  // Filter available reels in stock for Packing Slip selection
  const availableReels = useMemo(() => {
    return reels.filter(r => r.status === 'IN_STOCK' || r.status === 'IN_STOCK_B');
  }, [reels]);

  // Unique Products present in available reels for quick filter pills
  const uniqueProducts = useMemo(() => {
    const set = new Set<string>();
    availableReels.forEach(r => {
      if (r.product) set.add(r.product);
    });
    return Array.from(set).sort();
  }, [availableReels]);

  // Unique GSMs present in available reels for quick filter pills
  const uniqueGsms = useMemo(() => {
    const set = new Set<number>();
    availableReels.forEach(r => {
      if (r.gsm) set.add(r.gsm);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [availableReels]);

  // Unique Sizes present in available reels for quick filter pills
  const uniqueSizes = useMemo(() => {
    const set = new Set<number>();
    availableReels.forEach(r => {
      if (r.size) set.add(r.size);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [availableReels]);

  // Real-time filtered available reels
  const filteredAvailableReels = useMemo(() => {
    return availableReels.filter(r => {
      if (reelProductFilter !== 'ALL' && r.product !== reelProductFilter) return false;
      if (reelGsmFilter !== 'ALL' && r.gsm !== reelGsmFilter) return false;
      if (reelSizeFilter !== 'ALL' && r.size !== reelSizeFilter) return false;
      if (reelGradeFilter !== 'ALL' && (r.qcGrade || 'A').toUpperCase() !== reelGradeFilter) return false;
      if (reelSearchQuery.trim()) {
        const q = reelSearchQuery.toLowerCase().trim();
        const matchReelNo = r.reelNo.toLowerCase().includes(q);
        const matchProd = (r.product || '').toLowerCase().includes(q);
        const matchGsm = String(r.gsm).includes(q);
        const matchSize = String(r.size).includes(q);
        const matchWeight = String(r.weight).includes(q);
        if (!matchReelNo && !matchProd && !matchGsm && !matchSize && !matchWeight) return false;
      }
      return true;
    });
  }, [availableReels, reelProductFilter, reelGsmFilter, reelSizeFilter, reelGradeFilter, reelSearchQuery]);

  // Predictive typing suggestions when user types in the rapid entry box
  const typingReelMatches = useMemo(() => {
    const q = barcodeGunInput.trim().toLowerCase();
    if (!q) return [];
    return availableReels
      .filter(r => !selectedReelNos.includes(r.reelNo) && (
        r.reelNo.toLowerCase().includes(q) ||
        String(r.gsm).includes(q) ||
        String(r.size).includes(q) ||
        (r.product || '').toLowerCase().includes(q)
      ))
      .slice(0, 4);
  }, [barcodeGunInput, availableReels, selectedReelNos]);

  // Fast Batch Selection Actions
  const handleSelectAllFiltered = () => {
    const allNos = filteredAvailableReels.map(r => r.reelNo);
    setSelectedReelNos(prev => Array.from(new Set([...prev, ...allNos])));
    playBeep();
  };

  const handleDeselectAllFiltered = () => {
    const filteredSet = new Set(filteredAvailableReels.map(r => r.reelNo));
    setSelectedReelNos(prev => prev.filter(no => !filteredSet.has(no)));
    playBeep();
  };

  const handleSelectTopN = (n: number) => {
    const unselected = filteredAvailableReels.filter(r => !selectedReelNos.includes(r.reelNo));
    const toAdd = unselected.slice(0, n).map(r => r.reelNo);
    if (toAdd.length > 0) {
      setSelectedReelNos(prev => [...prev, ...toAdd]);
      playBeep();
    }
  };

  const handleBarcodeGunSubmit = (e?: React.FormEvent, customVal?: string) => {
    if (e) e.preventDefault();
    const raw = (customVal !== undefined ? customVal : barcodeGunInput).trim();
    if (!raw) return;
    const codes = raw.split(/[\s,]+/).filter(Boolean);
    const validCodesToAdd: string[] = [];
    codes.forEach(code => {
      // 1. Exact match first
      let found = availableReels.find(r => r.reelNo.toUpperCase() === code.toUpperCase());
      // 2. Partial match (last digits or subcode)
      if (!found) {
        found = availableReels.find(r => r.reelNo.toUpperCase().includes(code.toUpperCase()));
      }
      if (found) {
        validCodesToAdd.push(found.reelNo);
      }
    });
    if (validCodesToAdd.length > 0) {
      setSelectedReelNos(prev => Array.from(new Set([...prev, ...validCodesToAdd])));
      playBeep();
      setBarcodeGunInput('');
      setSuccessMsg(`Added ${validCodesToAdd.length} reel(s): ${validCodesToAdd.join(', ')}`);
    } else {
      setErrorMsg(`Reel '${raw}' not found in active warehouse stock.`);
    }
  };

  // Handle Order submit
  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!selectedPartyId || !selectedProductId || !orderQty || !orderDue) {
      setErrorMsg('All order fields are required');
      return;
    }

    const qty = parseInt(orderQty);
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod || isNaN(qty) || qty <= 0) {
      setErrorMsg('Invalid product or quantity selection');
      return;
    }

    const newOrder: PendingOrder = {
      id: `or-${Date.now()}`,
      partyId: selectedPartyId,
      productId: selectedProductId,
      gsm: prod.gsm,
      size: prod.size,
      ply: prod.ply,
      qty,
      dueDate: orderDue,
      status: 'PENDING',
      dispatchedQty: 0,
    };

    savePendingOrder(newOrder, user?.displayName || 'System');
    setOrders(getPendingOrders());
    setSuccessMsg('Pending Order successfully registered!');
    setSelectedPartyId('');
    setSelectedProductId('');
    setOrderQty('');
    setOrderDue('');
  };

  // Toggle reel selection
  const handleToggleReel = (rNo: string) => {
    setSelectedReelNos(prev => {
      const exists = prev.includes(rNo);
      playBeep();
      return exists ? prev.filter(n => n !== rNo) : [...prev, rNo];
    });
  };

  // Handle Draft Packing Slip creation
  const handleSlipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const targetSlipNo = slipNo.trim() || autoSlipNo;

    if (!slipPartyId || !slipVehicleId.trim() || selectedReelNos.length === 0) {
      setErrorMsg('Please select Customer Party, enter Vehicle / Truck No, and select at least 1 Reel.');
      return;
    }

    if (slips.some(s => s.slipNo.toUpperCase() === targetSlipNo.toUpperCase())) {
      setErrorMsg(`Challan number ${targetSlipNo} has already been logged.`);
      return;
    }

    const newSlip: PackingSlip = {
      id: `slip-${Date.now()}`,
      slipNo: targetSlipNo,
      date: slipDate,
      partyId: slipPartyId,
      vehicleId: slipVehicleId.trim(),
      reelNos: [...selectedReelNos],
      driverSignature: driverSig.trim() || 'Driver On Duty',
      receiverSignature: receiverSig.trim() || 'Gate Verified',
      status: 'DRAFT',
    };

    savePackingSlip(newSlip, user?.displayName || 'System');
    setSlips(getPackingSlips());
    setSuccessMsg(`Draft Packing Slip #${targetSlipNo} created successfully! Reels linked: ${selectedReelNos.length}`);
    
    // Reset Form
    setSlipNo('');
    setSlipPartyId('');
    setSlipVehicleId('');
    setSelectedReelNos([]);
    setDriverSig('');
    setReceiverSig('');
    setActiveTab('slips_list');
  };

  // Handle Confirm Dispatch trigger (atomic decrement & status updates)
  const handleConfirmDispatch = (slipId: string) => {
    setSuccessMsg('');
    setErrorMsg('');

    try {
      confirmDispatch(slipId, user?.displayName || 'System');
      // Refresh local lists
      setSlips(getPackingSlips());
      setReels(getReels());
      setOrders(getPendingOrders());
      setSuccessMsg('Dispatch finalized successfully! Finished stock counts decremented and transaction audit log written.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error finalizing dispatch');
    }
  };

  // --- SHEETJS EXPORTS ---
  const handleExportExcel = (slip: PackingSlip) => {
    const partyObj = parties.find(p => p.id === slip.partyId);
    const vehicleObj = vehicles.find(v => v.id === slip.vehicleId);
    const linkedReels = reels.filter(r => slip.reelNos.includes(r.reelNo));

    const data = linkedReels.map(r => ({
      'Reel Number': r.reelNo,
      'Product Description': r.product,
      'GSM': r.gsm,
      'Size (cm)': r.size,
      'Ply': r.ply,
      'Weight (kg)': r.weight,
      'Diameter (mm)': r.dia,
      'Joints': r.joint,
      'QC Grade': r.qcGrade,
    }));

    const worksheet = XLSX.utils.json_to_sheet([]);
    
    // Add Metadata header rows
    XLSX.utils.sheet_add_aoa(worksheet, [
      ["SAHEB PAPER PVT. LTD. - DELIVERY CHALLAN RECEIPT"],
      [`Challan No: ${slip.slipNo}`, `Date: ${slip.date}`],
      [`Customer: ${partyObj?.name || 'N/A'}`, `Vehicle No: ${vehicleObj?.vehicleNo || 'N/A'}`],
      [`Driver: ${slip.driverSignature}`, `Receiver: ${slip.receiverSignature}`],
      [], // blank separator row
    ], { origin: "A1" });

    // Add data starting at row 6
    XLSX.utils.sheet_add_json(worksheet, data, { origin: "A6" });

    // Set column widths
    worksheet['!cols'] = [
      { wch: 28 }, // Reel Number
      { wch: 22 }, // Product Description
      { wch: 8 },  // GSM
      { wch: 12 }, // Size
      { wch: 6 },  // Ply
      { wch: 14 }, // Weight
      { wch: 14 }, // Diameter
      { wch: 8 },  // Joints
      { wch: 10 }, // QC Grade
    ];

    // Merge title row
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Challan Summary");
    XLSX.writeFile(workbook, `Delivery_Challan_${slip.slipNo}.xlsx`);
  };

  const handlePrintChallan = () => {
    window.print();
  };

  return (
    <div className="space-y-3 sm:space-y-6">
      
      {/* Title / Hero Banner */}
      {!hideHeader && (
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-slate-900 rounded-2xl p-4 sm:p-4.5 px-5 sm:px-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-md shrink-0">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight font-heading">
                    {initialTab === 'orders' ? 'Order Bookings' : 'Dispatch Slips'}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Scorecards */}
      {!hideHeader && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Customer Orders</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{orders.filter(o => o.status !== 'COMPLETED').length} <span className="text-xs text-slate-400 font-normal">active</span></p>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Order Reels</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{orders.reduce((sum, o) => sum + Math.max(0, o.qty - o.dispatchedQty), 0).toLocaleString()} <span className="text-xs text-slate-400 font-normal">reels due</span></p>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
              <PackageCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed Packing Slips</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{slips.length} <span className="text-xs text-slate-400 font-normal">challans</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Pill Navigation Tabs */}
      {!hideTabs && (
        <div className="flex bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 max-w-max gap-1">
          {initialTab === 'orders' && (
            <button
              onClick={() => { setActiveTab('orders'); setSuccessMsg(''); setErrorMsg(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Pending Customer Orders</span>
            </button>
          )}
          {initialTab !== 'orders' && (
            <>
              <button
                onClick={() => { setActiveTab('create_slip'); setSuccessMsg(''); setErrorMsg(''); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'create_slip'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Plus className="h-4 w-4" />
                <span>Draft Packing Slip</span>
              </button>
              <button
                onClick={() => { setActiveTab('slips_list'); setSuccessMsg(''); setErrorMsg(''); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'slips_list'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Truck className="h-4 w-4" />
                <span>Packing Slips & Challans ({slips.length})</span>
              </button>
            </>
          )}
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

      {/* 1. TAB: Pending Customer Orders */}
      {activeTab === 'orders' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* List Section */}
          <div className="lg:col-span-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Active Orders Ledger
            </h3>

            {/* Search bar */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 flex items-center gap-3">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={orderSearchQuery}
                onChange={e => setOrderSearchQuery(e.target.value)}
                placeholder="Search orders by customer or product..."
                className="bg-transparent border-none text-xs font-semibold focus:outline-none w-full dark:text-white placeholder-slate-400"
              />
              <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                <ListFilter className="h-4 w-4" />
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center font-medium">No orders match your search criteria.</p>
            ) : (
              <div className="space-y-4">
                {/* Desktop/Tablet Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                        <th className="py-3 px-3">Customer</th>
                        <th className="py-3 px-3">Product Specs</th>
                        <th className="py-3 px-3">Ordered Qty</th>
                        <th className="py-3 px-3">Dispatched</th>
                        <th className="py-3 px-3">Due Date</th>
                        <th className="py-3 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                      {filteredOrders.map(order => {
                        const partyObj = parties.find(p => p.id === order.partyId);
                        const prodObj = products.find(p => p.id === order.productId);
                        return (
                          <tr key={order.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/40 transition">
                            <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{partyObj?.name}</td>
                            <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{prodObj?.name} ({order.gsm}GSM | {order.size}cm)</td>
                            <td className="py-3 px-3 font-bold text-slate-900 dark:text-white font-mono">{order.qty} reels</td>
                            <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-bold font-mono">{order.dispatchedQty} reels</td>
                            <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">{order.dueDate}</td>
                            <td className="py-3 px-3 text-right">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                order.status === 'PENDING' ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200' :
                                order.status === 'PARTIAL' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200' :
                                'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Stacked Cards */}
                <div className="block md:hidden space-y-3">
                  {filteredOrders.map(order => {
                    const partyObj = parties.find(p => p.id === order.partyId);
                    const prodObj = products.find(p => p.id === order.productId);
                    return (
                      <div key={order.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 text-xs text-left">
                        <div className="flex justify-between items-center border-b pb-2 dark:border-slate-800">
                          <span className="font-bold text-slate-900 dark:text-white">{partyObj?.name}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            order.status === 'PENDING' ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300' :
                            order.status === 'PARTIAL' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' :
                            'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-2 text-[11px] text-slate-600 dark:text-slate-400">
                          <div>
                            <span className="font-bold text-slate-400 block uppercase tracking-wider text-[9px]">Product Spec</span>
                            <span className="font-semibold text-slate-800 dark:text-white">{prodObj?.name} ({order.gsm}GSM | {order.size}cm)</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-400 block uppercase tracking-wider text-[9px]">Ordered Quantity</span>
                            <span className="font-bold text-slate-800 dark:text-white">{order.qty} reels</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-400 block uppercase tracking-wider text-[9px]">Dispatched Quantity</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{order.dispatchedQty} reels</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-400 block uppercase tracking-wider text-[9px]">Due Date</span>
                            <span className="font-medium text-slate-800 dark:text-white">{order.dueDate}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Form Section */}
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Register New Order
            </h3>

            <form onSubmit={handleOrderSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Select Customer Party</label>
                <select
                  value={selectedPartyId}
                  onChange={e => setSelectedPartyId(e.target.value)}
                  className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white cursor-pointer"
                >
                  <option value="">-- Choose Party --</option>
                  {parties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Select Product Specs</label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white cursor-pointer"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.gsm}GSM | {p.size}cm)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Ordered Reels Count</label>
                <input
                  type="number"
                  value={orderQty}
                  onChange={e => setOrderQty(e.target.value)}
                  className="block w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary dark:text-white font-mono"
                  placeholder="e.g. 20"
                />
              </div>

              <div className="relative">
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Due Date</label>
                <button
                  type="button"
                  onClick={() => setOpenOrderDuePicker(prev => !prev)}
                  className="w-full flex items-center justify-between py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <span className={orderDue ? 'font-bold' : 'text-slate-400 font-normal'}>{orderDue || 'dd-mm-yyyy'}</span>
                  <Calendar className="h-4 w-4 text-primary dark:text-blue-400" />
                </button>
                {openOrderDuePicker && (
                  <CustomDatePickerModal
                    selectedDate={orderDue}
                    onSelectDate={(newDate) => {
                      setOrderDue(newDate);
                      setOpenOrderDuePicker(false);
                    }}
                    onClose={() => setOpenOrderDuePicker(false)}
                  />
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                Log Order Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. TAB: Create Draft Packing Slip */}
      {activeTab === 'create_slip' && (
        <form
          onSubmit={handleSlipSubmit}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
              const inputEl = e.target as HTMLInputElement;
              if (inputEl.placeholder?.includes('Scan / Type Reel Number')) {
                return; // let rapid reel entry handle its own submit
              }
              e.preventDefault();
            }
          }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start"
        >
          
          {/* Challan Card (1/3 width) - Modern Gate Pass UI */}
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Create Gate Pass Challan
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 text-[10px] font-black uppercase tracking-wider border border-blue-200 dark:border-blue-800">
                DRAFT #{autoSlipNo.slice(-4) || '84'}
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                Customer / Party Name
              </label>
              <select
                value={slipPartyId}
                onChange={e => setSlipPartyId(e.target.value)}
                className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white cursor-pointer"
              >
                <option value="">-- Select Customer Party --</option>
                {parties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Vehicle / Truck No</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="dispatch-truck-suggestions"
                    value={slipVehicleId}
                    onChange={e => {
                      const val = e.target.value;
                      setSlipVehicleId(val);
                      const vObj = vehicles.find(v => v.vehicleNo.toLowerCase() === val.toLowerCase() || v.id === val);
                      if (vObj && vObj.driverName && !driverSig) {
                        setDriverSig(vObj.driverName);
                      }
                    }}
                    className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none dark:text-white uppercase font-mono placeholder:normal-case placeholder:font-sans"
                    placeholder="e.g. GJ-05-BX-4921"
                  />
                  <datalist id="dispatch-truck-suggestions">
                    {vehicles.map(v => (
                      <option key={v.id} value={v.vehicleNo}>{v.driverName ? `Driver: ${v.driverName}` : ''}</option>
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                  Driver Name / Mobile
                </label>
                <input
                  type="text"
                  value={driverSig}
                  onChange={e => setDriverSig(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none dark:text-white font-mono"
                  placeholder="e.g. Ramesh (98765-43210)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                  Receiver Name / Sig
                </label>
                <input
                  type="text"
                  value={receiverSig}
                  onChange={e => setReceiverSig(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none dark:text-white"
                  placeholder="Receiver Signature"
                />
              </div>

              <div className="relative">
                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                  Dispatch Date
                </label>
                <button
                  type="button"
                  onClick={() => setOpenSlipDatePicker(prev => !prev)}
                  className="w-full flex items-center justify-between py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <span className={slipDate ? 'font-mono' : 'text-slate-400 font-normal'}>{slipDate || 'dd-mm-yyyy'}</span>
                  <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </button>
                {openSlipDatePicker && (
                  <CustomDatePickerModal
                    selectedDate={slipDate}
                    onSelectDate={(newDate) => {
                      setSlipDate(newDate);
                      setOpenSlipDatePicker(false);
                    }}
                    onClose={() => setOpenSlipDatePicker(false)}
                  />
                )}
              </div>
            </div>

            {/* Loaded Reels Header with + Scan to Add */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-xs font-black text-slate-900 dark:text-white">
                Loaded Reels ({selectedReelNos.length})
              </div>
              {onOpenScanner && (
                <button
                  type="button"
                  onClick={onOpenScanner}
                  className="text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>+ Scan to Add</span>
                </button>
              )}
            </div>

            {/* Total Calculation Row Card */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/70 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  CHALLAN TOTAL WEIGHT
                </div>
                <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
                  {reels.filter(r => selectedReelNos.includes(r.reelNo)).reduce((sum, r) => sum + (r.weight || 0), 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">KG</span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                selectedReelNos.length > 0
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
              }`}>
                {selectedReelNos.length > 0 ? '✓ Ready to Dispatch' : '0 Reels Selected'}
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold py-3.5 px-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Truck className="h-4 w-4" />
              <span>Print Gate Pass &amp; Dispatch</span>
            </button>
          </div>

          {/* Reel Selection Ledger (2/3 width) - FAST BATCH & MULTI-SELECTION ENGINE */}
          <div className="lg:col-span-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5 text-left">
            
            {/* 1. Header with Tally, Search Bar (Picture 3 Spot) & View Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Warehouse Stock Reels
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 text-[10px] font-black font-mono">
                    {selectedReelNos.length} Selected ({reels.filter(r => selectedReelNos.includes(r.reelNo)).reduce((s, r) => s + (r.weight || 0), 0).toLocaleString()} kg)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-semibold">
                  Showing {filteredAvailableReels.length} of {availableReels.length} available reels
                </p>
              </div>

              {/* RIGHT SIDE OF PICTURE 3: Live Search Input + View Switcher */}
              <div className="flex items-center gap-2">
                {/* Search Bar placed directly in Pic 3 spot */}
                <div className="relative w-full sm:w-56">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={reelSearchQuery}
                    onChange={e => setReelSearchQuery(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                    placeholder="Search No, GSM, Size..."
                    className="w-full py-1.5 pl-8 pr-7 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none dark:text-white"
                  />
                  {reelSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setReelSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* View Switcher: Grid vs Table */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => setReelViewMode('grid')}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      reelViewMode === 'grid'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                    title="Card Grid View"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setReelViewMode('table')}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      reelViewMode === 'table'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                    title="Compact High-Density Table View"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Rapid Reel / Barcode Gun Entry Bar (Clean Input without Clunky Datalist) */}
            <div className="space-y-2">
              <div className="flex gap-1.5 relative">
                <div className="relative w-full">
                  <ScanBarcode className="h-4 w-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={barcodeGunInput}
                    onChange={e => setBarcodeGunInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleBarcodeGunSubmit(e);
                      }
                    }}
                    placeholder="Scan / Type Reel Number (e.g. 1048)..."
                    className="w-full py-2 pl-8 pr-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none dark:text-white font-mono placeholder:font-sans placeholder:font-normal"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleBarcodeGunSubmit()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shrink-0 cursor-pointer shadow-sm flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Reel</span>
                </button>
              </div>

              {/* Smart Predictive Typing Assistance Chips (Instant 1-Click Tap to Add) */}
              {typingReelMatches.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/80 rounded-xl">
                  <span className="text-[10px] font-black text-blue-700 dark:text-blue-300 uppercase tracking-wider mr-1">
                    Quick Match (Tap to Add):
                  </span>
                  {typingReelMatches.map(r => (
                    <button
                      key={r.reelNo}
                      type="button"
                      onClick={() => handleBarcodeGunSubmit(undefined, r.reelNo)}
                      className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer transition flex items-center gap-1 font-mono"
                    >
                      <Plus className="h-3 w-3 text-blue-500" />
                      <span>{r.reelNo}</span>
                      <span className="text-[10px] font-normal text-slate-400">({r.gsm}g • {r.size}cm • {r.weight}kg)</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Fast Batch Selection Buttons, Product, Grade, GSM & Size Filter Chips */}
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              
              {/* Row A: Quick 1-Click Batch Actions */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">
                  Batch Select:
                </span>
                
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-extrabold border border-blue-200 dark:border-blue-800 cursor-pointer transition flex items-center gap-1"
                >
                  <CheckSquare className="h-3 w-3" />
                  <span>Select All Filtered ({filteredAvailableReels.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTopN(5)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-extrabold cursor-pointer transition"
                >
                  + 5 Reels
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTopN(10)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-extrabold cursor-pointer transition"
                >
                  + 10 Reels
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTopN(20)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-extrabold cursor-pointer transition"
                >
                  + 20 Reels
                </button>

                {selectedReelNos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReelNos([]);
                      playBeep();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 text-xs font-extrabold border border-red-200 dark:border-red-800 cursor-pointer transition ml-auto flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    <span>Clear Selection</span>
                  </button>
                )}
              </div>

              {/* Row B: Product & Grade Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">
                  Product:
                </span>

                <button
                  type="button"
                  onClick={() => setReelProductFilter('ALL')}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold cursor-pointer transition ${
                    reelProductFilter === 'ALL'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  All Products ({availableReels.length})
                </button>

                {uniqueProducts.map(prod => {
                  const count = availableReels.filter(r => r.product === prod).length;
                  return (
                    <button
                      key={prod}
                      type="button"
                      onClick={() => setReelProductFilter(prod)}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold cursor-pointer transition ${
                        reelProductFilter === prod
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {prod} ({count})
                    </button>
                  );
                })}

                {/* Grade Filter Pill Group (All, Grade A, Grade B) */}
                <div className="flex items-center gap-1 ml-auto bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] font-black text-slate-400 uppercase px-1">Grade:</span>
                  <button
                    type="button"
                    onClick={() => setReelGradeFilter('ALL')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition ${
                      reelGradeFilter === 'ALL'
                        ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setReelGradeFilter('A')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition ${
                      reelGradeFilter === 'A'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                    }`}
                  >
                    Grade A
                  </button>
                  <button
                    type="button"
                    onClick={() => setReelGradeFilter('B')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition ${
                      reelGradeFilter === 'B'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                    }`}
                  >
                    Grade B Only
                  </button>
                </div>
              </div>

              {/* Row C: GSM Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">
                  GSM:
                </span>

                <button
                  type="button"
                  onClick={() => setReelGsmFilter('ALL')}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold cursor-pointer transition ${
                    reelGsmFilter === 'ALL'
                      ? 'bg-blue-900 dark:bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  All GSM
                </button>

                {uniqueGsms.map(gsm => {
                  const count = availableReels.filter(r => r.gsm === gsm).length;
                  return (
                    <button
                      key={gsm}
                      type="button"
                      onClick={() => setReelGsmFilter(gsm)}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold cursor-pointer transition ${
                        reelGsmFilter === gsm
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {gsm} GSM ({count})
                    </button>
                  );
                })}
              </div>

              {/* Row D: Size Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">
                  Size:
                </span>

                <button
                  type="button"
                  onClick={() => setReelSizeFilter('ALL')}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold cursor-pointer transition ${
                    reelSizeFilter === 'ALL'
                      ? 'bg-indigo-900 dark:bg-indigo-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  All Sizes
                </button>

                {uniqueSizes.map(sz => {
                  const count = availableReels.filter(r => r.size === sz).length;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setReelSizeFilter(sz)}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold cursor-pointer transition ${
                        reelSizeFilter === sz
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {sz} cm ({count})
                    </button>
                  );
                })}
              </div>

            </div>


            {/* 4. REELS LIST: Grid Cards Mode or Compact Table Mode */}
            {filteredAvailableReels.length === 0 ? (
              <p className="text-xs text-slate-500 py-10 text-center bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl font-semibold">
                No warehouse reels match your current filter. Try resetting the GSM or Search query.
              </p>
            ) : reelViewMode === 'table' ? (
              
              /* HIGH-DENSITY COMPACT TABLE VIEW */
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-[500px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase text-[10px] font-black tracking-wider z-10">
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={filteredAvailableReels.length > 0 && filteredAvailableReels.every(r => selectedReelNos.includes(r.reelNo))}
                          onChange={e => {
                            if (e.target.checked) handleSelectAllFiltered();
                            else handleDeselectAllFiltered();
                          }}
                          className="h-3.5 w-3.5 rounded text-blue-600 cursor-pointer"
                        />
                      </th>
                      <th className="py-2 px-3">Reel Number</th>
                      <th className="py-2 px-3">Product Spec</th>
                      <th className="py-2 px-3">GSM</th>
                      <th className="py-2 px-3">Size</th>
                      <th className="py-2 px-3">Weight</th>
                      <th className="py-2 px-3">Dia / Joints</th>
                      <th className="py-2 px-3 text-right">QC Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                    {filteredAvailableReels.map(reel => {
                      const isChecked = selectedReelNos.includes(reel.reelNo);
                      return (
                        <tr
                          key={reel.reelNo}
                          onClick={() => handleToggleReel(reel.reelNo)}
                          className={`cursor-pointer transition select-none ${
                            isChecked
                              ? 'bg-blue-50/70 dark:bg-blue-950/30 text-blue-950 dark:text-blue-100'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // handled by row click
                              className="h-3.5 w-3.5 rounded text-blue-600 cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold">{reel.reelNo}</td>
                          <td className="py-2.5 px-3 text-[11px] truncate max-w-[150px]">{reel.product}</td>
                          <td className="py-2.5 px-3">{reel.gsm}</td>
                          <td className="py-2.5 px-3">{reel.size} cm</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{reel.weight} kg</td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-500">{reel.dia}mm ({reel.joint} J)</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              reel.qcGrade === 'A'
                                ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                            }`}>
                              Grade {reel.qcGrade || 'A'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (

              /* GRID CARDS VIEW */
              <div className="space-y-2.5">
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 pr-1 ${showAllReels ? 'max-h-[550px] overflow-y-auto' : ''}`}>
                  {(showAllReels ? filteredAvailableReels : filteredAvailableReels.slice(0, 8)).map(reel => {
                    const isChecked = selectedReelNos.includes(reel.reelNo);
                    return (
                      <div
                        key={reel.reelNo}
                        onClick={() => handleToggleReel(reel.reelNo)}
                        className={`p-3 border rounded-2xl cursor-pointer transition select-none space-y-2 ${
                          isChecked
                            ? 'border-blue-600 bg-blue-50/30 dark:border-blue-500 dark:bg-blue-950/20 ring-1 ring-blue-500'
                            : 'border-slate-200/80 hover:bg-slate-50 dark:border-slate-700/80 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex justify-between items-center border-b pb-1.5 dark:border-slate-800 gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-mono font-bold text-slate-900 dark:text-white text-xs truncate">{reel.reelNo}</span>
                            {reel.product && (
                              <span
                                className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[9px] font-extrabold truncate max-w-[100px]"
                                title={reel.product}
                              >
                                {reel.product.replace(/ tissue/i, '')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                              (reel.qcGrade || 'A') === 'A' ? 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700' : 'bg-amber-100 dark:bg-amber-950/20 text-amber-700'
                            }`}>
                              Grade {reel.qcGrade || 'A'}
                            </span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // handled by div click
                              className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                          <div>
                            <span className="font-medium text-slate-400 block uppercase tracking-wider text-[8px]">GSM</span>
                            <span className="font-bold text-slate-800 dark:text-white">{reel.gsm}</span>
                          </div>
                          <div>
                            <span className="font-medium text-slate-400 block uppercase tracking-wider text-[8px]">Weight</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{reel.weight} kg</span>
                          </div>
                          <div>
                            <span className="font-medium text-slate-400 block uppercase tracking-wider text-[8px]">Size</span>
                            <span className="font-bold text-slate-800 dark:text-white">{reel.size} cm</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredAvailableReels.length > 8 && (
                  <button
                    type="button"
                    onClick={() => setShowAllReels(!showAllReels)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200/80 dark:border-slate-700 shadow-2xs mt-1"
                  >
                    {showAllReels ? (
                      <>
                        <ChevronUp className="h-3.5 w-3.5" />
                        <span>Show Less</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" />
                        <span>View All {filteredAvailableReels.length} Filtered Reels</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

          </div>

        </form>
      )}

      {/* 3. TAB: Packing Slips & Challans List */}
      {activeTab === 'slips_list' && (
        <div className="bg-white dark:bg-surface-dark border border-border-light dark:border-slate-700 rounded-lg p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-2 border-b pb-2 dark:border-slate-700">
            Registered Packing Slips
          </h3>

          {/* Search bar */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 flex items-center gap-2">
            <Search className="h-4.5 w-4.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={slipSearchQuery}
              onChange={e => setSlipSearchQuery(e.target.value)}
              placeholder="Search challans by number, customer, vehicle, or date..."
              className="bg-transparent border-none text-xs focus:outline-none w-full dark:text-white"
            />
          </div>

          {filteredSlips.length === 0 ? (
            <p className="text-xs text-text-light-secondary py-4 text-center">No packing slips match your search criteria.</p>
          ) : (
            <div className="space-y-4">
              {/* Desktop/Tablet Table */}
              <div className="hidden md:block">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700 text-text-light-secondary dark:text-slate-400">
                      <th className="py-2.5 font-bold uppercase">Challan Number</th>
                      <th className="py-2.5 font-bold uppercase">Date</th>
                      <th className="py-2.5 font-bold uppercase">Party / Customer</th>
                      <th className="py-2.5 font-bold uppercase">Vehicle</th>
                      <th className="py-2.5 font-bold uppercase">Reels Linked</th>
                      <th className="py-2.5 font-bold uppercase">Challan Status</th>
                      <th className="py-2.5 font-bold uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {filteredSlips
                      .slice()
                      .sort((a, b) => b.slipNo.localeCompare(a.slipNo))
                      .map(slip => {
                        const partyObj = parties.find(p => p.id === slip.partyId);
                        const vehicleObj = vehicles.find(v => v.id === slip.vehicleId);
                        return (
                          <tr key={slip.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                            <td className="py-2.5 font-bold font-mono text-slate-800 dark:text-white">{slip.slipNo}</td>
                            <td className="py-2.5 text-text-light-secondary dark:text-slate-400">{slip.date}</td>
                            <td className="py-2.5 font-semibold text-slate-800 dark:text-white">{partyObj?.name}</td>
                            <td className="py-2.5 font-bold font-mono text-primary dark:text-blue-400">{vehicleObj?.vehicleNo}</td>
                            <td className="py-2.5">{slip.reelNos.length} reels</td>
                            <td className="py-2.5">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                slip.status === 'DRAFT' ? 'bg-amber-100 dark:bg-amber-950/20 text-amber-700' : 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700'
                              }`}>
                                {slip.status}
                              </span>
                            </td>
                            <td className="py-2.5 text-right flex justify-end gap-1.5">
                              <button
                                onClick={() => setViewingSlip(slip)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold transition shadow-sm"
                              >
                                Details
                              </button>
                              
                              {slip.status === 'DRAFT' ? (
                                <button
                                  onClick={() => handleConfirmDispatch(slip.id)}
                                  className="px-2.5 py-1 bg-primary hover:bg-blue-800 text-white rounded text-[10px] font-bold shadow-sm transition"
                                >
                                  Confirm Dispatch
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleExportExcel(slip)}
                                    title="Export XLS"
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded border border-emerald-200 dark:border-emerald-900"
                                  >
                                    <FileSpreadsheet className="h-4.5 w-4.5" />
                                  </button>
                                  <button
                                    onClick={() => { setViewingSlip(slip); setTimeout(() => window.print(), 100); }}
                                    title="Print Challan PDF"
                                    className="p-1 text-primary hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-900"
                                  >
                                    <Printer className="h-4.5 w-4.5" />
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacked Cards */}
              <div className="block md:hidden space-y-3">
                {filteredSlips
                  .slice()
                  .sort((a, b) => b.slipNo.localeCompare(a.slipNo))
                  .map(slip => {
                    const partyObj = parties.find(p => p.id === slip.partyId);
                    const vehicleObj = vehicles.find(v => v.id === slip.vehicleId);
                    return (
                      <div key={slip.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs text-left">
                        <div className="flex justify-between items-center border-b pb-2 dark:border-slate-800">
                          <span className="font-bold text-slate-800 dark:text-white font-mono">{slip.slipNo}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            slip.status === 'DRAFT' ? 'bg-amber-100 dark:bg-amber-950/20 text-amber-700' : 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700'
                          }`}>
                            {slip.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-2 text-[11px] text-slate-600 dark:text-slate-400">
                          <div>
                            <span className="font-medium text-slate-400 block uppercase tracking-wider text-[9px]">Date</span>
                            <span className="font-medium text-slate-800 dark:text-white">{slip.date}</span>
                          </div>
                          <div>
                            <span className="font-medium text-slate-400 block uppercase tracking-wider text-[9px]">Customer Party</span>
                            <span className="font-semibold text-slate-800 dark:text-white">{partyObj?.name}</span>
                          </div>
                          <div>
                            <span className="font-medium text-slate-400 block uppercase tracking-wider text-[9px]">Vehicle No</span>
                            <span className="font-bold text-primary dark:text-blue-400 font-mono">{vehicleObj?.vehicleNo}</span>
                          </div>
                          <div>
                            <span className="font-medium text-slate-400 block uppercase tracking-wider text-[9px]">Reels Linked</span>
                            <span className="font-bold text-slate-800 dark:text-white">{slip.reelNos.length} reels</span>
                          </div>
                        </div>
                        <div className="pt-2 border-t dark:border-slate-800 flex justify-end gap-1.5">
                          <button
                            onClick={() => setViewingSlip(slip)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold transition shadow-sm"
                          >
                            Details
                          </button>
                          {slip.status === 'DRAFT' ? (
                            <button
                              onClick={() => handleConfirmDispatch(slip.id)}
                              className="px-2.5 py-1 bg-primary hover:bg-blue-800 text-white rounded text-[10px] font-bold shadow-sm transition"
                            >
                              Confirm Dispatch
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleExportExcel(slip)}
                                title="Export XLS"
                                className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded border border-emerald-200 dark:border-emerald-900"
                              >
                                <FileSpreadsheet className="h-4.5 w-4.5" />
                              </button>
                              <button
                                onClick={() => { setViewingSlip(slip); setTimeout(() => window.print(), 100); }}
                                title="Print Challan PDF"
                                className="p-1 text-primary hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-900"
                              >
                                <Printer className="h-4.5 w-4.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Challan View Detail Modal / Printable Receipt (Exact Client Reference Format) */}
      {viewingSlip && (() => {
        const partyObj = parties.find(p => p.id === viewingSlip.partyId);
        const vehicleObj = vehicles.find(v => v.id === viewingSlip.vehicleId || v.vehicleNo === viewingSlip.vehicleId);
        const vehicleDisplay = vehicleObj ? vehicleObj.vehicleNo : (viewingSlip.vehicleId || 'GJ01EP1234');
        const linkedReels = reels.filter(r => viewingSlip.reelNos.includes(r.reelNo));

        // Grouping for Product Summary table
        const productSummaryMap: { [key: string]: { product: string; gsm: number; size: number; ply: number; count: number; totalWeight: number } } = {};
        linkedReels.forEach(r => {
          const key = `${r.product || 'Tissue'}__${r.gsm}__${r.size}__${r.ply || 1}`;
          if (!productSummaryMap[key]) {
            productSummaryMap[key] = {
              product: r.product || 'Tissue Paper',
              gsm: r.gsm,
              size: r.size,
              ply: r.ply || 1,
              count: 0,
              totalWeight: 0,
            };
          }
          productSummaryMap[key].count += 1;
          productSummaryMap[key].totalWeight += (r.weight || 0);
        });

        const productSummaryList = Object.values(productSummaryMap);
        const grandTotalWeight = linkedReels.reduce((sum, r) => sum + (r.weight || 0), 0);

        return (
          <div
            id="printable-receipt-modal"
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:fixed print:inset-0 print:bg-white print:z-[999999] print:p-0 print:m-0 print:block print:w-full print:h-full"
          >
            <div className="bg-white text-slate-900 rounded-2xl max-w-3xl w-full p-4 sm:p-8 space-y-4 shadow-2xl my-auto print:shadow-none print:w-full print:max-w-none print:p-0 print:m-0 print:rounded-none">
              
              {/* Modal Top Actions (Hidden while printing) */}
              <div className="flex justify-between items-center border-b border-slate-200 pb-3 print:hidden">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Official Dispatch Receipt Preview
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintChallan}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print Receipt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingSlip(null)}
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* PRINTABLE RECEIPT CONTAINER (Matches Client Reference 100%) */}
              <div className="bg-white p-2 sm:p-4 text-black font-sans select-none print:p-0">
                
                {/* 1. Header Banner */}
                <div className="border-b-2 border-black pb-2 mb-3 text-left">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-black uppercase leading-tight">
                    SAHEB PAPER PVT. LTD.
                  </h1>
                  <p className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-[0.18em]">
                    FINISHED STOCK MANAGEMENT &bull; TISSUE PAPER MILL
                  </p>
                </div>

                {/* 2. Document Title & Badge */}
                <div className="text-center my-3 space-y-1">
                  <h2 className="text-base sm:text-lg font-black tracking-[0.25em] text-black uppercase">
                    DISPATCH RECEIPT
                  </h2>
                  <div>
                    <span className="inline-block bg-[#E65100] text-white text-[10px] font-black uppercase px-4 py-0.5 rounded shadow-2xs">
                      FINALIZED
                    </span>
                  </div>
                </div>

                {/* 3. Metadata Box */}
                <div className="border border-slate-300 rounded p-3 text-xs text-left grid grid-cols-2 gap-y-2.5 font-sans bg-white mb-4">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">RECEIPT NO</span>
                    <span className="font-bold font-mono text-black text-xs sm:text-sm">{viewingSlip.slipNo}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">DISPATCH DATE</span>
                    <span className="font-bold text-black text-xs sm:text-sm">{viewingSlip.date}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">PARTY NAME</span>
                    <span className="font-bold text-black text-xs sm:text-sm">{partyObj?.name || 'Gronew'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">BILL NO</span>
                    <span className="font-bold font-mono text-black text-xs sm:text-sm">GT/{viewingSlip.slipNo.slice(-2) || '45'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">VEHICLE NO</span>
                    <span className="font-bold font-mono text-black text-xs sm:text-sm uppercase">{vehicleDisplay}</span>
                  </div>
                </div>

                {/* 4. DISPATCHED REELS Table */}
                <div className="mb-4 text-left">
                  <h3 className="text-xs font-black text-black uppercase tracking-wider mb-1.5">
                    DISPATCHED REELS
                  </h3>
                  <div className="border border-slate-300 overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead className="bg-[#0B132B] text-white uppercase text-[10px] font-black tracking-wider">
                        <tr>
                          <th className="py-2 px-2.5 text-center w-10">SR</th>
                          <th className="py-2 px-3 font-mono">REEL NO</th>
                          <th className="py-2 px-3">PRODUCT</th>
                          <th className="py-2 px-3 text-center">GSM</th>
                          <th className="py-2 px-3 text-center">SIZE (CM)</th>
                          <th className="py-2 px-3 text-center">PLY</th>
                          <th className="py-2 px-3 text-right">WEIGHT (KG)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-900 font-medium">
                        {linkedReels.map((reel, idx) => (
                          <tr key={reel.reelNo} className="hover:bg-slate-50">
                            <td className="py-1.5 px-2.5 text-center font-bold text-slate-700">{idx + 1}</td>
                            <td className="py-1.5 px-3 font-mono font-bold">{reel.reelNo}</td>
                            <td className="py-1.5 px-3">{reel.product}</td>
                            <td className="py-1.5 px-3 text-center">{reel.gsm}</td>
                            <td className="py-1.5 px-3 text-center">{reel.size}</td>
                            <td className="py-1.5 px-3 text-center">{reel.ply || 1}</td>
                            <td className="py-1.5 px-3 text-right font-mono font-bold">{reel.weight}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5. PRODUCT SUMMARY Table */}
                <div className="mb-6 text-left">
                  <h3 className="text-xs font-black text-black uppercase tracking-wider mb-1.5">
                    PRODUCT SUMMARY
                  </h3>
                  <div className="border border-slate-300 overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead className="bg-[#0B132B] text-white uppercase text-[10px] font-black tracking-wider">
                        <tr>
                          <th className="py-2 px-3">PRODUCT</th>
                          <th className="py-2 px-3 text-center">GSM</th>
                          <th className="py-2 px-3 text-center">SIZE</th>
                          <th className="py-2 px-3 text-center">PLY</th>
                          <th className="py-2 px-3 text-center">REELS</th>
                          <th className="py-2 px-3 text-right">TOTAL WEIGHT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-900 font-medium">
                        {productSummaryList.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 font-bold">{item.product}</td>
                            <td className="py-1.5 px-3 text-center">{item.gsm}</td>
                            <td className="py-1.5 px-3 text-center">{item.size} CM</td>
                            <td className="py-1.5 px-3 text-center">{item.ply} Ply</td>
                            <td className="py-1.5 px-3 text-center font-bold">{item.count}</td>
                            <td className="py-1.5 px-3 text-right font-mono font-bold">{item.totalWeight} KG</td>
                          </tr>
                        ))}
                        {/* GRAND TOTAL Row (Matching Reference Peach/Amber Styling) */}
                        <tr className="bg-[#FEE4CB] font-black text-slate-950 border-t-2 border-slate-300 text-xs">
                          <td colSpan={5} className="py-2 px-3 uppercase tracking-wider font-black">
                            GRAND TOTAL
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-black text-sm">
                            {grandTotalWeight.toLocaleString()} KG
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 6. Signatures (3 Columns with Top Horizontal Line) */}
                <div className="grid grid-cols-3 gap-6 pt-6 mb-4 text-center font-sans">
                  <div className="border-t-2 border-black pt-2">
                    <span className="text-[10px] sm:text-xs font-black uppercase text-black tracking-wider block">
                      PREPARED BY
                    </span>
                  </div>
                  <div className="border-t-2 border-black pt-2">
                    <span className="text-[10px] sm:text-xs font-black uppercase text-black tracking-wider block">
                      DRIVER SIGNATURE
                    </span>
                  </div>
                  <div className="border-t-2 border-black pt-2">
                    <span className="text-[10px] sm:text-xs font-black uppercase text-black tracking-wider block">
                      RECEIVER SIGNATURE
                    </span>
                  </div>
                </div>

                {/* 7. Footer Caption */}
                <div className="text-center text-[10px] font-semibold text-slate-500 pt-2 border-t border-slate-200">
                  Generated on {viewingSlip.date || new Date().toLocaleDateString('en-GB')} &bull; Saheb Paper Pvt. Ltd.
                </div>

              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
export default DispatchView;
