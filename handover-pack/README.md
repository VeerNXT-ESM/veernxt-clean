# VeerNXT handover workspace

Created 2026-10-28 from commit `50c1136` of `github.com/VeerNXT-ESM/veernxt-web` (main), plus the working-folder docs that are not yet committed.

## Contents

| Folder | What it is |
|---|---|
| `veernxt-web/` | Clean copy of the web app: `src`, `api`, `backend`, `sql`, `scripts`, `docs` (Markdown only), `public`, `test-data`, `internal`. |
| `scraper-app/` | Job scraper (Electron plus command line), current version. |
| `HANDOVER_PACK/` | This folder: the handover plans (screenshots, diagrams). The main handover document is in the parent of this folder as `VeerNXT Handover Document.docx`. |

## What was left out, on purpose

| Left out | Why |
|---|---|
| `.git` | History stays on GitHub (the clean copy is for reading and documenting, not for committing). |
| `.env`, `.env.local`, scraper `.env` | Secrets. Values are shared through the password manager. |
| `node_modules`, `dist` | Rebuilt with `npm install` and `npm run build`. |
| `backups/`, `books/`, `FINAL_BOOKS_STRUCTURED/`, `FINAL_INTROS_STRUCTURED/`, `FINAL_PYPS_STRUCTURED/` | Generated or sensitive content, about 650 MB. Transferred separately (see section 6 of the handover document). |
| `docs/*.xlsx`, `*.csv`, `*.docx` | Audit exports and a contact list with personal data. Transferred separately. |
| `scraped_sarkari_jobs.json` | Scraper output data. |

## Changes made in this copy compared with the working folder

1. The 105 `public/` files that are deleted in the working folder were restored from commit `50c1136`, so `public/` matches GitHub (the working folder is missing files the code still uses).
2. A live-looking API token in `internal/AI_API_USAGE.md` was replaced with `<YOUR_TOKEN>`.
3. A hardcoded Supabase **service-role** key was removed from three scraper scripts (`analyze_jobs.js`, `backfill_markdown.js`, `backfill_standard_details.js`). They now read `SUPABASE_SERVICE_ROLE_KEY` from the environment only.

The originals in the main working folders were not changed. The removed credentials are still valid there and in any zip or history; they must be rotated (see the handover document).

## Not in scope of this copy

`content-engine`, `content-engine-app`, `flutter-app`, `marketing`, `socialmachine` and the old `web` clone. Decide which of these are handed over.
