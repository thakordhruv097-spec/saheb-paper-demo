import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getReels,
  getRawMaterialLots,
  getBoilerLogs,
  getParties,
  getVehicles,
  savePackingSlip,
} from '../../data/index';
import type { Reel, RawMaterialLot, BoilerLog, PartyItem, VehicleItem } from '../../data/types';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  Camera,
  CheckCircle,
  RefreshCw,
  ArrowRight,
  X,
  Search,
  Pencil,
  Truck,
  Check,
  SlidersHorizontal,
  Package,
  CheckCircle2,
} from 'lucide-react';

export const QRScannerView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [scanResult, setScanResult] = useState<{
    code: string;
    type: 'REEL' | 'LOT' | 'BOILER';
    reel?: Reel;
    lot?: RawMaterialLot;
    boiler?: BoilerLog;
  } | null>(null);

  const [scanError, setScanError] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Manual Reel Entry Input State
  const [manualCodeInput, setManualCodeInput] = useState('');
  const reelsList = getReels();

  // Inline Edit Reel Spec State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    reelNo: '',
    product: '',
    gsm: 18,
    size: 30,
    weight: 1500,
  });

  // Direct Quick Dispatch Modal State
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [parties] = useState<PartyItem[]>(() => getParties());
  const [vehicles] = useState<VehicleItem[]>(() => getVehicles());
  const [dispatchParty, setDispatchParty] = useState(parties[0]?.id || '');
  const [dispatchVehicle, setDispatchVehicle] = useState(vehicles[0]?.vehicleNo || '');
  const [dispatchError, setDispatchError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const processScannedCode = (code: string) => {
    const targetCode = code.trim().toUpperCase();
    setScanError('');

    if (targetCode.startsWith('LOT-')) {
      const lotsList = getRawMaterialLots();
      const foundLot = lotsList.find(l => l.lotNo.trim().toUpperCase() === targetCode);
      if (foundLot) {
        setScanResult({ code: targetCode, type: 'LOT', lot: foundLot });
      } else {
        setScanResult({ code: targetCode, type: 'LOT' });
      }
    } else if (targetCode.startsWith('BLR-')) {
      const boilerLogs = getBoilerLogs();
      const foundLog = boilerLogs.find(b => b.id.trim().toUpperCase() === targetCode);
      if (foundLog) {
        setScanResult({ code: targetCode, type: 'BOILER', boiler: foundLog });
      } else {
        setScanResult({ code: targetCode, type: 'BOILER' });
      }
    } else {
      const foundReel = reelsList.find(r => r.reelNo.trim().toUpperCase() === targetCode);
      if (foundReel) {
        setScanResult({ code: targetCode, type: 'REEL', reel: foundReel });
        setEditForm({
          reelNo: foundReel.reelNo,
          product: foundReel.product,
          gsm: foundReel.gsm,
          size: foundReel.size,
          weight: foundReel.weight,
        });
      } else {
        setScanResult({ code: targetCode, type: 'REEL' });
      }
    }
  };

  // Setup live camera scanner
  useEffect(() => {
    if (isScanning && !scanResult) {
      const timer = setTimeout(() => {
        try {
          const scanner = new Html5QrcodeScanner(
            'pure-camera-viewfinder',
            { fps: 15, qrbox: { width: 260, height: 260 } },
            false
          );

          scannerRef.current = scanner;

          scanner.render(
            (decodedText) => {
              processScannedCode(decodedText);
              setIsScanning(false);
              scanner.clear().catch(() => {});
            },
            () => {}
          );
        } catch (err) {
          console.error('Failed to initialize camera scanner', err);
        }
      }, 200);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(() => {});
        }
      };
    }
  }, [isScanning, scanResult]);

  const handleResetScanner = () => {
    setScanResult(null);
    setScanError('');
    setIsScanning(true);
    setIsEditing(false);
    setManualCodeInput('');
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) {
      setScanError('Please enter a valid Reel No or Barcode.');
      return;
    }
    processScannedCode(manualCodeInput);
    setIsScanning(false);
  };

  const handleSaveEditReel = () => {
    if (!scanResult?.reel) return;
    const currentReels = getReels();
    const index = currentReels.findIndex(r => r.reelNo === scanResult.reel?.reelNo);
    if (index > -1) {
      const updatedReel: Reel = {
        ...currentReels[index],
        reelNo: editForm.reelNo.trim(),
        product: editForm.product.trim(),
        gsm: Number(editForm.gsm),
        size: Number(editForm.size),
        weight: Number(editForm.weight),
      };
      currentReels[index] = updatedReel;
      localStorage.setItem('saheb_reels_v2', JSON.stringify(currentReels));
      setScanResult({ code: updatedReel.reelNo, type: 'REEL', reel: updatedReel });
      setIsEditing(false);
      setToastMsg(`Reel #${updatedReel.reelNo} details updated successfully!`);
      setTimeout(() => setToastMsg(''), 3500);
    }
  };

  const handleQuickDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanResult?.reel) return;
    if (!dispatchParty || !dispatchVehicle) {
      setDispatchError('Please select both Customer Party and Dispatch Vehicle.');
      return;
    }

    const partyObj = parties.find(p => p.id === dispatchParty);
    try {
      savePackingSlip(
        {
          id: `ps-${Date.now()}`,
          slipNo: `PS-${Date.now().toString().slice(-6)}`,
          date: new Date().toISOString().substring(0, 10),
          partyId: dispatchParty,
          vehicleId: dispatchVehicle,
          reelNos: [scanResult.reel.reelNo],
          driverSignature: '',
          receiverSignature: '',
          status: 'DISPATCHED',
        },
        'Operator'
      );

      setShowDispatchModal(false);
      setToastMsg(`Reel ${scanResult.reel.reelNo} dispatched to ${partyObj?.name || 'Customer'}! Stock updated (MINUS).`);
      setTimeout(() => setToastMsg(''), 4000);
      handleResetScanner();
    } catch (err: any) {
      setDispatchError(err.message || 'Failed to dispatch reel.');
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center font-sans p-4 relative select-none text-left">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4.5 w-4.5 text-blue-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. DUAL MODE: CAMERA SCANNER & MANUAL TYPE SEARCH */}
      {!scanResult ? (
        <div className="w-full max-w-md bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-2xl text-center space-y-5">
          
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <Camera className="h-5 w-5" />
              </div>
              <span className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                Live QR &amp; Barcode Scanner
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider animate-pulse">
              Camera Active
            </span>
          </div>

          {/* Camera Viewfinder */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-blue-500/40 bg-slate-900 shadow-inner">
            <div id="pure-camera-viewfinder" className="w-full min-h-[280px]" />
          </div>

          {/* MANUAL TYPE / SEARCH FALLBACK SECTION */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Manual Entry / Search Reel</span>
              <span className="text-[10px] text-blue-500 font-semibold">Or Type Code</span>
            </div>

            <form onSubmit={handleManualSearch} className="flex gap-2">
              <input
                type="text"
                value={manualCodeInput}
                onChange={e => setManualCodeInput(e.target.value)}
                placeholder="Type Reel No (e.g. RL-1001)..."
                className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase placeholder:normal-case font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md transition cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <Search className="h-4 w-4" />
                <span>Search</span>
              </button>
            </form>

            {/* Quick Reel Select Dropdown */}
            {reelsList.length > 0 && (
              <select
                onChange={e => {
                  if (e.target.value) {
                    processScannedCode(e.target.value);
                    setIsScanning(false);
                  }
                }}
                defaultValue=""
                className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="" disabled>-- Or Select Reel from Stock List --</option>
                {reelsList.slice(-15).reverse().map(r => (
                  <option key={r.reelNo} value={r.reelNo}>
                    {r.reelNo} &bull; {r.product} &bull; {r.weight}kg ({r.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          {scanError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs rounded-2xl border border-red-200 font-bold">
              {scanError}
            </div>
          )}

        </div>
      ) : (
        /* 2. SCAN RESULT CARD WITH DETAILS, INLINE EDIT, & DIRECT DISPATCH */
        <div className="w-full max-w-md bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
          
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-5 w-5" />
              </div>
              <span className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                Reel Verification &amp; Dispatch
              </span>
            </div>
            <button onClick={handleResetScanner} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Code Badge */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Scanned Code</span>
              <span className="text-lg font-black font-mono text-blue-600 dark:text-blue-400">{scanResult.code}</span>
            </div>
            {scanResult.reel && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 transition cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Edit Specs</span>
              </button>
            )}
          </div>

          {/* ITEM DETAILS CARD (EDITABLE INLINE) */}
          {scanResult.reel ? (
            isEditing ? (
              /* Inline Edit Mode */
              <div className="space-y-3 p-4 bg-blue-50/50 dark:bg-slate-900/80 rounded-2xl border border-blue-200 dark:border-blue-800 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-blue-100 dark:border-slate-800">
                  <span className="font-black text-blue-600 dark:text-blue-400 uppercase text-[10px]">Edit Reel Specs Manually</span>
                  <button type="button" onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reel No</label>
                    <input
                      type="text"
                      value={editForm.reelNo}
                      onChange={e => setEditForm({ ...editForm, reelNo: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Product</label>
                    <input
                      type="text"
                      value={editForm.product}
                      onChange={e => setEditForm({ ...editForm, product: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      value={editForm.weight}
                      onChange={e => setEditForm({ ...editForm, weight: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">GSM &amp; Size</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={editForm.gsm}
                        onChange={e => setEditForm({ ...editForm, gsm: parseFloat(e.target.value) || 0 })}
                        className="w-1/2 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                        placeholder="GSM"
                      />
                      <input
                        type="number"
                        value={editForm.size}
                        onChange={e => setEditForm({ ...editForm, size: parseFloat(e.target.value) || 0 })}
                        className="w-1/2 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                        placeholder="Size"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveEditReel}
                  className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>Save Updated Specs</span>
                </button>
              </div>
            ) : (
              /* Display View Mode */
              <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Product</span>
                  <span className="font-bold text-slate-900 dark:text-white">{scanResult.reel.product}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Size &amp; GSM</span>
                  <span className="font-bold text-slate-900 dark:text-white">{scanResult.reel.size} cm &bull; {scanResult.reel.gsm} GSM</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Reel Weight</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{scanResult.reel.weight.toLocaleString()} kg</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Status / Grade</span>
                  <span className={`font-black ${scanResult.reel.status === 'DISPATCHED' ? 'text-purple-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {scanResult.reel.status === 'DISPATCHED' ? 'DISPATCHED' : `Grade ${scanResult.reel.qcGrade}`}
                  </span>
                </div>
              </div>
            )
          ) : (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 rounded-2xl text-xs font-bold border border-amber-200">
              Scanned code &quot;{scanResult.code}&quot; is not registered in active stock.
            </div>
          )}

          {/* ACTION BUTTONS: DIRECT DISPATCH & TRACEABILITY */}
          <div className="space-y-2.5 pt-2">
            {scanResult.reel && scanResult.reel.status !== 'DISPATCHED' && (
              <button
                type="button"
                onClick={() => setShowDispatchModal(true)}
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-3.5 px-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Truck className="h-4 w-4" />
                <span>Confirm &amp; Dispatch Reel Now (Auto-Minus)</span>
              </button>
            )}

            <button
              onClick={() => navigate('/traceability')}
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold py-3 px-4 rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
            >
              <span>View Full Traceability Graph</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={handleResetScanner}
              className="w-full bg-slate-50 dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold py-2.5 px-4 rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Scan Next Reel / Reset</span>
            </button>
          </div>

        </div>
      )}

      {/* QUICK DISPATCH MODAL POPUP */}
      {showDispatchModal && scanResult?.reel && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
                Dispatch Reel #{scanResult.reel.reelNo}
              </h3>
              <button onClick={() => setShowDispatchModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {dispatchError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs rounded-2xl font-bold border border-red-200">
                {dispatchError}
              </div>
            )}

            <form onSubmit={handleQuickDispatch} className="space-y-4 text-xs font-bold">
              <div className="p-3 bg-blue-50/50 dark:bg-slate-900/60 rounded-2xl border border-blue-100 dark:border-slate-800 space-y-1">
                <p><span className="text-slate-400 uppercase text-[10px]">Product:</span> <span className="text-slate-900 dark:text-white font-black">{scanResult.reel.product}</span></p>
                <p><span className="text-slate-400 uppercase text-[10px]">Weight:</span> <span className="text-blue-600 dark:text-blue-400 font-black font-mono">{scanResult.reel.weight} kg</span></p>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase mb-1.5">Select Party / Customer</label>
                <select
                  value={dispatchParty}
                  onChange={e => setDispatchParty(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white cursor-pointer"
                >
                  {parties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase mb-1.5">Dispatch Vehicle No</label>
                <select
                  value={dispatchVehicle}
                  onChange={e => setDispatchVehicle(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white cursor-pointer"
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.vehicleNo}>{v.vehicleNo} ({v.driverName})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" />
                <span>Confirm Dispatch (Auto-Minus Stock)</span>
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default QRScannerView;
