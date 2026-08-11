import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useLocation } from 'react-router-dom';
import { BoilerView } from './BoilerView';
import { EtpView } from '../etp/EtpView';
import { ElectricityView } from '../electricity/ElectricityView';
import { Flame, Droplet, Lightbulb } from 'lucide-react';

export const UtilitiesEtpView: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const showBoilerTab = user?.role !== 'EtpOperator';
  
  // Read ?tab= query param from URL for bottom-nav deep linking (mobile)
  const getTabFromUrl = (): 'boiler' | 'etp_chemicals' | 'electricity' => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'etp') return 'etp_chemicals';
    if (tab === 'electricity') return 'electricity';
    if (tab === 'boiler' && showBoilerTab) return 'boiler';
    return user?.role === 'EtpOperator' ? 'etp_chemicals' : 'boiler';
  };

  const [activeTab, setActiveTab] = useState<'boiler' | 'etp_chemicals' | 'electricity'>(getTabFromUrl);

  // Sync tab when URL query param changes (from bottom nav clicks)
  useEffect(() => {
    setActiveTab(getTabFromUrl());
  }, [location.search]);

  return (
    <div className="space-y-6">
      
      {/* Title / Module Header */}
      <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-teal-500/10 dark:from-orange-950/40 dark:via-amber-950/30 dark:to-slate-900 border border-orange-200/60 dark:border-orange-900/40 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
            {activeTab === 'boiler' ? (
              <Flame className="h-7 w-7 animate-pulse" />
            ) : (
              <Droplet className="h-7 w-7 animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {showBoilerTab ? 'Utilities, Boiler & ETP Management' : 'ETP & Electricity Management'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-300/50 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Live Telemetry
              </span>
            </div>
            <p className="hidden sm:block text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
              Real-time telemetry for Boiler steam fuel, ETP water treatment chemicals, pH recycling, and electricity grid power consumption logs.
            </p>
          </div>
        </div>
      </div>

      {/* Tab Switcher Headers */}
      <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl flex flex-wrap sm:flex-nowrap gap-1.5 border border-slate-200 dark:border-slate-700/80 shadow-inner print:hidden">
        {showBoilerTab && (
          <button
            onClick={() => setActiveTab('boiler')}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
              activeTab === 'boiler'
                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25 scale-[1.01]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
            }`}
          >
            <Flame className="h-4 w-4" />
            <span>Boiler Operations</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('etp_chemicals')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
            activeTab === 'etp_chemicals'
              ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-md shadow-blue-500/25 scale-[1.01]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
          }`}
        >
          <Droplet className="h-4 w-4" />
          <span>ETP Water & Chemicals</span>
        </button>

        <button
          onClick={() => setActiveTab('electricity')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
            activeTab === 'electricity'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-md shadow-amber-500/25 scale-[1.01]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
          }`}
        >
          <Lightbulb className="h-4 w-4" />
          <span>Electricity & Power Grid</span>
        </button>
      </div>

      {/* RENDER VIEWS */}
      <div className="pt-2">
        {activeTab === 'boiler' && showBoilerTab && <BoilerView />}
        {activeTab === 'etp_chemicals' && <EtpView />}
        {activeTab === 'electricity' && <ElectricityView />}
      </div>

    </div>
  );
};

export default UtilitiesEtpView;
