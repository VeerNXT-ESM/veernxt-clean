# Diagrams

Open any `.html` file in a browser. Each is self-contained and interactive: light and dark themes, zoom, pan, and PNG/PDF export from the Export menu. No server needed.

| File | Shows |
|---|---|
| `01-system-architecture.html` | Browser, Vercel, Supabase, R2 and the outside services |
| `02-login-and-registration.html` | OTP login and registration, step by step |
| `03-read-a-book-chapter.html` | How a chapter is fetched and gated |
| `04-profiling-to-recommendations.html` | Profile in, ranked exams out |
| `05-exam-data-model.html` | The exam and content tables, two exam tables included |
| `06-content-pipeline.html` | A Word document becoming a book in the reader |
| `07-site-map.html` | Route groups, including the admin CMS |
| `08-deployment.html` | GitHub, Vercel, secrets and the live services |

## How they were made

Built with [archify](https://github.com/tt-a1i/archify) (Apache-2.0) from the JSON sources in `src/`. Edit a JSON file and rebuild:

```bash
npx skills add tt-a1i/archify          # installs the skill into your agent
node <skill>/bin/archify.mjs finalize <type> src/<name>.json <name>.html --quality showcase
```

`<type>` is `architecture`, `sequence`, `erd`, `dataflow` or `tree`. The tool validates the layout and runs a real-browser check. On a drive that does not support hard links, build in a local folder and copy the `.html` here.

## Honest limits

- Drawn from the code and docs as of 2026-11-01. They are a snapshot, not generated live: re-check after structural changes.
- The data model is read from the live database's schema on 2026-11-01 and trimmed to keys and a few fields. the root `schema.sql` may differ.
- The diagrams cite no source line numbers. Facts were checked by hand against `api/`, `src/App.jsx` and `docs/`.
- The knowledge graph (`graphify`) is separate and not part of this repository.
