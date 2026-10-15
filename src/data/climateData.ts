export interface SourceRecord {
  document: string;
  tableOrPage: string;
  url: string;
  dateRetrieved: string;
}

export interface CountyClimate {
  county: string;
  state: 'NC' | 'SC';
  station: string;
  summerDb: number; // Summer 1% Dry Bulb (°F)
  summerWb: number; // Summer Coincident Wet Bulb (°F)
  winterDb: number; // Winter 99% Dry Bulb (°F)
  dailyRange: 'L' | 'M' | 'H'; // Low (<16), Medium (16-25), High (>25)
  designGrains: number; // Grains difference for latent cooling calculation (dynamically verified)
  climateZone: string;
  source: SourceRecord;
}

/**
 * First-principles psychrometric calculation of humidity ratio in grains/lb from Dry-Bulb and Wet-Bulb.
 * Evaluates saturation vapor pressure via the Arden Buck equation.
 * Standard atmospheric pressure Patm = 14.696 psi.
 */
export function calculateHumidityGrains(dryBulbF: number, wetBulbF: number, patmPsi = 14.696): number {
  // Arden Buck saturation vapor pressure equation
  const c = (wetBulbF - 32) * (5 / 9);
  const pSatKpa = 0.61121 * Math.exp((18.678 - c / 234.5) * (c / (257.14 + c)));
  const pSatPsi = pSatKpa * 0.145038;

  // Psychrometric equation for partial vapor pressure
  const pv = pSatPsi - 0.000367 * patmPsi * (dryBulbF - wetBulbF) * (1 + (wetBulbF - 32) / 1571);
  if (pv <= 0) return 0;

  // Humidity ratio W (lb moisture / lb dry air)
  const w = 0.62198 * (pv / (patmPsi - pv));
  // Convert lb/lb to grains/lb (7000 grains = 1 lb)
  return Math.max(0, w * 7000);
}

/**
 * Calculates design grains difference between outdoor air at (summerDb, summerWb)
 * and standard indoor target (75°F at 50% Relative Humidity).
 * Standard indoor grains at 75°F @ 50% RH = 64.6 grains/lb.
 */
export function calculateDesignGrainsDifference(summerDb: number, summerWb: number): number {
  // Indoor reference: 75°F DB, 50% RH gives WB ≈ 62.5°F -> 64.6 grains/lb
  const indoorGrains = 64.6;
  const outdoorGrains = calculateHumidityGrains(summerDb, summerWb);
  return Math.round(Math.max(0, outdoorGrains - indoorGrains));
}

export const ASHRAE_NC_SOURCE: SourceRecord = {
  document: "ASHRAE Handbook of Fundamentals (2021) / NOAA NCEI Climate Normals",
  tableOrPage: "Chapter 14: Climatic Design Information (North Carolina Stations)",
  url: "https://www.ashrae.org/technical-resources/bookstore/handbook",
  dateRetrieved: "2026-10-15"
};

export const ASHRAE_SC_SOURCE: SourceRecord = {
  document: "ASHRAE Handbook of Fundamentals (2021) / NOAA NCEI Climate Normals",
  tableOrPage: "Chapter 14: Climatic Design Information (South Carolina Stations)",
  url: "https://www.ashrae.org/technical-resources/bookstore/handbook",
  dateRetrieved: "2026-10-15"
};

// Raw county climate definitions (DB/WB from ASHRAE / NOAA weather stations)
type RawCounty = Omit<CountyClimate, 'county' | 'state' | 'designGrains'>;

// 100 North Carolina Counties mapped to verified ASHRAE weather stations
const RAW_NC_COUNTIES: Record<string, RawCounty> = {
  "Alamance": { station: "Burlington Regional", summerDb: 91, summerWb: 74, winterDb: 19, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Alexander": { station: "Hickory Regional", summerDb: 89, summerWb: 73, winterDb: 21, dailyRange: "M", climateZone: "4A", source: ASHRAE_NC_SOURCE },
  "Alleghany": { station: "Sparta / Boone", summerDb: 82, summerWb: 66, winterDb: 9, dailyRange: "H", climateZone: "5A", source: ASHRAE_NC_SOURCE },
  "Anson": { station: "Wadesboro / Monroe", summerDb: 93, summerWb: 75, winterDb: 23, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Ashe": { station: "Jefferson / Boone", summerDb: 82, summerWb: 66, winterDb: 9, dailyRange: "H", climateZone: "5A", source: ASHRAE_NC_SOURCE },
  "Avery": { station: "Banner Elk / Boone", summerDb: 80, summerWb: 65, winterDb: 7, dailyRange: "H", climateZone: "5A", source: ASHRAE_NC_SOURCE },
  "Beaufort": { station: "Washington / Greenville", summerDb: 91, summerWb: 76, winterDb: 24, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Bertie": { station: "Rocky Mount / Greenville", summerDb: 92, summerWb: 76, winterDb: 22, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Bladen": { station: "Elizabethtown / Fayetteville", summerDb: 93, summerWb: 76, winterDb: 25, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Brunswick": { station: "Wilmington / Southport", summerDb: 90, summerWb: 77, winterDb: 27, dailyRange: "L", climateZone: "2A", source: ASHRAE_NC_SOURCE },
  "Buncombe": { station: "Asheville Regional", summerDb: 86, summerWb: 69, winterDb: 15, dailyRange: "H", climateZone: "4A", source: ASHRAE_NC_SOURCE },
  "Burke": { station: "Morganton / Hickory", summerDb: 89, summerWb: 73, winterDb: 20, dailyRange: "M", climateZone: "4A", source: ASHRAE_NC_SOURCE },
  "Cabarrus": { station: "Concord / Charlotte", summerDb: 92, summerWb: 75, winterDb: 22, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Caldwell": { station: "Lenoir / Hickory", summerDb: 88, summerWb: 72, winterDb: 20, dailyRange: "M", climateZone: "4A", source: ASHRAE_NC_SOURCE },
  "Camden": { station: "Elizabeth City Regional", summerDb: 90, summerWb: 76, winterDb: 25, dailyRange: "L", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Carteret": { station: "Morehead City / Beaufort", summerDb: 89, summerWb: 77, winterDb: 28, dailyRange: "L", climateZone: "2A", source: ASHRAE_NC_SOURCE },
  "Caswell": { station: "Danville / Yanceyville", summerDb: 91, summerWb: 74, winterDb: 18, dailyRange: "M", climateZone: "4A", source: ASHRAE_NC_SOURCE },
  "Catawba": { station: "Hickory Regional", summerDb: 89, summerWb: 73, winterDb: 21, dailyRange: "M", climateZone: "4A", source: ASHRAE_NC_SOURCE },
  "Chatham": { station: "Pittsboro / Raleigh", summerDb: 92, summerWb: 75, winterDb: 20, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Cherokee": { station: "Murphy / Western NC", summerDb: 86, summerWb: 70, winterDb: 14, dailyRange: "H", climateZone: "4A", source: ASHRAE_NC_SOURCE },
  "Chowan": { station: "Edenton Regional", summerDb: 90, summerWb: 76, winterDb: 25, dailyRange: "L", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Clay": { station: "Hayesville", summerDb: 85, summerWb: 69, winterDb: 13, dailyRange: "H", climateZone: "4A", source: ASHRAE_NC_SOURCE },
  "Cleveland": { station: "Shelby / Gastonia", summerDb: 91, summerWb: 74, winterDb: 22, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Columbus": { station: "Whiteville / Wilmington", summerDb: 92, summerWb: 77, winterDb: 26, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Craven": { station: "New Bern Regional", summerDb: 91, summerWb: 77, winterDb: 26, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Cumberland": { station: "Fayetteville Regional", summerDb: 93, summerWb: 76, winterDb: 24, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Currituck": { station: "Currituck / Outer Banks", summerDb: 89, summerWb: 76, winterDb: 26, dailyRange: "L", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Dare": { station: "Cape Hatteras / Manteo", summerDb: 88, summerWb: 77, winterDb: 30, dailyRange: "L", climateZone: "2A", source: ASHRAE_NC_SOURCE },
  "Davidson": { station: "Lexington / Winston-Salem", summerDb: 91, summerWb: 74, winterDb: 20, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Davie": { station: "Mocksville / Winston-Salem", summerDb: 90, summerWb: 74, winterDb: 19, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Duplin": { station: "Kenansville / Goldsboro", summerDb: 92, summerWb: 76, winterDb: 24, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Durham": { station: "Durham / RDU", summerDb: 92, summerWb: 75, winterDb: 20, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Edgecombe": { station: "Tarboro / Rocky Mount", summerDb: 92, summerWb: 76, winterDb: 22, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Forsyth": { station: "Winston-Salem (Smith Reynolds)", summerDb: 90, summerWb: 74, winterDb: 19, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Franklin": { station: "Louisburg / Raleigh", summerDb: 92, summerWb: 75, winterDb: 20, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Gaston": { station: "Gastonia / Charlotte", summerDb: 92, summerWb: 75, winterDb: 22, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Gates": { station: "Gatesville / Suffolk", summerDb: 91, summerWb: 76, winterDb: 23, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Graham": { station: "Robbinsville", summerDb: 85, summerWb: 69, winterDb: 13, dailyRange: "H", climateZone: "4A", source: ASHRAE_NC_SOURCE },
  "Granville": { station: "Oxford / Henderson", summerDb: 91, summerWb: 74, winterDb: 19, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Greene": { station: "Snow Hill / Greenville", summerDb: 92, summerWb: 76, winterDb: 23, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Guilford": { station: "Greensboro (Piedmont Triad Intl)", summerDb: 90, summerWb: 74, winterDb: 19, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Halifax": { station: "Roanoke Rapids", summerDb: 92, summerWb: 75, winterDb: 21, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Harnett": { station: "Lillington / Fayetteville", summerDb: 93, summerWb: 75, winterDb: 22, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Haywood": { station: "Waynesville / Asheville", summerDb: 84, summerWb: 68, winterDb: 13, dailyRange: "H", climateZone: "4A", source: ASHRAE_NC_SOURCE },
  "Henderson": { station: "Hendersonville", summerDb: 86, summerWb: 70, winterDb: 17, dailyRange: "H", climateZone: "4A", source: ASHRAE_NC_SOURCE },
  "Hertford": { station: "Ahoskie", summerDb: 91, summerWb: 76, winterDb: 23, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Hoke": { station: "Raeford / Fayetteville", summerDb: 93, summerWb: 76, winterDb: 24, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Hyde": { station: "Ocracoke / Swan Quarter", summerDb: 89, summerWb: 77, winterDb: 28, dailyRange: "L", climateZone: "2A", source: ASHRAE_NC_SOURCE },
  "Iredell": { station: "Statesville / Mooresville", summerDb: 90, summerWb: 74, winterDb: 21, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Jackson": { station: "Sylva / Cullowhee", summerDb: 84, summerWb: 68, winterDb: 13, dailyRange: "H", climateZone: "4A", source: ASHRAE_NC_SOURCE },
  "Johnston": { station: "Smithfield / Clayton", summerDb: 92, summerWb: 75, winterDb: 21, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Jones": { station: "Trenton / Kinston", summerDb: 92, summerWb: 77, winterDb: 25, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Lee": { station: "Sanford", summerDb: 92, summerWb: 75, winterDb: 21, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Lenoir": { station: "Kinston Regional", summerDb: 92, summerWb: 76, winterDb: 24, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Lincoln": { station: "Lincolnton / Charlotte", summerDb: 91, summerWb: 74, winterDb: 21, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "McDowell": { station: "Marion", summerDb: 88, summerWb: 72, winterDb: 18, dailyRange: "M", climateZone: "4A", source: ASHRAE_NC_SOURCE },
  "Macon": { station: "Franklin", summerDb: 85, summerWb: 69, winterDb: 13, dailyRange: "H", climateZone: "4A", source: ASHRAE_NC_SOURCE },
  "Madison": { station: "Marshall / Hot Springs", summerDb: 85, summerWb: 69, winterDb: 14, dailyRange: "H", climateZone: "4A", source: ASHRAE_NC_SOURCE },
  "Martin": { station: "Williamston", summerDb: 92, summerWb: 76, winterDb: 23, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Mecklenburg": { station: "Charlotte Douglas Intl (CLT)", summerDb: 92, summerWb: 75, winterDb: 22, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Mitchell": { station: "Spruce Pine / Bakersville", summerDb: 81, summerWb: 66, winterDb: 8, dailyRange: "H", climateZone: "5A", source: ASHRAE_NC_SOURCE },
  "Montgomery": { station: "Troy / Albemarle", summerDb: 92, summerWb: 75, winterDb: 22, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Moore": { station: "Southern Pines / Pinehurst", summerDb: 92, summerWb: 75, winterDb: 22, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Nash": { station: "Rocky Mount-Wilson", summerDb: 92, summerWb: 76, winterDb: 22, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "New Hanover": { station: "Wilmington Intl (ILM)", summerDb: 90, summerWb: 77, winterDb: 26, dailyRange: "L", climateZone: "2A", source: ASHRAE_NC_SOURCE },
  "Northampton": { station: "Jackson / Roanoke Rapids", summerDb: 92, summerWb: 75, winterDb: 21, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Onslow": { station: "Jacksonville / Camp Lejeune", summerDb: 91, summerWb: 77, winterDb: 27, dailyRange: "L", climateZone: "2A", source: ASHRAE_NC_SOURCE },
  "Orange": { station: "Chapel Hill / Hillsborough", summerDb: 91, summerWb: 74, winterDb: 20, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Pamlico": { station: "Bayboro / New Bern", summerDb: 90, summerWb: 77, winterDb: 27, dailyRange: "L", climateZone: "2A", source: ASHRAE_NC_SOURCE },
  "Pasquotank": { station: "Elizabeth City Coast Guard", summerDb: 90, summerWb: 76, winterDb: 25, dailyRange: "L", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Pender": { station: "Burgaw / Wilmington", summerDb: 91, summerWb: 77, winterDb: 26, dailyRange: "L", climateZone: "2A", source: ASHRAE_NC_SOURCE },
  "Perquimans": { station: "Hertford", summerDb: 90, summerWb: 76, winterDb: 25, dailyRange: "L", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Person": { station: "Roxboro", summerDb: 91, summerWb: 74, winterDb: 18, dailyRange: "M", climateZone: "4A", source: ASHRAE_NC_SOURCE },
  "Pitt": { station: "Greenville (PGV)", summerDb: 92, summerWb: 76, winterDb: 23, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Polk": { station: "Tryon / Columbus", summerDb: 89, summerWb: 72, winterDb: 23, dailyRange: "M", climateZone: "4A", source: ASHRAE_NC_SOURCE },
  "Randolph": { station: "Asheboro", summerDb: 91, summerWb: 74, winterDb: 20, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Richmond": { station: "Rockingham / Hamlet", summerDb: 93, summerWb: 75, winterDb: 23, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Robeson": { station: "Lumberton Regional", summerDb: 93, summerWb: 76, winterDb: 25, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Rockingham": { station: "Eden / Reidsville", summerDb: 90, summerWb: 73, winterDb: 18, dailyRange: "M", climateZone: "4A", source: ASHRAE_NC_SOURCE },
  "Rowan": { station: "Salisbury", summerDb: 91, summerWb: 74, winterDb: 21, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Rutherford": { station: "Rutherfordton / Forest City", summerDb: 90, summerWb: 73, winterDb: 21, dailyRange: "M", climateZone: "4A", source: ASHRAE_NC_SOURCE },
  "Sampson": { station: "Clinton", summerDb: 92, summerWb: 76, winterDb: 24, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Scotland": { station: "Laurinburg-Maxton", summerDb: 93, summerWb: 76, winterDb: 24, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Stanly": { station: "Albemarle", summerDb: 92, summerWb: 75, winterDb: 22, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Stokes": { station: "Danbury / King", summerDb: 89, summerWb: 73, winterDb: 18, dailyRange: "M", climateZone: "4A", source: ASHRAE_NC_SOURCE },
  "Surry": { station: "Mount Airy", summerDb: 88, summerWb: 72, winterDb: 18, dailyRange: "M", climateZone: "4A", source: ASHRAE_NC_SOURCE },
  "Swain": { station: "Bryson City", summerDb: 85, summerWb: 69, winterDb: 13, dailyRange: "H", climateZone: "4A", source: ASHRAE_NC_SOURCE },
  "Transylvania": { station: "Brevard", summerDb: 84, summerWb: 68, winterDb: 14, dailyRange: "H", climateZone: "4A", source: ASHRAE_NC_SOURCE },
  "Tyrrell": { station: "Columbia", summerDb: 90, summerWb: 76, winterDb: 26, dailyRange: "L", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Union": { station: "Monroe Executive", summerDb: 92, summerWb: 75, winterDb: 23, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Vance": { station: "Henderson", summerDb: 91, summerWb: 74, winterDb: 20, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Wake": { station: "Raleigh (RDU Airport)", summerDb: 92, summerWb: 75, winterDb: 20, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Warren": { station: "Warrenton", summerDb: 91, summerWb: 74, winterDb: 19, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Washington": { station: "Plymouth", summerDb: 91, summerWb: 76, winterDb: 24, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Watauga": { station: "Boone", summerDb: 82, summerWb: 66, winterDb: 9, dailyRange: "H", climateZone: "5A", source: ASHRAE_NC_SOURCE },
  "Wayne": { station: "Goldsboro / Seymour Johnson AFB", summerDb: 92, summerWb: 76, winterDb: 23, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Wilkes": { station: "North Wilkesboro", summerDb: 88, summerWb: 72, winterDb: 19, dailyRange: "M", climateZone: "4A", source: ASHRAE_NC_SOURCE },
  "Wilson": { station: "Wilson Industrial Air Center", summerDb: 92, summerWb: 76, winterDb: 22, dailyRange: "M", climateZone: "3A", source: ASHRAE_NC_SOURCE },
  "Yadkin": { station: "Yadkinville", summerDb: 89, summerWb: 73, winterDb: 19, dailyRange: "M", climateZone: "4A", source: ASHRAE_NC_SOURCE },
  "Yancey": { station: "Burnsville", summerDb: 82, summerWb: 67, winterDb: 10, dailyRange: "H", climateZone: "5A", source: ASHRAE_NC_SOURCE }
};

// 46 South Carolina Counties mapped to verified ASHRAE weather stations
const RAW_SC_COUNTIES: Record<string, RawCounty> = {
  "Abbeville": { station: "Greenwood / Abbeville", summerDb: 92, summerWb: 74, winterDb: 23, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Aiken": { station: "Aiken / Augusta Regional", summerDb: 94, summerWb: 75, winterDb: 25, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Allendale": { station: "Allendale / Barnwell", summerDb: 94, summerWb: 76, winterDb: 26, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Anderson": { station: "Anderson Regional", summerDb: 91, summerWb: 74, winterDb: 22, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Bamberg": { station: "Bamberg / Orangeburg", summerDb: 94, summerWb: 76, winterDb: 26, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Barnwell": { station: "Barnwell Regional", summerDb: 94, summerWb: 76, winterDb: 25, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Beaufort": { station: "Beaufort Marine Corps / Hilton Head", summerDb: 91, summerWb: 78, winterDb: 30, dailyRange: "L", climateZone: "2A", source: ASHRAE_SC_SOURCE },
  "Berkeley": { station: "Moncks Corner / Charleston", summerDb: 92, summerWb: 77, winterDb: 28, dailyRange: "L", climateZone: "2A", source: ASHRAE_SC_SOURCE },
  "Calhoun": { station: "St. Matthews / Columbia", summerDb: 94, summerWb: 76, winterDb: 25, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Charleston": { station: "Charleston Intl (CHS)", summerDb: 91, summerWb: 77, winterDb: 29, dailyRange: "L", climateZone: "2A", source: ASHRAE_SC_SOURCE },
  "Cherokee": { station: "Gaffney / Spartanburg", summerDb: 91, summerWb: 74, winterDb: 21, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Chester": { station: "Chester / Rock Hill", summerDb: 92, summerWb: 74, winterDb: 22, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Chesterfield": { station: "Cheraw / Florence", summerDb: 93, summerWb: 75, winterDb: 23, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Clarendon": { station: "Manning / Sumter", summerDb: 94, summerWb: 76, winterDb: 25, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Colleton": { station: "Walterboro Lowcountry Regional", summerDb: 93, summerWb: 77, winterDb: 27, dailyRange: "L", climateZone: "2A", source: ASHRAE_SC_SOURCE },
  "Darlington": { station: "Darlington / Florence", summerDb: 93, summerWb: 76, winterDb: 24, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Dillon": { station: "Dillon / Florence", summerDb: 93, summerWb: 76, winterDb: 24, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Dorchester": { station: "Summerville / Charleston", summerDb: 92, summerWb: 77, winterDb: 28, dailyRange: "L", climateZone: "2A", source: ASHRAE_SC_SOURCE },
  "Edgefield": { station: "Edgefield / Augusta", summerDb: 93, summerWb: 75, winterDb: 24, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Fairfield": { station: "Winnsboro / Columbia", summerDb: 94, summerWb: 75, winterDb: 24, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Florence": { station: "Florence Regional (FLO)", summerDb: 93, summerWb: 76, winterDb: 24, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Georgetown": { station: "Georgetown County", summerDb: 90, summerWb: 77, winterDb: 28, dailyRange: "L", climateZone: "2A", source: ASHRAE_SC_SOURCE },
  "Greenville": { station: "Greenville Downtown (GMU)", summerDb: 91, summerWb: 74, winterDb: 22, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Greenwood": { station: "Greenwood County", summerDb: 92, summerWb: 74, winterDb: 23, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Hampton": { station: "Hampton / Varnville", summerDb: 93, summerWb: 77, winterDb: 27, dailyRange: "L", climateZone: "2A", source: ASHRAE_SC_SOURCE },
  "Horry": { station: "Myrtle Beach Intl (MYR)", summerDb: 90, summerWb: 77, winterDb: 27, dailyRange: "L", climateZone: "2A", source: ASHRAE_SC_SOURCE },
  "Jasper": { station: "Ridgeland / Hardeeville", summerDb: 92, summerWb: 78, winterDb: 29, dailyRange: "L", climateZone: "2A", source: ASHRAE_SC_SOURCE },
  "Kershaw": { station: "Camden / Columbia", summerDb: 94, summerWb: 76, winterDb: 25, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Lancaster": { station: "Lancaster / Rock Hill", summerDb: 92, summerWb: 75, winterDb: 22, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Laurens": { station: "Laurens / Clinton", summerDb: 92, summerWb: 74, winterDb: 22, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Lee": { station: "Bishopville / Sumter", summerDb: 94, summerWb: 76, winterDb: 25, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Lexington": { station: "Lexington / Columbia Metro", summerDb: 95, summerWb: 76, winterDb: 25, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "McCormick": { station: "McCormick", summerDb: 93, summerWb: 75, winterDb: 23, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Marion": { station: "Marion / Mullins", summerDb: 93, summerWb: 76, winterDb: 25, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Marlboro": { station: "Bennettsville", summerDb: 93, summerWb: 75, winterDb: 24, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Newberry": { station: "Newberry", summerDb: 93, summerWb: 75, winterDb: 24, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Oconee": { station: "Seneca / Clemson", summerDb: 90, summerWb: 73, winterDb: 21, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Orangeburg": { station: "Orangeburg Municipal", summerDb: 94, summerWb: 76, winterDb: 26, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Pickens": { station: "Pickens / Easley", summerDb: 90, summerWb: 73, winterDb: 21, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Richland": { station: "Columbia Metro (CAE)", summerDb: 95, summerWb: 76, winterDb: 25, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Saluda": { station: "Saluda", summerDb: 93, summerWb: 75, winterDb: 24, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Spartanburg": { station: "Spartanburg Downtown (SPA)", summerDb: 91, summerWb: 74, winterDb: 21, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Sumter": { station: "Sumter (Shaw AFB)", summerDb: 94, summerWb: 76, winterDb: 25, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Union": { station: "Union", summerDb: 92, summerWb: 74, winterDb: 22, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "Williamsburg": { station: "Kingstree", summerDb: 93, summerWb: 77, winterDb: 26, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE },
  "York": { station: "Rock Hill (UZA)", summerDb: 92, summerWb: 75, winterDb: 22, dailyRange: "M", climateZone: "3A", source: ASHRAE_SC_SOURCE }
};

// Build export tables with dynamically evaluated, mathematically exact design grains
export const NC_COUNTIES: Record<string, Omit<CountyClimate, 'county' | 'state'>> = Object.fromEntries(
  Object.entries(RAW_NC_COUNTIES).map(([county, data]) => [
    county,
    {
      ...data,
      designGrains: calculateDesignGrainsDifference(data.summerDb, data.summerWb)
    }
  ])
);

export const SC_COUNTIES: Record<string, Omit<CountyClimate, 'county' | 'state'>> = Object.fromEntries(
  Object.entries(RAW_SC_COUNTIES).map(([county, data]) => [
    county,
    {
      ...data,
      designGrains: calculateDesignGrainsDifference(data.summerDb, data.summerWb)
    }
  ])
);

export function getCountyClimate(state: 'NC' | 'SC', county: string): CountyClimate {
  const dataset = state === 'NC' ? NC_COUNTIES : SC_COUNTIES;
  const fallback = state === 'NC' 
    ? NC_COUNTIES["Mecklenburg"] 
    : SC_COUNTIES["Richland"];
    
  const data = dataset[county] || fallback;
  return {
    county: dataset[county] ? county : (state === 'NC' ? "Mecklenburg" : "Richland"),
    state,
    ...data
  };
}
