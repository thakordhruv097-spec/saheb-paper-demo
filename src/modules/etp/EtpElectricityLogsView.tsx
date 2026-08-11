import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EtpView } from './EtpView';
import { ElectricityView } from '../electricity/ElectricityView';
import { Droplet, Lightbulb } from 'lucide-react';

export const EtpElectricityLogsView: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'etp' | 'electricity'>('etp');

  return (
    <div className="space-y-6">
      
      {/* Tab Switcher Headers */}
      <div className="flex border-b border-border-light dark:border-slate-700 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('etp')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition ${
            activeTab === 'etp'
              ? 'border-primary text-primary dark:text-blue-400 font-bold'
              : 'border-transparent text-text-light-secondary dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <Droplet className="h-4.5 w-4.5" />
          <span>ETP Chemical Logs</span>
        </button>
        <button
          onClick={() => setActiveTab('electricity')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition ${
            activeTab === 'electricity'
              ? 'border-primary text-primary dark:text-blue-400 font-bold'
              : 'border-transparent text-text-light-secondary dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <Lightbulb className="h-4.5 w-4.5" />
          <span>Electricity Consumption Tracker</span>
        </button>
      </div>

      {/* RENDER VIEWS */}
      <div className="pt-2">
        {activeTab === 'etp' && <EtpView />}
        {activeTab === 'electricity' && <ElectricityView />}
      </div>

    </div>
  );
};
export default EtpElectricityLogsView;
