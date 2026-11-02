# Job scraper

Desktop tool that collects government job notices and publishes them to the site's `jobs_v2` table, with an AI-written description for each. The code is in `scraper/` (Electron + Playwright). It is **not** part of the web app or its deploy: it is run by hand by whoever manages the job board.

## What it does

1. **Collect.** Reads the sitemap or the "latest jobs" pages of two sites (sarkariofficer.com, sarkarijobportal.com) with a headless browser and parses each notice (title, dates, vacancies, age, links).
2. **Filter** (AI, with a rule-based fallback). Drops notices that are not recruitment posts: results, admit cards, answer keys, syllabus, cut-offs, admissions. If the AI is unavailable, title rules do this (`looksLikeNonJob()`).
3. **Describe** (AI, three attempts; if all fail the job is saved with **no description**). Writes an English description of 100 to 320 words from the notice text. This text is what the Jobs page shows as the job description (`jobs_v2.ai_description`).
4. **Compare** with the database (new, changed, expired).
5. **Publish.** Upserts new and changed rows into `jobs_v2` (conflict on `url`). Deleting expired jobs is a separate checkbox, **off by default**; each job also has its own Delete button, which removes that one job.
6. **Legacy enrichment.** Can also take rows from the old `jobs` table that are not yet in `jobs_v2`, write descriptions for them and push them across.

Tags (career track, sector) are assigned by rules in `classifyMultiTags()`, not by AI.

## Run it

Needs Node.js. On Windows, double-click `scraper/Run Scraper.bat`: it installs the packages the first time and opens the app. Manually:

```bash
cd scraper
npm install
npx playwright install chromium    # first time only: the browser the scraper drives
cp .env.example .env               # fill in the values
npm start
```

The window has buttons for each step above. Logs appear in the window.

## Configuration (`scraper/.env.example`)

- **Database:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. The key bypasses RLS and the app writes with it, so **point it at a test Supabase project until you have seen a full run behave**. Nothing is hard-coded: with no URL or key the database buttons are disabled and a warning is logged.
- **AI provider** (`AI_PROVIDER`):
  - `openai` (default): needs `OPENAI_API_KEY`; model from `AI_MODEL` (default `gpt-4o-mini`). Use a standard chat model. Reasoning models reject the `max_tokens` and `temperature` the app sends.
  - `openrouter`: needs `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`.
  - `custom`: any OpenAI-compatible chat-completions endpoint: `AI_API_URL`, `AI_API_KEY`, `AI_MODEL`.
- **No AI key bundled.** The previous version defaulted to a private AI service and carried a fallback token in the code. Both were removed. With no working key (a wrong key shows as `HTTP 401` in the log) the filter uses the title rules above, and new jobs are saved **without** a description, which leaves them blank on the Jobs page. Fix the key before publishing.

## What to know

- **It writes to production data.** `jobs_v2` is read by the live Jobs page through `api/jobs.js`. Required column: `ai_description` (migration `sql/jobs_v2_ai_description.sql`).
- **Sources are fragile.** The two sites' HTML is parsed directly; a layout change breaks collection, and the log shows `Found 0 listings`. This happened to Sarkari Officer (new layout, 2026-11-02; fixed). Its "latest jobs" page is a mixed feed with results and admit cards, which the filter removes. There are no tests.
- **Old jobs are removed by a separate script.** The scraper only judges jobs that appear in the page it just scraped, so it never sweeps the table. Run `node cleanup_expired.js` in `scraper/`: it shows what it would remove (a dry run), and with `--execute` it backs the rows up to `scraper/backups/` and deletes jobs whose deadline has passed and later copies of the same title. Jobs with no recorded deadline are never removed. Run it after each scrape, or put it in the scheduled job below. Test on 2026-11-02: 446 rows became 337 (106 expired and 3 duplicates removed; the rows were backed up first).
- **Tested end to end on 2026-11-02** (driving the real app): both sources returned listings, OpenAI wrote a full description for each of 16 jobs (about 2,000 to 2,400 characters), results, admit cards and answer keys were dropped, 2 new jobs were inserted with descriptions, tags and career tracks, and a re-check showed no expired or duplicate rows. Fixed on the way: job names came out as "Notify Later" or "To Be Announced" because the exam name was read from any details row whose label contained "Exam"; it now uses a real name or the post headline.
- **The AI filter is not perfect.** In that run it discarded two real recruitment posts as "not a job" (RRB 560 Paramedical, SSC CHSL), both already expired. Spot-check what it discards, and tune the prompt in `filterJobsWithAI()` if it keeps doing this.
- **Some source titles are cut off by the source site itself** (for example "Collectorate Begusarai PDS Recruitmen"), and about 4 older rows in the table have junk titles ("Get Details", "Read more »") left by the earlier scraper. Most older rows have no deadline recorded, so they stay until someone reviews them.
- **AI content is published unreviewed.** Descriptions are model output about third-party notices; spot-check them, especially dates and eligibility.
- **Keep keys out of the folder you share.** `.env` is ignored by git; keep it that way.
- **History.** An earlier, modular version of the scraper (11 separate source scrapers, a cron purge, a matching hook) was left out of this repository. Its source folders can be recovered from the handover archive if needed.

## Recommended next step: move it into the backend

The Electron app is a stop-gap. It keeps the database and AI keys on a desktop, needs a person to run it, and nothing sweeps old jobs. Better:

1. **Fetch-based scraper, no browser.** A job page fetched with plain HTTP already contains the last date, vacancies, age limit and qualification (checked 2026-11-02 on one Sarkari Job Portal page; check the listing pages and the other source too).
2. **Run it on a schedule** (GitHub Actions cron or a Supabase scheduled function), daily. A single Vercel function will not do: the Hobby limit is 60 seconds per call and one run takes longer. If an admin button is wanted instead, use one small call per job through the existing admin router (see `docs/VERCEL_FUNCTIONS.md`).
3. **Write new jobs as "pending"** and add Approve / Reject to Admin > Job Board, so a person still reviews what goes live.
4. **Sweep expired jobs** in the same run (set `is_expired`, and make the Jobs page hide them).
5. **Prerequisite:** fix admin authentication first (`docs/SECURITY_NOTES.md`, item 1). The admin secret is public today, so anyone could trigger admin endpoints.

Also test, before relying on a hosted runner, that the two sites do not block its IP address. Rough size: 2 to 4 days including the database change.

## Other notes in this folder

`scraper_schema_guide.md` and `Scrape possibilities.md` are notes from the original scraper (June 2026). They explain the job fields and the sites that could be scraped, but may not match the current code.
