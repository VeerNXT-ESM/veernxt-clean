# Diagram plan: graphify and archify

Goal: give the incoming team a picture of the code, so they can find things without reading 72,800 lines first.

## Tools

| Tool | What it does | Fit |
|---|---|---|
| graphify (installed skill, `/graphify`) | Builds a knowledge graph of the codebase: files, relationships, god nodes, communities. Gives a queryable graph (`graphify-out/`). | Best for answering "what depends on what" and for the new team to query. Run on the clean folder. |
| archify (github.com/tt-a1i/archify, Apache-2.0) | An agent skill that turns a codebase or description into a self-contained interactive HTML diagram (architecture, workflow, sequence, data flow, ERD, tree and others) with PNG, WebP/JPG and PDF export. Installed with `npx skills add tt-a1i/archify -g`. Needs Node.js. No API key of its own. | Best for the human-readable pictures in the PDF: system architecture, request flow, database ERD, content pipeline. |

Both run on the clean copy, not on the working folder.

## Suggested diagrams (archify unless noted)

1. System architecture: browser, Vercel (12 functions), Supabase, R2, Razorpay, MSG91, Gmail SMTP, Singular-AI, scraper.
2. Request flow for the three main journeys: OTP login, profile to exam recommendation to job match, book reading (chapter fetched from R2 through `api/exams.js?fn=chapter`).
3. Database ERD (needs the live foreign-key list first; `schema.sql` may be out of date).
4. Content pipeline: DOCX to parsed blocks to R2 to `resources` rows to exam links.
5. Admin area map: sidebar pages and what each writes to.
6. Exam data model: `lc_exams`, `exams`, `lc_exam_legacy_map` and their links, drawn as it is today and as planned (shows why the new team removes `exams`).
7. Deployment: GitHub (VeerNXT-ESM), Vercel, environment variables, and which secrets live where.

## Cautions

- archify's layout "relies on the agent's judgment" and has no auto-layout or WYSIWYG editor; each diagram needs a human check against the code.
- Check the generated diagrams against `docs/VERCEL_FUNCTIONS.md` and `docs/API_CONTRACT_INVENTORY.md`.
- Run archify with `ARCHIFY_UPDATE_CHECK_DISABLED=1` if outbound requests should be avoided.
- The graph and diagrams are a snapshot. Record the commit hash they were built from (current: `50c1136`).
- The clean copy has no `.git` folder, so graphify's history features will not be available there.
