import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { FinishStockView } from '../finish-stock/FinishStockView';
import { DispatchView } from './DispatchView';
import { Package, Truck } from 'lucide-react';

export const FinishedStockDispatchView: React.FC = () => {
  const { t } = useTranslation();
  const { user, hasAccess } = useAuth();

  const isUserAdmin = user?.role === 'Admin' || (user?.roles && user.roles.includes('Admin'));

  const canAccessFinishStock = isUserAdmin || (user?.customModules && Array.isArray(user.customModules) ? user.customModules.includes('finished_stock_dispatch') : true);
  const canAccessDispatch = isUserAdmin || (user?.customModules && Array.isArray(user.customModules) ? user.customModules.includes('dispatch') : true);

  const [activeTab, setActiveTab] = useState<'stock_category' | 'dispatch_mgmt'>(() => {
    if (canAccessFinishStock) return 'stock_category';
    if (canAccessDispatch) return 'dispatch_mgmt';
    return 'stock_category';
  });

  if (!canAccessFinishStock && !canAccessDispatch) {
    return (
      <div className="p-8 text-center bg-white dark:bg-surface-dark rounded-2xl border border-red-200 text-red-600 font-bold text-sm">
        ⚠️ Access Denied: You do not have permission to view Finish Stock or Dispatch modules.
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans pb-12 w-full text-left">
      
      {/* 1. COMPACT SLEEK BANNER HEADER */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white shrink-0">
              <Package className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black tracking-tight truncate">Finished Stock & Dispatch</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-400/20 text-blue-300 border border-blue-400/30">
                  Inventory & Logistics
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MODERN SLEEK TAB SWITCHER */}
      <div className="flex items-center gap-2 bg-white dark:bg-surface-dark p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs w-full">
        {canAccessFinishStock && (
          <button
            onClick={() => setActiveTab('stock_category')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'stock_category'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Stock Categorization</span>
          </button>
        )}

        {canAccessDispatch && (
          <button
            onClick={() => setActiveTab('dispatch_mgmt')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'dispatch_mgmt'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Truck className="h-4 w-4" />
            <span>Dispatch Management</span>
          </button>
        )}
      </div>

      {/* 3. RENDER VIEWS */}
      <div className="pt-1">
        {activeTab === 'stock_category' && canAccessFinishStock && <FinishStockView hideHeader={true} />}
        {activeTab === 'dispatch_mgmt' && canAccessDispatch && <DispatchView initialTab="create_slip" hideTabs={false} hideHeader={true} />}
      </div>

    </div>
  );
};

export default FinishedStockDispatchView;
