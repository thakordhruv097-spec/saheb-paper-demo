import React, { useState, useMemo } from 'react';
import type { Reel, PackingSlip, Party, Vehicle } from '../../data/types';
import {
  Search,
  Truck,
  FileText,
  Printer,
  Eye,
  PackageCheck,
  CheckCircle2,
  Calendar,
  Building2,
  Layers,
  Copy,
  Check,
  X,
} from 'lucide-react';

interface DispatchedReelsVaultProps {
  reels: Reel[];
  slips: PackingSlip[];
  parties: Party[];
  vehicles: Vehicle[];
  onViewChallan: (slip: PackingSlip) => void;
  onPrintChallan?: (slip: PackingSlip) => void;
}

export interface DispatchedReelRecord {
  reel: Reel;
  slip?: PackingSlip;
  challanNo: string;
  partyName: string;
  vehicleNo: string;
  dispatchDate: string;
  dispatchTime: string;
}

export const DispatchedReelsVault: React.FC<DispatchedReelsVaultProps> = ({
  reels,
  slips,
  parties,
  vehicles,
  onViewChallan,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState('ALL');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Map and index all confirmed packing slips
  const confirmedSlips = useMemo(() => {
    return slips.filter(s => s.status === 'CONFIRMED' || s.status === 'DISPATCHED');
  }, [slips]);

  // Aggregate all dispatched reels with their corresponding challan details
  const dispatchedRecords: DispatchedReelRecord[] = useMemo(() => {
    const list: DispatchedReelRecord[] = [];
    const seenReelNos = new Set<string>();

    // 1. First, process reels that have status === 'DISPATCHED' or a challanNo
    reels.forEach(r => {
      if (r.status === 'DISPATCHED' || r.challanNo) {
        seenReelNos.add(r.reelNo);
        // Find matching slip
        const matchedSlip = slips.find(
          s => (r.challanNo && s.slipNo === r.challanNo) || s.reelNos.includes(r.reelNo)
        );
        const partyObj = matchedSlip ? parties.find(p => p.id === matchedSlip.partyId) : undefined;
        const vehicleObj = matchedSlip ? vehicles.find(v => v.id === matchedSlip.vehicleId || v.vehicleNo === matchedSlip.vehicleId) : undefined;

        list.push({
          reel: r,
          slip: matchedSlip,
          challanNo: matchedSlip?.slipNo || r.challanNo || 'DISPATCHED',
          partyName: partyObj?.name || (matchedSlip?.partyId ? 'Direct Customer' : 'Dispatched Customer'),
          vehicleNo: vehicleObj ? vehicleObj.vehicleNo : (matchedSlip?.vehicleId || 'N/A'),
          dispatchDate: matchedSlip?.dispatchDate || matchedSlip?.date || (r.productionDate ? r.productionDate.substring(0, 10) : '2026-08-22'),
          dispatchTime: matchedSlip?.dispatchTime || '16:00',
        });
      }
    });

    // 2. Also check any confirmed slips that might have reels in reelNos not caught yet
    confirmedSlips.forEach(slip => {
      const partyObj = parties.find(p => p.id === slip.partyId);
      const vehicleObj = vehicles.find(v => v.id === slip.vehicleId || v.vehicleNo === slip.vehicleId);

      slip.reelNos.forEach(rNo => {
        if (!seenReelNos.has(rNo)) {
          seenReelNos.add(rNo);
          const foundReel: Reel = reels.find(r => r.reelNo === rNo) || {
            reelNo: rNo,
            parentRollNo: 'N/A',
            product: 'Napkin Tissue',
            gsm: 18,
            size: 30,
            ply: 2,
            weight: 300,
            dia: 1000,
            joint: 0,
            status: 'DISPATCHED',
            qcGrade: 'A',
            productionDate: '2026-08-22 10:00',
          };

          list.push({
            reel: foundReel,
            slip,
            challanNo: slip.slipNo,
            partyName: partyObj?.name || 'Direct Customer',
            vehicleNo: vehicleObj ? vehicleObj.vehicleNo : (slip.vehicleId || 'N/A'),
            dispatchDate: slip.dispatchDate || slip.date || '2026-08-22',
            dispatchTime: slip.dispatchTime || '16:00',
          });
        }
      });
    });

    // Sort: newest dispatch date / highest reel number first
    return list.sort((a, b) => {
      if (a.dispatchDate !== b.dispatchDate) {
        return b.dispatchDate.localeCompare(a.dispatchDate);
      }
      return b.reel.reelNo.localeCompare(a.reel.reelNo, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [reels, slips, confirmedSlips, parties, vehicles]);

  // Unique products for filter
  const uniqueProducts = useMemo(() => {
    const set = new Set<string>();
    dispatchedRecords.forEach(rec => {
      if (rec.reel.product) set.add(rec.reel.product);
    });
    return Array.from(set).sort();
  }, [dispatchedRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return dispatchedRecords.filter(rec => {
      if (productFilter !== 'ALL' && rec.reel.product !== productFilter) return false;
      if (gradeFilter !== 'ALL' && (rec.reel.qcGrade || 'A').toUpperCase() !== gradeFilter) return false;

      if (q) {
        const matchReelNo = rec.reel.reelNo.toLowerCase().includes(q);
        const matchProd = rec.reel.product.toLowerCase().includes(q);
        const matchChallan = rec.challanNo.toLowerCase().includes(q);
        const matchParty = rec.partyName.toLowerCase().includes(q);
        const matchVehicle = rec.vehicleNo.toLowerCase().includes(q);
        const matchGsm = String(rec.reel.gsm).includes(q);
        const matchWeight = String(rec.reel.weight).includes(q);

        if (!matchReelNo && !matchProd && !matchChallan && !matchParty && !matchVehicle && !matchGsm && !matchWeight) {
          return false;
        }
      }
      return true;
    });
  }, [dispatchedRecords, searchTerm, productFilter, gradeFilter]);

  // Total Dispatched Metrics
  const totalDispatchedKg = useMemo(() => {
    return filteredRecords.reduce((sum, rec) => sum + (rec.reel.weight || 0), 0);
  }, [filteredRecords]);

  const uniqueChallansCount = useMemo(() => {
    return new Set(filteredRecords.map(r => r.challanNo)).size;
  }, [filteredRecords]);

  const handleCopyReel = (rNo: string) => {
    navigator.clipboard.writeText(rNo);
    setCopiedId(rNo);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Dispatched Reels</span>
            <PackageCheck className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {filteredRecords.length}
          </p>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            Deducted from active stock
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Dispatched Weight</span>
            <Layers className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {totalDispatchedKg.toLocaleString()} <span className="text-xs text-slate-400 font-sans font-bold">kg</span>
          </p>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            {(totalDispatchedKg / 1000).toFixed(2)} MT Net Tonnage
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Linked Challans</span>
            <Truck className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
            {uniqueChallansCount}
          </p>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            Confirmed Delivery Gate Passes
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search dispatched reel no, product, challan no, customer..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white placeholder-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Product:</span>
              <button
                type="button"
                onClick={() => setProductFilter('ALL')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  productFilter === 'ALL'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All
              </button>
              {uniqueProducts.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProductFilter(p)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    productFilter === p
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Grade:</span>
              {['ALL', 'A', 'B'].map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGradeFilter(g)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    gradeFilter === g
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {g === 'ALL' ? 'All' : `Grade ${g}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[9px] sm:text-[10px] font-black tracking-wider bg-slate-50/50 dark:bg-slate-900/60">
                <th className="py-3 px-3">Reel / Barcode No</th>
                <th className="py-3 px-3">Product Specs</th>
                <th className="py-3 px-3 font-mono">Weight (kg)</th>
                <th className="py-3 px-3">Challan / Gate Pass</th>
                <th className="py-3 px-3">Customer / Party</th>
                <th className="py-3 px-3">Vehicle</th>
                <th className="py-3 px-3">Dispatch Date</th>
                <th className="py-3 px-3 text-right">Challan PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-[11px]">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400 font-medium">
                    <PackageCheck className="h-8 w-8 mx-auto mb-2 text-slate-500 opacity-50" />
                    <span>No dispatched reels match the current search or filters.</span>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, idx) => {
                  return (
                    <tr key={`${rec.reel.reelNo}_${rec.challanNo}_${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      
                      {/* Reel No */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-xs text-purple-600 dark:text-purple-400">
                            {rec.reel.reelNo}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyReel(rec.reel.reelNo)}
                            title="Copy Reel ID"
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                          >
                            {copiedId === rec.reel.reelNo ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Product Specs */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                            {rec.reel.product}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {rec.reel.gsm} GSM • {rec.reel.size} cm • {rec.reel.ply || 2} Ply
                          </span>
                        </div>
                      </td>

                      {/* Weight */}
                      <td className="py-3 px-3 font-mono font-black text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {rec.reel.weight} kg
                      </td>

                      {/* Challan No */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono font-extrabold text-[11px] border border-blue-200/60 dark:border-blue-800/60">
                          <Truck className="h-3 w-3" />
                          <span>{rec.challanNo}</span>
                        </span>
                      </td>

                      {/* Customer / Party */}
                      <td className="py-3 px-3 max-w-[150px] truncate" title={rec.partyName}>
                        <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-bold">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{rec.partyName}</span>
                        </div>
                      </td>

                      {/* Vehicle */}
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {rec.vehicleNo}
                      </td>

                      {/* Dispatch Date */}
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>{rec.dispatchDate}</span>
                        </div>
                      </td>

                      {/* Actions: Challan PDF */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {rec.slip ? (
                          <button
                            type="button"
                            onClick={() => onViewChallan(rec.slip!)}
                            className="px-3 py-1.5 rounded-xl bg-[#008163] hover:bg-[#006e54] text-white font-black text-[10px] uppercase tracking-wider shadow-xs shadow-[#008163]/25 transition cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                            title="View & Print Delivery Challan PDF"
                          >
                            <Printer className="h-3 w-3" />
                            <span>Challan PDF</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium italic">
                            Direct Dispatch
                          </span>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
