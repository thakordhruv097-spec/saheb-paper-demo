import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getReels, getRolls, getRawMaterialLots, getBoilerLogs } from '../../data/index';
import type { Reel, RawMaterialLot, BoilerLog } from '../../data/types';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, CheckCircle, RefreshCw, ArrowRight, X } from 'lucide-react';

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
      const reelsList = getReels();
      const foundReel = reelsList.find(r => r.reelNo.trim().toUpperCase() === targetCode);
      if (foundReel) {
        setScanResult({ code: targetCode, type: 'REEL', reel: foundReel });
      } else {
        setScanResult({ code: targetCode, type: 'REEL' });
      }
    }
  };

  // Setup camera scanner automatically
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
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center font-sans p-4 relative select-none">

      {/* Pure Camera Scanner Viewfinder */}
      {!scanResult ? (
        <div className="w-full max-w-md bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-2xl text-center space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-primary dark:text-blue-400">
                <Camera className="h-5 w-5" />
              </div>
              <span className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                Live QR Camera Scanner
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider animate-pulse">
              Camera Ready
            </span>
          </div>

          {/* Viewfinder Container */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-slate-900 shadow-inner">
            <div id="pure-camera-viewfinder" className="w-full min-h-[300px]" />
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Point smartphone camera directly at paper reel QR label or material lot barcode.
          </p>
        </div>
      ) : (
        /* Instant Scan Result Popup Card */
        <div className="w-full max-w-md bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-5 w-5" />
              </div>
              <span className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                QR Code Scanned Successfully!
              </span>
            </div>
            <button onClick={handleResetScanner} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Code Badge */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Scanned Barcode / QR</span>
            <div className="text-lg font-black font-mono text-primary dark:text-blue-400 break-all">{scanResult.code}</div>
          </div>

          {/* Item details if found */}
          {scanResult.reel && (
            <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Product</span>
                <span className="font-bold text-slate-900 dark:text-white">{scanResult.reel.product}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Size & GSM</span>
                <span className="font-bold text-slate-900 dark:text-white">{scanResult.reel.size} cm • {scanResult.reel.gsm} GSM</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Weight</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{scanResult.reel.weight} kg</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">QC Grade</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">Grade {scanResult.reel.qcGrade}</span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => navigate('/traceability')}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-3 px-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Open Full Traceability Audit</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={handleResetScanner}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2.5 px-4 rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Scan Next Item</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
export default QRScannerView;
