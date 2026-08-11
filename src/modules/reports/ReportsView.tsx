import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getRolls,
  getReels,
  getPackingSlips,
  getRawMaterials,
  getLogs,
  getParties,
  getVehicles,
} from '../../data/index';
import { CustomDatePickerModal } from '../../components/CustomDatePickerModal';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Printer,
  BarChart2,
  Calendar,
  Search,
  TrendingUp,
  Package,
  Truck,
  Factory,
  PieChart as PieChartIcon,
  Layers,
  ArrowUpRight,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

type ReportType =
  | 'daily_prod'
  | 'daily_disp'
  | 'avail_reels'
  | 'sold_reels'
  | 'vehicle_wise'
  | 'party_wise'
  | 'raw_material';

export const ReportsView: React.FC = () => {
  const { t } = useTranslation();

  const [selectedReport, setSelectedReport] = useState<ReportType>('daily_prod');
  const [reportsSearchQuery, setReportsSearchQuery] = useState('');

  // Date Filtering State
  const getTodayStr = () => new Date().toISOString().substring(0, 10);
  const [startDate, setStartDate] = useState<string>(getTodayStr());
  const [endDate, setEndDate] = useState<string>(getTodayStr());
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'last7' | 'this_month'>('today');
  const [openStartDatePicker, setOpenStartDatePicker] = useState(false);
  const [openEndDatePicker, setOpenEndDatePicker] = useState(false);

  const rolls = getRolls();
  const reels = getReels();
  const slips = getPackingSlips();
  const rawMaterials = getRawMaterials();
  const logs = getLogs();
  const parties = getParties();
  const vehicles = getVehicles();

  const reportsList = [
    { id: 'daily_prod', name: 'Daily Production Report' },
    { id: 'daily_disp', name: 'Daily Dispatch Report' },
    { id: 'avail_reels', name: 'Available Reel Inventory Report' },
    { id: 'sold_reels', name: 'Sold/Dispatched Reel Report' },
    { id: 'vehicle_wise', name: 'Vehicle-wise Logistics Report' },
    { id: 'party_wise', name: 'Party/Customer Sales Report' },
    { id: 'raw_material', name: 'Raw Material Movement Report' },
  ];

  // Preset Date Handlers
  const handlePresetChange = (preset: 'all' | 'today' | 'last7' | 'this_month') => {
    setDatePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().substring(0, 10);

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'last7') {
      const past = new Date();
      past.setDate(past.getDate() - 6);
      setStartDate(past.toISOString().substring(0, 10));
      setEndDate(todayStr);
    } else if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(firstDay.toISOString().substring(0, 10));
      setEndDate(todayStr);
    }
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setDatePreset('all');
  };

  // Helper date checker
  const isDateInRange = (dateStr: string) => {
    if (!dateStr) return true;
    const target = dateStr.substring(0, 10);
    if (startDate && target < startDate) return false;
    if (endDate && target > endDate) return false;
    return true;
  };

  // --- FILTERED BASE DATASETS ---
  const filteredRolls = useMemo(() => rolls.filter(r => isDateInRange(r.date)), [rolls, startDate, endDate]);
  const filteredReels = useMemo(() => reels.filter(r => isDateInRange(r.productionDate)), [reels, startDate, endDate]);
  const filteredSlips = useMemo(() => slips.filter(s => isDateInRange(s.date)), [slips, startDate, endDate]);
  const filteredLogs = useMemo(() => logs.filter(l => isDateInRange(l.timestamp)), [logs, startDate, endDate]);

  // --- REPORT DATA CALCULATORS ---

  // 1. Daily Production Report Data
  const dailyProdData = useMemo(() => {
    const data: Record<string, { date: string; rollCount: number; reelCount: number; totalWeight: number }> = {};
    filteredRolls.forEach(r => {
      if (!data[r.date]) {
        data[r.date] = { date: r.date, rollCount: 0, reelCount: 0, totalWeight: 0 };
      }
      data[r.date].rollCount += 1;
    });
    filteredReels.forEach(re => {
      const date = re.productionDate.substring(0, 10);
      if (!data[date]) {
        data[date] = { date, rollCount: 0, reelCount: 0, totalWeight: 0 };
      }
      data[date].reelCount += 1;
      data[date].totalWeight += re.weight;
    });
    return Object.values(data).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredRolls, filteredReels]);

  // 2. Daily Dispatch Report Data
  const dailyDispData = useMemo(() => {
    const data: Record<string, { date: string; slipCount: number; reelsDispatched: number; totalWeight: number }> = {};
    filteredSlips.forEach(slip => {
      if (slip.status === 'DISPATCHED') {
        if (!data[slip.date]) {
          data[slip.date] = { date: slip.date, slipCount: 0, reelsDispatched: 0, totalWeight: 0 };
        }
        data[slip.date].slipCount += 1;
        data[slip.date].reelsDispatched += slip.reelNos.length;

        const slipReels = reels.filter(r => slip.reelNos.includes(r.reelNo));
        const w = slipReels.reduce((sum, r) => sum + r.weight, 0);
        data[slip.date].totalWeight += w;
      }
    });
    return Object.values(data).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredSlips, reels]);

  // 3. Available Reel Inventory
  const availReelsData = useMemo(() => {
    return reels.filter(r => r.status === 'IN_STOCK' || r.status === 'IN_STOCK_B');
  }, [reels]);

  // 4. Sold/Dispatched Reel Report
  const soldReelsData = useMemo(() => {
    return reels.filter(r => r.status === 'DISPATCHED' && isDateInRange(r.dispatchDetails?.dispatchDate || r.productionDate));
  }, [reels, startDate, endDate]);

  // 5. Vehicle-wise Report
  const vehicleWiseData = useMemo(() => {
    const data: Record<string, { vehicleNo: string; driverName: string; trips: number; totalWeight: number }> = {};
    vehicles.forEach(v => {
      data[v.id] = { vehicleNo: v.vehicleNo, driverName: v.driverName, trips: 0, totalWeight: 0 };
    });

    filteredSlips.forEach(slip => {
      if (slip.status === 'DISPATCHED' && data[slip.vehicleId]) {
        data[slip.vehicleId].trips += 1;
        const slipReels = reels.filter(r => slip.reelNos.includes(r.reelNo));
        const w = slipReels.reduce((sum, r) => sum + r.weight, 0);
        data[slip.vehicleId].totalWeight += w;
      }
    });

    return Object.values(data).filter(item => item.trips > 0);
  }, [vehicles, filteredSlips, reels]);

  // 6. Party-wise Report
  const partyWiseData = useMemo(() => {
    const data: Record<string, { partyName: string; challans: number; reelsCount: number; totalWeight: number }> = {};
    parties.forEach(p => {
      data[p.id] = { partyName: p.name, challans: 0, reelsCount: 0, totalWeight: 0 };
    });

    filteredSlips.forEach(slip => {
      if (slip.status === 'DISPATCHED' && data[slip.partyId]) {
        data[slip.partyId].challans += 1;
        data[slip.partyId].reelsCount += slip.reelNos.length;
        const slipReels = reels.filter(r => slip.reelNos.includes(r.reelNo));
        const w = slipReels.reduce((sum, r) => sum + r.weight, 0);
        data[slip.partyId].totalWeight += w;
      }
    });

    return Object.values(data).filter(item => item.challans > 0);
  }, [parties, filteredSlips, reels]);

  // 7. Raw Material Movement Ledger
  const rawMaterialMovement = useMemo(() => {
    return filteredLogs.filter(log => log.module === 'Raw Material' || log.module === 'Pulp Mill' || log.module === 'Machine');
  }, [filteredLogs]);

  // --- ANALYTICS KPI SCORECARDS ---
  const totalProductionWeightKg = useMemo(() => {
    return dailyProdData.reduce((sum, d) => sum + d.totalWeight, 0);
  }, [dailyProdData]);

  const totalDispatchWeightKg = useMemo(() => {
    return dailyDispData.reduce((sum, d) => sum + d.totalWeight, 0);
  }, [dailyDispData]);

  const totalStockWeightKg = useMemo(() => {
    return availReelsData.reduce((sum, r) => sum + r.weight, 0);
  }, [availReelsData]);

  const dispatchYieldPercent = useMemo(() => {
    if (totalProductionWeightKg === 0) return 100;
    return parseFloat(((totalDispatchWeightKg / totalProductionWeightKg) * 100).toFixed(1));
  }, [totalProductionWeightKg, totalDispatchWeightKg]);

  // --- RECHARTS DIAGRAM DATASETS ---

  // 1. Production vs Dispatch Trend Chart Data
  const trendChartData = useMemo(() => {
    const map: Record<string, { date: string; prodWeight: number; dispWeight: number }> = {};

    dailyProdData.forEach(p => {
      const shortDate = p.date.substring(5); // MM-DD
      if (!map[shortDate]) map[shortDate] = { date: shortDate, prodWeight: 0, dispWeight: 0 };
      map[shortDate].prodWeight += p.totalWeight;
    });

    dailyDispData.forEach(d => {
      const shortDate = d.date.substring(5);
      if (!map[shortDate]) map[shortDate] = { date: shortDate, prodWeight: 0, dispWeight: 0 };
      map[shortDate].dispWeight += d.totalWeight;
    });

    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date)).slice(-10);
  }, [dailyProdData, dailyDispData]);

  // 2. Grade & Quality Distribution Donut Data
  const gradeDistributionData = useMemo(() => {
    let gradeA = 0;
    let gradeB = 0;
    let qcPending = 0;
    let dispatched = 0;

    reels.forEach(r => {
      if (r.status === 'QC_PENDING' || r.qcGrade === 'PENDING') qcPending += 1;
      else if (r.status === 'DISPATCHED') dispatched += 1;
      else if (r.qcGrade === 'A' || r.status === 'IN_STOCK') gradeA += 1;
      else gradeB += 1;
    });

    return [
      { name: 'Grade A In-Stock', value: gradeA, color: '#10B981' },
      { name: 'Grade B In-Stock', value: gradeB, color: '#F59E0B' },
      { name: 'QC Pending Inspection', value: qcPending, color: '#8B5CF6' },
      { name: 'Dispatched to Party', value: dispatched, color: '#2563EB' },
    ];
  }, [reels]);

  // --- SEARCH FILTERED REPORT VIEWS ---
  const filteredDailyProd = useMemo(() => {
    const q = reportsSearchQuery.toLowerCase().trim();
    if (!q) return dailyProdData;
    return dailyProdData.filter(d => d.date.includes(q));
  }, [dailyProdData, reportsSearchQuery]);

  const filteredDailyDisp = useMemo(() => {
    const q = reportsSearchQuery.toLowerCase().trim();
    if (!q) return dailyDispData;
    return dailyDispData.filter(d => d.date.includes(q));
  }, [dailyDispData, reportsSearchQuery]);

  const filteredAvailReels = useMemo(() => {
    const q = reportsSearchQuery.toLowerCase().trim();
    if (!q) return availReelsData;
    return availReelsData.filter(r =>
      r.reelNo.toLowerCase().includes(q) ||
      r.product.toLowerCase().includes(q) ||
      String(r.gsm).includes(q) ||
      String(r.size).includes(q) ||
      String(r.ply).includes(q)
    );
  }, [availReelsData, reportsSearchQuery]);

  const filteredSoldReels = useMemo(() => {
    const q = reportsSearchQuery.toLowerCase().trim();
    if (!q) return soldReelsData;
    return soldReelsData.filter(r =>
      r.reelNo.toLowerCase().includes(q) ||
      r.product.toLowerCase().includes(q) ||
      (r.dispatchDetails?.partyName && r.dispatchDetails.partyName.toLowerCase().includes(q)) ||
      (r.dispatchDetails?.vehicleNo && r.dispatchDetails.vehicleNo.toLowerCase().includes(q))
    );
  }, [soldReelsData, reportsSearchQuery]);

  const filteredVehicleWise = useMemo(() => {
    const q = reportsSearchQuery.toLowerCase().trim();
    if (!q) return vehicleWiseData;
    return vehicleWiseData.filter(v =>
      v.vehicleNo.toLowerCase().includes(q) ||
      v.driverName.toLowerCase().includes(q)
    );
  }, [vehicleWiseData, reportsSearchQuery]);

  const filteredPartyWise = useMemo(() => {
    const q = reportsSearchQuery.toLowerCase().trim();
    if (!q) return partyWiseData;
    return partyWiseData.filter(p => p.partyName.toLowerCase().includes(q));
  }, [partyWiseData, reportsSearchQuery]);

  const filteredRawMaterialMovement = useMemo(() => {
    const q = reportsSearchQuery.toLowerCase().trim();
    if (!q) return rawMaterialMovement;
    return rawMaterialMovement.filter(log =>
      log.details.toLowerCase().includes(q) ||
      log.user.toLowerCase().includes(q) ||
      log.timestamp.includes(q)
    );
  }, [rawMaterialMovement, reportsSearchQuery]);

  // --- SHEETJS EXPORT & PRINT HANDLERS ---
  const exportToExcel = () => {
    let sheetName = "";
    let dataToExport: any[] = [];

    if (selectedReport === 'daily_prod') {
      sheetName = "Daily Production";
      dataToExport = dailyProdData.map(d => ({
        'Date': d.date,
        'Machine Rolls Logged': d.rollCount,
        'Finished Reels Generated': d.reelCount,
        'Total Output Weight (kg)': d.totalWeight,
      }));
    } else if (selectedReport === 'daily_disp') {
      sheetName = "Daily Dispatches";
      dataToExport = dailyDispData.map(d => ({
        'Date': d.date,
        'Challans Generated': d.slipCount,
        'Reels Dispatched': d.reelsDispatched,
        'Total Dispatched Weight (kg)': d.totalWeight,
      }));
    } else if (selectedReport === 'avail_reels') {
      sheetName = "Warehouse Inventory";
      dataToExport = availReelsData.map(r => ({
        'Reel Number': r.reelNo,
        'Product': r.product,
        'GSM': r.gsm,
        'Size (cm)': r.size,
        'Ply': r.ply,
        'Weight (kg)': r.weight,
        'Dia (mm)': r.dia,
        'QC Grade': r.qcGrade,
      }));
    } else if (selectedReport === 'sold_reels') {
      sheetName = "Sold Reels";
      dataToExport = soldReelsData.map(r => ({
        'Reel Number': r.reelNo,
        'Product': r.product,
        'Weight (kg)': r.weight,
        'Customer': r.dispatchDetails?.partyName,
        'Vehicle Number': r.dispatchDetails?.vehicleNo,
        'Dispatch Date': r.dispatchDetails?.dispatchDate,
      }));
    } else if (selectedReport === 'vehicle_wise') {
      sheetName = "Vehicle Trips";
      dataToExport = vehicleWiseData.map(v => ({
        'Vehicle Number': v.vehicleNo,
        'Driver Name': v.driverName,
        'Total Trips': v.trips,
        'Total Dispatched Weight (kg)': v.totalWeight,
      }));
    } else if (selectedReport === 'party_wise') {
      sheetName = "Party Shipments";
      dataToExport = partyWiseData.map(p => ({
        'Party Name': p.partyName,
        'Total Challans': p.challans,
        'Reels Shipped': p.reelsCount,
        'Total Dispatched Weight (kg)': p.totalWeight,
      }));
    } else if (selectedReport === 'raw_material') {
      sheetName = "Raw Material Movements";
      dataToExport = rawMaterialMovement.map(l => ({
        'Timestamp': new Date(l.timestamp).toLocaleString(),
        'Action': l.action,
        'Details': l.details,
        'Operator': l.user,
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet([]);

    XLSX.utils.sheet_add_aoa(worksheet, [
      ['SAHEB PAPER PVT. LTD.'],
      ['Mill Reports & Analytics Dashboard'],
      [`Report: ${reportsList.find(r => r.id === selectedReport)?.name || selectedReport}`],
      [`Date Range Filter: ${startDate || 'All Time'} to ${endDate || 'Present'}`],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
    ], { origin: 'A1' });

    XLSX.utils.sheet_add_json(worksheet, dataToExport, { origin: 'A7' });

    const colKeys = Object.keys(dataToExport[0] || {});
    worksheet['!cols'] = colKeys.map(key => ({
      wch: Math.max(key.length + 4, 18),
    }));

    const totalCols = Math.max(colKeys.length, 4);
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: totalCols - 1 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: totalCols - 1 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: totalCols - 1 } },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `Saheb_Paper_Analytics_${selectedReport}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-3 sm:space-y-6">

      {/* 1. Dashboard Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden print:hidden">
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-bold uppercase tracking-wider mb-3 border border-white/10">
              <BarChart2 className="h-3.5 w-3.5 text-blue-300" />
              <span>Real-Time Business Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-heading">
              Mill Reports & Analytics Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-xl font-medium">
              Comprehensive date-filtered production throughput, dispatch yield ledgers, and compliance audit exports.
            </p>
          </div>

          {/* Export / Print Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={exportToExcel}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/25 flex items-center gap-2 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive Date Range & Presets Filter Bar */}
      <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm space-y-3 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

          {/* Specific Date Range Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
              <Calendar className="h-4 w-4 text-primary dark:text-blue-400" />
              <span>Date Filter:</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Start Date Button with Custom Date Picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setOpenStartDatePicker(prev => !prev);
                    setOpenEndDatePicker(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-extrabold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer select-none"
                >
                  <span className={startDate ? 'font-black' : 'text-slate-400 font-semibold'}>
                    {startDate || 'dd-mm-yyyy'}
                  </span>
                  <Calendar className="h-3.5 w-3.5 text-primary dark:text-blue-400" />
                </button>

                {openStartDatePicker && (
                  <CustomDatePickerModal
                    selectedDate={startDate}
                    onSelectDate={(newDate) => {
                      handleCustomDateChange(newDate, endDate);
                      setOpenStartDatePicker(false);
                    }}
                    onClose={() => setOpenStartDatePicker(false)}
                  />
                )}
              </div>

              <span className="text-xs text-slate-400 font-black uppercase">to</span>

              {/* End Date Button with Custom Date Picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setOpenEndDatePicker(prev => !prev);
                    setOpenStartDatePicker(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-extrabold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer select-none"
                >
                  <span className={endDate ? 'font-black' : 'text-slate-400 font-semibold'}>
                    {endDate || 'dd-mm-yyyy'}
                  </span>
                  <Calendar className="h-3.5 w-3.5 text-primary dark:text-blue-400" />
                </button>

                {openEndDatePicker && (
                  <CustomDatePickerModal
                    selectedDate={endDate}
                    onSelectDate={(newDate) => {
                      handleCustomDateChange(startDate, newDate);
                      setOpenEndDatePicker(false);
                    }}
                    onClose={() => setOpenEndDatePicker(false)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl self-start lg:self-auto border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => handlePresetChange('today')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition cursor-pointer ${datePreset === 'today'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Today
            </button>
            <button
              onClick={() => handlePresetChange('last7')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition cursor-pointer ${datePreset === 'last7'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Last Week
            </button>
            <button
              onClick={() => handlePresetChange('this_month')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition cursor-pointer ${datePreset === 'this_month'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              This Month
            </button>
            <button
              onClick={() => handlePresetChange('all')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition cursor-pointer ${datePreset === 'all' && !startDate && !endDate
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              All
            </button>
          </div>

        </div>
      </div>

      {/* 3. Analytics Summary Scorecards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">

        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Production Output</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Factory className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-sans">
            {totalProductionWeightKg.toLocaleString()} <span className="text-xs font-bold text-slate-500">kg</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-semibold">
            {filteredDailyProd.reduce((sum, d) => sum + d.rollCount, 0)} machine rolls logged
          </p>
        </div>

        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Dispatched Volume</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Truck className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-sans">
            {totalDispatchWeightKg.toLocaleString()} <span className="text-xs font-bold text-slate-500">kg</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-semibold">
            {filteredDailyDisp.reduce((sum, d) => sum + d.slipCount, 0)} challans completed
          </p>
        </div>

        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Warehouse Stock</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-sans">
            {totalStockWeightKg.toLocaleString()} <span className="text-xs font-bold text-slate-500">kg</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-semibold">
            {availReelsData.length} finished reels ready
          </p>
        </div>

        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dispatch Yield Ratio</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-sans flex items-center gap-1.5">
            {dispatchYieldPercent}%
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-semibold">
            Output to dispatch efficiency
          </p>
        </div>

      </div>

      {/* 4. Interactive Diagrams Section (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">

        {/* Diagram 1: Production vs Dispatch Trend Area Chart (2/3 width) */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                <TrendingUp className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                Production Output vs. Dispatch Volume (kg)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Comparative historical daily throughput graph for selected date range
              </p>
            </div>
          </div>

          <div className="h-[235px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendChartData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.45} />
                    <stop offset="60%" stopColor="#6366F1" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorDisp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.45} />
                    <stop offset="60%" stopColor="#06B6D4" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#64748B" opacity={0.12} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[175px]">
                          <p className="font-bold text-slate-300 border-b border-slate-700/60 pb-1 flex items-center justify-between">
                            <span>Date</span>
                            <span className="text-white font-semibold">{label}</span>
                          </p>
                          {payload.map((entry: any, index: number) => (
                            <div key={`item-${index}`} className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.stroke || entry.color }} />
                                <span className="text-slate-300 font-medium">{entry.name?.replace(' (kg)', '')}:</span>
                              </div>
                              <span className="font-bold text-white">
                                {Number(entry.value).toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">kg</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
                <Area
                  type="monotone"
                  dataKey="prodWeight"
                  name="Production Output (kg)"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorProd)"
                  dot={{ r: 3.5, stroke: '#3B82F6', strokeWidth: 2, fill: '#FFFFFF' }}
                  activeDot={{ r: 6.5, stroke: '#1D4ED8', strokeWidth: 2, fill: '#3B82F6' }}
                />
                <Area
                  type="monotone"
                  dataKey="dispWeight"
                  name="Dispatched Weight (kg)"
                  stroke="#10B981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorDisp)"
                  dot={{ r: 3.5, stroke: '#10B981', strokeWidth: 2, fill: '#FFFFFF' }}
                  activeDot={{ r: 6.5, stroke: '#047857', strokeWidth: 2, fill: '#10B981' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Diagram 2: Reel QC Grade & Quality Distribution Donut Chart (1/3 width) */}
        <div className="bg-white dark:bg-surface-dark border border-border-light dark:border-slate-700 rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-3">
          <div className="border-b pb-3 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PieChartIcon className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
              Reel Quality & Stock Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Inventory grade ratio breakdown</p>
          </div>

          <div className="h-[180px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradeDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={68}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {gradeDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#FFF', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
            {gradeDistributionData.map(item => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate text-slate-600 dark:text-slate-300 font-medium">{item.name}:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 5. Main Reports Grid (Selector Sidebar + Table View) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

        {/* Left Selector Menu (1/4 width) */}
        <div className="bg-white dark:bg-surface-dark border border-border-light dark:border-slate-700 rounded-xl p-5 shadow-sm space-y-4 print:hidden">
          <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b pb-3 dark:border-slate-700 flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary dark:text-blue-400" />
            Select Audit Report
          </h3>
          <div className="flex flex-col gap-1.5">
            {reportsList.map(report => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id as ReportType)}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs transition cursor-pointer font-semibold ${selectedReport === report.id
                  ? 'bg-primary text-white font-bold shadow-sm'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
              >
                {report.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right Content Pane (3/4 width) */}
        <div className="lg:col-span-3 space-y-4">

          {/* Controls Bar & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-surface-dark border border-border-light dark:border-slate-700 rounded-xl px-5 py-3 shadow-sm print:hidden">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              {reportsList.find(r => r.id === selectedReport)?.name}
            </h3>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={reportsSearchQuery}
                  onChange={e => setReportsSearchQuery(e.target.value)}
                  placeholder="Search report entries..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Printable Report Table Card */}
          <div className="bg-white dark:bg-surface-dark border border-border-light dark:border-slate-700 rounded-xl p-5 shadow-sm print:border-none print:shadow-none">

            {/* Print Letterhead */}
            <div className="hidden print:block text-center border-b pb-4 mb-4 border-black">
              <h2 className="text-xl font-bold uppercase tracking-wider">SAHEB PAPER PVT. LTD.</h2>
              <p className="text-xs">{reportsList.find(r => r.id === selectedReport)?.name}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Filter: {startDate || 'All'} to {endDate || 'Present'} | Generated: {new Date().toLocaleDateString()}
              </p>
            </div>

            {/* 1. Daily Production Table */}
            {selectedReport === 'daily_prod' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      <th className="py-3 px-3 font-bold uppercase whitespace-nowrap">Date</th>
                      <th className="py-3 px-3 font-bold uppercase whitespace-nowrap">Machine Rolls Logged</th>
                      <th className="py-3 px-3 font-bold uppercase whitespace-nowrap">Finished Reels Generated</th>
                      <th className="py-3 px-3 font-bold uppercase text-right whitespace-nowrap">Total Weight (kg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredDailyProd.length === 0 ? (
                      <tr><td colSpan={4} className="py-5 text-center text-slate-400">No production records found for selected criteria.</td></tr>
                    ) : (
                      filteredDailyProd.map(d => (
                        <tr key={d.date} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">{d.date.split('-').reverse().join('-')}</td>
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{d.rollCount} rolls</td>
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{d.reelCount} reels</td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">{d.totalWeight.toLocaleString()} kg</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. Daily Dispatch Table */}
            {selectedReport === 'daily_disp' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      <th className="py-3 px-3 font-bold uppercase whitespace-nowrap">Date</th>
                      <th className="py-3 px-3 font-bold uppercase whitespace-nowrap">Challans Dispatched</th>
                      <th className="py-3 px-3 font-bold uppercase whitespace-nowrap">Reels Shipped</th>
                      <th className="py-3 px-3 font-bold uppercase text-right whitespace-nowrap">Total Weight (kg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredDailyDisp.length === 0 ? (
                      <tr><td colSpan={4} className="py-5 text-center text-slate-400">No dispatch records found for selected criteria.</td></tr>
                    ) : (
                      filteredDailyDisp.map(d => (
                        <tr key={d.date} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">{d.date.split('-').reverse().join('-')}</td>
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{d.slipCount} challans</td>
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{d.reelsDispatched} reels</td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">{d.totalWeight.toLocaleString()} kg</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. Available Reels Inventory */}
            {selectedReport === 'avail_reels' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      <th className="py-3 px-3 font-bold uppercase whitespace-nowrap">Reel Number</th>
                      <th className="py-3 px-3 font-bold uppercase whitespace-nowrap">Product Description</th>
                      <th className="py-3 px-3 font-bold uppercase whitespace-nowrap">GSM</th>
                      <th className="py-3 px-3 font-bold uppercase whitespace-nowrap">Size</th>
                      <th className="py-3 px-3 font-bold uppercase whitespace-nowrap">QC Grade</th>
                      <th className="py-3 px-3 font-bold uppercase text-right whitespace-nowrap">Weight (kg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredAvailReels.length === 0 ? (
                      <tr><td colSpan={6} className="py-5 text-center text-slate-400">No reels currently in warehouse stock.</td></tr>
                    ) : (
                      filteredAvailReels.map(r => (
                        <tr key={r.reelNo} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-bold font-mono text-slate-900 dark:text-white whitespace-nowrap">{r.reelNo}</td>
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{r.product}</td>
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{r.gsm}</td>
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{r.size} cm</td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                              {r.qcGrade}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">{r.weight} kg</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. Sold Reels Details */}
            {selectedReport === 'sold_reels' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      <th className="py-3 px-3 font-bold uppercase whitespace-nowrap">Reel Number</th>
                      <th className="py-3 px-3 font-bold uppercase whitespace-nowrap">Product</th>
                      <th className="py-3 px-3 font-bold uppercase whitespace-nowrap">Customer</th>
                      <th className="py-3 px-3 font-bold uppercase whitespace-nowrap">Vehicle</th>
                      <th className="py-3 px-3 font-bold uppercase whitespace-nowrap">Dispatch Date</th>
                      <th className="py-3 px-3 font-bold uppercase text-right whitespace-nowrap">Weight (kg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredSoldReels.length === 0 ? (
                      <tr><td colSpan={6} className="py-5 text-center text-slate-400">No sold reels recorded in selected date range.</td></tr>
                    ) : (
                      filteredSoldReels.map(r => (
                        <tr key={r.reelNo} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-bold font-mono text-slate-900 dark:text-white whitespace-nowrap">{r.reelNo}</td>
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{r.product}</td>
                          <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{r.dispatchDetails?.partyName}</td>
                          <td className="py-3 px-3 font-mono text-primary dark:text-blue-400 whitespace-nowrap">{r.dispatchDetails?.vehicleNo}</td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{r.dispatchDetails?.dispatchDate}</td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">{r.weight} kg</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 5. Vehicle-wise Trips Report */}
            {selectedReport === 'vehicle_wise' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      <th className="py-3 px-3 font-bold uppercase whitespace-nowrap">Vehicle Number</th>
                      <th className="py-3 px-3 font-bold uppercase whitespace-nowrap">Driver Name</th>
                      <th className="py-3 px-3 font-bold uppercase whitespace-nowrap">Completed Trips</th>
                      <th className="py-3 px-3 font-bold uppercase text-right whitespace-nowrap">Total Transferred Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredVehicleWise.length === 0 ? (
                      <tr><td colSpan={4} className="py-5 text-center text-slate-400">No vehicle logistics records found.</td></tr>
                    ) : (
                      filteredVehicleWise.map(v => (
                        <tr key={v.vehicleNo} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-bold font-mono text-primary dark:text-blue-400 whitespace-nowrap">{v.vehicleNo}</td>
                          <td className="py-3 px-3 font-semibold text-slate-800 dark:text-white whitespace-nowrap">{v.driverName}</td>
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{v.trips} trips</td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">{v.totalWeight.toLocaleString()} kg</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 6. Party-wise Sales Report */}
            {selectedReport === 'party_wise' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      <th className="py-3 px-3 font-bold uppercase whitespace-nowrap">Party / Customer Name</th>
                      <th className="py-3 px-3 font-bold uppercase whitespace-nowrap">Challans Handed</th>
                      <th className="py-3 px-3 font-bold uppercase whitespace-nowrap">Reels Delivered</th>
                      <th className="py-3 px-3 font-bold uppercase text-right whitespace-nowrap">Total Weight Purchased</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredPartyWise.length === 0 ? (
                      <tr><td colSpan={4} className="py-5 text-center text-slate-400">No customer purchase records found.</td></tr>
                    ) : (
                      filteredPartyWise.map(p => (
                        <tr key={p.partyName} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">{p.partyName}</td>
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{p.challans} challans</td>
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{p.reelsCount} reels</td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">{p.totalWeight.toLocaleString()} kg</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 7. Raw Material Ledger Details */}
            {selectedReport === 'raw_material' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      <th className="py-3 px-3 font-bold uppercase whitespace-nowrap">Timestamp</th>
                      <th className="py-3 px-3 font-bold uppercase whitespace-nowrap">Action</th>
                      <th className="py-3 px-3 font-bold uppercase whitespace-nowrap">Details</th>
                      <th className="py-3 px-3 font-bold uppercase text-right whitespace-nowrap">Operator</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredRawMaterialMovement.length === 0 ? (
                      <tr><td colSpan={4} className="py-5 text-center text-slate-400">No raw material stock movements logged.</td></tr>
                    ) : (
                      filteredRawMaterialMovement.map(l => (
                        <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {new Date(l.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 font-bold text-sm text-slate-900 dark:text-slate-100 whitespace-nowrap">{l.action}</td>
                          <td className="py-3 px-3 text-xs text-slate-700 dark:text-slate-300 font-normal leading-relaxed min-w-[200px]">{l.details}</td>
                          <td className="py-3 px-3 text-right font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{l.user}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};

export default ReportsView;
