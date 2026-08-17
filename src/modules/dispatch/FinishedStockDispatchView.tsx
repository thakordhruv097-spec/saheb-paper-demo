import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { FinishStockView } from '../finish-stock/FinishStockView';
import { DispatchView } from './DispatchView';
import { QRScannerView } from '../rewinder/QRScannerView';
import { PrintLabelModal } from '../../components/PrintLabelModal';
import { Package, Truck, QrCode, Printer } from 'lucide-react';
import { WorkflowStepBadge, WORKFLOW_STEPS } from '../../components/WorkflowStepBadge';

export const FinishedStockDispatchView: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const isUserAdmin = user?.role === 'Admin' || (user?.roles && user.roles.includes('Admin'));

  const canAccessFinishStock = true;
  const canAccessDispatch = true;
  const canAccessScanner = true;

  const [activeTab, setActiveTab] = useState<'stock_category' | 'dispatch_mgmt' | 'qr_scanner'>(() => {
    return 'stock_category';
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
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md relative z-20">
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white shrink-0">
              <Package className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black tracking-tight truncate">Stock Categorization</h1>
                <WorkflowStepBadge stepInfo={WORKFLOW_STEPS.finishedStock} />
              </div>
            </div>
          </div>

          {/* Action Buttons: Print Label Studio (Universal) + Scanner Quick Button (Mobile Only) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleOpenPrintStudio()}
              className="px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white border border-white/20 shadow-sm"
              title="Print Universal QR &amp; Thermal Sticker Label"
            >
              <Printer className="h-4 w-4 text-sky-200" />
              <span>Print Labels</span>
            </button>

            {/* Scanner Button (Visible ONLY on Mobile) */}
            {canAccessScanner && (
              <button
                onClick={() => setActiveTab('qr_scanner')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex md:hidden items-center gap-1.5 shadow-md ${activeTab === 'qr_scanner'
                    ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                    : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                  }`}
                title="Open QR Reel Dispatch Scanner"
              >
                <QrCode className="h-4 w-4 text-emerald-300 animate-pulse" />
                <span>Scanner</span>
              </button>
            )}
          </div>
        </div>
      </div>



      {/* 3. RENDER VIEWS */}
      <div className="pt-1">
        {activeTab === 'stock_category' && canAccessFinishStock && <FinishStockView hideHeader={true} />}
        {activeTab === 'qr_scanner' && canAccessScanner && <QRScannerView onOpenPrintStudio={handleOpenPrintStudio} />}
      </div>

      {/* 4. FLOATING QUICK SCAN BUTTON (Visible only on mobile screens when not on scanner tab) */}
      {canAccessScanner && activeTab !== 'qr_scanner' && (
        <button
          onClick={() => setActiveTab('qr_scanner')}
          className="fixed bottom-20 right-4 z-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold px-5 py-3 rounded-full shadow-2xl shadow-blue-600/50 flex md:hidden items-center gap-2.5 text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer border border-blue-400/30 backdrop-blur-sm"
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
