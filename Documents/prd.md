# Saheb Paper Pvt. Ltd. — ERP System
## Product Requirements Document (PRD)

**Version**: 2.0  
**Last Updated**: 2026-08-03  
**Author**: Engineering Team  
**Status**: Production (Demo Phase)

---

## 1. Executive Summary

Saheb Paper Pvt. Ltd. is a tissue paper manufacturing mill (Napkin, Toilet, KT & HRT Tissue) located in Surat, Gujarat, India. This ERP system digitizes the **end-to-end paper mill operations** — from raw material intake to finished reel dispatch — replacing manual paper registers with a mobile-first, role-based digital platform.

The application is built as a **Progressive Web App (PWA)** using Capacitor for Android distribution and Electron for Windows distribution, enabling deployment across phones, tablets, and desktops from a single codebase.

---

## 2. Problem Statement

| Pain Point | Impact |
|---|---|
| Manual paper-based record keeping across 8+ departments | Data loss, duplication, delayed reporting |
| No real-time visibility of production status | Owner/management cannot track operations remotely |
| QC inspections recorded in physical registers | Traceability failures, customer complaints |
| No reel-level tracking from production to dispatch | Cannot trace quality issues back to batch/formula |
| Utility (Boiler, ETP, Electricity) logs maintained separately | Compliance gaps, environmental violations |
| No centralized inventory for spare parts | Machine downtime due to unavailable bearings/belts |

---

## 3. Product Vision

> A unified, mobile-first ERP that every mill worker — from the boiler operator to the CEO — can use on their phone to log, track, and analyze the entire paper manufacturing lifecycle with full QR-based traceability.

---

## 4. Target Users & Roles

| Role | Access Level | Primary Actions |
|---|---|---|
| **Admin** | Full access to all 11 modules | Master data CRUD, user management, all reports |
| **Management** | Full read access + dashboards | View-only oversight, reports, analytics |
| **Pulp Operator** | Pulp Mill + Machine Production | Log pulp formulas, batch mixing, machine rolls |
| **Machine Operator** | Machine Production + Pulp Mill | Log parent roll production, shift entries |
| **Rewinder Operator** | Rewinder Section | Convert parent rolls → finished reels, generate QR labels |
| **Boiler Operator** | Boiler + ETP + Electricity | Log fuel/water/steam data, ETP chemicals, power readings |
| **ETP Operator** | ETP + Electricity | Log water treatment chemical usage, power grid readings |
| **Warehouse Staff** | Finished Stock + Dispatch + Orders | Manage reel inventory, create dispatch challans |
| **Store Manager** | Store Inventory | Manage bearings, V-belts, spare parts |

---

## 5. Core Modules

### 5.1 Dashboard
- **Real-time KPI cards**: Total reels produced, dispatched, QC pending, raw material alerts
- **Role-adaptive content**: Operators see only their department KPIs; Admin/Management see full overview
- **Date-range & timeframe filtering**: Day / Week / Month / All with date stepper
- **Low stock alerts, QC backlog alerts, order due alerts** in notification bell

### 5.2 Order Bookings
- Party-wise order management with product specifications (GSM, size, ply, qty)
- Status tracking: PENDING → PARTIAL → COMPLETED
- Due date tracking with approaching-deadline alerts

### 5.3 Raw Material Stock
- **4 categories**: Waste Paper, Other Raw Material, Chemical, Firewood
- Real-time stock levels with min-threshold alerts
- Inward lot tracking with vendor, weight, date
- Stock deduction linked to pulp formula usage

### 5.4 Pulp Mill Operations
- Pulp formula recipe builder (waste mix % + chemical dosage per ton)
- Batch logging with date, operator, formula reference
- Links downstream to Machine Production

### 5.5 Machine Production
- **Parent roll logging**: Roll number, product, weight, GSM, width, shift timing
- Shift-based entry (A/B/C shifts) with start time, off time, downtime reason
- Links to pulp formula used

### 5.6 Rewinder Section
- **Parent roll → Finished reel conversion**: Splits parent rolls into customer-size reels
- QC inspection workflow: QC_PENDING → QC_PASSED (Grade A/B) or QC_FAILED
- **QR Code generation**: Unique reel number encoded as QR for full traceability
- **Thermal label printing**: TSC printer support (4×3, 3×2, 2×2 inch) + A4 grid

### 5.7 Utilities Management (Boiler, ETP, Electricity)
- **Boiler**: Wood fuel (kg), water consumption (L), steam pressure (PSI), temperature (°C)
- **ETP**: Flock liquid (L) and flock master (kg) chemical dosing logs
- **Electricity**: Daily power consumption (kWh) readings
- **Mobile bottom nav**: 3 separate tabs (Boiler / ETP / Power) for quick access

### 5.8 Finished Stock & Dispatch
- Reel inventory view with status filtering
- Packing slip / Challan creation with party, vehicle, driver info
- Dispatch workflow with QR scanning for reel identification
- Printable dispatch receipts

### 5.9 Store Inventory (Spare Parts)
- Bearing inventory (by bearing number, usage area)
- V-belt inventory (by size group: A, B, C)
- Stock in/out logging

### 5.10 Reports & Analytics
- Monthly/Yearly production summaries
- Department-wise report generation
- Exportable report tables

### 5.11 Admin Settings
- Master data management: Products, Parties, Vendors, Vehicles, Raw Materials
- User management: Create/edit users, assign roles, PIN management
- System configuration

---

## 6. Non-Functional Requirements

| Requirement | Specification |
|---|---|
| **Offline-first** | All data persisted in localStorage; works without internet |
| **Authentication** | PIN-based login (4-digit), 8-hour session expiry, security questions |
| **Multi-language** | English, Hindi (हिन्दी), Gujarati (ગુજરાતી) |
| **Responsive design** | Mobile-first with tablet/desktop sidebar layout |
| **Dark mode** | Full dark theme support with localStorage persistence |
| **Performance** | < 3s initial load, smooth 60fps scrolling |
| **Print support** | Native browser print for labels, challans, reports |
| **Platforms** | Web (PWA), Android (.apk via Capacitor), Windows (.exe via Electron) |

---

## 7. Success Metrics

| Metric | Target |
|---|---|
| Daily Active Users (DAU) across all roles | 100% of mill operators |
| Time to log a shift entry | < 30 seconds |
| QR scan → Traceability lookup | < 2 seconds |
| Report generation time | < 5 seconds |
| Data entry error rate | < 1% (vs 15% paper-based) |

---

## 8. Out of Scope (v2.0)

- Cloud sync / multi-device real-time sync
- Payment / invoice / GST integration
- Machine IoT sensor integration (auto-logging)
- AI-based production optimization
- Customer-facing portal
