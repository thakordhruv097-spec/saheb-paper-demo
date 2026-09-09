# 🛡️ Saheb Paper ERP — Comprehensive System, Security & Database Audit Report

> **Generated Date**: 2026-09-09  
> **Target Project**: Saheb Paper ERP (`saheb-paper-demo`)  
> **Audit Scope**: Complete architectural, database, security (RBAC/Auth), data consistency, and performance assessment.  
> **Audit Type**: Read-only Diagnostic Audit (Zero code modifications made).

---

## 📊 Executive Summary

| Category | Status | Health Score | Key Highlights |
| :--- | :---: | :---: | :--- |
| **Data Consistency & Single Source of Truth** | **OPTIMAL** | **94 / 100** | Canonical products & live warehouse stock unified across modules. Zero mock fallbacks. |
| **Client-Side Authorization & RBAC** | **GOOD** | **88 / 100** | Multi-layer module guards, viewer lockouts, strict admin master isolation, simulation safeguards. |
| **Database & Cloud Sync Architecture** | **MODERATE** | **74 / 100** | Offline-first hybrid (LocalStorage + Supabase). Table name alias mismatch & aggressive 6s polling identified. |
| **Authentication & Cryptographic Security** | **ACTION NEEDED** | **58 / 100** | Plaintext PIN storage, client-generated tokens, permissive Supabase anon RLS policy (`FOR ALL USING (true)`). |
| **Build & Type Safety** | **EXCELLENT** | **98 / 100** | TypeScript strict compilation passing (`npm run build` 0 errors, 2,485 modules). |

---

## 🏗️ System Architecture Overview

```
                                  ┌────────────────────────────────┐
                                  │      Saheb Paper ERP UI        │
                                  └───────────────┬────────────────┘
                                                  │
                      ┌───────────────────────────┴───────────────────────────┐
                      ▼                                                       ▼
        ┌──────────────────────────┐                             ┌──────────────────────────┐
        │   LocalStorage Layer     │                             │   Supabase Cloud Sync    │
        │  - Synchronous CRUD      │ ──[ saheb_data_updated ]──► │  - Realtime Channel      │
        │  - Instant Multi-Tab Bus │                             │  - Heartbeat Polling     │
        │  - Single Source Truth   │                             │  - PostgreSQL Tables     │
        └──────────────────────────┘                             └──────────────────────────┘
```

---

## 🔍 Detailed Domain Findings

### 1. 🗄️ Database & Cloud Sync Audit

#### ✅ Strengths & Verified Implementations:
1. **Single Source of Truth (`src/data/index.ts`)**:
   - Products (`getProducts()`) and Reels (`getReels()`) act as the authoritative source across all 13 modules (Pulp Mill, Machine Production, Rewinder, Stock Categorization, Dispatch, and Label Studio).
   - Mock demo reels (`PRESET_REELS`) and sample catalog fallbacks have been completely removed.
2. **Multi-Tab Reactive Event Bus**:
   - Every `setJSON` write emits both native `storage` events and custom `saheb_data_updated` DOM events, ensuring instantaneous cross-component and cross-tab synchronization.
3. **Automated Lifecycle State Transitions**:
   - Saving a packing slip in Dispatch automatically updates linked reels to `status = 'DISPATCHED'`, removing them from active warehouse inventory (`IN_STOCK` / `IN_STOCK_B`).

#### ⚠️ Issues & Observations:
1. **Table Name Aliasing Mismatch in Cloud Sync**:
   - **PostgreSQL Schema (`supabase/migrations/20260906000000_initial_schema.sql`)**:
     Tables are named: `raw_materials`, `pulp_formulas`, `machine_rolls`, `reels`, `boiler_logs`, `etp_logs`, `electricity_logs`, `pending_orders`, `packing_slips`, `store_items`, `paper_test_reports`.
   - **Cloud Sync Init (`src/lib/supabaseSync.ts` lines 764–782)**:
     `initSupabaseSync` requests UI keys: `raw_material_stock`, `pulp_mill_operations`, `machine_production`, `rewinder_production`, `boiler_operations`, `etp_operations`, `power_grid_operations`, `order_booking`, `dispatch_receipt`, `spares_store`, `lab_quality_control`.
   - *Impact*: When Supabase is connected, querying the UI keys directly causes Supabase HTTP 400/404 table not found warnings.
2. **Aggressive Heartbeat Polling**:
   - `setInterval` triggers full sync on 18 tables every 6 seconds (`6000ms`) when the tab is visible.
   - *Impact*: Generates ~180 network queries/min per open client.
3. **Non-Atomic LocalStorage Writes**:
   - Multi-step operations (e.g. roll cutting or dispatch confirmation) execute separate JSON key writes without transactional rollback support if interrupted.

---

### 2. 🔐 Security & Access Control (RBAC) Audit

#### ✅ Strengths & Verified Implementations:
1. **Strict Admin Masters Isolation (`src/modules/auth/AuthContext.tsx`)**:
   - Module access to `admin_panel_audit`, `admin_masters`, and `user_management` is strictly locked to Super Admin (`role === 'Admin'`).
2. **Viewer Profile Hardened Lockdown**:
   - Intercepts keyboard print shortcuts (`Ctrl+P`, `Cmd+P`).
   - Overrides `window.print` globally for Viewer accounts.
   - Disables interactive edit forms and print buttons.
3. **Session Expiry Window**:
   - Enforces an 8-hour token duration window (`expiresAt: now + 8*3600*1000`).
4. **Zero Unchecked Route Fallbacks**:
   - `hasAccess()` returns `false` by default for unassigned modules.

#### ⚠️ Issues & Observations:
1. **Plaintext PIN Storage**:
   - User PINs (e.g., `"1234"`) are stored in plaintext in LocalStorage (`saheb_users`) and synced directly to Supabase (`public.users.pin`).
   - *Recommendation*: Implement cryptographic hashing (SHA-256 or bcrypt) before storing or syncing PINs.
2. **Permissive Supabase Row-Level Security (RLS)**:
   - Migration policy grants unrestricted public access:
     ```sql
     CREATE POLICY "Public access for all operations" ON public.users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
     ```
   - *Impact*: Anyone with the public anon key (`VITE_SUPABASE_ANON_KEY`) can read/write database tables directly via the Supabase REST endpoint without passing through React UI role checks.
3. **Client-Generated Pseudo Tokens**:
   - Session tokens are generated on the client via `Math.random().toString(36)`. They are not cryptographically signed JWTs validated by a backend server.
4. **Deactivated User Storage Bypass**:
   - If an admin deactivates a user, other active browser clients only invalidate their session on their next storage sync or tab focus.

---

### 3. ⚡ Frontend Performance & Code Quality Audit

#### ✅ Strengths & Verified Implementations:
1. **Clean TypeScript Build**:
   - `npm run build` (`tsc -b && vite build`) compiles with **0 errors** across **2,485 modules** in **~2.03s**.
2. **Zero Emojis & Industrial UI**:
   - Industrial Lucide iconography used consistently across all views.
3. **Thermal Label Print Precision**:
   - Standard 100×150mm page layout with clean CSS `@media print` rules, dedicated React print portal, and isolated styling.

#### ⚠️ Issues & Observations:
1. **Single Large Bundle Chunk**:
   - Main JavaScript bundle size is **~2.6 MB** (652 kB gzip).
   - *Recommendation*: Use `React.lazy()` / dynamic imports for heavy modules (`ReportsView`, `Chart.js`, `xlsx`, `docx`, `DispatchView`).
2. **Duplicate LocalStorage Keys**:
   - Legacy keys (`saheb_active_user` and `saheb_session`) coexist for backwards compatibility.

---

## 📋 Security & Architecture Recommendations Matrix

| # | Domain | Finding | Recommended Action | Priority |
| :-: | :--- | :--- | :--- | :-: |
| **1** | **Database** | Table name discrepancies between `initial_schema.sql` and `supabaseSync.ts` | Align `initSupabaseSync` table array to match PostgreSQL table names (`raw_materials`, `machine_rolls`, etc.) | **HIGH** |
| **2** | **Security** | Supabase RLS policy is open (`FOR ALL TO anon USING (true)`) | Apply restricted RLS policies and authenticate requests via Supabase Auth or secure Edge Functions | **HIGH** |
| **3** | **Security** | Plaintext PINs stored in LocalStorage and PostgreSQL | Hash PINs using SHA-256 or bcrypt before saving | **MEDIUM** |
| **4** | **Performance** | 6-second polling heartbeat on 18 tables | Extend polling interval to 30–60s and rely on Supabase Realtime WebSocket changes | **MEDIUM** |
| **5** | **Performance** | 2.6 MB un-split client bundle | Implement route-level code splitting with `React.lazy()` | **LOW** |

---

### 🏁 Conclusion

The application core logic, single source of truth data flow, and UI components are in a healthy, cohesive state. The identified items above are documented for your review and future planning.

*Report generated with zero code modifications.*
