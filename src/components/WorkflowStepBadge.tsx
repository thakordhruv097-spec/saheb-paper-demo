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
  stepInfo?: StepInfo;
}

export const WorkflowStepBadge: React.FC<WorkflowStepBadgeProps> = () => {
  return null;
};

