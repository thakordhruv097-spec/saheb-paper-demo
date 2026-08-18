import React, { useState, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getUsers, updateUserModules } from '../../data/index';
import type { User } from '../../data/types';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  Plus,
  Check,
  UserCheck,
  Zap
} from 'lucide-react';

export interface ModuleDefinition {
  key: string;
  label: string;
}

export const MODULES_13: ModuleDefinition[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'raw_material_stock', label: 'Raw Material Sto...' },
  { key: 'pulp_mill_operations', label: 'Pulp Mill' },
  { key: 'machine_production', label: 'Plant Manager' },
  { key: 'rewinding_reel_conversion', label: 'Rewinder' },
  { key: 'boiler', label: 'Boiler' },
  { key: 'etp', label: 'ETP' },
  { key: 'electricity', label: 'Electricity' },
  { key: 'orders', label: 'Pending Orders' },
  { key: 'finished_stock_dispatch', label: 'Finish Stock' },
  { key: 'dispatch', label: 'Dispatch' },
  { key: 'spareparts_management', label: 'Store (Spares)' },
  { key: 'monthly_yearly_reporting', label: 'Reports & Analy...' },
];

export const RoleManagementView: React.FC = () => {
  const { user: currentUser, simulateWorkerLogin, updateUserProfile } = useAuth();

  if (currentUser?.role !== 'Admin') {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-red-200 dark:border-red-800 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="text-base font-black text-slate-900 dark:text-white">Access Restricted</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
          Role & Module Permission management is restricted to Super Admin only.
        </p>
      </div>
    );
  }

  const [users, setUsers] = useState<User[]>(() => getUsers());
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const reloadUsers = () => {
    setUsers(getUsers());
  };

  const handleToggleModule = (targetUser: User, moduleKey: string) => {
    const currentModules = targetUser.customModules && Array.isArray(targetUser.customModules)
      ? [...targetUser.customModules]
      : MODULES_13.map(m => m.key);

    const exists = currentModules.includes(moduleKey);
    let updatedModules: string[];

    if (exists) {
      updatedModules = currentModules.filter(m => m !== moduleKey);
    } else {
      updatedModules = [...currentModules, moduleKey];
    }

    // Save to storage
    updateUserModules(targetUser.username, updatedModules, currentUser?.displayName || 'Admin');
    
    // If updating current active user session, update state
    if (currentUser?.username.toLowerCase() === targetUser.username.toLowerCase()) {
      updateUserProfile({ customModules: updatedModules });
    }

    reloadUsers();
    
    const modLabel = MODULES_13.find(m => m.key === moduleKey)?.label || moduleKey;
    const action = exists ? 'disabled for' : 'granted to';
    triggerToast(`"${modLabel}" role ${action} ${targetUser.displayName}`);
  };

  const handleSimulateLogin = async (targetUser: User) => {
    if (currentUser?.username === targetUser.username) {
      triggerToast(`Currently logged in as ${targetUser.displayName}`);
      return;
    }

    const success = await simulateWorkerLogin(targetUser.username);
    if (success) {
      triggerToast(`Simulating active worker session: ${targetUser.displayName} (${targetUser.designation || targetUser.role})`);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch =
        u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.empId && u.empId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.designation && u.designation.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchSearch;
    });
  }, [users, searchTerm]);

  return (
    <div className="space-y-6 font-sans pb-12 w-full text-left">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4.5 w-4.5 text-blue-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TOP HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-white border border-white/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black tracking-tight">Role Management & Module Permission Matrix</h2>
          </div>
          <p className="text-xs text-slate-300 font-medium">
            Granularly assign ERP modules to specific worker profiles and simulate active worker sessions to test permissions
          </p>
        </div>

        {/* SEARCH BAR */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search worker profile or ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/10 dark:bg-slate-900/90 border border-white/20 dark:border-slate-700 rounded-xl text-xs font-semibold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          />
        </div>
      </div>

      {/* USER PROFILE CARDS LIST */}
      <div className="space-y-4">
        {filteredUsers.map(u => {
          const isCurrent = currentUser?.username.toLowerCase() === u.username.toLowerCase();
          const activeModules = u.customModules && Array.isArray(u.customModules)
            ? u.customModules
            : MODULES_13.map(m => m.key);
          const activeCount = activeModules.length;

          const empId = u.empId || `EMP-${Math.floor(100 + Math.random() * 900)}`;
          const designation = u.designation || (u.role === 'Admin' ? 'Admin / Owner' : `${u.displayName} (${u.role})`);

          return (
            <div
              key={u.username}
              className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 transition-all hover:border-slate-300 dark:hover:border-slate-600"
            >
              {/* CARD HEADER */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3.5">
                  {/* User Initial Circle */}
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary dark:text-blue-400 font-black text-lg flex items-center justify-center shrink-0 border border-primary/20">
                    {u.displayName.substring(0, 1).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">{u.displayName}</h3>
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold uppercase border border-slate-200 dark:border-slate-700">
                        {empId}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase border border-emerald-200 dark:border-emerald-800/60">
                        Active
                      </span>
                    </div>
                    <p className="text-xs font-extrabold text-primary dark:text-blue-400 mt-0.5">{designation}</p>
                  </div>
                </div>

                {/* RIGHT ACTIONS: COUNTER & SIMULATE BUTTON */}
                <div className="flex items-center gap-3 self-start md:self-auto">
                  <div className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black tracking-wide">
                    {activeCount} / 13 Modules Active
                  </div>

                  <button
                    onClick={() => handleSimulateLogin(u)}
                    className={`px-4 py-2 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 ${
                      isCurrent
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 cursor-default'
                        : 'bg-gradient-to-br from-cyan-600 to-sky-700 hover:from-cyan-700 hover:to-sky-800 text-white uppercase tracking-wider shadow-md shadow-sky-700/25 transition cursor-pointer'
                    }`}
                  >
                    {isCurrent ? (
                      <>
                        <UserCheck className="h-3.5 w-3.5 text-primary dark:text-blue-400" />
                        <span>Simulating Current User</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-3.5 w-3.5 text-amber-300" />
                        <span>Simulate Worker Login</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* TOGGLE SUBHEADER */}
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans">
                TOGGLE MODULE PERMISSIONS FOR {u.displayName.toUpperCase()}:
              </div>

              {/* 13 MODULE CHIPS GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {MODULES_13.map(mod => {
                  const isActive = activeModules.includes(mod.key);

                  return (
                    <button
                      key={mod.key}
                      onClick={() => handleToggleModule(u, mod.key)}
                      className={`px-3.5 py-2.5 rounded-full border text-xs font-bold transition-all cursor-pointer flex items-center gap-2 select-none active:scale-95 truncate ${
                        isActive
                          ? 'bg-gradient-to-br from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/70 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/80'
                      }`}
                    >
                      {isActive ? (
                        <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      ) : (
                        <Plus className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                      )}
                      <span className="truncate">{mod.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs font-bold bg-white dark:bg-surface-dark rounded-3xl border border-slate-200 dark:border-slate-700">
            No worker profiles matching search term.
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleManagementView;
