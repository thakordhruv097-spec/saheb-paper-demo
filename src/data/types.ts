export type UserRole =
  | 'Admin'
  | 'PlantManager'
  | 'LabOperator'
  | 'Viewer'
  | 'Shopper'
  | 'Dispatcher'
  | 'PulpOperator'
  | 'MachineOperator'
  | 'RewinderOperator'
  | 'BoilerOperator'
  | 'WarehouseStaff'
  | 'StoreManager'
  | 'EtpOperator'
  | 'Management';

export interface User {
  username: string;
  role: UserRole; // Primary role
  roles?: UserRole[]; // Array of assigned multi-roles (e.g. ['PlantManager', 'LabOperator'])
  pin: string;
  displayName: string;
  email: string;
  phone: string;
  active?: boolean;
  needsPinReset?: boolean;
  securityQuestion?: string;
  securityAnswer?: string;
}

export type RawMaterialCategory =
  | 'WASTE_PAPER'
  | 'OTHER_RAW_MATERIAL'
  | 'CHEMICAL'
  | 'FIREWOOD';

export interface RawMaterialItem {
  id: string;
  name: string;
  category: RawMaterialCategory;
  stock: number; // in kg
  minThreshold: number; // in kg
}

export interface ProductItem {
  id: string;
  name: string; // e.g. "Napkin Tissue", "Toilet Tissue", etc.
  grade: 'A' | 'B';
  gsm: number;
  size: number;
  ply: number;
}

export interface PartyItem {
  id: string;
  name: string;
  contact: string;
  address: string;
}

export interface VendorItem {
  id: string;
  name: string;
  contact: string;
  address: string;
}

export interface VehicleItem {
  id: string;
  vehicleNo: string;
  driverName: string;
  driverContact: string;
}

export interface PulpFormula {
  id: string;
  date: string; // YYYY-MM-DD
  wasteMix: { [materialName: string]: number }; // percentage e.g. { "Indian Tissue Waste": 50, "SMK": 20 }
  chemicals: { [chemicalName: string]: number }; // kg per ton e.g. { "DSR": 10 }
}

export interface MachineRoll {
  rollNo: string; // unique Roll No
  product: string;
  weight: number; // in kg
  gsm: number;
  width: number; // in mm
  shift: 'A' | 'B' | 'C';
  startTime: string;
  offTime: string;
  downtimeReason: string;
  date: string; // YYYY-MM-DD
  formulaId: string; // references PulpFormula.id
}

export type ReelStatus =
  | 'PRODUCED'
  | 'QC_PENDING'
  | 'QC_PASSED'
  | 'QC_FAILED'
  | 'IN_STOCK'
  | 'IN_STOCK_B'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'RETURNED';

export type QCGrade = 'A' | 'B' | 'PENDING';

export interface Reel {
  reelNo: string; // unique reel number, e.g. SAHEB-R-YYYYMMDD-XXXX
  parentRollNo: string;
  product: string;
  gsm: number;
  size: number;
  ply: number;
  weight: number; // in kg
  dia: number; // in mm
  joint: number; // number of joints
  status: ReelStatus;
  qcGrade: QCGrade;
  productionDate: string; // YYYY-MM-DD HH:MM
  qcInspector?: string;
  qcTimestamp?: string;
  qcGsmResult?: number;
  qcBrightness?: number;
  qcSoftness?: number;
  dispatchDetails?: {
    partyName: string;
    vehicleNo: string;
    orderRef?: string;
    dispatchDate: string;
    packingSlipNo?: string;
  };
}

export interface TransactionLog {
  id: string;
  timestamp: string; // ISO string
  module: string; // e.g. "Raw Material", "Pulp Mill", "Machine", "Rewinder", "Dispatch", "Auth"
  action: string; // e.g. "Login", "Deduction", "Return", "QC_Pass", "Dispatch"
  details: string; // human readable details
  user: string; // username
}

export interface BoilerLog {
  id: string;
  date: string; // YYYY-MM-DD
  woodUsed: number; // kg
  waterUsed: number; // liters
  pressure: number; // psi
  temperature: number; // °C
  operator: string;
  shift: 'A' | 'B' | 'C';
}

export interface EtpLog {
  id: string;
  date: string; // YYYY-MM-DD
  flockLiq: number; // liters
  flockMaster: number; // kg
  operator: string;
}

export interface ElectricityLog {
  id: string;
  date: string; // YYYY-MM-DD
  units: number; // kWh
  operator: string;
}

export interface PendingOrder {
  id: string;
  partyId: string;
  productId: string;
  gsm: number;
  size: number;
  ply: number;
  qty: number; // reels required
  dueDate: string; // YYYY-MM-DD
  status: 'PENDING' | 'PARTIAL' | 'COMPLETED';
  dispatchedQty: number;
}

export interface PackingSlip {
  id: string;
  slipNo: string;
  date: string;
  partyId: string;
  vehicleId: string;
  reelNos: string[];
  driverSignature: string;
  receiverSignature: string;
  status: 'DRAFT' | 'DISPATCHED';
}

export interface StoreItem {
  id: string;
  type: 'BEARING' | 'V_BELT';
  name: string; // Bearing number or V-belt size
  pcs: number;
  group?: string; // V-belt group (A, B, C etc)
  usageArea?: string; // Bearing usage area
}

export interface RawMaterialLot {
  lotNo: string;
  materialId: string;
  materialName: string;
  weight: number;
  vendorName: string;
  date: string;
  operator: string;
}

export interface PaperTestReport {
  id: string; // e.g. PTR-20260808-01
  product: string; // e.g. "NAPKIN", "TOILET TISSUE"
  rollNo: string; // e.g. "11" or "ROLL-20260808-01"
  shift: 'A' | 'B' | 'C';
  date: string; // YYYY-MM-DD (e.g. "2026-08-03")
  time: string; // HH:MM (e.g. "07:50")
  targetGsm: number; // e.g. 16
  weight: number; // e.g. 500 (kg)
  speed: number; // e.g. 130 (m/min)
  crepingPct: number; // e.g. 18.00 (%)
  
  // 14 GSM sample profile readings across roll width
  gsmSamples: number[];
  
  // Auto-calculated profile stats
  avgGsm: number;
  maxGsm: number;
  minGsm: number;
  rangeGsm: number;
  breakageCount: number;

  // 13 Lab Test Parameters
  labResultGsm: number; // g/m2 (SR 1)
  moisturePct: number; // % (SR 2)
  caliperMm: number; // MM microns (SR 3)
  bulkCcGm: number; // cc/gm (SR 4)
  breakingLengthMd: number; // Mtr 10cm length MD (SR 5)
  breakingLengthCd: number; // Mtr 10cm length CD (SR 6)
  brightnessPct: number; // % Optical (SR 7)
  tearMd: number; // J/m2 (SR 8)
  tearCd: number; // N/M (SR 9)
  tensileDryMd: number; // N/M 1 PLY (SR 10)
  tensileDryCd: number; // % 1 PLY (SR 11)
  stretchDryMd: number; // % 1 PLY (SR 12)
  stretchDryCd: number; // 1 PLY (SR 13)

  qcStatus: 'GRADE_A' | 'GRADE_B' | 'REJECTED';
  remarks: string;
  inspector: string;
  timestamp: string;
}

