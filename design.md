# SAHEB PAPER ERP

## Unified UI / UX Design Specification for New Pages

**Purpose:**\
This document is the single design specification for updating the
existing SAHEB PAPER ERP pages. Use this file as the source of truth
when implementing the new UI across all pages. The goal is to update the
visual design consistently instead of manually sending screenshots page
by page.

------------------------------------------------------------------------

# 1. CORE DESIGN DIRECTION

## 1.1 Overall Style

Use a **clean modern SaaS ERP interface with soft neumorphism**.

The UI should feel: - Premium - Industrial but modern - Clean and highly
readable - Professional enough for a real paper mill ERP - Spacious
without wasting screen area - Consistent across every module

Do NOT create a completely different visual language for each page.

Every page must look like it belongs to the same application.

## 1.2 Base Theme

Primary background: - Very light cool gray / off-white - Approximate
visual direction: `#F5F7FA` to `#F8FAFC`

Cards: - White / near-white - Large rounded corners - Very subtle
border - Very soft shadow - Soft inner/outer neumorphic depth where
appropriate

Text: - Main heading: dark navy - Body text: muted blue-gray - Labels:
muted blue-gray, uppercase where already used - Important values: dark
navy

Recommended text direction: - Heading: `#0B1730` - Secondary text:
`#5F7595` - Border: `#E2E8F0`

Do not use heavy black.

------------------------------------------------------------------------

# 2. PRIMARY COLOR SYSTEM

## 2.1 Main Accent

Use a **blue-to-purple visual identity**, with purple being the
important accent for the upgraded pages.

Primary blue: - `#2563EB`

Primary purple: - `#7C3AED` - Strong purple: `#8B5CF6`

Recommended primary gradient for selected navigation / major CTA:

``` css
linear-gradient(135deg, #2563EB 0%, #4F46E5 45%, #7C3AED 100%)
```

Use gradients selectively.

Do NOT cover the entire interface with gradients.

## 2.2 Purple Usage

Purple should be used for: - Active tabs - Important selected states -
Secondary/highlight metrics - QR / label related accents - Quality /
compliance highlights - Selected filters where appropriate - Important
visual indicators - Primary visual identity

Purple should NOT replace every green/orange/red semantic state.

## 2.3 Semantic Colors

Keep semantic colors because they communicate business status.

Success: - Green - Used for healthy stock, Grade A, completed,
dispatched, valid

Warning: - Orange / amber - Used for partial, pending attention,
downtime warnings, Grade B

Danger: - Red - Used for critical failures, rejected QC, major downtime,
negative impact

Info: - Blue - Used for information, dates, links, neutral system
actions

Purple: - Used for application identity and selected/highlight states

IMPORTANT: Do not force all orange/green/red business statuses into
purple.

------------------------------------------------------------------------

# 3. NEUMORPHIC DESIGN SYSTEM

## 3.1 Cards

All major cards should have: - `border-radius: 20px` to `28px` - White
background - Very light border - Soft shadow

Visual direction:

``` css
background: #FFFFFF;
border: 1px solid #E6EBF2;
box-shadow:
  8px 8px 22px rgba(15, 23, 42, 0.06),
  -6px -6px 18px rgba(255, 255, 255, 0.90);
```

Avoid excessive shadows.

Cards should look raised but not floating dramatically.

## 3.2 Inputs

Inputs should have: - Rounded corners - Light gray-blue background -
Subtle inset neumorphic appearance - Clear focus state

Visual direction:

``` css
background: #F7F9FC;
border: 1px solid #E2E8F0;
box-shadow: inset 2px 2px 6px rgba(15,23,42,.035);
```

Focus: - Purple/blue border - Very subtle purple glow

## 3.3 Buttons

Primary button: - Blue-purple gradient - White text - Rounded - Medium
shadow

Secondary: - White/light gray - Blue/purple text - Soft border

Success: - Green

Warning: - Orange

Danger: - Red

Do not make every button green.

------------------------------------------------------------------------

# 4. TYPOGRAPHY

Use a modern sans-serif font.

Preferred: - Inter - Plus Jakarta Sans - Manrope

If the current application already uses Inter, keep Inter.

Headings: - Bold / Extra Bold - Strong dark navy

Page title: - Approximately 28px to 36px desktop

Section title: - Approximately 16px to 20px

Body: - 14px to 16px

Small metadata: - 12px to 13px

Numbers in KPI cards: - Large and bold - Approximately 28px to 36px

Avoid overly condensed typography.

------------------------------------------------------------------------

# 5. GLOBAL PAGE STRUCTURE

All pages should follow this structure:

``` text
Application Shell
│
├── Left Sidebar
│
├── Top Header
│
└── Main Content
    │
    ├── Page Header
    ├── KPI / Summary Cards
    ├── Main Workspace
    ├── Tables / Charts / Forms
    └── History / Activity / Reports
```

## Page Header

Use: - Icon container - Page title - Short description - Optional guide
badge - Optional date / export / action buttons

Example:

``` text
[ICON]  Mill Reports & Analytics Dashboard
        Comprehensive date-filtered production throughput...
```

Guide badge: - Small pill - Light blue/purple background - Do not make
it visually dominant

------------------------------------------------------------------------

# 6. SIDEBAR DESIGN

Keep the current ERP navigation structure.

Sections:

### CORE NAVIGATION

-   Dashboard

### PRODUCTION & MILL

-   Raw Material
-   Pulp Mill
-   Machine Production
-   Rewinder Roll-to-Reel
-   Lab Quality Control

### OPERATIONS & LOGISTICS

-   Order Bookings
-   Utilities & ETP
-   Dispatch Receipt
-   Stock Categorization
-   Spares Store

### ANALYTICS & GOVERNANCE

-   Label Studio
-   Mill Reports
-   Admin Masters

Sidebar requirements: - White/light background - Thin separator -
Rounded active navigation item - Active item uses blue-purple gradient -
White icon/text for active item - Inactive item uses dark blue-gray
text - Small active indicator on the right - Icons should be consistent
Lucide icons

Do not redesign the sidebar separately for every page.

------------------------------------------------------------------------

# 7. PAGE: RAW MATERIAL STOCK

## Page Title

**Raw Material Stock Inventory**

Subtitle: \> Monitor waste paper, chemicals, firewood stocks & log
purchase inward arrivals.

## Top KPI Area

Show: - Total Raw Stock - Number of items - Category breakdown

Categories: - Waste Paper - Chemicals - Firewood - Other Stock

## Inward Shipment Card

Form: - Raw Material Item - Supplier / Vendor - Inward Quantity (KG) -
Remarks / Truck Invoice No.

Primary action: **Confirm Inward**

Use blue/purple primary styling rather than making every action green.

## Inventory Table

Filters: - All Items - Waste Paper - Chemicals - Firewood

Search: \> Search raw material item...

Columns: - Material Item - Category - Available Stock - Min Reorder
Level - Status

Statuses: - Healthy Stock = green - Low Stock = amber - Critical = red

------------------------------------------------------------------------

# 8. PAGE: PULP MILL

## Page Title

**Pulp Mill Daily Setup & Formula Rules**

Show: - Date - Automatic raw material deduction explanation

## Waste Paper Consumption

Section: **Waste Paper Consumption (%)**

Fields: - Indian Tissue Waste - Imported Tissue Waste - SMK - Cupstock -
Pulp Sheet - Broke

Validation: - Total must equal exactly 100% - Display:
`Total: 100% (Valid)`

Invalid state: - Red warning - Clear explanation

## Chemical Dosage

Section: **Chemical Dosage Rates (KG / TON OF PAPER)**

Fields: - DSR - WSR - OBA

Helper text: \> Deducted automatically based on machine production
weight.

Primary action: **Save Formula & Chemical Rates**

## Downtime Logger

Fields: - Duration (Minutes) - Downtime Reason

Action: **Record Downtime**

History: - Reason - Date/time - Duration

## Formula History

Display historical formulas as cards.

Each record: - Date - Active Engine status - Waste paper mix - Chemical
rates

Keep the existing colored chips for different material types because
they improve readability.

------------------------------------------------------------------------

# 9. PAGE: MACHINE PRODUCTION

## Page Title

**Machine Production Logs (Rolls)**

Subtitle: \> Log production parent rolls, monitor machine shifts, and
manage jumbo roll output.

## Layout

Desktop: - Main form on left - Recent logged rolls on right

## Form Sections

### Production Date + Shift

-   Production Date
-   Day Shift / Night Shift

### Roll Data Parameters

-   Roll Number
-   Product Type
-   Weight KG
-   GSM
-   Roll Size CM
-   Joint

### Time Tracking & Downtime Incidents

-   Start Time
-   Off Time
-   Downtime Reasons / Notes

Primary action: **Submit Machine Production Log**

## Recent Rolls

Each card should display: - Roll number - Product - Weight - GSM - Roll
size - Joints - Shift - Downtime if present

Keep the right-side list scrollable without making the whole page
awkward.

------------------------------------------------------------------------

# 10. PAGE: REWINDER PRODUCTION

## Page Title

**Rewinder Production (Reels)**

Subtitle: \> Cut jumbo rolls into finished reels, log broke generation,
and manage batch inventory.

## KPI Cards

-   Reel Output Today
-   Broke Generated
-   Net Stock Added
-   Net Yield Rate

Example: - 64.20 Tons - 2.85 Tons - 61.35 Tons - 95.7%

Use: - Blue/purple for output - Red for broke - Green for net stock -
Purple for yield

## Rewinder Production Log

Controls: - Search Reel No / Roll No / Product - Cascading Filter -
Date - Status - Paper type filters

Paper types: - Napkin Tissue - Napkin B-Grade - Toilet Tissue - Toilet
B-Grade - KT - KT B-Grade - HRT

## Running Roll Cards

Show: - Running Roll number - Product - Number of cuts - Date - Total -
Broke - Net Stock

Table: - Reel No - Running Roll - Product - GSM / Size / Ply - Joint -
Reel Weight - Broke KG - Net Stock Weight

------------------------------------------------------------------------

# 11. PAGE: LAB QUALITY CONTROL

## Page Title

**SAHEB PAPER PVT. LTD. --- Quality Control Laboratory**

Subtitle: \> Log paper test reports, 14-sample GSM profiles,
tensile/tear strength & generate official COA certificates.

## KPI Cards

-   Total Reports
-   Avg Tested GSM
-   Avg Moisture %
-   Grade A Pass Ratio

## History Ledger

Columns: - Report ID - Roll No - Date / Time - Product - Shift - Target
/ Avg GSM - Moisture - QC Decision - Actions

Actions: - Print PDF - Delete / archive according to existing permission
model

## Report Entry Modal

Use a large centered modal with blurred background.

### Section 1: Header Roll Parameters

-   Quality / Product
-   Roll No
-   Shift
-   Date
-   Target GSM
-   Roll Weight
-   Speed
-   Creping %

### Section 2: 14 GSM Profile Samples

Inputs: - SR1 through SR14

Automatically calculate: - Average - Maximum - Minimum - Range

Also: - Web Breakage Count

### Section 3: Physical & Mechanical Lab Test Parameters

13 parameters: 1. GSM Result 2. Moisture 3. Caliper Thickness 4. Bulk 5.
Breaking Length MD 6. Breaking Length CD 7. Brightness 8. Tear MD 9.
Tear CD 10. Tensile Dry MD 11. Tensile Dry CD 12. Stretch Dry MD 13.
Stretch Dry CD

### Section 4: QC Decision & Chemist Remarks

-   QC Decision Grade
-   Remarks / Chemist Notes

Final action: **Save & Issue Paper Test Report**

------------------------------------------------------------------------

# 12. PAGE: ORDER BOOKINGS

## Page Title

**Order Bookings**

Subtitle: \> Manage pending customer purchase orders and view required
quantities.

## Main Layout

Left: Active Orders Ledger

Right: Register New Order

## Orders Table

Columns: - Customer - Product Specs - Ordered Qty - Dispatched - Due
Date - Status

Statuses: - Completed - Partial - Pending

## Register New Order

Customer selection: - Searchable dropdown - Customer name - Contact

Action: **Log Order Record**

Keep dropdown behavior clean and modern.

------------------------------------------------------------------------

# 13. PAGE: UTILITIES / BOILER / ETP

IMPORTANT: The orange boiler identity visible in the current design
should remain where it is intentionally used for boiler-specific
semantics.

Do NOT globally replace semantic orange with purple.

## Page Title

**Utilities, Boiler & ETP Management**

Badge: **Live Telemetry**

Top tabs: - Boiler Operations - ETP Water & Chemicals - Electricity &
Power Grid

## Boiler Section

Title: **Boiler**

Subtitle: \> Track daily firewood fuel, water consumption, and steam
pressure logs.

KPI: **Total Wood Consumption**

## Boiler Shift Data Entry

Fields: - Date - Shift - Wood / Fuel Used KG - Water Used L - Boiler
Pressure PSI - Steam Temp °C

Action: **Log Shift Readings**

## Daily Registers

Columns: - Date - Shift - Wood Used - Water Used - Pressure - Temp -
Operator

Keep: - Day Shift amber - Night Shift blue - Wood orange - Water blue

These colors are semantic and should not be replaced.

------------------------------------------------------------------------

# 14. PAGE: DISPATCH RECEIPT

## Page Title

**Dispatch Receipt**

Subtitle: \> Issue delivery challans, scan loading reels, and track
customer shipments.

Top tabs: - Draft Packing Slip - Packing Slips & Challans - Dispatched
Reels

Active tab: - Blue-purple gradient - Soft glow/shadow

## Draft Packing Slip

Form: - Customer / Party Name - Vehicle / Truck No - Driver Name -
Driver Mobile - Dispatch Date

Show: - Total Loaded Reels - Total KG

Primary action: **Print Gate Pass & Dispatch**

## Warehouse Stock Reels

Include: - Search - Scan / Type Reel Number - Add Reel - Batch
selection - Product filter - GSM filter - Size filter - Ply filter -
Grade filter

## Packing Slip History

KPI: - Total Challans - Dispatched Slips - Pending Drafts - Total Linked
Reels

Ledger columns: - Challan Number - Date - Party / Customer - Vehicle
No - Linked Reels - Status - Actions

Actions: - View - Details - Print - More

## Dispatched Reels

KPI: - Dispatched Reels - Dispatched Weight - Linked Challans

Table: - Reel / Barcode No - Product Specs - Weight - Challan / Gate
Pass - Customer / Party - Vehicle - Dispatch Date - Challan PDF

------------------------------------------------------------------------

# 15. PAGE: STOCK CATEGORIZATION

## Page Title

**Stock Categorization**

Subtitle: \> Grade A / B stock categorization, warehouse vault & label
printing.

KPI cards: - Grade A Sellable - Grade B / Muted - Pending Inspection

## Filters

Product: - All Products - Napkin Tissue - Toilet Tissue

GSM: - All GSM - 17 GSM - 18 GSM

Size: - All Sizes - 10 cm - 30 cm

Ply: - All Ply - 2 Ply - 3 Ply

Grade: - All - Grade A - Grade B Only - Pending QC

## Stock Groups

Each product specification can be displayed as a grouped ledger.

Show: - Quantity - Total Weight

Columns: - Reel Number - Weight - Joints - Produced Date - Actions /
Status

Status: - Grade A = green - Grade B = amber - Pending = purple

------------------------------------------------------------------------

# 16. PAGE: STORE SPARES

## Page Title

**Store Spares & Inventory Control**

Subtitle: \> Maintain stock ledger levels for engineering spares
(Bearings and V-Belts).

KPI cards: - Total Spares Stock - Low Stock Spares - Registry Types

Tabs: - Bearings Spares Registry - V-Belts Spares Registry

## Registry Table

Bearings columns: - Bearing Number - PCS in Stock - Target Machine
Area - Actions

Action: **Adjust**

## Register New Bearing

Fields: - Bearing Serial Number - Pieces in Stock - Usage / Machine Area

Action: **Save Bearing Spares**

Use neumorphic form styling.

------------------------------------------------------------------------

# 17. PAGE: QR LABEL STUDIO

## Page Title

**QR Label Studio & Barcode Generator**

Subtitle: \> Design and print thermal QR labels, barcode tags, warehouse
stickers, and custom identifiers.

Tabs: - Paper Reel Label - Warehouse Bay / Stock Tag - Raw Material
Lot - Custom / Free-form Sticker

## Main Layout

Left: Configuration form

Right: Live sticker preview

## Paper Reel Label Form

Fields: - Load Existing Reel from Stock - Reel / Barcode No - QR Code
Embed Value - Product Title / Description - GSM - Size / Width - Net
Weight KG

QR encoding modes: - ID-Only (Test System) - Full Payload (Old System)

Label size: - 4" × 6" Thermal Sticker

Copies: - 1x - 2x - 4x

## Preview

Thermal label should include: - SAHEB PAPER PVT. LTD. - QR code - QR
code name / identifier - Clean black-and-white print layout

Primary action: **Print 1x Label Now**

The actual printable label should remain high contrast. Do not apply
purple backgrounds to the QR itself.

------------------------------------------------------------------------

# 18. PAGE: MILL REPORTS & ANALYTICS

## Page Title

**Mill Reports & Analytics Dashboard**

Subtitle: \> Comprehensive date-filtered production throughput, dispatch
yield ledgers, and compliance audit exports.

Top actions: - Export Excel - Print PDF

## KPI Cards

1.  Production Tonnage
    -   Output
    -   Optimal status
2.  Dispatched Tonnage
    -   Sales
    -   Yield
3.  Available Stock
    -   Inventory
    -   Reel count
4.  Quality Grade A
    -   Compliance
    -   Grade A count

Use individual accent colors but keep the cards within the same
neumorphic system.

## Production Telemetry

Section: **Production Output vs. Dispatch Volume Telemetry**

Subtitle: \> Full Shift Timeline Breakdown with Machine Stoppage
Tracking

Chart: - Production Output KG - Dispatched Volume KG - Time axis -
Interactive tooltip

Chart colors: - Production = blue - Dispatch = green - Critical event =
red

Do NOT convert the chart to purple-only.

## Machine Stoppage Alert

Show: - Machine stoppage event - Downtime duration - Reason - Output
impact

Use red/pink alert container.

## Stock Allocation & Quality Grade Breakdown

Use: - Donut chart - Grade A In-Stock - Grade B In-Stock - QC Pending -
Dispatched

Keep semantic colors: - Grade A = green - Grade B = orange - QC Pending
= purple - Dispatched = blue

## Analytics Ledger Tabs

Tabs: - Daily Production - Daily Dispatch - Available Inventory -
Dispatched Reels - Vehicle Logistics - Party / Customer Sales - Raw
Material Lot

Each tab: - Search - Filter - Record count - Data table

Example Daily Production columns: - Date - Jumbo Rolls Produced -
Finished Reels Slit - Total Net Weight KG - Status

------------------------------------------------------------------------

# 19. INTERACTION DESIGN

## Hover

Cards: - Slight lift - Very subtle shadow increase

Buttons: - Slight brightness - Small translate-up effect

Table rows: - Very light purple/blue hover background

## Focus

Inputs: - Blue/purple outline - Subtle glow

## Loading

Use: - Skeleton loaders - Do not use large spinning loaders unless
required

## Empty State

Every table/list should have a useful empty state: - Icon - Short
message - Optional action

## Toasts

Success: - Green

Warning: - Amber

Error: - Red

Info: - Blue/purple

------------------------------------------------------------------------

# 20. RESPONSIVE DESIGN

Desktop: - Full sidebar - Multi-column cards - Two-column forms where
appropriate

Tablet: - Sidebar can collapse - Cards become 2 columns

Mobile: - Sidebar becomes drawer - KPI cards become one column - Forms
become one column - Tables become horizontal scroll or responsive
cards - Large modals should fit within viewport

Do not allow horizontal page overflow.

------------------------------------------------------------------------

# 21. CONSISTENCY RULES

These rules are mandatory.

1.  Do not redesign the business workflow.
2.  Do not remove existing fields.
3.  Do not remove existing filters.
4.  Do not remove existing calculations.
5.  Do not change database/API behavior just for UI styling.
6.  Do not change business rules.
7.  Keep existing routes.
8.  Keep existing permissions/RBAC.
9.  Keep existing QR functionality.
10. Keep existing PDF/Excel actions.
11. Keep semantic colors for status.
12. Use the new neumorphic design system across all pages.
13. Use blue-purple as the main application identity.
14. Do not use random gradients on every component.
15. Avoid excessive glassmorphism.
16. Keep tables dense enough for real ERP usage.
17. Keep forms easy for factory operators.
18. Maintain accessibility and readable contrast.

------------------------------------------------------------------------

# 22. IMPORTANT VISUAL CORRECTION

The current pages have inconsistent styling: - Some pages are blue -
Some use green buttons - Some use orange - Some use purple - Some use
different card styles

The target is NOT to make everything purple.

The target is:

**One unified neumorphic design system + blue/purple application
identity + semantic business colors.**

Therefore:

### Application Identity

Blue + Purple

### Success

Green

### Warning

Orange / Amber

### Danger

Red

### Information

Blue

### Boiler

Orange may remain because it is semantically associated with fire/boiler
operations.

### QC / Label / Analytics

Purple can be emphasized.

------------------------------------------------------------------------

# 23. DESIGN QUALITY BAR

The final UI should visually resemble a premium modern ERP/SaaS product.

It should have: - Excellent spacing - Clear hierarchy - Consistent 20px+
card radius - Soft neumorphic depth - Minimal borders - Strong
typography - Clear data visualization - Consistent iconography - Smooth
hover/focus transitions - No unnecessary visual noise

Avoid: - Overly colorful backgrounds - Heavy gradients - Excessive
shadows - Tiny text - Huge empty spaces - Random corner radii -
Different button styles on every page - Inconsistent spacing -
Unnecessary animations

------------------------------------------------------------------------

# 24. IMPLEMENTATION INSTRUCTION

Use this document as the **single source of truth for the frontend
redesign**.

Before changing a page: 1. Inspect the existing page. 2. Preserve its
existing functionality and data. 3. Apply the global design system. 4.
Apply the page-specific layout defined above. 5. Ensure the page matches
the visual language of the other modules. 6. Check desktop and
responsive layouts. 7. Verify that all existing actions still work.

Do not create separate unrelated designs for individual pages.

The final result should look like one complete product:

**SAHEB PAPER PVT. LTD. --- Paper Mill ERP**

with a unified modern neumorphic blue-purple visual system.
