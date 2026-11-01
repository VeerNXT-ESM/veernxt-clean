# VeerNXT Web: Master Handover Reference

**Compiled:** 2026-10-28 · **Audience:** the incoming engineering team · **Repo:** `veernxt-web` (GitHub `VeerNXT-ESM/veernxt-web`, branch `main`)

This is the single entry point to the technical handover. It condenses six source documents that sit beside it in `docs/`. Each section names its source for the full detail. Dates inside sections are when the original was written, so check anything time-sensitive against the live system.

| # | Topic | Source (full detail) |
|---|---|---|
| 1 | Repo cleanup backlog | `CLEANUP_AUDIT.md` |
| 2 | Refactor plan before mobile | `REFACTOR_PLAN.md` |
| 3 | R2 storage | `R2_STORAGE_AUDIT_2026-09-20.md` |
| 4 | Vercel serverless functions | `VERCEL_FUNCTIONS.md` |
| 5 | DOCX book parser | `HANDOVER_DOCX_PARSER_2026-10-13.md` |
| 6 | Book Cover Studio | `HANDOVER_BOOK_COVER_STUDIO_2026-10-13.md` |

## 0. Read this first

**Stack at a glance.** Vite + React (JavaScript, no TypeScript, no automated tests) front end in `src/`. Serverless API in `api/` on Vercel (Hobby plan). Business logic for the recommendation engine in `backend/`. Data in Supabase (Postgres). Book content and images in Cloudflare R2 (bucket `veernxt-resources`). About 72,800 lines of JS/JSX across `src/`, `api/`, `backend/`. `scripts/` originally held about 145 maintenance and ingest scripts; this handover copy keeps only the 3 files the app imports (see `scripts/README.md`).

**AI: none in the running site.** The site makes no calls to any AI or LLM service. The "AI assistant" widget (`src/components/AiChatbotWidget.jsx`) is a scripted keyword FAQ with canned answers and makes no network calls, and the profiling engine is rule-based. The earlier Gemini-based chapter "enrichment" was abandoned when the content team returned to their original DOCX format, which the new DOCX parser handles (section 5). The unused AI proxy (`api/v1`), the browser-side Gemini enricher, its sandbox page and the `internal/` AI API notes were removed from this copy. The `enriched` flag on chapters, the enriched block renderers in the book reader, and the `gemini` value in `source` columns are data that already exists in published books and the database, not live AI calls, so they stay.

**Hard constraints you will hit**
- **Vercel Hobby = 12 serverless functions per deployment, and the project is at 11/12.** (The unused `api/v1` AI proxy was removed, freeing one slot.) Adding a 13th `.js` under `api/` breaks every deploy (this already happened on 2026-10-06). See section 4 for how to add endpoints safely.
- **Supabase returns at most 1,000 rows per query.** Always page with `.range()`.
- **Test RLS with the anon key**, not only the service-role key.
- **No test suite.** Every refactor needs manual click-through. Budget time for it.
- **Repo files use CRLF line endings.** Scripted edits must preserve them.
- **R2 objects are cached 300 s**, so a re-upload can look stale for five minutes.
- **Never hardcode credentials in scripts**; use `.env`.

**Documents referenced by the sources but not in this folder.** The sources mention `API_CONTRACT_INVENTORY.md`, `BOOK_REPARSE_REFERENCE.md`, `status_report.md`, `Profiler_Test_Instructions_for_Souvik.md`, `AI_API_USAGE.md`, the `bulk_reparse_runs/` folder and `book_swap_map_2026-10-07.json`. They were left out of the clean handover copy. They exist in the original working folder and, for the tracked ones, in GitHub history. Ask the outgoing team if you need any of them. **`bulk_reparse_runs/` is needed to roll back the parsed books (section 5), so restore it before touching those books.**

---

## 1. Repo cleanup backlog (source: `CLEANUP_AUDIT.md`, 2026-10-09, updated 2026-10-28)

Report only: nothing in the audit has been executed. `public/` is 178 MB of the 186 MB tracked, so almost all the weight is images. Git history is 576 MB.

| # | Area | Action | Payoff |
|---|---|---|---|
| 1 | Unused images in `public/` | Delete 63 files (`premium/`, `promotional/`, 27 of 36 icons, 10 of 14 banners, duplicate thumbnail PNGs) | ~93 MB |
| 2 | Used images | Convert PNG to WebP at display size (icons ≤256 px, banners ≤1600 px) | ~35–40 MB |
| 3 | `public/hero_video1.mp4` (26 MB) | Re-encode to ~3–6 MB or host on R2 | ~20 MB |
| 4 | Root files that should not be in git | Remove `Profiler_Test_Input_2026-09-28.xlsx` from git, delete duplicate root `learning_center_handoff.md`, verify then archive `schema.sql` | privacy |
| 5 | Dead `src/` files | Delete 11 files (list in source) | ~75 KB |
| 6 | Dead exported functions | Delete 12 in `subscriptionAccess.js`, `privateSectorTaxonomy.js`, `careerTrack.js`, `r2Uploader.js`, `supabase.js` | clarity |
| 7 | Unused npm packages | Uninstall 13 (`openai`, `docx`, `html-to-docx`, `marked`, `pg`, `page-flip`, `react-pageflip`, `@google/generative-ai`, `@google/genai`, `p-limit`, `pdf-parse`, …) | install size |
| 8 | Dev pages reachable in production | Gate `/dev-reader`, `/profiling-tester`, `/preview-services` behind `import.meta.env.DEV` | cleaner site |
| 9 | Duplicate files | `designations.json` exists in both `backend/engine/data/` and `src/data/` | small |
| 10 | Repeated helpers in `scripts/` | One shared module for `loadEnv`, pagination, `norm()` (copies in 20, 28 and 13 scripts) | ~600 lines |
| 11 | One-off scripts and applied SQL | Move to `scripts/archive/` and `sql/archive/` after confirming they were applied | clarity |
| 12 | Git history | Optional rewrite (`git filter-repo`); clone 576 MB to ~100 MB. Needs team agreement; everyone re-clones | clone speed |
| 13 | Duplicate exam tables | Retire `exams`, `lc_exam_legacy_map`, `jobs.exam_id` (see below) | removes drift |

**Suggested order:** section 4 (privacy), then 1–3 (images), then 5–8 (code, run `npx vite build` after each), then 9–11, then 12 with the team.

**Image-deletion warning.** Check the database for image URLs (`veernxt_assets`, `/thumbnails/`) before deleting. Also, `LearningCenter.jsx` references `/thumbnails/General Studies.png` in three places, which does not exist (broken images today); use the `.webp`.

**Public files correction (2026-10-28).** On the outgoing machine, 105 tracked `public/` files were deleted but uncommitted, and 42 of them are still used by code (`logo.png`, `homepage/` images, `hero_video1.mp4`, `hero/hero_image.jpg`, kept icons and banners, `finance/financial.png`, some thumbnails). The clean copy in this handover has them restored. Never commit `public/` deletions without checking, and stage by explicit path, never `git add -A`.

**Do not touch:** `backend/engine/data/exam_master.json` (live engine data), `src/translations.js`, `public/category_thumbnails/`, `scripts/exam-mapping/data/`, and the two `BookBlocks*.css` files (intentionally separate).

### Duplicate exam tables (item 13, the one that affects correctness)

Two exam tables are live and have drifted apart. The admin reads and writes `lc_exams` (1,575 rows). The profiling engine (`api/profile/recommend.js`) and `api/exams.js` read `exams` (1,537 rows). Nothing syncs them. As of 2026-10-28: 45 `lc_exams` rows are missing from `exams`, 7 `exams` rows have a blank name, 1 name differs, and `lc_exam_legacy_map` (1,522 rows) points at old ids that no longer exist.

- **Keep `lc_exams`**: 15 foreign keys point at it (user data, intros, quiz and resource maps, PYQ papers, jobs) and the admin writes to it. `exams` has three readers and two foreign keys (`jobs.exam_id`, `jobs_v2.exam_id`; 24 job rows).
- **Do not bulk-copy the 45 missing rows.** 12 duplicate an existing exam by name and body, 21 more are state variants already covered, and only about 12 are genuinely new (mostly police Constable / SI exams and two Junior Engineer exams). Review those by hand.
- **Move these columns to `lc_exams` first:** `career_track`, `metadata` (eligibility), `subject_requirements`, `priority`, `frequency`, `is_state_specific`, `base_url`, conducting body.
- **Steps:** back up the five tables; copy the new rows and delete blanks; add columns and copy by id (1,530 match); repoint `recommend.js` and `api/exams.js` at `lc_exams` and remove the legacy-map lookup (`recommend.js` ~lines 398–420); run test personas before and after (this copy keeps only `test-data/personas/synthetic_personas.json`, 33 synthetic edge-case profiles from 2026-09-28; the survey-derived personas, baseline results and runner scripts were left out, so the new team must rebuild the runner); re-link jobs with `scripts/exam-mapping/match_jobs_to_lc_exams.mjs`; then drop the old columns and tables.
- **Before dropping anything,** list the live foreign keys (the two above come from `schema.sql`, which may be stale) and check whether `jobs_v2` (444 rows) duplicates `jobs`.
- **Effort:** 2–3 days. **Risk:** medium, since the profiling engine is the product core and has no tests.

---

## 2. Refactor plan before mobile (source: `REFACTOR_PLAN.md`, 2026-10-09)

**Goal:** prepare for a Capacitor build now and React Native / Flutter later by moving data access and business rules out of the UI.

**Current state:** no TypeScript, no tests. Very large files: `FinancialGuidance.jsx` (2,570 lines), `LearningCenter.jsx` (2,309), `AiChatbotWidget.jsx` (2,071), `api/admin/save-resource.js` (2,008), `JobBoard.jsx` (1,941), plus eight others over 1,100. **205 direct `.from(...)` Supabase call sites** in the UI (68 admin, 137 learner/employer), which is the main obstacle to a mobile port. `militaryTaxonomy.js` and `privateSectorTaxonomy.js` are large static data files; move them to JSON or the database rather than refactor.

**Order of payoff**
1. Data access layer (`src/data/*` repos, or better server RPCs). Highest value.
2. Pull business rules (gating, scoring, taxonomy matching) into pure functions or the backend. These become the Flutter spec and the first test targets.
3. Split the ~10 largest files (risky without tests).
4. Shared UI primitives (unmeasured).
5. Split `save-resource.js` and `private-sector/router.js` into handlers plus shared validation.
6. Scripts helpers (also audit item 10).
7. Optional TypeScript on the new data layer and API only.

| Item | Effort | Risk |
|---|---|---|
| Cleanup (audit 1–9) | 1–2 days | low |
| Scripts helpers | 0.5 day | low |
| Data access layer | 5–8 days | medium |
| Business rules + tests | 3–5 days | medium |
| Split ~10 giant files | 5–8 days | high without tests |
| API route splits | 2–3 days | medium |
| Shared UI primitives | 2–4 days | medium |
| TypeScript on new layers | 3–5 days | low |
| **Total** | **about 4–6 weeks** | |

**Recommended before the port:** cleanup, data layer, rules extraction (about 1.5–2 weeks). **Skip for now:** large-file splits, UI primitives, full TypeScript (Flutter rewrites the UI anyway; Capacitor runs it as is). Add smoke tests around the data layer and rules as they are extracted. **Next step named in the plan:** Slice 1 of the API contract inventory, the Learning read path: read the RLS policies on the `lc_exam_*`, `resources` and `quizzes` tables, then write `get_exam_content` as an RPC. (The inventory document is not in this folder; see section 0.)

**Ownership note:** the refactor plan and the exam-table cleanup are the incoming team's work.

---

## 3. R2 storage (source: `R2_STORAGE_AUDIT_2026-09-20.md`)

**Result.** The bucket `veernxt-resources` held 286,664 objects and 55.5 GB on 2026-09-20. After two in-place fixes it is about **15.3 GB**.

- **Cause.** One branded cover image (1023×1537, 3.8 MB) was copied 7,159 times (27 GB, 49% of the bucket), plus 58 under other names. The image extractor writes the cover into every book's own `images/` folder. Overall, about 49.8 GB of `STATE EXAMS` was duplicate copies uploaded on 2026-08-17.
- **Fix 1 (done).** The cover copies were overwritten in place with WebP q90 (328 KB), served as `image/webp` under the original `.png` keys, so no URLs or code changed. 55.5 GB to 30.4 GB.
- **Fix 2 (done).** 512 distinct duplicated PNGs of 100 KB+ were converted (250 lossy WebP q90 with PSNR ≥38 dB, 261 lossless). 49,504 objects overwritten in place, 0 failures. 30.4 GB to 15.3 GB. The one-off scripts (`r2_shrink_brand_cover.mjs`, `r2_shrink_duplicate_images.mjs`) were removed from this handover copy; they were ETag-guarded and MD5-checked, and exist in the original repo history if needed.
- **Rollback.** Originals were backed up on the outgoing machine (`K:\tmp\r2_cleanup\originals`, key lists under `K:\tmp\db_backups\`). **Those backups are not part of this handover folder.** Ask the outgoing team whether they are being transferred.
- **Do not delete `STATE EXAMS` wholesale.** 1,324 live `resources` rows still point into it, plus about 400 more into other old folders (Nursing, Teaching, Delhi, Ladakh). The live path is `structured_resources/blocks/` (14,639 rows).
- **Not started:** (1) true dedupe of the cover via rewriting URLs across ~146k chapter JSONs; (2) other duplicated figures (~2.5 GB) and a 2.5 MB cover with 274 copies; (3) recompress the remaining ~130k PNG figures; (4) orphan sweep after mapping the 1,324 references; (5) stop the extractor re-creating the problem, and add an R2 lifecycle rule for `tmp/publish-uploads/`.
- **Cost context:** R2 is about $0.015/GB-month, so even 55 GB was under $1/month. The value is tidiness, faster listings and a bucket that does not keep growing.

---

## 4. Vercel serverless functions (source: `VERCEL_FUNCTIONS.md`, 2026-10-06)

Every `.js` under `api/` is one function, except files and folders starting with an underscore (`api/_lib/...`). The project is at **11/12**.

| # | File | Public URLs | Purpose |
|---|---|---|---|
| 1 | `api/admin/misc.js` | `/api/admin/admins`, `/redemptions`, `/content-writes`, `/auth` | Admin router: admin users, reward redemptions, service-role writes to `lc_*` tables, admin login (handler in `_lib/adminAuth.js`) |
| 2 | `api/admin/save-resource.js` (~2,010 lines) | `/api/admin/save-resource` | Big admin content API: 15 `books-*` actions, content publish, DOCX preview and upload, R2 upload, theme actions, and the Book Cover actions. Uses mammoth, AWS S3 SDK and the DOCX parsers |
| 3 | `api/admin/legal-aid.js` | `/api/admin/legal-aid` | Legal Aid Cell admin and email replies |
| 4 | `api/auth/account.js` | `/api/auth/register`, `/reset-password` | Registration and password reset |
| 5 | `api/auth/otp.js` | `/api/auth/otp` | MSG91 OTP send/verify |
| 6 | `api/exams.js` | `/api/exams`, `?fn=chapter` | Exam/syllabus data, and the secure per-chapter fetch for the reader (checks freemium/lock state, reads chapter JSON from R2) |
| 7 | `api/jobs.js` | `/api/jobs`, `/api/jobs-v2` | Job listings |
| 8 | `api/payments/actions.js` | `/api/payments/create-subscription`, `/verify-payment` | Razorpay subscription create and signature verification |
| 9 | `api/points/actions.js` | `/api/points/actions` | Points awards (idempotent) and redemption |
| 10 | `api/private-sector/router.js` (~1,250 lines) | `/api/private-sector/router` | Whole Private Sector module (14 admin and 8 candidate/employer actions) plus MSG91 WhatsApp sender |
| 11 | `api/profile/recommend.js` | `/api/profile/recommend` | Profiling engine: eligibility and scoring (imports `backend/engine/*`) |

Helpers (not functions): `api/_lib/emailBroadcaster.js` (SMTP and broadcast), `api/_lib/adminAuth.js`. `vercel.json` sets `maxDuration: 60` for all functions and holds the rewrites that turn clean URLs into `?fn=` calls on the routers, then a catch-all `/api/(.*)` and the SPA fallback. The local dev server (`vercelApiPlugin` in `vite.config.js`) reads the same rewrites.

### How to add an endpoint without a 13th function
1. Put the handler in `api/_lib/<name>.js` (default-export `async (req, res)`).
2. Add `if (fn === '<name>') return handler(req, res);` to the nearest router (`api/admin/misc.js`, or `api/auth/account.js` for non-admin).
3. Add a rewrite to `vercel.json` **above** the `/api/(.*)` catch-all.
4. Check `find api -name '*.js' ! -path '*/_*' | wc -l` stays at **12 or fewer** (11 today).

### Optimisation ideas (not done)
1. Move the heavy admin API out of the Vercel function budget: a second small Vercel project, Supabase Edge Functions or Cloudflare Workers, or upgrade to Pro (no cap).
2. Lazy `await import()` of mammoth, S3 and parsers inside the heavy `save-resource` actions to cut cold start for the light ones.
3. Cache exam and eligibility tables in module scope in `recommend.js`.
4. Shared `api/_lib/supabase.js` and `http.js` to remove ~100 lines of repeated boilerplate and make the admin-secret check consistent.
5. Hard-coded Supabase URL fallbacks in `api/exams.js` and `api/jobs.js`: fail loudly instead.
6. Lower `maxDuration` per function; 60 s is only needed for DOCX conversion and email sends.
7. Merge candidates if slots are needed: `otp.js` + `account.js`, `legal-aid.js` into `misc.js`, `jobs.js` + `exams.js`.
8. Read `/api/exams` and `/api/jobs` straight from Supabase via RLS-safe views, freeing two slots.

---

## 5. DOCX book parser (source: `HANDOVER_DOCX_PARSER_2026-10-13.md`)

> **Handover note: the scripts described in this section are not in this copy.** Only `scripts/lib/ingest-drive-content.js`, `scripts/lib/docxParser.mjs` and `scripts/convert_docx_intros_to_blocks.mjs` are kept, because the live API imports them. The parser, verifier, bulk runner and the other tools named below remain in the outgoing team's original repository and git history. This section is kept as a record of how the 50 "2026 NEW" books were produced and what to rebuild or restore if the new team wants that pipeline.


**What it is.** The old pipeline converted DOCX to HTML with mammoth (`scripts/lib/docxParser.mjs`) and had Gemini "enrich" it, which lost bullets, numbers and images and added content not in any DOCX. The new parser (`scripts/lib/docxDirectParser.mjs`) reads `word/document.xml` directly and emits the block types the reader already renders. **No AI, no guessing, no invented blocks.** A separate verifier checks every output against the DOCX before upload.

**Scripts**
| File | Role |
|---|---|
| `scripts/lib/docxDirectParser.mjs` | The parser: `parseDocxDirect(buffer, { onImage })` returns `{ chapters, stats }` |
| `scripts/lib/verifyBook.mjs` | Independent checker; gates every upload |
| `scripts/book-pipeline/build_reparse_manifest.mjs` | Read-only; lists the 58 linked books, source DOCX and new titles |
| `scripts/book-pipeline/bulk_reparse_books.mjs` | Runner: parse, verify, upload to R2, insert a Draft `resources` row (dry run by default) |
| `scripts/book-pipeline/rebuild_review_index.mjs` | Rebuilds the review list on R2 |
| `scripts/book-pipeline/build_swap_map.cjs` | Regenerates the old-to-new book map |
| `scripts/book-pipeline/reparse_book_direct.mjs` | Single-book local parse (no Supabase or R2 writes) |
| `src/pages/sandbox/DevReader.jsx` | Review reader at `/dev-reader` (public, no login) |
| `src/components/book/BookBlocks.jsx`, `BlockRenderer.jsx`, `BookBlocks.css`, `BookBlocksClassic.css` | Block rendering |

**Parsing rules.** Headings come from Word styles only. Word lists and typed bullets become nested `list` / `numberedList` blocks using Word's own numbering counters. Every drawing becomes an `image` block in place. Bold, italic, underline, strike, super/subscript, colour, highlight and centring survive; table headers come from `<w:tblHeader>`. An empty Heading 1 is a subject divider (`chapter.part`). Cover and contents pages are dropped. Visual-structure mode applies only to documents with no Heading 1. Output block types: `heading`, `paragraph`, `list`, `numberedList`, `table`, `image`.

**Pipeline for one book.** DOCX (optionally a fixed copy) → parse → verify → local output in `FINAL_BOOKS_STRUCTURED/_bulk/<id>/` (untracked) → upload to a **new** R2 prefix `structured_resources/blocks/<Category>/<new resource_id>/` → insert one **Draft** `resources` row titled "<old title> 2026 NEW", linked to no exam → add to the review index. The runner is insert-only, refuses to touch existing rows or prefixes, stops at the first error, and checks row counts and anon-key invisibility before and after.

**Running it.** `.env` needs `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_ANON_KEY`, `R2_PUBLIC_URL`, `R2_BUCKET_NAME` and the R2 credentials.
```
node scripts/book-pipeline/build_reparse_manifest.mjs
node scripts/book-pipeline/bulk_reparse_books.mjs --only "<title>"               # dry run
node scripts/book-pipeline/bulk_reparse_books.mjs --only "<title>" --execute
node scripts/book-pipeline/bulk_reparse_books.mjs --rollback docs/bulk_reparse_runs/results_<run>.json --only "<new title>"
node scripts/book-pipeline/rebuild_review_index.mjs --execute
node scripts/book-pipeline/build_swap_map.cjs
```
`--rollback` is **untested**; try it on one book first. `--limit N` also exists.

**Source DOCX files.** The content team supplies them directly. `build_reparse_manifest.mjs` hardcodes the outgoing machine's `MASTER DOCUMENTS` path (the `MASTER` constant, plus two paths in `EXTERNAL_SOURCES`); change it to your local folder, and file names must match what the manifest expects or the book shows as `source_needed`. The same file name can be many different files and `resources.source_file` is unreliable, so confirm with the content team which DOCX is final. Never edit the content team's DOCX; fix structure in a copy. (The `fix_gkgs_*` / `fix_mathematics_*` copy-fixer scripts were removed from this handover copy; they exist in the original repo history.)

**Current state.** 50 new books exist as Draft rows ("... 2026 NEW", linked to no exam). Old books and exam links are untouched. Review at `https://www.veernxt.in/dev-reader` (`?book=<category>-<title-slug>&ch=N`). In admin, Draft counts as "archived", so they appear under *Show archived* in Book Content. **Nothing has been swapped or purged.** Policy: content team signs off, then swap, then purge. Not built: the English Guide (source undecided). Commit `80084b2` added a "replace a live book with an existing book" action (`api/admin/save-resource.js`, `src/components/admin/ReplaceWithExistingModal.jsx`) with dry run and rollback log, the likely swap route.

**Gotchas**
- **Swap:** many exams reach books through the legacy `exam_name` text match, not real links (14,044 of 14,655 Guide/Precis rows). Purging old rows before backfilling real links removes those books from those exams.
- `FINAL_*_STRUCTURED/`, `books/` and `docs/*.xlsx` stay untracked; `docs/bulk_reparse_runs/` and the swap map are small JSON and tracked.
- Nothing here was verified in a real browser; the verifier, lint, build and data checks were the evidence.

**Open questions for the content team** (full list was in `BOOK_REPARSE_REFERENCE.md`): English Guide source, identical-twin pairs and their titles, whether the two outside-the-library DOCX files are final, GS & GK chapter-numbering gaps, large "Practice MCQs" chapters to split, possible merged or tiny chapters.

---

## 6. Book Cover Studio (source: `HANDOVER_BOOK_COVER_STUDIO_2026-10-13.md`)

**What it is.** A CMS tool that builds a book's cover, spine and angled 3D thumbnail from editable fields, so the content team no longer generates covers with GPT. Fix a typo by editing the text and saving again. **Where:** Admin → Learning → Book Covers (`/admin/book-covers`), or *Design cover* on any row in Book Content (`/admin/book-covers?resourceId=…`). **Status:** first version, tested only on the Computer Science sample. Opened without `resourceId` it is a scratchpad with a browser draft and no save.

**Architecture (two layers)**
1. **Flat templates** (`BookCoverTemplate.jsx` / `.css`): React/HTML on a fixed 1000×1480 canvas (spine 150×1480), laid out as a vertical flow so bigger fonts push content down instead of overlapping.
2. **Perspective compositor** (`src/lib/bookPerspective.js`): rasterises cover and spine with `html-to-image`, draws each face as 1-pixel strips scaled by depth. Rotation about the vertical axis only. Live preview and saved thumbnail use the same code.

**Data**
- **Supabase `book_covers`** (`sql/book_covers.sql`, already run on production 2026-10-12; safe to re-run). Key `book_key` = `Guide::<lowercased title>` / `Precis::<lowercased title>`, or `Intro::<resource_id>`. `cover_data` (jsonb) holds text fields, topics, colours, layout. Also `logo_url`, `image_url`, `thumb_url`, `flat_url`. Public read; writes only via the server (service role).
- **R2**, under `book-covers/<slug>/`: `image-*`, `logo-*`, `thumb-3d-*.webp` (768×1152), `cover-flat-*.webp`.
- **`resources.thumbnail_url`**: Save writes the 3D thumbnail URL onto every `resources` row of that book.
- **Server:** `book-cover-get` and `book-cover-save` actions in `api/admin/save-resource.js`, using the admin secret header. Needs `ADMIN_API_SECRET` (server) and `VITE_ADMIN_API_SECRET` (client) to match, plus the R2 env vars used by `r2-upload`.

**Files:** `src/pages/admin/BookCoverStudio.jsx`, `src/components/book/BookCoverTemplate.jsx/.css`, `src/components/book/bookCoverConfig.js`, `src/lib/bookPerspective.js`, `src/assets/veernxt-logo.png`, `src/pages/admin/BooksPage.jsx` (Design cover button), `sql/book_covers.sql`. New dependency: `html-to-image`. Run locally with `npm run dev`.

**Known limits**
1. Nothing on the learning pages reads the thumbnail for books yet; wire book tiles to `book_covers.thumb_url` or `resources.thumbnail_url`.
2. Renaming a book breaks its cover (see decision below).
3. Exams are typed by hand; prefilling needs a look at `lc_exam_resource_map` / `lc_exams`.
4. No overflow warning when content exceeds the 1480 px canvas.
5. Cover-picture library is manual; reuse one picture per subject.
6. Fonts (Outfit, Playfair Display) load from Google Fonts; self-host for deterministic thumbnails.
7. Perspective has no top tilt and no visible page block.
8. The live 3D preview re-rasterises on every edit (debounced ~450 ms); watch it on slow machines.
9. The logo already contains the tagline ribbon and the cover also prints the tagline; decide whether to keep both.
10. Each save writes new timestamped thumbnails and does not delete old ones; a cleanup of superseded `thumb-3d-*` and `cover-flat-*` files will be needed.
11. Test Hindi titles, very long names, 1–3 line exam lists, and books with no picture.

**Open decision: book renames.** Renaming a book (a) orphans its `book_covers` row, since the key is category plus lowercased title, and (b) leaves the baked thumbnail stale, since the title is printed into the image. Making the title read-only fixes only (b). Titles in `resources` are often filename-derived (`Haryana_GS`, `1.MTS_INTRO`); `cleanContentTitle` (`src/lib/contentTitle.js`) only partly tidies them.
- **Option A (recommended):** editable name; re-key `book_covers.book_key` and `title` in the rename action (`books-save-tags` in `save-resource.js`); prefill the subject name from the cleaned book title; add a `baked_from_title` column and show a "renamed since this cover was saved, re-save" warning and a marker in Book Content.
- **Option B:** name locked and derived from the book title (only the line break editable). Still needs the re-key and a re-bake; only safe once titles are tidy, and removes the team's wording control.
- **Open questions:** A or B? For B, is there or should there be a clean display-title field on `resources`? Auto re-bake on rename, or marker only? Is a stale-only thumbnail acceptable for Intro books, which are keyed by `resource_id`?
