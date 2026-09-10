# 🚀 Saheb Paper App — Production Roadmap

**App:** Saheb Paper Pvt. Ltd. — Stock, Production & Dispatch Management System
**Created:** September 6, 2026
**Status:** Demo/Prototype → Production-Ready

---

## 📊 Current State vs Production-Ready

| Feature | Status | Details |
|---|---|---|
| **Data Storage** | ✅ Supabase Cloud + LocalStorage | 18 production tables + Realtime Broadcast sync |
| **Security & RLS** | ✅ SHA-256 Salts + Cloud RLS | Salted hash PINs + Row Level Security active |
| **Permissions** | ✅ Production Manifest Configured | Camera, Flashlight, Storage, Internet |
| **Privacy Policy** | ✅ In-App Modal + DPDP Consent | In-app modal with full scroll lock + consent recording |
| **App Update & Version** | ✅ Centralized Version & In-App Modal | Semver checks, multi-tab changelog & update trigger |
| **Multi-user** | ✅ Role-based Access Control | Super Admin + 13 modules access matrix |
| **Offline Support** | ✅ Offline-first IndexedDB/Local Sync | Works offline, syncs with Supabase on reconnect |
| **Backup & Reset** | ✅ JSON Export/Import + Factory Reset | Full database JSON backup & clean production wipe |

---

## 🛣️ Phase-wise Roadmap

---

### Phase 1: Database + Real-time Sync ⏱️ 3-5 Days
> **Priority: 🔴 CRITICAL — Sabse pehle yeh karna hai**

**Problem:** Abhi saara data `localStorage` me hai — sirf ek device me rehta hai. Agar browser cache clear kiya to data ud jayega. Multiple staff members ka data sync nahi hota.

**Solution: Firebase Firestore (ya Supabase)**

**Tasks:**
- [ ] Firebase project create karna (`console.firebase.google.com`)
- [ ] Firebase SDK install karna (`npm install firebase`)
- [ ] `src/config/firebase.ts` config file banana
- [ ] `src/data/index.ts` — saare `localStorage` functions ko Firebase Firestore se replace karna
- [ ] Collections setup:
  - `users` — Staff/Operators
  - `raw_materials` — Raw Material inventory
  - `products` — Product master
  - `parties` — Customer/Party list
  - `vendors` — Vendor/Supplier list
  - `vehicles` — Vehicle master
  - `formulas` — Pulp Mill formulas
  - `rolls` — Machine Production rolls
  - `reels` — Rewinder reels
  - `pending_orders` — Order Booking
  - `packing_slips` — Dispatch slips
  - `store_items` — Store/V-Belt items
  - `boiler_logs` — Boiler readings
  - `etp_logs` — ETP readings
  - `electricity_logs` — Electricity meter readings
  - `lab_reports` — Lab QC reports
  - `transaction_logs` — Audit trail
- [ ] Real-time listeners (`onSnapshot`) lagana — data auto-update hoga
- [ ] Offline persistence enable karna — Internet na ho to bhi kaam chale
- [ ] Test: 2 devices pe same data dikhna chahiye

**Result:** ✅ Sab staff ke phone me same data, real-time sync, data safe in cloud

---

### Phase 2: Real Authentication ⏱️ 1-2 Days
> **Priority: 🔴 CRITICAL**

**Problem:** Abhi login fake hai — sirf localStorage me username check ho raha hai. Koi bhi data access kar sakta hai.

**Solution: Firebase Authentication**

**Tasks:**
- [ ] Firebase Auth enable karna (Email/Password method)
- [ ] Signup flow — Admin creates users
- [ ] Login flow — Proper email/password auth
- [ ] Password reset (Forgot Password) feature
- [ ] Session management — auto-logout after inactivity
- [ ] Role-Based Access Control (RBAC) — Firestore security rules
  - `admin` — Full access
  - `manager` — Read + Write (own department)
  - `operator` — Write only (assigned module)
  - `viewer` — Read only
- [ ] `ProtectedRoute.tsx` update — verify Firebase auth token
- [ ] Firestore Security Rules deploy karna

**Result:** ✅ Secure login, proper roles, no unauthorized access

---

### Phase 3: Android Permissions ⏱️ Complete
> **Status: ✅ COMPLETED**

**Tasks:**
- [x] `android/app/src/main/AndroidManifest.xml` verify + update:
  ```xml
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
  <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
  <uses-permission android:name="android.permission.CAMERA" />
  <uses-permission android:name="android.permission.FLASHLIGHT" />
  <uses-permission android:name="android.permission.VIBRATE" />
  <uses-permission android:name="android.permission.WAKE_LOCK" />
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
  <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
  ```
- [x] Runtime permission handling for Camera (QR scanner)
- [x] Capacitor Android assets synchronized (`npx cap sync android`)
- [x] Flashlight / Torch feature enabled for low-light industrial areas

**Result:** ✅ QR scan, file save, internet access properly working

---

### Phase 4: In-App Privacy Policy ⏱️ Complete
> **Status: ✅ COMPLETED**

**Tasks:**
- [x] Settings/Profile me "Privacy Policy" page add karna (`PrivacyPolicyModal.tsx`)
- [x] Privacy Policy content render karna (scrollable modal with body scroll lock)
- [x] First-time app open hone par consent popup (`PrivacyConsentModal.tsx` DPDP Act 2023)
- [x] Consent status save karna (per user in localStorage + Supabase)
- [x] Footer & menu me Privacy Policy link

**Result:** ✅ Legal compliance, DPDP Act ready

---

### Phase 5: App Version Check & In-App Updates ⏱️ Complete
> **Status: ✅ COMPLETED (2026-09-11)**

**Implemented Features:**
- [x] Centralized version management in `src/config/version.ts` (`APP_VERSION = '1.1.0'`, `APP_BUILD_DATE = '2026-09-11'`)
- [x] Release changelog system (`APP_CHANGELOGS`) tracking milestone releases and security features
- [x] Semver version comparison engine (`compareVersions`) and update checking utility (`checkAppUpdate`)
- [x] In-app `AppUpdateModal.tsx` with dual tabs ("Update Status" & "Version History")
- [x] Zero-jitter background scroll locking with `useBodyScrollLock`
- [x] One-click "Reload & Sync Cache" action for instantaneous web asset update
- [x] Integrated "Check for Updates" triggers into:
  - Header Profile Dropdown (`Layout.tsx`)
  - Desktop Left Navigation Sidebar Footer (`Layout.tsx`)
  - Mobile Menu Navigation Drawer (`Layout.tsx`)
  - Master Admin Profile View (`AdminProfileView.tsx`)
  - Operator Profile View (`OperatorProfileView.tsx`)
  - Mobile Profile View (`MobileProfileView.tsx`)
  - Admin Masters System / Backup Tab (`AdminMasters.tsx`)

**Result:** ✅ In-app version tracking, real-time update notifications, and transparent release changelogs

---

### Phase 6: Admin Panel for Client ⏱️ 3-5 Days
> **Priority: 🟢 LATER**

**Problem:** Client ko kuch change karna ho (new product add, user create, price update) to aapko code edit karna padta hai.

**Solution: Web Admin Dashboard**

**Tasks:**
- [ ] Separate web admin panel (React + Firebase)
- [ ] User Management — Create/Edit/Delete users
- [ ] Product Master — Add/Edit products without code changes
- [ ] Party/Vendor Management
- [ ] Reports — Daily production, dispatch summary
- [ ] Settings — Company config editable
- [ ] Deploy on Vercel (free)

**Result:** ✅ Client khud manage kar sakta hai, aapko call nahi karega

---

## 📱 Bonus: Extra Production Features

### Error Tracking & Crash Reporting
- [ ] Firebase Crashlytics integrate karna
- [ ] App crash hone par automatic report milega
- [ ] User ne kya kiya crash se pehle — breadcrumbs

### Analytics
- [ ] Firebase Analytics — kaunsa module kitna use ho raha hai
- [ ] User activity tracking
- [ ] Daily active users count

### Backup & Export
- [ ] Automated daily backup (Firebase → Cloud Storage)
- [ ] Excel/PDF export for reports
- [ ] Data restore capability

### Performance
- [ ] Code splitting (lazy loading modules)
- [ ] Image optimization
- [ ] App startup time optimization

---

## ⏰ Timeline Summary

| Phase | Duration | Priority | Depends On |
|---|---|---|---|
| **Phase 1:** Database + Sync | 3-5 days | 🔴 Critical | — |
| **Phase 2:** Authentication | 1-2 days | 🔴 Critical | Phase 1 |
| **Phase 3:** Permissions | 2-3 hours | 🟡 Medium | — |
| **Phase 4:** Privacy Policy page | 1-2 hours | 🟡 Medium | — |
| **Phase 5:** App Updates | 1 day | 🟢 Later | Phase 1 |
| **Phase 6:** Admin Panel | 3-5 days | 🟢 Later | Phase 1+2 |

**Total Estimated Time: ~10-15 days for full production-ready app**

---

## 🔥 Immediate Next Steps

1. ✅ APK build complete karo (Android Studio me abhi ho raha hai)
2. ✅ Client ko demo APK bhejo
3. 🔥 **Firebase setup shuru karo (Phase 1+2)**
4. Phase 3+4 parallel me karo (quick wins)

---

*This roadmap is a living document. Update as phases are completed.*
