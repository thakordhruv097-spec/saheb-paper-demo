# Saheb Paper Pvt. Ltd. — ERP System
## UI/UX Design Brief

**Version**: 2.0  
**Last Updated**: 2026-08-03

---

## 1. Design Philosophy

### Core Principles
1. **Mobile-First**: Every screen designed for 360px width first, then scaled up
2. **Industrial Clarity**: Large touch targets, bold labels — operators work with dirty/gloved hands
3. **Role Simplicity**: Each operator sees ONLY what they need — no cognitive overload
4. **Glassmorphism Premium**: Modern backdrop-blur, subtle gradients, floating cards
5. **Scan-Friendly**: QR labels must print cleanly at thermal label sizes (2"×2" minimum)

### Design Language
- **Style**: Modern glassmorphic with industrial robustness
- **Mood**: Clean, professional, trustworthy — like a digital control panel
- **Motion**: Subtle, purposeful micro-animations (never decorative)

---

## 2. Design Tokens

### Color Palette

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `--primary` | `#2563EB` (Blue 600) | `#3B82F6` (Blue 500) | Primary actions, active states |
| `--bg-light` | `#F8FAFC` (Slate 50) | — | Page background |
| `--bg-dark` | — | `#0F172A` (Slate 950) | Dark page background |
| `--card-light` | `#FFFFFF` | — | Card surfaces |
| `--card-dark` | — | `#1E293B` (Slate 800) | Dark card surfaces |
| `--text-primary` | `#0F172A` (Slate 900) | `#F1F5F9` (Slate 100) | Headings, primary text |
| `--text-secondary` | `#64748B` (Slate 500) | `#94A3B8` (Slate 400) | Labels, descriptions |
| `--success` | `#10B981` (Emerald 500) | `#34D399` (Emerald 400) | Success states, healthy |
| `--warning` | `#F59E0B` (Amber 500) | `#FBBF24` (Amber 400) | Warnings, pending |
| `--danger` | `#EF4444` (Red 500) | `#F87171` (Red 400) | Errors, critical alerts |
| `--boiler` | `#F97316` (Orange 500) | `#FB923C` (Orange 400) | Boiler module accent |
| `--etp` | `#14B8A6` (Teal 500) | `#2DD4BF` (Teal 400) | ETP module accent |
| `--electricity` | `#EAB308` (Yellow 500) | `#FACC15` (Yellow 400) | Electricity module accent |

### Typography

| Element | Font | Weight | Size | Tracking |
|---|---|---|---|---|
| **Heading (h1-h2)** | Inter | 900 (Black) | 20-24px | -0.025em (tight) |
| **Section Title** | Inter | 800 (ExtraBold) | 14-16px | -0.01em |
| **Body Text** | Inter | 500 (Medium) | 13-14px | normal |
| **Labels** | Inter | 900 (Black) | 10px | 0.05em (wider) |
| **Monospace Data** | System Mono | 700 (Bold) | 12px | -0.02em (tight) |

### Spacing Scale (Tailwind 4)

| Token | Value | Usage |
|---|---|---|
| `p-2` | 8px | Card inner padding (mobile) |
| `p-4` | 16px | Card inner padding (tablet+) |
| `p-6` | 24px | Section padding (desktop) |
| `gap-1.5` | 6px | Tight element spacing |
| `gap-3` | 12px | Standard element spacing |
| `gap-4` | 16px | Card grid gaps |
| `gap-6` | 24px | Section gaps |

### Border Radius

| Token | Value | Usage |
|---|---|---|
| `rounded-lg` | 8px | Input fields |
| `rounded-xl` | 12px | Buttons, small cards |
| `rounded-2xl` | 16px | Cards, modals, sidebar items |
| `rounded-3xl` | 24px | Feature cards, bottom nav bar |
| `rounded-full` | 9999px | Avatars, badges, pills |

### Shadows

| Token | Usage |
|---|---|
| `shadow-2xs` | Subtle depth (inputs, pills) |
| `shadow-sm` | Card hover states |
| `shadow-md` | Active sidebar item, active bottom nav |
| `shadow-xl` | Floating scan button |
| `shadow-2xl` | Modals, dropdowns |

---

## 3. Component Library

### Buttons
- **Primary**: Gradient `from-blue-600 to-indigo-600`, white text, rounded-2xl, shadow-md
- **Secondary**: `bg-slate-100`, slate text, rounded-xl
- **Danger**: `bg-red-50`, red text, rounded-2xl, border-red-200
- **Ghost**: Transparent, hover:bg-slate-100
- **Touch Target**: Minimum 44×44px for mobile

### Cards
- **Surface**: `bg-white dark:bg-slate-800`, `border border-slate-200 dark:border-slate-700`
- **Radius**: `rounded-2xl` to `rounded-3xl`
- **Padding**: `p-4` (mobile) → `p-6` (desktop)
- **Feature Cards**: Gradient background (`from-orange-500/10 via-amber-500/10 to-teal-500/10`)

### Form Inputs
- **Height**: `py-2.5 px-3` (mobile-friendly touch target)
- **Border**: `border border-slate-200 dark:border-slate-700`, `rounded-lg`
- **Focus**: `focus:ring-2 focus:ring-primary focus:border-primary`
- **Label**: Above input, `text-[10px] font-black uppercase tracking-wider`

### Modals
- **Backdrop**: `bg-slate-900/60 backdrop-blur-sm`
- **Container**: `bg-white dark:bg-slate-800 rounded-3xl shadow-2xl`
- **Max Width**: `max-w-lg` (forms) / `max-w-2xl` (content) / `max-w-3xl` (receipts)
- **Animation**: `animate-in fade-in zoom-in-95`

### Bottom Navigation Bar (Mobile)
- **Container**: Fixed bottom, `rounded-3xl`, glassmorphic blur
- **Height**: `h-16` with `bottom-3 left-3 right-3` floating
- **Items**: Icon (20px) + label (10px), flex-1 equal distribution
- **Active State**: Colored icon + bold label + scale-105
- **Scan Button**: Raised circular FAB (-mt-6) with gradient + ring

### Desktop Sidebar
- **Width**: 256px (`w-64`)
- **Items**: `rounded-2xl`, active = gradient blue with white text
- **Sections**: Grouped with uppercase category labels
- **Animation**: Hover translate-x-1

### Tables
- **Container**: `rounded-xl overflow-hidden border`
- **Header**: `bg-slate-100 dark:bg-slate-800` with bold uppercase labels
- **Rows**: Alternating hover states, `border-b`
- **Mobile**: Horizontal scroll (`overflow-x-auto`)

### Status Badges
- **IN_STOCK**: Green pill (`bg-emerald-100 text-emerald-700`)
- **QC_PENDING**: Amber pill (`bg-amber-100 text-amber-700`)
- **QC_FAILED**: Red pill (`bg-red-100 text-red-700`)
- **DISPATCHED**: Blue pill (`bg-blue-100 text-blue-700`)

---

## 4. Responsive Breakpoints

| Breakpoint | Width | Layout |
|---|---|---|
| **Mobile** | < 768px | Bottom nav, no sidebar, stacked cards |
| **Tablet (md)** | 768px+ | Left sidebar + content, no bottom nav |
| **Desktop (lg)** | 1024px+ | Full sidebar + wider content padding |
| **Wide (xl)** | 1280px+ | Extra content width |

### Mobile-Specific Adaptations
- Header subtitle hidden (`hidden sm:block`)
- Cards stack vertically
- Tables become horizontally scrollable
- Bottom nav replaces sidebar
- Profile accessed via bottom nav (not top-right dropdown)

---

## 5. Dark Mode Strategy

- Toggle via sun/moon icon in header
- Persisted in `localStorage` (`saheb_theme`)
- Applied via `document.documentElement.classList.add('dark')`
- Every component has explicit `dark:` variant classes
- Consistent dark surface hierarchy:
  - Page: `bg-slate-950`
  - Card: `bg-slate-800`
  - Input: `bg-slate-900`
  - Border: `border-slate-700`

---

## 6. Accessibility

| Guideline | Implementation |
|---|---|
| Touch targets | Minimum 44×44px for all interactive elements |
| Color contrast | WCAG AA compliance (4.5:1 text, 3:1 UI) |
| Focus indicators | `focus:ring-2 focus:ring-primary` on all focusable elements |
| Screen reader | Semantic HTML (`button`, `nav`, `main`, `header`) |
| Unique IDs | All interactive elements have descriptive IDs |
| Language support | RTL-ready text alignment for future Hindi/Gujarati |

---

## 7. Micro-Animations

| Element | Animation | Duration |
|---|---|---|
| Bottom nav show/hide | `translate-y` + `opacity` | 300ms ease-in-out |
| Header show/hide | `translate-y` + `opacity` | 300ms |
| Active nav item | `scale-105` | 200ms |
| Sidebar hover | `translate-x-1` | 200ms |
| Modal entrance | `zoom-in-95 + fade-in` | 150ms |
| Success checkmark | `animate-pulse` | continuous |
| Live telemetry dot | `animate-ping` | continuous |
| Scan button press | `active:scale-90` | instant |

---

## 8. Print Design

### Thermal Label (TSC Printer)
- **Supported Sizes**: 4"×3", 3"×2", 2"×2"
- **Content**: Company name, QR code (120px), Reel No, Product, GSM, Size, Ply, Weight
- **Style**: Black text on white, bold borders, high-contrast for thermal print
- **Page Break**: Each label = 1 page (`page-break-after: always`)

### Dispatch Challan
- **Size**: A4
- **Content**: Company header, challan number, party/vehicle details, reel table, signatures
- **Style**: Black text, table borders, formal receipt layout

---

## 9. Role-Specific UI Adaptations

| Role | Header | Sidebar | Bottom Nav | Content |
|---|---|---|---|---|
| **Admin** | Full controls | All 11 modules | 5 tabs (Home, Production, Scan, Dispatch, Profile) | Full dashboard |
| **Boiler Operator** | Minimal | Hidden on mobile | 5 tabs (Home, 🔥Boiler, 💧ETP, ⚡Power, Profile) | Boiler form + logs |
| **ETP Operator** | Minimal | Hidden on mobile | 4 tabs (Home, 💧ETP, ⚡Power, Profile) | ETP form + logs |
| **Rewinder** | Minimal | Hidden on mobile | 5 tabs (Home, Rewinder, Scan, Traceability, Profile) | Reel entry + QR |
| **Machine** | Minimal | Hidden on mobile | 3 tabs (Home, Production, Profile) | Roll entry form |
