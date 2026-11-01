# Next steps

**Updated:** 2026-11-01. Background and ground rules: `STATUS_REPORT_2026-10-28.md` (its section 3 and 4 are older than this file; where they differ, this file wins).

## State
- Repo: `github.com/VeerNXT-ESM/veernxt-clean`, branch `main`. Clean tree, no old history. **Vercel is NOT yet switched to this repo** (it still builds the old one); switch it after the morning check below.
- `sql/site_banners_video.sql` has been run.
- In the repo: `README.md`, `.env.example`, `docs/` (master reference, front-end map, security notes, eight interactive diagrams), `graphify-out/` (structural graph of the code), and this `handover-pack/`.
- Unused images and the removed hero video (about 150 MB in total) are in `VeerNXT Handover\IMAGE_REPOSITORY` for the new team's drive.

## Before switching Vercel (morning check, 2026-11-02)
1. Run `npm install && npm run dev` from a fresh clone of `veernxt-clean` and click through: landing (light and dark, language switch, videos), login, `/home`, Learning Center, an exam, a book chapter, Jobs (all tabs incl. Private Sector), Finance, Legal, Network, Subscribe (no payment), Admin > Banners tabs. Watch the console and network tab.
2. Run the profiling flow end to end; check `/api/profile/recommend` returns 200.
3. In Vercel: connect `VeerNXT-ESM/veernxt-clean`, set the Production Branch to `main`, confirm env vars are present, check the first deploy and the live site, and keep the old repo connected as the fallback until it is verified.

## Do first (new team)
1. **Rotate the old keys** (Supabase service role and access token, Razorpay secret, R2 secret, MSG91, admin secret; revoke the unused OpenAI, GCP and AI-proxy keys). Then make the old repo private or archive it.
2. **Fix the public admin secret.** `VITE_ADMIN_API_SECRET` is compiled into the public JavaScript bundle (confirmed 2026-11-01). Move admin calls to the admin's Supabase session, then rotate `ADMIN_API_SECRET`. Full list: `docs/SECURITY_NOTES.md`.
3. Check Vercel env vars: `DEVTEST` must be unset; `MSG91_AUTH_KEY` and `MSG91_TEMPLATE_ID` must be set (otherwise OTP runs in simulation mode with code 123456).
4. Remove or guard the public dev routes (`/dev-reader`, `/profiling-tester`, `/admin/profiling-tester`, `/dev-quiz-preview`, `/demo-cards`).

## Still open on our side
- **Flow test with the real account** (status report section 6; adjust for `/home`). Not run yet. Light and dark landing page, Admin > Banners tabs, slim header on every page and the Messages page height have been build-checked only.
- Replace the **placeholder Antogattva Foundation text** on `/home` (English only).
- Finance and Legal banner slots (the tabs exist but are empty).
- `site_videos` table exists in the live database (from Shreya's commit) but nothing in this repo reads it. Leave or drop; the new team decides.
- Move remaining images to R2 (signed-in banners, Learning Center placeholders, `state_images`, `category_thumbnails`, `thumbnails/books`, Finance QR codes, sounds). `public/` is still about 150 MB.
- The 21 open items in section 11 of the handover document; accounts, passwords and keys transfer (done through the password manager, not this repo).
- Souvik's new scraper; screenshots of the 73 routes (`SCREENSHOT_PLAN.md`).
- The graph is code-only (no semantic pass over docs or images). Rebuild with `/graphify . --update` after structural changes.

## Decisions taken
- Fresh repo instead of merging into the old `main`: history is where the bloat and keys were.
- Shreya's Videos CMS not merged (duplicates our six YouTube slots in Admin > Banners). Her white landing page and Jobs Private Sector tab are merged.
- One Learning Center (`/learning-center`); slim header everywhere; `/home` is the signed-in home; square corners site-wide.
