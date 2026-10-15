/**
 * Data provenance checks.
 * - Climate records must be retrieved ASHRAE 2021 station data: a real WMO id, record
 *   period, plausible Carolinas values, and a station reasonably close to the county.
 * - Assembly values must say honestly whether they were retrieved or are typical values.
 */
import { NC_COUNTIES, SC_COUNTIES, SourceRecord } from '../data/climateData';
import {
  WALL_SPECS,
  CEILING_SPECS,
  FLOOR_SPECS,
  WINDOW_SPECS,
  INFILTRATION_SPECS,
  DUCT_SPECS
} from './loadCalculation';

let failures = 0;
function check(ok: boolean, msg: string) {
  if (!ok) { failures++; console.log(`FAIL: ${msg}`); }
}

function checkSource(name: string, source: SourceRecord | undefined) {
  check(!!source, `${name}: no source record`);
  if (!source) return;
  check(source.document.trim().length > 5, `${name}: empty document`);
  check(/table|chapter|section|station|ratings/i.test(source.tableOrPage), `${name}: tableOrPage must name a table, chapter, section or station`);
  check(source.url.startsWith('https://'), `${name}: url must be https`);
  check(source.basis === 'retrieved' || source.basis === 'typical', `${name}: basis must be 'retrieved' or 'typical'`);
  if (source.basis === 'retrieved') {
    check(/^\d{4}-\d{2}-\d{2}$/.test(source.dateRetrieved ?? ''), `${name}: retrieved data needs an ISO dateRetrieved`);
  } else {
    check(source.dateRetrieved === undefined, `${name}: typical values must not claim a retrieval date`);
  }
}

console.log('=== DATA PROVENANCE CHECKS ===');

const counties = [
  ...Object.entries(NC_COUNTIES).map(([c, d]) => ['NC', c, d] as const),
  ...Object.entries(SC_COUNTIES).map(([c, d]) => ['SC', c, d] as const)
];
check(Object.keys(NC_COUNTIES).length === 100, `NC must have 100 counties (found ${Object.keys(NC_COUNTIES).length})`);
check(Object.keys(SC_COUNTIES).length === 46, `SC must have 46 counties (found ${Object.keys(SC_COUNTIES).length})`);

for (const [state, county, d] of counties) {
  const name = `${state} ${county}`;
  checkSource(name, d.source);
  check(d.source.basis === 'retrieved', `${name}: climate data must be retrieved station data`);
  check(/^\d{6}$/.test(d.stationData.wmo), `${name}: station needs a 6-digit WMO id`);
  check(d.source.tableOrPage.includes(d.stationData.wmo), `${name}: citation must name the station WMO id`);
  check(/^\d{4}-\d{4}$/.test(d.stationData.recordPeriod), `${name}: station needs a record period`);
  check(d.stationDistanceMi <= 45, `${name}: station is ${d.stationDistanceMi} mi away (limit 45)`);
  // Plausibility bounds for the Carolinas (catches unit or column mix-ups)
  check(d.winterDb >= 0 && d.winterDb <= 40, `${name}: winter design ${d.winterDb}F out of range`);
  check(d.summerDb >= 78 && d.summerDb <= 100, `${name}: summer design ${d.summerDb}F out of range`);
  check(d.summerWb < d.summerDb && d.summerWb >= 62, `${name}: wet bulb ${d.summerWb}F inconsistent`);
  check(d.stationData.winterDb996 <= d.winterDb, `${name}: 99.6% value must be colder than 99%`);
  check(d.designGrains >= 0 && d.designGrains <= 80, `${name}: design grains ${d.designGrains} out of range`);
}
console.log(`Checked ${counties.length} county climate records`);

const assemblies: [string, Record<string, { source: SourceRecord }>][] = [
  ['Wall', WALL_SPECS], ['Ceiling', CEILING_SPECS], ['Floor', FLOOR_SPECS],
  ['Window', WINDOW_SPECS], ['Infiltration', INFILTRATION_SPECS], ['Duct', DUCT_SPECS]
];
let assemblyCount = 0;
for (const [kind, specs] of assemblies) {
  for (const [key, spec] of Object.entries(specs)) {
    checkSource(`${kind} ${key}`, spec.source);
    assemblyCount++;
  }
}
const typical = assemblies.flatMap(([, s]) => Object.values(s)).filter(s => s.source.basis === 'typical').length;
console.log(`Checked ${assemblyCount} assembly records (${typical} marked as typical values)`);

if (failures > 0) {
  console.log(`\n${failures} PROVENANCE CHECK(S) FAILED`);
  process.exit(1);
}
console.log('\nAll provenance checks passed.\n');
