import React, { useState, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  getRawMaterials,
  updateRawMaterialStock,
  getVendors,
  getRawMaterialLots,
} from '../../data/index';
import type { RawMaterialCategory, RawMaterialItem, RawMaterialLot } from '../../data/types';
import { CustomDatePickerModal } from '../../components/CustomDatePickerModal';
import { DataFilterBar } from '../../components/DataFilterBar';
import { CustomSearchableSelect } from '../../components/CustomSearchableSelect';
import type { FilterField } from '../../components/DataFilterBar';
import {
  Warehouse,
  Plus,
  QrCode,
  Printer,
  Search,
  ListFilter,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Boxes,
  ArrowUpRight,
  Filter,
  X,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { WorkflowStepBadge, WORKFLOW_STEPS } from '../../components/WorkflowStepBadge';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

export const RawMaterialView: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [materials, setMaterials] = useState<RawMaterialItem[]>(() => getRawMaterials());
  const [lots, setLots] = useState<RawMaterialLot[]>(() => getRawMaterialLots());
  const [selectedLotForQR, setSelectedLotForQR] = useState<RawMaterialLot | null>(null);
  const [rmSearchQuery, setRmSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const vendors = getVendors();

  // Inward Lots filter states
  const [lotSearchQuery, setLotSearchQuery] = useState('');
  const [lotDateFrom, setLotDateFrom] = useState('');
  const [lotDateTo, setLotDateTo] = useState('');
  const [lotVendorFilter, setLotVendorFilter] = useState('all');
  const [lotMaterialFilter, setLotMaterialFilter] = useState('all');

  // Inward Form States & Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [qtyStr, setQtyStr] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [inwardRemarks, setInwardRemarks] = useState('');
  const [inwardSuccess, setInwardSuccess] = useState('');
  const [inwardError, setInwardError] = useState('');

  useBodyScrollLock(isModalOpen || !!selectedLotForQR);

  // Custom Searchable Picker Dropdown States
  const [isMaterialDropdownOpen, setIsMaterialDropdownOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  const selectedMaterial = useMemo(() => {
    return materials.find(m => m.id === selectedMaterialId);
  }, [materials, selectedMaterialId]);

  const filteredPickerMaterials = useMemo(() => {
    const q = pickerSearch.toLowerCase().trim();
    if (!q) return materials;
    return materials.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
    );
  }, [materials, pickerSearch]);

  // Category filter map
  const categoryFilterMap: Record<string, RawMaterialCategory | 'ALL'> = {
    all: 'ALL',
    waste_paper: 'WASTE_PAPER',
    other_raw_material: 'OTHER_RAW_MATERIAL',
    chemical: 'CHEMICAL',
    firewood: 'FIREWOOD',
  };

  const handleInwardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInwardSuccess('');
    setInwardError('');

    if (!selectedMaterialId || !qtyStr || !selectedVendorId) {
      setInwardError('Please select material item, supplier vendor, and enter quantity');
      return;
    }

    const qty = parseFloat(qtyStr);
    if (isNaN(qty) || qty <= 0) {
      setInwardError('Quantity must be a positive number');
      return;
    }

    const material = materials.find(m => m.id === selectedMaterialId);
    const vendor = vendors.find(v => v.id === selectedVendorId);

    if (material && vendor) {
      const success = updateRawMaterialStock(material.id, qty, user?.displayName || 'System', vendor.name);
      if (success) {
        setMaterials(getRawMaterials());
        setLots(getRawMaterialLots());
        setInwardSuccess(`Successfully added ${qty} kg of ${material.name} from ${vendor.name}!`);
        // Reset form
        setSelectedMaterialId('');
        setQtyStr('');
        setSelectedVendorId('');
        setInwardRemarks('');
        setIsModalOpen(false);
        setTimeout(() => setInwardSuccess(''), 4000);
      } else {
        setInwardError('Failed to update stock');
      }
    }
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(rmSearchQuery.toLowerCase());
      const selectedCatEnum = categoryFilterMap[selectedCategory];
      const matchesCategory = selectedCatEnum === 'ALL' || m.category === selectedCatEnum;
      return matchesSearch && matchesCategory;
    });
  }, [materials, rmSearchQuery, selectedCategory]);

  // Dynamic KPI Metrics
  const totalStockKg = useMemo(() => materials.reduce((acc, m) => acc + m.stock, 0), [materials]);
  const lowStockCount = useMemo(() => materials.filter(m => m.stock <= m.minThreshold).length, [materials]);

  // Helper for stock status color styling
  const getStockStatus = (stock: number, min: number) => {
    if (stock <= min * 0.5) {
      return {
        label: 'Critical Low',
        colorClass: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/40 border-red-200 dark:border-red-800',
        barColor: 'bg-gradient-to-r from-red-500 to-rose-600',
      };
    } else if (stock <= min) {
      return {
        label: 'Low Stock Alert',
        colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 border-amber-200 dark:border-amber-700',
        barColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
      };
    } else {
      return {
        label: 'Healthy Stock',
        colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
        barColor: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header with Quick Inward Action Button */}
      <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider font-heading">
                Raw Material Stock Inventory
              </h2>
              <WorkflowStepBadge stepInfo={WORKFLOW_STEPS.rawMaterial} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-tight">
              Monitor waste paper, chemicals, firewood stocks & log purchase inward arrivals.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setInwardError('');
            setIsModalOpen(true);
          }}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Purchase Inward Entry</span>
        </button>
      </div>

      {inwardSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-2xl border border-emerald-200 dark:border-emerald-800 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{inwardSuccess}</span>
        </div>
      )}

      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 w-full">
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Raw Stock</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-black font-mono text-slate-900 dark:text-white">
            {(totalStockKg / 1000).toLocaleString('en-IN', { maximumFractionDigits: 1 })} Tons
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {(totalStockKg).toLocaleString()} kg across {materials.length} items
          </p>
        </div>

        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Low Stock Alerts</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-black font-mono text-slate-900 dark:text-white">
            {lowStockCount} Items
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {lowStockCount > 0 ? "Below minimum reorder threshold" : "All stock levels optimal"}
          </p>
        </div>

        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Inward Lots Logged</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-black font-mono text-slate-900 dark:text-white">
            {lots.length} Inward Lots
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Tracked with QR Code batch IDs
          </p>
        </div>
      </div>

      {/* Main Stock Table Container */}
      <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-sm space-y-5">
        
        {/* Category Filters Chips & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1 shrink-0">
              <Filter className="h-3.5 w-3.5" /> Category:
            </span>
            {[
              { id: 'all', label: 'All Items' },
              { id: 'waste_paper', label: 'Waste Paper' },
              { id: 'chemical', label: 'Chemicals' },
              { id: 'firewood', label: 'Firewood' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-2 flex items-center gap-2 w-full md:w-64">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={rmSearchQuery}
              onChange={e => setRmSearchQuery(e.target.value)}
              placeholder="Search raw material item..."
              className="bg-transparent border-none text-xs font-semibold focus:outline-none w-full dark:text-white placeholder-slate-400"
            />
          </div>
        </div>

        {/* Stock Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                <th className="py-3 px-3">Material Item</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Available Stock</th>
                <th className="py-3 px-3">Min Reorder Level</th>
                <th className="py-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-400 font-medium">
                    No raw material items match your category or search.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map(item => {
                  const status = getStockStatus(item.stock, item.minThreshold);
                  const percentage = Math.min(100, Math.round((item.stock / (item.minThreshold * 2)) * 100));

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {item.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        {item.stock >= 1000 ? `${(item.stock / 1000).toFixed(2)} Tons (${item.stock} kg)` : `${item.stock} kg`}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-500 dark:text-slate-400">
                        {item.minThreshold} kg
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${status.colorClass}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Inward Lots History Table */}
      <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Recent Purchase Inward Receipts Log
          </h3>
          <div className="flex items-center gap-2">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-2 flex items-center gap-2 w-full md:w-48">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={lotSearchQuery}
                onChange={e => setLotSearchQuery(e.target.value)}
                placeholder="Search lot, item..."
                className="bg-transparent border-none text-xs font-semibold focus:outline-none w-full dark:text-white placeholder-slate-400"
              />
            </div>
            <DataFilterBar
              dateFrom={lotDateFrom}
              dateTo={lotDateTo}
              onDateFromChange={setLotDateFrom}
              onDateToChange={setLotDateTo}
              filterFields={[
                { id: 'vendor', label: 'Vendor', options: vendors.map(v => ({ label: v.name, value: v.name })) },
                { id: 'material', label: 'Material', options: [...new Set(lots.map(l => l.materialName || ''))].filter(Boolean).map(n => ({ label: n, value: n })) },
              ]}
              activeFilters={{ vendor: lotVendorFilter, material: lotMaterialFilter }}
              onFilterChange={(fieldId, value) => {
                if (fieldId === 'vendor') setLotVendorFilter(value);
                if (fieldId === 'material') setLotMaterialFilter(value);
              }}
              onClearAll={() => { setLotDateFrom(''); setLotDateTo(''); setLotVendorFilter('all'); setLotMaterialFilter('all'); }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                <th className="py-3 px-3">Lot ID / QR</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Item Name</th>
                <th className="py-3 px-3">Supplier Vendor</th>
                <th className="py-3 px-3 font-mono">Quantity</th>
                <th className="py-3 px-3 text-right">QR Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
              {(() => {
                let filteredLots = lots;
                const lq = lotSearchQuery.toLowerCase().trim();
                if (lq) filteredLots = filteredLots.filter(l => (l.lotNo || '').toLowerCase().includes(lq) || (l.materialName || '').toLowerCase().includes(lq) || (l.vendorName || '').toLowerCase().includes(lq));
                if (lotDateFrom) filteredLots = filteredLots.filter(l => l.date >= lotDateFrom);
                if (lotDateTo) filteredLots = filteredLots.filter(l => l.date <= lotDateTo);
                if (lotVendorFilter && lotVendorFilter !== 'all') filteredLots = filteredLots.filter(l => l.vendorName === lotVendorFilter);
                if (lotMaterialFilter && lotMaterialFilter !== 'all') filteredLots = filteredLots.filter(l => l.materialName === lotMaterialFilter);

                // Sort Recent > Past (Newest items on top)
                const sortedLots = [...filteredLots].sort((a, b) => {
                  const dateCompare = (b.date || '').localeCompare(a.date || '');
                  if (dateCompare !== 0) return dateCompare;
                  return (b.lotNo || '').localeCompare(a.lotNo || '');
                });

                return sortedLots.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-xs text-slate-400 font-medium">
                      No inward receipt lots match your filters.
                    </td>
                  </tr>
                ) : (
                  sortedLots.map(lot => {
                    const item = materials.find(m => m.id === lot.materialId);
                    return (
                      <tr key={lot.lotNo} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 font-mono font-bold text-primary dark:text-blue-400">
                          {lot.lotNo}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono">
                          {lot.date}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          {lot.materialName || item?.name || 'Raw Material Item'}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                          {lot.vendorName}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          {lot.weight} kg
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setSelectedLotForQR(lot)}
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 dark:hover:bg-blue-950/40 text-slate-600 dark:text-slate-300 hover:text-primary transition cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold border border-slate-200/80 dark:border-slate-700"
                          >
                            <QrCode className="h-3.5 w-3.5 text-primary dark:text-blue-400" />
                            <span>View QR</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Inward Entry Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                Add Purchase Inward Shipment
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {inwardError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-200 dark:border-red-800 font-bold">
                {inwardError}
              </div>
            )}

            <form onSubmit={handleInwardSubmit} className="space-y-4 text-left">
              {/* Custom Searchable Raw Material Picker */}
              <div className="relative">
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  RAW MATERIAL ITEM
                </label>

                {/* Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsMaterialDropdownOpen(!isMaterialDropdownOpen)}
                  className="w-full py-3 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white flex items-center justify-between gap-2 text-left cursor-pointer focus:ring-2 focus:ring-blue-500 transition shadow-xs"
                >
                  {selectedMaterial ? (
                    <div className="flex items-center gap-2 truncate min-w-0">
                      <span className="font-black text-slate-900 dark:text-white truncate">{selectedMaterial.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                        {selectedMaterial.category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 shrink-0">
                        ({selectedMaterial.stock >= 1000 ? `${(selectedMaterial.stock / 1000).toFixed(1)} Tons` : `${selectedMaterial.stock} kg`})
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 font-normal">Select Raw Material Item...</span>
                  )}
                  <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${isMaterialDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Floating Menu */}
                {isMaterialDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#091124] border border-slate-200 dark:border-slate-700/90 rounded-2xl shadow-2xl z-50 p-2.5 space-y-2 max-h-72 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150">
                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={pickerSearch}
                        onChange={e => setPickerSearch(e.target.value)}
                        placeholder="Type to search material..."
                        className="w-full pl-8 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white focus:outline-none placeholder:text-slate-400"
                        autoFocus
                      />
                    </div>

                    {/* Filtered Material List */}
                    <div className="space-y-1">
                      {filteredPickerMaterials.length > 0 ? (
                        filteredPickerMaterials.map(m => {
                          const isSelected = m.id === selectedMaterialId;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setSelectedMaterialId(m.id);
                                setIsMaterialDropdownOpen(false);
                                setPickerSearch('');
                              }}
                              className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2 transition cursor-pointer ${
                                isSelected
                                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-md'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-bold truncate">{m.name}</span>
                                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}>
                                  {m.category.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <span className={`text-[11px] font-mono shrink-0 font-bold ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                                {m.stock >= 1000 ? `${(m.stock / 1000).toFixed(1)} Tons` : `${m.stock} kg`}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="p-3 text-center text-xs text-slate-400">
                          No matching raw material items found.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Searchable Supplier Vendor Picker */}
              <CustomSearchableSelect
                label="SUPPLIER / VENDOR"
                placeholder="Select Supplier Vendor..."
                value={selectedVendorId}
                onChange={setSelectedVendorId}
                options={vendors.map(v => ({
                  value: v.id,
                  label: v.name,
                  sublabel: v.contact ? `Contact: ${v.contact}` : v.address,
                  badge: 'Vendor',
                  badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                }))}
                required
              />

              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Inward Quantity (kg)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  placeholder="e.g. 5000"
                  value={qtyStr}
                  onChange={e => setQtyStr(e.target.value)}
                  className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white focus:ring-2 focus:ring-primary focus:outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Remarks / Truck Invoice No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. Inv-4092, Truck GJ-05-BY-1234"
                  value={inwardRemarks}
                  onChange={e => setInwardRemarks(e.target.value)}
                  className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                >
                  Confirm Inward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Traceability Sticker Modal */}
      {selectedLotForQR && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedLotForQR(null);
          }}
        >
          <div
            className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-5 relative text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className="h-4 w-4 text-primary" />
                Raw Material Batch QR Code
              </h3>
              <button onClick={() => setSelectedLotForQR(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Printable Lot Tag Card (Minimalist - Header, Large QR, Lot No Only) */}
            <div
              id="printable-rm-lot-card"
              className="w-full max-w-[280px] bg-white text-slate-950 p-4 rounded-2xl border-2 border-slate-950 text-center flex flex-col items-center justify-center space-y-3 mx-auto shadow-2xl"
            >
              {/* 1. Header: SAHEB PAPER PVT. LTD. */}
              <div className="border-b-2 border-slate-950 pb-2 w-full">
                <h2 className="text-sm sm:text-base font-black tracking-wide uppercase text-slate-950 leading-tight">
                  SAHEB PAPER PVT. LTD.
                </h2>
              </div>

              {/* 2. Edge-to-Edge Large QR Code */}
              <div className="w-full flex items-center justify-center py-1">
                <QRCodeSVG
                  value={selectedLotForQR.lotNo}
                  size={210}
                  level="L"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>

              {/* 3. QR Code Name */}
              <div className="pt-2 border-t-2 border-slate-950 w-full">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  QR CODE NAME
                </p>
                <p className="text-xl font-black font-mono text-slate-950 mt-0.5 tracking-wider">
                  {selectedLotForQR.lotNo}
                </p>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition active:scale-95"
            >
              <Printer className="h-4 w-4" />
              <span>PRINT BATCH BARCODE/QR</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
