/**
 * Physics checks against independent reference values.
 * Expected numbers here come from outside this codebase (ASHRAE published station data,
 * unit definitions) or from hand calculations written out in the comments, never from
 * running the engine and copying its output.
 */
import { calculateHumidityGrains, indoorDesignGrains } from '../data/climateData';

let failures = 0;
function near(actual: number, expected: number, tolPct: number, desc: string) {
  const diffPct = Math.abs((actual - expected) / expected) * 100;
  if (diffPct > tolPct) {
    failures++;
    console.log(`FAIL: ${desc}: expected ${expected}, got ${actual.toFixed(3)} (${diffPct.toFixed(2)}% off, limit ${tolPct}%)`);
  } else {
    console.log(`PASS: ${desc}: ${actual.toFixed(3)} vs ${expected}`);
  }
}

console.log('=== PHYSICS CHECKS ===');

// 1. Air constants, from standard air properties (0.075 lb/ft3, cp 0.24, hfg ~1061 Btu/lb, 7000 gr/lb)
near(1.08, 0.075 * 0.24 * 60, 0.5, 'Sensible air constant 1.08 = 0.075 x 0.24 x 60');
near(0.68, (0.075 * 1061 * 60) / 7000, 0.5, 'Latent air constant 0.68 = 0.075 x 1061 x 60 / 7000');
near(3412, 3412.142, 0.01, '1 kW = 3412 Btu/h');
near(12000, (2000 * 144) / 24, 0, '1 ton = 12,000 Btu/h');

// 2. Psychrometrics vs ASHRAE 2021 published dehumidification design data.
// Each station lists a 1% dew point and the humidity ratio at that dew point (grains/lb)
// at the station's standard pressure. Saturated air at the dew point must reproduce it.
near(calculateHumidityGrains(74.4, 74.4, 14.48), 130.5, 0.5, 'Raleigh-Durham 1% DP 74.4F @ 14.48 psia -> ASHRAE 130.5 gr/lb');
near(calculateHumidityGrains(69.6, 69.6, 13.18), 121.7, 0.5, 'Boone 1% DP 69.6F @ 13.18 psia -> ASHRAE 121.7 gr/lb');
near(calculateHumidityGrains(77.5, 77.5, 14.67), 143.1, 0.5, 'Charleston Intl 1% DP 77.5F @ 14.67 psia -> ASHRAE 143.1 gr/lb');

// 3. Indoor design point: 75F / 50% RH at sea level. Saturation pressure at 75F is
// 0.4300 psia (steam tables), so W = 0.62198 x 0.2150 / (14.696 - 0.2150) x 7000 = 64.6 gr/lb.
near(indoorDesignGrains(14.696), 64.6, 0.5, 'Indoor 75F / 50% RH = 64.6 gr/lb at sea level');

// 4. Wet bulb below dry bulb must give less moisture than saturation at the same wet bulb.
const wbCheck = calculateHumidityGrains(92.6, 75.1, 14.48) < calculateHumidityGrains(75.1, 75.1, 14.48);
if (!wbCheck) { failures++; console.log('FAIL: unsaturated air holds less moisture than saturated air at the same WB'); }
else console.log('PASS: unsaturated air holds less moisture than saturated air at the same WB');

if (failures > 0) {
  console.log(`\n${failures} PHYSICS CHECK(S) FAILED`);
  process.exit(1);
}
console.log('\nAll physics checks passed.\n');
