# Refactor Plan (pre-mobile)

**Date:** 2026-10-09 · **Status:** analysis only, nothing changed · **Related:** `CLEANUP_AUDIT.md` (file/asset cleanup), `docs/API_CONTRACT_INVENTORY.md` (call-site inventory and proposed server operations).

> **Status 2026-11-01 (handover).** Still the right roadmap, with updated numbers: direct `.from(...)` calls in `src/` are now 224 (was 205), `LearningCenter.jsx` is about 4,080 lines, `JobBoard.jsx` about 2,460, `FinancialGuidance.jsx` about 2,610, `api/admin/save-resource.js` about 2,290. The plan assumes a Capacitor then Flutter port: if that is not planned, keep only the data-access layer and the business-rules extraction. `docs/API_CONTRACT_INVENTORY.md`, which "Next step" points to, is **not in this repo**; recreate it or drop that step. AI items are moot (no AI in the product).

Goal: make the codebase ready for a Capacitor build now and a React Native / Flutter client later, by moving data access and business rules out of the UI so a new client does not rewrite them.

## What the code looks like

- About **72,800 lines** of JS/JSX across `src/`, `api/` and `backend/`.
- No TypeScript and no tests, so nothing catches a behaviour change.
- **Very large files:** `FinancialGuidance.jsx` (2,570 lines), `LearningCenter.jsx` (2,309), `AiChatbotWidget.jsx` (2,071), `api/admin/save-resource.js` (2,008), `JobBoard.jsx` (1,941). Eight other files are over 1,100 lines.
- **Direct database calls from the UI.** The inventory counted **205** `.from(...)` call sites (68 admin, 137 learner/employer) across 29+ files. An earlier estimate of 91 was too low because it missed multi-line calls. Data access is mixed into the screens, which is the biggest obstacle to a mobile port.
- **Big taxonomy files:** `militaryTaxonomy.js` (1,117 lines) and `privateSectorTaxonomy.js` (1,100) are static data. Move them to JSON or the database rather than refactor them.
- `scripts/` has 145 files with repeated boilerplate (audit §10).

## What to refactor, in order of payoff

1. **Data access layer.** Move the Supabase calls into `src/data/*` modules (for example `examsRepo`, `resourcesRepo`, `profileRepo`), or better, behind server RPCs as proposed in `API_CONTRACT_INVENTORY.md`. Screens then call functions and don't know about Supabase. A Capacitor build is unchanged, and Flutter gets a ready-made list of every query it must reimplement. Highest-value item.
2. **Business rules out of components.** Pull gating, scoring and taxonomy matching into pure functions or the backend. These become the spec for Flutter and the first things worth testing.
3. **Split the ~10 largest files** into a page shell, hooks and small components. Mechanical but risky without tests.
4. **Shared UI primitives.** Buttons, cards, modals and form fields are probably copy-pasted. Not measured yet; check before promising a number.
5. **API routes.** `save-resource.js` (2,008 lines) and `private-sector/router.js` (1,253) need splitting into handlers plus shared validation.
6. **Scripts helpers** (audit §10). Easy and low risk.
7. **Optional: TypeScript** on the new data layer and API only, not the whole repo.

## Workload

Rough estimates for one person working with Claude. Not scoped in detail.

| Item | Effort | Risk |
|---|---|---|
| Audit §1–9 (cleanup) | 1–2 days | low |
| Scripts helpers | 0.5 day | low |
| Data access layer (205 call sites; 137 in mobile scope) | 5–8 days | medium |
| Business rules extraction + tests | 3–5 days | medium |
| Split ~10 giant files | 5–8 days | high without tests |
| API route splits | 2–3 days | medium |
| Shared UI primitives | 2–4 days | medium |
| TypeScript on new layers | 3–5 days | low |
| **Total** | **about 4–6 weeks** | |

The data-layer estimate was raised from 4–6 days after the real call count (205, not 91) was found.

A large part of the effort is verifying nothing broke. Claude has no browser automation in this environment, so every UI refactor needs a person to click through the affected screens. Budget testing time on top of the estimate.

## What to do before the port

- **Do:** the cleanup, the data access layer and the rules extraction. Together about 1.5–2 weeks, and they give most of the portability benefit.
- **Skip for now:** splitting the large files, UI primitives and full TypeScript. They improve readability, but Flutter will rewrite the UI anyway, and Capacitor will run the existing UI as is.
- **Order matters.** Add smoke tests around the data layer and rules as they are extracted. That is the safety net for the later splits.

## Next step

Start with Slice 1 of `API_CONTRACT_INVENTORY.md` (Learning read path): read the RLS policies on the `lc_exam_*`, `resources` and `quizzes` tables, then write `get_exam_content` as an RPC.
