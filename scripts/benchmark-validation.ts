import { getCountyClimate } from '../src/data/climateData';
import { calculateHouseLoad, FloorInput } from '../src/engine/loadCalculation';

console.log('================================================================');
console.log('     CAROLINA AIRLOAD PRO - COMPONENT BENCHMARK VALIDATION      ');
console.log('   (Generated for Cross-Comparison against Reference Tools)     ');
console.log('================================================================\n');

// HOUSE 1: 1-Story Ranch in Raleigh, NC (Wake County)
const house1Climate = getCountyClimate('NC', 'Wake');
const house1Floors: FloorInput[] = [{
  id: 'h1-f1',
  name: 'Single Level Ranch',
  sqFt: 1800,
  ceilingHeight: 8,
  foundation: 'crawlspace_vented',
  ceiling: 'attic_vented_r30',
  wallVintage: '2000_2015_r13',
  windowType: 'double_clear',
  windowCoveragePct: 12,
  primaryExposure: 'balanced',
  infiltration: 'average',
  ductLocation: 'crawlspace',
  systemType: 'heat_pump'
}];
const h1Result = calculateHouseLoad(house1Floors, house1Climate);

console.log('----------------------------------------------------------------');
console.log(`HOUSE 1: 1,800 sq ft Ranch in Raleigh, NC (Wake County)`);
console.log(`Design Conditions: Summer ${house1Climate.summerDb}°F / ${house1Climate.summerWb}°F | Winter ${house1Climate.winterDb}°F`);
console.log(`TOTAL COOLING: ${h1Result.totalCoolingBtu.toLocaleString()} BTU/h | SIZED: ${h1Result.totalTonnage} TONS (${h1Result.totalCfm} CFM)`);
console.log(`TOTAL HEATING: ${h1Result.totalHeatingBtu.toLocaleString()} BTU/h | AUX STRIP: ${h1Result.floors[0].auxHeatStripKw} kW`);
console.log('Component Breakdown (Cooling BTU/h):');
console.table({
  'Walls Conduction': h1Result.floors[0].coolingComponents.wallsBtu,
  'Ceiling / Attic': h1Result.floors[0].coolingComponents.ceilingBtu,
  'Floor / Crawl': h1Result.floors[0].coolingComponents.floorBtu,
  'Glass Conduction & Solar': h1Result.floors[0].coolingComponents.windowsBtu,
  'Infiltration Sensible': h1Result.floors[0].coolingComponents.infiltrationSensibleBtu,
  'Internal Gains (People/Appliances)': h1Result.floors[0].coolingComponents.internalGainsBtu,
  'Duct Gain (Crawlspace)': h1Result.floors[0].coolingComponents.ductGainBtu,
  'Latent Moisture Load': h1Result.floors[0].coolingComponents.latentBtu
});

// HOUSE 2: 2-Story in Charlotte, NC (Mecklenburg County)
const house2Climate = getCountyClimate('NC', 'Mecklenburg');
const house2Floors: FloorInput[] = [
  {
    id: 'h2-f1',
    name: 'Main Level',
    sqFt: 1400,
    ceilingHeight: 9,
    foundation: 'slab',
    ceiling: 'conditioned_space_above',
    wallVintage: 'modern_code_r15_r20',
    windowType: 'double_low_e',
    windowCoveragePct: 12,
    primaryExposure: 'south',
    infiltration: 'tight',
    ductLocation: 'conditioned_space',
    systemType: 'heat_pump'
  },
  {
    id: 'h2-f2',
    name: 'Upper Level',
    sqFt: 1200,
    ceilingHeight: 8,
    foundation: 'conditioned_space_below',
    ceiling: 'attic_vented_r38',
    wallVintage: 'modern_code_r15_r20',
    windowType: 'double_low_e',
    windowCoveragePct: 12,
    primaryExposure: 'south',
    infiltration: 'tight',
    ductLocation: 'attic_unconditioned',
    systemType: 'heat_pump'
  }
];
const h2Result = calculateHouseLoad(house2Floors, house2Climate);

console.log('\n----------------------------------------------------------------');
console.log(`HOUSE 2: 2,600 sq ft 2-Story Modern in Charlotte, NC (Mecklenburg County)`);
console.log(`Design Conditions: Summer ${house2Climate.summerDb}°F / ${house2Climate.summerWb}°F | Winter ${house2Climate.winterDb}°F`);
console.log(`TOTAL COOLING: ${h2Result.totalCoolingBtu.toLocaleString()} BTU/h | SIZED: ${h2Result.totalTonnage} TONS (${h2Result.totalCfm} CFM)`);
console.log(`  - Main Level: ${h2Result.floors[0].totalCoolingBtu.toLocaleString()} BTU/h -> ${h2Result.floors[0].recommendedTonnage} Tons (${h2Result.floors[0].totalCfm} CFM)`);
console.log(`  - Upper Level: ${h2Result.floors[1].totalCoolingBtu.toLocaleString()} BTU/h -> ${h2Result.floors[1].recommendedTonnage} Tons (${h2Result.floors[1].totalCfm} CFM)`);
console.log('Upper Level Component Breakdown (Cooling BTU/h):');
console.table({
  'Walls Conduction': h2Result.floors[1].coolingComponents.wallsBtu,
  'Ceiling / Attic': h2Result.floors[1].coolingComponents.ceilingBtu,
  'Floor': h2Result.floors[1].coolingComponents.floorBtu,
  'Glass & Solar': h2Result.floors[1].coolingComponents.windowsBtu,
  'Infiltration Sensible': h2Result.floors[1].coolingComponents.infiltrationSensibleBtu,
  'Internal Gains': h2Result.floors[1].coolingComponents.internalGainsBtu,
  'Duct Gain (Vented Attic)': h2Result.floors[1].coolingComponents.ductGainBtu,
  'Latent Moisture': h2Result.floors[1].coolingComponents.latentBtu
});

// HOUSE 3: Coastal Home in Charleston, SC (Charleston County)
const house3Climate = getCountyClimate('SC', 'Charleston');
const house3Floors: FloorInput[] = [{
  id: 'h3-f1',
  name: 'Lowcountry Single Story',
  sqFt: 2100,
  ceilingHeight: 9,
  foundation: 'crawlspace_vented',
  ceiling: 'attic_vented_r30',
  wallVintage: '1980_2000_r11',
  windowType: 'double_clear',
  windowCoveragePct: 15,
  primaryExposure: 'west',
  infiltration: 'average',
  ductLocation: 'crawlspace',
  systemType: 'heat_pump'
}];
const h3Result = calculateHouseLoad(house3Floors, house3Climate);

console.log('\n----------------------------------------------------------------');
console.log(`HOUSE 3: 2,100 sq ft Coastal Home in Charleston, SC (Charleston County)`);
console.log(`Design Conditions: Summer ${house3Climate.summerDb}°F / ${house3Climate.summerWb}°F | Winter ${house3Climate.winterDb}°F | Grains: ${house3Climate.designGrains} gr/lb`);
console.log(`TOTAL COOLING: ${h3Result.totalCoolingBtu.toLocaleString()} BTU/h | SIZED: ${h3Result.totalTonnage} TONS (${h3Result.totalCfm} CFM)`);
console.log(`  - High Latent Moisture Portion: ${h3Result.floors[0].latentCoolingBtu.toLocaleString()} BTU/h (${Math.round((h3Result.floors[0].latentCoolingBtu / h3Result.floors[0].totalCoolingBtu) * 100)}% of total load)`);

// HOUSE 4: Mountain Home in Boone / Watauga County, NC
const house4Climate = getCountyClimate('NC', 'Watauga');
const house4Floors: FloorInput[] = [{
  id: 'h4-f1',
  name: 'High Country Home',
  sqFt: 1600,
  ceilingHeight: 9,
  foundation: 'basement_unconditioned',
  ceiling: 'attic_vented_r38',
  wallVintage: '2000_2015_r13',
  windowType: 'double_low_e',
  windowCoveragePct: 12,
  primaryExposure: 'south',
  infiltration: 'semi_tight',
  ductLocation: 'crawlspace',
  systemType: 'heat_pump'
}];
const h4Result = calculateHouseLoad(house4Floors, house4Climate);

console.log('\n----------------------------------------------------------------');
console.log(`HOUSE 4: 1,600 sq ft Mountain Home in Boone, NC (Watauga County)`);
console.log(`Design Conditions: Summer ${house4Climate.summerDb}°F | Winter ${house4Climate.winterDb}°F (Cold Mountain Climate)`);
console.log(`HEATING DOMINANT: ${h4Result.totalHeatingBtu.toLocaleString()} BTU/h Heating vs ${h4Result.totalCoolingBtu.toLocaleString()} BTU/h Cooling`);
console.log(`SIZED: ${h4Result.totalTonnage} TONS | AUX STRIP REQUIRED: ${h4Result.floors[0].auxHeatStripKw} kW`);
console.log('================================================================\n');
