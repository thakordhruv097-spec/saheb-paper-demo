import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export interface StepInfo {
  stepNumber: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  whatThisPageDoes: string;
  keyActions: string[];
  nextStep?: {
    stepNumber: number;
    title: string;
    route: string;
    subtitle: string;
  };
}

export const WORKFLOW_STEPS: Record<string, StepInfo> = {
  orderBooking: {
    stepNumber: 1,
    totalSteps: 8,
    title: 'Customer Order Bookings',
    subtitle: 'Step 1: Record Sales Orders',
    whatThisPageDoes: 'This page logs incoming customer paper orders (GSM, Width, Weight & Delivery dates) to plan factory production.',
    keyActions: [
      'Click "+ Add Pending Order"',
      'Track customer order fulfillment status',
    ],
    nextStep: {
      stepNumber: 2,
      title: 'Raw Material Stock',
      subtitle: 'Inward waste paper & chemicals',
      route: '/raw-material-stock',
    },
  },
  rawMaterial: {
    stepNumber: 2,
    totalSteps: 8,
    title: 'Raw Material Stock',
    subtitle: 'Step 2: Receive Raw Materials',
    whatThisPageDoes: 'This page manages raw material stock (Waste paper & Chemicals). Log incoming trucks here to update live inventory.',
    keyActions: [
      'Click "+ Add Purchase Inward Entry"',
      'Monitor low stock alerts',
    ],
    nextStep: {
      stepNumber: 3,
      title: 'Pulp Mill Setup',
      subtitle: 'Set daily pulp mix',
      route: '/pulp-mill-operations',
    },
  },
  pulpMill: {
    stepNumber: 3,
    totalSteps: 8,
    title: 'Pulp Mill Setup',
    subtitle: 'Step 3: Define Pulp Recipe',
    whatThisPageDoes: 'This page sets today\'s waste paper recipe mix % & chemical rates. It controls auto-deduction of raw materials.',
    keyActions: [
      'Set waste mix % (Must equal 100%)',
      'Save daily formula to auto-deduct stock',
    ],
    nextStep: {
      stepNumber: 4,
      title: 'Machine Production',
      subtitle: 'Log jumbo paper rolls',
      route: '/machine-production',
    },
  },
  machine: {
    stepNumber: 4,
    totalSteps: 8,
    title: 'Machine Production',
    subtitle: 'Step 4: Log Parent Rolls',
    whatThisPageDoes: 'This page logs jumbo paper rolls produced on the paper machine and calculates raw material consumption.',
    keyActions: [
      'Enter Roll No, GSM, Width & Weight',
      'Tracks shift downtime & machine efficiency',
    ],
    nextStep: {
      stepNumber: 5,
      title: 'Rewinder Conversion',
      subtitle: 'Cut rolls & print QR labels',
      route: '/rewinding-reel-conversion',
    },
  },
  rewinder: {
    stepNumber: 5,
    totalSteps: 8,
    title: 'Rewinder Reel Cut',
    subtitle: 'Step 5: Cut Reels & Print Labels',
    whatThisPageDoes: 'This page cuts jumbo parent rolls into customer reel sizes and prints thermal QR barcode stickers.',
    keyActions: [
      'Enter customer cut sizes & reel weights',
      'Print thermal QR code stickers',
    ],
    nextStep: {
      stepNumber: 6,
      title: 'Lab Quality Control',
      subtitle: 'Perform QC paper testing',
      route: '/lab',
    },
  },
  lab: {
    stepNumber: 6,
    totalSteps: 8,
    title: 'Lab Quality Control',
    subtitle: 'Step 6: Paper Quality Testing',
    whatThisPageDoes: 'This page tests paper GSM, Moisture & Tensile strength to certify Grade-A QC clearance before sale.',
    keyActions: [
      'Enter lab test sample readings',
      'Approve QC pass certificate',
    ],
    nextStep: {
      stepNumber: 7,
      title: 'Finished Stock Inventory',
      subtitle: 'Warehouse stock bays',
      route: '/stock-categorization',
    },
  },
  finishedStock: {
    stepNumber: 7,
    totalSteps: 8,
    title: 'Finished Stock Inventory',
    subtitle: 'Step 7: Warehouse Stock Bays',
    whatThisPageDoes: 'This page monitors finished reel stock stored in warehouse bays ready for customer dispatch truck loading.',
    keyActions: [
      'Check reel warehouse bay locations',
      'Monitor ready stock tonnage',
    ],
    nextStep: {
      stepNumber: 8,
      title: 'Dispatch Receipt',
      subtitle: 'Truck loading & gate pass',
      route: '/experiment',
    },
  },
  dispatchReceipt: {
    stepNumber: 8,
    totalSteps: 8,
    title: 'Dispatch Receipt & Gate Pass',
    subtitle: 'Step 8: Delivery Challan & Gate Pass',
    whatThisPageDoes: 'This page loads certified reels onto customer delivery trucks and issues official delivery challans & gate passes.',
    keyActions: [
      'Scan reel QR codes for truck dispatch',
      'Generate packing slip & gate pass',
    ],
  },
};

// Aliases for robustness
WORKFLOW_STEPS.dispatch = WORKFLOW_STEPS.finishedStock;

interface WorkflowStepBadgeProps {
  stepInfo: StepInfo;
}

export const WorkflowStepBadge: React.FC<WorkflowStepBadgeProps> = ({ stepInfo }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!stepInfo) return null;

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }
    // 250ms (0.25s) smooth grace period stay-open delay
    leaveTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 250);
  };

  return (
    <div
      className="relative inline-block text-left z-50 overflow-visible"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Compact Interactive Badge Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/20 hover:bg-blue-600/35 border border-blue-400/40 text-blue-300 dark:text-blue-200 text-xs font-black shadow-xs transition-all cursor-pointer group active:scale-95"
      >
        <span className="flex h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
        <span className="tracking-wide uppercase text-[10px]">
          Step {stepInfo.stepNumber}/{stepInfo.totalSteps} Guide
        </span>
        <HelpCircle className="h-3 w-3 text-blue-300 group-hover:rotate-12 transition-transform" />
      </button>

      {/* Small, Easy Hover Card Popup floating OVER all banners without clipping */}
      {isOpen && (
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="absolute right-0 sm:left-0 sm:right-auto top-full mt-2 w-72 p-3.5 rounded-2xl bg-[#0b1329] border border-blue-500/60 text-slate-100 shadow-2xl shadow-blue-950/95 backdrop-blur-xl space-y-2.5 animate-in fade-in zoom-in-95 duration-150 z-[9999]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[9px] font-black uppercase tracking-wider">
              STEP {stepInfo.stepNumber} OF {stepInfo.totalSteps}
            </span>
            <h4 className="text-xs font-black text-white flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              <span>{stepInfo.title}</span>
            </h4>
          </div>

          {/* ⭐ VIBRANT HIGHLIGHTED "WHAT THIS PAGE DOES" BOX */}
          <div className="p-2.5 bg-gradient-to-r from-blue-600/25 via-indigo-600/25 to-purple-600/20 rounded-xl border border-blue-400/60 shadow-sm space-y-1">
            <p className="text-[9px] font-black uppercase tracking-wider text-blue-300 flex items-center gap-1">
              <BookOpen className="h-3 w-3 text-blue-400 shrink-0" />
              <span>WHAT THIS PAGE DOES:</span>
            </p>
            <p className="text-[11px] font-bold text-slate-100 leading-snug">
              {stepInfo.whatThisPageDoes}
            </p>
          </div>

          {/* Key Actions Checklist */}
          {stepInfo.keyActions && stepInfo.keyActions.length > 0 && (
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                Key Actions Here:
              </p>
              <ul className="space-y-1">
                {stepInfo.keyActions.map((action, idx) => (
                  <li key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300 font-semibold">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Step Box */}
          {stepInfo.nextStep ? (
            <div className="pt-2 border-t border-slate-800/80">
              <div className="p-2 bg-gradient-to-r from-blue-950/80 to-indigo-950/80 rounded-xl border border-blue-500/30 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase text-indigo-300 tracking-wider">
                    ➡️ Next: Step {stepInfo.nextStep.stepNumber}
                  </p>
                  <p className="text-[11px] font-bold text-white truncate">{stepInfo.nextStep.title}</p>
                </div>
                <button
                  onClick={() => {
                    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
                    setIsOpen(false);
                    navigate(stepInfo.nextStep!.route);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition cursor-pointer shrink-0 active:scale-95"
                >
                  <span>Go</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-1.5 border-t border-slate-800 text-center">
              <span className="text-[10px] font-bold text-emerald-400 flex items-center justify-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Final Step • Dispatch Complete!
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
