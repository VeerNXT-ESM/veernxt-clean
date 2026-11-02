# VeerNXT Scraper Schema Specification

To ensure the scraped job data can be consumed directly by the VeerNXT profiling engine without LLM post-processing, the scraper must output a flat JSON object per job that precisely matches the `exam_master.json` schema.

## Target JSON Schema

Your scraper should be configured to extract and map data into the following structure:

```json
{
  "exam_id": "string (unique identifier, e.g., 'C-48a7b57dfe')",
  "level": "string ('central' or 'state')",
  "state_ut": "string or null (e.g., 'UP', 'Delhi', or null if central)",
  "raw_category": "string (The raw category from the site, e.g., 'Bank Jobs')",
  "career_track": "string (MUST BE ONE OF: 'SSC', 'BANKING', 'RAILWAYS', 'POLICE_CAPF', 'ENGINEERING', 'PSU', 'DEFENCE', 'STATE_GOVT')",
  "conducting_body": "string (e.g., 'State Bank of India', 'Staff Selection Commission')",
  "exam_name": "string (e.g., 'SBI PO', 'SSC CGL')",
  "website": "string (Official website link for applying)",
  
  // ELIGIBILITY FIELDS (Crucial for the matching engine)
  "min_qualification": "string ('10', '12', 'graduate', or null)",
  "physical_required": false, // boolean: true if physical test/standards apply
  "math_required": false,     // boolean: true if math is a strict requirement
  "technical_trade_preferred": false, // boolean: true for tech/engineering roles
  "ncc_bonus": false,         // boolean: true if NCC certificates give bonus marks
  "sports_quota_eligible": false, // boolean: true if sports quota applies
  "ex_servicemen_quota": true, // boolean: true if there is an ex-servicemen/Agniveer quota or age relaxation
  "domicile_required": false, // boolean: true if specific state domicile is needed
  "english_intensive": false  // boolean: true if English proficiency is a major component
}
```

## Mapping Instructions for Scraper

To achieve this without an LLM, your scraper will need strong CSS selector/XPath logic combined with internal mapping dictionaries:

1. **`min_qualification`**: Instead of extracting raw text like "Graduation", use a scraper rule to map keywords (`Degree`, `B.Tech`, `BA`) -> `"graduate"`.
2. **Boolean Flags**: The scraper should scan the raw HTML tables for keywords. For example, if the table contains the text "Ex-Servicemen", set `"ex_servicemen_quota": true`. If it mentions "Physical Measurement" or "PET", set `"physical_required": true`.
3. **`career_track`**: Maintain an internal mapping in your scraper. E.g., if `conducting_body` contains "Bank", track = `"BANKING"`.

## Useful Reference Paths

If you are writing scripts to adapt the scraper, reference these files to see exactly how the engine processes the data:

*   **The Master Data Schema (What the engine reads):**
    `k:\H DRIVE\Quantum Climb\APPS\VeerNXT\VeerNXT Main Repo\VeerNXT APP\engine\data\exam_master.json`
*   **The Profiling Engine Logic (How the booleans are used):**
    `k:\H DRIVE\Quantum Climb\APPS\VeerNXT\VeerNXT Main Repo\VeerNXT APP\web\api\profile\recommend.js`
    *(Look at how it filters based on `ex_servicemen_quota` and `physical_required`)*
*   **The UI Design Document (For context on how matches are displayed):**
    `k:\H DRIVE\Quantum Climb\APPS\VeerNXT\VeerNXT Main Repo\VeerNXT APP\docs\PROFILE_ENGINE_DESIGN.md`
