# Job scraper

Desktop tool that collects government job notices and publishes them to the site's `jobs_v2` table, with an AI-written description for each. The code is in `scraper/` (Electron + Playwright). It is **not** part of the web app or its deploy: it is run by hand by whoever manages the job board.

## What it does

1. **Collect.** Reads the sitemap or the "latest jobs" pages of two sites (sarkariofficer.com, sarkarijobportal.com) with a headless browser and parses each notice (title, dates, vacancies, age, links).
2. **Filter** (AI, with a rule-based fallback). Drops notices that are not real recruitment posts.
3. **Describe** (AI, three attempts, then a template). Writes an English description of 100 to 320 words from the notice text. This text is what the Jobs page shows as the job description (`jobs_v2.ai_description`).
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
- **No AI key bundled.** The previous version defaulted to a private AI service and carried a fallback token in the code. Both were removed. Without a key the AI steps fail, then the rule-based filter and the template descriptions take over, so the output is usable but plainer.

## What to know

- **It writes to production data.** `jobs_v2` is read by the live Jobs page through `api/jobs.js`. Required column: `ai_description` (migration `sql/jobs_v2_ai_description.sql`).
- **Sources are fragile.** The two sites' HTML is parsed directly; a layout change breaks collection. There are no tests for this.
- **AI content is published unreviewed.** Descriptions are model output about third-party notices; spot-check them, especially dates and eligibility.
- **Keep keys out of the folder you share.** `.env` is ignored by git; keep it that way.
- **History.** An earlier, modular version of the scraper (11 separate source scrapers, a cron purge, a matching hook) was left out of this repository. Its source folders can be recovered from the handover archive if needed.

## Other notes in this folder

`scraper_schema_guide.md` and `Scrape possibilities.md` are notes from the original scraper (June 2026). They explain the job fields and the sites that could be scraped, but may not match the current code.
