import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { RawMaterialView } from './RawMaterialView';
import { FinishStockView } from '../finish-stock/FinishStockView';
import { DispatchView } from '../dispatch/DispatchView';
import { Warehouse, Package, Truck } from 'lucide-react';

export const RawMaterialFinishedStockView: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Warehouse staff does not have access to Raw Material stock inwards, so we default their tab to Finished Stock
  const isWarehouseStaff = user?.role === 'WarehouseStaff';
  const [activeTab, setActiveTab] = useState<'raw_material' | 'finish_stock' | 'dispatch'>(
    isWarehouseStaff ? 'finish_stock' : 'raw_material'
  );

  return (
    <div className="space-y-6">
      
      {/* Tab Switcher Headers */}
      <div className="flex border-b border-border-light dark:border-slate-700 overflow-x-auto gap-2 print:hidden">
        {!isWarehouseStaff && (
          <button
            onClick={() => setActiveTab('raw_material')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition ${
              activeTab === 'raw_material'
                ? 'border-primary text-primary dark:text-blue-400 font-bold'
                : 'border-transparent text-text-light-secondary dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Warehouse className="h-4.5 w-4.5" />
            <span>Raw Material Ledger</span>
          </button>
        )}
        <button
          onClick={() => setActiveTab('finish_stock')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition ${
            activeTab === 'finish_stock'
              ? 'border-primary text-primary dark:text-blue-400 font-bold'
              : 'border-transparent text-text-light-secondary dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <Package className="h-4.5 w-4.5" />
          <span>Finished Reel Inventory</span>
        </button>
        <button
          onClick={() => setActiveTab('dispatch')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition ${
            activeTab === 'dispatch'
              ? 'border-primary text-primary dark:text-blue-400 font-bold'
              : 'border-transparent text-text-light-secondary dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <Truck className="h-4.5 w-4.5" />
          <span>Delivery Challans & Dispatch</span>
        </button>
      </div>

      {/* RENDER VIEWS */}
      <div className="pt-2">
        {activeTab === 'raw_material' && !isWarehouseStaff && <RawMaterialView />}
        {activeTab === 'finish_stock' && <FinishStockView />}
        {activeTab === 'dispatch' && <DispatchView />}
      </div>

    </div>
  );
};
export default RawMaterialFinishedStockView;
