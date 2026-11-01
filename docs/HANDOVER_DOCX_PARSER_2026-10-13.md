# Handover: the new DOCX book parser (for Souvik)

Written 2026-10-13. Covers the parser used to build the 50 "... 2026 NEW" books, and where every script lives.

All paths are relative to the repo root (`veernxt-web`, GitHub `VeerNXT-ESM/veernxt-web`, branch `main`).

## 1. What it is, in one paragraph

The old book pipeline turned a DOCX into HTML with mammoth (`scripts/lib/docxParser.mjs`) and then had Gemini "enrich" it. That lost bullets, numbers and images, and added content that is not in any DOCX. The new parser (`scripts/lib/docxDirectParser.mjs`) reads `word/document.xml` directly, walks it in order, and converts what is there into the block types the reader already renders. **No AI, no guessing, no invented blocks.** A separate verifier checks every output against the DOCX before anything is uploaded.

## 2. Where the scripts are

| File | Role |
|---|---|
| `scripts/lib/docxDirectParser.mjs` | **The parser.** `parseDocxDirect(buffer, { onImage })` returns `{ chapters, stats }`. |
| `scripts/lib/verifyBook.mjs` | Independent checker. Gates every upload. |
| `scripts/book-pipeline/build_reparse_manifest.mjs` | Read-only. Builds the list of the 58 linked books, their source DOCX and new titles. |
| `scripts/book-pipeline/bulk_reparse_books.mjs` | The runner: parse, verify, upload to R2, insert a Draft `resources` row. Dry run by default. |
| `scripts/book-pipeline/rebuild_review_index.mjs` | Rebuilds the review list on R2 from the run records. |
| `scripts/book-pipeline/build_swap_map.cjs` | Regenerates the old-book to new-book map. |
| `scripts/book-pipeline/reparse_book_direct.mjs`, `scripts/upload_book_preview.mjs` | Older one-book pilot tools. Superseded by the bulk script. |
| `scripts/fix_gkgs_guide_chapters.mjs`, `scripts/fix_gkgs_precis_chapters.mjs`, `scripts/fix_mathematics_flat_chapters.mjs` | Make a corrected **copy** of a DOCX (styles/numbering only). Templates for fixing other books. |
| `scripts/lib/docxParser.mjs` | The **old** mammoth parser. Still used by older scripts; not by the 2026 NEW books. |
| `src/pages/sandbox/DevReader.jsx` | The review reader at `/dev-reader` (public, no login). |
| `src/components/book/BookBlocks.jsx`, `BlockRenderer.jsx`, `BookBlocks.css`, `BookBlocksClassic.css` | Render the blocks. |

Records and docs (all in `docs/`):

| File | What it holds |
|---|---|
| `BOOK_REPARSE_REFERENCE.md` | **Read this first after this doc.** Full runbook, findings, gotchas, and the table of every old book to new book. |
| `book_swap_map_2026-10-07.json` | Old book to new book mapping, for the future swap. |
| `bulk_reparse_runs/manifest.json` and `results_*.json` (7 files) | Run records. **Needed for rollback.** Do not delete. |
| `BOOK_STRUCTURE_SCAN_2026-10-06.md` | Scan of all 67 master DOCX files. |
| `GS_GK_REPARSE_HANDOFF_2026-10-05.md`, `GS_GK_Book_Comparison_2026-10-05.md` | The GS & GK pilot and why the old books were wrong. |
| `BULK_REPARSE_PLAN_2026-10-07.md`, `BULK_REPARSE_DRYRUN_2026-10-07.md` | Plan and dry-run report. |
| `CONTENT_TEAM_REVIEW_2026_NEW_BOOKS.md` | What the content team has to check. |

## 3. What the parser does

- Headings come from Word styles only. There is no word-count guessing.
- Word lists and typed bullets ("• text") become nested `list` / `numberedList` blocks, using Word's own numbering counters (so "1.", "1.1" are kept; lists carry `start` and `format`).
- Every drawing (anchored, inline, inside tables) becomes an `image` block in its original place.
- Bold, italic, underline, strike, superscript, subscript, colour, highlight and centring survive. Table header rows come from `<w:tblHeader>`, not "first row".
- An empty Heading 1 is a subject divider, stored as `chapter.part`.
- Cover and contents pages are dropped. A chapter titled "Table of Contents" is dropped.
- **Visual-structure mode** only applies to documents with no Heading 1 at all: a chapter is a prominent paragraph starting CHAPTER / UNIT / PART / LESSON / अध्याय plus a number.
- Output block types: `heading`, `paragraph`, `list`, `numberedList`, `table`, `image`.

## 4. How the pipeline runs for one book

`DOCX` (optionally a fixed copy) → parse → verify → local output in `FINAL_BOOKS_STRUCTURED/_bulk/<id>/` (untracked) → upload to a **new** R2 prefix `structured_resources/blocks/<Category>/<new resource_id>/` → insert one **Draft** `resources` row (title "<old title> 2026 NEW", linked to no exam) → add to the review index.

The runner is insert-only. It refuses to touch existing rows or prefixes, stops at the first error, and checks row counts and anon-key invisibility before and after.

## 5. Running it

Needs a `.env` with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_ANON_KEY`, `R2_PUBLIC_URL`, `R2_BUCKET_NAME` and the R2 credentials. Never hardcode credentials in a script.

```
node scripts/book-pipeline/build_reparse_manifest.mjs                       # rebuild manifest (read-only)
node scripts/book-pipeline/bulk_reparse_books.mjs --only "<title>"          # dry run, writes report_dryrun.md
node scripts/book-pipeline/bulk_reparse_books.mjs --only "<title>" --execute
node scripts/book-pipeline/bulk_reparse_books.mjs --rollback docs/bulk_reparse_runs/results_<run>.json --only "<new title>"
node scripts/book-pipeline/rebuild_review_index.mjs --execute
node scripts/book-pipeline/build_swap_map.cjs
```

Other flags: `--limit N`. Note: `--rollback` is **untested**. Try it on one book first.

To re-run a single book after a fix: fix the DOCX (make a copy in MASTER DOCUMENTS, never edit the original) or the parser, update `TEXT_MATCH` / `EXTERNAL_SOURCES` in `build_reparse_manifest.mjs` if the source changed, roll back the old attempt, dry run, then `--execute`, then save the new `results_*.json` into `docs/bulk_reparse_runs/`. Full steps are in section 7 of `BOOK_REPARSE_REFERENCE.md`.

## 6. Source files

The content team will give Souvik the DOCX books directly. He does not need the K: drive.

- **One book at a time** (simplest): `node scripts/book-pipeline/reparse_book_direct.mjs --src "<file.docx>" --title "<Title> 2026" --category Guide|Precis`. This parses locally only. It does not touch Supabase or R2. Output goes to `FINAL_BOOKS_STRUCTURED/<category>/<slug>/` (untracked): chapter JSON, images, `parse_report.json` and `preview.html`.
- **Bulk runner** (`bulk_reparse_books.mjs`): it reads its book list from the manifest, and `build_reparse_manifest.mjs` hardcodes the old K: path to MASTER DOCUMENTS (the `MASTER` constant near the top, plus two outside-the-library paths in `EXTERNAL_SOURCES`). To use it with a folder from the content team, change `MASTER` to his local folder. The file names must match what the manifest expects, or the book shows as "source_needed".
- The same file name can be many different files, and `resources.source_file` is unreliable. Always confirm with the content team which DOCX is final. Do not guess from the name. Matching by text is described in section 5 of `BOOK_REPARSE_REFERENCE.md`.
- Never edit the DOCX the content team sends. Fix structure in a copy (see the `fix_*` scripts).

## 7. Current state

- **50 new books** exist as Draft rows, titled "... 2026 NEW", linked to no exam. The old books and all exam links are untouched.
- Review them at **https://www.veernxt.in/dev-reader** (`?book=<category>-<title-slug>&ch=N` deep-links). In the admin, Draft counts as "archived", so they appear under *Show archived* on Book Content.
- **Nothing has been swapped or purged.** The policy: the content team signs off all books, then swap, then purge bloat.
- **Not built:** the English Guide (source file undecided).
- The swap itself is a plan only (section 7 of the reference doc). The most recent commit `80084b2` added a "replace a live book with an existing book" action in Book Content (`api/admin/save-resource.js`, `src/components/admin/ReplaceWithExistingModal.jsx`), which is the likely route for swapping one book at a time. It has a dry run and a rollback log.

## 8. Things that will bite you

- **Swap gotcha:** many exams reach books through the legacy `exam_name` text-match fallback, not real links (14,044 of 14,655 Guide/Precis rows). Purging old rows before backfilling real links removes those books from those exams.
- Supabase returns max 1,000 rows per query. Always page with `.range()`.
- Vercel Hobby allows 12 serverless functions. Check `find api -name '*.js' ! -path '*/_*' | wc -l` before adding one.
- Repo files are CRLF. Scripted edits must keep line endings.
- R2 files are cached 300 s, so a re-upload can look stale for 5 minutes.
- Verify RLS with the **anon key**, not only the service role.
- `FINAL_*_STRUCTURED/`, `books/` and `docs/*.xlsx` stay untracked. `docs/bulk_reparse_runs/` and the swap map are small JSON and are tracked.
- No browser automation exists in this environment. Nothing here was verified in a real browser; the verifier, lint, build and data checks were the evidence.
- The pipeline never edits original DOCX files.

## 9. Open questions for the content team

Listed in section 6 of `BOOK_REPARSE_REFERENCE.md`: the English Guide source, the identical-twin pairs and their titles, whether the two outside-the-library DOCX files are final, GS & GK chapter-numbering gaps, large "Practice MCQs" chapters to split, and possible merged or tiny chapters.
