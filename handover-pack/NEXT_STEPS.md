# Next steps

**Updated:** 2026-11-01. Background and ground rules: `STATUS_REPORT_2026-10-28.md` (its section 3 and 4 are older than this file; where they differ, this file wins).

## State
- Repo: `github.com/VeerNXT-ESM/veernxt-clean`, branch `main`. Clean tree, no old history. **Hosting is the new team's call.** Vercel is not switched to this repo by us: they connect it themselves (or host elsewhere). The site was click-checked on the clean branch on 2026-11-02 and worked.
- `sql/site_banners_video.sql` has been run.
- In the repo: `README.md`, `.env.example`, `docs/` (master reference, front-end map, security notes, eight interactive diagrams), `graphify-out/` (structural graph of the code), and this `handover-pack/`.
- Unused images and the removed hero video (about 150 MB in total) are in `VeerNXT Handover\IMAGE_REPOSITORY` for the new team's drive.

## Before go-live (new team, whichever host)
1. Run `npm install && npm run dev` from a fresh clone of `veernxt-clean` and click through: landing (light and dark, language switch, videos), login, `/home`, Learning Center, an exam, a book chapter, Jobs (all tabs incl. Private Sector), Finance, Legal, Network, Subscribe (no payment), Admin > Banners tabs. Watch the console and network tab.
2. Run the profiling flow end to end; check `/api/profile/recommend` returns 200.
3. In Vercel: connect `VeerNXT-ESM/veernxt-clean`, set the Production Branch to `main`, enter the env vars (names in `.env.example`, values from the password manager), check the first deploy, and keep the old project running until it is verified. **Rotate keys only after the new deploy works, and update Vercel's env vars in the same step**, or the live site loses its keys. Hosting elsewhere: the `api/*.js` files are Vercel-style handlers and `vercel.json` holds the rewrites, so they need adapting.

## Do first (new team)
1. **Rotate the old keys** (Supabase service role and access token, Razorpay secret, R2 secret, MSG91, admin secret; revoke the unused OpenAI, GCP and AI-proxy keys; also the job scraper's Supabase key, AI service token and OpenRouter key, which the scraper's sender still holds). Then make the old repo private or archive it.
2. **Fix the public admin secret.** `VITE_ADMIN_API_SECRET` is compiled into the public JavaScript bundle (confirmed 2026-11-01). Move admin calls to the admin's Supabase session, then rotate `ADMIN_API_SECRET`. Full list: `docs/SECURITY_NOTES.md`.
3. Check Vercel env vars: `DEVTEST` must be unset; `MSG91_AUTH_KEY` and `MSG91_TEMPLATE_ID` must be set (otherwise OTP runs in simulation mode with code 123456).
4. **Admin accounts:** keep one Super Admin as a bootstrap, reset its password at once, create named admins, then remove or disable the outgoing team's four accounts. Remove the `123456789` default-password handling in `api/_lib/adminAuth.js`. Details: `docs/SECURITY_NOTES.md` section 8. The Zoho/domain mailboxes are an account-ownership item, not needed for admin login.
5. Remove or guard the public dev routes (`/dev-reader`, `/profiling-tester`, `/admin/profiling-tester`, `/dev-quiz-preview`, `/demo-cards`).

## Recommended project for the new team
- Move the scraper into the backend as a scheduled job with an approve step, and sweep expired jobs. Plan: `docs/scraper/README.md`. Do the admin-auth fix first.

## Decisions taken at handover (2026-11-02)
- **Admin accounts:** the outgoing team creates one Super Admin for the new team. The new team handles all other Supabase users and the cleanup of the old admin accounts (`docs/SECURITY_NOTES.md` section 8).
- **Account transfers:** none needed. The new team gets access to the Google profile that owns the services (Supabase, R2, Vercel, GitHub, Razorpay, MSG91, domain mail) and so to everything behind it. Rotate the keys after that.
- **Scraper:** tested end to end on 2026-11-02 with the new OpenAI key. It enriched 16 jobs, inserted 2 new ones, and `scraper/cleanup_expired.js` removed 106 expired jobs and 3 duplicates from `jobs_v2` (446 to 337 rows; backups taken first). Run the clean-up script after each scrape until the scheduled version exists. Details: `docs/scraper/README.md`.
- **Database audit and any refactor** (`docs/CLEANUP_AUDIT.md` section 13, duplicate exam tables; `docs/REFACTOR_PLAN.md`) are the new team's work. Nothing was changed in the database by us beyond the `site_banners_video.sql` migration.
- **Hosting:** the new team connects Vercel (or another host) to `veernxt-clean` themselves.

## Left open, by choice
- Placeholder Antogattva Foundation text on `/home` (English only).
- Finance and Legal banner slots (the tabs exist but are empty).
- **Videos:** the six landing-page YouTube videos are rows in the `site_videos` table (one per language), read by the landing page through `src/lib/videoStore.js` and edited in Admin > Videos. If a language has no row, the built-in default in `videoStore.js` is used. They no longer appear in Admin > Banners (that page keeps the hero video and the images). Both `sql/site_banners_video.sql` and `sql/site_videos.sql` have been run.
- Images still in `public/` (about 107 MB). Nothing must move; this is for repo size and CMS control. Best first: `veernxt_assets/` (20 MB of PNGs, the banner CMS defaults: convert to WebP, host on R2, point `bannerStore.js` at them like the landing page). Easy: `state_images/` (12 MB, code-referenced), `homepage/` and `finance/` (6 MB), the 6 PNGs in `thumbnails/` (also fix the missing `General Studies.png`). Need a database update because the DB stores the relative path: `category_banners/` (`lc_category_profiles.hero_image_url`, 19 rows), `thumbnails/` (`lc_subjects.thumbnail_url`, 28 rows), `category_thumbnails/` (`lc_exam_categories.thumbnail_url`, 187 rows). Book and exam covers and logos are already on R2.
- Screenshots of the 73 routes (`SCREENSHOT_PLAN.md`); the graph is code-only (rebuild with `/graphify . --update`).
