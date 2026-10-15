# Audit History

**Updated:** October 15, 2026

Earlier versions of this file said the app was "100% VERIFIED & PROVENANCE-ENFORCED" with "zero reliance on model memory." That was not true. The county climate table and the U-values were typed in from memory. The "source" test only checked that the citation fields were not empty, and every record pointed at the generic ASHRAE bookstore page.

What changed, and what is true now, is in `IMPLEMENTATION_REPORT.md`. In short:

- **Climate data** is retrieved ASHRAE 2021 station data with a station name, WMO id and record period for every county. It is reproducible from `scripts/climate/`.
- **Envelope, window, infiltration, duct and internal-gain values** are labeled as typical values in the code, the app and the PDF.
- **Tests** compare against numbers from outside the codebase (ASHRAE published values and a hand calculation), not against the engine's own output.

The review notes behind these changes are `REVIEW_NOTE_FOR_GEMINI_TEAM.md` and `REVIEW_NOTE_2_FOR_GEMINI_TEAM.md`.
