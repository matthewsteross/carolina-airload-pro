# Project Charter: Carolinas HVAC Load & Permit Calculator (NC & SC)

**Lead:** Antigravity (Gemini)  
**Primary Engine Partner:** Codex  
**Support/Consultants:** Claude (Regulatory/Code), Grok (UX/Brainstorming), Local Ollama (fallback)  
**End User:** HVAC Company Owner & Salesman (Small Residential HVAC Company in NC & SC)  
**Workspace:** `C:\Users\matth\Documents\Load Calculation App`  
**Date:** October 14, 2026 (Updated with User Alignment)

---

## 1. User & Business Context

* **Who it's for:** A small HVAC contractor serving North Carolina and South Carolina. The owner is the sole salesman and visits homeowners directly.
* **The Problem:** 
  * Legacy load calculation tools (Wrightsoft, Elite, etc.) are clunky, slow, expensive, and have steep learning curves with dozens of confusing menus.
  * Sizing by "rules of thumb" (e.g. 500 sq ft per ton) is illegal under NC & SC building codes (NCRC & SCRC Section M1401.3) and gets permits rejected.
  * Municipal inspectors in NC (Raleigh, Charlotte, Greensboro, Wilmington, etc.) and SC (Charleston, Columbia, Greenville, Horry County, etc.) require documented proof of an ACCA Manual J load calculation and Manual S equipment sizing.
* **The Goal:** A modern, beautiful, ultra-simple app that the owner can use in minutes to:
  1. **Primary Objective:** Calculate the exact HVAC equipment tonnage required per floor (for multi-story homes) or for the whole house (for single-story homes).
  2. **Secondary Capability:** Provide an optional room-by-room breakdown of CFM distribution, BTU/h per room, and recommended duct & vent (register) sizes.
  3. **Permit Compliance:** Generate a clean, 1-page permit-ready ACCA Manual J / Manual S summary report & NC Energy Certificate that inspectors accept immediately.

---

## 2. Regulatory & Code Requirements (NC & SC)

### North Carolina
* **Code:** 2018/2024 North Carolina Residential Code (NCRC) Chapter 11 & NC Energy Conservation Code (NCECC).
* **Section M1401.3:** Equipment sizing must comply with ACCA Manual S based on loads calculated using ACCA Manual J (8th Edition).
* **Permit Artifact:** Inspection departments audit design conditions, total sensible/latent loads, and equipment sizing factors. Must pair with the NC Residential Energy Certificate thermal envelope specs.
* **Climate Zones:** 2A (Coastal), 3A (Piedmont), 4A & 5A (Mountains).

### South Carolina
* **Code:** South Carolina Residential Code (SCRC) Section M1401.3 & SC Energy Standard (IECC baseline).
* **Section M1401.3:** Explicitly mandates ACCA Manual J and Manual S sizing; prohibits "rules of thumb".
* **Permit Artifact:** County/municipal AHJs (Charleston, Horry, Richland, Greenville, etc.) require the Manual J/S summary report submitted with mechanical permit applications.
* **Climate Zones:** 2A (Coastal, heavy latent humidity load), 3A (Midlands/Upstate).

---

## 3. Workflow & UX Design Principles (Tailored for Sales)

1. **"Fast Sizer" Floor Mode (Primary):**
   * Select State & County (auto-populates official 99% heating and 1% cooling design temperatures).
   * Enter Floor 1 (e.g., 1,400 sq ft, 9ft ceiling, crawlspace/slab, insulation era/vintage).
   * Enter Floor 2 if applicable (e.g., 1,100 sq ft, 8ft ceiling, attic above).
   * Instant result: Recommended Heat Pump / AC Tonnage per floor (e.g. "Downstairs: 2.5 Tons, Upstairs: 2.0 Tons") with heating strip sizing ($kW$) and cooling CFM.
2. **"Room-by-Room Breakdown" Mode (Secondary / Optional Toggle):**
   * For jobs requiring ductwork replacement or airflow balancing: add rooms (Master Bed, Living Room, Kitchen, etc.).
   * Calculates room CFM, BTU load, and suggested supply duct size (e.g. 6", 7", 8" round flex/metal) and register size (e.g. 4x10, 4x12).
3. **One-Click Permit PDF Export:**
   * Generates a clean, branded, official ACCA Manual J / S compliance sheet with contractor details, homeowner address, design temps, and AHJ inspection sign-off block.

---

## 4. Team Resource Strategy (Quota-Aware)

* **Antigravity (Gemini):** Project leadership, UX architecture, frontend design, PDF generation, and full integration.
* **Codex:** Primary calculation engine builder (pure mathematical modules for Manual J envelope heat transfer, infiltration, solar gains, and Manual S equipment boundaries).
* **Claude:** Reserved for targeted regulatory validation and code review.
* **Grok:** Fast prototyping and UI styling ideas.
* **Local Ollama (Qwen 2.5 Coder):** Offline/small text helpers.

---

## 5. Next Steps

1. Confirm Matthew's preferred tech stack / delivery format (Web app vs. Desktop).
2. Codex scaffolds `manual-j-engine` and Carolinas climate database.
3. Build the sleek, responsive UI wizard.
4. Integrate the PDF permit exporter.
