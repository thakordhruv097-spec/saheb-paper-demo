import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PulpMillView } from './PulpMillView';
import { MachineView } from '../machine/MachineView';
import { Factory, Cog } from 'lucide-react';

export const PulpMachineProductionView: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'pulp_formula' | 'machine_roll'>('pulp_formula');

  return (
    <div className="space-y-6">
      
      {/* Tab Switcher Headers */}
      <div className="flex border-b border-border-light dark:border-slate-700 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('pulp_formula')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition ${
            activeTab === 'pulp_formula'
              ? 'border-primary text-primary dark:text-blue-400 font-bold'
              : 'border-transparent text-text-light-secondary dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <Factory className="h-4.5 w-4.5" />
          <span>Pulp Formula Configuration</span>
        </button>
        <button
          onClick={() => setActiveTab('machine_roll')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition ${
            activeTab === 'machine_roll'
              ? 'border-primary text-primary dark:text-blue-400 font-bold'
              : 'border-transparent text-text-light-secondary dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <Cog className="h-4.5 w-4.5" />
          <span>Machine Roll Production Logs</span>
        </button>
      </div>

      {/* RENDER VIEWS */}
      <div className="pt-2">
        {activeTab === 'pulp_formula' && <PulpMillView />}
        {activeTab === 'machine_roll' && <MachineView />}
      </div>

    </div>
  );
};
export default PulpMachineProductionView;
