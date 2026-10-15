# Carolina AirLoad Pro: How the Numbers Are Made

**Updated:** October 15, 2026 (Claude review pass)
**Workspace:** `C:\Users\matth\Documents\Load Calculation App`

This is a simplified heat-balance load calculation for residential HVAC sizing in NC and SC. It is not ACCA Manual J software and does not claim to be.

---

## 1. Legal basis (checked against primary sources)

- **North Carolina:** The 2019 NC DOI / OSFM interpretation of NCMC 312.1 and NCRC M1401.3 says a load calculation is still a code requirement. It also says code officials do not verify or review Manual D/J/S submittals for permits, inspections or certificates of occupancy. Enforcement sits with the contractor licensing boards. The code text allows "an approved equivalent computation procedure" and "other approved heating and cooling calculation methodologies," so Manual J specifically is not required.
- **South Carolina:** The state adopted the 2021 IRC, effective January 1, 2023. No SC modification to M1401.3 was found in the state's 2021 IRC modification list. That is an absence in a search, not proof. Enforcement practice is unverified.

## 2. What each input is based on

| Input | Basis | Status |
|---|---|---|
| County design temperatures (99% heating DB, 1% cooling DB / mean coincident WB) | ASHRAE Handbook - Fundamentals 2021, Ch. 14, per station, from ASHRAE's climatic design tool | **Retrieved** 2026-10-15 for 91 stations covering all 146 counties. See `scripts/climate/` |
| Design humidity (grains) | Computed from the station DB/WB at station pressure | Checked against ASHRAE's published humidity ratios (Raleigh, Boone, Charleston within 0.5%) |
| Wall, ceiling and floor U-values | Typical assembly values. R-13 wall (0.084), R-20 wall (0.060) and R-38 ceiling (0.030) match the IECC equivalent U-factor tables | **Typical values** |
| Window U / SHGC | Typical ratings by glazing type. Use the NFRC sticker when known | **Typical values** |
| Infiltration air changes, duct gain/loss %, occupant and appliance gains, solar glass factor (75 Btu/h·ft² × SHGC × orientation factor) | Rules of thumb consistent with ASHRAE Fundamentals Ch. 17 and Ch. 21 | **Typical values**, the least precise part of the method |

The app's Data Sources panel and the PDF show this split, so nobody signs a sheet claiming more than is true.

## 3. Changes in this pass

1. **Climate data replaced.** The old county table was hand-typed. Its winter design temperatures were too cold almost everywhere: 2.6°F colder on average, and up to 8°F colder in the mountains. Raleigh was 20°F against ASHRAE's 23.6°F, and Boone was 9°F against 15.1°F. That overstated heating loads and strip-heat sizes. Summer temperatures were close, within about ±3°F.
2. **Altitude correction.** The 1.08 and 0.68 air constants are scaled by station pressure (about 0.90 in Boone). Humidity is computed at station pressure. Boone's design grains go from 4 to 15.
3. **Envelope U-values** moved to the IECC equivalent values where they exist. The old R-38 ceiling value (0.026) was actually the R-49 value.
4. **Coastal airflow default** (360 vs 380 CFM/ton) now keys off the design humidity (50 or more grains), not an unverified climate-zone label.
5. **Tonnage:** The app shows the calculated tons needed, with the nearest standard size as a label. A new "Unit Being Installed" field per floor defaults to the nearest size and can be overridden in the field. Ducts and registers are sized to the installed unit's blower airflow, because a 0.8-ton floor served by a 1.5-ton unit still pushes about 570 CFM through its ducts.
6. **PDF wording.** The PDF no longer claims "verified" data, an unchecked 95-115% sizing check, or that "no rules-of-thumb were used." The certification now describes what was actually done.
7. **Tests** check against independent numbers:
   - ASHRAE station values and ASHRAE published humidity ratios.
   - A step-by-step hand calculation of House 1.
   - Bookkeeping invariants: components sum to totals, and room CFMs sum to the floor.
   - Direction checks: older envelope means more load, west glass gains more than north, and Boone loses more heat than Charlotte.

## 4. Benchmark houses (`npx tsx scripts/benchmark-validation.ts`)

| House | Before this pass | Now |
|---|---|---|
| 1. 1,800 sf ranch, Raleigh (Wake) | 29,895 cool / 29,400 heat, 10 kW strip | 30,605 cool (2.55 T) / 27,323 heat, 7.5 kW strip |
| 2. 2,600 sf 2-story, Charlotte (Mecklenburg) | 20,819 cool | 20,791 cool (1.73 T total, served by two 1.5 T units) |
| 3. 2,100 sf coastal, Charleston | 48,774 cool | 49,807 cool (4.15 T) |
| 4. 1,600 sf mountain, Boone (Watauga) | 10,985 cool / 23,770 heat | 12,043 cool / 21,731 heat |

House 1 is worked by hand in `src/engine/manualJ.test.ts`, and the engine matches to the Btu.

## 5. Known limits

- The solar glass factor, duct percentages and infiltration rates are typical allowances. They are not computed from house-specific geometry or a blower-door test.
- In the mountains, much of a county can sit well above its weather station (Haywood, Jackson, Swain, Watauga). Homes on high ground can see colder design temperatures than shown. The Data Sources panel flags these counties.
- IECC climate-zone labels are display-only and have not been re-verified.

## 6. Commands

- `npm test`: provenance checks, physics checks against ASHRAE data, and the engine tests, including the House 1 hand calculation.
- `npx tsx scripts/benchmark-validation.ts`: the four benchmark houses.
- `npm run build`: the tests plus a production build.
