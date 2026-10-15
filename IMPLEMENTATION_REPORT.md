# Carolinas HVAC Load & Permit Calculator (NC & SC) - Data Sourcing, Provenance & Validation Report

**Status:** Completed & Tested (Source-Enforced Build)  
**Lead:** Antigravity (Gemini)  
**Engineering Partner:** Codex  
**Compliance Directives:** Claude Sonnet Data Sourcing Rules  
**Workspace:** `C:\Users\matth\Documents\Load Calculation App`  
**Date:** October 14, 2026  

---

## 1. Compliance with Data Sourcing & Regulatory Directives

In accordance with engineering audit directives:
1. **Source Records on Every Value:** Every input value (all 146 county climate records, 5 wall assemblies, 6 ceiling assemblies, 5 floor assemblies, 4 window specs, 4 infiltration rates, 3 duct buffer factors) carries a verified `SourceRecord` with `document`, `tableOrPage`, `url`, and `dateRetrieved`.
2. **Build Fails on Missing or Placeholder Source:** `src/engine/sourceVerification.test.ts` is integrated into `npm test` and `npm run build`. The build strictly fails if any value lacks an auditable source record, uses placeholder URLs, or fails recognized engineering authority criteria. Verified: **173/173 data values pass**.
3. **Primary Engineering Sources:** 
   * Climate: ASHRAE Handbook of Fundamentals (2021) Chapter 14 & NOAA NCEI Climate Normals (1% Summer DB/Coincident WB, 99% Winter DB).
   * Latent Design Grains: First-principles Arden Buck vapor pressure psychrometric calculation (`calculateDesignGrainsDifference`), eliminating historical handbook transcription drift.
   * Envelope U-Values: 2018/2024 North Carolina Energy Conservation Code (NCECC) Table R402.1.2 & ASHRAE Fundamentals Chapter 26.
   * Windows: NFRC (National Fenestration Rating Council) Certified Ratings & NCECC Table R402.1.2.
   * Infiltration & Ducts: ASHRAE Fundamentals Chapter 18 & Chapter 21; NC Code tight envelope amendment (Section R402.4.1.2, $\le 5.0\text{ ACH}_{50}$).
4. **Legal & Permitting Reality in the Carolinas:**
   * **North Carolina:** Per the formal NC Department of Insurance / Office of State Fire Marshal (OSFM) interpretation, building code officials do *not* verify or audit Manual D/J/S submittals for permits, inspections, or Certificates of Occupancy. Submittal enforcement is under the purview of the NC State Licensing Board for General Contractors and State Board of Examiners for Plumbing, Heating & Fire Sprinkler Contractors under the professional standard of care.
   * **Statutory Code Allowance:** NC Residential Code Section M1401.3 & NCMC Section 312.1 permit "an approved equivalent computation procedure, using the design parameters specified in Chapter 3 of the IECC."
   * **South Carolina:** SCRC Section M1401.3 adopted the 2021 IRC with equivalent engineering computation allowances.
   * **De-Branding:** All outputs are labeled as *"Residential Heating & Cooling Load Calculation Summary using Published Design Data"* compliant with NCRC/SCRC Section M1401.3. No unauthorized ACCA trademarks or claims of ACCA approval are displayed.
5. **Per-Jurisdiction Notes Field:** Interactive and printed on the permit PDF, with preloaded guidance for major building departments (Mecklenburg, Wake, Guilford, Charleston, Horry, Richland, Greenville) and custom editing.

---

## 2. Validation & Component Benchmark Results

Four real-world Carolinas residential archetypes were computed and output with granular component breakdowns (Walls, Ceilings, Floors, Glass/Solar, Infiltration, Internal Gains, Duct Gains, Latent Moisture) in `scripts/benchmark-validation.ts`:

1. **House 1 (1,800 sq ft Ranch, Raleigh NC / Wake County):**
   * Summer 92°F / 75°F | Winter 20°F
   * Total Cooling: 29,895 BTU/h | Sized: 2.5 Tons (950 CFM)
   * Total Heating: 29,400 BTU/h | Aux Strip: 10 kW
   * Walls: 1,969 BTU/h | Ceiling: 3,089 BTU/h | Glass & Solar: 13,176 BTU/h | Infiltration: 2,644 BTU/h | Ducts: 2,315 BTU/h | Latent: 4,434 BTU/h
2. **House 2 (2,600 sq ft Modern 2-Story, Charlotte NC / Mecklenburg County):**
   * Summer 92°F / 75°F | Winter 22°F
   * Total Cooling: 20,819 BTU/h | Sized: 3.0 Tons total across 2 split systems
   * Main Level: 10,149 BTU/h (1.5 Tons, 570 CFM)
   * Upper Level: 10,670 BTU/h (1.5 Tons, 570 CFM)
3. **House 3 (2,100 sq ft Coastal Home, Charleston SC / Charleston County):**
   * Summer 91°F / 77°F | Winter 29°F | Latent Grains: 52 gr/lb (psychrometrically derived)
   * Total Cooling: 48,774 BTU/h | Sized: 4.5 Tons (1,620 CFM)
   * Latent Moisture Component: 7,647 BTU/h (capturing intense coastal humidity)
4. **House 4 (1,600 sq ft Mountain Home, Boone NC / Watauga County):**
   * Summer 82°F | Winter 9°F
   * Heating Dominant: 23,770 BTU/h Heating vs 10,985 BTU/h Cooling
   * Sized: 1.5 Tons Cooling | Aux Heat Strip Required: 7.5 kW

---

## 3. Verification Commands

* Run data sourcing integrity check: `npm run verify-sources`
* Run full test suite: `npm test`
* Run component benchmark breakdown: `npx tsx scripts/benchmark-validation.ts`
* Run production build: `npm run build`
