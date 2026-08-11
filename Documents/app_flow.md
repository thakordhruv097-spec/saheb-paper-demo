# Saheb Paper Pvt. Ltd. — ERP System
## Application Flow Document

**Version**: 2.0  
**Last Updated**: 2026-08-03

---

## 1. Authentication Flow

```mermaid
flowchart TD
    A["App Launch"] --> B{"Session exists?"}
    B -->|Yes| C{"Token expired?"}
    B -->|No| D["Login Screen"]
    C -->|No| E["Dashboard (Role-Adaptive)"]
    C -->|Yes| D
    D --> F["Enter Username + 4-Digit PIN"]
    F --> G{"Credentials valid?"}
    G -->|Yes| H["Generate Session Token (8hr)"]
    G -->|No| I["Show Error"]
    I --> F
    H --> J["Store in localStorage"]
    J --> E
    
    D --> K["Forgot PIN?"]
    K --> L["Answer Security Question"]
    L --> M{"Answer correct?"}
    M -->|Yes| N["Set New PIN"]
    M -->|No| I
    N --> D
```

---

## 2. Admin Master Data Flow

```mermaid
flowchart TD
    A["Admin Login"] --> B["Dashboard"]
    B --> C["Settings / Admin Masters"]
    
    C --> D["Products Master"]
    C --> E["Parties Master"]
    C --> F["Vendors Master"]
    C --> G["Vehicles Master"]
    C --> H["Raw Materials Master"]
    C --> I["User Management"]
    
    D --> D1["Add/Edit Product"]
    D1 --> D2["Name, Grade, GSM, Size, Ply"]
    
    E --> E1["Add/Edit Party"]
    E1 --> E2["Name, Contact, Address"]
    
    I --> I1["Add/Edit User"]
    I1 --> I2["Username, Role, PIN, Display Name"]
```

---

## 3. Raw Material Lifecycle

```mermaid
flowchart LR
    A["Vendor Delivers\nRaw Material"] --> B["Inward Lot Entry"]
    B --> C["Update Stock\n(+weight)"]
    C --> D["Stock Dashboard\n(with alerts)"]
    D --> E{"Stock ≤ Min\nThreshold?"}
    E -->|Yes| F["🔔 Low Stock Alert"]
    E -->|No| G["Available for\nPulp Formula"]
    G --> H["Pulp Mill Deducts\nfrom Stock"]
    H --> I["Stock Reduced\n(-weight)"]
```

---

## 4. Production Pipeline (End-to-End)

```mermaid
flowchart TD
    A["📦 Raw Materials"] --> B["🧪 Pulp Mill"]
    B -->|"Pulp Formula\n(waste mix + chemicals)"| C["⚙️ Paper Machine"]
    C -->|"Parent Roll\n(weight, GSM, width)"| D["🔄 Rewinder"]
    D -->|"Split into\nFinished Reels"| E["📋 QC Inspection"]
    E -->|"Grade A"| F["✅ IN_STOCK"]
    E -->|"Grade B"| G["⚠️ IN_STOCK_B"]
    E -->|"Failed"| H["❌ QC_FAILED"]
    F --> I["🏷️ QR Label\nGenerated"]
    G --> I
    I --> J["📦 Finished Stock"]
    J --> K["🚛 Dispatch\n(Challan)"]
    K --> L["✅ DISPATCHED"]
    L --> M["📬 DELIVERED"]
```

---

## 5. Pulp Mill → Machine → Rewinder Detail

```mermaid
sequenceDiagram
    participant PO as Pulp Operator
    participant MM as Machine Operator
    participant RO as Rewinder Operator
    participant QC as QC Inspector
    
    PO->>PO: Create Pulp Formula
    Note over PO: Waste mix % + Chemical dosage
    PO->>PO: Log Batch Entry
    
    MM->>MM: Log Machine Roll
    Note over MM: Roll No, Product, Weight, GSM
    Note over MM: Shift (A/B/C), Start/Off Time
    MM->>MM: Link to Pulp Formula
    
    RO->>RO: Select Parent Roll
    RO->>RO: Split into Reels
    Note over RO: Reel No, Size, Ply, Weight, Dia
    RO->>RO: Generate QR Code
    RO->>RO: Print Thermal Label
    
    QC->>QC: Inspect Reel
    Note over QC: GSM test, Brightness, Softness
    QC->>QC: Assign Grade (A/B/Fail)
    QC->>RO: Update Reel Status
```

---

## 6. QC Inspection Flow

```mermaid
stateDiagram-v2
    [*] --> PRODUCED: Rewinder creates reel
    PRODUCED --> QC_PENDING: Awaiting inspection
    QC_PENDING --> QC_PASSED: Inspector passes (Grade A/B)
    QC_PENDING --> QC_FAILED: Inspector fails
    QC_PASSED --> IN_STOCK: Grade A
    QC_PASSED --> IN_STOCK_B: Grade B
    QC_FAILED --> [*]: Rejected
    IN_STOCK --> DISPATCHED: Added to challan
    IN_STOCK_B --> DISPATCHED: Added to challan
    DISPATCHED --> DELIVERED: Customer confirms
    DISPATCHED --> RETURNED: Customer rejects
```

---

## 7. Dispatch & Challan Flow

```mermaid
flowchart TD
    A["Warehouse Staff"] --> B["Select Reels\nfrom IN_STOCK"]
    B --> C["Create Packing Slip"]
    C --> D["Select Party\n(Customer)"]
    D --> E["Select Vehicle\n+ Driver"]
    E --> F["Add Reel Numbers\nto Challan"]
    F --> G["Generate Challan\n(Slip No)"]
    G --> H["Print Dispatch\nReceipt"]
    H --> I["Mark Reels as\nDISPATCHED"]
    I --> J["Update Order\nFulfillment"]
    J --> K{"Order Qty\nMet?"}
    K -->|Yes| L["Order → COMPLETED"]
    K -->|No| M["Order → PARTIAL"]
```

---

## 8. Utilities Operator Flow (Boiler / ETP / Electricity)

```mermaid
flowchart TD
    A["Boiler/ETP Operator\nLogs In"] --> B["Mobile Bottom Nav"]
    
    B --> C["🔥 Boiler Tab"]
    B --> D["💧 ETP Tab"]
    B --> E["⚡ Power Tab"]
    
    C --> C1["Log Shift Entry"]
    C1 --> C2["Wood (kg), Water (L)\nPressure (PSI), Temp (°C)"]
    C2 --> C3["Select Shift A/B/C"]
    C3 --> C4["Submit → Saved"]
    
    D --> D1["Log ETP Entry"]
    D1 --> D2["Flock Liquid (L)\nFlock Master (kg)"]
    D2 --> D3["Submit → Saved"]
    
    E --> E1["Log Power Reading"]
    E1 --> E2["Units (kWh)"]
    E2 --> E3["Submit → Saved"]
```

---

## 9. Mobile Bottom Navigation (Role-Specific)

```mermaid
flowchart LR
    subgraph "Admin / Management"
        A1["Home"] --- A2["Production"] --- A3["📷 Scan"] --- A4["Dispatch"] --- A5["Profile"]
    end
    
    subgraph "Boiler Operator"
        B1["Home"] --- B2["🔥 Boiler"] --- B3["💧 ETP"] --- B4["⚡ Power"] --- B5["Profile"]
    end
    
    subgraph "ETP Operator"
        C1["Home"] --- C2["💧 ETP"] --- C3["⚡ Power"] --- C4["Profile"]
    end
    
    subgraph "Rewinder Operator"
        D1["Home"] --- D2["Rewinder"] --- D3["📷 Scan"] --- D4["Traceability"] --- D5["Profile"]
    end
    
    subgraph "Pulp Operator"
        E1["Home"] --- E2["Pulp Mill"] --- E3["Production"] --- E4["Profile"]
    end
```

---

## 10. QR Traceability Flow

```mermaid
flowchart TD
    A["Scan QR Code\non Reel"] --> B["Decode Reel No"]
    B --> C["Lookup Reel Data"]
    C --> D["Display Full Trace"]
    
    D --> E["Reel Details\n(Product, GSM, Size, Ply, Weight)"]
    D --> F["Parent Roll\n(Roll No, Machine, Shift)"]
    D --> G["Pulp Formula\n(Waste Mix, Chemicals)"]
    D --> H["QC Results\n(Grade, Inspector, Date)"]
    D --> I["Dispatch Info\n(Party, Vehicle, Challan)"]
    
    E --> J["Full Supply Chain\nTraceability"]
```
