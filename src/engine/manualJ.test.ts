import { getCountyClimate, NC_COUNTIES, SC_COUNTIES } from '../data/climateData';
import { 
  calculateHouseLoad, 
  FloorInput, 
  selectManualSTonnage, 
  calculateDuctSize, 
  calculateVentSize 
} from './manualJ';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

console.log('--- Testing Climate Data Lookups ---');

// 1. Verify County counts
assert(Object.keys(NC_COUNTIES).length === 100, `NC should have 100 counties (found ${Object.keys(NC_COUNTIES).length})`);
assert(Object.keys(SC_COUNTIES).length === 46, `SC should have 46 counties (found ${Object.keys(SC_COUNTIES).length})`);

// 2. Spot-check counties against ASHRAE 2021 station values (read from the ASHRAE
//    climatic design tool, not copied from this app's output)
const meck = getCountyClimate('NC', 'Mecklenburg');
assert(meck.stationData.wmo === '723140' && meck.winterDb === 24.8 && meck.summerDb === 91.9 && meck.summerWb === 74.0,
  `Mecklenburg -> Charlotte Douglas (723140): 99% 24.8F, 1% 91.9F / 74.0F`);

const wake = getCountyClimate('NC', 'Wake');
assert(wake.stationData.wmo === '723060' && wake.winterDb === 23.6 && wake.summerDb === 92.6 && wake.summerWb === 75.1,
  `Wake -> Raleigh-Durham (723060): 99% 23.6F, 1% 92.6F / 75.1F`);

const chas = getCountyClimate('SC', 'Charleston');
assert(chas.stationData.wmo === '722080' && chas.winterDb === 30.6 && chas.summerDb === 92.3 && chas.summerWb === 77.4,
  `Charleston -> Charleston Intl (722080): 99% 30.6F, 1% 92.3F / 77.4F`);

const boone = getCountyClimate('NC', 'Watauga');
assert(boone.stationData.wmo === '722198' && boone.winterDb === 15.1 && boone.summerDb === 81.9,
  `Watauga -> Boone (722198): 99% 15.1F, 1% 81.9F`);

console.log('\n--- Testing Manual S Equipment Selection (Closest Standard Size) ---');
const size1 = selectManualSTonnage(2.1);
assert(size1.tonnage === 2.0, `Raw 2.1 Tons selects closest 2.0 Ton unit (got ${size1.tonnage})`);

const size1b = selectManualSTonnage(2.35);
assert(size1b.tonnage === 2.5, `Raw 2.35 Tons selects closest 2.5 Ton unit (got ${size1b.tonnage})`);

const size2 = selectManualSTonnage(3.0);
assert(size2.tonnage === 3.0, `Raw 3.0 Tons selects 3.0 Ton unit`);

const size3 = selectManualSTonnage(3.45);
assert(size3.tonnage === 3.5, `Raw 3.45 Tons selects closest 3.5 Ton unit`);

const size4 = selectManualSTonnage(4.06);
assert(size4.tonnage === 4.0, `Raw 4.06 Tons selects closest 4.0 Ton unit without unnecessary oversizing (got ${size4.tonnage})`);

console.log('\n--- Testing Manual D Airflow & Duct Sizing ---');
assert(calculateDuctSize(75) === '6" Round Flex', `75 CFM sizes to 6" Round Flex`);
assert(calculateDuctSize(180) === '8" Round Flex', `180 CFM sizes to 8" Round Flex`);
assert(calculateDuctSize(320) === '10" Round Flex', `320 CFM sizes to 10" Round Flex`);

assert(calculateVentSize(80) === '4" x 12" Floor/Ceiling Register', `80 CFM sizes to 4" x 12" register`);
assert(calculateVentSize(150) === '6" x 10" Floor/Ceiling Register', `150 CFM sizes to 6" x 10" register`);
assert(calculateVentSize(180) === '6" x 12" Floor/Ceiling Register', `180 CFM sizes to 6" x 12" register`);

console.log('\n--- Testing Full House Load Calculation ---');
const testFloors: FloorInput[] = [
  {
    id: 'f1',
    name: 'Main Level',
    sqFt: 1500,
    ceilingHeight: 9,
    foundation: 'crawlspace_vented',
    ceiling: 'conditioned_space_above',
    wallVintage: '2000_2015_r13',
    windowType: 'double_low_e',
    windowCoveragePct: 12,
    primaryExposure: 'balanced',
    infiltration: 'semi_tight',
    ductLocation: 'crawlspace',
    systemType: 'heat_pump',
    rooms: [
      { id: 'r1', name: 'Master Bed', sqFt: 250, exteriorWalls: 2 },
      { id: 'r2', name: 'Living Room', sqFt: 400, exteriorWalls: 2 }
    ]
  },
  {
    id: 'f2',
    name: 'Upper Level',
    sqFt: 1200,
    ceilingHeight: 8,
    foundation: 'conditioned_space_below',
    ceiling: 'attic_vented_r38',
    wallVintage: '2000_2015_r13',
    windowType: 'double_low_e',
    windowCoveragePct: 12,
    primaryExposure: 'balanced',
    infiltration: 'semi_tight',
    ductLocation: 'attic_unconditioned',
    systemType: 'heat_pump'
  }
];

const charlotteResult = calculateHouseLoad(testFloors, meck);
assert(charlotteResult.totalSqFt === 2700, `Total sq ft is 2,700`);
assert(charlotteResult.floors.length === 2, `2 floor results generated`);

// Bookkeeping invariants: every displayed number must tie out
for (const f of charlotteResult.floors) {
  const c = f.coolingComponents;
  const rawSensible = c.wallsBtu + c.ceilingBtu + c.floorBtu + c.windowsBtu + c.infiltrationSensibleBtu + c.internalGainsBtu;
  assert(Math.abs(rawSensible + c.ductGainBtu - f.sensibleCoolingBtu) <= 3, `${f.name}: cooling components sum to sensible load`);
  assert(f.totalCoolingBtu === f.sensibleCoolingBtu + f.latentCoolingBtu, `${f.name}: total = sensible + latent`);
  const h = f.heatingComponents;
  assert(Math.abs(h.wallsBtu + h.ceilingBtu + h.floorBtu + h.windowsBtu + h.infiltrationBtu + h.ductLossBtu - f.totalHeatingBtu) <= 3, `${f.name}: heating components sum to total`);
  assert(Math.abs(f.calculatedCoolingTons - f.totalCoolingBtu / 12000) < 0.006, `${f.name}: tons = BTU / 12,000`);
  assert(f.loadCfm === Math.round((f.totalCoolingBtu / 12000) * 380), `${f.name}: load airflow = calculated tons x 380 CFM/ton (inland)`);
  assert(f.totalCfm === Math.round(f.equipmentTons * 380), `${f.name}: duct airflow = installed unit tons x 380 CFM/ton`);
}
assert(Math.abs(charlotteResult.totalCalculatedTons - charlotteResult.totalCoolingBtu / 12000) < 0.011, `House tons needed = house BTU / 12,000`);
assert(charlotteResult.totalCfm === charlotteResult.floors.reduce((a, f) => a + f.totalCfm, 0), `House CFM = sum of floors`);

const f1Result = charlotteResult.floors[0];
assert(f1Result.rooms.length === 2, `Rooms calculated for floor 1`);
assert(f1Result.rooms.reduce((a, r) => a + (r.calculatedCfm || 0), 0) === f1Result.totalCfm, `Room CFMs sum exactly to floor CFM`);
assert((f1Result.rooms[1].calculatedCfm || 0) > (f1Result.rooms[0].calculatedCfm || 0), `Living room (400 sf) gets more CFM than master (250 sf)`);

// Direction checks: changing one input must move the load the right way
const vintageFloors: FloorInput[] = testFloors.map(f => ({ ...f, wallVintage: '1980_2000_r11', windowType: 'double_clear', infiltration: 'average' }));
const vintageResult = calculateHouseLoad(vintageFloors, meck);
assert(vintageResult.totalCoolingBtu > charlotteResult.totalCoolingBtu && vintageResult.totalHeatingBtu > charlotteResult.totalHeatingBtu,
  `Older envelope (R-11, clear glass, leakier) raises both loads`);
const westFloors: FloorInput[] = testFloors.map(f => ({ ...f, primaryExposure: 'west' }));
const northFloors: FloorInput[] = testFloors.map(f => ({ ...f, primaryExposure: 'north' }));
assert(calculateHouseLoad(westFloors, meck).totalCoolingBtu > calculateHouseLoad(northFloors, meck).totalCoolingBtu, `West-facing glass gains more than north-facing`);
assert(calculateHouseLoad(testFloors, boone).totalHeatingBtu > charlotteResult.totalHeatingBtu, `Same house loses more heat in Boone than Charlotte`);

console.log('\n--- Hand Calculation: House 1 (1,800 sf ranch, Wake County) ---');
// Worked by hand, step by step, from the published inputs:
//   Climate (ASHRAE 2021, RDU): 99% 23.6F, 1% 92.6F, design grains 38, station pressure 14.48 psia
//   dT heat = 70 - 23.6 = 46.4F; dT cool = 92.6 - 75 = 17.6F; altitude factor = 14.48 / 14.696 = 0.98530
//   Perimeter = 4 x sqrt(1800) = 169.71 ft; gross wall = 169.71 x 8 = 1357.6 sf; glass = 12% x 1800 = 216 sf
//   Net wall = 1141.6 sf; infiltration = 1800 x 8 x 0.60 / 60 = 144 CFM
//   Heating:  walls 1141.6 x 0.084 x 46.4 = 4,450   ceiling 1800 x 0.035 x 46.4 = 2,923
//             floor 1800 x 0.064 x 46.4 = 5,345     glass 216 x 0.50 x 46.4 = 5,011
//             infiltration 1.08 x 0.98530 x 144 x 46.4 = 7,110
//             subtotal 24,839 x 1.10 (crawlspace ducts) = 27,323 Btu/h
//   Cooling sensible: walls 1141.6 x 0.084 x (17.6 + 6) = 2,263   ceiling 1800 x 0.035 x (17.6 + 35) = 3,314
//             floor 1800 x 0.064 x 3 = 346   glass 216 x 0.50 x 17.6 + 216 x 0.70 x 75 x 1.0 = 13,241
//             infiltration 1.08 x 0.98530 x 144 x 17.6 = 2,697   people 3 x 230 + appliances 1,200 = 1,890
//             subtotal 23,750 x 1.10 = 26,125 Btu/h
//   Cooling latent: 0.68 x 0.98530 x 144 x 38 + 3 x 200 = 4,266 x 1.05 = 4,480 Btu/h
//   Total cooling 30,605 Btu/h = 2.55 tons; airflow 2.5504 x 380 = 969 CFM
const house1 = calculateHouseLoad([{
  id: 'h1', name: 'Main Level', sqFt: 1800, ceilingHeight: 8,
  foundation: 'crawlspace_vented', ceiling: 'attic_vented_r30', wallVintage: '2000_2015_r13',
  windowType: 'double_clear', windowCoveragePct: 12, primaryExposure: 'balanced',
  infiltration: 'average', ductLocation: 'crawlspace', systemType: 'heat_pump'
}], wake).floors[0];
const within = (a: number, b: number, tol = 2) => Math.abs(a - b) <= tol;
assert(within(house1.totalHeatingBtu, 27323), `Heating 27,323 Btu/h (got ${house1.totalHeatingBtu})`);
assert(within(house1.sensibleCoolingBtu, 26125), `Sensible cooling 26,125 Btu/h (got ${house1.sensibleCoolingBtu})`);
assert(within(house1.latentCoolingBtu, 4480), `Latent cooling 4,480 Btu/h (got ${house1.latentCoolingBtu})`);
assert(within(house1.totalCoolingBtu, 30605, 3), `Total cooling 30,605 Btu/h (got ${house1.totalCoolingBtu})`);
assert(within(house1.loadCfm, 969, 1), `Load airflow 969 CFM (got ${house1.loadCfm})`);
assert(house1.equipmentTons === 2.5 && house1.totalCfm === 950, `Nearest unit 2.5 T -> 950 CFM through the ducts (got ${house1.equipmentTons} T, ${house1.totalCfm} CFM)`);

// Field override: installing a 3-ton unit re-sizes the duct airflow, not the load
const house1With3Ton = calculateHouseLoad([{
  id: 'h1', name: 'Main Level', sqFt: 1800, ceilingHeight: 8,
  foundation: 'crawlspace_vented', ceiling: 'attic_vented_r30', wallVintage: '2000_2015_r13',
  windowType: 'double_clear', windowCoveragePct: 12, primaryExposure: 'balanced',
  infiltration: 'average', ductLocation: 'crawlspace', systemType: 'heat_pump', installedTons: 3.0
}], wake).floors[0];
assert(house1With3Ton.totalCoolingBtu === house1.totalCoolingBtu && house1With3Ton.totalCfm === 1140 && house1With3Ton.oversizingPercent === 18,
  `3.0 T override: same load, 1,140 CFM duct airflow, 18% over load (got ${house1With3Ton.totalCfm} CFM, ${house1With3Ton.oversizingPercent}%)`);
// Strip rule: nearest common strip size within ~10% of the full design loss (5.5 / 8.2 / 11 / 16 kW breakpoints).
// 27,323 / 3,412 = 8.0 kW, which is under the 8.2 kW breakpoint -> 7.5 kW strip (94% of design loss).
assert(house1.auxHeatStripKw === 7.5, `27,323 Btu/h = 8.0 kW -> 7.5 kW strip under the 8.2 kW breakpoint (got ${house1.auxHeatStripKw})`);

console.log('\nALL UNIT TESTS PASSED!');
