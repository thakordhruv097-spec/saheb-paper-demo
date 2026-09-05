import React, { useState, useMemo } from 'react';
import { getReels } from '../../data/index';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Box,
  Layers,
  Sparkles,
  Printer,
  ChevronDown,
  Check,
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

  // Form Fields State
  const [selectedReelNo, setSelectedReelNo] = useState<string>(reelsList[0]?.reelNo || '260500571');
  const [barcodeNo, setBarcodeNo] = useState('260500571');
  const [qrCodeEmbedValue, setQrCodeEmbedValue] = useState('260500571');
  const [productTitle, setProductTitle] = useState('Napkin Tissue (Virgin Pulp)');
  const [gsm, setGsm] = useState('16.0');
  const [sizeWidth, setSizeWidth] = useState('30.0 cm');
  const [ply, setPly] = useState('2 Ply');
  const [joint, setJoint] = useState('0 (Seamless)');
  const [dia, setDia] = useState('1150 mm');
  const [core, setCore] = useState('76 mm (3")');
  const [netWeightKg, setNetWeightKg] = useState('1,200');
  const [machine, setMachine] = useState('Rewinder #2');
  const [shift, setShift] = useState('Shift A');
  const [operator, setOperator] = useState('Operator Desk');
  const [qcStatus, setQcStatus] = useState('Grade A - PASSED');
  const [prodDateTime, setProdDateTime] = useState('2026-08-16');
  const [notesInstructions, setNotesInstructions] = useState('Standard Tissue Reel · Wrap Sealed');

  // Label Size, Print Copies, and System Mode (Test ID-only vs Old Full JSON)
  const [labelSize, setLabelSize] = useState<'4x6' | '3x2'>('4x6');
  const [copies, setCopies] = useState<number>(1);
  const [qrEncodingMode, setQrEncodingMode] = useState<'id_only' | 'full_json'>('id_only');

  // Handle Tab Switch Presets
  const handleTabSwitch = (tab: 'reel' | 'warehouse' | 'raw_material' | 'custom') => {
    setActiveTab(tab);
    if (tab === 'reel') {
      setBarcodeNo('260500571');
      setQrCodeEmbedValue('260500571');
      setProductTitle('Napkin Tissue (Virgin Pulp)');
      setGsm('16.0');
      setSizeWidth('30.0 cm');
      setPly('2 Ply');
      setJoint('0 (Seamless)');
      setDia('1150 mm');
      setCore('76 mm (3")');
      setNetWeightKg('1,200');
      setQcStatus('Grade A - PASSED');
      setMachine('Rewinder #2');
      setShift('Shift A');
      setNotesInstructions('Standard Tissue Reel · Wrap Sealed');
    } else if (tab === 'warehouse') {
      setBarcodeNo('BAY-A1-04');
      setQrCodeEmbedValue('LOCATION: BAY-A1-SECTION-04');
      setProductTitle('Finished Stock Warehouse North');
      setGsm('16 GSM');
      setSizeWidth('30 cm');
      setPly('2 Ply');
      setJoint('24 Reels');
      setDia('Bay Stack');
      setCore('Rack #4');
      setNetWeightKg('28,800');
      setQcStatus('Bay A1 to A4 · Verified');
      setMachine('Warehouse Main');
      setShift('General');
      setNotesInstructions('Warehouse Finished Stock Bay Tag');
    } else if (tab === 'raw_material') {
      setBarcodeNo('LOT-WASTE-202608');
      setQrCodeEmbedValue('LOT-WASTE-202608');
      setProductTitle('Indian Tissue Waste Grade A');
      setGsm('85% Fiber');
      setSizeWidth('Bale Set A');
      setPly('Imported');
      setJoint('52 Bales');
      setDia('Bale Unit');
      setCore('Moisture 7.2%');
      setNetWeightKg('25,000');
      setQcStatus('Vendor: Navkar · Accepted');
      setMachine('Inward Yard');
      setShift('General');
      setNotesInstructions('Moisture Tested & QC Clearance Granted');
    } else {
      setBarcodeNo('CUST-TAG-2026');
      setQrCodeEmbedValue('CUST-TAG-2026');
      setProductTitle('Custom Identification Tag');
      setGsm('Standard');
      setSizeWidth('Custom');
      setPly('N/A');
      setJoint('N/A');
      setDia('N/A');
      setCore('Standard');
      setNetWeightKg('500');
      setQcStatus('VERIFIED');
      setMachine('Plant Floor');
      setShift('Shift A');
      setNotesInstructions('General Purpose Plant Asset Sticker');
    }
  };

  const computedQrValue = useMemo(() => {
    if (qrEncodingMode === 'full_json') {
      return JSON.stringify({
        mill: COMPANY_CONFIG.name,
        reelNo: barcodeNo || '260500571',
        product: productTitle || 'Napkin Tissue',
        gsm: gsm || '16.0',
        size: sizeWidth || '30.0',
        weight: netWeightKg || '1200',
        date: prodDateTime || '2026-08-16',
      });
    }
    return qrCodeEmbedValue || barcodeNo || '260500571';
  }, [qrEncodingMode, barcodeNo, qrCodeEmbedValue, productTitle, gsm, sizeWidth, netWeightKg, prodDateTime]);

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
      setPly(`${found.ply || 2} Ply`);
      setJoint(`${found.joint ?? 0} Joints`);
      setDia(`${found.dia || 1150} mm`);
      setCore('76 mm (3")');
      setNetWeightKg(String(found.weight));
      setQcStatus(found.status === 'QC_FAILED' ? 'Grade B - REJECTED' : `Grade ${found.qcGrade || 'A'} - PASSED`);
      setProdDateTime(found.productionDate || new Date().toISOString().substring(0, 10));
    }
  };

  const handlePrintLabel = () => {
    window.print();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 pb-24 text-slate-900 dark:text-slate-100 w-full max-w-7xl mx-auto font-sans">
      {/* 1. Header Card */}
      <div className="bg-white dark:bg-[#131d38] rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-slate-900 dark:text-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/50 text-primary dark:text-blue-400 shadow-2xs shrink-0">
              <QrCode className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
                  QR Label Studio & Barcode Generator
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Modernized industrial sticker print template for Paper Reels, Warehouse Bays, Raw Material Lots, and Assets.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Category Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto bg-slate-100 dark:bg-slate-800/80 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs custom-scrollbar">
        <button
          onClick={() => handleTabSwitch('reel')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'reel'
              ? 'bg-[#6C4FE0] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700/60'
          }`}
        >
          <QrCode className="h-4 w-4" />
          <span>Paper Reel Label</span>
        </button>

        <button
          onClick={() => handleTabSwitch('warehouse')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'warehouse'
              ? 'bg-[#6C4FE0] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700/60'
          }`}
        >
          <Box className="h-4 w-4" />
          <span>Warehouse Bay / Stock Tag</span>
        </button>

        <button
          onClick={() => handleTabSwitch('raw_material')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'raw_material'
              ? 'bg-[#6C4FE0] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700/60'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Raw Material Lot</span>
        </button>

        <button
          onClick={() => handleTabSwitch('custom')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'custom'
              ? 'bg-[#6C4FE0] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700/60'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Custom / Free-form Sticker</span>
        </button>
      </div>

      {/* 3. Main Studio 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4 bg-white dark:bg-[#1a3535] border border-slate-200/90 dark:border-[#2c4a4a] rounded-3xl p-5 sm:p-6 shadow-sm">
          {/* LOAD EXISTING REEL FROM STOCK */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1.5">
              LOAD EXISTING REEL FROM STOCK
            </label>
            <div className="relative">
              <select
                value={selectedReelNo}
                onChange={e => handleSelectReelFromStock(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer appearance-none pr-10 transition"
              >
                {reelsList.map(reel => (
                  <option key={reel.reelNo} value={reel.reelNo}>
                    {reel.reelNo} - {reel.product} ({reel.weight} kg)
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Row 2: REEL / BARCODE NO & QR CODE EMBED VALUE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1.5">
                REEL / BARCODE NO
              </label>
              <input
                type="text"
                value={barcodeNo}
                onChange={e => setBarcodeNo(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-primary focus:outline-none transition"
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
                className="w-full p-2.5 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-primary focus:outline-none transition"
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
              className="w-full p-2.5 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary focus:outline-none transition"
            />
          </div>

          {/* Row 4: GSM, SIZE / WIDTH, NET WEIGHT (KG) */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1">
                GSM
              </label>
              <input
                type="text"
                value={gsm}
                onChange={e => setGsm(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-primary focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1">
                SIZE / WIDTH
              </label>
              <input
                type="text"
                value={sizeWidth}
                onChange={e => setSizeWidth(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-primary focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1">
                NET WEIGHT (KG)
              </label>
              <input
                type="text"
                value={netWeightKg}
                onChange={e => setNetWeightKg(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-primary focus:outline-none transition"
              />
            </div>
          </div>

          {/* Row 5: PLY, JOINTS, DIAMETER */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1">
                PLY
              </label>
              <input
                type="text"
                value={ply}
                onChange={e => setPly(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-primary focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1">
                JOINTS
              </label>
              <input
                type="text"
                value={joint}
                onChange={e => setJoint(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-primary focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1">
                DIAMETER
              </label>
              <input
                type="text"
                value={dia}
                onChange={e => setDia(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-primary focus:outline-none transition"
              />
            </div>
          </div>

          {/* Row 6: QC Status, Date, Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1">
                QC STATUS / GRADE
              </label>
              <input
                type="text"
                value={qcStatus}
                onChange={e => setQcStatus(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1">
                PRODUCTION DATE / TIME
              </label>
              <input
                type="text"
                value={prodDateTime}
                onChange={e => setProdDateTime(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-primary focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1">
              INSTRUCTIONS / DIRECTIVES
            </label>
            <input
              type="text"
              value={notesInstructions}
              onChange={e => setNotesInstructions(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary focus:outline-none transition"
            />
          </div>

          {/* Mode Toggle & Print Size Row */}
          <div className="space-y-3 pt-3 border-t border-slate-200/80 dark:border-[#2c4a4a]">
            <div className="p-3 bg-blue-50/70 dark:bg-[#0f2828] border border-blue-200/80 dark:border-[#2c4a4a] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  QR Encoding Mode:
                </span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  {qrEncodingMode === 'id_only'
                    ? '⚡ Fast Scan ID: Encodes identifier for instant scanner lookup'
                    : '📦 Full JSON: Encodes complete reel specs payload in QR code'}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 bg-white dark:bg-[#1a3535] p-1 rounded-xl border border-slate-200 dark:border-[#2c4a4a] shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQrEncodingMode('id_only')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    qrEncodingMode === 'id_only'
                      ? 'bg-[#6C4FE0] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  ⚡ Fast ID
                </button>

                <button
                  type="button"
                  onClick={() => setQrEncodingMode('full_json')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    qrEncodingMode === 'full_json'
                      ? 'bg-[#6C4FE0] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  📦 Full JSON
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Label Size:
                </label>
                <select
                  value={labelSize}
                  onChange={e => setLabelSize(e.target.value as any)}
                  className="p-1.5 bg-slate-50 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-900 dark:text-white rounded-xl text-xs font-bold cursor-pointer focus:outline-none transition"
                >
                  <option value="4x6">4" x 6" (Thermal Sticker 100x150mm)</option>
                  <option value="3x2">3" x 2" (Standard Tag)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Copies:</span>
                {[1, 2, 4].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCopies(c)}
                    className={`px-3 py-1 rounded-xl font-bold text-xs transition cursor-pointer ${
                      copies === c
                        ? 'bg-[#6C4FE0] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-[#0f2828] border border-slate-200 dark:border-[#2c4a4a] text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {c}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Thermal Sticker Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <span>Live Sticker Preview</span>
            <span className="text-[10px] text-blue-500 font-bold">({labelSize === '4x6' ? '4x6 inch Thermal' : '3x2 inch'})</span>
          </div>

          {/* THE MODERNIZED PRINTABLE STICKER CARD */}
          <div
            id="printable-label-card"
            className="w-full bg-white text-slate-950 border-2 border-slate-900 rounded-2xl p-4 sm:p-5 shadow-2xl text-left select-none print:m-0 print:p-4 print:border-2 print:border-black print:shadow-none print:rounded-none"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              maxWidth: '400px',
            }}
          >
            {/* 1. Header: SAHEB PAPER PVT. LTD. & Quality Badge */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-2 mb-2.5">
              <div>
                <div className="text-xs font-black tracking-tight text-slate-950 uppercase leading-tight font-heading">
                  {COMPANY_CONFIG.name}
                </div>
                <div className="text-[8px] font-bold text-slate-600 mt-0.5 uppercase tracking-wider">
                  Plant: Chandisar, Palanpur
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-950 text-white text-[8px] font-black uppercase tracking-wider">
                  <Check className="h-2.5 w-2.5 text-emerald-400" />
                  <span>{qcStatus || 'QC PASSED'}</span>
                </span>
                <div className="text-[7.5px] font-extrabold text-slate-500 mt-0.5">ISO 9001:2015</div>
              </div>
            </div>

            {/* 2. QR Code & Reel Code Section */}
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-300 rounded-xl p-2.5 mb-2.5">
              <div className="p-1 bg-white border border-slate-900 rounded-lg shrink-0 shadow-2xs flex items-center justify-center">
                <QRCodeSVG
                  value={computedQrValue}
                  size={84}
                  level="M"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  REEL IDENTIFIER / QR CODE
                </div>
                <div className="text-base font-black font-mono tracking-tight text-slate-950 truncate">
                  {barcodeNo}
                </div>
                <div className="text-[11px] font-black text-blue-800 line-clamp-1">
                  {productTitle}
                </div>
                <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-500 pt-0.5">
                  <span>{machine}</span>
                  <span>&bull;</span>
                  <span>{shift}</span>
                </div>
              </div>
            </div>

            {/* 3. 6-Box Technical Specs Matrix */}
            <div className="grid grid-cols-3 gap-1.5 mb-2.5 text-center text-[10px]">
              <div className="p-1.5 bg-slate-100/90 border border-slate-200 rounded-lg">
                <span className="text-[7.5px] font-black text-slate-500 block uppercase tracking-wider">GSM</span>
                <span className="font-black text-slate-950 font-mono text-[11px]">{gsm}</span>
              </div>
              <div className="p-1.5 bg-slate-100/90 border border-slate-200 rounded-lg">
                <span className="text-[7.5px] font-black text-slate-500 block uppercase tracking-wider">SIZE</span>
                <span className="font-black text-slate-950 font-mono text-[11px]">{sizeWidth}</span>
              </div>
              <div className="p-1.5 bg-slate-100/90 border border-slate-200 rounded-lg">
                <span className="text-[7.5px] font-black text-slate-500 block uppercase tracking-wider">PLY</span>
                <span className="font-black text-slate-950 font-mono text-[11px]">{ply}</span>
              </div>
              <div className="p-1.5 bg-slate-100/90 border border-slate-200 rounded-lg">
                <span className="text-[7.5px] font-black text-slate-500 block uppercase tracking-wider">DIAMETER</span>
                <span className="font-black text-slate-950 font-mono text-[11px]">{dia}</span>
              </div>
              <div className="p-1.5 bg-slate-100/90 border border-slate-200 rounded-lg">
                <span className="text-[7.5px] font-black text-slate-500 block uppercase tracking-wider">CORE</span>
                <span className="font-black text-slate-950 font-mono text-[11px]">{core}</span>
              </div>
              <div className="p-1.5 bg-slate-100/90 border border-slate-200 rounded-lg">
                <span className="text-[7.5px] font-black text-slate-500 block uppercase tracking-wider">JOINTS</span>
                <span className="font-black text-slate-950 font-mono text-[11px]">{joint}</span>
              </div>
            </div>

            {/* 4. High Contrast Certified Net Weight Banner */}
            <div className="bg-slate-950 text-white px-3 py-2 rounded-xl flex items-center justify-between mb-2">
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">
                  CERTIFIED NET WEIGHT
                </span>
                <span className="text-[9px] font-bold text-slate-300">
                  Gross / Tare Verified
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-black font-mono tracking-tight text-emerald-400">
                  {netWeightKg} <span className="text-xs font-normal text-white">KG</span>
                </span>
              </div>
            </div>

            {/* 5. Manufacturing & Packaging Info */}
            <div className="flex items-center justify-between text-[8px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 mb-2">
              <span>Mfg: <strong className="text-slate-900 font-mono">{prodDateTime}</strong></span>
              <span>Operator: <strong className="text-slate-900">{operator}</strong></span>
              <span className="text-emerald-700">Wrapped &amp; Sealed</span>
            </div>

            {/* 6. Notes / Directives */}
            <div className="text-[7.5px] font-extrabold text-slate-500 text-center uppercase tracking-wider py-0.5 border-t border-slate-200">
              <span>{notesInstructions || 'Handle With Care · Keep Dry · 100% Recyclable Paper'}</span>
            </div>

            {/* 7. Footer Company Identity */}
            <div className="border-t-2 border-slate-900 mt-1 pt-1 text-center text-[7px] leading-tight text-slate-600">
              <div className="font-extrabold text-slate-950 uppercase">{COMPANY_CONFIG.name}</div>
              <div>{COMPANY_CONFIG.address}</div>
              <div className="font-bold text-slate-700">Ph: {COMPANY_CONFIG.phone} &bull; {COMPANY_CONFIG.email} &bull; {COMPANY_CONFIG.website}</div>
            </div>
          </div>

          {/* Action Buttons Below Preview */}
          <div className="w-full mt-4 space-y-2" style={{ maxWidth: '400px' }}>
            <button
              type="button"
              onClick={handlePrintLabel}
              className="w-full bg-[#008163] hover:bg-[#006e54] text-white font-black py-3.5 px-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-[#008163]/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
            >
              <Printer className="h-4 w-4" />
              <span>Print {copies}x Thermal Sticker Now</span>
            </button>

            <button
              type="button"
              onClick={() => window.history.back()}
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-2.5 px-4 rounded-2xl text-xs uppercase tracking-wider hover:bg-slate-200 transition cursor-pointer text-center"
            >
              Close Studio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabelStudioView;
