const fs = require('fs');
const path = require('path');
const docx = require('docx');

const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  ShadingType,
} = docx;

// Color Palette
const COLOR_PRIMARY = "1E3A8A"; // Deep Blue
const COLOR_ACCENT = "2563EB";  // Royal Blue
const COLOR_SLATE = "475569";   // Text Slate
const COLOR_LIGHT_BG = "F8FAFC"; // Light Gray Background
const COLOR_GREEN = "166534";
const COLOR_BORDER = "CBD5E1";

function createHeaderCell(text, widthPercent) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { fill: "1E293B", type: ShadingType.CLEAR },
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text: text,
            bold: true,
            color: "FFFFFF",
            size: 18, // 9pt
          }),
        ],
      }),
    ],
  });
}

function createBodyCell(text, widthPercent, isBold = false, fillHex = null) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: fillHex ? { fill: fillHex, type: ShadingType.CLEAR } : undefined,
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text: text,
            bold: isBold,
            color: "1E293B",
            size: 18, // 9pt
          }),
        ],
      }),
    ],
  });
}

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1000,
            bottom: 1000,
            left: 1000,
            right: 1000,
          },
        },
      },
      children: [
        // Title Banner
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: "SAHEB PAPER PVT. LTD.",
              bold: true,
              size: 32, // 16pt
              color: COLOR_PRIMARY,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new TextRun({
              text: "Custom Enterprise Resource Planning (ERP) System & QR Traceability Proposal",
              italic: true,
              size: 20, // 10pt
              color: COLOR_SLATE,
            }),
          ],
        }),

        // Meta Box
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                createBodyCell("Ref: SP-ERP-PROPOSAL-2026-V2", 33, true, "F1F5F9"),
                createBodyCell("Date: August 15, 2026", 33, true, "F1F5F9"),
                createBodyCell("Prepared For: Executive Management Board", 34, true, "F1F5F9"),
              ],
            }),
          ],
        }),

        new Paragraph({ text: "", spacing: { after: 200 } }),

        // 1. Executive Summary & Scope
        new Paragraph({
          text: "1. EXECUTIVE PROJECT OVERVIEW & SCOPE DELIVERED",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 120 },
        }),
        new Paragraph({
          spacing: { after: 160 },
          children: [
            new TextRun({
              text: "This custom-engineered Enterprise Resource Planning (ERP) system has been designed specifically for paper manufacturing operations, providing end-to-end digitisation from Raw Material Intake to Rewinder Reel QR Labeling and Dispatch Gate Pass Generation.",
              size: 20,
            }),
          ],
        }),

        // Delivered Scope Card
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: "F0F9FF", type: ShadingType.CLEAR },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "DELIVERED PLATFORMS & SCOPE:\n", bold: true, color: COLOR_PRIMARY, size: 20 }),
                        new TextRun({ text: "• Android Native Mobile App (.apk) — Operator smartphones & tablets\n", size: 19 }),
                        new TextRun({ text: "• Windows Portable Desktop App (.exe) — Installed on office PCs & weighbridge\n", size: 19 }),
                        new TextRun({ text: "• Web Browser Cloud Access — Instant access on laptops & remote PCs\n", size: 19 }),
                        new TextRun({ text: "• QR Engine & Label Generator — Instant QR stickers for reels (TSC / A4)\n", size: 19 }),
                        new TextRun({ text: "• Dual Camera & Laser Gun Scanner — Live phone camera + handheld laser scanner\n", size: 19 }),
                        new TextRun({ text: "• 9 Role-Based Access Accounts — Admin, Boiler, ETP, Machine, Rewinder, Dispatch, Store", size: 19 }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({ text: "", spacing: { after: 200 } }),

        // 2. Delivered Modules Table
        new Paragraph({
          text: "2. MODULE-BY-MODULE CAPABILITIES REVIEW",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 120 },
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                createHeaderCell("Module Name", 25),
                createHeaderCell("Core Functionality Delivered", 50),
                createHeaderCell("Automation Logic", 25),
              ],
            }),
            new TableRow({
              children: [
                createBodyCell("1. Executive Dashboard", 25, true),
                createBodyCell("Real-time KPI Scorecards, Daily Reel Weight, Yield Efficiency %, Stock Gauges & Financial Summary", 50),
                createBodyCell("Auto-syncs across all devices", 25),
              ],
            }),
            new TableRow({
              children: [
                createBodyCell("2. Raw Material Stock", 25, true),
                createBodyCell("Track Waste Paper Lots (Indian Tissue, Import, SMK, Broke), Reorder Thresholds & Stock Valuation", 50),
                createBodyCell("Auto-deducts on Pulping", 25),
              ],
            }),
            new TableRow({
              children: [
                createBodyCell("3. Pulp Mill Operations", 25, true),
                createBodyCell("Daily Fiber & Chemical Formula Mix (DSR, WSR, OBA), Cooking Temp & Consistency Logs", 50),
                createBodyCell("Auto-deducts raw stock", 25),
              ],
            }),
            new TableRow({
              children: [
                createBodyCell("4. Machine Production", 25, true),
                createBodyCell("Machine Roll Logging (GSM, Width, Shift, Speed), Downtime Tracking & Blade Change Logs", 50),
                createBodyCell("Feeds into Rewinder", 25),
              ],
            }),
            new TableRow({
              children: [
                createBodyCell("5. Rewinder Conversion", 25, true),
                createBodyCell("Auto-Incrementing Reel No, 11-Field Input Modal, Rule 6 Broke Auto-Loopback, & TSC QR Labels", 50),
                createBodyCell("Auto-adds Broke to Raw Stock", 25),
              ],
            }),
            new TableRow({
              children: [
                createBodyCell("6. QR Code Scanner", 25, true),
                createBodyCell("Dual-Mode Live Camera Scanner + Manual Reel Search Input + Inline Spec Editor + Instant Dispatch", 50),
                createBodyCell("Dual Camera + Laser Gun", 25),
              ],
            }),
            new TableRow({
              children: [
                createBodyCell("7. Full Traceability", 25, true),
                createBodyCell("Genealogy audit graph: Waste Paper Lot → Pulp Batch → Machine Roll → Rewinder Reel → Dispatch", 50),
                createBodyCell("100% Audit Compliance", 25),
              ],
            }),
            new TableRow({
              children: [
                createBodyCell("8. Utilities & Boiler/ETP", 25, true),
                createBodyCell("Boiler Fuel Wood & Water Consumption, Steam Pressure, ETP Chemical Dosing Logs", 50),
                createBodyCell("Compliance & Cost Audit", 25),
              ],
            }),
            new TableRow({
              children: [
                createBodyCell("9. Finished Stock", 25, true),
                createBodyCell("Inventory Cascading Filter (Product → GSM → Size → Ply), Grade A vs B Stock Split", 50),
                createBodyCell("Real-time MT Weight Counter", 25),
              ],
            }),
            new TableRow({
              children: [
                createBodyCell("10. Dispatch & Gate Pass", 25, true),
                createBodyCell("Packing Slip Generation, Customer Order Mapping, Vehicle Number Linking & Gate Pass Print", 50),
                createBodyCell("Auto-Minus Finished Stock", 25, true),
              ],
            }),
          ],
        }),

        new Paragraph({ text: "", spacing: { after: 200 } }),

        // 3. Local vs Cloud Storage Breakdown
        new Paragraph({
          text: "3. LOCAL DATA ENGINE VS. CLOUD DATABASE STORAGE ARCHITECTURE",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 120 },
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                createHeaderCell("Criteria / Feature", 25),
                createHeaderCell("Option 1: Local Engine (Default)", 25),
                createHeaderCell("Option 2: Cloud Database", 25),
                createHeaderCell("Option 3: Private Mill Server", 25),
              ],
            }),
            new TableRow({
              children: [
                createBodyCell("Monthly Bill", 25, true),
                createBodyCell("₹0 / Month (100% Free Lifetime)", 25, true, "DCFCE7"),
                createBodyCell("₹500 – ₹1,500 / Month", 25),
                createBodyCell("₹0 Cloud Bill (Local Mini PC)", 25, true, "DCFCE7"),
              ],
            }),
            new TableRow({
              children: [
                createBodyCell("Internet Dependency", 25, true),
                createBodyCell("100% Offline (No Internet Needed)", 25),
                createBodyCell("Requires Active Internet", 25),
                createBodyCell("Works on Local Plant Wi-Fi", 25),
              ],
            }),
            new TableRow({
              children: [
                createBodyCell("Data Speed", 25, true),
                createBodyCell("Instant 0ms Latency (Ultra Fast)", 25),
                createBodyCell("Depends on Internet Speed", 25),
                createBodyCell("Instant 0ms Local Wi-Fi Speed", 25),
              ],
            }),
            new TableRow({
              children: [
                createBodyCell("Multi-Device Sync", 25, true),
                createBodyCell("Export/Import JSON Backup", 25),
                createBodyCell("Real-Time Live Auto-Sync", 25),
                createBodyCell("Real-Time Local Wi-Fi Auto-Sync", 25),
              ],
            }),
            new TableRow({
              children: [
                createBodyCell("Data Security", 25, true),
                createBodyCell("100% Data Stays Inside Mill PCs", 25),
                createBodyCell("Secured on Enterprise Cloud", 25),
                createBodyCell("100% Data Stays Inside Mill Premises", 25),
              ],
            }),
          ],
        }),

        new Paragraph({ text: "", spacing: { after: 200 } }),

        // 4. Financial Breakdown Table
        new Paragraph({
          text: "4. ITEMIZED COMMERCIAL COST & INVESTMENT BREAKDOWN",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 120 },
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                createHeaderCell("Sr", 10),
                createHeaderCell("System Component & Engineering Description", 55),
                createHeaderCell("Market Value", 18),
                createHeaderCell("Investment (₹)", 17),
              ],
            }),
            new TableRow({
              children: [
                createBodyCell("1", 10),
                createBodyCell("Core ERP Software Architecture & Custom UI/UX (Branding, 11 Modules, Glassmorphic Design)", 55),
                createBodyCell("₹2,50,000", 18),
                createBodyCell("₹24,000", 17),
              ],
            }),
            new TableRow({
              children: [
                createBodyCell("2", 10),
                createBodyCell("Data Engine & Schema Architecture (LocalStorage Engine, 17 Schemas, JSON Backup/Restore)", 55),
                createBodyCell("₹80,000", 18),
                createBodyCell("₹8,500", 17),
              ],
            }),
            new TableRow({
              children: [
                createBodyCell("3", 10),
                createBodyCell("QR Engine, Scanner & Thermal Printer Driver (Camera Scan + Barcode Gun Listener, TSC Drivers)", 55),
                createBodyCell("₹50,000", 18),
                createBodyCell("₹6,500", 17),
              ],
            }),
            new TableRow({
              children: [
                createBodyCell("4", 10),
                createBodyCell("Cross-Platform Build Pipeline Setup (Android Native APK & Windows Executable EXE Setup)", 55),
                createBodyCell("₹60,000", 18),
                createBodyCell("₹8,000", 17),
              ],
            }),
            new TableRow({
              children: [
                createBodyCell("5", 10),
                createBodyCell("On-Site System Deployment & Go-Live Assistance (Device Installation, Driver Setup, 6 Months Support)", 55),
                createBodyCell("₹45,000", 18),
                createBodyCell("₹8,000", 17),
              ],
            }),
            new TableRow({
              children: [
                createBodyCell("", 10, true, "E2E8F0"),
                createBodyCell("TOTAL COMMERCIAL MARKET VALUE", 55, true, "E2E8F0"),
                createBodyCell("₹4,85,000", 18, true, "E2E8F0"),
                createBodyCell("₹55,000", 17, true, "E2E8F0"),
              ],
            }),
            new TableRow({
              children: [
                createBodyCell("", 10, true, "FEE2E2"),
                createBodyCell("LESS: SPECIAL INAUGURAL DISCOUNT", 55, true, "FEE2E2"),
                createBodyCell("", 18, true, "FEE2E2"),
                createBodyCell("- ₹7,000", 17, true, "FEE2E2"),
              ],
            }),
            new TableRow({
              children: [
                createBodyCell("", 10, true, "DBEAFE"),
                createBodyCell("NET TURNKEY INVESTMENT COST", 55, true, "DBEAFE"),
                createBodyCell("", 18, true, "DBEAFE"),
                createBodyCell("₹48,000", 17, true, "DBEAFE"),
              ],
            }),
          ],
        }),

        new Paragraph({ text: "", spacing: { after: 200 } }),

        // 5. Commercial Packages
        new Paragraph({
          text: "5. RECOMMENDED PRICING & DEAL PACKAGES",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 120 },
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: "Option A: Complete Turnkey ERP Package — ₹48,000 (Recommended)\n", bold: true, color: COLOR_PRIMARY, size: 22 }),
            new TextRun({ text: "Includes Full Software (Windows + Android + Web), Custom Branding, On-Site Installation, Commissioning, Hardware Drivers Integration & 6 Months FREE Technical Support & Updates.", size: 20 }),
          ],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: "Option B: Early-Bird Special Deal — ₹45,000 (If Confirmed within 48 Hours)\n", bold: true, color: COLOR_ACCENT, size: 22 }),
            new TextRun({ text: "Includes full software, setup, and 6 months support with lump-sum early booking discount.", size: 20 }),
          ],
        }),

        // 6. Payment Schedule
        new Paragraph({
          text: "6. MILESTONE PAYMENT SCHEDULE",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 120 },
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                createHeaderCell("Milestone 1: Advance", 33),
                createHeaderCell("Milestone 2: Deployment", 33),
                createHeaderCell("Milestone 3: Go-Live", 34),
              ],
            }),
            new TableRow({
              children: [
                createBodyCell("Booking Token & Branding Configuration\n\nAmount: ₹18,000", 33, true),
                createBodyCell("Installation on Office PCs & Mobiles\n\nAmount: ₹20,000", 33, true),
                createBodyCell("Production Go-Live & Handover\n\nAmount: ₹10,000", 34, true),
              ],
            }),
          ],
        }),

        new Paragraph({ text: "", spacing: { after: 300 } }),

        // Sign-off
        new Paragraph({
          text: "Authorized Signatory (Software Engineering Lead)                               Accepted & Approved By (Saheb Paper Pvt. Ltd.)",
          bold: true,
          size: 19,
          spacing: { before: 300 },
        }),
      ],
    },
  ],
});

const docxPath = path.join(__dirname, 'Saheb_Paper_ERP_Project_Proposal_and_Pricing.docx');

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(docxPath, buffer);
  console.log(`DOCX Generated Successfully at: ${docxPath}`);
});
