// Saheb Paper Mill - AI Decision Engine & Noise Filtering Algorithm

export interface DecisionOption {
  id: string;
  name: string;
  tagline: string;
  costScore: number;       // 1 (Expensive) to 10 (Economical)
  speedScore: number;      // 1 (Slow) to 10 (Fast)
  qualityScore: number;    // 1 (Low) to 10 (Superior)
  riskScore: number;       // 1 (High Risk) to 10 (Very Safe/Low Risk)
  simplicityScore: number; // 1 (Complex) to 10 (Effortless)
  
  // Qualitative Realities
  keyPros: string[];
  keyCons: string[];
  dealbreakers: string[];
  operationalReality: string; // The "cut the fluff" truth
  estimatedCostPerUnit?: string;
  bestSuitedFor: string;
}

export interface UncertaintyFactor {
  id: string;
  variable: string;
  whyUncertain: string;
  impactOnDecision: 'High' | 'Medium' | 'Low';
  actionToVerify: string;
}

export interface DecisionScenario {
  id: string;
  title: string;
  category: 'Raw Material' | 'Boiler & Energy' | 'Production & Rewinder' | 'ETP & Chemicals' | 'Logistics & Dispatch' | 'Spare Parts & Maintenance' | 'Custom';
  question: string;
  backgroundContext: string;
  options: DecisionOption[];
  uncertainties: UncertaintyFactor[];
  defaultWeights: PriorityWeights;
}

export interface PriorityWeights {
  cost: number;       // 0 to 100
  quality: number;    // 0 to 100
  speed: number;      // 0 to 100
  riskAversion: number; // 0 to 100
  simplicity: number; // 0 to 100
}

export interface DecisionEvaluationResult {
  winningOption: DecisionOption;
  confidenceScore: number; // e.g. 92%
  verdictRationale: string;
  actionSteps: string[];
  scoredOptions: Array<{
    option: DecisionOption;
    compositeScore: number;
    rank: number;
    breakdown: {
      cost: number;
      quality: number;
      speed: number;
      risk: number;
      simplicity: number;
    };
  }>;
  criticalUncertainties: UncertaintyFactor[];
}

// 6 Core Pre-Configured Factory Decision Scenarios
export const MILL_DECISION_PRESETS: DecisionScenario[] = [
  {
    id: 'pulp-blend-gsm18',
    title: 'Pulp Mix for 18 GSM Napkin Tissue',
    category: 'Raw Material',
    question: 'Should we use 100% Virgin Hardwood Bleached Pulp or a 70:30 Virgin & Local Recycled Fiber Blend for the upcoming 18 GSM napkin batch?',
    backgroundContext: 'Client requires high softness and bright white shade with minimum 1.8 N/m tensile strength. Raw material warehouse has 12 tons virgin and 20 tons local recycled kraft pulp.',
    defaultWeights: {
      cost: 40,
      quality: 85,
      speed: 30,
      riskAversion: 75,
      simplicity: 50,
    },
    uncertainties: [
      {
        id: 'u1',
        variable: 'Recycled Fiber Freeness (SR Level)',
        whyUncertain: 'Lab has not tested the Canadian Standard Freeness (°SR) of the latest recycled bale lot. If SR > 45, drainage on Yankee dryer will slow down.',
        impactOnDecision: 'High',
        actionToVerify: 'Run a 10-minute Lab °SR and moisture test on the recycled bale batch before batching.',
      },
      {
        id: 'u2',
        variable: 'Client Whiteness Tolerance',
        whyUncertain: 'Order sheet states "Grade A Tissue", but ISO Brightness tolerance (82% vs 88%) was not explicitly signed by client.',
        impactOnDecision: 'Medium',
        actionToVerify: 'Confirm client acceptable brightness threshold via WhatsApp / phone before pulper loading.',
      },
    ],
    options: [
      {
        id: 'opt-7030-blend',
        name: '70:30 Virgin + Recycled Blend',
        tagline: 'Balanced Cost Optimization with Controlled Softness',
        costScore: 8.5,
        speedScore: 7.0,
        qualityScore: 7.8,
        riskScore: 7.2,
        simplicityScore: 7.5,
        estimatedCostPerUnit: '₹41,200 / Ton',
        operationalReality: 'Saves approx ₹6,800/ton in raw material costs while comfortably meeting the 1.8 N/m tensile strength threshold if refiner plate gap is kept at 0.35mm.',
        keyPros: ['₹6,800 per ton direct savings', 'Conserves premium virgin stock', 'Good bulk and sheet formation'],
        keyCons: ['Brightness drops from 88% to 83.5%', 'Slightly higher fiber dust during rewinding'],
        dealbreakers: ['Do NOT use if client has mandated 88%+ export-grade brightness'],
        bestSuitedFor: 'Standard domestic market napkin rolls and high-volume orders',
      },
      {
        id: 'opt-100-virgin',
        name: '100% Virgin Bleached Pulp',
        tagline: 'Maximum Brightness, Zero Fiber Dust, Premium Hand-feel',
        costScore: 4.2,
        speedScore: 9.0,
        qualityScore: 9.6,
        riskScore: 9.5,
        simplicityScore: 9.0,
        estimatedCostPerUnit: '₹48,000 / Ton',
        operationalReality: 'Guarantees zero web breaks on high-speed rewinder, velvety hand feel, and 88.5% ISO brightness with zero risk of customer rejection.',
        keyPros: ['Zero customer quality complaints', 'High machine runnability (no wire clogging)', 'Flawless whiteness and tear strength'],
        keyCons: ['High raw material cost (₹48k/ton)', 'Depletes virgin inventory faster'],
        dealbreakers: ['Margin compression if selling price is below ₹55/kg'],
        bestSuitedFor: 'Export orders, luxury hospitality clients, and premium Grade A contracts',
      },
    ],
  },
  {
    id: 'boiler-fuel-blend',
    title: 'Boiler Fuel: 100% Briquettes vs Mixed Wood Chips',
    category: 'Boiler & Energy',
    question: 'Should the steam boiler run on 100% Compressed Mustard/Sawdust Briquettes or a 60:40 Briquette + Local Wood Chips mix?',
    backgroundContext: 'Paper machine running continuously at 3.8 tons steam/hour demand. Steam pressure required is 8.0 to 8.5 kg/cm² on Yankee cylinder.',
    defaultWeights: {
      cost: 70,
      quality: 60,
      speed: 80,
      riskAversion: 65,
      simplicity: 60,
    },
    uncertainties: [
      {
        id: 'ub1',
        variable: 'Wood Chips Moisture Level',
        whyUncertain: 'Due to recent monsoon rain, incoming wood chips moisture may be between 22% and 38%. Above 25% moisture, boiler thermal efficiency drops drastically.',
        impactOnDecision: 'High',
        actionToVerify: 'Check wood chip yard moisture meter. If moisture > 25%, avoid feeding into main furnace.',
      },
    ],
    options: [
      {
        id: 'opt-briquette-mix',
        name: '60:40 Briquette + Wood Chips Blend',
        tagline: 'Lowest Steam Cost with Active Stoker Feeding',
        costScore: 8.8,
        speedScore: 7.2,
        qualityScore: 8.0,
        riskScore: 7.0,
        simplicityScore: 6.8,
        estimatedCostPerUnit: '₹2.10 / KG Steam',
        operationalReality: 'Provides optimal calorific value (3,400 kcal/kg) at the lowest cost, provided stoker grate is cleaned once every 8-hour shift.',
        keyPros: ['Lowest fuel cost per ton paper', 'Even grate fire bed', 'Readily available wood chips in yard'],
        keyCons: ['Requires manual ash de-slagging every 8 hours', 'Higher flue gas smoke if wet chips mix in'],
        dealbreakers: ['Do NOT use if wood chips moisture exceeds 28%'],
        bestSuitedFor: 'Normal 24-hour continuous production when yard stock is dry',
      },
      {
        id: 'opt-pure-briquette',
        name: '100% High-Density Briquettes',
        tagline: 'Ultra Stable 8.5 Bar Pressure with Minimum Ash & Clinker',
        costScore: 5.5,
        speedScore: 9.2,
        qualityScore: 9.4,
        riskScore: 9.0,
        simplicityScore: 9.0,
        estimatedCostPerUnit: '₹2.65 / KG Steam',
        operationalReality: 'Calorific value of 4,100 kcal/kg gives rock-solid Yankee cylinder heating with almost zero ash clogging and clean chimney emission.',
        keyPros: ['Rock-solid 8.5 Bar pressure consistency', 'Zero soot blower downtime', 'Minimal ash disposal workload'],
        keyCons: ['₹0.55/kg higher fuel expenditure', 'Higher daily briquette consumption tonnage'],
        dealbreakers: ['None'],
        bestSuitedFor: 'High-speed 22-24 GSM kraft running or when boiler operators are running lean shifts',
      },
    ],
  },
  {
    id: 'etp-coagulant-pac-alum',
    title: 'ETP Chemical: Liquid PAC vs Ferric Alum',
    category: 'ETP & Chemicals',
    question: 'Should ETP water recycling plant dose PAC (Poly Aluminium Chloride) or Liquid Alum for daily primary clarifier treatment?',
    backgroundContext: 'Mill discharges 450 m³ wastewater daily with incoming COD 1,800 mg/L and TSS 900 mg/L. Treated water is recycled back to pulp dilution.',
    defaultWeights: {
      cost: 50,
      quality: 85,
      speed: 70,
      riskAversion: 90,
      simplicity: 75,
    },
    uncertainties: [
      {
        id: 'ue1',
        variable: 'Clarifier Sludge Dewatering Press Availability',
        whyUncertain: 'If the mechanical belt press filter is under maintenance, large sludge volumes from Alum will choke the secondary aeration lagoon.',
        impactOnDecision: 'High',
        actionToVerify: 'Verify ETP belt filter press status before switching to Alum.',
      },
    ],
    options: [
      {
        id: 'opt-pac',
        name: 'Dosing PAC (Poly Aluminium Chloride)',
        tagline: 'Compact Sludge, Fast Flocculation, Stable pH 7.2',
        costScore: 6.8,
        speedScore: 9.2,
        qualityScore: 9.4,
        riskScore: 9.2,
        simplicityScore: 8.8,
        estimatedCostPerUnit: '₹14.50 / m³ Water',
        operationalReality: 'PAC forms dense, fast-settling flocs in 4 minutes and generates 40% less sludge volume than alum, keeping recycled water clean for pulp mill.',
        keyPros: ['40% less sludge generation', 'Maintains neutral pH without extra caustic soda', 'Fast clarifier settling time'],
        keyCons: ['Raw chemical price is 20% higher per liter'],
        dealbreakers: ['None'],
        bestSuitedFor: 'Closed-loop 100% water recycling and meeting strict GPCB environmental compliance',
      },
      {
        id: 'opt-alum',
        name: 'Dosing Liquid Alum (Aluminium Sulphate)',
        tagline: 'Cheap Bulk Clarification with High Sludge Volume',
        costScore: 9.0,
        speedScore: 6.5,
        qualityScore: 6.5,
        riskScore: 5.8,
        simplicityScore: 6.0,
        estimatedCostPerUnit: '₹10.20 / m³ Water',
        operationalReality: 'Very cheap initially, but requires continuous lime/caustic dosing to prevent acidic pH and produces heavy voluminous sludge that overflows clarifiers.',
        keyPros: ['Low initial chemical purchase price', 'Effective for heavy bulk turbidity'],
        keyCons: ['Produces bulky gelatinous sludge', 'Acidic runoff damages pump impellers', 'Needs extra lime for pH correction'],
        dealbreakers: ['Do NOT use if recycled water is pumped directly to machine wire showers (corrosion risk)'],
        bestSuitedFor: 'Temporary cost-containment during open-loop discharge seasons',
      },
    ],
  },
  {
    id: 'dispatch-truck-strategy',
    title: 'Dispatch Logistics: 25T Multi-Axle vs Two 12T Trucks',
    category: 'Logistics & Dispatch',
    question: 'Should we dispatch a 22.5 Ton reel order using a single 25-Ton Multi-Axle Taurus truck or two 12-Ton Medium Commercial Vehicles?',
    backgroundContext: 'Client in Ahmedabad industrial zone with a narrow approach lane. Delivery required within 18 hours.',
    defaultWeights: {
      cost: 65,
      quality: 70,
      speed: 90,
      riskAversion: 80,
      simplicity: 60,
    },
    uncertainties: [
      {
        id: 'ut1',
        variable: 'Client Gate Turning Radius & Height Clearance',
        whyUncertain: 'Whether client factory gate allows 32-foot Taurus multi-axle truck without blocking public road.',
        impactOnDecision: 'High',
        actionToVerify: 'Call client dispatch supervisor to confirm if 25T truck can unload inside gate.',
      },
    ],
    options: [
      {
        id: 'opt-single-25t',
        name: 'Single 25T Multi-Axle Truck',
        tagline: 'Lowest Freight Cost per KG (₹1.45/kg)',
        costScore: 9.2,
        speedScore: 8.0,
        qualityScore: 8.5,
        riskScore: 6.5,
        simplicityScore: 8.5,
        estimatedCostPerUnit: '₹32,500 Total Freight',
        operationalReality: 'Saves ₹8,000 in total freight charges and single toll gate crossing, but risks delayed unloading if client gate is cramped.',
        keyPros: ['Saves ₹8,000 in freight vs 2 trucks', 'Single challan and E-Way bill', 'Less paperwork and driver coordination'],
        keyCons: ['Requires wide turning radius at client warehouse', 'Full load must be ready before gate exit'],
        dealbreakers: ['Unusable if client dock cannot accommodate 32ft trailers'],
        bestSuitedFor: 'Large warehouse deliveries with dedicated crane or forklift unloading bays',
      },
      {
        id: 'opt-two-12t',
        name: 'Two 12T Medium Trucks',
        tagline: 'High Agility, Narrow Road Access, Staggered Unloading',
        costScore: 6.2,
        speedScore: 9.0,
        qualityScore: 9.0,
        riskScore: 9.2,
        simplicityScore: 6.5,
        estimatedCostPerUnit: '₹40,500 Total Freight',
        operationalReality: 'Guarantees easy entry into any city or narrow lane without municipal restrictions or traffic police harassment.',
        keyPros: ['Zero entry or turning issues in narrow industrial zones', 'Can depart immediately as each 11T gets packed', 'Fast manual roll unloading'],
        keyCons: ['₹8,000 higher freight expenditure', 'Two drivers and two E-way bills to track'],
        dealbreakers: ['None'],
        bestSuitedFor: 'Congested urban destinations, narrow lane godowns, and urgent split deliveries',
      },
    ],
  },
  {
    id: 'rewinder-speed-joints',
    title: 'Rewinder Speed: High RPM vs Low RPM for Joint Quality',
    category: 'Production & Rewinder',
    question: 'Should the rewinder run at maximum 650 m/min speed to clear jumbo roll backlog or at 450 m/min to eliminate reel web tears and joints?',
    backgroundContext: '3 jumbo rolls waiting in queue. Machine producing high-bulk 16 GSM toilet tissue.',
    defaultWeights: {
      cost: 50,
      quality: 90,
      speed: 75,
      riskAversion: 85,
      simplicity: 80,
    },
    uncertainties: [
      {
        id: 'ur1',
        variable: 'Jumbo Roll Web Moisture Uniformity',
        whyUncertain: 'If the jumbo roll edges have moisture difference > 1.5%, high tension at 650 m/min will trigger sudden web breaks.',
        impactOnDecision: 'High',
        actionToVerify: 'Operator should check roll edge hardness with Schmidt hammer before ramping to 650 m/min.',
      },
    ],
    options: [
      {
        id: 'opt-moderate-speed',
        name: '450 m/min Moderate Speed (Zero-Joint Focus)',
        tagline: 'Flawless Grade A Reels with < 1 Joint per 500kg Roll',
        costScore: 7.2,
        speedScore: 6.8,
        qualityScore: 9.6,
        riskScore: 9.5,
        simplicityScore: 9.0,
        estimatedCostPerUnit: '18 min / Roll',
        operationalReality: 'Yields 98.5% Grade A finished reels with tight roll hardness and zero edge wrinkles, eliminating rewinder stoppage time.',
        keyPros: ['Virtually zero web breaks', 'Zero customer complaints regarding joints', 'Tight, uniform reel winding profile'],
        keyCons: ['Takes 4 minutes longer per finished reel roll'],
        dealbreakers: ['None'],
        bestSuitedFor: '16 GSM lightweight tissue, export orders, and automatic packaging lines',
      },
      {
        id: 'opt-high-speed',
        name: '650 m/min High Throughput Run',
        tagline: 'Fastest Queue Clearance for Heavy GSM Orders',
        costScore: 8.5,
        speedScore: 9.5,
        qualityScore: 6.8,
        riskScore: 5.5,
        simplicityScore: 6.0,
        estimatedCostPerUnit: '12 min / Roll',
        operationalReality: 'Quickly clears the floor when jumbo rolls pile up, but increases web breaks by 18% on lightweight 16 GSM grades.',
        keyPros: ['Clears floor backlog 35% faster', 'Higher machine utilization index'],
        keyCons: ['Higher risk of web snapping', 'Reels may have 2-3 joints (Grade B risk)'],
        dealbreakers: ['Do NOT use for single-ply tissue below 17 GSM'],
        bestSuitedFor: 'Heavy 22-26 GSM Kraft, MG poster paper, and urgent batch deadlines',
      },
    ],
  },
  {
    id: 'spare-felt-sleeve',
    title: 'Press Section Felt: Premium Imported vs Domestic OEM',
    category: 'Spare Parts & Maintenance',
    question: 'Should we procure Huyck.Wangner / Voith imported press felt or Indian OEM felt for the upcoming annual maintenance shutdown?',
    backgroundContext: 'Press section operates at 80 kN/m linear nip pressure. Dewatering efficiency directly impacts steam consumption on Yankee cylinder.',
    defaultWeights: {
      cost: 45,
      quality: 90,
      speed: 50,
      riskAversion: 90,
      simplicity: 80,
    },
    uncertainties: [
      {
        id: 'uf1',
        variable: 'Imported Vendor Delivery Lead Time',
        whyUncertain: 'Customs clearance and shipping may take 4 to 6 weeks. Shutdown is scheduled in 3 weeks.',
        impactOnDecision: 'High',
        actionToVerify: 'Check domestic warehouse distributor ready-stock availability before placing PO.',
      },
    ],
    options: [
      {
        id: 'opt-imported-felt',
        name: 'Premium High-Void Imported Felt',
        tagline: 'Max Water Extraction, Saves 12% Boiler Steam Daily',
        costScore: 5.0,
        speedScore: 6.0,
        qualityScore: 9.8,
        riskScore: 9.2,
        simplicityScore: 9.0,
        estimatedCostPerUnit: '₹2,40,000 / Felt',
        operationalReality: 'Higher initial cost, but extracts 2.5% more moisture mechanically in the press, saving ₹18,000 per day in boiler fuel consumption.',
        keyPros: ['Saves ~₹18,000/day in boiler steam', '60+ days continuous operational lifespan', 'Zero paper mark impressions'],
        keyCons: ['₹90,000 higher initial upfront PO cost', 'Longer lead time if not in domestic stock'],
        dealbreakers: ['Do NOT order if delivery cannot be guaranteed before scheduled shutdown date'],
        bestSuitedFor: 'High-speed continuous tissue lines where boiler fuel cost is the biggest expense',
      },
      {
        id: 'opt-domestic-felt',
        name: 'Standard Domestic OEM Felt',
        tagline: 'Immediate 48h Delivery at Lower Upfront Capex',
        costScore: 8.5,
        speedScore: 9.5,
        qualityScore: 7.2,
        riskScore: 7.0,
        simplicityScore: 7.5,
        estimatedCostPerUnit: '₹1,50,000 / Felt',
        operationalReality: 'Delivered in 2 days from Ahmedabad/Surat, but compacts faster after 35 days, requiring higher steam pressure to dry paper.',
        keyPros: ['Immediate 48-hour delivery', '₹90,000 lower initial cash outflow', 'Reliable local technical support'],
        keyCons: ['Lower mechanical dewatering (higher steam demand)', 'Lifespan 35-40 days before compaction'],
        dealbreakers: ['None'],
        bestSuitedFor: 'Emergency replacements and short-run production cycles',
      },
    ],
  },
];

// Calculation Function: Evaluates options with priority weights
export function evaluateDecision(
  scenario: DecisionScenario,
  weights: PriorityWeights
): DecisionEvaluationResult {
  const totalWeight =
    (weights.cost || 0) +
    (weights.quality || 0) +
    (weights.speed || 0) +
    (weights.riskAversion || 0) +
    (weights.simplicity || 0) || 1;

  const normCost = (weights.cost || 0) / totalWeight;
  const normQuality = (weights.quality || 0) / totalWeight;
  const normSpeed = (weights.speed || 0) / totalWeight;
  const normRisk = (weights.riskAversion || 0) / totalWeight;
  const normSimplicity = (weights.simplicity || 0) / totalWeight;

  const scored = scenario.options.map(option => {
    const costWeighted = option.costScore * normCost * 10;
    const qualityWeighted = option.qualityScore * normQuality * 10;
    const speedWeighted = option.speedScore * normSpeed * 10;
    const riskWeighted = option.riskScore * normRisk * 10;
    const simplicityWeighted = option.simplicityScore * normSimplicity * 10;

    const compositeScore = Number(
      (costWeighted + qualityWeighted + speedWeighted + riskWeighted + simplicityWeighted).toFixed(2)
    );

    return {
      option,
      compositeScore,
      rank: 1,
      breakdown: {
        cost: Number(costWeighted.toFixed(2)),
        quality: Number(qualityWeighted.toFixed(2)),
        speed: Number(speedWeighted.toFixed(2)),
        risk: Number(riskWeighted.toFixed(2)),
        simplicity: Number(simplicityWeighted.toFixed(2)),
      },
    };
  });

  // Sort descending
  scored.sort((a, b) => b.compositeScore - a.compositeScore);
  scored.forEach((item, index) => {
    item.rank = index + 1;
  });

  const winner = scored[0].option;
  const second = scored[1]?.compositeScore || 0;
  const scoreDiff = scored[0].compositeScore - second;

  // Compute confidence percentage
  let confidenceScore = Math.min(98, Math.max(72, Math.round(75 + scoreDiff * 3.5)));
  if (scenario.uncertainties.length > 2) {
    confidenceScore -= 8; // Deduct if too many unknowns
  }

  // Construct Action Rationale
  const topStrength =
    winner.qualityScore >= 9
      ? 'unmatched quality & reliability'
      : winner.costScore >= 8.5
      ? 'significant financial cost savings'
      : winner.speedScore >= 9
      ? 'rapid execution speed'
      : 'optimal operational balance';

  const verdictRationale = `Based on current factory priorities, "${winner.name}" wins with a composite score of ${scored[0].compositeScore}/100. It offers ${topStrength} while keeping operational downtime risk minimal.`;

  const actionSteps = [
    `Confirm parameters and approve implementation of "${winner.name}".`,
    `Notify shift supervisor and log settings in shift handover book.`,
    ...(scenario.uncertainties[0]
      ? [`Verification Step: ${scenario.uncertainties[0].actionToVerify}`]
      : ['Monitor initial 30 minutes of production closely.']),
  ];

  return {
    winningOption: winner,
    confidenceScore,
    verdictRationale,
    actionSteps,
    scoredOptions: scored,
    criticalUncertainties: scenario.uncertainties,
  };
}

// Generate dynamic analysis for open-ended user custom dilemmas
export function analyzeCustomDilemma(
  customPrompt: string,
  weights: PriorityWeights
): DecisionScenario {
  const promptLower = customPrompt.toLowerCase();

  // Basic intelligent heuristic extractor
  const hasCostFocus = promptLower.includes('cost') || promptLower.includes('cheap') || promptLower.includes('price') || promptLower.includes('budget') || promptLower.includes('sasta') || promptLower.includes('kharcha');
  const hasQualityFocus = promptLower.includes('quality') || promptLower.includes('strength') || promptLower.includes('gsm') || promptLower.includes('grade') || promptLower.includes('premium');
  const hasSpeedFocus = promptLower.includes('speed') || promptLower.includes('urgent') || promptLower.includes('fast') || promptLower.includes('early') || promptLower.includes('jaldi');

  return {
    id: `custom-${Date.now()}`,
    title: customPrompt.length > 60 ? `${customPrompt.substring(0, 57)}...` : customPrompt,
    category: 'Custom',
    question: customPrompt,
    backgroundContext: 'AI evaluated operational trade-offs, financial impacts, and execution risks specifically for paper mill factory operations.',
    defaultWeights: weights,
    uncertainties: [
      {
        id: 'cu-1',
        variable: 'Current Warehouse Available Stock & Cashflow',
        whyUncertain: 'Real-time inventory levels for raw materials/parts and monthly vendor credit terms are unconfirmed.',
        impactOnDecision: 'High',
        actionToVerify: 'Verify physical stock register and vendor payment terms before final approval.',
      },
      {
        id: 'cu-2',
        variable: 'Shift Crew Skill Level',
        whyUncertain: 'Whether the current shift operator has specific experience with this setup.',
        impactOnDecision: 'Medium',
        actionToVerify: 'Ensure shift supervisor is physically present during the initial execution phase.',
      },
    ],
    options: [
      {
        id: 'opt-lean-balanced',
        name: hasQualityFocus ? 'Quality-First Precision Route' : 'Cost-Optimized Standard Route',
        tagline: hasQualityFocus ? 'Engineered for Zero Defects & Long-Term Durability' : 'Engineered for Low Capex & High Daily Margins',
        costScore: hasCostFocus ? 8.8 : 6.5,
        speedScore: hasSpeedFocus ? 8.5 : 7.2,
        qualityScore: hasQualityFocus ? 9.4 : 7.8,
        riskScore: 8.2,
        simplicityScore: 8.0,
        estimatedCostPerUnit: 'Cost-Optimized',
        operationalReality: 'Provides the safest, most practical path forward for typical mill working conditions without incurring excessive debt or operational shock.',
        keyPros: ['High ROI', 'Minimal learning curve for machine operators', 'Clean operational rollback plan if needed'],
        keyCons: ['Requires disciplined process parameter adherence'],
        dealbreakers: ['Do not proceed if baseline technical specifications are violated'],
        bestSuitedFor: 'Standard continuous factory operations and daily shift management',
      },
      {
        id: 'opt-aggressive-alternative',
        name: 'Rapid Aggressive Alternative',
        tagline: 'Maximum Throughput with Higher Monitoring Intensity',
        costScore: 6.0,
        speedScore: 9.5,
        qualityScore: 7.5,
        riskScore: 5.8,
        simplicityScore: 6.5,
        estimatedCostPerUnit: 'Variable',
        operationalReality: 'Accelerates execution dramatically, but requires active supervision to prevent unexpected breakdowns or quality drift.',
        keyPros: ['Fastest turnaround time', 'High potential volume throughput'],
        keyCons: ['Higher risk of process variance or rework'],
        dealbreakers: ['Do not attempt with untrained contract labor'],
        bestSuitedFor: 'Emergency rush orders and critical bottleneck relief',
      },
    ],
  };
}
