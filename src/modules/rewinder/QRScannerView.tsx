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
import { Html5Qrcode } from 'html5-qrcode';
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
  CheckCircle2,
  Zap,
  Volume2,
  VolumeX,
  Tag,
} from 'lucide-react';

interface QRScannerViewProps {
  onOpenPrintStudio?: (reel?: Reel, code?: string) => void;
}

export const QRScannerView: React.FC<QRScannerViewProps> = ({ onOpenPrintStudio }) => {
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
  const [torchActive, setTorchActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameraError, setCameraError] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

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

  // Tactical Web Audio Beep Generator
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.warn('Audio Context error', e);
    }
  };

  const processScannedCode = (code: string) => {
    let targetCode = code.trim().toUpperCase();
    setScanError('');
    playBeep();

    // Check if QR code is old Full JSON format
    if (code.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(code);
        if (parsed.reelNo) {
          targetCode = String(parsed.reelNo).trim().toUpperCase();
        }
      } catch (e) {
        console.warn('Scanned text is not valid JSON, using raw value');
      }
    }

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

  // Setup live camera scanner using direct Html5Qrcode instance
  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      if (!isScanning || scanResult) return;

      try {
        setCameraError('');
        if (html5QrCodeRef.current) {
          try {
            await html5QrCodeRef.current.stop();
          } catch (_) {}
          html5QrCodeRef.current = null;
        }

        const qrScanner = new Html5Qrcode('pure-camera-viewfinder');
        html5QrCodeRef.current = qrScanner;

        await qrScanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (isMounted) {
              processScannedCode(decodedText);
              setIsScanning(false);
              setIsCameraActive(false);
              qrScanner.stop().catch(() => {});
            }
          },
          () => {
            // Scanning frame...
          }
        );

        if (isMounted) {
          setIsCameraActive(true);
        }
      } catch (err: any) {
        console.warn('Camera scanner init error:', err);
        if (isMounted) {
          setIsCameraActive(false);
          setCameraError(
            err?.message?.includes('Permission')
              ? 'Camera permission required. Please allow camera access.'
              : 'Could not start camera. Tap Start Camera to activate.'
          );
        }
      }
    };

    const timer = setTimeout(startScanner, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
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

      playBeep();
      setShowDispatchModal(false);
      setToastMsg(`Reel ${scanResult.reel.reelNo} dispatched to ${partyObj?.name || 'Customer'}! Stock decremented.`);
      setTimeout(() => setToastMsg(''), 4000);
      handleResetScanner();
    } catch (err: any) {
      setDispatchError(err.message || 'Failed to dispatch reel.');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center font-sans p-2 sm:p-4 relative select-none text-left">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-full shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. DUAL MODE: CAMERA SCANNER & MANUAL TYPE SEARCH */}
      {!scanResult ? (
        <div className="w-full neumorphic-card rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
          
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider block">
                  Industrial Reel Scanner
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">Live Camera &amp; Barcode Reader</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              Scanner Ready
            </span>
          </div>

          {/* Camera Viewfinder with Modern Laser Frame Overlay */}
          <div className="relative overflow-hidden rounded-2xl bg-[#090D16] shadow-2xl border border-slate-800 min-h-[260px] sm:min-h-[300px] flex items-center justify-center">
            
            {/* HTML5 QR Code Mount */}
            <div id="pure-camera-viewfinder" className="w-full h-full min-h-[260px] z-10 flex items-center justify-center [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_video]:rounded-2xl" />

            {/* Error or Permission Retry Banner */}
            {cameraError && !isCameraActive && (
              <div className="absolute inset-0 z-25 flex flex-col items-center justify-center p-4 bg-slate-950/85 text-center space-y-3">
                <Camera className="h-10 w-10 text-[#7C3AED] animate-bounce" />
                <p className="text-xs font-semibold text-slate-300 max-w-xs">{cameraError}</p>
                <button
                  type="button"
                  onClick={() => {
                    setCameraError('');
                    setIsScanning(false);
                    setTimeout(() => setIsScanning(true), 150);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-[#6C4FE0] to-[#7C3AED] text-white text-xs font-bold rounded-xl shadow-lg hover:opacity-95 transition cursor-pointer flex items-center gap-2"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Start Camera / Allow Access</span>
                </button>
              </div>
            )}

            {/* Target Laser Box Overlay */}
            {isCameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl">
                  {/* 4 Corner Markers */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-sky-400 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-sky-400 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-sky-400 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-sky-400 rounded-br-xl" />

                  {/* Animated Laser Sweep Line */}
                  <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_12px_#38BDF8] animate-pulse" style={{ top: '50%' }} />
                </div>
              </div>
            )}

            {/* Viewfinder Bottom Controls Bar */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-30 pointer-events-auto">
              <button
                type="button"
                onClick={() => {
                  setTorchActive(!torchActive);
                  setToastMsg(torchActive ? 'Torch Turned OFF' : 'Torch Turned ON');
                  setTimeout(() => setToastMsg(''), 2000);
                }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold backdrop-blur-md border flex items-center gap-1.5 transition cursor-pointer ${
                  torchActive
                    ? 'bg-amber-400 text-slate-900 border-amber-300'
                    : 'bg-white/15 text-white border-white/20 hover:bg-white/25'
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Torch {torchActive ? 'ON' : 'OFF'}</span>
              </button>

              <span className="text-[11px] font-bold text-white/70 hidden sm:inline">Aim at Reel QR Code</span>

              <button
                type="button"
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  if (!soundEnabled) playBeep();
                }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold backdrop-blur-md border flex items-center gap-1.5 transition cursor-pointer ${
                  soundEnabled
                    ? 'bg-sky-400 text-slate-950 border-sky-300'
                    : 'bg-white/15 text-white/70 border-white/20'
                }`}
              >
                {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                <span>Beep {soundEnabled ? 'ON' : 'Muted'}</span>
              </button>
            </div>
          </div>

          {/* MANUAL TYPE / BARCODE GUN SEARCH SECTION */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-700 dark:text-slate-300 uppercase text-[11px] tracking-wider">
                Manual Entry / Barcode Gun
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">Fast Search</span>
            </div>

            <form onSubmit={handleManualSearch} className="flex gap-2">
              <input
                type="text"
                value={manualCodeInput}
                onChange={e => setManualCodeInput(e.target.value)}
                placeholder="Type or scan barcode (e.g. RL-1048)..."
                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase placeholder:normal-case font-mono"
              />
              <button
                type="submit"
                className="btn-primary-gradient px-5 py-3 text-xs uppercase tracking-wider shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <Search className="h-4 w-4" />
                <span>Search</span>
              </button>
            </form>

            {/* Quick Stock Selector */}
            {reelsList.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recent Stock Quick Pick:</div>
                <select
                  onChange={e => {
                    if (e.target.value) {
                      processScannedCode(e.target.value);
                      setIsScanning(false);
                    }
                  }}
                  defaultValue=""
                  className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="" disabled>-- Or Select Reel directly from Stock --</option>
                  {reelsList.slice(-20).reverse().map(r => (
                    <option key={r.reelNo} value={r.reelNo}>
                      {r.reelNo} &bull; {r.product} &bull; {r.weight}kg ({r.status})
                    </option>
                  ))}
                </select>
              </div>
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
        <div className="w-full bg-white dark:bg-surface-dark border-2 border-blue-500 dark:border-blue-500 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
          
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider block">
                  Reel Verified in Stock
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">Ready for Loading Sheet</span>
              </div>
            </div>
            <button onClick={handleResetScanner} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Reel Header & Weight Badge */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">REEL IDENTIFIER</span>
              <span className="text-xl font-black font-mono text-blue-600 dark:text-blue-400">{scanResult.code}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">NET WEIGHT</span>
              <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {scanResult.reel ? `${scanResult.reel.weight.toLocaleString()} KG` : 'N/A'}
              </span>
            </div>
          </div>

          {/* ITEM DETAILS SPECS GRID */}
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
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Product Quality</span>
                  <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">{scanResult.reel.product}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">GSM &amp; Deckle</span>
                  <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">{scanResult.reel.gsm} GSM &bull; {scanResult.reel.size} cm</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Production Date</span>
                  <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">{scanResult.reel.productionDate || 'Today'}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">QC Clearance</span>
                  <span className={`font-black mt-0.5 block ${scanResult.reel.status === 'DISPATCHED' ? 'text-purple-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {scanResult.reel.status === 'DISPATCHED' ? 'ALREADY DISPATCHED' : `Grade ${scanResult.reel.qcGrade} Passed`}
                  </span>
                </div>
              </div>
            )
          ) : (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 rounded-2xl text-xs font-bold border border-amber-200">
              Scanned code &quot;{scanResult.code}&quot; is not registered in active stock.
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="space-y-2 pt-2">
            {scanResult.reel && scanResult.reel.status !== 'DISPATCHED' && (
              <button
                type="button"
                onClick={() => setShowDispatchModal(true)}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3.5 px-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Truck className="h-4 w-4" />
                <span>Quick Dispatch This Reel Now (Auto-Minus)</span>
              </button>
            )}

            {/* Print Reel QR Label Button */}
            {onOpenPrintStudio && (
              <button
                type="button"
                onClick={() => onOpenPrintStudio(scanResult.reel, scanResult.code)}
                className="btn-primary-gradient w-full py-3 px-4 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <Tag className="h-4 w-4" />
                <span>Print Reel Barcode / QR Label</span>
              </button>
            )}

            <div className="flex gap-2">
              {scanResult.reel && !isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold py-2.5 px-3 rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit Specs</span>
                </button>
              )}

              <button
                onClick={() => navigate('/traceability')}
                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold py-2.5 px-3 rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
              >
                <span>Traceability</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              onClick={handleResetScanner}
              className="w-full bg-slate-50 dark:bg-slate-900 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-extrabold py-2.5 px-4 rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Scan Next Reel</span>
            </button>
          </div>

        </div>
      )}

      {/* QUICK DISPATCH MODAL POPUP */}
      {showDispatchModal && scanResult?.reel && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-dark rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            
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
                  className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold dark:text-white cursor-pointer"
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
                  className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold dark:text-white cursor-pointer"
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.vehicleNo}>{v.vehicleNo} ({v.driverName})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="btn-primary-gradient w-full py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
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
