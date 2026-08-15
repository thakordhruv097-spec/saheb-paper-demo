import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { FinishStockView } from '../finish-stock/FinishStockView';
import { DispatchView } from './DispatchView';
import { QRScannerView } from '../rewinder/QRScannerView';
import { PrintLabelModal } from '../../components/PrintLabelModal';
import { Package, Truck, QrCode, Printer } from 'lucide-react';

export const FinishedStockDispatchView: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const isUserAdmin = user?.role === 'Admin' || (user?.roles && user.roles.includes('Admin'));

  const canAccessFinishStock = isUserAdmin || (user?.customModules && Array.isArray(user.customModules) ? user.customModules.includes('finished_stock_dispatch') : true);
  const canAccessDispatch = isUserAdmin || (user?.customModules && Array.isArray(user.customModules) ? user.customModules.includes('dispatch') : true);
  const canAccessScanner = isUserAdmin || canAccessDispatch;

  const [activeTab, setActiveTab] = useState<'stock_category' | 'dispatch_mgmt' | 'qr_scanner'>(() => {
    if (canAccessDispatch) return 'dispatch_mgmt';
    if (canAccessFinishStock) return 'stock_category';
    return 'dispatch_mgmt';
  });

  const [showPrintLabelModal, setShowPrintLabelModal] = useState(false);
  const [selectedReelForPrint, setSelectedReelForPrint] = useState<any>(null);
  const [selectedCodeForPrint, setSelectedCodeForPrint] = useState<string>('');

  const handleOpenPrintStudio = (reel?: any, code?: string) => {
    setSelectedReelForPrint(reel || null);
    setSelectedCodeForPrint(code || (reel ? reel.reelNo : ''));
    setShowPrintLabelModal(true);
  };

  if (!canAccessFinishStock && !canAccessDispatch) {
    return (
      <div className="p-8 text-center bg-white dark:bg-surface-dark rounded-2xl border border-red-200 text-red-600 font-bold text-sm">
        ⚠️ Access Denied: You do not have permission to view Finish Stock or Dispatch modules.
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans pb-16 w-full text-left relative">
      
      {/* 1. COMPACT SLEEK BANNER HEADER */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white shrink-0">
              <Package className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black tracking-tight truncate">Finished Stock &amp; Dispatch</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-400/20 text-blue-300 border border-blue-400/30">
                  Inventory &amp; Logistics
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Print Label Studio + Scanner Quick Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleOpenPrintStudio()}
              className="px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white border border-white/20 shadow-sm"
              title="Print Universal QR &amp; Thermal Sticker Label"
            >
              <Printer className="h-4 w-4 text-sky-200" />
              <span className="hidden sm:inline">Print Labels</span>
              <span className="sm:hidden">Print</span>
            </button>

            {canAccessScanner && (
              <button
                onClick={() => setActiveTab('qr_scanner')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-md ${
                  activeTab === 'qr_scanner'
                    ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                    : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                }`}
                title="Open QR Reel Dispatch Scanner"
              >
                <QrCode className="h-4 w-4 text-emerald-300 animate-pulse" />
                <span className="hidden sm:inline">Dispatch Scanner</span>
                <span className="sm:hidden">Scanner</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. MODERN SLEEK TAB SWITCHER */}
      <div className="flex items-center gap-1.5 sm:gap-2 bg-white dark:bg-surface-dark p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs w-full overflow-x-auto no-scrollbar">
        {canAccessDispatch && (
          <button
            onClick={() => setActiveTab('dispatch_mgmt')}
            className={`flex-1 min-w-[120px] px-3.5 py-2.5 rounded-lg font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'dispatch_mgmt'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Truck className="h-4 w-4" />
            <span className="truncate">Dispatch Slips</span>
          </button>
        )}

        {canAccessScanner && (
          <button
            onClick={() => setActiveTab('qr_scanner')}
            className={`flex-1 min-w-[130px] px-3.5 py-2.5 rounded-lg font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'qr_scanner'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs ring-1 ring-emerald-400/50'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <QrCode className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            <span className="truncate">QR Reel Scanner</span>
          </button>
        )}

        {canAccessFinishStock && (
          <button
            onClick={() => setActiveTab('stock_category')}
            className={`flex-1 min-w-[120px] px-3.5 py-2.5 rounded-lg font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'stock_category'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Package className="h-4 w-4" />
            <span className="truncate">Stock Categorization</span>
          </button>
        )}
      </div>

      {/* 3. RENDER VIEWS */}
      <div className="pt-1">
        {activeTab === 'stock_category' && canAccessFinishStock && <FinishStockView hideHeader={true} />}
        {activeTab === 'dispatch_mgmt' && canAccessDispatch && (
          <DispatchView initialTab="create_slip" hideTabs={false} hideHeader={true} onOpenScanner={() => setActiveTab('qr_scanner')} />
        )}
        {activeTab === 'qr_scanner' && canAccessScanner && <QRScannerView onOpenPrintStudio={handleOpenPrintStudio} />}
      </div>

      {/* 4. FLOATING QUICK SCAN BUTTON (Visible across tabs except scanner) */}
      {canAccessScanner && activeTab !== 'qr_scanner' && (
        <button
          onClick={() => setActiveTab('qr_scanner')}
          className="fixed bottom-20 sm:bottom-8 right-5 z-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold px-5 py-3 rounded-full shadow-2xl shadow-blue-600/50 flex items-center gap-2.5 text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer border border-blue-400/30 backdrop-blur-sm"
          title="Quick QR Reel Scanner"
        >
          <QrCode className="h-4.5 w-4.5 text-sky-200" />
          <span>Scan Reel</span>
        </button>
      )}

      {/* 5. UNIVERSAL PRINT LABEL MODAL */}
      <PrintLabelModal
        isOpen={showPrintLabelModal}
        onClose={() => setShowPrintLabelModal(false)}
        initialReel={selectedReelForPrint}
        initialCode={selectedCodeForPrint}
      />

    </div>
  );
};

export default FinishedStockDispatchView;
