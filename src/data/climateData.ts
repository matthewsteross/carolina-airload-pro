// GENERATED FILE - do not hand-edit design values.
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

// ASHRAE 2021 stations used by at least one county
const S_723190: ClimateStation = { name: "Anderson, SC", wmo: '723190', elevationFt: 760, pressurePsia: 14.3, recordPeriod: '1994-2019', summerDb: 92.8, summerWb: 73.6, winterDb: 25.8, winterDb996: 21.9, hottestMonthRange: 19.1 };
const S_723146: ClimateStation = { name: "Ashe County Ap, NC", wmo: '723146', elevationFt: 3180, pressurePsia: 13.08, recordPeriod: '1999-2019', summerDb: 81.2, summerWb: 67.2, winterDb: 15.5, winterDb996: 11.3, hottestMonthRange: 14.7 };
const S_746935: ClimateStation = { name: "Asheboro, NC", wmo: '746935', elevationFt: 673, pressurePsia: 14.34, recordPeriod: '1999-2019', summerDb: 90.9, summerWb: 73.9, winterDb: 23.5, winterDb996: 19.1, hottestMonthRange: 18.1 };
const S_746970: ClimateStation = { name: "Asheville 13 S, NC", wmo: '746970', elevationFt: 2103, pressurePsia: 13.61, recordPeriod: '2001-2019', summerDb: 84.7, summerWb: 70.1, winterDb: 19.0, winterDb996: 14.7, hottestMonthRange: 18.4 };
const S_746960: ClimateStation = { name: "Asheville 8 Ssw, NC", wmo: '746960', elevationFt: 2151, pressurePsia: 13.59, recordPeriod: '2001-2019', summerDb: 84.2, summerWb: 69.8, winterDb: 17.2, winterDb996: 12.9, hottestMonthRange: 20.3 };
const S_720602: ClimateStation = { name: "Barnwell, SC", wmo: '720602', elevationFt: 247, pressurePsia: 14.57, recordPeriod: '2009-2019', summerDb: 94.9, summerWb: 76.4, winterDb: 28.0, winterDb996: 24.8, hottestMonthRange: 19.6 };
const S_722085: ClimateStation = { name: "Beaufort Mcas, SC", wmo: '722085', elevationFt: 37, pressurePsia: 14.68, recordPeriod: '1994-2019', summerDb: 92.8, summerWb: 77.9, winterDb: 31.7, winterDb996: 28.0, hottestMonthRange: 16.1 };
const S_723037: ClimateStation = { name: "Beaufort, NC", wmo: '723037', elevationFt: 8, pressurePsia: 14.69, recordPeriod: '2001-2019', summerDb: 87.0, summerWb: 78.0, winterDb: 28.6, winterDb996: 25.4, hottestMonthRange: 10.1 };
const S_747840: ClimateStation = { name: "Blackville 3 W, SC", wmo: '747840', elevationFt: 317, pressurePsia: 14.53, recordPeriod: '2002-2019', summerDb: 92.6, summerWb: 75.0, winterDb: 27.7, winterDb996: 24.1, hottestMonthRange: 19.0 };
const S_722198: ClimateStation = { name: "Boone, NC", wmo: '722198', elevationFt: 2987, pressurePsia: 13.18, recordPeriod: '2004-2019', summerDb: 81.9, summerWb: 67.3, winterDb: 15.1, winterDb996: 10.2, hottestMonthRange: 17.9 };
const S_723174: ClimateStation = { name: "Burlington Alamance, NC", wmo: '723174', elevationFt: 617, pressurePsia: 14.37, recordPeriod: '2001-2019', summerDb: 92.1, summerWb: 73.9, winterDb: 22.1, winterDb996: 18.5, hottestMonthRange: 19.5 };
const S_722191: ClimateStation = { name: "Cape Fear Regional, NC", wmo: '722191', elevationFt: 25, pressurePsia: 14.68, recordPeriod: '2004-2019', summerDb: 87.9, summerWb: 77.6, winterDb: 28.1, winterDb996: 24.6, hottestMonthRange: 12.4 };
const S_746939: ClimateStation = { name: "Chapel Hill, NC", wmo: '746939', elevationFt: 512, pressurePsia: 14.43, recordPeriod: '2001-2018', summerDb: 91.9, summerWb: 74.1, winterDb: 23.5, winterDb996: 19.3, hottestMonthRange: 18.9 };
const S_722080: ClimateStation = { name: "Charleston Intl, SC", wmo: '722080', elevationFt: 47, pressurePsia: 14.67, recordPeriod: '1994-2019', summerDb: 92.3, summerWb: 77.4, winterDb: 30.6, winterDb996: 27.2, hottestMonthRange: 16.1 };
const S_723140: ClimateStation = { name: "Charlotte Douglas, NC", wmo: '723140', elevationFt: 728, pressurePsia: 14.31, recordPeriod: '1994-2019', summerDb: 91.9, summerWb: 74.0, winterDb: 24.8, winterDb996: 21.0, hottestMonthRange: 18.6 };
const S_723194: ClimateStation = { name: "Charlotte-Monroe, NC", wmo: '723194', elevationFt: 679, pressurePsia: 14.34, recordPeriod: '2001-2019', summerDb: 92.4, summerWb: 74.0, winterDb: 24.9, winterDb996: 20.8, hottestMonthRange: 19.5 };
const S_723090: ClimateStation = { name: "Cherry Point Mcas, NC", wmo: '723090', elevationFt: 29, pressurePsia: 14.68, recordPeriod: '1994-2019', summerDb: 89.9, summerWb: 77.2, winterDb: 27.2, winterDb996: 23.7, hottestMonthRange: 15.0 };
const S_720599: ClimateStation = { name: "Chester Catawba, SC", wmo: '720599', elevationFt: 657, pressurePsia: 14.35, recordPeriod: '2009-2019', summerDb: 91.3, summerWb: 73.7, winterDb: 27.0, winterDb996: 21.3, hottestMonthRange: 19.4 };
const S_723095: ClimateStation = { name: "Coastal Carolina, NC", wmo: '723095', elevationFt: 19, pressurePsia: 14.69, recordPeriod: '1994-2019', summerDb: 91.1, summerWb: 77.2, winterDb: 26.1, winterDb996: 22.5, hottestMonthRange: 16.8 };
const S_723100: ClimateStation = { name: "Columbia Metro, SC", wmo: '723100', elevationFt: 225, pressurePsia: 14.58, recordPeriod: '1994-2019', summerDb: 94.8, summerWb: 74.9, winterDb: 27.0, winterDb996: 23.5, hottestMonthRange: 19.1 };
const S_723104: ClimateStation = { name: "Columbia Owens, SC", wmo: '723104', elevationFt: 212, pressurePsia: 14.58, recordPeriod: '1999-2019', summerDb: 94.9, summerWb: 74.9, winterDb: 28.3, winterDb996: 25.3, hottestMonthRange: 18.7 };
const S_720274: ClimateStation = { name: "Columbus County Ap, NC", wmo: '720274', elevationFt: 98, pressurePsia: 14.64, recordPeriod: '2004-2019', summerDb: 92.0, summerWb: 76.4, winterDb: 28.2, winterDb996: 24.9, hottestMonthRange: 18.1 };
const S_723626: ClimateStation = { name: "Currituck County Regional, NC", wmo: '723626', elevationFt: 16, pressurePsia: 14.69, recordPeriod: '2004-2019', summerDb: 90.4, summerWb: 75.8, winterDb: 25.9, winterDb996: 21.5, hottestMonthRange: 14.9 };
const S_722181: ClimateStation = { name: "Daniel Field, GA", wmo: '722181', elevationFt: 423, pressurePsia: 14.47, recordPeriod: '1997-2019', summerDb: 94.7, summerWb: 74.2, winterDb: 30.3, winterDb996: 27.5, hottestMonthRange: 18.0 };
const S_724106: ClimateStation = { name: "Danville, VA", wmo: '724106', elevationFt: 571, pressurePsia: 14.4, recordPeriod: '1994-2019', summerDb: 91.2, summerWb: 74.3, winterDb: 21.6, winterDb996: 18.0, hottestMonthRange: 19.5 };
const S_723046: ClimateStation = { name: "Dare County Regional, NC", wmo: '723046', elevationFt: 13, pressurePsia: 14.69, recordPeriod: '1997-2019', summerDb: 90.0, summerWb: 78.5, winterDb: 28.5, winterDb996: 25.4, hottestMonthRange: 11.4 };
const S_723116: ClimateStation = { name: "Darlington County Ap, SC", wmo: '723116', elevationFt: 192, pressurePsia: 14.59, recordPeriod: '1999-2019', summerDb: 93.1, summerWb: 75.5, winterDb: 26.5, winterDb996: 21.8, hottestMonthRange: 18.7 };
const S_722079: ClimateStation = { name: "Davidson County Ap, NC", wmo: '722079', elevationFt: 733, pressurePsia: 14.31, recordPeriod: '1994-2019', summerDb: 90.3, summerWb: 73.9, winterDb: 21.8, winterDb996: 18.4, hottestMonthRange: 18.6 };
const S_746929: ClimateStation = { name: "Duplin County Ap, NC", wmo: '746929', elevationFt: 137, pressurePsia: 14.62, recordPeriod: '2001-2019', summerDb: 92.6, summerWb: 75.0, winterDb: 24.8, winterDb996: 20.5, hottestMonthRange: 19.4 };
const S_723070: ClimateStation = { name: "Elizabeth City, NC", wmo: '723070', elevationFt: 13, pressurePsia: 14.69, recordPeriod: '1999-2019', summerDb: 90.6, summerWb: 77.5, winterDb: 25.3, winterDb996: 21.4, hottestMonthRange: 15.6 };
const S_720279: ClimateStation = { name: "Elizabethtown, NC", wmo: '720279', elevationFt: 133, pressurePsia: 14.63, recordPeriod: '2004-2019', summerDb: 92.9, summerWb: 75.6, winterDb: 27.6, winterDb996: 23.9, hottestMonthRange: 18.5 };
const S_723035: ClimateStation = { name: "Fayetteville, NC", wmo: '723035', elevationFt: 186, pressurePsia: 14.6, recordPeriod: '1994-2019', summerDb: 93.7, summerWb: 75.2, winterDb: 26.4, winterDb996: 22.2, hottestMonthRange: 18.7 };
const S_723106: ClimateStation = { name: "Florence, SC", wmo: '723106', elevationFt: 146, pressurePsia: 14.62, recordPeriod: '1994-2019', summerDb: 93.6, summerWb: 75.9, winterDb: 27.0, winterDb996: 23.6, hottestMonthRange: 18.5 };
const S_723148: ClimateStation = { name: "Foothills, NC", wmo: '723148', elevationFt: 1270, pressurePsia: 14.03, recordPeriod: '2001-2019', summerDb: 90.7, summerWb: 71.1, winterDb: 20.9, winterDb996: 17.2, hottestMonthRange: 21.8 };
const S_723139: ClimateStation = { name: "Frisco Mitchell, NC", wmo: '723139', elevationFt: 11, pressurePsia: 14.69, recordPeriod: '1994-2019', summerDb: 86.5, summerWb: 77.7, winterDb: 30.8, winterDb996: 27.5, hottestMonthRange: 9.9 };
const S_723147: ClimateStation = { name: "Gastonia, NC", wmo: '723147', elevationFt: 797, pressurePsia: 14.28, recordPeriod: '2001-2019', summerDb: 92.4, summerWb: 74.1, winterDb: 24.8, winterDb996: 20.6, hottestMonthRange: 19.3 };
const S_746940: ClimateStation = { name: "Goldsboro-Wayne, NC", wmo: '746940', elevationFt: 134, pressurePsia: 14.62, recordPeriod: '2002-2019', summerDb: 92.5, summerWb: 75.8, winterDb: 25.1, winterDb996: 21.0, hottestMonthRange: 19.6 };
const S_723119: ClimateStation = { name: "Greenville Downtown, SC", wmo: '723119', elevationFt: 1048, pressurePsia: 14.15, recordPeriod: '1999-2019', summerDb: 92.0, summerWb: 72.9, winterDb: 26.8, winterDb996: 22.9, hottestMonthRange: 17.2 };
const S_723120: ClimateStation = { name: "Greenville-Spartanburg, SC", wmo: '723120', elevationFt: 955, pressurePsia: 14.2, recordPeriod: '1994-2019', summerDb: 91.8, summerWb: 73.2, winterDb: 25.4, winterDb996: 21.6, hottestMonthRange: 18.5 };
const S_723124: ClimateStation = { name: "Greenwood County Ap, SC", wmo: '723124', elevationFt: 631, pressurePsia: 14.36, recordPeriod: '2001-2019', summerDb: 93.1, summerWb: 74.0, winterDb: 25.8, winterDb996: 21.9, hottestMonthRange: 19.7 };
const S_720649: ClimateStation = { name: "Halifax Northampton, NC", wmo: '720649', elevationFt: 145, pressurePsia: 14.62, recordPeriod: '2009-2019', summerDb: 91.2, summerWb: 75.8, winterDb: 22.7, winterDb996: 18.5, hottestMonthRange: 20.5 };
const S_746936: ClimateStation = { name: "Harnett Regional, NC", wmo: '746936', elevationFt: 198, pressurePsia: 14.59, recordPeriod: '1999-2019', summerDb: 94.1, summerWb: 75.4, winterDb: 26.5, winterDb996: 22.7, hottestMonthRange: 18.5 };
const S_720288: ClimateStation = { name: "Henderson-Oxford, NC", wmo: '720288', elevationFt: 527, pressurePsia: 14.42, recordPeriod: '2004-2019', summerDb: 90.4, summerWb: 72.7, winterDb: 22.6, winterDb996: 18.4, hottestMonthRange: 18.6 };
const S_723010: ClimateStation = { name: "Hickory, NC", wmo: '723010', elevationFt: 1175, pressurePsia: 14.08, recordPeriod: '1994-2019', summerDb: 89.9, summerWb: 72.4, winterDb: 23.3, winterDb996: 19.3, hottestMonthRange: 18.0 };
const S_722131: ClimateStation = { name: "Johnston, NC", wmo: '722131', elevationFt: 165, pressurePsia: 14.61, recordPeriod: '2004-2019', summerDb: 91.4, summerWb: 75.5, winterDb: 24.6, winterDb996: 19.3, hottestMonthRange: 19.8 };
const S_720597: ClimateStation = { name: "Laurens County Ap, SC", wmo: '720597', elevationFt: 696, pressurePsia: 14.33, recordPeriod: '2009-2019', summerDb: 91.3, summerWb: 74.9, winterDb: 27.1, winterDb996: 22.5, hottestMonthRange: 19.6 };
const S_723109: ClimateStation = { name: "Laurinburg-Maxton, NC", wmo: '723109', elevationFt: 220, pressurePsia: 14.58, recordPeriod: '1999-2019', summerDb: 93.3, summerWb: 75.3, winterDb: 25.0, winterDb996: 21.1, hottestMonthRange: 19.3 };
const S_722128: ClimateStation = { name: "Lincoln County Ap, NC", wmo: '722128', elevationFt: 875, pressurePsia: 14.24, recordPeriod: '2004-2019', summerDb: 91.6, summerWb: 72.2, winterDb: 22.4, winterDb996: 18.5, hottestMonthRange: 21.0 };
const S_720609: ClimateStation = { name: "Lowcountry, SC", wmo: '720609', elevationFt: 102, pressurePsia: 14.64, recordPeriod: '2009-2019', summerDb: 93.4, summerWb: 75.4, winterDb: 29.6, winterDb996: 26.8, hottestMonthRange: 19.1 };
const S_723108: ClimateStation = { name: "Lumberton, NC", wmo: '723108', elevationFt: 121, pressurePsia: 14.63, recordPeriod: '1999-2019', summerDb: 93.0, summerWb: 75.9, winterDb: 26.0, winterDb996: 22.5, hottestMonthRange: 18.3 };
const S_720259: ClimateStation = { name: "Macon County Ap, NC", wmo: '720259', elevationFt: 2020, pressurePsia: 13.65, recordPeriod: '2004-2019', summerDb: 87.5, summerWb: 68.9, winterDb: 18.2, winterDb996: 14.0, hottestMonthRange: 20.6 };
const S_747850: ClimateStation = { name: "Mcclellanville 7 Ne, SC", wmo: '747850', elevationFt: 9, pressurePsia: 14.69, recordPeriod: '2002-2019', summerDb: 89.1, summerWb: 77.8, winterDb: 30.3, winterDb996: 27.0, hottestMonthRange: 13.8 };
const S_724118: ClimateStation = { name: "Mecklenburg-Brunswick, VA", wmo: '724118', elevationFt: 442, pressurePsia: 14.46, recordPeriod: '1997-2019', summerDb: 92.6, summerWb: 75.4, winterDb: 21.8, winterDb996: 18.0, hottestMonthRange: 20.1 };
const S_723156: ClimateStation = { name: "Mid-Carolina, NC", wmo: '723156', elevationFt: 773, pressurePsia: 14.29, recordPeriod: '2002-2019', summerDb: 90.9, summerWb: 73.2, winterDb: 22.3, winterDb996: 18.6, hottestMonthRange: 19.4 };
const S_723143: ClimateStation = { name: "Moore County Ap, NC", wmo: '723143', elevationFt: 461, pressurePsia: 14.45, recordPeriod: '1994-2019', summerDb: 92.7, summerWb: 74.4, winterDb: 22.7, winterDb996: 18.7, hottestMonthRange: 19.3 };
const S_723177: ClimateStation = { name: "Mt Airy, NC", wmo: '723177', elevationFt: 1247, pressurePsia: 14.05, recordPeriod: '2001-2019', summerDb: 90.0, summerWb: 73.6, winterDb: 22.8, winterDb996: 18.7, hottestMonthRange: 17.8 };
const S_747910: ClimateStation = { name: "Myrtle Beach, SC", wmo: '747910', elevationFt: 25, pressurePsia: 14.68, recordPeriod: '1994-2019', summerDb: 89.6, summerWb: 77.9, winterDb: 27.8, winterDb996: 25.1, hottestMonthRange: 13.4 };
const S_723096: ClimateStation = { name: "New River Mcas, NC", wmo: '723096', elevationFt: 26, pressurePsia: 14.68, recordPeriod: '1994-2019', summerDb: 90.6, summerWb: 77.3, winterDb: 26.5, winterDb996: 22.8, hottestMonthRange: 16.1 };
const S_720596: ClimateStation = { name: "Newberry, SC", wmo: '720596', elevationFt: 568, pressurePsia: 14.4, recordPeriod: '2009-2019', summerDb: 93.3, summerWb: 73.7, winterDb: 27.4, winterDb996: 22.8, hottestMonthRange: 20.2 };
const S_723074: ClimateStation = { name: "Northeastern, NC", wmo: '723074', elevationFt: 20, pressurePsia: 14.69, recordPeriod: '1999-2019', summerDb: 91.2, summerWb: 77.5, winterDb: 26.9, winterDb996: 22.8, hottestMonthRange: 14.9 };
const S_723118: ClimateStation = { name: "Occonee County Ap, SC", wmo: '723118', elevationFt: 891, pressurePsia: 14.23, recordPeriod: '2001-2019', summerDb: 92.9, summerWb: 73.4, winterDb: 28.1, winterDb996: 24.8, hottestMonthRange: 17.7 };
const S_723115: ClimateStation = { name: "Orangeburg, SC", wmo: '723115', elevationFt: 197, pressurePsia: 14.59, recordPeriod: '1999-2019', summerDb: 93.4, summerWb: 75.5, winterDb: 28.0, winterDb996: 24.9, hottestMonthRange: 19.1 };
const S_722193: ClimateStation = { name: "Person County Ap, NC", wmo: '722193', elevationFt: 609, pressurePsia: 14.38, recordPeriod: '2004-2019', summerDb: 90.6, summerWb: 73.4, winterDb: 20.9, winterDb996: 17.7, hottestMonthRange: 19.9 };
const S_723170: ClimateStation = { name: "Piedmont Triad, NC", wmo: '723170', elevationFt: 890, pressurePsia: 14.23, recordPeriod: '1994-2019', summerDb: 90.3, summerWb: 73.5, winterDb: 22.2, winterDb996: 18.6, hottestMonthRange: 17.4 };
const S_723065: ClimateStation = { name: "Pitt-Greenville, NC", wmo: '723065', elevationFt: 25, pressurePsia: 14.68, recordPeriod: '1994-2019', summerDb: 92.9, summerWb: 75.4, winterDb: 24.9, winterDb996: 20.7, hottestMonthRange: 18.6 };
const S_723030: ClimateStation = { name: "Pope Afb, NC", wmo: '723030', elevationFt: 218, pressurePsia: 14.58, recordPeriod: '1994-2019', summerDb: 94.3, summerWb: 75.6, winterDb: 24.5, winterDb996: 20.5, hottestMonthRange: 18.6 };
const S_722201: ClimateStation = { name: "Raleigh Executive, NC", wmo: '722201', elevationFt: 247, pressurePsia: 14.57, recordPeriod: '2004-2019', summerDb: 93.1, summerWb: 74.5, winterDb: 21.4, winterDb996: 18.2, hottestMonthRange: 21.2 };
const S_723060: ClimateStation = { name: "Raleigh-Durham, NC", wmo: '723060', elevationFt: 416, pressurePsia: 14.48, recordPeriod: '1994-2019', summerDb: 92.6, summerWb: 75.1, winterDb: 23.6, winterDb996: 19.7, hottestMonthRange: 19.1 };
const S_722243: ClimateStation = { name: "Richmond County Ap, NC", wmo: '722243', elevationFt: 358, pressurePsia: 14.51, recordPeriod: '2004-2019', summerDb: 93.0, summerWb: 74.0, winterDb: 25.9, winterDb996: 21.7, hottestMonthRange: 18.8 };
const S_723117: ClimateStation = { name: "Rock Hill, SC", wmo: '723117', elevationFt: 669, pressurePsia: 14.34, recordPeriod: '2001-2019', summerDb: 92.5, summerWb: 74.3, winterDb: 24.1, winterDb996: 20.3, hottestMonthRange: 19.6 };
const S_723068: ClimateStation = { name: "Rocky Mount Wilson, NC", wmo: '723068', elevationFt: 160, pressurePsia: 14.61, recordPeriod: '2000-2019', summerDb: 92.4, summerWb: 75.9, winterDb: 23.4, winterDb996: 19.3, hottestMonthRange: 19.9 };
const S_723144: ClimateStation = { name: "Rutherford County Ap, NC", wmo: '723144', elevationFt: 1078, pressurePsia: 14.13, recordPeriod: '1999-2019', summerDb: 90.5, summerWb: 73.3, winterDb: 24.1, winterDb996: 19.6, hottestMonthRange: 18.9 };
const S_722073: ClimateStation = { name: "Sampson County Ap, NC", wmo: '722073', elevationFt: 148, pressurePsia: 14.62, recordPeriod: '2004-2019', summerDb: 92.9, summerWb: 76.3, winterDb: 26.7, winterDb996: 22.7, hottestMonthRange: 18.7 };
const S_723107: ClimateStation = { name: "Santee Cooper, SC", wmo: '723107', elevationFt: 102, pressurePsia: 14.64, recordPeriod: '2009-2019', summerDb: 92.9, summerWb: 76.1, winterDb: 28.2, winterDb996: 26.5, hottestMonthRange: 18.5 };
const S_723066: ClimateStation = { name: "Seymour Johnson Afb, NC", wmo: '723066', elevationFt: 109, pressurePsia: 14.64, recordPeriod: '1994-2019', summerDb: 93.6, summerWb: 76.1, winterDb: 25.4, winterDb996: 21.2, hottestMonthRange: 18.4 };
const S_747900: ClimateStation = { name: "Shaw Afb, SC", wmo: '747900', elevationFt: 241, pressurePsia: 14.57, recordPeriod: '1994-2019', summerDb: 93.8, summerWb: 75.5, winterDb: 27.0, winterDb996: 23.3, hottestMonthRange: 18.9 };
const S_720277: ClimateStation = { name: "Shelby-Cleveland County Ap, NC", wmo: '720277', elevationFt: 847, pressurePsia: 14.25, recordPeriod: '2004-2019', summerDb: 90.9, summerWb: 72.6, winterDb: 23.7, winterDb996: 19.4, hottestMonthRange: 19.1 };
const S_722148: ClimateStation = { name: "Stanley County Ap, NC", wmo: '722148', elevationFt: 609, pressurePsia: 14.38, recordPeriod: '2004-2019', summerDb: 92.7, summerWb: 75.0, winterDb: 21.8, winterDb996: 18.5, hottestMonthRange: 20.7 };
const S_723055: ClimateStation = { name: "Statesville, NC", wmo: '723055', elevationFt: 965, pressurePsia: 14.19, recordPeriod: '2001-2019', summerDb: 90.3, summerWb: 73.5, winterDb: 22.1, winterDb996: 18.5, hottestMonthRange: 18.8 };
const S_724007: ClimateStation = { name: "Suffolk, VA", wmo: '724007', elevationFt: 72, pressurePsia: 14.66, recordPeriod: '1999-2019', summerDb: 91.4, summerWb: 77.3, winterDb: 23.7, winterDb996: 18.9, hottestMonthRange: 18.2 };
const S_720632: ClimateStation = { name: "Summerville, SC", wmo: '720632', elevationFt: 56, pressurePsia: 14.67, recordPeriod: '2009-2019', summerDb: 92.7, summerWb: 77.0, winterDb: 28.5, winterDb996: 26.5, hottestMonthRange: 19.3 };
const S_720301: ClimateStation = { name: "Sylvania, GA", wmo: '720301', elevationFt: 188, pressurePsia: 14.6, recordPeriod: '2004-2019', summerDb: 94.5, summerWb: 77.3, winterDb: 29.8, winterDb996: 26.8, hottestMonthRange: 19.0 };
const S_723079: ClimateStation = { name: "Tri-County Ap, NC", wmo: '723079', elevationFt: 68, pressurePsia: 14.66, recordPeriod: '1999-2019', summerDb: 91.3, summerWb: 76.4, winterDb: 23.2, winterDb996: 18.5, hottestMonthRange: 18.0 };
const S_722141: ClimateStation = { name: "Triangle North Executive, NC", wmo: '722141', elevationFt: 369, pressurePsia: 14.5, recordPeriod: '2004-2019', summerDb: 91.3, summerWb: 74.7, winterDb: 22.9, winterDb996: 18.8, hottestMonthRange: 19.6 };
const S_746925: ClimateStation = { name: "Washington Warren Field, NC", wmo: '746925', elevationFt: 38, pressurePsia: 14.68, recordPeriod: '2001-2019', summerDb: 92.6, summerWb: 77.0, winterDb: 25.2, winterDb996: 20.8, hottestMonthRange: 16.6 };
const S_722177: ClimateStation = { name: "Western Carolina, NC", wmo: '722177', elevationFt: 1696, pressurePsia: 13.82, recordPeriod: '1999-2019', summerDb: 88.3, summerWb: 72.9, winterDb: 19.1, winterDb996: 15.8, hottestMonthRange: 20.4 };
const S_723165: ClimateStation = { name: "Wilkes County Ap, NC", wmo: '723165', elevationFt: 1300, pressurePsia: 14.02, recordPeriod: '2001-2019', summerDb: 90.2, summerWb: 72.6, winterDb: 21.1, winterDb996: 18.0, hottestMonthRange: 20.4 };
const S_720604: ClimateStation = { name: "Williamsburg, SC", wmo: '720604', elevationFt: 66, pressurePsia: 14.66, recordPeriod: '2009-2019', summerDb: 93.0, summerWb: 76.7, winterDb: 27.9, winterDb996: 23.4, hottestMonthRange: 19.2 };
const S_723020: ClimateStation = { name: "Wilmington, NC", wmo: '723020', elevationFt: 33, pressurePsia: 14.68, recordPeriod: '1994-2019', summerDb: 91.2, summerWb: 76.9, winterDb: 27.5, winterDb996: 24.2, hottestMonthRange: 15.6 };
const S_723193: ClimateStation = { name: "Winston-Salem Reynolds, NC", wmo: '723193', elevationFt: 970, pressurePsia: 14.19, recordPeriod: '1994-2019', summerDb: 90.3, summerWb: 73.0, winterDb: 23.1, winterDb996: 19.1, hottestMonthRange: 17.0 };
const S_720603: ClimateStation = { name: "Woodward Field, SC", wmo: '720603', elevationFt: 302, pressurePsia: 14.54, recordPeriod: '2009-2019', summerDb: 95.0, summerWb: 76.1, winterDb: 27.1, winterDb996: 22.9, hottestMonthRange: 19.6 };

type CountyRow = { station: ClimateStation; distanceMi: number; countyElevationFt: number; climateZone: string };

const NC_ROWS: Record<string, CountyRow> = {
  "Alamance": { station: S_723174, distanceMi: 4.3, countyElevationFt: 604, climateZone: '3A' },
  "Alexander": { station: S_723055, distanceMi: 16.4, countyElevationFt: 1198, climateZone: '4A' },
  "Alleghany": { station: S_723146, distanceMi: 16.4, countyElevationFt: 2941, climateZone: '5A' },
  "Anson": { station: S_722243, distanceMi: 20.7, countyElevationFt: 316, climateZone: '3A' },
  "Ashe": { station: S_723146, distanceMi: 4.5, countyElevationFt: 3006, climateZone: '5A' },
  "Avery": { station: S_722198, distanceMi: 17.5, countyElevationFt: 3733, climateZone: '5A' },
  "Beaufort": { station: S_746925, distanceMi: 13.2, countyElevationFt: 12, climateZone: '3A' },
  "Bertie": { station: S_723079, distanceMi: 20.2, countyElevationFt: 34, climateZone: '3A' },
  "Bladen": { station: S_720279, distanceMi: 2.3, countyElevationFt: 64, climateZone: '3A' },
  "Brunswick": { station: S_722191, distanceMi: 11.6, countyElevationFt: 33, climateZone: '2A' },
  "Buncombe": { station: S_746960, distanceMi: 9.3, countyElevationFt: 2352, climateZone: '4A' },
  "Burke": { station: S_723148, distanceMi: 7.5, countyElevationFt: 1089, climateZone: '4A' },
  "Cabarrus": { station: S_723156, distanceMi: 17.9, countyElevationFt: 626, climateZone: '3A' },
  "Caldwell": { station: S_723148, distanceMi: 11.4, countyElevationFt: 1262, climateZone: '4A' },
  "Camden": { station: S_723070, distanceMi: 5.7, countyElevationFt: 4, climateZone: '3A' },
  "Carteret": { station: S_723037, distanceMi: 11.1, countyElevationFt: 5, climateZone: '2A' },
  "Caswell": { station: S_724106, distanceMi: 12.4, countyElevationFt: 564, climateZone: '4A' },
  "Catawba": { station: S_723010, distanceMi: 10.9, countyElevationFt: 945, climateZone: '4A' },
  "Chatham": { station: S_722201, distanceMi: 12.0, countyElevationFt: 463, climateZone: '3A' },
  "Cherokee": { station: S_722177, distanceMi: 11.8, countyElevationFt: 1769, climateZone: '4A' },
  "Chowan": { station: S_723074, distanceMi: 7.3, countyElevationFt: 15, climateZone: '3A' },
  "Clay": { station: S_722177, distanceMi: 11.7, countyElevationFt: 2233, climateZone: '4A' },
  "Cleveland": { station: S_720277, distanceMi: 6.0, countyElevationFt: 805, climateZone: '3A' },
  "Columbus": { station: S_720274, distanceMi: 4.4, countyElevationFt: 71, climateZone: '3A' },
  "Craven": { station: S_723095, distanceMi: 3.9, countyElevationFt: 14, climateZone: '3A' },
  "Cumberland": { station: S_723035, distanceMi: 5.0, countyElevationFt: 92, climateZone: '3A' },
  "Currituck": { station: S_723626, distanceMi: 4.5, countyElevationFt: 1, climateZone: '3A' },
  "Dare": { station: S_723046, distanceMi: 21.8, countyElevationFt: 0, climateZone: '2A' },
  "Davidson": { station: S_722079, distanceMi: 5.5, countyElevationFt: 746, climateZone: '3A' },
  "Davie": { station: S_722079, distanceMi: 16.8, countyElevationFt: 758, climateZone: '3A' },
  "Duplin": { station: S_746929, distanceMi: 5.3, countyElevationFt: 89, climateZone: '3A' },
  "Durham": { station: S_723060, distanceMi: 11.2, countyElevationFt: 349, climateZone: '3A' },
  "Edgecombe": { station: S_723068, distanceMi: 16.8, countyElevationFt: 106, climateZone: '3A' },
  "Forsyth": { station: S_723193, distanceMi: 1.9, countyElevationFt: 854, climateZone: '3A' },
  "Franklin": { station: S_722141, distanceMi: 5.2, countyElevationFt: 343, climateZone: '3A' },
  "Gaston": { station: S_723147, distanceMi: 6.8, countyElevationFt: 714, climateZone: '3A' },
  "Gates": { station: S_724007, distanceMi: 17.5, countyElevationFt: 27, climateZone: '3A' },
  "Graham": { station: S_722177, distanceMi: 10.7, countyElevationFt: 2362, climateZone: '4A' },
  "Granville": { station: S_720288, distanceMi: 8.3, countyElevationFt: 446, climateZone: '3A' },
  "Greene": { station: S_746940, distanceMi: 16.0, countyElevationFt: 81, climateZone: '3A' },
  "Guilford": { station: S_723170, distanceMi: 8.7, countyElevationFt: 799, climateZone: '3A' },
  "Halifax": { station: S_720649, distanceMi: 5.5, countyElevationFt: 119, climateZone: '3A' },
  "Harnett": { station: S_746936, distanceMi: 7.8, countyElevationFt: 197, climateZone: '3A' },
  "Haywood": { station: S_746960, distanceMi: 21.1, countyElevationFt: 3130, climateZone: '4A' },
  "Henderson": { station: S_746970, distanceMi: 7.1, countyElevationFt: 2193, climateZone: '4A' },
  "Hertford": { station: S_723079, distanceMi: 11.5, countyElevationFt: 40, climateZone: '3A' },
  "Hoke": { station: S_723030, distanceMi: 17.0, countyElevationFt: 262, climateZone: '3A' },
  "Hyde": { station: S_723139, distanceMi: 32.3, countyElevationFt: 1, climateZone: '2A' },
  "Iredell": { station: S_723055, distanceMi: 5.4, countyElevationFt: 904, climateZone: '3A' },
  "Jackson": { station: S_720259, distanceMi: 17.2, countyElevationFt: 3149, climateZone: '4A' },
  "Johnston": { station: S_722131, distanceMi: 2.3, countyElevationFt: 170, climateZone: '3A' },
  "Jones": { station: S_723095, distanceMi: 17.6, countyElevationFt: 44, climateZone: '3A' },
  "Lee": { station: S_722201, distanceMi: 8.3, countyElevationFt: 384, climateZone: '3A' },
  "Lenoir": { station: S_723066, distanceMi: 19.9, countyElevationFt: 43, climateZone: '3A' },
  "Lincoln": { station: S_722128, distanceMi: 3.7, countyElevationFt: 890, climateZone: '3A' },
  "Macon": { station: S_720259, distanceMi: 4.8, countyElevationFt: 2192, climateZone: '4A' },
  "Madison": { station: S_746960, distanceMi: 26.2, countyElevationFt: 2227, climateZone: '4A' },
  "Martin": { station: S_746925, distanceMi: 19.6, countyElevationFt: 50, climateZone: '3A' },
  "McDowell": { station: S_723144, distanceMi: 18.7, countyElevationFt: 1486, climateZone: '4A' },
  "Mecklenburg": { station: S_723140, distanceMi: 7.0, countyElevationFt: 738, climateZone: '3A' },
  "Mitchell": { station: S_722198, distanceMi: 31.4, countyElevationFt: 2733, climateZone: '5A' },
  "Montgomery": { station: S_722148, distanceMi: 14.9, countyElevationFt: 486, climateZone: '3A' },
  "Moore": { station: S_723143, distanceMi: 7.6, countyElevationFt: 464, climateZone: '3A' },
  "Nash": { station: S_723068, distanceMi: 9.3, countyElevationFt: 191, climateZone: '3A' },
  "New Hanover": { station: S_723020, distanceMi: 6.2, countyElevationFt: 15, climateZone: '2A' },
  "Northampton": { station: S_723079, distanceMi: 15.3, countyElevationFt: 104, climateZone: '3A' },
  "Onslow": { station: S_723096, distanceMi: 5.1, countyElevationFt: 28, climateZone: '2A' },
  "Orange": { station: S_746939, distanceMi: 9.5, countyElevationFt: 673, climateZone: '3A' },
  "Pamlico": { station: S_723090, distanceMi: 21.1, countyElevationFt: 2, climateZone: '2A' },
  "Pasquotank": { station: S_723070, distanceMi: 4.8, countyElevationFt: 8, climateZone: '3A' },
  "Pender": { station: S_723020, distanceMi: 16.9, countyElevationFt: 39, climateZone: '2A' },
  "Perquimans": { station: S_723070, distanceMi: 13.9, countyElevationFt: 11, climateZone: '3A' },
  "Person": { station: S_722193, distanceMi: 7.1, countyElevationFt: 606, climateZone: '4A' },
  "Pitt": { station: S_723065, distanceMi: 2.9, countyElevationFt: 49, climateZone: '3A' },
  "Polk": { station: S_723144, distanceMi: 16.7, countyElevationFt: 1009, climateZone: '4A' },
  "Randolph": { station: S_746935, distanceMi: 6.3, countyElevationFt: 688, climateZone: '3A' },
  "Richmond": { station: S_722243, distanceMi: 7.8, countyElevationFt: 303, climateZone: '3A' },
  "Robeson": { station: S_723108, distanceMi: 3.2, countyElevationFt: 142, climateZone: '3A' },
  "Rockingham": { station: S_723170, distanceMi: 21.6, countyElevationFt: 745, climateZone: '4A' },
  "Rowan": { station: S_723156, distanceMi: 0.3, countyElevationFt: 738, climateZone: '3A' },
  "Rutherford": { station: S_723144, distanceMi: 1.9, countyElevationFt: 1039, climateZone: '4A' },
  "Sampson": { station: S_722073, distanceMi: 1.0, countyElevationFt: 136, climateZone: '3A' },
  "Scotland": { station: S_723109, distanceMi: 7.1, countyElevationFt: 230, climateZone: '3A' },
  "Stanly": { station: S_722148, distanceMi: 9.4, countyElevationFt: 512, climateZone: '3A' },
  "Stokes": { station: S_723177, distanceMi: 16.4, countyElevationFt: 919, climateZone: '4A' },
  "Surry": { station: S_723177, distanceMi: 8.0, countyElevationFt: 1106, climateZone: '4A' },
  "Swain": { station: S_720259, distanceMi: 24.0, countyElevationFt: 4155, climateZone: '4A' },
  "Transylvania": { station: S_746970, distanceMi: 20.6, countyElevationFt: 2857, climateZone: '4A' },
  "Tyrrell": { station: S_723074, distanceMi: 25.0, countyElevationFt: 0, climateZone: '3A' },
  "Union": { station: S_723194, distanceMi: 5.4, countyElevationFt: 582, climateZone: '3A' },
  "Vance": { station: S_720288, distanceMi: 6.9, countyElevationFt: 466, climateZone: '3A' },
  "Wake": { station: S_723060, distanceMi: 10.2, countyElevationFt: 345, climateZone: '3A' },
  "Warren": { station: S_724118, distanceMi: 20.2, countyElevationFt: 348, climateZone: '3A' },
  "Washington": { station: S_723074, distanceMi: 12.7, countyElevationFt: 12, climateZone: '3A' },
  "Watauga": { station: S_722198, distanceMi: 4.2, countyElevationFt: 3918, climateZone: '5A' },
  "Wayne": { station: S_723066, distanceMi: 2.5, countyElevationFt: 75, climateZone: '3A' },
  "Wilkes": { station: S_723165, distanceMi: 3.9, countyElevationFt: 1210, climateZone: '4A' },
  "Wilson": { station: S_723068, distanceMi: 10.8, countyElevationFt: 118, climateZone: '3A' },
  "Yadkin": { station: S_723177, distanceMi: 21.7, countyElevationFt: 879, climateZone: '4A' },
  "Yancey": { station: S_722198, distanceMi: 42.4, countyElevationFt: 2991, climateZone: '5A' },
};

const SC_ROWS: Record<string, CountyRow> = {
  "Abbeville": { station: S_723124, distanceMi: 16.9, countyElevationFt: 605, climateZone: '3A' },
  "Aiken": { station: S_747840, distanceMi: 22.2, countyElevationFt: 405, climateZone: '3A' },
  "Allendale": { station: S_720602, distanceMi: 18.7, countyElevationFt: 162, climateZone: '3A' },
  "Anderson": { station: S_723190, distanceMi: 4.3, countyElevationFt: 764, climateZone: '3A' },
  "Bamberg": { station: S_747840, distanceMi: 19.0, countyElevationFt: 146, climateZone: '3A' },
  "Barnwell": { station: S_747840, distanceMi: 8.9, countyElevationFt: 260, climateZone: '3A' },
  "Beaufort": { station: S_722085, distanceMi: 8.8, countyElevationFt: 2, climateZone: '2A' },
  "Berkeley": { station: S_722080, distanceMi: 22.0, countyElevationFt: 34, climateZone: '2A' },
  "Calhoun": { station: S_723115, distanceMi: 15.3, countyElevationFt: 240, climateZone: '3A' },
  "Charleston": { station: S_722080, distanceMi: 8.2, countyElevationFt: 11, climateZone: '2A' },
  "Cherokee": { station: S_720277, distanceMi: 14.2, countyElevationFt: 697, climateZone: '3A' },
  "Chester": { station: S_723117, distanceMi: 21.4, countyElevationFt: 544, climateZone: '3A' },
  "Chesterfield": { station: S_723116, distanceMi: 20.3, countyElevationFt: 280, climateZone: '3A' },
  "Clarendon": { station: S_723107, distanceMi: 5.4, countyElevationFt: 110, climateZone: '3A' },
  "Colleton": { station: S_720609, distanceMi: 4.8, countyElevationFt: 48, climateZone: '2A' },
  "Darlington": { station: S_723116, distanceMi: 9.3, countyElevationFt: 180, climateZone: '3A' },
  "Dillon": { station: S_723108, distanceMi: 23.5, countyElevationFt: 109, climateZone: '3A' },
  "Dorchester": { station: S_720632, distanceMi: 7.4, countyElevationFt: 60, climateZone: '2A' },
  "Edgefield": { station: S_722181, distanceMi: 22.1, countyElevationFt: 446, climateZone: '3A' },
  "Fairfield": { station: S_720599, distanceMi: 27.1, countyElevationFt: 471, climateZone: '3A' },
  "Florence": { station: S_723106, distanceMi: 11.1, countyElevationFt: 100, climateZone: '3A' },
  "Georgetown": { station: S_747850, distanceMi: 18.7, countyElevationFt: 15, climateZone: '2A' },
  "Greenville": { station: S_723119, distanceMi: 3.5, countyElevationFt: 943, climateZone: '3A' },
  "Greenwood": { station: S_723124, distanceMi: 6.7, countyElevationFt: 585, climateZone: '3A' },
  "Hampton": { station: S_720301, distanceMi: 27.8, countyElevationFt: 91, climateZone: '2A' },
  "Horry": { station: S_747910, distanceMi: 15.8, countyElevationFt: 39, climateZone: '2A' },
  "Jasper": { station: S_722085, distanceMi: 18.1, countyElevationFt: 24, climateZone: '2A' },
  "Kershaw": { station: S_720603, distanceMi: 4.0, countyElevationFt: 297, climateZone: '3A' },
  "Lancaster": { station: S_723194, distanceMi: 23.3, countyElevationFt: 559, climateZone: '3A' },
  "Laurens": { station: S_723124, distanceMi: 18.5, countyElevationFt: 648, climateZone: '3A' },
  "Lee": { station: S_747900, distanceMi: 18.1, countyElevationFt: 200, climateZone: '3A' },
  "Lexington": { station: S_723100, distanceMi: 9.5, countyElevationFt: 436, climateZone: '3A' },
  "Marion": { station: S_723106, distanceMi: 22.7, countyElevationFt: 59, climateZone: '3A' },
  "Marlboro": { station: S_723116, distanceMi: 15.6, countyElevationFt: 146, climateZone: '3A' },
  "McCormick": { station: S_723124, distanceMi: 25.9, countyElevationFt: 391, climateZone: '3A' },
  "Newberry": { station: S_720596, distanceMi: 2.1, countyElevationFt: 439, climateZone: '3A' },
  "Oconee": { station: S_723118, distanceMi: 11.3, countyElevationFt: 907, climateZone: '3A' },
  "Orangeburg": { station: S_723115, distanceMi: 3.7, countyElevationFt: 169, climateZone: '3A' },
  "Pickens": { station: S_723118, distanceMi: 17.4, countyElevationFt: 988, climateZone: '3A' },
  "Richland": { station: S_723104, distanceMi: 6.9, countyElevationFt: 261, climateZone: '3A' },
  "Saluda": { station: S_720596, distanceMi: 21.1, countyElevationFt: 480, climateZone: '3A' },
  "Spartanburg": { station: S_723120, distanceMi: 12.7, countyElevationFt: 801, climateZone: '3A' },
  "Sumter": { station: S_747900, distanceMi: 6.0, countyElevationFt: 173, climateZone: '3A' },
  "Union": { station: S_720597, distanceMi: 23.1, countyElevationFt: 491, climateZone: '3A' },
  "Williamsburg": { station: S_720604, distanceMi: 9.9, countyElevationFt: 53, climateZone: '3A' },
  "York": { station: S_723117, distanceMi: 7.2, countyElevationFt: 654, climateZone: '3A' },
};

function buildCounty(state: 'NC' | 'SC', county: string, row: CountyRow): CountyClimate {
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
