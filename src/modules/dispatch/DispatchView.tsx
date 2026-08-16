import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
import { DataFilterBar } from '../../components/DataFilterBar';
import { CustomSearchableSelect } from '../../components/CustomSearchableSelect';
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
  Eye,
  Building2,
  Check,
} from 'lucide-react';

import { WorkflowStepBadge, WORKFLOW_STEPS } from '../../components/WorkflowStepBadge';

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
    setReels(getReels());
  }, [initialTab]);

  useEffect(() => {
    setReels(getReels());
  }, [activeTab]);

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
  const [reelPlyFilter, setReelPlyFilter] = useState<'ALL' | number>('ALL');
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

  // Packing Slip List Filter States
  const [slipStatusFilter, setSlipStatusFilter] = useState<'ALL' | 'DRAFT' | 'CONFIRMED'>('ALL');
  const [slipPartyFilter, setSlipPartyFilter] = useState<'ALL' | string>('ALL');

  const filteredSlips = useMemo(() => {
    const q = slipSearchQuery.toLowerCase().trim();
    return slips.filter(slip => {
      if (slipStatusFilter !== 'ALL' && slip.status !== slipStatusFilter) return false;
      if (slipPartyFilter !== 'ALL' && slip.partyId !== slipPartyFilter) return false;
      if (q) {
        const partyObj = parties.find(p => p.id === slip.partyId);
        const vehicleObj = vehicles.find(v => v.id === slip.vehicleId);
        const matchNo = slip.slipNo.toLowerCase().includes(q);
        const matchDate = slip.date.toLowerCase().includes(q);
        const matchParty = partyObj && partyObj.name.toLowerCase().includes(q);
        const matchVehicle = vehicleObj && (vehicleObj.vehicleNo.toLowerCase().includes(q) || (slip.vehicleId || '').toLowerCase().includes(q));
        if (!matchNo && !matchDate && !matchParty && !matchVehicle) return false;
      }
      return true;
    });
  }, [slips, slipSearchQuery, slipStatusFilter, slipPartyFilter, parties, vehicles]);

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
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [receiverSig, setReceiverSig] = useState('');

  // Custom Party Selection Dropdown States
  const [isPartyDropdownOpen, setIsPartyDropdownOpen] = useState(false);
  const [partySearchQuery, setPartySearchQuery] = useState('');
  const partyDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (partyDropdownRef.current && !partyDropdownRef.current.contains(event.target as Node)) {
        setIsPartyDropdownOpen(false);
      }
    };
    if (isPartyDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPartyDropdownOpen]);

  const filteredPartyOptions = useMemo(() => {
    const q = partySearchQuery.toLowerCase().trim();
    if (!q) return parties;
    return parties.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.contact && p.contact.toLowerCase().includes(q)) ||
      (p.address && p.address.toLowerCase().includes(q))
    );
  }, [parties, partySearchQuery]);

  const selectedParty = useMemo(() => {
    return parties.find(p => p.id === slipPartyId);
  }, [parties, slipPartyId]);

  // 3. Active Challan Detail Modal (for PDF/Excel print review)
  const [viewingSlip, setViewingSlip] = useState<PackingSlip | null>(null);
  const [receiptPage, setReceiptPage] = useState(1);
  const [receiptGroupMode, setReceiptGroupMode] = useState<'grouped' | 'sequential'>('grouped');
  const [receiptViewMode, setReceiptViewMode] = useState<'paged' | 'continuous'>('paged');

  // Auto-generate slip number
  const autoSlipNo = useMemo(() => {
    const cleanDate = slipDate.replace(/-/g, '');
    const index = slips.length + 1;
    const padIndex = String(index).padStart(4, '0');
    return `CHALLAN-${cleanDate}-${padIndex}`;
  }, [slipDate, slips]);

  // Filter available reels in stock for Packing Slip selection (all non-dispatched reels)
  const availableReels = useMemo(() => {
    return reels.filter(r => r.status !== 'DELIVERED');
  }, [reels]);

  // Unique Products present in available reels for quick filter pills
  const uniqueProducts = useMemo(() => {
    const set = new Set<string>();
    availableReels.forEach(r => {
      if (r.product) set.add(r.product);
    });
    return Array.from(set).sort();
  }, [availableReels]);

  // Unique GSMs present in available reels (cascaded by selected product)
  const uniqueGsms = useMemo(() => {
    const set = new Set<number>();
    availableReels.forEach(r => {
      if (reelProductFilter === 'ALL' || r.product === reelProductFilter) {
        if (r.gsm) set.add(r.gsm);
      }
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [availableReels, reelProductFilter]);

  // Unique Sizes present in available reels (cascaded by selected product & gsm)
  const uniqueSizes = useMemo(() => {
    const set = new Set<number>();
    availableReels.forEach(r => {
      if (
        (reelProductFilter === 'ALL' || r.product === reelProductFilter) &&
        (reelGsmFilter === 'ALL' || r.gsm === reelGsmFilter)
      ) {
        if (r.size) set.add(r.size);
      }
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [availableReels, reelProductFilter, reelGsmFilter]);

  // Unique Plys present in available reels (cascaded by selected product, gsm & size)
  const uniquePlys = useMemo(() => {
    const set = new Set<number>();
    availableReels.forEach(r => {
      if (
        (reelProductFilter === 'ALL' || r.product === reelProductFilter) &&
        (reelGsmFilter === 'ALL' || r.gsm === reelGsmFilter) &&
        (reelSizeFilter === 'ALL' || r.size === reelSizeFilter)
      ) {
        if (r.ply) set.add(r.ply);
      }
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [availableReels, reelProductFilter, reelGsmFilter, reelSizeFilter]);

  // Handlers for reel product filter change with auto reset of child options
  const handleReelProductChange = (prod: string) => {
    setReelProductFilter(prod);
    setReelGsmFilter('ALL');
    setReelSizeFilter('ALL');
    setReelPlyFilter('ALL');
  };

  // Real-time filtered available reels
  const filteredAvailableReels = useMemo(() => {
    return availableReels.filter(r => {
      if (reelProductFilter !== 'ALL') {
        const target = reelProductFilter.toLowerCase().trim();
        const currentProd = (r.product || '').toLowerCase().trim();
        if (currentProd !== target && !currentProd.includes(target) && !target.includes(currentProd)) {
          return false;
        }
      }
      if (reelGsmFilter !== 'ALL' && r.gsm !== reelGsmFilter) return false;
      if (reelSizeFilter !== 'ALL' && r.size !== reelSizeFilter) return false;
      if (reelPlyFilter !== 'ALL' && r.ply !== reelPlyFilter) return false;
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
  }, [availableReels, reelProductFilter, reelGsmFilter, reelSizeFilter, reelPlyFilter, reelGradeFilter, reelSearchQuery]);

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
    if (driverMobile.trim()) {
      if (driverMobile.length !== 10 || !/^[6-9]\d{9}$/.test(driverMobile)) {
        setErrorMsg('Please enter a valid 10-digit Indian Mobile Number starting with 6, 7, 8, or 9 (e.g. 9876543210).');
        return;
      }
    }

    const driverFormatted = driverName.trim()
      ? (driverMobile.trim() ? `${driverName.trim()} (+91 ${driverMobile.trim()})` : driverName.trim())
      : (driverMobile.trim() ? `Driver (+91 ${driverMobile.trim()})` : 'Driver On Duty');

    const newSlip: PackingSlip = {
      id: `slip-${Date.now()}`,
      slipNo: targetSlipNo,
      date: slipDate,
      partyId: slipPartyId,
      vehicleId: slipVehicleId.trim(),
      reelNos: [...selectedReelNos],
      driverSignature: driverFormatted,
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
    setDriverName('');
    setDriverMobile('');
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
    document.body.classList.add('printing-challan');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-challan');
    }, 1500);
  };

  return (
    <div className="space-y-3 sm:space-y-6">
      
      {/* Title / Hero Banner */}
      {!hideHeader && (
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-slate-900 rounded-2xl p-4 sm:p-4.5 px-5 sm:px-6 text-white shadow-lg relative z-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-md shrink-0">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight font-heading">
                    {initialTab === 'orders' ? 'Order Bookings' : 'Dispatch Receipt'}
                  </h2>
                  <WorkflowStepBadge
                    stepInfo={
                      initialTab === 'orders'
                        ? WORKFLOW_STEPS.orderBooking
                        : WORKFLOW_STEPS.dispatchReceipt
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Accessible Segmented Tab Bar */}
      {!hideTabs && (
        <div className="bg-white dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm w-full max-w-xl">
          <div className="grid grid-cols-2 gap-1.5">
            {initialTab === 'orders' ? (
              <button
                type="button"
                onClick={() => { setActiveTab('orders'); setSuccessMsg(''); setErrorMsg(''); }}
                className="col-span-2 w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md"
              >
                <FileText className="h-4.5 w-4.5" />
                <span>Customer Order Bookings</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { setActiveTab('create_slip'); setSuccessMsg(''); setErrorMsg(''); }}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition-all duration-200 cursor-pointer ${
                    activeTab === 'create_slip'
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-600/25 scale-[1.01]'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  <span className="truncate">Draft Packing Slip</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('slips_list'); setSuccessMsg(''); setErrorMsg(''); }}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition-all duration-200 cursor-pointer ${
                    activeTab === 'slips_list'
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-600/25 scale-[1.01]'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Truck className="h-4 w-4 shrink-0" />
                  <span className="truncate">Packing Slips &amp; Challans</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-black shrink-0 ${
                    activeTab === 'slips_list' 
                      ? 'bg-white/20 text-white border border-white/30' 
                      : 'bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60'
                  }`}>
                    {slips.length}
                  </span>
                </button>
              </>
            )}
          </div>
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
                <CustomSearchableSelect
                  label="SELECT CUSTOMER PARTY"
                  placeholder="-- Choose Customer Party --"
                  value={selectedPartyId}
                  onChange={setSelectedPartyId}
                  options={parties.map(p => ({
                    value: p.id,
                    label: p.name,
                    sublabel: p.contact ? `Contact: ${p.contact}` : p.address,
                  }))}
                  required
                />
              </div>

              <div>
                <CustomSearchableSelect
                  label="SELECT PRODUCT SPECS"
                  placeholder="-- Choose Product Specs --"
                  value={selectedProductId}
                  onChange={setSelectedProductId}
                  options={products.map(p => ({
                    value: p.id,
                    label: p.name,
                  }))}
                  required
                />
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
                    allowFuture={true}
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
          className="flex flex-col gap-5 w-full items-stretch"
        >
          
          {/* Top Challan Header & Dispatch Form (Full-Width Card) */}
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 text-left w-full">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Create Gate Pass Challan
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Fill dispatch details above and select warehouse reels below
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 text-xs font-black uppercase tracking-wider border border-blue-200 dark:border-blue-800 font-mono">
                DRAFT #{autoSlipNo.slice(-4) || '84'}
              </span>
            </div>

            {/* Form Fields in 5-Column Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {/* Custom Modern Searchable Party Dropdown */}
              <div className="relative" ref={partyDropdownRef}>
                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Customer / Party Name</span>
                  {selectedParty && (
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                      Selected
                    </span>
                  )}
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setIsPartyDropdownOpen(prev => !prev);
                    setPartySearchQuery('');
                  }}
                  className={`w-full flex items-center justify-between py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border rounded-2xl text-xs font-bold transition cursor-pointer text-left ${
                    isPartyDropdownOpen
                      ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white dark:bg-slate-800'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Building2 className={`h-4 w-4 shrink-0 ${selectedParty ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                    <span className={`truncate ${selectedParty ? 'text-slate-900 dark:text-white font-extrabold' : 'text-slate-400 font-normal'}`}>
                      {selectedParty ? selectedParty.name : '-- Select Customer Party --'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-1.5">
                    {selectedParty && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setSlipPartyId('');
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 cursor-pointer rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Clear party"
                      >
                        <X className="h-3 w-3" />
                      </span>
                    )}
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isPartyDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
                  </div>
                </button>

                {/* Dropdown Popup Menu */}
                {isPartyDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 min-w-[240px]">
                    {/* Search inside Dropdown */}
                    <div className="p-2 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-900/60">
                      <div className="relative">
                        <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={partySearchQuery}
                          onChange={e => setPartySearchQuery(e.target.value)}
                          placeholder="Search customer party..."
                          className="w-full py-1.5 pl-8 pr-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none dark:text-white"
                          autoFocus
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    {/* Party Options List */}
                    <div className="max-h-56 overflow-y-auto p-1.5 space-y-1">
                      {filteredPartyOptions.length === 0 ? (
                        <div className="py-4 text-center text-xs text-slate-400 font-semibold">
                          No matching customer party found
                        </div>
                      ) : (
                        filteredPartyOptions.map(p => {
                          const isSelected = slipPartyId === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSlipPartyId(p.id);
                                setIsPartyDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <div className="truncate text-slate-900 dark:text-white font-extrabold">{p.name}</div>
                                {(p.contact || p.address) && (
                                  <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                                    {p.contact} {p.address ? `• ${p.address}` : ''}
                                  </div>
                                )}
                              </div>
                              {isSelected && (
                                <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

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
                      if (vObj) {
                        if (vObj.driverName && !driverName) {
                          setDriverName(vObj.driverName);
                        }
                        if (vObj.driverContact && !driverMobile) {
                          const cleanMob = vObj.driverContact.replace(/\D/g, '').slice(0, 10);
                          setDriverMobile(cleanMob);
                        }
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
                  Driver Name
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={e => setDriverName(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none dark:text-white"
                  placeholder="e.g. Ramesh Patel"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Driver Mobile</span>
                  <span className={`text-[10px] font-mono font-bold ${
                    driverMobile.length === 10
                      ? (/^[6-9]/.test(driverMobile) ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')
                      : driverMobile.length > 0 ? 'text-amber-500' : 'text-slate-400'
                  }`}>
                    {driverMobile.length}/10
                  </span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-black text-slate-400 select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[6-9][0-9]{9}"
                    maxLength={10}
                    value={driverMobile}
                    onChange={e => {
                      const cleanDigits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setDriverMobile(cleanDigits);
                    }}
                    className={`w-full py-2.5 pl-10 pr-2.5 bg-slate-50 dark:bg-slate-900 border rounded-2xl text-xs font-bold font-mono focus:outline-none dark:text-white ${
                      driverMobile.length === 10
                        ? (/^[6-9]/.test(driverMobile) ? 'border-emerald-500 ring-1 ring-emerald-500/30' : 'border-red-500 ring-1 ring-red-500/30')
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                  Dispatch Date
                </label>
                <button
                  type="button"
                  onClick={() => setOpenSlipDatePicker(prev => !prev)}
                  className="w-full flex items-center justify-between py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <span className={slipDate ? 'font-mono' : 'text-slate-400 font-normal'}>{slipDate || 'dd-mm-yyyy'}</span>
                  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </button>
                {openSlipDatePicker && (
                  <CustomDatePickerModal
                    selectedDate={slipDate}
                    onSelectDate={(newDate) => {
                      setSlipDate(newDate);
                      setOpenSlipDatePicker(false);
                    }}
                    onClose={() => setOpenSlipDatePicker(false)}
                    allowFuture={true}
                  />
                )}
              </div>
            </div>

            {/* Bottom summary bar with Weight Tally + Dispatch Action Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl flex items-center gap-3">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    Total Loaded:
                  </span>
                  <span className="text-sm font-black font-mono text-primary dark:text-blue-400">
                    {selectedReelNos.length} Reels
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {reels.filter(r => selectedReelNos.includes(r.reelNo)).reduce((sum, r) => sum + (r.weight || 0), 0).toLocaleString()} <span className="text-xs text-slate-400 font-normal">KG</span>
                  </span>
                </div>

                <div className="text-xs text-slate-500 font-semibold">
                  {receiverSig ? (
                    <span className="text-slate-600 dark:text-slate-300">Receiver: {receiverSig}</span>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {onOpenScanner && (
                  <button
                    type="button"
                    onClick={onOpenScanner}
                    className="px-4 py-3 rounded-2xl text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 cursor-pointer transition flex items-center gap-1.5"
                  >
                    <span>+ QR Camera Scan</span>
                  </button>
                )}

                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold py-3 px-6 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Truck className="h-4 w-4" />
                  <span>Print Gate Pass &amp; Dispatch</span>
                </button>
              </div>
            </div>
          </div>

          {/* Reel Selection Ledger (Full Width Card) - FAST BATCH & MULTI-SELECTION ENGINE */}
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 text-left w-full">
            
            {/* 1. Header with Tally, Search Bar & View Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3.5">
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
                  onClick={() => handleReelProductChange('ALL')}
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
                      onClick={() => handleReelProductChange(prod)}
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
                  const count = availableReels.filter(r => (reelProductFilter === 'ALL' || r.product === reelProductFilter) && r.gsm === gsm).length;
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
                  const count = availableReels.filter(r =>
                    (reelProductFilter === 'ALL' || r.product === reelProductFilter) &&
                    (reelGsmFilter === 'ALL' || r.gsm === reelGsmFilter) &&
                    r.size === sz
                  ).length;
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

              {/* Row E: Ply Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">
                  Ply:
                </span>

                <button
                  type="button"
                  onClick={() => setReelPlyFilter('ALL')}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold cursor-pointer transition ${
                    reelPlyFilter === 'ALL'
                      ? 'bg-amber-900 dark:bg-amber-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  All Ply
                </button>

                {uniquePlys.map(pVal => {
                  const count = availableReels.filter(r =>
                    (reelProductFilter === 'ALL' || r.product === reelProductFilter) &&
                    (reelGsmFilter === 'ALL' || r.gsm === reelGsmFilter) &&
                    (reelSizeFilter === 'ALL' || r.size === reelSizeFilter) &&
                    r.ply === pVal
                  ).length;
                  return (
                    <button
                      key={pVal}
                      type="button"
                      onClick={() => setReelPlyFilter(pVal)}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold cursor-pointer transition ${
                        reelPlyFilter === pVal
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {pVal} Ply ({count})
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
                      <th className="py-2 px-3">Joints</th>
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
                          <td className="py-2.5 px-3 text-[11px] text-slate-500">{reel.joint} Joints</td>
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
              <div className="space-y-3">
                <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 pr-1 ${showAllReels ? 'max-h-[600px] overflow-y-auto' : ''}`}>
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

      {/* 3. TAB: Packing Slips & Challans List (Modern Filterable Ledger) */}
      {activeTab === 'slips_list' && (
        <div className="space-y-4 text-left">
          
          {/* Top KPI Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Challans</span>
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono">{slips.length}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Recorded Gate Passes</span>
            </div>

            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Dispatched Slips</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {slips.filter(s => s.status !== 'DRAFT').length}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Finalized &amp; Decremented</span>
            </div>

            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">Pending Drafts</span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {slips.filter(s => s.status === 'DRAFT').length}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Awaiting Confirmation</span>
            </div>

            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block">Total Linked Reels</span>
              <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {slips.reduce((sum, s) => sum + s.reelNos.length, 0)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Dispatched Reel Units</span>
            </div>
          </div>

          {/* Filter Toolbar Container */}
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
            
            {/* Header Title + Fast Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Registered Delivery Challans
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold">
                  Showing {filteredSlips.length} of {slips.length} total slips
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={slipSearchQuery}
                  onChange={e => setSlipSearchQuery(e.target.value)}
                  placeholder="Search Challan No, Customer, Vehicle, Date..."
                  className="w-full py-2 pl-9 pr-7 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none dark:text-white"
                />
                {slipSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSlipSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Filter Row: Status Chips & Customer Dropdown */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
              
              {/* Status Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">
                  Status:
                </span>
                
                <button
                  type="button"
                  onClick={() => setSlipStatusFilter('ALL')}
                  className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition ${
                    slipStatusFilter === 'ALL'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  All ({slips.length})
                </button>

                <button
                  type="button"
                  onClick={() => setSlipStatusFilter('CONFIRMED')}
                  className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${
                    slipStatusFilter === 'CONFIRMED'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  <span>Dispatched ({slips.filter(s => s.status !== 'DRAFT').length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSlipStatusFilter('DRAFT')}
                  className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${
                    slipStatusFilter === 'DRAFT'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                  <span>Drafts ({slips.filter(s => s.status === 'DRAFT').length})</span>
                </button>
              </div>

              {/* Customer / Party Dropdown Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Party:</span>
                <select
                  value={slipPartyFilter}
                  onChange={e => setSlipPartyFilter(e.target.value)}
                  className="py-1 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Parties ({parties.length})</option>
                  {parties.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                {(slipStatusFilter !== 'ALL' || slipPartyFilter !== 'ALL' || slipSearchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSlipStatusFilter('ALL');
                      setSlipPartyFilter('ALL');
                      setSlipSearchQuery('');
                    }}
                    className="px-2.5 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

            </div>

            {/* Table / Empty state */}
            {filteredSlips.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <FileText className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-500">No packing slips match your current filter.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSlipStatusFilter('ALL');
                    setSlipPartyFilter('ALL');
                    setSlipSearchQuery('');
                  }}
                  className="px-3 py-1 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div>
                {/* Desktop/Tablet High Density Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-slate-900/30">
                        <th className="py-3 px-3">Challan Number</th>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3">Party / Customer</th>
                        <th className="py-3 px-3">Vehicle No</th>
                        <th className="py-3 px-3">Linked Reels</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {filteredSlips
                        .slice()
                        .sort((a, b) => b.slipNo.localeCompare(a.slipNo))
                        .map(slip => {
                          const partyObj = parties.find(p => p.id === slip.partyId);
                          const vehicleObj = vehicles.find(v => v.id === slip.vehicleId || v.vehicleNo === slip.vehicleId);
                          const vehicleDisplay = vehicleObj ? vehicleObj.vehicleNo : (slip.vehicleId || 'N/A');
                          
                          // Calculate Total Weight for slip
                          const linkedReels = reels.filter(r => slip.reelNos.includes(r.reelNo));
                          const totalWeightKg = linkedReels.reduce((sum, r) => sum + (r.weight || 0), 0);

                          return (
                            <tr key={slip.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                              <td className="py-3 px-3">
                                <button
                                  type="button"
                                  onClick={() => setViewingSlip(slip)}
                                  className="font-mono font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline cursor-pointer flex items-center gap-1.5"
                                >
                                  <FileText className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                  <span>{slip.slipNo}</span>
                                </button>
                              </td>
                              <td className="py-3 px-3 font-semibold text-slate-600 dark:text-slate-400">{slip.date}</td>
                              <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                                {partyObj?.name || 'Walk-in Customer'}
                              </td>
                              <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-mono">
                                  {vehicleDisplay}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {slip.reelNos.length} reels
                                </span>
                                {totalWeightKg > 0 && (
                                  <span className="text-[10px] text-slate-400 font-mono ml-1.5">
                                    ({totalWeightKg.toLocaleString()} kg)
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  slip.status === 'DRAFT'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${slip.status === 'DRAFT' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                                  <span>{slip.status === 'DRAFT' ? 'Draft Gate Pass' : 'Dispatched'}</span>
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setViewingSlip(slip)}
                                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 dark:text-blue-300 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1"
                                  >
                                    <Eye className="h-3 w-3" />
                                    <span>Receipt</span>
                                  </button>
                                  
                                  {slip.status === 'DRAFT' ? (
                                    <button
                                      onClick={() => handleConfirmDispatch(slip.id)}
                                      className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-[10px] font-black shadow-xs transition cursor-pointer"
                                    >
                                      Confirm
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleExportExcel(slip)}
                                        title="Export Excel (.xlsx)"
                                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-900/80 cursor-pointer transition"
                                      >
                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setViewingSlip(slip);
                                          setTimeout(() => window.print(), 100);
                                        }}
                                        title="Print Receipt (1-Page)"
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900/80 cursor-pointer transition"
                                      >
                                        <Printer className="h-3.5 w-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Responsive Cards */}
                <div className="block md:hidden space-y-2.5">
                  {filteredSlips
                    .slice()
                    .sort((a, b) => b.slipNo.localeCompare(a.slipNo))
                    .map(slip => {
                      const partyObj = parties.find(p => p.id === slip.partyId);
                      const vehicleObj = vehicles.find(v => v.id === slip.vehicleId || v.vehicleNo === slip.vehicleId);
                      const vehicleDisplay = vehicleObj ? vehicleObj.vehicleNo : (slip.vehicleId || 'N/A');
                      const linkedReels = reels.filter(r => slip.reelNos.includes(r.reelNo));
                      const totalWeightKg = linkedReels.reduce((sum, r) => sum + (r.weight || 0), 0);

                      return (
                        <div
                          key={slip.id}
                          className="p-3.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5 text-xs text-left shadow-2xs"
                        >
                          <div className="flex justify-between items-center border-b pb-2 dark:border-slate-800">
                            <span className="font-bold text-blue-600 dark:text-blue-400 font-mono text-xs">
                              {slip.slipNo}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              slip.status === 'DRAFT'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${slip.status === 'DRAFT' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                              <span>{slip.status}</span>
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-y-2 text-[11px]">
                            <div>
                              <span className="font-bold text-slate-400 block uppercase text-[8px]">Date</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{slip.date}</span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-400 block uppercase text-[8px]">Customer Party</span>
                              <span className="font-bold text-slate-900 dark:text-white truncate block">{partyObj?.name || 'Walk-in'}</span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-400 block uppercase text-[8px]">Vehicle No</span>
                              <span className="font-bold text-primary dark:text-blue-400 font-mono">{vehicleDisplay}</span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-400 block uppercase text-[8px]">Reels &amp; Weight</span>
                              <span className="font-bold text-slate-800 dark:text-white">{slip.reelNos.length} reels ({totalWeightKg} kg)</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t dark:border-slate-800 flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewingSlip(slip)}
                              className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 rounded-xl text-[10px] font-black"
                            >
                              View Receipt
                            </button>
                            {slip.status === 'DRAFT' ? (
                              <button
                                onClick={() => handleConfirmDispatch(slip.id)}
                                className="px-3 py-1.5 bg-primary text-white rounded-xl text-[10px] font-black"
                              >
                                Confirm
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleExportExcel(slip)}
                                  className="p-1.5 text-emerald-600 rounded-lg border border-emerald-200 dark:border-emerald-800"
                                >
                                  <FileSpreadsheet className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setViewingSlip(slip);
                                    setTimeout(() => window.print(), 100);
                                  }}
                                  className="p-1.5 text-blue-600 rounded-lg border border-blue-200 dark:border-blue-800"
                                >
                                  <Printer className="h-3.5 w-3.5" />
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

        </div>
      )}

      {/* Challan View Detail Modal / Printable Receipt (Multi-Page & Spec Grouped) */}
      {viewingSlip && (() => {
        const partyObj = parties.find(p => p.id === viewingSlip.partyId);
        const vehicleObj = vehicles.find(v => v.id === viewingSlip.vehicleId || v.vehicleNo === viewingSlip.vehicleId);
        const vehicleDisplay = vehicleObj ? vehicleObj.vehicleNo : (viewingSlip.vehicleId || 'GJ01EP1234');
        const linkedReels = reels.filter(r => viewingSlip.reelNos.includes(r.reelNo));

        // Grouping for Product Summary table & Spec-wise Grouping
        const specMap: { [key: string]: {
          key: string;
          product: string;
          gsm: number;
          size: number;
          ply: number;
          reels: Reel[];
          totalWeight: number;
        } } = {};

        linkedReels.forEach(r => {
          const key = `${r.product || 'Tissue Paper'}__${r.gsm}__${r.size}__${r.ply || 1}`;
          if (!specMap[key]) {
            specMap[key] = {
              key,
              product: r.product || 'Tissue Paper',
              gsm: r.gsm,
              size: r.size,
              ply: r.ply || 1,
              reels: [],
              totalWeight: 0,
            };
          }
          specMap[key].reels.push(r);
          specMap[key].totalWeight += (r.weight || 0);
        });

        const specGroupsList = Object.values(specMap);
        const grandTotalWeight = linkedReels.reduce((sum, r) => sum + (r.weight || 0), 0);

        // Build flattened items list based on group mode
        type PrintableReelItem = Reel & {
          displayIndex: number;
          isGroupStart: boolean;
          groupLabel: string;
          groupTotalReels: number;
          groupTotalWeight: number;
        };

        const sortedReelItems: PrintableReelItem[] = [];
        let runningSr = 0;

        if (receiptGroupMode === 'grouped') {
          specGroupsList.forEach(group => {
            group.reels.forEach((reel, idxInGroup) => {
              runningSr += 1;
              sortedReelItems.push({
                ...reel,
                displayIndex: runningSr,
                isGroupStart: idxInGroup === 0,
                groupLabel: `${group.product} • ${group.gsm} GSM • ${group.size} CM • ${group.ply} PLY`,
                groupTotalReels: group.reels.length,
                groupTotalWeight: group.totalWeight,
              });
            });
          });
        } else {
          linkedReels.forEach((reel, idx) => {
            sortedReelItems.push({
              ...reel,
              displayIndex: idx + 1,
              isGroupStart: false,
              groupLabel: '',
              groupTotalReels: 0,
              groupTotalWeight: 0,
            });
          });
        }

        // 20 reels per page for clean A4 printing without overflow
        const REELS_PER_PAGE = 20;
        const totalPages = Math.max(1, Math.ceil(sortedReelItems.length / REELS_PER_PAGE));

        const pages: PrintableReelItem[][] = [];
        for (let p = 0; p < totalPages; p++) {
          pages.push(sortedReelItems.slice(p * REELS_PER_PAGE, (p + 1) * REELS_PER_PAGE));
        }

        // Active page for on-screen paged view
        const currentActivePage = Math.min(Math.max(1, receiptPage), totalPages);

        return createPortal(
          <div
            id="printable-receipt-modal"
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:static print:block print:w-full print:h-auto print:overflow-visible print:bg-white print:p-0 print:m-0 print:z-auto"
          >
            <div className="bg-white text-slate-900 rounded-3xl max-w-4xl w-full p-4 sm:p-6 space-y-4 shadow-2xl my-auto relative print:shadow-none print:w-full print:max-w-none print:p-0 print:m-0 print:rounded-none print:space-y-0 print:block print:overflow-visible">
              
              {/* Floating Top-Right Close Button */}
              <button
                type="button"
                onClick={() => setViewingSlip(null)}
                className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition cursor-pointer z-30 print:hidden shadow-xs"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Modal Top Toolbar (Hidden while printing) */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-200 pb-3 pr-10 print:hidden">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      Official Dispatch Receipt Preview
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold">
                      {linkedReels.length} Reels &bull; {grandTotalWeight.toLocaleString()} KG &bull; {totalPages} {totalPages === 1 ? 'Page' : 'Pages (A4 Multi-Page)'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Spec Group Toggle */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl text-[11px] font-extrabold">
                    <button
                      type="button"
                      onClick={() => setReceiptGroupMode('grouped')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        receiptGroupMode === 'grouped'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      🏷️ Group by Spec
                    </button>
                    <button
                      type="button"
                      onClick={() => setReceiptGroupMode('sequential')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        receiptGroupMode === 'sequential'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      🔢 List 1..N
                    </button>
                  </div>

                  {/* Multi-page Navigation for Screen Preview */}
                  {totalPages > 1 && (
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold gap-1">
                      <button
                        type="button"
                        disabled={currentActivePage <= 1}
                        onClick={() => setReceiptPage(p => Math.max(1, p - 1))}
                        className="px-2 py-1 bg-white disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-xs hover:bg-slate-50 cursor-pointer"
                      >
                        ◀
                      </button>
                      <span className="px-2 font-mono text-[11px] font-black text-slate-700">
                        Page {currentActivePage} / {totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={currentActivePage >= totalPages}
                        onClick={() => setReceiptPage(p => Math.min(totalPages, p + 1))}
                        className="px-2 py-1 bg-white disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-xs hover:bg-slate-50 cursor-pointer"
                      >
                        ▶
                      </button>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={handlePrintChallan}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print All Pages ({totalPages})</span>
                  </button>
                </div>
              </div>

              {/* PRINTABLE RECEIPT CONTAINER (Multi-Page A4 Sheet Stack) */}
              <div className="bg-slate-100/60 p-2 sm:p-4 rounded-2xl space-y-6 print:bg-white print:p-0 print:m-0 print:space-y-0 print:block print:overflow-visible">
                {pages.map((pageReels, pageIndex) => {
                  const pageNumber = pageIndex + 1;
                  const isLastPage = pageNumber === totalPages;

                  // In interactive screen preview, if paged mode is active, show only active page (while print still renders all)
                  const isHiddenOnScreen = receiptViewMode === 'paged' && pageNumber !== currentActivePage;

                  return (
                    <div
                      key={pageIndex}
                      className={`bg-white p-5 sm:p-7 text-black font-sans shadow-md border border-slate-200 rounded-xl print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none print-page-break ${
                        isHiddenOnScreen ? 'hidden print:block' : 'block'
                      }`}
                      style={{
                        pageBreakAfter: pageIndex < totalPages - 1 ? 'always' : 'auto',
                        breakAfter: pageIndex < totalPages - 1 ? 'page' : 'auto',
                        pageBreakInside: 'avoid',
                        breakInside: 'avoid',
                      }}
                    >
                      {/* 1. Header Banner & Metadata (Full on Page 1, Compact Continuation on Page 2+) */}
                      {pageIndex === 0 ? (
                        <>
                          <div className="border-b-2 border-black pb-2 mb-3 text-left flex justify-between items-start">
                            <div>
                              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-black uppercase leading-tight">
                                SAHEB PAPER PVT. LTD.
                              </h1>
                              <p className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-[0.18em]">
                                FINISHED STOCK MANAGEMENT &bull; TISSUE PAPER MILL
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-mono font-black text-slate-600 uppercase border border-slate-300 px-2 py-0.5 rounded bg-slate-50">
                                Page {pageNumber} of {totalPages}
                              </span>
                            </div>
                          </div>

                          {/* 2. Document Title & Badge */}
                          <div className="text-center my-2 space-y-1">
                            <h2 className="text-base sm:text-lg font-black tracking-[0.25em] text-black uppercase">
                              DISPATCH RECEIPT
                            </h2>
                            <div>
                              <span className="inline-block bg-[#E65100] text-white text-[10px] font-black uppercase px-4 py-0.5 rounded shadow-2xs">
                                FINALIZED
                              </span>
                            </div>
                          </div>

                          {/* 3. Metadata Box with Party & Driver Mobile Numbers */}
                          <div className="border border-slate-300 rounded p-3 text-xs text-left grid grid-cols-2 sm:grid-cols-3 gap-y-2.5 gap-x-3 font-sans bg-white mb-3.5">
                            <div>
                              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">RECEIPT NO</span>
                              <span className="font-bold font-mono text-black text-xs sm:text-sm">{viewingSlip.slipNo}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">DISPATCH DATE</span>
                              <span className="font-bold text-black text-xs sm:text-sm">{viewingSlip.date}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">BILL NO</span>
                              <span className="font-bold font-mono text-black text-xs sm:text-sm">GT/{viewingSlip.slipNo.slice(-2) || '45'}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">CUSTOMER / PARTY</span>
                              <span className="font-bold text-black text-xs sm:text-sm block">{partyObj?.name || 'Walk-in'}</span>
                              {partyObj?.contact && (
                                <span className="text-[10px] text-slate-600 font-mono font-bold block">
                                  {partyObj.contact}
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">VEHICLE / TRUCK NO</span>
                              <span className="font-bold font-mono text-black text-xs sm:text-sm uppercase block">{vehicleDisplay}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">DRIVER &amp; CONTACT</span>
                              <span className="font-bold text-black text-xs sm:text-sm block">
                                {viewingSlip.driverSignature || (vehicleObj?.driverName ? `${vehicleObj.driverName} (+91 ${vehicleObj.driverContact})` : 'Driver On Duty')}
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        /* Compact Continuation Header for Page 2+ */
                        <div className="border-b-2 border-black pb-2 mb-3.5 text-left flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <h1 className="text-base sm:text-lg font-black tracking-tight text-black uppercase leading-tight">
                              SAHEB PAPER PVT. LTD.
                            </h1>
                            <span className="text-[9px] font-black uppercase text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                              DISPATCH RECEIPT (CONTD.)
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-mono font-black text-slate-600 uppercase border border-slate-300 px-2 py-0.5 rounded bg-slate-50">
                              Page {pageNumber} of {totalPages}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 4. DISPATCHED REELS Table (With Spec-Group Headers) */}
                      <div className="mb-4 text-left">
                        <div className="flex items-center justify-between mb-1.5">
                          <h3 className="text-xs font-black text-black uppercase tracking-wider">
                            DISPATCHED REELS {totalPages > 1 ? `(Part ${pageNumber} of ${totalPages})` : ''}
                          </h3>
                          <span className="text-[10px] font-bold text-slate-500">
                            Showing items {pageIndex * REELS_PER_PAGE + 1} - {Math.min((pageIndex + 1) * REELS_PER_PAGE, sortedReelItems.length)} of {sortedReelItems.length}
                          </span>
                        </div>

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
                              {pageReels.map((reel) => (
                                <React.Fragment key={reel.reelNo}>
                                  {receiptGroupMode === 'grouped' && reel.isGroupStart && (
                                    <tr className="bg-slate-100 font-black border-y border-slate-300">
                                      <td colSpan={7} className="py-1.5 px-3">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                                            {reel.groupLabel}
                                          </span>
                                          <span className="text-[10px] font-black text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-300">
                                            {reel.groupTotalReels} Reels &bull; {reel.groupTotalWeight.toLocaleString()} KG
                                          </span>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                  <tr className="hover:bg-slate-50">
                                    <td className="py-1.5 px-2.5 text-center font-bold text-slate-700">{reel.displayIndex}</td>
                                    <td className="py-1.5 px-3 font-mono font-bold">{reel.reelNo}</td>
                                    <td className="py-1.5 px-3">{reel.product}</td>
                                    <td className="py-1.5 px-3 text-center font-semibold">{reel.gsm}</td>
                                    <td className="py-1.5 px-3 text-center font-semibold">{reel.size}</td>
                                    <td className="py-1.5 px-3 text-center font-semibold">{reel.ply || 1}</td>
                                    <td className="py-1.5 px-3 text-right font-mono font-bold">{reel.weight}</td>
                                  </tr>
                                </React.Fragment>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* 5. PRODUCT SUMMARY Table (On Last Page) */}
                      {isLastPage && (
                        <div className="mb-5 text-left">
                          <h3 className="text-xs font-black text-black uppercase tracking-wider mb-1.5">
                            PRODUCT SUMMARY (ITEMIZED BREAKDOWN)
                          </h3>
                          <div className="border border-slate-300 overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse font-sans">
                              <thead className="bg-[#0B132B] text-white uppercase text-[10px] font-black tracking-wider">
                                <tr>
                                  <th className="py-2 px-3">PRODUCT SPECIFICATION</th>
                                  <th className="py-2 px-3 text-center">GSM</th>
                                  <th className="py-2 px-3 text-center">SIZE</th>
                                  <th className="py-2 px-3 text-center">PLY</th>
                                  <th className="py-2 px-3 text-center">REELS</th>
                                  <th className="py-2 px-3 text-right">TOTAL WEIGHT</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 text-slate-900 font-medium">
                                {specGroupsList.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50">
                                    <td className="py-1.5 px-3 font-bold">{item.product}</td>
                                    <td className="py-1.5 px-3 text-center">{item.gsm}</td>
                                    <td className="py-1.5 px-3 text-center">{item.size} CM</td>
                                    <td className="py-1.5 px-3 text-center">{item.ply} Ply</td>
                                    <td className="py-1.5 px-3 text-center font-bold font-mono">{item.reels.length}</td>
                                    <td className="py-1.5 px-3 text-right font-mono font-bold">{item.totalWeight.toLocaleString()} KG</td>
                                  </tr>
                                ))}
                                {/* GRAND TOTAL Row */}
                                <tr className="bg-[#FEE4CB] font-black text-slate-950 border-t-2 border-slate-300 text-xs">
                                  <td colSpan={4} className="py-2 px-3 uppercase tracking-wider font-black">
                                    GRAND TOTAL
                                  </td>
                                  <td className="py-2 px-3 text-center font-mono font-black text-sm">
                                    {linkedReels.length} Reels
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono font-black text-sm">
                                    {grandTotalWeight.toLocaleString()} KG
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* 6. Signatures (On Last Page) */}
                      {isLastPage && (
                        <div className="grid grid-cols-3 gap-6 pt-5 mb-4 text-center font-sans">
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
                              RECEIVER / GATE
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 7. Footer Caption with Page Count */}
                      <div className="text-center text-[10px] font-semibold text-slate-500 pt-2 border-t border-slate-200 flex justify-between items-center">
                        <span>Generated on {viewingSlip.date || new Date().toLocaleDateString('en-GB')} &bull; Saheb Paper Pvt. Ltd.</span>
                        <span className="font-mono font-bold">Page {pageNumber} of {totalPages}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>,
          document.body
        );
      })()}

    </div>
  );
};
export default DispatchView;
