import React, { useState, useMemo } from 'react';
import { getReels } from '../../data/index';
import type { Reel } from '../../data/types';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Box,
  Layers,
  Sparkles,
  Printer,
  X,
  ChevronDown,
} from 'lucide-react';

export const LabelStudioView: React.FC = () => {
  const reelsList = useMemo(() => getReels(), []);

  // Category Tabs State
  const [activeTab, setActiveTab] = useState<'reel' | 'warehouse' | 'raw_material' | 'custom'>('reel');

  // Handle Tab Switch Presets
  const handleTabSwitch = (tab: 'reel' | 'warehouse' | 'raw_material' | 'custom') => {
    setActiveTab(tab);
    if (tab === 'reel') {
      setBarcodeNo('260500571');
      setQrCodeEmbedValue('260500571');
      setProductTitle('Napkin Tissue');
      setGsm('22');
      setSizeWidth('27');
      setNetWeightKg('1200');
    } else if (tab === 'warehouse') {
      setBarcodeNo('BAY-A1-04');
      setQrCodeEmbedValue('LOCATION: BAY-A1-SECTION-04');
      setProductTitle('Finished Stock Warehouse North');
      setGsm('50 T');
      setSizeWidth('Rack #4');
      setNetWeightKg('15000');
    } else if (tab === 'raw_material') {
      setBarcodeNo('LOT-WASTE-202608');
      setQrCodeEmbedValue('LOT-WASTE-202608');
      setProductTitle('Indian Tissue Waste');
      setGsm('85%');
      setSizeWidth('Bale Set A');
      setNetWeightKg('25000');
    } else {
      setBarcodeNo('CUST-STICKER-01');
      setQrCodeEmbedValue('CUST-STICKER-01');
      setProductTitle('Custom Identification Tag');
      setGsm('Standard');
      setSizeWidth('Custom');
      setNetWeightKg('500');
    }
  };

  // Form Fields State
  const [selectedReelNo, setSelectedReelNo] = useState<string>(reelsList[0]?.reelNo || '260500571');
  const [barcodeNo, setBarcodeNo] = useState('260500571');
  const [qrCodeEmbedValue, setQrCodeEmbedValue] = useState('260500571');
  const [productTitle, setProductTitle] = useState('Napkin Tissue');
  const [gsm, setGsm] = useState('22');
  const [sizeWidth, setSizeWidth] = useState('27');
  const [netWeightKg, setNetWeightKg] = useState('1200');
  const [qcStatus, setQcStatus] = useState('Grade PENDING - PASSED');
  const [prodDateTime, setProdDateTime] = useState('2026-08-16 17:00');
  const [notesInstructions, setNotesInstructions] = useState('Standard Tissue Reel • Wrap Sealed');

  // Label Size & Print Copies
  const [labelSize, setLabelSize] = useState('4" x 6" (Thermal Sticker 100x150mm)');
  const [copies, setCopies] = useState<number>(1);

  // Handle Reel Select Change
  const handleSelectReelFromStock = (reelNo: string) => {
    setSelectedReelNo(reelNo);
    const found = reelsList.find(r => r.reelNo === reelNo);
    if (found) {
      setBarcodeNo(found.reelNo);
      setQrCodeEmbedValue(found.reelNo);
      setProductTitle(found.product);
      setGsm(String(found.gsm));
      setSizeWidth(String(found.size));
      setNetWeightKg(String(found.weight));
      setQcStatus(found.status === 'QC_FAILED' ? 'Grade B - REJECTED' : 'Grade PENDING - PASSED');
      setProdDateTime(`${(found.productionDate || '2026-08-16').substring(0, 10)} 17:00`);
    }
  };

  const handlePrintLabel = () => {
    window.print();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 pb-24 text-slate-100 w-full max-w-7xl mx-auto font-sans">
      {/* 1. Top Category Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto bg-[#0b1329] p-2 rounded-2xl border border-slate-800/80 shadow-lg custom-scrollbar">
        <button
          onClick={() => handleTabSwitch('reel')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'reel'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <QrCode className="h-4 w-4" />
          <span>Paper Reel Label</span>
        </button>

        <button
          onClick={() => handleTabSwitch('warehouse')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'warehouse'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Box className="h-4 w-4" />
          <span>Warehouse Bay / Stock Tag</span>
        </button>

        <button
          onClick={() => handleTabSwitch('raw_material')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'raw_material'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Raw Material Lot</span>
        </button>

        <button
          onClick={() => handleTabSwitch('custom')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'custom'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Custom / Free-form Sticker</span>
        </button>
      </div>

      {/* 2. Main Studio 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* LOAD EXISTING REEL FROM STOCK */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              LOAD EXISTING REEL FROM STOCK
            </label>
            <div className="relative">
              <select
                value={selectedReelNo}
                onChange={e => handleSelectReelFromStock(e.target.value)}
                className="w-full p-3.5 bg-[#0e172e] border border-slate-700/80 text-white rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer appearance-none pr-10"
              >
                {reelsList.map(reel => (
                  <option key={reel.reelNo} value={reel.reelNo}>
                    {reel.reelNo} • {reel.product} ({reel.weight} kg)
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Row 2: REEL / BARCODE NO & QR CODE EMBED VALUE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                REEL / BARCODE NO
              </label>
              <input
                type="text"
                value={barcodeNo}
                onChange={e => setBarcodeNo(e.target.value)}
                className="w-full p-3 bg-[#0e172e] border border-slate-700/80 text-white rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                QR CODE EMBED VALUE
              </label>
              <input
                type="text"
                value={qrCodeEmbedValue}
                onChange={e => setQrCodeEmbedValue(e.target.value)}
                className="w-full p-3 bg-[#0e172e] border border-slate-700/80 text-white rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 3: PRODUCT TITLE / DESCRIPTION */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              PRODUCT TITLE / DESCRIPTION
            </label>
            <input
              type="text"
              value={productTitle}
              onChange={e => setProductTitle(e.target.value)}
              className="w-full p-3 bg-[#0e172e] border border-slate-700/80 text-white rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Row 4: GSM, SIZE / WIDTH, NET WEIGHT (KG) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                GSM
              </label>
              <input
                type="text"
                value={gsm}
                onChange={e => setGsm(e.target.value)}
                className="w-full p-3 bg-[#0e172e] border border-slate-700/80 text-white rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                SIZE / WIDTH
              </label>
              <input
                type="text"
                value={sizeWidth}
                onChange={e => setSizeWidth(e.target.value)}
                className="w-full p-3 bg-[#0e172e] border border-slate-700/80 text-white rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                NET WEIGHT (KG)
              </label>
              <input
                type="text"
                value={netWeightKg}
                onChange={e => setNetWeightKg(e.target.value)}
                className="w-full p-3 bg-[#0e172e] border border-slate-700/80 text-white rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>



          {/* Row 7: Label Size & Copies */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="text-xs font-bold text-slate-400 whitespace-nowrap">
                Label Size:
              </label>
              <select
                value={labelSize}
                onChange={e => setLabelSize(e.target.value)}
                className="p-2.5 bg-[#0e172e] border border-slate-700/80 text-white rounded-xl text-xs font-bold cursor-pointer focus:outline-none"
              >
                <option value='4" x 6" (Thermal Sticker 100x150mm)'>
                  4" x 6" (Thermal Sticker 100x150mm)
                </option>
                <option value='3" x 4" (Compact Sticker 75x100mm)'>
                  3" x 4" (Compact Sticker 75x100mm)
                </option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Copies:</span>
              {[1, 2, 4].map(c => (
                <button
                  key={c}
                  onClick={() => setCopies(c)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                    copies === c
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-[#0e172e] border border-slate-700/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {c}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Thermal Sticker Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-blue-400">
              LIVE STICKER PREVIEW (4X6 INCH THERMAL)
            </span>
          </div>

          {/* Thermal Sticker Printable Card (Exact Match to User Image) */}
          <div
            id="printable-label-card"
            className="w-full max-w-[340px] bg-white text-slate-950 p-6 rounded-3xl shadow-2xl space-y-5 text-center flex flex-col items-center justify-center border border-slate-200/90 mx-auto"
          >
            {/* 1. Header: SAHEB PAPER PVT. LTD. */}
            <div className="border-b-2 border-slate-950 pb-3 w-full">
              <h2 className="text-base sm:text-lg font-black tracking-wide uppercase text-slate-950 leading-tight">
                SAHEB PAPER PVT. LTD.
              </h2>
            </div>

            {/* 2. QR Code Frame (Rounded Card matching image) */}
            <div className="p-3 bg-white border border-slate-200/90 rounded-3xl flex flex-col items-center justify-center shadow-xs my-1">
              <QRCodeSVG
                value={qrCodeEmbedValue || barcodeNo || 'RL-975'}
                size={165}
                level="L"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>

            {/* 3. QR Code Name */}
            <div className="pt-2 border-t border-slate-100 w-full">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                QR CODE NAME
              </p>
              <p className="text-xl font-black font-mono text-slate-950 mt-0.5 tracking-wider">
                {barcodeNo || '260500571'}
              </p>
            </div>
          </div>

          {/* Action Buttons Below Preview */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handlePrintLabel}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-xl shadow-blue-600/30 transition cursor-pointer active:scale-98"
            >
              <Printer className="h-5 w-4" />
              <span>PRINT {copies}X LABEL NOW</span>
            </button>

            <button
              onClick={() => window.history.back()}
              className="w-full text-center text-xs font-bold text-slate-400 hover:text-white transition py-1 cursor-pointer"
            >
              CLOSE STUDIO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
