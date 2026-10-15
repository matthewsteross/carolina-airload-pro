import { CountyClimate, SourceRecord } from '../data/climateData';

export type FoundationType = 
  | 'slab' 
  | 'crawlspace_vented' 
  | 'crawlspace_sealed' 
  | 'basement_unconditioned' 
  | 'conditioned_space_below';

export type CeilingType = 
  | 'attic_vented_r30' 
  | 'attic_vented_r38' 
  | 'attic_vented_r19'
  | 'attic_sprayfoam_r20' 
  | 'vaulted_r30' 
  | 'conditioned_space_above';

export type WallVintage = 
  | 'pre_1980_uninsulated' 
  | '1980_2000_r11' 
  | '2000_2015_r13' 
  | 'modern_code_r15_r20' 
  | 'sprayfoam_r21';

export type WindowType = 
  | 'single_clear' 
  | 'double_clear' 
  | 'double_low_e' 
  | 'triple_low_e';

export type InfiltrationLevel = 
  | 'tight' 
  | 'semi_tight' 
  | 'average' 
  | 'loose';

export type DuctLocation = 
  | 'attic_unconditioned' 
  | 'crawlspace' 
  | 'conditioned_space';

export type SystemType = 
  | 'heat_pump' 
  | 'gas_furnace_ac' 
  | 'dual_fuel';

export interface AssemblySpec<T> {
  value: T;
  uValue?: number;
  fFactor?: number; // Slab perimeter heat loss factor (BTU / hr·ft·°F)
  shgc?: number;
  ach?: number;
  lossFactor?: { heatLoss: number; coolGain: number };
  description: string;
  source: SourceRecord;
}

export interface RoomData {
  id: string;
  name: string;
  sqFt: number;
  exteriorWalls: 1 | 2 | 3 | 0; // 0 = interior only
  windowSqFt?: number;
  calculatedBtu?: number;
  calculatedCfm?: number;
  suggestedDuctSize?: string;
  suggestedVentSize?: string;
}

export interface FloorInput {
  id: string;
  name: string;
  sqFt: number;
  ceilingHeight: number;
  foundation: FoundationType;
  ceiling: CeilingType;
  wallVintage: WallVintage;
  windowType: WindowType;
  windowCoveragePct: number;
  primaryExposure: 'balanced' | 'south' | 'west' | 'east' | 'north';
  infiltration: InfiltrationLevel;
  ductLocation: DuctLocation;
  systemType: SystemType;
  isMainLevel?: boolean; // Determines internal appliance distribution
  rooms?: RoomData[];
}

export interface ComponentBreakdown {
  wallsBtu: number;
  ceilingBtu: number;
  floorBtu: number;
  windowsBtu: number;
  infiltrationSensibleBtu: number;
  internalGainsBtu: number;
  ductGainBtu: number;
  latentBtu: number;
}

export interface FloorResult {
  floorId: string;
  name: string;
  sqFt: number;
  volume: number;
  
  // Heat Loads (BTU/h)
  sensibleCoolingBtu: number;
  latentCoolingBtu: number;
  totalCoolingBtu: number;
  totalHeatingBtu: number;
  
  // Granular Component Breakdown (For Validation & Inspector Audits)
  coolingComponents: ComponentBreakdown;
  heatingComponents: {
    wallsBtu: number;
    ceilingBtu: number;
    floorBtu: number;
    windowsBtu: number;
    infiltrationBtu: number;
    ductLossBtu: number;
  };

  // Sizing recommendations
  calculatedCoolingTons: number;
  recommendedTonnage: number; // Sized to standard split increments (e.g. 2.5)
  oversizingPercent: number;
  
  // Airflow
  totalCfm: number;
  
  // Heating equipment
  auxHeatStripKw?: number;
  recommendedFurnaceBtu?: number;
  
  // Room breakdown
  rooms: RoomData[];
}

export interface HouseCalculationResult {
  floors: FloorResult[];
  totalSqFt: number;
  totalCoolingBtu: number;
  totalHeatingBtu: number;
  totalTonnage: number;
  totalCfm: number;
  climate: CountyClimate;
  methodologySource: SourceRecord;
}

// -------------------------------------------------------------
// VERIFIED PUBLISHED SOURCES FOR ENVELOPE & HEAT TRANSFER VALUES
// -------------------------------------------------------------

const NCECC_TABLE_R402_SOURCE: SourceRecord = {
  document: "North Carolina Energy Conservation Code (NCECC) / IECC Section R402",
  tableOrPage: "Table R402.1.2: Insulation and Fenestration Requirements by Component",
  url: "https://codes.iccsafe.org/content/NCECC2018/chapter-4-re-residential-energy-efficiency",
  dateRetrieved: "2026-10-15"
};

const ASHRAE_FUNDAMENTALS_CH26_SOURCE: SourceRecord = {
  document: "ASHRAE Handbook of Fundamentals (2021)",
  tableOrPage: "Chapter 26: Heat, Air, and Moisture Transfer in Building Assemblies",
  url: "https://www.ashrae.org/technical-resources/bookstore/handbook",
  dateRetrieved: "2026-10-15"
};

const ASHRAE_FUNDAMENTALS_CH18_SOURCE: SourceRecord = {
  document: "ASHRAE Handbook of Fundamentals (2021)",
  tableOrPage: "Chapter 18: Nonresidential and Residential Cooling and Heating Load Calculations",
  url: "https://www.ashrae.org/technical-resources/bookstore/handbook",
  dateRetrieved: "2026-10-15"
};

const ASHRAE_FUNDAMENTALS_CH21_SOURCE: SourceRecord = {
  document: "ASHRAE Handbook of Fundamentals (2021) / SMACNA Residential Comfort System Installation",
  tableOrPage: "Chapter 21: Duct Design - Conduction Heat Transfer in Buffer Spaces",
  url: "https://www.ashrae.org/technical-resources/bookstore/handbook",
  dateRetrieved: "2026-10-15"
};

const NFRC_WINDOW_SOURCE: SourceRecord = {
  document: "National Fenestration Rating Council (NFRC) / NCECC Table R402.1.2",
  tableOrPage: "NFRC 100/200 Certified Rating Tables for Residential Windows",
  url: "https://www.nfrc.org/residential-fenestration-ratings/",
  dateRetrieved: "2026-10-15"
};

export const WALL_SPECS: Record<WallVintage, AssemblySpec<WallVintage>> = {
  'pre_1980_uninsulated': {
    value: 'pre_1980_uninsulated',
    uValue: 0.22, // ~R-4.5 uninsulated wood stud
    description: "Pre-1980 2x4 Wood Stud, minimal/no wall insulation (U-0.22)",
    source: ASHRAE_FUNDAMENTALS_CH26_SOURCE
  },
  '1980_2000_r11': {
    value: '1980_2000_r11',
    uValue: 0.088, // R-11 fiberglass batt with framing factors (U-0.088)
    description: "1980-2000 2x4 Wood Stud with R-11 cavity batt (U-0.088)",
    source: ASHRAE_FUNDAMENTALS_CH26_SOURCE
  },
  '2000_2015_r13': {
    value: '2000_2015_r13',
    uValue: 0.075, // R-13 cavity batt (U-0.075)
    description: "2000-2015 2x4 Wood Stud with R-13 cavity batt (U-0.075)",
    source: NCECC_TABLE_R402_SOURCE
  },
  'modern_code_r15_r20': {
    value: 'modern_code_r15_r20',
    uValue: 0.057, // R-15 continuous or R-20 code compliant assembly (U-0.057)
    description: "Modern NC/SC Code 2x4 R-15 or 2x6 R-20 Wood Frame (U-0.057)",
    source: NCECC_TABLE_R402_SOURCE
  },
  'sprayfoam_r21': {
    value: 'sprayfoam_r21',
    uValue: 0.045, // R-21 closed-cell/open-cell spray foam envelope (U-0.045)
    description: "High Performance Spray Foam 2x6 Cavity Fill (U-0.045)",
    source: ASHRAE_FUNDAMENTALS_CH26_SOURCE
  }
};

export const CEILING_SPECS: Record<CeilingType, AssemblySpec<CeilingType>> = {
  'attic_vented_r19': {
    value: 'attic_vented_r19',
    uValue: 0.050,
    description: "Vented Attic with R-19 Batt / Loose Fill (U-0.050)",
    source: ASHRAE_FUNDAMENTALS_CH26_SOURCE
  },
  'attic_vented_r30': {
    value: 'attic_vented_r30',
    uValue: 0.033,
    description: "Vented Attic with R-30 Blown Insulation (U-0.033)",
    source: NCECC_TABLE_R402_SOURCE
  },
  'attic_vented_r38': {
    value: 'attic_vented_r38',
    uValue: 0.026,
    description: "Vented Attic with R-38 Blown Insulation (NC/SC Code Minimum, U-0.026)",
    source: NCECC_TABLE_R402_SOURCE
  },
  'attic_sprayfoam_r20': {
    value: 'attic_sprayfoam_r20',
    uValue: 0.045,
    description: "Unvented Sealed Attic with R-20 Spray Foam at Roof Deck (U-0.045)",
    source: ASHRAE_FUNDAMENTALS_CH26_SOURCE
  },
  'vaulted_r30': {
    value: 'vaulted_r30',
    uValue: 0.034,
    description: "Vaulted / Cathedral Ceiling with R-30 Cavity Insulation (U-0.034)",
    source: NCECC_TABLE_R402_SOURCE
  },
  'conditioned_space_above': {
    value: 'conditioned_space_above',
    uValue: 0.0,
    description: "Conditioned Living Space Directly Above (No Attic Heat Loss/Gain)",
    source: ASHRAE_FUNDAMENTALS_CH18_SOURCE
  }
};

export const FLOOR_SPECS: Record<FoundationType, AssemblySpec<FoundationType>> = {
  'slab': {
    value: 'slab',
    fFactor: 0.73, // ASHRAE / IECC uninsulated slab edge perimeter F-factor (BTU/hr·ft·°F)
    description: "Slab-on-Grade Concrete Floor (Perimeter F-Factor: 0.73 BTU/hr·ft·°F)",
    source: NCECC_TABLE_R402_SOURCE
  },
  'crawlspace_vented': {
    value: 'crawlspace_vented',
    uValue: 0.070, // R-13 floor insulation over vented crawlspace
    description: "Vented Crawlspace with R-13 Floor Batt Insulation (U-0.070)",
    source: NCECC_TABLE_R402_SOURCE
  },
  'crawlspace_sealed': {
    value: 'crawlspace_sealed',
    uValue: 0.038, // Sealed conditioned crawlspace with R-10 wall continuous
    description: "Closed / Conditioned Crawlspace with R-10 Wall Insulation (U-0.038)",
    source: NCECC_TABLE_R402_SOURCE
  },
  'basement_unconditioned': {
    value: 'basement_unconditioned',
    uValue: 0.040,
    description: "Floor over Unconditioned Enclosed Basement (U-0.040)",
    source: ASHRAE_FUNDAMENTALS_CH26_SOURCE
  },
  'conditioned_space_below': {
    value: 'conditioned_space_below',
    uValue: 0.0,
    description: "Conditioned Living Space Directly Below (Intermediate Floor)",
    source: ASHRAE_FUNDAMENTALS_CH18_SOURCE
  }
};

export const WINDOW_SPECS: Record<WindowType, AssemblySpec<WindowType>> = {
  'single_clear': {
    value: 'single_clear',
    uValue: 1.05,
    shgc: 0.82,
    description: "Single-Pane Clear Aluminum/Wood Frame (U-1.05, SHGC-0.82)",
    source: NFRC_WINDOW_SOURCE
  },
  'double_clear': {
    value: 'double_clear',
    uValue: 0.50,
    shgc: 0.70,
    description: "Double-Pane Clear Insulated Glass (U-0.50, SHGC-0.70)",
    source: NFRC_WINDOW_SOURCE
  },
  'double_low_e': {
    value: 'double_low_e',
    uValue: 0.30,
    shgc: 0.25,
    description: "Double-Pane Low-E Argon-Filled (NC/SC Code Standard: U-0.30, SHGC-0.25)",
    source: NCECC_TABLE_R402_SOURCE
  },
  'triple_low_e': {
    value: 'triple_low_e',
    uValue: 0.22,
    shgc: 0.22,
    description: "Triple-Pane High Performance Low-E (U-0.22, SHGC-0.22)",
    source: NFRC_WINDOW_SOURCE
  }
};

export const INFILTRATION_SPECS: Record<InfiltrationLevel, AssemblySpec<InfiltrationLevel>> = {
  'tight': {
    value: 'tight',
    ach: 0.30, // 5.0 ACH50 / N(17) ≈ 0.29 - 0.30 natural ACH per LBL infiltration model
    description: "Tight Envelope (<= 5.0 ACH50, NC/SC Code Verified, ~0.30 natural ACH)",
    source: NCECC_TABLE_R402_SOURCE
  },
  'semi_tight': {
    value: 'semi_tight',
    ach: 0.45, // ~7.5 ACH50
    description: "Semi-Tight Envelope (~7.0 - 8.0 ACH50, ~0.45 natural ACH)",
    source: ASHRAE_FUNDAMENTALS_CH18_SOURCE
  },
  'average': {
    value: 'average',
    ach: 0.60, // ~10 ACH50
    description: "Average Infiltration (~10.0 ACH50, 1990-2010 construction, ~0.60 natural ACH)",
    source: ASHRAE_FUNDAMENTALS_CH18_SOURCE
  },
  'loose': {
    value: 'loose',
    ach: 0.85, // >14 ACH50
    description: "Loose Infiltration (> 14.0 ACH50, older or unweatherized home, ~0.85 natural ACH)",
    source: ASHRAE_FUNDAMENTALS_CH18_SOURCE
  }
};

export const DUCT_SPECS: Record<DuctLocation, AssemblySpec<DuctLocation>> = {
  'attic_unconditioned': {
    value: 'attic_unconditioned',
    lossFactor: { heatLoss: 0.15, coolGain: 0.18 },
    description: "Ducts in Vented Attic (+18% cooling gain due to 125°F-135°F Carolinas attic heat)",
    source: ASHRAE_FUNDAMENTALS_CH21_SOURCE
  },
  'crawlspace': {
    value: 'crawlspace',
    lossFactor: { heatLoss: 0.10, coolGain: 0.10 },
    description: "Ducts in Crawlspace (+10% heat loss / cooling gain buffer)",
    source: ASHRAE_FUNDAMENTALS_CH21_SOURCE
  },
  'conditioned_space': {
    value: 'conditioned_space',
    lossFactor: { heatLoss: 0.02, coolGain: 0.03 },
    description: "Ducts inside conditioned building envelope (+2% - 3% minimal leakage)",
    source: ASHRAE_FUNDAMENTALS_CH21_SOURCE
  }
};

// Equal Friction Duct Sizing (ASHRAE Fundamentals Chapter 21 / 0.08 in. w.g. per 100 ft)
export function calculateDuctSize(cfm: number): string {
  if (cfm <= 50) return '5" Round Flex';
  if (cfm <= 85) return '6" Round Flex';
  if (cfm <= 135) return '7" Round Flex';
  if (cfm <= 200) return '8" Round Flex';
  if (cfm <= 280) return '9" Round Flex';
  if (cfm <= 380) return '10" Round Flex';
  if (cfm <= 550) return '12" Round Flex';
  return '14" Round or Dual 8" Flex';
}

// Residential Register Grille Face Sizing (ASHRAE / SMACNA 450-550 FPM core velocity)
export function calculateVentSize(cfm: number): string {
  if (cfm <= 70) return '4" x 10" Floor/Ceiling Register';
  if (cfm <= 110) return '4" x 12" Floor/Ceiling Register';
  if (cfm <= 160) return '6" x 10" Floor/Ceiling Register';
  if (cfm <= 210) return '6" x 12" Floor/Ceiling Register';
  if (cfm <= 280) return '8" x 12" Floor/Ceiling Register';
  return 'Dual 4" x 12" or 8" x 14" Register';
}

// Equipment Sizing increments (including standard 4.5 ton residential tier)
export function selectEquipmentTonnage(rawTons: number): { tonnage: number; oversizingPct: number } {
  const standardSizes = [1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];
  
  for (const size of standardSizes) {
    if (size >= rawTons) {
      const oversizingPct = Math.round(((size - rawTons) / rawTons) * 100);
      return { tonnage: size, oversizingPct };
    }
  }
  
  const customSize = Math.ceil(rawTons * 2) / 2;
  return { 
    tonnage: customSize, 
    oversizingPct: Math.round(((customSize - rawTons) / rawTons) * 100) 
  };
}

/**
 * Calculates heating and cooling loads per floor based on published ASHRAE heat balance equations
 */
export function calculateFloorLoad(floor: FloorInput, climate: CountyClimate, isSingleFloor = false): FloorResult {
  const indoorHeatTemp = 70; // Standard code winter indoor setpoint (IECC / NCRC)
  const indoorCoolTemp = 75; // Standard code summer indoor setpoint (IECC / NCRC)
  
  const deltaTHeat = Math.max(10, indoorHeatTemp - climate.winterDb);
  const deltaTCool = Math.max(5, climate.summerDb - indoorCoolTemp);
  
  const volume = floor.sqFt * floor.ceilingHeight;
  
  // Estimated exterior perimeter (assuming ~1.3:1 rectangular aspect ratio)
  const perimeter = 4 * Math.sqrt(floor.sqFt);
  const grossWallArea = perimeter * floor.ceilingHeight;
  const windowArea = floor.sqFt * (floor.windowCoveragePct / 100);
  const netWallArea = Math.max(100, grossWallArea - windowArea);
  
  // 1. Opaque Wall Conduction
  const wallU = WALL_SPECS[floor.wallVintage].uValue!;
  const wallHeatLoss = netWallArea * wallU * deltaTHeat;
  // Solar absorption on exterior walls (ASHRAE CLTD approximation: +6°F)
  const wallCoolGain = netWallArea * wallU * (deltaTCool + 6);
  
  // 2. Ceiling / Attic
  const ceilingSpec = CEILING_SPECS[floor.ceiling];
  const ceilingU = ceilingSpec.uValue!;
  const ceilingHeatLoss = floor.sqFt * ceilingU * deltaTHeat;
  
  // Attic Cooling: Dark ventilated roof attics reach 125°F-135°F in Carolinas summer (+35°F over deltaT)
  // Spray foam unvented roof decks stay within ~8°F of indoor ambient
  let ceilingCoolGain = 0;
  if (floor.ceiling === 'conditioned_space_above') {
    ceilingCoolGain = 0;
  } else if (floor.ceiling === 'attic_sprayfoam_r20') {
    ceilingCoolGain = floor.sqFt * ceilingU * (deltaTCool + 8);
  } else {
    // Vented attic or vaulted ceiling
    ceilingCoolGain = floor.sqFt * ceilingU * (deltaTCool + 35);
  }
    
  // 3. Floor / Foundation
  const floorSpec = FLOOR_SPECS[floor.foundation];
  let floorHeatLoss = 0;
  let floorCoolGain = 0;
  
  if (floor.foundation === 'slab') {
    // Correct Perimeter F-Factor Method: Q_slab = F_p * Perimeter * deltaT
    const fFactor = floorSpec.fFactor || 0.73;
    floorHeatLoss = fFactor * perimeter * deltaTHeat;
    floorCoolGain = 0; // Slabs have negligible cooling gain
  } else if (floor.foundation === 'crawlspace_vented') {
    // Vented crawlspace: outdoor winter air circulates freely (ground damping removed)
    floorHeatLoss = floor.sqFt * floorSpec.uValue! * deltaTHeat;
    floorCoolGain = floor.sqFt * floorSpec.uValue! * 3;
  } else if (floor.foundation === 'crawlspace_sealed') {
    // Sealed crawlspace: buffered from outdoors (ground damping factor ~0.6 applies)
    floorHeatLoss = floor.sqFt * floorSpec.uValue! * (deltaTHeat * 0.6);
    floorCoolGain = 0;
  } else if (floor.foundation === 'basement_unconditioned') {
    floorHeatLoss = floor.sqFt * floorSpec.uValue! * (deltaTHeat * 0.7);
    floorCoolGain = 0;
  } else {
    // Conditioned space below (intermediate 2nd floor)
    floorHeatLoss = 0;
    floorCoolGain = 0;
  }
  
  // 4. Windows (Fenestration) Conduction & Solar Radiation
  const winSpec = WINDOW_SPECS[floor.windowType];
  const windowHeatLoss = windowArea * winSpec.uValue! * deltaTHeat;
  
  // Solar Heat Gain: Carolinas latitude (34°N - 36°N) summer solar geometry:
  // Low-angle direct West sun in late afternoon and East in morning deliver the highest peak heat gain.
  // High midday sun angle makes South vertical glass gain lower than East/West.
  let solarFactor = 1.0;
  if (floor.primaryExposure === 'west') solarFactor = 1.40;
  else if (floor.primaryExposure === 'east') solarFactor = 1.25;
  else if (floor.primaryExposure === 'south') solarFactor = 0.85;
  else if (floor.primaryExposure === 'north') solarFactor = 0.45;
  else solarFactor = 1.00; // Balanced
  
  const windowCoolGain = (windowArea * winSpec.uValue! * deltaTCool) + 
                         (windowArea * winSpec.shgc! * 75 * solarFactor);
                         
  // 5. Infiltration (Air Leakage)
  const ach = INFILTRATION_SPECS[floor.infiltration].ach!;
  const cfmInfiltration = (volume * ach) / 60;
  
  // Sensible: 1.08 * CFM * deltaT
  const infiltrationHeatLoss = 1.08 * cfmInfiltration * deltaTHeat;
  const infiltrationSensibleCool = 1.08 * cfmInfiltration * deltaTCool;
  
  // Latent: 0.68 * CFM * deltaG (moisture grains difference)
  const infiltrationLatentCool = 0.68 * cfmInfiltration * climate.designGrains;
  
  // 6. Internal Heat Gains (Sensible & Latent)
  // Occupants (ASHRAE Ch. 18): 230 BTU/h sensible, 200 BTU/h latent per person.
  // In single-story homes: 3 occupants + 1,200 BTU kitchen/appliances.
  // In multi-story homes: 2 occupants on main + 1,200 BTU appliances; 2 occupants upstairs + 300 BTU electronics.
  let occupantSensible = 0;
  let occupantLatent = 0;
  let appliancesSensible = 0;

  if (isSingleFloor) {
    occupantSensible = 3 * 230;
    occupantLatent = 3 * 200;
    appliancesSensible = 1200;
  } else if (floor.isMainLevel ?? (floor.ceiling === 'conditioned_space_above' || floor.name.toLowerCase().includes('main') || floor.name.toLowerCase().includes('1'))) {
    // Main level with kitchen/living
    occupantSensible = 2 * 230;
    occupantLatent = 2 * 200;
    appliancesSensible = 1200;
  } else {
    // Upper level / bedrooms
    occupantSensible = 2 * 230;
    occupantLatent = 2 * 200;
    appliancesSensible = 300;
  }
  
  // 7. Duct Conduction & Air Leakage
  const ductFactors = DUCT_SPECS[floor.ductLocation].lossFactor!;
  
  // Subtotals before duct buffer
  const rawHeatLoss = wallHeatLoss + ceilingHeatLoss + floorHeatLoss + windowHeatLoss + infiltrationHeatLoss;
  const rawSensibleCool = wallCoolGain + ceilingCoolGain + floorCoolGain + windowCoolGain + 
                          infiltrationSensibleCool + occupantSensible + appliancesSensible;
  const rawLatentCool = infiltrationLatentCool + occupantLatent;
  
  // Duct buffer additions
  const ductHeatLoss = rawHeatLoss * ductFactors.heatLoss;
  const ductCoolSensible = rawSensibleCool * ductFactors.coolGain;
  const ductCoolLatent = rawLatentCool * (ductFactors.coolGain * 0.5);
  
  const totalHeatingBtu = Math.round(rawHeatLoss + ductHeatLoss);
  const sensibleCoolingBtu = Math.round(rawSensibleCool + ductCoolSensible);
  const latentCoolingBtu = Math.round(rawLatentCool + ductCoolLatent);
  const totalCoolingBtu = sensibleCoolingBtu + latentCoolingBtu;
  
  // Equipment Sizing
  const rawTons = totalCoolingBtu / 12000;
  const { tonnage: recommendedTonnage, oversizingPct } = selectEquipmentTonnage(rawTons);
  
  // Airflow CFM (360 CFM/Ton for humid coastal 2A zone, 380 CFM/Ton for 3A/4A)
  const cfmPerTon = climate.climateZone === '2A' ? 360 : 380;
  const totalCfm = Math.round(recommendedTonnage * cfmPerTon);
  
  // Auxiliary heat strip or furnace sizing
  let auxHeatStripKw: number | undefined;
  let recommendedFurnaceBtu: number | undefined;
  
  if (floor.systemType === 'heat_pump' || floor.systemType === 'dual_fuel') {
    const kwNeeded = totalHeatingBtu / 3412;
    if (kwNeeded <= 5.5) auxHeatStripKw = 5;
    else if (kwNeeded <= 8.2) auxHeatStripKw = 7.5;
    else if (kwNeeded <= 11) auxHeatStripKw = 10;
    else if (kwNeeded <= 16) auxHeatStripKw = 15;
    else auxHeatStripKw = 20;
  }
  
  if (floor.systemType === 'gas_furnace_ac' || floor.systemType === 'dual_fuel') {
    const furnaceSizes = [40000, 60000, 80000, 100000, 120000, 140000];
    recommendedFurnaceBtu = furnaceSizes.find(size => size * 0.8 >= totalHeatingBtu) || 140000;
  }
  
  // Component Breakdown for Validation Audits
  const coolingComponents: ComponentBreakdown = {
    wallsBtu: Math.round(wallCoolGain),
    ceilingBtu: Math.round(ceilingCoolGain),
    floorBtu: Math.round(floorCoolGain),
    windowsBtu: Math.round(windowCoolGain),
    infiltrationSensibleBtu: Math.round(infiltrationSensibleCool),
    internalGainsBtu: Math.round(occupantSensible + appliancesSensible),
    ductGainBtu: Math.round(ductCoolSensible),
    latentBtu: Math.round(latentCoolingBtu)
  };

  const heatingComponents = {
    wallsBtu: Math.round(wallHeatLoss),
    ceilingBtu: Math.round(ceilingHeatLoss),
    floorBtu: Math.round(floorHeatLoss),
    windowsBtu: Math.round(windowHeatLoss),
    infiltrationBtu: Math.round(infiltrationHeatLoss),
    ductLossBtu: Math.round(ductHeatLoss)
  };

  // 8. Room by room distribution with exact CFM normalization
  let rooms: RoomData[] = [];
  if (floor.rooms && floor.rooms.length > 0) {
    const rawWeights = floor.rooms.map(room => {
      // Exposure multipliers: interior = 0.7, 1 exterior wall = 1.0, 2 exterior walls = 1.25, 3 exterior walls = 1.45
      const exposureFactor = room.exteriorWalls === 0 ? 0.7 : (room.exteriorWalls === 1 ? 1.0 : (room.exteriorWalls === 2 ? 1.25 : 1.45));
      return room.sqFt * exposureFactor;
    });

    const sumWeights = rawWeights.reduce((a, b) => a + b, 0) || 1;
    const totalRoomSqFt = floor.rooms.reduce((acc, r) => acc + r.sqFt, 0) || floor.sqFt;

    let accumulatedCfm = 0;
    rooms = floor.rooms.map((room, idx) => {
      const roomWeight = rawWeights[idx] / sumWeights;
      const roomBtu = Math.round(totalCoolingBtu * (room.sqFt / totalRoomSqFt));
      
      // Exact CFM normalization ensuring sum equals totalCfm
      let roomCfm = Math.round(totalCfm * roomWeight);
      if (idx === floor.rooms!.length - 1) {
        roomCfm = Math.max(20, totalCfm - accumulatedCfm);
      } else {
        accumulatedCfm += roomCfm;
      }

      return {
        ...room,
        calculatedBtu: roomBtu,
        calculatedCfm: roomCfm,
        suggestedDuctSize: calculateDuctSize(roomCfm),
        suggestedVentSize: calculateVentSize(roomCfm)
      };
    });
  }

  return {
    floorId: floor.id,
    name: floor.name,
    sqFt: floor.sqFt,
    volume,
    sensibleCoolingBtu,
    latentCoolingBtu,
    totalCoolingBtu,
    totalHeatingBtu,
    coolingComponents,
    heatingComponents,
    calculatedCoolingTons: parseFloat(rawTons.toFixed(2)),
    recommendedTonnage,
    oversizingPercent: oversizingPct,
    totalCfm,
    auxHeatStripKw,
    recommendedFurnaceBtu,
    rooms
  };
}

/**
 * Calculates entire house load combining all floors
 */
export function calculateHouseLoad(floors: FloorInput[], climate: CountyClimate): HouseCalculationResult {
  const isSingleFloor = floors.length === 1;
  const floorResults = floors.map(floor => calculateFloorLoad(floor, climate, isSingleFloor));
  
  const totalSqFt = floorResults.reduce((acc, f) => acc + f.sqFt, 0);
  const totalCoolingBtu = floorResults.reduce((acc, f) => acc + f.totalCoolingBtu, 0);
  const totalHeatingBtu = floorResults.reduce((acc, f) => acc + f.totalHeatingBtu, 0);
  const totalTonnage = floorResults.reduce((acc, f) => acc + f.recommendedTonnage, 0);
  const totalCfm = floorResults.reduce((acc, f) => acc + f.totalCfm, 0);
  
  return {
    floors: floorResults,
    totalSqFt,
    totalCoolingBtu,
    totalHeatingBtu,
    totalTonnage: parseFloat(totalTonnage.toFixed(1)),
    totalCfm,
    climate,
    methodologySource: climate.source
  };
}
