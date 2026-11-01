# Screenshot plan: ready reckoner PDF

Purpose: one PDF that shows every page of the platform with a short note on what it does, so the incoming team can find their way around before they read any code.

## 1. What each entry in the PDF contains

| Field | Source |
|---|---|
| Screenshot (desktop 1440x900, and mobile 390x844 for candidate pages) | captured live |
| Page name and URL route | `src/App.jsx` |
| Who can open it (public, signed-in candidate, employer, admin) | `AuthGuard` / `AdminShell` in `src/App.jsx` |
| Source file | the component named in the route |
| Data it reads and writes | Supabase tables and API endpoints (`docs/API_CONTRACT_INVENTORY.md`, `docs/VERCEL_FUNCTIONS.md`) |
| Who edits its content | admin page that controls it (for example Banners, Books, Exams) |
| Known issues | `docs/status_report.md`, section 6 of the handover document |

## 2. Page inventory (from `src/App.jsx`, 73 route entries)

**Public (no login):** `/` (landing), `/login`, `/auth/callback`, `/financial-guidance`, `/preview-services`, `/pay`, `/privacy`, `/support`, `/legal`, `/legal-aid`, `/demo-cards`, `/study-materials`.

**Candidate (signed in):** `/profiling`, `/profiling/results`, `/subscribe`, `/dashboard`, `/learning-center`, `/exam/:examId`, `/jobs`, `/network`, `/messaging`, `/quiz-center`, `/quiz/:id`, `/pyq-center`, `/pyq-reader/:id`, `/cv`, `/rewards`, `/reader/:id` (book reader), `/private-sector`, `/private-sector/profile`, `/private-sector/opportunities`.

**Employer:** `/employer/onboarding`, `/employer/dashboard`, `/employer/ready-to-hire`, `/employer/post-job`, `/find-candidates`.

**v2 (new Learning module):** `/v2`, `/v2/learning`, `/v2/learning/:level`, `/v2/me`, `/v2/messages`.

**Admin (login at `/admin/login`):** exams, books, book-covers, reader-themes (+ new / edit), conducting-bodies, categories, subjects, banners, publish-content, users, roles, profile, quizzes (+ editor), pyq-papers (+ editor), jobs, rewards, private-sector, legal-aid, book chapter browser.

**Developer-only pages reachable in production (flagged in `CLEANUP_AUDIT.md` section 8):** `/dev-reader`, `/dev-quiz-preview`, `/profiling-tester`, `/admin/profiling-tester`. Capture them, but label them as internal.

## 3. What is needed before capture

1. Test accounts (stored in the password manager, never in this file): one free candidate, one paid candidate, one employer, one Super Admin.
2. A candidate with a completed profile, so the results, dashboard and job pages show real data.
3. One published book, one quiz and one PYQ paper to open in the reader screens.
4. Decide whether to capture production (`www.veernxt.in`) or a staging deployment. Production is simpler but shows real user data on admin Users, Messaging and Private Sector pages. Blur or use test records for those.
5. Do not capture a payment screen with a real card entered. Stop at the Razorpay checkout screen.

## 4. How to capture

Option A (recommended): a Playwright script in this folder that logs in once per role, visits each route from the list above, waits for network idle, and saves `desktop/<slug>.png` and `mobile/<slug>.png`. Repeatable after the new team changes the UI.
Option B: manual capture with the browser's full-page screenshot, named by route slug.
Option C: browser extension automation (used earlier in this project; it must be reconnected first).

Note: earlier sessions had no browser automation available, so no UI has been click-tested by the outgoing team's tooling. The screenshots double as a first visual check.

## 5. Assembling the PDF

1. Build one page per route from the table in section 1 (screenshot left, notes right).
2. Group by the sections above, add a contents page and a one-page map showing how candidate, employer and admin areas connect.
3. Add the architecture diagram (see `DIAGRAM_PLAN.md`) as the first page.
4. Export to PDF. Keep the source (Markdown or the generator script) beside it so it can be regenerated.
5. Size check: about 60 pages of screenshots at 150 dpi stays under about 40 MB; compress if it is to be emailed.

## 6. Order of work

1. Confirm accounts and environment (item 3 above).
2. Capture admin pages first (the new team will use them daily), then candidate, then employer and v2.
3. Write the notes column from the source files, not from memory.
4. Review with the content team for the admin pages.
