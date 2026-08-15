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
import { Truck, Plus, FileText, CheckCircle, FileSpreadsheet, AlertTriangle, Printer, Trash2, Search, ListFilter, PackageCheck, Package, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

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

  // Success / Error States
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Search Queries
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [slipSearchQuery, setSlipSearchQuery] = useState('');
  const [showAllReels, setShowAllReels] = useState(false);

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
    setSelectedReelNos(prev =>
      prev.includes(rNo) ? prev.filter(n => n !== rNo) : [...prev, rNo]
    );
  };

  // Handle Draft Packing Slip creation
  const handleSlipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const targetSlipNo = slipNo.trim() || autoSlipNo;

    if (!slipPartyId || !slipVehicleId || selectedReelNos.length === 0 || !driverSig || !receiverSig) {
      setErrorMsg('Please select Party, Vehicle, at least 1 Reel, and input Driver + Receiver signatures');
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
      vehicleId: slipVehicleId,
      reelNos: [...selectedReelNos],
      driverSignature: driverSig,
      receiverSignature: receiverSig,
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
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-slate-900 rounded-3xl p-5 sm:p-6 px-6 sm:px-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-lg shrink-0">
                <Truck className="h-7 w-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-heading">
                    {initialTab === 'orders' ? 'Order Bookings' : 'Finished Stock & Dispatch Management'}
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
        <form onSubmit={handleSlipSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          
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
                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                  Vehicle / Truck No
                </label>
                <select
                  value={slipVehicleId}
                  onChange={e => {
                    setSlipVehicleId(e.target.value);
                    const vObj = vehicles.find(v => v.id === e.target.value);
                    if (vObj && !driverSig) {
                      setDriverSig(vObj.driverName || 'Driver');
                    }
                  }}
                  className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none dark:text-white cursor-pointer font-mono"
                >
                  <option value="">-- Truck No --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.vehicleNo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                  Driver Contact / Sig
                </label>
                <input
                  type="text"
                  value={driverSig}
                  onChange={e => setDriverSig(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none dark:text-white font-mono"
                  placeholder="Driver Name / Mobile"
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

          {/* Reel Selection Ledger (2/3 width) */}
          <div className="lg:col-span-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex justify-between items-center border-b pb-2 dark:border-slate-700/80">
              <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                Select Available Warehouse Reels ({selectedReelNos.length} Selected)
              </h3>
              {availableReels.length > 0 && (
                <span className="text-[10px] font-bold text-slate-400 font-mono">
                  Showing {showAllReels ? availableReels.length : Math.min(6, availableReels.length)} of {availableReels.length} Reels
                </span>
              )}
            </div>

            {availableReels.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                No A-Grade or B-Grade reels in warehouse stock. Log QC tests first.
              </p>
            ) : (
              <div className="space-y-2.5">
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 pr-1 ${showAllReels ? 'max-h-[550px] overflow-y-auto' : ''}`}>
                  {(showAllReels ? availableReels : availableReels.slice(0, 6)).map(reel => {
                    const isChecked = selectedReelNos.includes(reel.reelNo);
                    return (
                      <div
                        key={reel.reelNo}
                        onClick={() => handleToggleReel(reel.reelNo)}
                        className={`p-3 border rounded-xl cursor-pointer transition select-none space-y-2 ${
                          isChecked
                            ? 'border-primary bg-blue-50/20 dark:border-blue-500 ring-1 ring-primary'
                            : 'border-slate-200/80 hover:bg-slate-50 dark:border-slate-700/80 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex justify-between items-center border-b pb-1.5 dark:border-slate-800">
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{reel.reelNo}</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                              reel.status === 'IN_STOCK' ? 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700' : 'bg-amber-100 dark:bg-amber-950/20 text-amber-700'
                            }`}>
                              Grade {reel.qcGrade}
                            </span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // handled by div click
                              className="h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-0 cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                          <div>
                            <span className="font-medium text-slate-400 block uppercase tracking-wider text-[9px]">Reel No</span>
                            <span className="font-bold text-slate-800 dark:text-white text-xs font-mono">{reel.reelNo}</span>
                          </div>
                          <div>
                            <span className="font-medium text-slate-400 block uppercase tracking-wider text-[9px]">Weight</span>
                            <span className="font-bold text-slate-800 dark:text-white text-xs">{reel.weight} kg</span>
                          </div>
                          <div>
                            <span className="font-medium text-slate-400 block uppercase tracking-wider text-[9px]">Diameter</span>
                            <span className="font-bold text-slate-800 dark:text-white text-xs">{reel.dia} mm</span>
                          </div>
                          <div>
                            <span className="font-medium text-slate-400 block uppercase tracking-wider text-[9px]">Joints</span>
                            <span className="font-bold text-slate-800 dark:text-white text-xs">{reel.joint}</span>
                          </div>
                          <div>
                            <span className="font-medium text-slate-400 block uppercase tracking-wider text-[9px]">Produced</span>
                            <span className="font-medium text-slate-800 dark:text-white text-xs">{reel.productionDate}</span>
                          </div>
                          <div>
                            <span className="font-medium text-slate-400 block uppercase tracking-wider text-[9px]">GSM</span>
                            <span className="font-bold text-slate-800 dark:text-white text-xs">{reel.gsm}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {availableReels.length > 6 && (
                  <button
                    type="button"
                    onClick={() => setShowAllReels(!showAllReels)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-primary dark:text-blue-400 font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200/80 dark:border-slate-700 shadow-2xs mt-1"
                  >
                    {showAllReels ? (
                      <>
                        <ChevronUp className="h-3.5 w-3.5" />
                        <span>Show Less</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" />
                        <span>View More Reels (Showing 6 of {availableReels.length})</span>
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

      {/* Challan View Detail Modal / Printable Receipt */}
      {viewingSlip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:relative print:bg-white print:p-0">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-h-full print:w-full print:p-0">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b pb-3 dark:border-slate-700 print:hidden">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Challan Dispatch Receipt Detail
              </h3>
              <button
                onClick={() => setViewingSlip(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Close
              </button>
            </div>

            {/* Printable Area Layout */}
            <div className="space-y-6 text-slate-900 dark:text-white bg-white dark:bg-slate-800 p-4 print:p-0 print:text-black">
              
              {/* Mill Header */}
              <div className="text-center border-b-2 pb-4 border-slate-900">
                <h2 className="text-xl font-bold font-heading uppercase tracking-wider print:text-black">SAHEB PAPER PVT. LTD.</h2>
                <p className="text-[10px] text-text-light-secondary print:text-black font-sans uppercase">Tissue Paper Mill - Napkin, Toilet, KT & HRT Tissue</p>
                <p className="text-[10px] text-text-light-secondary print:text-black font-sans">Surat, Gujarat, India | Contact: +91 98765 43210</p>
              </div>

              {/* Challan Info Blocks */}
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="space-y-1">
                  <p><strong>CHALLAN NO:</strong> {viewingSlip.slipNo}</p>
                  <p><strong>DATE:</strong> {viewingSlip.date}</p>
                  <p><strong>STATUS:</strong> <span className="font-bold uppercase">{viewingSlip.status}</span></p>
                </div>
                <div className="space-y-1">
                  <p><strong>CUSTOMER:</strong> {parties.find(p => p.id === viewingSlip.partyId)?.name || 'N/A'}</p>
                  <p><strong>VEHICLE NO:</strong> {vehicles.find(v => v.id === viewingSlip.vehicleId)?.vehicleNo || 'N/A'}</p>
                  <p><strong>DRIVER NAME:</strong> {vehicles.find(v => v.id === viewingSlip.vehicleId)?.driverName || 'N/A'}</p>
                </div>
              </div>

              {/* Reels Details Table */}
              <div className="border border-slate-300 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[560px]">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-700/80 border-b border-slate-300 text-slate-800 dark:text-slate-200 font-bold font-mono print:text-black">
                      <th className="py-2.5 px-3.5 whitespace-nowrap">Reel Number</th>
                      <th className="py-2.5 px-3.5 whitespace-nowrap">Product Description</th>
                      <th className="py-2.5 px-3.5 whitespace-nowrap">GSM</th>
                      <th className="py-2.5 px-3.5 whitespace-nowrap">Size</th>
                      <th className="py-2.5 px-3.5 whitespace-nowrap">Ply</th>
                      <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Weight (kg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {reels
                      .filter(r => viewingSlip.reelNos.includes(r.reelNo))
                      .map(reel => (
                        <tr key={reel.reelNo} className="print:text-black">
                          <td className="py-2.5 px-3.5 font-bold font-mono whitespace-nowrap">{reel.reelNo}</td>
                          <td className="py-2.5 px-3.5 whitespace-nowrap">{reel.product}</td>
                          <td className="py-2.5 px-3.5 font-mono whitespace-nowrap">{reel.gsm} GSM</td>
                          <td className="py-2.5 px-3.5 font-mono whitespace-nowrap">{reel.size} cm</td>
                          <td className="py-2.5 px-3.5 font-mono whitespace-nowrap">{reel.ply} Ply</td>
                          <td className="py-2.5 px-3.5 text-right font-bold font-mono whitespace-nowrap">{reel.weight.toLocaleString()} kg</td>
                        </tr>
                      ))}
                    {/* Total Summary Row */}
                    <tr className="bg-slate-50 dark:bg-slate-800 font-bold border-t-2 border-slate-300 font-mono print:text-black">
                      <td colSpan={5} className="py-3 px-3.5 text-right uppercase tracking-wider text-xs whitespace-nowrap">Total Dispatch Weight:</td>
                      <td className="py-3 px-3.5 text-right text-sm font-black whitespace-nowrap font-mono text-primary dark:text-blue-400">
                        {reels
                          .filter(r => viewingSlip.reelNos.includes(r.reelNo))
                          .reduce((sum, r) => sum + r.weight, 0)
                          .toLocaleString()}{' '}
                        kg
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-xs font-mono">
                <div className="border-t border-dashed border-slate-600 pt-3 text-center">
                  <p><strong>DRIVER SIGNATURE</strong></p>
                  <p className="mt-2 text-slate-600 dark:text-slate-400 italic">Name: {viewingSlip.driverSignature}</p>
                </div>
                <div className="border-t border-dashed border-slate-600 pt-3 text-center">
                  <p><strong>RECEIVER SIGNATURE</strong></p>
                  <p className="mt-2 text-slate-600 dark:text-slate-400 italic">Name: {viewingSlip.receiverSignature}</p>
                </div>
              </div>

            </div>

            {/* Modal Footer controls */}
            <div className="flex justify-end gap-3 border-t pt-3 dark:border-slate-700 print:hidden">
              <button
                onClick={() => setViewingSlip(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Close
              </button>
              <button
                onClick={handlePrintChallan}
                className="px-4 py-2 bg-primary hover:bg-blue-800 text-white rounded text-xs font-semibold shadow flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                <span>Print Challan Receipt</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
export default DispatchView;
