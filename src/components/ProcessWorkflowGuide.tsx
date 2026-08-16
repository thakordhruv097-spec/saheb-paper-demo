import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Warehouse,
  Factory,
  Cog,
  RotateCw,
  Beaker,
  Truck,
  Layers,
  BarChart2,
  ArrowRight,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export interface StepInfo {
  stepNumber: number;
  id: string;
  name: string;
  path: string;
  iconName: string;
  whatItDoes: string;
  nextStepName: string;
  nextStepPath: string;
  nextStepWhatItDoes: string;
}

export const ERP_WORKFLOW_STEPS: StepInfo[] = [
  {
    stepNumber: 1,
    id: 'orders',
    name: 'Order Bookings',
    path: '/orders',
    iconName: 'FileText',
    whatItDoes: 'Book customer purchase orders (select buyer party, quantity of reels required, GSM, size, & due date).',
    nextStepName: 'Step 2: Raw Material Stock',
    nextStepPath: '/raw-material-stock',
    nextStepWhatItDoes: 'Receive & track raw materials (waste paper, chemicals, firewood).',
  },
  {
    stepNumber: 2,
    id: 'raw_material_stock',
    name: 'Raw Material Stock',
    path: '/raw-material-stock',
    iconName: 'Warehouse',
    whatItDoes: 'Receive and audit incoming raw materials (Indian/Imported Waste Paper, SMK, DSR, WSR, and Firewood).',
    nextStepName: 'Step 3: Pulp Mill Operations',
    nextStepPath: '/pulp-mill-operations',
    nextStepWhatItDoes: 'Mix waste paper & chemicals into daily Pulp Recipes.',
  },
  {
    stepNumber: 3,
    id: 'pulp_mill_operations',
    name: 'Pulp Mill Operations',
    path: '/pulp-mill-operations',
    iconName: 'Factory',
    whatItDoes: 'Create daily Pulp Recipes/Formulas mixing waste paper percentages with chemical dosages (DSR/WSR/OBA).',
    nextStepName: 'Step 4: Machine Production',
    nextStepPath: '/machine-production',
    nextStepWhatItDoes: 'Produce Jumbo Paper Rolls on Machine 1 & 2.',
  },
  {
    stepNumber: 4,
    id: 'machine_production',
    name: 'Machine Production',
    path: '/machine-production',
    iconName: 'Cog',
    whatItDoes: 'Log Jumbo Paper Rolls produced on Paper Machine 1 & 2 (gross/net weight, GSM, deckle width, shift).',
    nextStepName: 'Step 5: Rewinder Section',
    nextStepPath: '/rewinding-reel-conversion',
    nextStepWhatItDoes: 'Slit Jumbo Rolls into finished Reels (GSM, size, QC grade).',
  },
  {
    stepNumber: 5,
    id: 'rewinding_reel_conversion',
    name: 'Rewinder Section',
    path: '/rewinding-reel-conversion',
    iconName: 'RotateCw',
    whatItDoes: 'Slit Jumbo Rolls into finished Reels (assign product name, GSM, size, weight, and QC Grade A/B).',
    nextStepName: 'Step 6: Lab Quality Control',
    nextStepPath: '/lab',
    nextStepWhatItDoes: 'Perform GSM, Burst, & Softness tests to approve Grade A/B reels.',
  },
  {
    stepNumber: 6,
    id: 'lab',
    name: 'Lab Quality Control',
    path: '/lab',
    iconName: 'Beaker',
    whatItDoes: 'Conduct laboratory quality tests (GSM test, Brightness %, Softness score, Burst Factor) to certify Grade A or B.',
    nextStepName: 'Step 7: Dispatch Slips',
    nextStepPath: '/experiment',
    nextStepWhatItDoes: 'Load reels onto trucks, create Challans, & print Gate Passes.',
  },
  {
    stepNumber: 7,
    id: 'experiment',
    name: 'Dispatch Slips',
    path: '/experiment',
    iconName: 'Truck',
    whatItDoes: 'Scan/select reels from warehouse stock, assign truck & driver details, create delivery challan, & print Gate Pass.',
    nextStepName: 'Step 8: Stock Categorization',
    nextStepPath: '/finished-stock-dispatch',
    nextStepWhatItDoes: 'View & filter active warehouse stock by Product, Grade, GSM, & Size.',
  },
  {
    stepNumber: 8,
    id: 'finished_stock_dispatch',
    name: 'Stock Categorization',
    path: '/finished-stock-dispatch',
    iconName: 'Layers',
    whatItDoes: 'View & filter active warehouse stock by Product, Grade (Grade A / Grade B Only), GSM (16, 17, 18, 20, 22), and Size.',
    nextStepName: 'Step 9: Reports & Analytics',
    nextStepPath: '/monthly-yearly-reporting',
    nextStepWhatItDoes: 'Track mill production metrics, dispatch totals, & yield analytics.',
  },
  {
    stepNumber: 9,
    id: 'monthly_yearly_reporting',
    name: 'Reports & Analytics',
    path: '/monthly-yearly-reporting',
    iconName: 'BarChart2',
    whatItDoes: 'Audit mill production KPIs, monthly/yearly dispatch totals, raw material consumption, & yield efficiency.',
    nextStepName: 'End of Workflow (Process Complete 🎉)',
    nextStepPath: '/',
    nextStepWhatItDoes: 'Return to Master Dashboard.',
  },
];

interface StepHeaderBadgeProps {
  stepNumber: number;
}

export const StepHeaderBadge: React.FC<StepHeaderBadgeProps> = ({ stepNumber }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const step = ERP_WORKFLOW_STEPS.find((s) => s.stepNumber === stepNumber);

  if (!step) return null;

  return (
    <div
      className="relative inline-block z-30"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform"
      >
        <span>Step {step.stepNumber} of 9</span>
        <HelpCircle className="h-3.5 w-3.5 text-blue-200" />
      </button>

      {/* Pure Hover Popover Card Attached to Badge */}
      {hovered && (
        <div className="absolute left-0 top-full mt-2.5 z-50 w-72 sm:w-80 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700/80 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 font-sans text-left pointer-events-auto">
          {/* Top Pointer Triangle */}
          <div className="absolute left-6 -top-2 w-0 h-0 border-x-8 border-x-transparent border-b-8 border-b-slate-900" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase">
                Step {step.stepNumber} of 9
              </span>
              <h4 className="text-xs font-black text-white">{step.name}</h4>
            </div>
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          </div>

          {/* What This Step Does */}
          <div className="space-y-1 mb-2.5">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <HelpCircle className="h-3 w-3 text-blue-400" />
              <span>What this step does:</span>
            </div>
            <p className="text-[11px] text-slate-200 font-medium leading-relaxed bg-slate-800/90 p-2 rounded-xl border border-slate-700/50">
              {step.whatItDoes}
            </p>
          </div>

          {/* Next Step */}
          <div className="pt-2 border-t border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400">
              <span>NEXT STEP IN PROCESS:</span>
              <span className="text-emerald-400 font-black">{step.nextStepName}</span>
            </div>
            <p className="text-[11px] text-slate-300 font-normal leading-tight">
              {step.nextStepWhatItDoes}
            </p>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(step.nextStepPath);
              }}
              className="w-full mt-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-transform hover:scale-[1.02]"
            >
              <span>Go to {step.nextStepName.split(':')[0]}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
