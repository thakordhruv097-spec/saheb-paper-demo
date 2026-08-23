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
  ChevronDown,
} from 'lucide-react';
import { COMPANY_CONFIG } from '../../config/company';

export const LabelStudioView: React.FC = () => {
  const reelsList = useMemo(() => {
    const all = getReels();
    const seen = new Set<string>();
    const unique = all.filter(r => {
      if (!r.reelNo || seen.has(r.reelNo)) return false;
      seen.add(r.reelNo);
      return true;
    });
    // Most recent reel is 1st (newest date / highest reel sequence)
    return unique.sort((a, b) => {
      if (a.productionDate && b.productionDate && a.productionDate !== b.productionDate) {
        return b.productionDate.localeCompare(a.productionDate);
      }
      return b.reelNo.localeCompare(a.reelNo, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, []);

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

  // Label Size, Print Copies, and System Mode (Test ID-only vs Old Full JSON)
  const [labelSize, setLabelSize] = useState('4" x 6" (Thermal Sticker 100x150mm)');
  const [copies, setCopies] = useState<number>(1);
  const [qrEncodingMode, setQrEncodingMode] = useState<'id_only' | 'full_json'>('id_only');

  const computedQrValue = useMemo(() => {
    if (qrEncodingMode === 'full_json') {
      return JSON.stringify({
        mill: COMPANY_CONFIG.name,
        reelNo: barcodeNo || '260500571',
        product: productTitle || 'Napkin Tissue',
        gsm: gsm || '22',
        size: sizeWidth || '27',
        weight: netWeightKg || '1200',
        date: '2026-08-16',
      });
    }
    return qrCodeEmbedValue || barcodeNo || '260500571';
  }, [qrEncodingMode, barcodeNo, qrCodeEmbedValue, productTitle, gsm, sizeWidth, netWeightKg]);

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
    <>
      {/* 1. ON-SCREEN INTERACTIVE STUDIO (HIDDEN DURING PRINT) */}
      <div className="print:hidden space-y-6 p-4 sm:p-6 pb-24 text-slate-900 dark:text-slate-100 w-full max-w-7xl mx-auto font-sans">
        {/* Category Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto bg-slate-100 dark:bg-[#131d38] p-2 rounded-2xl border border-slate-200/80 dark:border-[#203058] shadow-xs custom-scrollbar">
          <button
            onClick={() => handleTabSwitch('reel')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition cursor-pointer shrink-0 ${
              activeTab === 'reel'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-[#1b2a4e]/60'
            }`}
          >
            <QrCode className="h-4 w-4" />
            <span>Paper Reel Label</span>
          </button>

          <button
            onClick={() => handleTabSwitch('warehouse')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition cursor-pointer shrink-0 ${
              activeTab === 'warehouse'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-[#1b2a4e]/60'
            }`}
          >
            <Box className="h-4 w-4" />
            <span>Warehouse Bay / Stock Tag</span>
          </button>

          <button
            onClick={() => handleTabSwitch('raw_material')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition cursor-pointer shrink-0 ${
              activeTab === 'raw_material'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-[#1b2a4e]/60'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Raw Material Lot</span>
          </button>

          <button
            onClick={() => handleTabSwitch('custom')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition cursor-pointer shrink-0 ${
              activeTab === 'custom'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-[#1b2a4e]/60'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Custom / Free-form Sticker</span>
          </button>
        </div>

        {/* Main Studio 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-5 bg-white dark:bg-[#131d38] border border-slate-200/90 dark:border-[#203058] rounded-3xl p-6 shadow-sm">
            {/* LOAD EXISTING REEL FROM STOCK */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1.5">
                LOAD EXISTING REEL FROM STOCK
              </label>
              <div className="relative">
                <select
                  value={selectedReelNo}
                  onChange={e => handleSelectReelFromStock(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-[#203058] text-slate-900 dark:text-white rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer appearance-none pr-10 focus:bg-white dark:focus:bg-[#0d1527] transition"
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
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1.5">
                  REEL / BARCODE NO
                </label>
                <input
                  type="text"
                  value={barcodeNo}
                  onChange={e => setBarcodeNo(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-[#203058] text-slate-900 dark:text-white rounded-2xl text-xs font-bold font-mono focus:ring-2 focus:ring-primary focus:outline-none focus:bg-white dark:focus:bg-[#0d1527] transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1.5">
                  QR CODE EMBED VALUE
                </label>
                <input
                  type="text"
                  value={qrCodeEmbedValue}
                  onChange={e => setQrCodeEmbedValue(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-[#203058] text-slate-900 dark:text-white rounded-2xl text-xs font-bold font-mono focus:ring-2 focus:ring-primary focus:outline-none focus:bg-white dark:focus:bg-[#0d1527] transition"
                />
              </div>
            </div>

            {/* Row 3: PRODUCT TITLE / DESCRIPTION */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1.5">
                PRODUCT TITLE / DESCRIPTION
              </label>
              <input
                type="text"
                value={productTitle}
                onChange={e => setProductTitle(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-[#203058] text-slate-900 dark:text-white rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary focus:outline-none focus:bg-white dark:focus:bg-[#0d1527] transition"
              />
            </div>

            {/* Row 4: GSM, SIZE / WIDTH, NET WEIGHT (KG) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1.5">
                  GSM
                </label>
                <input
                  type="text"
                  value={gsm}
                  onChange={e => setGsm(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-[#203058] text-slate-900 dark:text-white rounded-2xl text-xs font-bold font-mono focus:ring-2 focus:ring-primary focus:outline-none focus:bg-white dark:focus:bg-[#0d1527] transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1.5">
                  SIZE / WIDTH
                </label>
                <input
                  type="text"
                  value={sizeWidth}
                  onChange={e => setSizeWidth(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-[#203058] text-slate-900 dark:text-white rounded-2xl text-xs font-bold font-mono focus:ring-2 focus:ring-primary focus:outline-none focus:bg-white dark:focus:bg-[#0d1527] transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1.5">
                  NET WEIGHT (KG)
                </label>
                <input
                  type="text"
                  value={netWeightKg}
                  onChange={e => setNetWeightKg(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-[#203058] text-slate-900 dark:text-white rounded-2xl text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-primary focus:outline-none focus:bg-white dark:focus:bg-[#0d1527] transition"
                />
              </div>
            </div>

            {/* Row 7: Label Size, Mode Toggle & Copies */}
            <div className="space-y-4 pt-4 border-t border-slate-200/80 dark:border-[#203058]">
              {/* System Mode Switcher (Test ID-Only vs Old System) */}
              <div className="p-3.5 bg-blue-50/70 dark:bg-[#0d1527] border border-blue-200/80 dark:border-[#203058] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    QR Encoding Mode:
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    {qrEncodingMode === 'id_only'
                      ? '⚡ Test System: Encodes only ID (260500571) for instant backend lookup'
                      : '📦 Old System: Encodes full JSON text payload into QR code'}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 bg-white dark:bg-[#131d38] p-1 rounded-xl border border-slate-200 dark:border-[#203058] shadow-2xs">
                  <button
                    onClick={() => setQrEncodingMode('id_only')}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      qrEncodingMode === 'id_only'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    ⚡ ID-Only (Test System)
                  </button>

                  <button
                    onClick={() => setQrEncodingMode('full_json')}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      qrEncodingMode === 'full_json'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    📦 Full Payload (Old System)
                  </button>
                </div>
              </div>

              {/* Row: Label Output Size & Batch Print Copies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Label Output Format / Size Card */}
                <div className="p-3 bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-[#203058] rounded-2xl space-y-1.5">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300">
                    Label Output Size
                  </label>
                  <div className="relative">
                    <select
                      value={labelSize}
                      onChange={e => setLabelSize(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-[#131d38] border border-slate-200 dark:border-[#203058] text-slate-900 dark:text-white rounded-xl text-xs font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary transition appearance-none pr-8"
                    >
                      <option value='4" x 6" (Thermal Sticker 100x150mm)'>
                        4" x 6" (Thermal Sticker 100×150mm)
                      </option>
                      <option value='3" x 4" (Compact Sticker 75x100mm)'>
                        3" x 4" (Compact Sticker 75×100mm)
                      </option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Print Quantity / Copies Card */}
                <div className="p-3 bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-[#203058] rounded-2xl space-y-1.5 flex flex-col justify-between">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300">
                    Print Copies
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 4, 8].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCopies(c)}
                        className={`flex-1 py-2 rounded-xl font-black text-xs transition cursor-pointer text-center ${
                          copies === c
                            ? 'bg-[#0F52BA] text-white shadow-md shadow-blue-600/30'
                            : 'bg-white dark:bg-[#131d38] border border-slate-200 dark:border-[#203058] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1e2d54]'
                        }`}
                      >
                        {c}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Thermal Sticker Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-primary dark:text-blue-400">
                LIVE STICKER PREVIEW (4X6 INCH THERMAL)
              </span>
            </div>

            {/* Thermal Sticker Printable Card (Large QR Code, Zero Blank Space) */}
            <div
              id="printable-label-card"
              className="w-full max-w-[280px] bg-white text-slate-950 p-4 rounded-2xl shadow-xl space-y-3 text-center flex flex-col items-center justify-center border-2 border-slate-950 mx-auto"
            >
              {/* 1. Header: SAHEB PAPER PVT. LTD. */}
              <div className="border-b-2 border-slate-950 pb-2 w-full">
                <h2 className="text-base font-black tracking-wide uppercase text-slate-950 leading-tight font-heading">
                  {COMPANY_CONFIG.name}
                </h2>
              </div>

              {/* 2. Edge-to-Edge Large QR Code (No white blank space) */}
              <div className="w-full flex items-center justify-center py-1">
                <QRCodeSVG
                  value={computedQrValue}
                  size={230}
                  level="L"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>

              {/* 3. QR Code Name */}
              <div className="pt-2 border-t-2 border-slate-950 w-full">
                <p className="text-xs font-black uppercase tracking-widest text-slate-700">
                  QR CODE NAME
                </p>
                <p className="text-2xl font-black font-mono text-slate-950 mt-1 tracking-wider">
                  {barcodeNo || '260500571'}
                </p>
              </div>
            </div>

            {/* Action Buttons Below Preview */}
            <div className="pt-2">
              <button
                onClick={handlePrintLabel}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-[#008163] hover:bg-[#006e54] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#008163]/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>PRINT {copies}X LABEL NOW</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DEDICATED PRINT OUTPUT (ALL COPIES GUARANTEED ON ONE SINGLE A4 PAGE) */}
      <div
        id="printable-label-studio-output"
        className="hidden print:block w-full bg-white text-black"
        style={{
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: '185mm',
          margin: '0 auto',
          padding: '0',
        }}
      >
        {/* 1 COPY: 1 Card Centered on Single Page */}
        {copies === 1 && (
          <div className="flex items-center justify-center min-h-[250mm] w-full max-w-[185mm] mx-auto">
            <div
              className="printable-qr-slip bg-white text-slate-950 p-6 rounded-2xl border-2 border-slate-950 text-center flex flex-col items-center justify-between mx-auto"
              style={{ width: '135mm', height: '185mm', boxSizing: 'border-box' }}
            >
              <div className="border-b-2 border-slate-950 pb-3 w-full text-center">
                <h2 className="text-lg font-black tracking-wider uppercase text-slate-950 leading-tight font-heading">
                  {COMPANY_CONFIG.name}
                </h2>
              </div>
              <div className="w-full flex items-center justify-center py-3">
                <QRCodeSVG
                  value={computedQrValue}
                  size={240}
                  level="M"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
              <div className="pt-3 pb-1 border-t-2 border-slate-950 w-full text-center">
                <p className="text-sm font-black uppercase tracking-widest text-slate-700 leading-tight">
                  QR CODE NAME
                </p>
                <p className="text-3xl font-black font-mono text-slate-950 mt-1 tracking-wider leading-tight">
                  {barcodeNo || '260500571'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2 COPIES: 2 Cards Side-by-Side on Single Page */}
        {copies === 2 && (
          <div className="grid grid-cols-2 gap-4 w-full max-w-[185mm] mx-auto pt-6">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="printable-qr-slip bg-white text-slate-950 p-4 rounded-2xl border-2 border-slate-950 text-center flex flex-col items-center justify-between mx-auto w-full"
                style={{ height: '140mm', boxSizing: 'border-box' }}
              >
                <div className="border-b-2 border-slate-950 pb-2 w-full text-center">
                  <h2 className="text-base font-black tracking-wide uppercase text-slate-950 leading-tight font-heading">
                    {COMPANY_CONFIG.name}
                  </h2>
                </div>
                <div className="w-full flex items-center justify-center py-2">
                  <QRCodeSVG
                    value={computedQrValue}
                    size={175}
                    level="M"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>
                <div className="pt-2 pb-1 border-t-2 border-slate-950 w-full text-center">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-700 leading-tight">
                    QR CODE NAME
                  </p>
                  <p className="text-2xl font-black font-mono text-slate-950 mt-1 tracking-wider leading-tight">
                    {barcodeNo || '260500571'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4 COPIES: 4 Cards in a 2x2 Grid on Single Page */}
        {copies === 4 && (
          <div className="grid grid-cols-2 gap-3 w-full max-w-[185mm] mx-auto pt-1">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="printable-qr-slip bg-white text-slate-950 p-3 rounded-2xl border-2 border-slate-950 text-center flex flex-col items-center justify-between mx-auto w-full"
                style={{ height: '112mm', boxSizing: 'border-box' }}
              >
                <div className="border-b-2 border-slate-950 pb-1.5 w-full text-center">
                  <h2 className="text-sm font-black tracking-wide uppercase text-slate-950 leading-tight font-heading">
                    {COMPANY_CONFIG.name}
                  </h2>
                </div>
                <div className="w-full flex items-center justify-center py-1">
                  <QRCodeSVG
                    value={computedQrValue}
                    size={135}
                    level="M"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>
                <div className="pt-1.5 pb-0.5 border-t-2 border-slate-950 w-full text-center">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-700 leading-tight">
                    QR CODE NAME
                  </p>
                  <p className="text-xl font-black font-mono text-slate-950 mt-0.5 tracking-wider leading-tight">
                    {barcodeNo || '260500571'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 8 COPIES: 8 Cards in a 2x4 Grid on Single Page */}
        {copies === 8 && (
          <div className="grid grid-cols-2 gap-2 w-full max-w-[185mm] mx-auto pt-1">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="printable-qr-slip bg-white text-slate-950 p-2 rounded-xl border border-slate-950 text-center flex flex-col items-center justify-between mx-auto w-full"
                style={{ height: '56mm', boxSizing: 'border-box' }}
              >
                <div className="border-b border-slate-950 pb-0.5 w-full text-center">
                  <h2 className="text-[10px] font-black tracking-wide uppercase text-slate-950 leading-none font-heading">
                    {COMPANY_CONFIG.name}
                  </h2>
                </div>
                <div className="w-full flex items-center justify-center py-0.5">
                  <QRCodeSVG
                    value={computedQrValue}
                    size={75}
                    level="M"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>
                <div className="pt-0.5 border-t border-slate-950 w-full flex items-center justify-center gap-1.5 text-center">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-700">
                    QR NAME:
                  </span>
                  <span className="text-xs font-black font-mono text-slate-950 tracking-wider">
                    {barcodeNo || '260500571'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
