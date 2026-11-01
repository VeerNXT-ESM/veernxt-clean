# scripts/

Only the three files the live app imports are kept here. Everything else (maintenance, ingest, audit, seed and test scripts) was deliberately left out of the handover; the incoming team writes its own tooling.

`api/admin/save-resource.js` imports these at runtime, so **do not move, rename or delete them**:

| File | Used for |
|---|---|
| `lib/ingest-drive-content.js` | S3/R2 client, `uploadToR2`, `generateResourceId` |
| `lib/docxParser.mjs` | DOCX to semantic model (mammoth), used for DOCX preview |
| `convert_docx_intros_to_blocks.mjs` | Intro HTML to reader blocks |

Their npm dependencies (`mammoth`, `jszip`, `@xmldom/xmldom`, `@aws-sdk/client-s3`, `@supabase/supabase-js`) must stay in `package.json`.

The older tooling (book pipeline, ingest, exam mapping, db backups, seeds, persona tests) is in the outgoing team's original repository and its git history, not in this copy.
