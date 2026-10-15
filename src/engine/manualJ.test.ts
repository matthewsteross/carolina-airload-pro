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

// 2. Test specific county conditions
const meck = getCountyClimate('NC', 'Mecklenburg');
assert(meck.summerDb === 92 && meck.winterDb === 22, `Mecklenburg (Charlotte) climate is 92°F / 22°F`);

const chas = getCountyClimate('SC', 'Charleston');
assert(chas.summerDb === 91 && chas.designGrains === 52, `Charleston SC has 91°F summer DB and 52 gr/lb latent design difference`);

const boone = getCountyClimate('NC', 'Watauga');
assert(boone.summerDb === 82 && boone.winterDb === 9, `Watauga (Boone NC) has 82°F summer and 9°F winter`);

console.log('\n--- Testing Manual S Equipment Selection ---');
const size1 = selectManualSTonnage(2.1);
assert(size1.tonnage === 2.5, `Raw 2.1 Tons selects 2.5 Ton unit (got ${size1.tonnage})`);

const size2 = selectManualSTonnage(3.0);
assert(size2.tonnage === 3.0, `Raw 3.0 Tons selects 3.0 Ton unit`);

const size3 = selectManualSTonnage(3.45);
assert(size3.tonnage === 3.5, `Raw 3.45 Tons selects 3.5 Ton unit`);

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

// Floor 1 check
const f1Result = charlotteResult.floors[0];
console.log(`Floor 1: ${f1Result.totalCoolingBtu} BTU/h cooling -> ${f1Result.recommendedTonnage} Tons, ${f1Result.totalCfm} CFM, Aux Strip: ${f1Result.auxHeatStripKw} kW`);
assert(f1Result.recommendedTonnage >= 1.5 && f1Result.recommendedTonnage <= 2.5, `Floor 1 (1500 sqft intermediate level) sized reasonably (1.5 - 2.5 Tons)`);
assert(f1Result.auxHeatStripKw !== undefined && f1Result.auxHeatStripKw >= 5, `Floor 1 has aux heat strip calculated`);

// Floor 2 check (attic load makes 2nd floor cooling higher relative to size)
const f2Result = charlotteResult.floors[1];
console.log(`Floor 2: ${f2Result.totalCoolingBtu} BTU/h cooling -> ${f2Result.recommendedTonnage} Tons, ${f2Result.totalCfm} CFM`);
assert(f2Result.recommendedTonnage >= 1.5 && f2Result.recommendedTonnage <= 2.5, `Floor 2 (1200 sqft upper level) sized reasonably (1.5 - 2.5 Tons)`);

console.log(`Total House (Modern Low-E Code): ${charlotteResult.totalTonnage} Tons across both systems`);
assert(charlotteResult.totalTonnage >= 3.0 && charlotteResult.totalTonnage <= 4.5, `Total 2,700 sqft 2-story modern house in Charlotte sizes around 3.0 - 4.0 Tons`);

// Room CFM check
assert(f1Result.rooms.length === 2, `Rooms calculated for floor 1`);
assert((f1Result.rooms[0].calculatedCfm || 0) > 0, `Master bed has CFM assigned`);
assert((f1Result.rooms[1].calculatedCfm || 0) > (f1Result.rooms[0].calculatedCfm || 0), `Living room has more CFM than master bedroom`);

// Test older 1990s vintage home with clear glass
const vintageFloors: FloorInput[] = [
  {
    ...testFloors[0],
    wallVintage: '1980_2000_r11',
    windowType: 'double_clear',
    ceiling: 'conditioned_space_above',
    infiltration: 'average'
  },
  {
    ...testFloors[1],
    wallVintage: '1980_2000_r11',
    windowType: 'double_clear',
    ceiling: 'attic_vented_r30',
    infiltration: 'average'
  }
];

const vintageResult = calculateHouseLoad(vintageFloors, meck);
console.log(`Vintage 1990s House: ${vintageResult.totalCoolingBtu} BTU/h cooling -> ${vintageResult.totalTonnage} Tons (F1: ${vintageResult.floors[0].recommendedTonnage}T, F2: ${vintageResult.floors[1].recommendedTonnage}T)`);
assert(vintageResult.totalTonnage >= 3.5 && vintageResult.totalTonnage <= 5.0, `1990s house with clear glass sizes higher (3.5 - 5.0 Tons)`);

console.log('\nALL UNIT TESTS PASSED!');
