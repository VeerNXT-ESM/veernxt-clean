# Handover work: internal status report

**As of:** 2026-10-28 · **For:** us only (not for the incoming team) · **Not in the repo folder on purpose.**

## 1. Ground rules we agreed
- Work only in the **clean copy**: `K:\H DRIVE\Quantum Climb\APPS\VeerNXT\VeerNXT Handover\veernxt-web`. The originals (`VeerNXT Main Repo\VeerNXT APP\veernxt-web`) are untouched.
- **No cleanup and no database cleanup**: the new team does that. Our goal is that what is on the live site keeps working.
- Keep only scripts the running app imports. The new team writes its own test scripts and automations.
- No AI in the product: remove AI code and unused API calls.
- Move necessary images to R2, controlled from the CMS. Unused images go to a separate image repository.
- Nothing pushed to GitHub yet. No branch created yet.

## 2. Where things are
| Thing | Location |
|---|---|
| Clean copy of the web app | `VeerNXT Handover\veernxt-web` |
| Image repository (moved-out originals) | `VeerNXT Handover\IMAGE_REPOSITORY` (`homepage\` 9 PNGs, `video\hero_video1.mp4`) |
| This report | `VeerNXT Handover\HANDOVER_PACK` |
| Real git repo (remote `github.com/VeerNXT-ESM/veernxt-web`, branch `main`, 150 uncommitted changes) | `VeerNXT Main Repo\VeerNXT APP\veernxt-web` |
| Master technical document for the new team | `veernxt-web\docs\MASTER_HANDOVER_REFERENCE.md` |
| Graph (stale, see section 5) | `veernxt-web\graphify-out\` |

## 3. Done so far
**Docs**
- `docs/` cut to six source documents plus a new `MASTER_HANDOVER_REFERENCE.md` (stack, constraints, cleanup backlog incl. the duplicate exam-table problem, refactor plan, R2 audit, Vercel function map, DOCX parser, Book Cover Studio).
- Removed from `docs/`: the other 29 files, `bulk_reparse_runs/` (**the rollback records for the 50 "2026 NEW" books**, restore from the original if needed) and `status_report.md`.

**Scripts**
- `scripts/` went from 159 files to **3**, the only ones `api/admin/save-resource.js` imports: `lib/ingest-drive-content.js`, `lib/docxParser.mjs`, `convert_docx_intros_to_blocks.mjs` (kept at its original path). `scripts/README.md` explains this.
- The new DOCX book pipeline (parser, verifier, bulk runner) is **no longer in the clean copy**. It remains in the original repo.

**AI removal**
- Removed `api/v1/` (unused AI proxy) and its two `vercel.json` rewrites. API is now **11 Vercel functions (limit 12)**.
- Removed `src/lib/geminiEnricher.js`, `src/pages/sandbox/BookReaderV2.jsx` (CSS kept), the `internal/` AI notes, and the "OpenRouter" wording on the demo-cards page.
- Left on purpose: the `enriched` chapter flag and enriched-block renderers (existing published books), `gemini` as a stored `source` value, comments mentioning old scripts.
- The "AI assistant" widget is a scripted keyword FAQ with no network calls. Its **label was not changed** (product decision pending).

**Test data**
- `test-data/` now holds only `personas/synthetic_personas.json` (33 synthetic profiles from 2026-09-28). The survey-derived personas and baseline results were deleted.

**Install**
- `npm install` done (548 packages). `npm ci` refuses because the lockfile was slightly out of sync (missing optional `@emnapi` entries); `package-lock.json` was updated by the install.
- `npx vite build` passes.

**Landing page moved to the CMS and R2**
- `bannerStore.js`, `LandingPage.jsx`, `BannersPage.jsx` extended: **18 new Admin → Banners slots**: hero (poster + video URL), six YouTube slots (en, hi, mr, te, ta, kn; English is the fallback), 11 section images.
- 13 files uploaded to R2 (bucket `veernxt-resources`, public address `https://pub-8c123d43246448199bbe4a14bffa2c06.r2.dev`) under `site/landing/`, with hashed names; images converted to WebP (about 20 MB to 1.6 MB), video unchanged (25.6 MB). Verified HTTP 200.
- Code defaults point at those R2 URLs (one constant, `SITE_MEDIA_BASE`). A server-side render shows the landing page using them.
- Moved out of `public/`: 9 homepage images and `hero_video1.mp4` (to `IMAGE_REPOSITORY`).
- Still in `public/` because Learning Center uses them: `homepage/F4_A.png`, `homepage/F5A.png`, `hero/hero_image.jpg`.

**Site restructure (later on 2026-10-28; build passes, not yet checked in a browser)**
- **Shreya's update:** commit `e2ba458` on `origin/main` (Videos CMS, Private Sector tab on Jobs, white landing page). Fetched only; the real repo's local `main` is still one commit behind. **Merged into the clean copy: the Jobs part only** (Private Sector tab: `JobBoard.jsx`, `jobBoardPhone.css`, `PrivateSector{Home,Opportunities,Profile}.jsx`). **Not merged:** Videos CMS (`VideosPage`, `videoStore.js`, `site_videos` SQL, `/admin/videos` route) and the white landing page, because `LandingPage.jsx` conflicts with our R2/CMS landing work.
- **One Learning Center:** `/learning-center` is final. `/v2/learning` and `/v2/learning/:level` removed (`LearningHome`, `LearningBrowse`, `ExamCard`, `useExamCatalog` deleted); old `/v2/learning/*` redirects to `/learning-center`.
- **One header:** all signed-in pages now use the slim header (`src/v2/V2Layout.jsx`): logo far left, Learning / Jobs / Finance / Legal, messages icon and avatar far right (full width, like Finance). Old `Header.jsx` and `ui/BottomNav.jsx` deleted; the slim layout has its own mobile bottom bar and now includes the site footer. Employers get Dashboard and Find Candidates instead of the four links. "My Network" and "Rewards" moved into the avatar menu; Private Sector is a tab on Jobs.
- **Home page is `/home`** (was `/v2`): signed-in `/`, login, Google callback and Subscribe send candidates there; employers go to `/employer/dashboard`. Student dashboard is `/home/me`, messages `/home/messages`. Old `/v2`, `/v2/me`, `/v2/messages` redirect. `robots.txt` now disallows `/home`. Signed-out visitors still get the marketing landing page at `/`.
- **`/home` content:** four section tiles, then the "What is VeerNXT?" write-up and stats (same translation keys as the marketing page, so language switching works), then an **Antogattva Foundation** card. **The foundation text is placeholder copy** and needs approved wording.
- **Finance header:** "Main Site" link removed; nav links left-aligned, "Go to Finance Portal" right-aligned; logo links to `/` (so `/home` when signed in).

## 4. Not done / pending
1. **Run `sql/site_banners_video.sql` in Supabase** (adds `site_banners.video_url`). Needed before an admin can save a video or YouTube link. Not run.
2. Move the rest of the images to R2, one area at a time: signed-in banners (defaults in `veernxt_assets`, `hero`, `category_banners`), Learning Center placeholders, `state_images`, `category_thumbnails`, `thumbnails/books`, Finance QR codes, and the page-flip sounds in `public/sounds`.
3. Find unused `public/` files and move them to `IMAGE_REPOSITORY` (check the database for relative `/thumbnails/...` paths first).
4. Create the git branch (plan agreed in outline: init in clean copy, fetch `origin/main`, branch `handover/clean`, review diff against main, secret scan, commit in chunks, push only after approval). **Open decisions: push to `VeerNXT-ESM/veernxt-web` or a fresh repo (leaning fresh, to leave the leaked-key history behind); whether Vercel previews build branches.**
5. Rebuild the graph (`graphify-out` is stale: still lists removed scripts), then archify diagrams.
6. Screenshots (73 routes, `SCREENSHOT_PLAN.md`): needs test accounts.
7. Souvik's new scraper: details to come. The old scraper is deprecated.
8. The 21 open items in section 11 of the handover document, still to fill.
9. Decide whether to merge the rest of Shreya's `e2ba458` (Videos CMS needs `sql/site_videos.sql` run in Supabase; white landing page conflicts with ours).
10. Browser-check the restructure: Messages page height (sized for the old header and bottom bar), signed-out pages (`/privacy`, `/support`, `/legal`) now showing the slim header, footer above the phone bottom bar, `/home` layout in light and dark.
11. Flesh out `/home` further (more sections to be decided) and replace the placeholder foundation text.
12. Handover document and `MASTER_HANDOVER_REFERENCE.md` still describe the old header, `/v2` routes and two Learning Centers; update them.
13. Old `/messaging` (MessagingWorkspace) is still routed but no longer linked; the header icon opens `/home/messages`.

## 5. Risks and things to remember
- **`.env` and `.env.local` are in the clean copy** with live production secrets (Supabase service-role key and access token, Razorpay secret, R2 secret, MSG91, admin secret). They are gitignored. **Delete them before zipping, sharing or pushing.**
- Also in `.env`: `OPENAI_API_KEY`, `VEERNXT_AI_API_KEY`, `GCP_*`: unused now, **revoke**.
- Secrets already leaked in the originals, still to rotate: the AI token in `AI_API_USAGE.md` (file now removed from the clean copy), Supabase service-role key hardcoded in scripts, `content-engine`, `content-engine-app` and `scraper-app.zip`, and plaintext `VEERNXT_SOCIAL_CREDENTIALS.txt`. Any branch sharing history with `main` still contains the old keys.
- `r2Uploader.js` falls back to a stale R2 address (`pub-8219…`) if `VITE_R2_PUBLIC_URL` is unset in Vercel.
- Comments in `src/` and `api/` had script paths rewritten during the regrouping (comment text only). One earlier import path edit in `api/admin/save-resource.js` was reverted to the original.
- Not verified in a real browser: the browser tools disconnected. Build, lint and a server-side render of the landing page are the only evidence so far. The restructure above has only been build-checked too. The flow test (section 6) has **not been run**; it was waiting for the test account password.
- Content-issue report (`content-issues-report.json`) is never committed, so the admin's issue counters stay empty; the generator script is gone.
- `survey_personas.json` data still exists in the original working folder.

## 6. Next chat: flow test
**Goal:** prove nothing is broken in the cleaned copy.
**Test account:** mobile **<test account mobile: see password manager>** (password supplied in chat, deliberately not recorded in this file).
**Setup:** run the app from the clean copy (`npm run dev`, `.env` is in place). It talks to the live Supabase, so use only this account's own data; do not run anything destructive. The Chrome browser tools must be reconnected first.
**Steps**
1. Signed-out landing page: hero video, all 11 images, YouTube video (also switch language), no console errors. Check the network tab shows `site/landing/…` from R2.
2. Log in with the account above.
3. Lands on `/home` after login (tiles, VeerNXT write-up, foundation card); student dashboard at `/home/me` (welcome banner and other default banners). Header is the slim one on every page. The Jobs page has the Private Sector tab.
4. Profiling flow end to end: complete or resume the profile, run the profiling agent, reach the results page. Watch the `/api/profile/recommend` call.
5. Learning Center loads (cards, placeholders, banners).
6. Quick passes: Jobs, Network, Subscribe page (no payment), Finance page.
7. Admin → Banners page renders the 18 new landing slots (only if an admin session is available; do not save anything before the SQL migration).
8. Record results per page with pass/fail, plus console and network errors. Compare against the production site where something looks off.
**Do not:** change data, run migrations, or delete anything during the test.
