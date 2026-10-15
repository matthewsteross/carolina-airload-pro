"""Generate src/data/climateData.ts from the county -> ASHRAE station map.

Usage (from the repo root):
  python scripts/climate/gen_climate_ts.py scripts/climate src/data/climateData.ts

Reads county_station_map.json (built by build_climate.py) and county_climate_zones.json
(IECC zone display labels carried over from the original app; not used in calculations).
"""
import json, os, sys

base, out_path = sys.argv[1], sys.argv[2]
rows = json.load(open(os.path.join(base, 'county_station_map.json')))
zones = json.load(open(os.path.join(base, 'county_climate_zones.json')))

def daily_range(r):
    # ACCA / ASHRAE convention: Low < 16 F, Medium 16-25 F, High > 25 F
    return 'L' if r < 16 else ('M' if r <= 25 else 'H')

def period_full(p):
    a, b = (int(x) for x in p.split('-'))
    a += 1900 if a > 50 else 2000
    b += 1900 if b > 50 else 2000
    return f'{a}-{b}'

def title_place(place):
    name, st = place.rsplit(', ', 1)
    return f'{name.title()}, {st}'

stations = {}
for r in rows:
    s = r['station']
    stations[s['wmo']] = s

def station_const(wmo):
    return f'S_{wmo}'

lines = []
w = lines.append
w("""// GENERATED FILE - do not hand-edit design values.
// Source: ASHRAE Handbook - Fundamentals (2021), Chapter 14 climatic design data,
// retrieved per station from the ASHRAE Climatic Design Conditions tool
// (https://ashrae-meteo.info/v3.0/, ashrae_version=2021, IP units) on 2026-10-15.
// County to station mapping: US Census 2023 Gazetteer county internal point, nearest
// station with >= 15 years of record (shorter record allowed only when no long-record
// station is within 40 km), with a distance penalty for elevation mismatch beyond 500 ft
// (county elevation = median of 5 USGS 3DEP point samples). Regenerate with
// scripts/climate/ (see README there) rather than editing numbers by hand.

export interface SourceRecord {
  document: string;
  tableOrPage: string;
  url: string;
  // 'retrieved': the number itself was pulled from the cited source on dateRetrieved.
  // 'typical': a representative engineering value consistent with the cited reference,
  // not looked up row-by-row. Shown as such in the app and on the PDF.
  basis: 'retrieved' | 'typical';
  dateRetrieved?: string;
}

export interface ClimateStation {
  name: string;
  wmo: string;
  elevationFt: number;
  pressurePsia: number;    // ASHRAE standard pressure at station elevation
  recordPeriod: string;    // Years of hourly data behind the design values
  summerDb: number;        // 1% cooling dry bulb (F)
  summerWb: number;        // Mean coincident wet bulb at the 1% dry bulb (F)
  winterDb: number;        // 99% heating dry bulb (F)
  winterDb996: number;     // 99.6% heating dry bulb (F), shown for reference
  hottestMonthRange: number; // Mean daily dry-bulb range of the hottest month (F)
}

export interface CountyClimate {
  county: string;
  state: 'NC' | 'SC';
  station: string;
  stationData: ClimateStation;
  stationDistanceMi: number;
  countyElevationFt: number;
  summerDb: number;  // 1% cooling dry bulb (F)
  summerWb: number;  // Mean coincident wet bulb (F)
  winterDb: number;  // 99% heating dry bulb (F)
  dailyRange: 'L' | 'M' | 'H'; // Low (<16), Medium (16-25), High (>25)
  designGrains: number; // Outdoor minus indoor (75F / 50% RH) humidity ratio, grains/lb
  climateZone: string;  // IECC zone label for display only; confirm against the adopted energy code
  source: SourceRecord;
}

const ASHRAE_TOOL_URL = 'https://ashrae-meteo.info/v3.0/';
const RETRIEVED = '2026-10-15';

/** Saturation vapor pressure over water (psia), Arden Buck equation. */
function saturationPressurePsia(tempF: number): number {
  const c = (tempF - 32) * (5 / 9);
  return 0.61121 * Math.exp((18.678 - c / 234.5) * (c / (257.14 + c))) * 0.145038;
}

/**
 * Humidity ratio in grains/lb from dry bulb and wet bulb (psychrometer equation)
 * at the given barometric pressure.
 */
export function calculateHumidityGrains(dryBulbF: number, wetBulbF: number, patmPsi = 14.696): number {
  const pv = saturationPressurePsia(wetBulbF) - 0.000367 * patmPsi * (dryBulbF - wetBulbF) * (1 + (wetBulbF - 32) / 1571);
  if (pv <= 0) return 0;
  return Math.max(0, 0.62198 * (pv / (patmPsi - pv)) * 7000);
}

/** Indoor design humidity ratio (75F, 50% RH) in grains/lb at the given pressure. */
export function indoorDesignGrains(patmPsi = 14.696): number {
  const pv = 0.5 * saturationPressurePsia(75);
  return 0.62198 * (pv / (patmPsi - pv)) * 7000;
}

/** Outdoor design grains minus indoor (75F / 50% RH), evaluated at station pressure. */
export function calculateDesignGrainsDifference(summerDb: number, summerWb: number, patmPsi = 14.696): number {
  return Math.round(Math.max(0, calculateHumidityGrains(summerDb, summerWb, patmPsi) - indoorDesignGrains(patmPsi)));
}
""")

w('// ASHRAE 2021 stations used by at least one county')
for wmo in sorted(stations, key=lambda k: stations[k]['place']):
    s = stations[wmo]
    w(f"const {station_const(wmo)}: ClimateStation = {{ name: {json.dumps(title_place(s['place']))}, wmo: '{wmo}', "
      f"elevationFt: {round(s['elev_ft'])}, pressurePsia: {s['stdp_psia']}, recordPeriod: '{period_full(s['period'])}', "
      f"summerDb: {s['cool1_db']}, summerWb: {s['cool1_mcwb']}, winterDb: {s['heat99']}, winterDb996: {s['heat996']}, "
      f"hottestMonthRange: {s['range']} }};")
w('')
w("type CountyRow = { station: ClimateStation; distanceMi: number; countyElevationFt: number; climateZone: string };")
w('')

def county_table(state):
    name = f'{state}_ROWS'
    w(f'const {name}: Record<string, CountyRow> = {{')
    for r in sorted((r for r in rows if r['state'] == state), key=lambda r: r['county']):
        zone = zones[f"{state}|{r['county']}"]
        mi = round(r['dist_km'] * 0.621371, 1)
        w(f"  {json.dumps(r['county'])}: {{ station: {station_const(r['station']['wmo'])}, distanceMi: {mi}, "
          f"countyElevationFt: {r['county_elev_ft']}, climateZone: '{zone}' }},")
    w('};')
    w('')

county_table('NC')
county_table('SC')

w("""function buildCounty(state: 'NC' | 'SC', county: string, row: CountyRow): CountyClimate {
  const s = row.station;
  return {
    county,
    state,
    station: s.name,
    stationData: s,
    stationDistanceMi: row.distanceMi,
    countyElevationFt: row.countyElevationFt,
    summerDb: s.summerDb,
    summerWb: s.summerWb,
    winterDb: s.winterDb,
    dailyRange: s.hottestMonthRange < 16 ? 'L' : (s.hottestMonthRange <= 25 ? 'M' : 'H'),
    designGrains: calculateDesignGrainsDifference(s.summerDb, s.summerWb, s.pressurePsia),
    climateZone: row.climateZone,
    source: {
      document: 'ASHRAE Handbook - Fundamentals (2021), Chapter 14: Climatic Design Information',
      tableOrPage: `Station ${s.name} (WMO ${s.wmo}), ${s.recordPeriod} record: 99% heating DB, 1% cooling DB / MCWB`,
      url: ASHRAE_TOOL_URL,
      basis: 'retrieved',
      dateRetrieved: RETRIEVED
    }
  };
}

function buildTable(state: 'NC' | 'SC', rows: Record<string, CountyRow>): Record<string, Omit<CountyClimate, 'county' | 'state'>> {
  return Object.fromEntries(
    Object.entries(rows).map(([county, row]) => {
      const { county: _c, state: _s, ...rest } = buildCounty(state, county, row);
      return [county, rest];
    })
  );
}

export const NC_COUNTIES = buildTable('NC', NC_ROWS);
export const SC_COUNTIES = buildTable('SC', SC_ROWS);

export function getCountyClimate(state: 'NC' | 'SC', county: string): CountyClimate {
  const dataset = state === 'NC' ? NC_COUNTIES : SC_COUNTIES;
  const fallbackCounty = state === 'NC' ? 'Mecklenburg' : 'Richland';
  const name = dataset[county] ? county : fallbackCounty;
  return { county: name, state, ...dataset[name] };
}
""")

open(out_path, 'w', encoding='utf-8', newline='\n').write('\n'.join(lines))
print('wrote', out_path, len(stations), 'stations')
