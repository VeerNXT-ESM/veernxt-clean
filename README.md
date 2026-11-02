# VeerNXT web

Career-transition and learning platform for short-term military personnel: exam preparation, jobs, finance guidance and legal aid, with an admin CMS.

Live site: https://www.veernxt.in

## Stack

| Layer | What |
|---|---|
| Front end | Vite + React (JavaScript, no TypeScript), Tailwind v4 plus hand-written CSS, `react-router-dom` |
| API | Vercel serverless functions in `api/` (Hobby plan: **max 12 functions, 11 used**) |
| Engine | Recommendation logic in `backend/engine/`, bundled into `api/profile/recommend.js` |
| Data | Supabase (Postgres, Auth, RLS) |
| Files | Cloudflare R2 (book chapters, banners, media) |
| Services | MSG91 (OTP, SMS, WhatsApp), Razorpay (subscriptions), Gmail SMTP (email) |

The running site makes **no AI calls**, and there is **no automated test suite**. One thing to know: the job descriptions shown on the Jobs page are written by an AI model offline, by the job scraper in `scraper/`, and stored in `jobs_v2.ai_description`. See `docs/scraper/README.md`.

## Quick start

Built and tested on Node.js 22.

```bash
npm install            # npm ci fails on this lockfile, use install
cp .env.example .env   # then fill in the values (shared through the password manager)
npm run dev            # http://localhost:8080
```

`npm run dev` also serves the `api/` functions locally (see `vercelApiPlugin` in `vite.config.js`), so you do not need the Vercel CLI.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on port 8080 |
| `npm run build` | Production build into `dist/` |
| `npm run lint` | ESLint |
| `npm run preview` | Serve the built `dist/` |

**Warning:** `.env` points at the live Supabase and R2 when you use the production values. There is no staging. Use a separate Supabase project for experiments.

## Folder map

| Folder | What is in it |
|---|---|
| `src/` | The app. `App.jsx` holds every route. See `docs/FRONTEND_MAP.md` |
| `src/v2/` | The slim header layout (`V2Layout`), the `/home` page and section list |
| `src/pages/admin/` | Admin CMS pages (Banners, Exams, Books, Users, ...) |
| `src/lib/` | Shared logic: Supabase client, `bannerStore.js` (CMS banners), job matcher, taxonomies |
| `api/` | Vercel serverless functions. Read `docs/VERCEL_FUNCTIONS.md` **before adding any file here** |
| `api/_lib/` | Helpers that do not count as functions |
| `backend/` | `engine/` (eligibility and scoring) and `points/` (points catalogue) |
| `sql/` | Migrations, applied by hand in the Supabase SQL editor. `schema.sql` at the root may be out of date |
| `scripts/` | Only the three files the running API imports (see `scripts/README.md`) |
| `scraper/` | Desktop job scraper (Electron). Not part of the web deploy. Docs in `docs/scraper/` |
| `public/` | Static files served as-is |
| `docs/` | Handover documents and diagrams |
| `test-data/` | 33 synthetic profiles for testing profiling |

## Read next

1. `docs/MASTER_HANDOVER_REFERENCE.md`: constraints, cleanup backlog, R2, functions, parser, cover studio
2. `docs/scraper/README.md`: the job scraper and its AI setup
3. `docs/diagrams/README.md`: eight interactive diagrams (open the `.html` files in a browser)
4. `docs/FRONTEND_MAP.md`: routes, layouts, theming, the banner CMS
5. `docs/VERCEL_FUNCTIONS.md`: the 12-function limit and how to work within it

## Things that will bite you

- **Vercel Hobby = 12 functions.** A 13th `.js` under `api/` breaks every deploy. Add endpoints to an existing router.
- **Supabase returns at most 1,000 rows per query.** Page with `.range()`.
- **Test RLS with the anon key**, not only the service-role key.
- **Anything named `VITE_` ends up in the public JavaScript bundle.** `VITE_ADMIN_API_SECRET` currently does: see `docs/SECURITY_NOTES.md`.
- **Two exam tables exist** (`lc_exams` current, `exams` legacy). See the data model diagram.
- **R2 objects are cached for 300 s**, so a re-upload can look stale for five minutes.
- **Files use CRLF line endings.** Scripted edits must preserve them.

## Deploying

Vercel builds the production branch (`main`) automatically. Environment variables are set in the Vercel project; the names are in `.env.example`. Static assets are built from `public/`. After changing a SQL migration, run it by hand in Supabase first.
