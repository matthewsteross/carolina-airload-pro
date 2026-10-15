# Review note for the Gemini team (from Claude, Oct 15, 2026)

## Context
Matthew asked me to verify the numbers in the load calculation app. I read the engine (`src/engine/loadCalculation.ts`), climate data, tests, benchmark script and both reports, and recomputed the benchmark houses with an independent script.

## What holds up
- Arithmetic is correct. Houses 1, 3 and 4 reproduce exactly (29,251 / 47,143 / 13,177 cooling; 27,321 / 23,770 heating). House 2 was not recomputed.
- Constants (1.08, 0.68, 3412, 12000) are correct. County counts are right (100 NC, 46 SC).
- Stored humidity grains match the county's own design temps (within 6 gr) for ~126 of 146 counties.
- 1.5 tons is the smallest ducted residential system, so the tonnage list starting at 1.5 is fine. I withdrew my "oversized" criticism of that.

## Legal/permit framing (corrected after checking primary sources)
- NC DOI/OSFM interpretation (2019, https://ncosfm.gov/media/1544/open): the load calculation is a code requirement, but code officials do NOT review or verify Manual D/J/S submittals for permits, inspections or CO. Enforcement is left to the NC contractor licensing board.
- NC 312.1 / M1401.3 do not require Manual J specifically. They allow "an approved equivalent computation procedure, using the design parameters specified in Chapter 3 of the IECC" and "other approved heating and cooling calculation methodologies."
- SC adopted the 2021 IRC (effective Jan 1, 2023). I found no SC modification to M1401.3 (searched the state's modification list, absence not proof). SC enforcement practice is unverified.
- Consequence: the project brief's claims that inspectors "require documented proof of an ACCA Manual J" and that the PDF is a "permit-ready Manual J/S" sheet are wrong for NC and unproven for SC. Reword the permit goal. The standard the app must meet is "published approved numbers," so input provenance is what matters.

## What the "100% verified / sourced" claim actually is
- `sourceVerification.test.ts` only checks that four source fields are non-empty strings. The URLs are generic (ashrae.org/bookstore etc.) and every `dateRetrieved` is today's date. Nothing was looked up.
- `physicsAudit.test.ts` re-checks constants against themselves (it even picks R-13.3 so the wall U-value passes).
- Treat climate values and U-values as unverified until real citations exist.

## Proposed work, in priority order

### 1. Replace unsourced inputs with citable ones (biggest item)
- Climate: pull 99% / 1% design temps (and coincident wet bulb) per county or station from an actual published table. Candidates: ASHRAE climatic design data, IRC Appendix D, or ACCA Manual J Table 1A. Record the exact table, edition and row per county. Fix labels (Manual J tables use 97.5% winter / 2.5% summer in some editions; app says 99% / 1%).
- Check the IECC Chapter 3 design parameters the NC code points to, including the indoor heating setpoint (app uses 70F; I recall the IECC may specify 72F, unverified) and the cooling setpoint (75F).
- Recompute designGrains from DB/WB instead of hand-typing. About 20 counties (mostly mountains, e.g. Watauga stored 22 vs ~5 derived) are inconsistent with their own temps.
- Wall/ceiling/window values: cite the actual NCECC/IECC table and edition. Note NCECC R402.1.2 lists R-values and U/SHGC maxes, not the U-factors the app uses for walls. Climate-zone checks: verify 2A/3A/4A/5A assignments per county against the adopted code.
- Infiltration labels: the "tight <= 3.0 ACH50 NC code" text may be wrong (I believe NC allows 5 ACH50). Verify. The natural-ACH values look about 2x the ACH50/N conversion, which is conservative.

### 2. Physics fixes that move the answer
- Slab floors: app applies a per-sq-ft factor (0.035 x 0.7 x dT) giving ~1,650 BTU/h for 1,400 sq ft. Perimeter method (F-factor x perimeter x dT) gives ~2,600-4,900. Switch to perimeter-based F-factors.
- Vented crawlspace heating: remove the 0.7 ground-temperature damping (air is near outdoor temp).
- Attic heat gain: the +22F buffer implies a 114F attic; the code comment says 130F+. Use a sourced attic temperature or CLTD, and treat sealed/spray-foam attics differently.
- Internal gains: 3 occupants + 1,200 BTU/h appliances are added per floor. Apply once per house (occupants = bedrooms + 1 is the usual convention).
- Solar glass gain: flat SHGC x 75 with south weighted 1.15 > balanced 1.0 > north 0.75. At summer peak south glass gains less than east/west. Use real orientation factors (SHGF/CLF or Manual J-style glass factors), split glass by orientation, and consider interior shading.

### 3. Smaller correctness items
- Room-by-room: BTU is split by area only but CFM also uses an exposure weight that is never normalized, so room CFMs do not sum to floor CFM, and 2-wall vs 3-wall rooms get the same weight.
- Register comment claims 450-600 FPM; actual face velocity at the table values is ~285 FPM. Fix the comment or the table.
- Duct size thresholds look 10-20% conservative vs typical ductulator values (from memory, not verified; check against a real friction chart).
- `selectEquipmentTonnage`: no 4.5 ton step (4.2 tons jumps to 5.0). Comment mentions a 95-115% window that is not enforced. Decide whether to enforce or remove the comment.
- Furnace sizing silently falls back to 120k BTU when load exceeds 96k output.

### 4. Tests and reports
- Replace tautological tests with checks against independent known answers (hand calcs or published example loads) for each component.
- Make the source check meaningful: require a non-generic table/page and a real edition, and fail on placeholder URLs.
- Update IMPLEMENTATION_REPORT.md and MULTI_MODEL_AUDIT.md: remove "100% verified" language, and correct the claim about inspector requirements.

## Open questions for Matthew and the team
- Which published load tables does Matthew already trust and use in the field? That could define what "approved numbers" means for this app.
- Does the tool still need to emit a Manual J/S-labeled document, or just a clear load summary with cited inputs?
- Is a mountain-county humidity fix urgent, or are coastal/Piedmont jobs the priority?
