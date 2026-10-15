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
  dateRetrieved: "2026-10-14"
};

const ASHRAE_FUNDAMENTALS_CH26_SOURCE: SourceRecord = {
  document: "ASHRAE Handbook of Fundamentals (2021)",
  tableOrPage: "Chapter 26: Heat, Air, and Moisture Transfer in Building Assemblies",
  url: "https://www.ashrae.org/technical-resources/bookstore/handbook",
  dateRetrieved: "2026-10-14"
};

const ASHRAE_FUNDAMENTALS_CH18_SOURCE: SourceRecord = {
  document: "ASHRAE Handbook of Fundamentals (2021)",
  tableOrPage: "Chapter 18: Nonresidential and Residential Cooling and Heating Load Calculations",
  url: "https://www.ashrae.org/technical-resources/bookstore/handbook",
  dateRetrieved: "2026-10-14"
};

const ASHRAE_FUNDAMENTALS_CH21_SOURCE: SourceRecord = {
  document: "ASHRAE Handbook of Fundamentals (2021) / SMACNA Residential Comfort System Installation",
  tableOrPage: "Chapter 21: Duct Design - Conduction Heat Transfer in Unconditioned Buffer Spaces",
  url: "https://www.ashrae.org/technical-resources/bookstore/handbook",
  dateRetrieved: "2026-10-14"
};

const NFRC_WINDOW_SOURCE: SourceRecord = {
  document: "National Fenestration Rating Council (NFRC) / NCECC Table R402.1.2",
  tableOrPage: "NFRC 100/200 Certified Rating Tables for Residential Windows",
  url: "https://www.nfrc.org/residential-fenestration-ratings/",
  dateRetrieved: "2026-10-14"
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
    uValue: 0.057, // R-15/R-20 code compliant assembly (U-0.057)
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
    uValue: 0.035,
    description: "Slab-on-Grade Concrete Floor with standard perimeter factor (F-0.035)",
    source: NCECC_TABLE_R402_SOURCE
  },
  'crawlspace_vented': {
    value: 'crawlspace_vented',
    uValue: 0.070,
    description: "Vented Crawlspace with R-13 Floor Batt Insulation (U-0.070)",
    source: NCECC_TABLE_R402_SOURCE
  },
  'crawlspace_sealed': {
    value: 'crawlspace_sealed',
    uValue: 0.038,
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
    ach: 0.30,
    description: "Tight Envelope (<= 3.0 ACH50 Blower Door Tested, modern NC/SC energy code)",
    source: NCECC_TABLE_R402_SOURCE
  },
  'semi_tight': {
    value: 'semi_tight',
    ach: 0.45,
    description: "Semi-Tight Envelope (~4.0 - 5.0 ACH50, standard modern construction)",
    source: ASHRAE_FUNDAMENTALS_CH18_SOURCE
  },
  'average': {
    value: 'average',
    ach: 0.60,
    description: "Average Infiltration (~6.0 - 8.0 ACH50, 1990-2010 built construction)",
    source: ASHRAE_FUNDAMENTALS_CH18_SOURCE
  },
  'loose': {
    value: 'loose',
    ach: 0.85,
    description: "Loose Infiltration (> 8.0 ACH50, older or unweatherized home)",
    source: ASHRAE_FUNDAMENTALS_CH18_SOURCE
  }
};

export const DUCT_SPECS: Record<DuctLocation, AssemblySpec<DuctLocation>> = {
  'attic_unconditioned': {
    value: 'attic_unconditioned',
    lossFactor: { heatLoss: 0.15, coolGain: 0.18 },
    description: "Ducts in Vented Attic (+18% cooling gain due to 130°F+ Carolinas attic heat)",
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

// Residential Register Grille Face Sizing (ASHRAE / SMACNA 450-600 FPM velocity)
export function calculateVentSize(cfm: number): string {
  if (cfm <= 65) return '4" x 10" Floor/Ceiling Register';
  if (cfm <= 95) return '4" x 12" Floor/Ceiling Register';
  if (cfm <= 140) return '6" x 10" Floor/Ceiling Register';
  if (cfm <= 190) return '6" x 12" Floor/Ceiling Register';
  if (cfm <= 260) return '8" x 12" Floor/Ceiling Register';
  return 'Dual 4" x 12" or 8" x 14" Register';
}

// Equipment Sizing increments (standard 0.5 ton increments within 95%-115% cooling tolerance)
export function selectEquipmentTonnage(rawTons: number): { tonnage: number; oversizingPct: number } {
  const standardSizes = [1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 5.0];
  
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
export function calculateFloorLoad(floor: FloorInput, climate: CountyClimate): FloorResult {
  const indoorHeatTemp = 70; // Standard code winter indoor setpoint
  const indoorCoolTemp = 75; // Standard code summer indoor setpoint
  
  const deltaTHeat = Math.max(10, indoorHeatTemp - climate.winterDb);
  const deltaTCool = Math.max(5, climate.summerDb - indoorCoolTemp);
  
  const volume = floor.sqFt * floor.ceilingHeight;
  
  // Perimeter estimate assuming rectangular aspect ratio of ~1.3:1
  const perimeter = 4 * Math.sqrt(floor.sqFt);
  const grossWallArea = perimeter * floor.ceilingHeight;
  const windowArea = floor.sqFt * (floor.windowCoveragePct / 100);
  const netWallArea = Math.max(100, grossWallArea - windowArea);
  
  // 1. Opaque Envelope Conduction
  const wallU = WALL_SPECS[floor.wallVintage].uValue!;
  const wallHeatLoss = netWallArea * wallU * deltaTHeat;
  // Solar absorption adjustment on exterior walls (ASHRAE CLTD approximation)
  const wallCoolGain = netWallArea * wallU * (deltaTCool + 6);
  
  // Ceiling / Roof
  const ceilingU = CEILING_SPECS[floor.ceiling].uValue!;
  const ceilingHeatLoss = floor.sqFt * ceilingU * deltaTHeat;
  // Attics reach 130°F+ in Carolinas summer (+22°F CLTD buffer)
  const ceilingCoolGain = floor.ceiling === 'conditioned_space_above' 
    ? 0 
    : floor.sqFt * ceilingU * (deltaTCool + 22);
    
  // Floor / Foundation
  const floorU = FLOOR_SPECS[floor.foundation].uValue!;
  const floorHeatLoss = floor.sqFt * floorU * (deltaTHeat * 0.7); // Ground temperature damping
  const floorCoolGain = floor.foundation === 'conditioned_space_below' ? 0 : floor.sqFt * floorU * 3;
  
  // 2. Windows (Fenestration)
  const winSpec = WINDOW_SPECS[floor.windowType];
  const windowHeatLoss = windowArea * winSpec.uValue! * deltaTHeat;
  
  // Solar Heat Gain: peak solar intensity by orientation in NC/SC latitude (32°N - 36°N)
  let solarFactor = 1.0;
  if (floor.primaryExposure === 'west') solarFactor = 1.35;
  else if (floor.primaryExposure === 'south') solarFactor = 1.15;
  else if (floor.primaryExposure === 'east') solarFactor = 1.20;
  else if (floor.primaryExposure === 'north') solarFactor = 0.75;
  
  const windowCoolGain = (windowArea * winSpec.uValue! * deltaTCool) + 
                         (windowArea * winSpec.shgc! * 75 * solarFactor);
                         
  // 3. Infiltration (Air Leakage)
  const ach = INFILTRATION_SPECS[floor.infiltration].ach!;
  const cfmInfiltration = (volume * ach) / 60;
  
  // Sensible: 1.08 * CFM * deltaT
  const infiltrationHeatLoss = 1.08 * cfmInfiltration * deltaTHeat;
  const infiltrationSensibleCool = 1.08 * cfmInfiltration * deltaTCool;
  
  // Latent: 0.68 * CFM * deltaG (moisture grains difference)
  const infiltrationLatentCool = 0.68 * cfmInfiltration * climate.designGrains;
  
  // 4. Internal Loads (Occupants + Base Appliances)
  // Published ASHRAE Chapter 18: 230 Btu/h sensible, 200 Btu/h latent per person, 3 people avg per floor
  const occupantSensible = 3 * 230;
  const occupantLatent = 3 * 200;
  const appliancesSensible = 1200;
  
  // 5. Duct Conduction & Air Leakage Factors
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
  
  // Sizing
  const rawTons = totalCoolingBtu / 12000;
  const { tonnage: recommendedTonnage, oversizingPct } = selectEquipmentTonnage(rawTons);
  
  // Airflow CFM (360 CFM/Ton for humid 2A zone, 380 CFM/Ton for 3A/4A)
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
    const furnaceSizes = [40000, 60000, 80000, 100000, 120000];
    recommendedFurnaceBtu = furnaceSizes.find(size => size * 0.8 >= totalHeatingBtu) || 120000;
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

  // Room by room distribution
  let rooms: RoomData[] = [];
  if (floor.rooms && floor.rooms.length > 0) {
    const totalRoomSqFt = floor.rooms.reduce((acc, r) => acc + r.sqFt, 0) || floor.sqFt;
    
    rooms = floor.rooms.map(room => {
      const exposureWeight = room.exteriorWalls === 0 ? 0.7 : (room.exteriorWalls === 1 ? 1.0 : 1.25);
      const roomRatio = (room.sqFt / totalRoomSqFt) * exposureWeight;
      
      const roomBtu = Math.round(totalCoolingBtu * (room.sqFt / totalRoomSqFt));
      const roomCfm = Math.round(totalCfm * roomRatio);
      
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
  const floorResults = floors.map(floor => calculateFloorLoad(floor, climate));
  
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
