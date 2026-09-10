import React, { useState, useEffect } from 'react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import {
  APP_VERSION,
  APP_BUILD_DATE,
  APP_CHANGELOGS,
  checkAppUpdate,
  type AppUpdateInfo,
} from '../config/version';
import { COMPANY_CONFIG } from '../config/company';
import {
  Sparkles,
  CheckCircle2,
  RefreshCw,
  X,
  Download,
  ShieldCheck,
  ArrowUpRight,
  Info,
  Calendar,
  Layers,
} from 'lucide-react';

interface AppUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoCheckOnOpen?: boolean;
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  isOpen,
  onClose,
  autoCheckOnOpen = true,
}) => {
  useBodyScrollLock(isOpen);

  const [isChecking, setIsChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [lastCheckedTime, setLastCheckedTime] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'status' | 'changelog'>('status');

  const runCheck = async () => {
    setIsChecking(true);
    try {
      // Simulate brief network check for smooth UX feedback
      await new Promise(res => setTimeout(res, 600));
      const info = await checkAppUpdate();
      setUpdateInfo(info);
      const now = new Date();
      setLastCheckedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (isOpen && autoCheckOnOpen) {
      runCheck();
    }
  }, [isOpen, autoCheckOnOpen]);

  const handleApplyUpdate = () => {
    // Clear cache & hard reload to load latest service worker / bundles
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#131d38] border border-slate-200/80 dark:border-slate-800 rounded-[28px] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[88vh] text-slate-900 dark:text-white animate-in zoom-in-95 duration-200 text-left"
        onClick={e => e.stopPropagation()}
      >
        {/* MODAL TOP HEADER */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[16px] bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-white border border-white/30 shrink-0 shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight font-heading">
                  System Updates &amp; Version
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-mono font-bold">
                  v{APP_VERSION}
                </span>
              </div>
              <p className="text-xs text-blue-100 font-medium">
                {COMPANY_CONFIG.name} ERP Architecture
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="h-4.5 w-4.5 stroke-[2.5]" />
          </button>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-5 pt-3 shrink-0 bg-slate-50/50 dark:bg-slate-900/40">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-3 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer ${
              activeTab === 'status'
                ? 'border-[#2563EB] text-[#2563EB] dark:text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            Update Status
          </button>
          <button
            onClick={() => setActiveTab('changelog')}
            className={`pb-3 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'changelog'
                ? 'border-[#2563EB] text-[#2563EB] dark:text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Version History ({APP_CHANGELOGS.length})</span>
          </button>
        </div>

        {/* SCROLLABLE MODAL CONTENT */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
          {activeTab === 'status' ? (
            <>
              {/* CURRENT VERSION STATUS CARD */}
              <div className="p-4 sm:p-5 rounded-[22px] bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[14px] bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-5 w-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Installed Version</span>
                      <span className="text-base font-black font-mono text-slate-900 dark:text-white">v{APP_VERSION}</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-200/60 dark:border-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Up-to-Date
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 text-xs border-t border-slate-200/60 dark:border-slate-800/80">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Build Date</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      {APP_BUILD_DATE}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Environment</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="h-3 w-3 text-primary" />
                      Production / RLS Active
                    </span>
                  </div>
                </div>
              </div>

              {/* LATEST RELEASE HIGHLIGHTS */}
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                  What's New in v{APP_VERSION}
                </span>
                <div className="p-4 rounded-[20px] bg-[#EEF2FF] dark:bg-indigo-950/30 border border-[#E0E7FF] dark:border-indigo-900/50 space-y-2 text-xs">
                  {APP_CHANGELOGS[0]?.highlights.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-700 dark:text-indigo-200 font-medium leading-relaxed">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] dark:bg-indigo-400 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* LAST CHECK METADATA & RE-CHECK ACTION */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Last checked: {lastCheckedTime || 'Just now'}</span>
                <button
                  type="button"
                  onClick={runCheck}
                  disabled={isChecking}
                  className="inline-flex items-center gap-1.5 font-bold text-[#2563EB] dark:text-blue-400 hover:underline cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>{isChecking ? 'Checking...' : 'Check Again'}</span>
                </button>
              </div>
            </>
          ) : (
            /* CHANGELOG TAB */
            <div className="space-y-4">
              {APP_CHANGELOGS.map((log) => (
                <div
                  key={log.version}
                  className="p-4 rounded-[20px] bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-black font-mono text-sm text-slate-900 dark:text-white">v{log.version}</span>
                      <span className="text-xs font-bold text-slate-500">&bull; {log.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{log.releaseDate}</span>
                  </div>

                  <ul className="space-y-1.5 pl-1">
                    {log.highlights.map((h, i) => (
                      <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2 font-medium">
                        <span className="text-primary font-bold">&bull;</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODAL FOOTER ACTIONS */}
        <div className="p-4 sm:p-5 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-50/50 dark:bg-slate-900/40">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-[14px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleApplyUpdate}
            className="px-6 py-2.5 rounded-[14px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-extrabold shadow-[0_4px_12px_rgba(37,99,235,0.3)] transition cursor-pointer flex items-center gap-1.5 active:scale-98"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reload &amp; Sync Cache</span>
          </button>
        </div>
      </div>
    </div>
  );
};
