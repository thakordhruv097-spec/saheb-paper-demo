import type {
  User,
  RawMaterialItem,
  ProductItem,
  PartyItem,
  VendorItem,
  VehicleItem,
  PulpFormula,
  MachineRoll,
  Reel,
  TransactionLog,
  UserRole,
  BoilerLog,
  EtpLog,
  ElectricityLog,
  PendingOrder,
  PackingSlip,
  StoreItem,
  RawMaterialLot,
  PaperTestReport,
} from './types';

// Helper functions for reading/writing localStorage
const getJSON = <T>(key: string, defaultValue: T): T => {
  const value = localStorage.getItem(key);
  if (!value) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
};

const setJSON = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// LocalStorage Keys
const KEYS = {
  USERS: 'saheb_users',
  RAW_MATERIALS: 'saheb_raw_materials',
  PRODUCTS: 'saheb_products',
  PARTIES: 'saheb_parties',
  VENDORS: 'saheb_vendors',
  VEHICLES: 'saheb_vehicles',
  FORMULAS: 'saheb_formulas',
  ROLLS: 'saheb_rolls',
  REELS: 'saheb_reels',
  LOGS: 'saheb_logs',
  BOILER_LOGS: 'saheb_boiler_logs',
  ETP_LOGS: 'saheb_etp_logs',
  ELECTRICITY_LOGS: 'saheb_electricity_logs',
  PENDING_ORDERS: 'saheb_pending_orders',
  PACKING_SLIPS: 'saheb_packing_slips',
  STORE_ITEMS: 'saheb_store_items',
  RAW_MATERIAL_LOTS: 'saheb_raw_material_lots',
  LAB_REPORTS: 'saheb_lab_reports',
};

// 1. Initial Seeds
const DEFAULT_USERS: User[] = [
  {
    username: 'admin',
    role: 'Admin',
    roles: ['Admin'],
    pin: '1234',
    displayName: 'Rajesh Sharma',
    email: 'admin@sahebpaper.com',
    phone: '9876543210',
    securityQuestion: 'What is your favorite color?',
    securityAnswer: 'blue',
    empId: 'EMP-001',
    designation: 'Admin / Owner',
    customModules: [
      'dashboard', 'raw_material_stock', 'pulp_mill_operations', 'machine_production', 'rewinding_reel_conversion',
      'boiler', 'etp', 'electricity', 'orders', 'finished_stock_dispatch', 'dispatch', 'spareparts_management', 'monthly_yearly_reporting'
    ]
  },
  {
    username: 'plant_manager',
    role: 'PlantManager',
    roles: ['PlantManager'],
    pin: '1111',
    displayName: 'Anil Verma',
    email: 'manager@sahebpaper.com',
    phone: '9876543219',
    securityQuestion: 'What is your favorite color?',
    securityAnswer: 'blue',
    empId: 'EMP-002',
    designation: 'Plant Manager',
    customModules: ['dashboard', 'raw_material_stock', 'pulp_mill_operations', 'machine_production']
  },
  {
    username: 'pulper',
    role: 'LabOperator',
    roles: ['LabOperator'],
    pin: '1234',
    displayName: 'Pulper',
    email: 'pulper@sahebpaper.com',
    phone: '9876543220',
    securityQuestion: 'What is your favorite color?',
    securityAnswer: 'blue',
    empId: 'EMP-003',
    designation: 'Pulper (Pulp Mill Operator)',
    customModules: ['dashboard', 'boiler', 'etp', 'electricity', 'machine_production']
  },
  {
    username: 'dispatcher',
    role: 'Dispatcher',
    roles: ['Dispatcher'],
    pin: '1234',
    displayName: 'Vikram Singh',
    email: 'dispatch@sahebpaper.com',
    phone: '9876543222',
    securityQuestion: 'What is your favorite color?',
    securityAnswer: 'blue',
    empId: 'EMP-004',
    designation: 'Dispatcher',
    customModules: ['dashboard', 'orders', 'finished_stock_dispatch', 'spareparts_management']
  },
  {
    username: 'shopper',
    role: 'Shopper',
    roles: ['Shopper'],
    pin: '1234',
    displayName: 'Amit Patel',
    email: 'shopper@sahebpaper.com',
    phone: '9876543221',
    securityQuestion: 'What is your favorite color?',
    securityAnswer: 'blue',
    empId: 'EMP-005',
    designation: 'Shopper (Store & Procurement)',
    customModules: ['dashboard', 'finished_stock_dispatch', 'dispatch']
  },
  {
    username: 'viewer',
    role: 'Viewer',
    roles: ['Viewer'],
    pin: '1234',
    displayName: 'Guest Viewer',
    email: 'viewer@sahebpaper.com',
    phone: '9876543223',
    securityQuestion: 'What is your favorite color?',
    securityAnswer: 'blue',
    empId: 'GUEST-001',
    designation: 'Guest / Read-Only Viewer',
    customModules: [
      'dashboard', 'raw_material_stock', 'pulp_mill_operations', 'machine_production', 'rewinding_reel_conversion',
      'boiler', 'etp', 'electricity', 'orders', 'finished_stock_dispatch', 'dispatch', 'spareparts_management', 'monthly_yearly_reporting'
    ]
  },
];

const DEFAULT_RAW_MATERIALS: RawMaterialItem[] = [
  // Waste Paper
  { id: 'rm-1', name: 'Indian Tissue Waste', category: 'WASTE_PAPER', stock: 5000, minThreshold: 1000 },
  { id: 'rm-2', name: 'Imported Tissue Waste', category: 'WASTE_PAPER', stock: 5000, minThreshold: 1000 },
  // Other Raw Material
  { id: 'rm-3', name: 'SMK', category: 'OTHER_RAW_MATERIAL', stock: 5000, minThreshold: 500 },
  { id: 'rm-4', name: 'Cupstock', category: 'OTHER_RAW_MATERIAL', stock: 5000, minThreshold: 500 },
  { id: 'rm-5', name: 'Pulp Sheet', category: 'OTHER_RAW_MATERIAL', stock: 5000, minThreshold: 1000 },
  { id: 'rm-7', name: 'Broke', category: 'OTHER_RAW_MATERIAL', stock: 5000, minThreshold: 500 },
  // Chemical
  { id: 'rm-8', name: 'DSR', category: 'CHEMICAL', stock: 5000, minThreshold: 200 },
  { id: 'rm-9', name: 'WSR', category: 'CHEMICAL', stock: 5000, minThreshold: 200 },
  { id: 'rm-10', name: 'Hydrogen Peroxide', category: 'CHEMICAL', stock: 5000, minThreshold: 100 },
  { id: 'rm-11', name: 'Hypo', category: 'CHEMICAL', stock: 5000, minThreshold: 100 },
  { id: 'rm-12', name: 'Bleaching Powder', category: 'CHEMICAL', stock: 5000, minThreshold: 100 },
  { id: 'rm-13', name: 'Caustic', category: 'CHEMICAL', stock: 5000, minThreshold: 100 },
  { id: 'rm-14', name: 'OBA', category: 'CHEMICAL', stock: 5000, minThreshold: 50 },
  { id: 'rm-15', name: 'M Violet', category: 'CHEMICAL', stock: 5000, minThreshold: 10 },
  { id: 'rm-16', name: 'Washing Powder', category: 'CHEMICAL', stock: 5000, minThreshold: 50 },
  { id: 'rm-17', name: 'Deformer', category: 'CHEMICAL', stock: 5000, minThreshold: 50 },
  { id: 'rm-18', name: 'PEO', category: 'CHEMICAL', stock: 5000, minThreshold: 50 },
  { id: 'rm-19', name: 'HCL', category: 'CHEMICAL', stock: 5000, minThreshold: 100 },
  { id: 'rm-20', name: 'MG Release', category: 'CHEMICAL', stock: 5000, minThreshold: 50 },
  { id: 'rm-21', name: 'MG Coating', category: 'CHEMICAL', stock: 5000, minThreshold: 50 },
  { id: 'rm-22', name: 'RO Chemical', category: 'CHEMICAL', stock: 5000, minThreshold: 50 },
  // Firewood
  { id: 'rm-23', name: 'Wood', category: 'FIREWOOD', stock: 5000, minThreshold: 2000 },
  { id: 'rm-24', name: 'Biocoal', category: 'FIREWOOD', stock: 5000, minThreshold: 2000 },
];

export function getGsmOptionsForProduct(productName: string): number[] {
  const p = productName.toLowerCase();
  if (p.includes('toilet')) {
    return [13, 14, 15, 16, 17, 18];
  }
  if (p.includes('napkin') || p.includes('paper')) {
    return [15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
  }
  return [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
}

const DEFAULT_PRODUCTS: ProductItem[] = [
  { id: 'p-1', name: 'Napkin Tissue', grade: 'A', gsm: 18, size: 30, ply: 1 },
  { id: 'p-2', name: 'Napkin B-Grade', grade: 'B', gsm: 18, size: 30, ply: 1 },
  { id: 'p-3', name: 'Toilet Tissue', grade: 'A', gsm: 17, size: 10, ply: 1 },
  { id: 'p-4', name: 'Toilet B-Grade', grade: 'B', gsm: 17, size: 10, ply: 1 },
  { id: 'p-5', name: 'KT', grade: 'A', gsm: 22, size: 20, ply: 1 },
  { id: 'p-6', name: 'KT B-Grade', grade: 'B', gsm: 22, size: 20, ply: 1 },
  { id: 'p-7', name: 'HRT', grade: 'A', gsm: 24, size: 25, ply: 1 },
];

const DEFAULT_PARTIES: PartyItem[] = [
  { id: 'pt-1', name: 'Ambika Traders', contact: '9876543210', address: 'Surat, Gujarat' },
  { id: 'pt-2', name: 'Krishna Enterprises', contact: '9876543211', address: 'Ahmedabad, Gujarat' },
  { id: 'pt-3', name: 'Kailash Paper House', contact: '9876543212', address: 'Rajkot, Gujarat' },
];

const DEFAULT_VENDORS: VendorItem[] = [
  { id: 'vd-1', name: 'Gujarat Waste Suppliers', contact: '9998887770', address: 'Baroda, Gujarat' },
  { id: 'vd-2', name: 'National Chemical Corp', contact: '9998887771', address: 'Vapi, Gujarat' },
  { id: 'vd-3', name: 'Balaji Wood Yard', contact: '9998887772', address: 'Surat, Gujarat' },
];

const DEFAULT_VEHICLES: VehicleItem[] = [
  { id: 'vh-1', vehicleNo: 'GJ-05-BY-1234', driverName: 'Ramesh Bhai', driverContact: '9988776655' },
  { id: 'vh-2', vehicleNo: 'GJ-03-XX-5678', driverName: 'Suresh Patel', driverContact: '9988776656' },
  { id: 'vh-3', vehicleNo: 'MH-04-ZZ-9012', driverName: 'Anil Singh', driverContact: '9988776657' },
];

const DEFAULT_STORE_ITEMS: StoreItem[] = [
  { id: 'st-1', type: 'BEARING', name: '6205', pcs: 15, usageArea: 'Pulp Mill Agitator' },
  { id: 'st-2', type: 'BEARING', name: '6309', pcs: 8, usageArea: 'Machine Dryer' },
  { id: 'st-3', type: 'BEARING', name: '22220', pcs: 4, usageArea: 'Rewinder Shaft' },
  { id: 'st-4', type: 'V_BELT', name: 'C-96', pcs: 12, group: 'C' },
  { id: 'st-5', type: 'V_BELT', name: 'B-72', pcs: 20, group: 'B' },
  { id: 'st-6', type: 'V_BELT', name: 'A-48', pcs: 15, group: 'A' },
];

const DEFAULT_PENDING_ORDERS: PendingOrder[] = [
  { id: 'or-1', partyId: 'pt-1', productId: 'p-1', gsm: 18, size: 30, ply: 1, qty: 10, dueDate: '2026-08-20', status: 'PENDING', dispatchedQty: 0 },
  { id: 'or-2', partyId: 'pt-2', productId: 'p-3', gsm: 17, size: 10, ply: 1, qty: 15, dueDate: '2026-08-22', status: 'PENDING', dispatchedQty: 0 },
  { id: 'or-3', partyId: 'pt-3', productId: 'p-2', gsm: 18, size: 30, ply: 1, qty: 30, dueDate: '2026-08-25', status: 'PENDING', dispatchedQty: 0 },
];

function seedOneMonthData(): void {
  const todayStr = new Date().toISOString().substring(0, 10);
  const seededKey = `saheb_clean_empty_data_v1_${todayStr}`;
  if (localStorage.getItem(seededKey)) return;
  localStorage.setItem(seededKey, 'true');

  setJSON(KEYS.FORMULAS, []);
  setJSON(KEYS.ROLLS, []);
  setJSON(KEYS.REELS, []);
  setJSON(KEYS.BOILER_LOGS, []);
  setJSON(KEYS.ETP_LOGS, []);
  setJSON(KEYS.ELECTRICITY_LOGS, []);
  setJSON(KEYS.PACKING_SLIPS, []);
  setJSON(KEYS.PENDING_ORDERS, []);
}

// Initialize Storage if empty
export function initializeStorage() {
  if (!localStorage.getItem(KEYS.USERS)) setJSON(KEYS.USERS, DEFAULT_USERS);
  if (!localStorage.getItem(KEYS.RAW_MATERIALS)) setJSON(KEYS.RAW_MATERIALS, DEFAULT_RAW_MATERIALS);
  if (!localStorage.getItem(KEYS.PRODUCTS)) setJSON(KEYS.PRODUCTS, DEFAULT_PRODUCTS);
  if (!localStorage.getItem(KEYS.PARTIES)) setJSON(KEYS.PARTIES, DEFAULT_PARTIES);
  if (!localStorage.getItem(KEYS.VENDORS)) setJSON(KEYS.VENDORS, DEFAULT_VENDORS);
  if (!localStorage.getItem(KEYS.VEHICLES)) setJSON(KEYS.VEHICLES, DEFAULT_VEHICLES);
  if (!localStorage.getItem(KEYS.FORMULAS)) setJSON(KEYS.FORMULAS, []);
  if (!localStorage.getItem(KEYS.ROLLS)) setJSON(KEYS.ROLLS, []);
  if (!localStorage.getItem(KEYS.REELS)) setJSON(KEYS.REELS, []);
  if (!localStorage.getItem(KEYS.LOGS)) setJSON(KEYS.LOGS, []);

  if (!localStorage.getItem(KEYS.BOILER_LOGS)) setJSON(KEYS.BOILER_LOGS, []);
  if (!localStorage.getItem(KEYS.ETP_LOGS)) setJSON(KEYS.ETP_LOGS, []);
  if (!localStorage.getItem(KEYS.ELECTRICITY_LOGS)) setJSON(KEYS.ELECTRICITY_LOGS, []);
  if (!localStorage.getItem(KEYS.PENDING_ORDERS)) setJSON(KEYS.PENDING_ORDERS, []);
  if (!localStorage.getItem(KEYS.PACKING_SLIPS)) setJSON(KEYS.PACKING_SLIPS, []);
  if (!localStorage.getItem(KEYS.STORE_ITEMS)) setJSON(KEYS.STORE_ITEMS, DEFAULT_STORE_ITEMS);

  // Clear all mock seed data completely
  seedOneMonthData();

  // Always fix users to ensure empId, designation, and customModules exist
  try {
    const rawUsers = getJSON<User[]>(KEYS.USERS, DEFAULT_USERS);
    let updated = false;
    const fixedUsers = rawUsers.map(u => {
      const defaultMatch = DEFAULT_USERS.find(d => d.username.toLowerCase() === u.username.toLowerCase());
      let modified = false;
      let newU = { ...u };

      if (u.username === 'admin') {
        if (u.role !== 'Admin' || !u.roles || u.roles[0] !== 'Admin') {
          newU.role = 'Admin' as UserRole;
          newU.roles = ['Admin' as UserRole];
          modified = true;
        }
      }

      if (defaultMatch) {
        if (!newU.empId && defaultMatch.empId) {
          newU.empId = defaultMatch.empId;
          modified = true;
        }
        if (!newU.designation && defaultMatch.designation) {
          newU.designation = defaultMatch.designation;
          modified = true;
        }
        if (!newU.customModules && defaultMatch.customModules) {
          newU.customModules = defaultMatch.customModules;
          modified = true;
        }
        if (defaultMatch.displayName && newU.displayName !== defaultMatch.displayName) {
          newU.displayName = defaultMatch.displayName;
          modified = true;
        }
      }

      if (u.username.toLowerCase() === 'pulper') {
        if (newU.displayName !== 'Pulper' || newU.designation !== 'Pulper (Pulp Mill Operator)') {
          newU.displayName = 'Pulper';
          newU.designation = 'Pulper (Pulp Mill Operator)';
          modified = true;
        }
      }

      if (modified) updated = true;
      return newU;
    });

    if (updated) {
      setJSON(KEYS.USERS, fixedUsers);
    }

    // Fix active session if @admin session was corrupted
    const rawSession = localStorage.getItem('saheb_session');
    if (rawSession) {
      const session = JSON.parse(rawSession);
      if (session.user && session.user.username === 'admin') {
        session.user.role = 'Admin';
        session.user.roles = ['Admin'];
        localStorage.setItem('saheb_session', JSON.stringify(session));
        localStorage.setItem('saheb_active_user', JSON.stringify(session.user));
      }
    }
  } catch (e) {
    console.error(e);
  }

  // Seed one month of operational history if not already present
  if (!localStorage.getItem('saheb_one_month_seeded_v2')) {
    seedOneMonthData();
  }
}

// Ensure execution on import
initializeStorage();

// --- AUDIT LOGS ---
export function getLogs(): TransactionLog[] {
  return getJSON<TransactionLog[]>(KEYS.LOGS, []);
}

export function addLog(module: string, action: string, details: string, user: string): TransactionLog {
  const logs = getLogs();
  const newLog: TransactionLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    module,
    action,
    details,
    user,
  };
  logs.unshift(newLog);
  setJSON(KEYS.LOGS, logs);
  return newLog;
}

// --- USERS / AUTH ---
export function getUsers(): User[] {
  const users = getJSON<User[]>(KEYS.USERS, DEFAULT_USERS);
  const validRoles: UserRole[] = ['Admin', 'PlantManager', 'LabOperator', 'Viewer', 'Shopper', 'Dispatcher'];

  return users.map(u => {
    let displayName = u.displayName;
    let designation = u.designation;

    if (u.username.toLowerCase() === 'pulper') {
      displayName = 'Pulper';
      designation = 'Pulper (Pulp Mill Operator)';
    }

    if (u.username === 'admin') {
      return {
        ...u,
        displayName,
        designation,
        role: 'Admin' as UserRole,
        roles: ['Admin' as UserRole],
      };
    }

    let primaryRole: UserRole = validRoles.includes(u.role) ? u.role : 'PlantManager';
    let userRoles: UserRole[] = (u.roles && Array.isArray(u.roles) && u.roles.length > 0)
      ? u.roles.filter(r => validRoles.includes(r))
      : [primaryRole];
    if (userRoles.length === 0) userRoles = [primaryRole];

    return {
      ...u,
      displayName,
      designation,
      role: primaryRole,
      roles: userRoles,
    };
  });
}

export function saveUser(user: User): User {
  if (user.username === 'admin') {
    user.role = 'Admin' as UserRole;
    user.roles = ['Admin' as UserRole];
  }
  const users = getUsers();
  const existingIndex = users.findIndex(u => u.username === user.username);
  if (existingIndex > -1) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  setJSON(KEYS.USERS, users);
  return user;
}

export function updateUserModules(username: string, customModules: string[], operator: string): boolean {
  const users = getUsers();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (user) {
    user.customModules = customModules;
    setJSON(KEYS.USERS, users);
    addLog('Admin', 'Role Permissions Updated', `Updated module permissions for ${user.displayName} (@${username}): ${customModules.length} active modules`, operator);
    return true;
  }
  return false;
}

export function updateRawUserPin(username: string, pin: string): boolean {
  const users = getUsers();
  const user = users.find(u => u.username === username);
  if (user) {
    user.pin = pin;
    user.needsPinReset = false; // cleared on custom set
    setJSON(KEYS.USERS, users);
    addLog('Auth', 'Password Reset', `PIN updated for user: ${username}`, username);
    return true;
  }
  return false;
}

export function deactivateUser(username: string, operator: string): boolean {
  const users = getUsers();
  const user = users.find(u => u.username === username);
  if (user) {
    user.active = user.active === false ? true : false; // toggle
    setJSON(KEYS.USERS, users);
    const action = user.active ? 'Activated' : 'Deactivated';
    addLog('Admin', `User ${action}`, `User "${username}" ${action.toLowerCase()} by ${operator}`, operator);
    return true;
  }
  return false;
}

export function resetUserPin(username: string, newPin: string, operator: string): boolean {
  const users = getUsers();
  const user = users.find(u => u.username === username);
  if (user) {
    user.pin = newPin;
    user.needsPinReset = true; // force PIN change on next login
    setJSON(KEYS.USERS, users);
    addLog('Admin', 'PIN Reset', `PIN reset for user "${username}" by ${operator}`, operator);
    return true;
  }
  return false;
}

// --- RAW MATERIALS ---
export function getRawMaterials(): RawMaterialItem[] {
  return getJSON<RawMaterialItem[]>(KEYS.RAW_MATERIALS, []);
}

export function saveRawMaterial(material: RawMaterialItem): RawMaterialItem {
  const materials = getRawMaterials();
  const existingIndex = materials.findIndex(m => m.id === material.id);
  if (existingIndex > -1) {
    materials[existingIndex] = material;
  } else {
    materials.push(material);
  }
  setJSON(KEYS.RAW_MATERIALS, materials);
  return material;
}

export function deleteRawMaterial(id: string): void {
  const materials = getRawMaterials();
  const updated = materials.filter(m => m.id !== id);
  setJSON(KEYS.RAW_MATERIALS, updated);
}

export function getRawMaterialLots(): RawMaterialLot[] {
  return getJSON<RawMaterialLot[]>(KEYS.RAW_MATERIAL_LOTS, []);
}

export function saveRawMaterialLot(lot: RawMaterialLot): void {
  const lots = getRawMaterialLots();
  lots.push(lot);
  setJSON(KEYS.RAW_MATERIAL_LOTS, lots);
}

export function updateRawMaterialStock(
  id: string,
  amount: number,
  operatorName: string,
  vendorName?: string
): boolean {
  const materials = getRawMaterials();
  const material = materials.find(m => m.id === id);
  if (material) {
    material.stock = Math.max(0, parseFloat((material.stock + amount).toFixed(3)));
    setJSON(KEYS.RAW_MATERIALS, materials);

    let lotNo = '';
    if (amount >= 0) {
      const today = new Date();
      const dateStr = today.toISOString().substring(0, 10).replace(/-/g, '');
      const rand = Math.floor(1000 + Math.random() * 9000);
      lotNo = `LOT-${dateStr}-${rand}`;

      const newLot: RawMaterialLot = {
        lotNo,
        materialId: id,
        materialName: material.name,
        weight: amount,
        vendorName: vendorName || 'System Generated',
        date: today.toISOString().substring(0, 10),
        operator: operatorName,
      };
      saveRawMaterialLot(newLot);
    }

    addLog(
      'Raw Material',
      amount >= 0 ? 'Stock Inward' : 'Stock Consumption',
      `${amount >= 0 ? 'Added' : 'Subtracted'} ${Math.abs(amount)} kg for ${material.name}. ${lotNo ? `Lot ID: ${lotNo}. ` : ''}New Stock: ${material.stock} kg`,
      operatorName
    );
    return true;
  }
  return false;
}

// --- MASTER DATA ---
export function getProducts(): ProductItem[] {
  return getJSON<ProductItem[]>(KEYS.PRODUCTS, []);
}

export function saveProduct(product: ProductItem): ProductItem {
  const products = getProducts();
  const existingIndex = products.findIndex(p => p.id === product.id);
  if (existingIndex > -1) {
    products[existingIndex] = product;
  } else {
    products.push(product);
  }
  setJSON(KEYS.PRODUCTS, products);
  return product;
}

export function getParties(): PartyItem[] {
  return getJSON<PartyItem[]>(KEYS.PARTIES, []);
}

export function saveParty(party: PartyItem): PartyItem {
  const parties = getParties();
  const existingIndex = parties.findIndex(p => p.id === party.id);
  if (existingIndex > -1) {
    parties[existingIndex] = party;
  } else {
    parties.push(party);
  }
  setJSON(KEYS.PARTIES, parties);
  return party;
}

export function getVendors(): VendorItem[] {
  return getJSON<VendorItem[]>(KEYS.VENDORS, []);
}

export function saveVendor(vendor: VendorItem): VendorItem {
  const vendors = getVendors();
  const existingIndex = vendors.findIndex(v => v.id === vendor.id);
  if (existingIndex > -1) {
    vendors[existingIndex] = vendor;
  } else {
    vendors.push(vendor);
  }
  setJSON(KEYS.VENDORS, vendors);
  return vendor;
}

export function getVehicles(): VehicleItem[] {
  return getJSON<VehicleItem[]>(KEYS.VEHICLES, []);
}

export function saveVehicle(vehicle: VehicleItem): VehicleItem {
  const vehicles = getVehicles();
  const existingIndex = vehicles.findIndex(v => v.id === vehicle.id);
  if (existingIndex > -1) {
    vehicles[existingIndex] = vehicle;
  } else {
    vehicles.push(vehicle);
  }
  setJSON(KEYS.VEHICLES, vehicles);
  return vehicle;
}

// --- PULP MILL FORMULAS ---
export function getFormulas(): PulpFormula[] {
  return getJSON<PulpFormula[]>(KEYS.FORMULAS, []);
}

export function getFormulaForDate(dateStr: string): PulpFormula | null {
  const formulas = getFormulas();
  // Filter formulas on or before target date, then sort by date desc to get the most recent active one.
  const matched = formulas
    .filter(f => f.date <= dateStr)
    .sort((a, b) => b.date.localeCompare(a.date));
  return matched.length > 0 ? matched[0] : null;
}

export function saveFormula(formula: PulpFormula, user: string): PulpFormula {
  // Validate that waste mix sums to exactly 100
  let totalWastePct = 0;
  for (const key in formula.wasteMix) {
    totalWastePct += formula.wasteMix[key];
  }
  if (Math.abs(totalWastePct - 100) > 0.0001) {
    throw new Error('Waste paper mix percentages must total exactly 100%');
  }

  const formulas = getFormulas();
  const existingIndex = formulas.findIndex(f => f.date === formula.date);
  if (existingIndex > -1) {
    formulas[existingIndex] = formula;
  } else {
    formulas.push(formula);
  }
  setJSON(KEYS.FORMULAS, formulas);
  addLog(
    'Pulp Mill',
    'Formula Logged',
    `Formula saved for ${formula.date}. Waste paper mix: ${JSON.stringify(formula.wasteMix)}. Chemicals: ${JSON.stringify(formula.chemicals)}`,
    user
  );
  return formula;
}

// --- MACHINE PRODUCTION ---
export function getRolls(): MachineRoll[] {
  return getJSON<MachineRoll[]>(KEYS.ROLLS, []);
}

export function saveRoll(roll: MachineRoll, user: string): MachineRoll {
  // 1. Locate formula active on or before roll production date
  const formula = getFormulaForDate(roll.date);
  if (!formula) {
    throw new Error("Enter today's formula first");
  }

  // 2. Perform Real-time Stock Deductions
  const materials = getRawMaterials();
  const rollWeight = roll.weight; // in kg

  // Verify and calculate deductions before saving
  const updates: { id: string; name: string; amount: number }[] = [];

  // A) Waste Mix Deductions
  for (const wasteItem in formula.wasteMix) {
    const pct = formula.wasteMix[wasteItem];
    const deductKg = rollWeight * (pct / 100);
    // Find material in database matching the waste paper name
    const mat = materials.find(m => m.name === wasteItem && m.category === 'WASTE_PAPER');
    if (mat) {
      updates.push({ id: mat.id, name: mat.name, amount: -deductKg });
    } else {
      // Fallback search in OTHER_RAW_MATERIAL (e.g. Broke, Pulp Sheet, SMK)
      const otherMat = materials.find(m => m.name === wasteItem);
      if (otherMat) {
        updates.push({ id: otherMat.id, name: otherMat.name, amount: -deductKg });
      }
    }
  }

  // B) Chemical Deductions
  for (const chemicalName in formula.chemicals) {
    const dosageKgPerTon = formula.chemicals[chemicalName];
    const deductKg = (rollWeight / 1000) * dosageKgPerTon;
    const mat = materials.find(m => m.name === chemicalName && m.category === 'CHEMICAL');
    if (mat) {
      updates.push({ id: mat.id, name: mat.name, amount: -deductKg });
    }
  }

  // 3. Atomically apply deductions
  updates.forEach(upd => {
    updateRawMaterialStock(upd.id, upd.amount, user);
  });

  // 4. Save Roll
  const rolls = getRolls();
  roll.formulaId = formula.id;
  rolls.push(roll);
  setJSON(KEYS.ROLLS, rolls);

  addLog(
    'Machine',
    'Roll Produced',
    `Roll #${roll.rollNo} logged: ${roll.product}, ${roll.weight}kg, GSM ${roll.gsm}, width ${roll.width}mm. Auto-deductions processed.`,
    user
  );

  return roll;
}

// --- REWINDER ---
export function getReels(): Reel[] {
  return getJSON<Reel[]>(KEYS.REELS, []);
}

export function saveReelsFromRoll(
  rollNo: string,
  reels: Reel[],
  brokeWeight: number,
  user: string
): void {
  const currentReels = getReels();

  // 1. Process Broke recycling loop (Adds brokeWeight back into Broke stock)
  if (brokeWeight > 0) {
    const materials = getRawMaterials();
    const brokeMaterial = materials.find(m => m.name === 'Broke');
    if (brokeMaterial) {
      updateRawMaterialStock(brokeMaterial.id, brokeWeight, user);
    }
  }

  // 2. Save new reels
  reels.forEach(newReel => {
    // Generate QR label info if not present
    if (!newReel.status) {
      newReel.status = 'QC_PENDING';
      newReel.qcGrade = 'PENDING';
    }
    currentReels.push(newReel);
  });

  setJSON(KEYS.REELS, currentReels);
  addLog(
    'Rewinder',
    'Roll Rewound',
    `Converted Roll #${rollNo} into ${reels.length} reels. Returned ${brokeWeight}kg Broke to stock.`,
    user
  );
}

export function saveSingleReel(
  reel: Reel,
  brokeWeight: number,
  user: string
): void {
  const currentReels = getReels();

  if (brokeWeight > 0) {
    const materials = getRawMaterials();
    const brokeMaterial = materials.find(m => m.name === 'Broke');
    if (brokeMaterial) {
      updateRawMaterialStock(brokeMaterial.id, brokeWeight, user);
    }
  }

  if (!reel.status) {
    reel.status = 'QC_PENDING';
    reel.qcGrade = 'PENDING';
  }

  currentReels.push(reel);
  setJSON(KEYS.REELS, currentReels);

  addLog(
    'Rewinder',
    'Reel Logged',
    `Reel #${reel.reelNo} logged: ${reel.product}, ${reel.weight}kg, GSM ${reel.gsm}. Returned ${brokeWeight}kg Broke to stock.`,
    user
  );
}

export function updateReelQC(
  reelNo: string,
  qcGrade: 'A' | 'B',
  gsmResult: number,
  brightness: number,
  softness: number,
  inspector: string
): boolean {
  const reels = getReels();
  const reel = reels.find(r => r.reelNo === reelNo);
  if (reel) {
    reel.qcGrade = qcGrade;
    reel.status = qcGrade === 'A' ? 'IN_STOCK' : 'IN_STOCK_B';
    reel.qcGsmResult = gsmResult;
    reel.qcBrightness = brightness;
    reel.qcSoftness = softness;
    reel.qcInspector = inspector;
    reel.qcTimestamp = new Date().toISOString();

    setJSON(KEYS.REELS, reels);
    addLog(
      'QC Inspection',
      `QC_${qcGrade === 'A' ? 'PASS' : 'FAIL'}`,
      `Reel ${reelNo} graded as ${qcGrade} (GSM: ${gsmResult}, Brightness: ${brightness}%, Softness: ${softness}/10). Status: ${reel.status}`,
      inspector
    );
    return true;
  }
  return false;
}

// --- BOILER ---
export function getBoilerLogs(): BoilerLog[] {
  return getJSON<BoilerLog[]>(KEYS.BOILER_LOGS, []);
}

export function saveBoilerLog(log: BoilerLog, user: string): BoilerLog {
  const logs = getBoilerLogs();
  logs.push(log);
  setJSON(KEYS.BOILER_LOGS, logs);

  // Deduct wood from raw materials if it's logged
  if (log.woodUsed > 0) {
    const materials = getRawMaterials();
    const woodMat = materials.find(m => m.name === 'Wood' && m.category === 'FIREWOOD');
    if (woodMat) {
      updateRawMaterialStock(woodMat.id, -log.woodUsed, user);
    }
  }

  addLog(
    'Boiler',
    'Boiler Shift Logged',
    `Boiler entry: wood used ${log.woodUsed}kg, water used ${log.waterUsed}L, temp ${log.temperature}°C, pressure ${log.pressure}psi`,
    user
  );
  return log;
}

// --- ETP ---
export function getEtpLogs(): EtpLog[] {
  return getJSON<EtpLog[]>(KEYS.ETP_LOGS, []);
}

export function saveEtpLog(log: EtpLog, user: string): EtpLog {
  const logs = getEtpLogs();
  logs.push(log);
  setJSON(KEYS.ETP_LOGS, logs);

  addLog(
    'ETP',
    'ETP Logged',
    `ETP entry: Flock 100 Liq ${log.flockLiq}L, Flock Master ${log.flockMaster}kg`,
    user
  );
  return log;
}

// --- ELECTRICITY ---
export function getElectricityLogs(): ElectricityLog[] {
  return getJSON<ElectricityLog[]>(KEYS.ELECTRICITY_LOGS, []);
}

export function saveElectricityLog(log: ElectricityLog, user: string): ElectricityLog {
  const logs = getElectricityLogs();
  logs.push(log);
  setJSON(KEYS.ELECTRICITY_LOGS, logs);

  addLog(
    'Electricity',
    'Electricity Logged',
    `Electricity entry: consumed ${log.units} kWh`,
    user
  );
  return log;
}

// --- PENDING ORDERS ---
export function getPendingOrders(): PendingOrder[] {
  return getJSON<PendingOrder[]>(KEYS.PENDING_ORDERS, []);
}

export function savePendingOrder(order: PendingOrder, user: string): PendingOrder {
  const orders = getPendingOrders();
  const existingIndex = orders.findIndex(o => o.id === order.id);
  if (existingIndex > -1) {
    orders[existingIndex] = order;
  } else {
    orders.push(order);
  }
  setJSON(KEYS.PENDING_ORDERS, orders);
  return order;
}

// --- PACKING SLIPS & DISPATCH ---
export function getPackingSlips(): PackingSlip[] {
  return getJSON<PackingSlip[]>(KEYS.PACKING_SLIPS, []);
}

export function savePackingSlip(slip: PackingSlip, user: string): PackingSlip {
  const slips = getPackingSlips();
  const existingIndex = slips.findIndex(s => s.id === slip.id);
  if (existingIndex > -1) {
    slips[existingIndex] = slip;
  } else {
    slips.push(slip);
  }
  setJSON(KEYS.PACKING_SLIPS, slips);
  addLog(
    'Dispatch',
    'Packing Slip Saved',
    `Packing slip #${slip.slipNo} saved with status ${slip.status}. Reels count: ${slip.reelNos.length}`,
    user
  );
  return slip;
}

export function confirmDispatch(slipId: string, user: string): void {
  const slips = getPackingSlips();
  const slip = slips.find(s => s.id === slipId);
  if (!slip) {
    throw new Error('Packing Slip not found');
  }

  if (slip.status === 'DISPATCHED') {
    throw new Error('Packing Slip is already dispatched');
  }

  const reels = getReels();
  const parties = getParties();
  const vehicles = getVehicles();

  const party = parties.find(p => p.id === slip.partyId);
  const vehicle = vehicles.find(v => v.id === slip.vehicleId);

  const partyName = party ? party.name : 'Unknown Party';
  const vehicleNo = vehicle ? vehicle.vehicleNo : 'Unknown Vehicle';

  // 1. Double-dispatch check and status validation
  for (const rNo of slip.reelNos) {
    const reel = reels.find(r => r.reelNo === rNo);
    if (!reel) {
      throw new Error(`Reel ${rNo} not found in database`);
    }
    if (reel.status !== 'IN_STOCK' && reel.status !== 'IN_STOCK_B') {
      throw new Error(`Reel ${rNo} is not in stock (current status: ${reel.status}). Cannot dispatch.`);
    }
  }

  // 2. Atomically perform status update and decrement finished stock counts
  const dispatchDate = new Date().toISOString().substring(0, 10);
  slip.reelNos.forEach(rNo => {
    const reel = reels.find(r => r.reelNo === rNo)!;
    reel.status = 'DISPATCHED';
    reel.dispatchDetails = {
      partyName,
      vehicleNo,
      dispatchDate,
      packingSlipNo: slip.slipNo,
    };

    addLog(
      'Dispatch',
      'Reel Dispatched',
      `Reel ${rNo} dispatched to ${partyName} on vehicle ${vehicleNo} under Challan #${slip.slipNo}`,
      user
    );
  });

  // 3. Update Pending Order quantities (automatic lookup mapping)
  const orders = getPendingOrders();
  slip.reelNos.forEach(rNo => {
    const reel = reels.find(r => r.reelNo === rNo)!;
    const matchedOrder = orders.find(o =>
      o.partyId === slip.partyId &&
      o.status !== 'COMPLETED' &&
      (reel.product.startsWith('Napkin') && o.productId === 'p-1' ||
        reel.product.startsWith('Toilet') && o.productId === 'p-3' ||
        reel.product.startsWith('KT') && o.productId === 'p-5' ||
        reel.product.startsWith('HRT') && o.productId === 'p-7')
    );

    if (matchedOrder) {
      matchedOrder.dispatchedQty += 1;
      if (matchedOrder.dispatchedQty >= matchedOrder.qty) {
        matchedOrder.status = 'COMPLETED';
      } else {
        matchedOrder.status = 'PARTIAL';
      }
    }
  });

  slip.status = 'DISPATCHED';

  setJSON(KEYS.REELS, reels);
  setJSON(KEYS.PACKING_SLIPS, slips);
  setJSON(KEYS.PENDING_ORDERS, orders);

  addLog(
    'Dispatch',
    'Dispatch Finalized',
    `Finalized dispatch Challan #${slip.slipNo}. Stock decremented by ${slip.reelNos.length} reels.`,
    user
  );
}

// --- STORE INVENTORY ---
export function getStoreItems(): StoreItem[] {
  return getJSON<StoreItem[]>(KEYS.STORE_ITEMS, []);
}

export function saveStoreItem(item: StoreItem, user: string): StoreItem {
  const items = getStoreItems();
  const existingIndex = items.findIndex(i => i.id === item.id);
  if (existingIndex > -1) {
    items[existingIndex] = item;
  } else {
    items.push(item);
  }
  setJSON(KEYS.STORE_ITEMS, items);
  return item;
}

export function adjustStoreItemStock(id: string, amount: number, user: string): boolean {
  const items = getStoreItems();
  const item = items.find(i => i.id === id);
  if (item) {
    item.pcs = Math.max(0, item.pcs + amount);
    setJSON(KEYS.STORE_ITEMS, items);
    addLog(
      'Store Spares',
      'Inventory Adjust',
      `Adjusted ${item.type} ${item.name} by ${amount} pcs. New Stock: ${item.pcs} pcs`,
      user
    );
    return true;
  }
  return false;
}

// --- BACKUP & RESTORE ---
export function exportBackup(): string {
  const backup: Record<string, any> = {};
  Object.entries(KEYS).forEach(([_, storageKey]) => {
    const value = localStorage.getItem(storageKey);
    if (value) {
      backup[storageKey] = JSON.parse(value);
    }
  });
  return JSON.stringify(backup, null, 2);
}

export function restoreBackup(backupJson: string, user: string): void {
  try {
    const data = JSON.parse(backupJson);
    if (!data[KEYS.USERS] || !data[KEYS.RAW_MATERIALS]) {
      throw new Error('Invalid backup file content: missing core tables.');
    }

    Object.entries(KEYS).forEach(([_, storageKey]) => {
      if (data[storageKey]) {
        localStorage.setItem(storageKey, JSON.stringify(data[storageKey]));
      }
    });

    addLog('Admin', 'Backup Restored', 'Full database restored from file backup', user);
  } catch (err: any) {
    throw new Error('Failed to restore backup: ' + err.message);
  }
}

export function clearAllDemoData(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('saheb_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
}

export function deleteProduct(id: string): void {
  const products = getProducts();
  const updated = products.filter(p => p.id !== id);
  setJSON(KEYS.PRODUCTS, updated);
}

export function deleteParty(id: string): void {
  const parties = getParties();
  const updated = parties.filter(p => p.id !== id);
  setJSON(KEYS.PARTIES, updated);
}

export function deleteVendor(id: string): void {
  const vendors = getVendors();
  const updated = vendors.filter(v => v.id !== id);
  setJSON(KEYS.VENDORS, updated);
}

export function deleteVehicle(id: string): void {
  const vehicles = getVehicles();
  const updated = vehicles.filter(v => v.id !== id);
  setJSON(KEYS.VEHICLES, updated);
}

// --- LAB QUALITY REPORTS ---
export function getLabReports(): PaperTestReport[] {
  const reports = getJSON<PaperTestReport[]>(KEYS.LAB_REPORTS, []);
  if (reports.length === 0) {
    // Default seed matching Sahab Paper Limited Paper Test Report (Roll No 11, Napkin)
    const defaultReport: PaperTestReport = {
      id: 'PTR-20260803-11',
      product: 'NAPKIN',
      rollNo: '11',
      shift: 'A',
      date: '2026-08-03',
      time: '07:50',
      targetGsm: 16,
      weight: 500,
      speed: 130,
      crepingPct: 18.00,
      gsmSamples: [16.1, 16.6, 16.5, 16.7, 16.9, 17.1, 16.5, 16.6, 16.4, 16.4, 16.6, 16.3, 16.1, 16.1],
      avgGsm: 16.5,
      maxGsm: 17.1,
      minGsm: 16.1,
      rangeGsm: 1.00,
      breakageCount: 0,
      labResultGsm: 16.5,
      moisturePct: 5.60,
      caliperMm: 80,
      bulkCcGm: 4.85,
      breakingLengthMd: 1.867,
      breakingLengthCd: 0.701,
      brightnessPct: 81.4,
      tearMd: 8.00,
      tearCd: 1.80,
      tensileDryMd: 302.20,
      tensileDryCd: 113.47,
      stretchDryMd: 2.70,
      stretchDryCd: 1.60,
      qcStatus: 'GRADE_A',
      remarks: 'Sample meets all physical strength, moisture & GSM quality benchmarks.',
      inspector: 'lab_operator',
      timestamp: '2026-08-03 07:55',
    };
    setJSON(KEYS.LAB_REPORTS, [defaultReport]);
    return [defaultReport];
  }
  return reports;
}

export function saveLabReport(report: PaperTestReport, user: string): PaperTestReport {
  const reports = getLabReports();
  const index = reports.findIndex(r => r.id === report.id || (r.rollNo === report.rollNo && r.date === report.date));
  if (index > -1) {
    reports[index] = report;
  } else {
    reports.unshift(report);
  }
  setJSON(KEYS.LAB_REPORTS, reports);
  addLog('Lab QC', 'Paper Test Report Saved', `Lab Test Report #${report.id} saved for Roll #${report.rollNo} (${report.product})`, user);
  return report;
}

export function deleteLabReport(id: string, user: string): void {
  const reports = getLabReports();
  const updated = reports.filter(r => r.id !== id);
  setJSON(KEYS.LAB_REPORTS, updated);
  addLog('Lab QC', 'Paper Test Report Deleted', `Lab Test Report #${id} deleted`, user);
}

export function deleteUser(username: string): void {
  const users = getUsers();
  const updated = users.filter(u => u.username !== username);
  setJSON(KEYS.USERS, updated);
}
