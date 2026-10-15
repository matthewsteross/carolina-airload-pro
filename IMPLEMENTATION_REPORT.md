# Carolinas HVAC Load & Permit Calculator (NC & SC) - Data Sourcing, Provenance & Validation Report

**Status:** Completed & Tested (Source-Enforced Build)  
**Lead:** Antigravity (Gemini)  
**Engineering Partner:** Codex  
**Compliance Directives:** Claude Sonnet Data Sourcing Rules  
**Workspace:** `C:\Users\matth\Documents\Load Calculation App`  
**Date:** October 14, 2026  

---

## 1. Compliance with Data Sourcing Directives

In accordance with Claude Sonnet's directives:
1. **Source Records on Every Value:** Every input value (all 146 county climate records, 5 wall assemblies, 6 ceiling assemblies, 5 floor assemblies, 4 window specs, 4 infiltration rates, 3 duct buffer factors) carries a verified `SourceRecord` with `document`, `tableOrPage`, `url`, and `dateRetrieved`.
2. **Build Fails on Missing Source:** Added `src/engine/sourceVerification.test.ts` to `npm test` and `npm run build`. The build strictly fails if any value lacks an auditable source record. Verified: **173/173 data values pass**.
3. **No Values from Model Memory:** 
   * Climate: ASHRAE Handbook of Fundamentals (2021) Chapter 14 & NOAA NCEI Climate Normals.
   * Envelope U-Values: 2018/2024 North Carolina Energy Conservation Code (NCECC) Table R402.1.2 & ASHRAE Fundamentals Chapter 26.
   * Windows: NFRC (National Fenestration Rating Council) Certified Ratings & NCECC Table R402.1.2.
   * Infiltration & Ducts: ASHRAE Fundamentals Chapter 18 & Chapter 21.
4. **Single Method per Job:** Each calculation uses unified ASHRAE / State Energy Code design data.
5. **De-Branding:** All output is labeled as *"Residential Heating & Cooling Load Calculation Summary using Published Design Data"* compliant with NCRC Section M1401.3 / SCRC Section M1401.3. No unauthorized ACCA trademarks or claims of ACCA approval are displayed.
6. **Per-Jurisdiction Notes Field:** Interactive and printed on the permit PDF, with preloaded guidance for major building departments (Mecklenburg, Wake, Guilford, Charleston, Horry, Richland, Greenville) and custom editing.

---

## 2. Validation & Component Benchmark Results

Four real-world Carolinas residential archetypes were computed and output with granular component breakdowns (Walls, Ceilings, Floors, Glass/Solar, Infiltration, Internal Gains, Duct Gains, Latent Moisture) in `scripts/benchmark-validation.ts`:

1. **House 1 (1,800 sq ft Ranch, Raleigh NC / Wake County):**
   * Summer 92°F / 75°F | Winter 20°F
   * Total Cooling: 29,251 BTU/h | Sized: 2.5 Tons (950 CFM)
   * Total Heating: 27,321 BTU/h | Aux Strip: 7.5 kW
   * Glass & Solar: 13,176 BTU/h | Infiltration: 2,644 BTU/h | Latent: 4,640 BTU/h
2. **House 2 (2,600 sq ft Modern 2-Story, Charlotte NC / Mecklenburg County):**
   * Summer 92°F / 75°F | Winter 22°F
   * Main Level: 11,843 BTU/h (1.5 Tons, 570 CFM)
   * Upper Level: 12,806 BTU/h (1.5 Tons, 570 CFM)
   * Total House: 3.0 Tons across 2 split systems
3. **House 3 (2,100 sq ft Coastal Home, Charleston SC / Charleston County):**
   * Summer 91°F / 77°F | Winter 29°F | Latent Grains: 54 gr/lb
   * Total Cooling: 47,143 BTU/h | Sized: 4.0 Tons (1,440 CFM)
   * Latent Moisture Component: 7,917 BTU/h (17% of total load, capturing coastal humidity)
4. **House 4 (1,600 sq ft Mountain Home, Boone NC / Watauga County):**
   * Summer 82°F | Winter 9°F
   * Heating Dominant: 23,770 BTU/h Heating vs 13,177 BTU/h Cooling
   * Sized: 1.5 Tons Cooling | Aux Heat Strip Required: 7.5 kW

---

## 3. Verification Commands

* Run data sourcing integrity check: `npm run verify-sources`
* Run full test suite: `npm test`
* Run component benchmark breakdown: `npx tsx scripts/benchmark-validation.ts`
* Run production build: `npm run build`
