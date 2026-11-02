# Front-end map

How the React app in `src/` is put together. For the route list as a picture see `diagrams/07-site-map.html`.

## Routing and layouts (`src/App.jsx`)

All routes are in `App.jsx`. There are four kinds:

| Kind | Wrapper | Examples |
|---|---|---|
| Stand-alone pages | none | `/` (landing or redirect), `/login`, `/financial-guidance`, `/pay` |
| Signed-in app | `V2Layout` (slim header, footer, phone bottom bar). Most pages also use `AuthGuard` | `/learning-center`, `/jobs`, `/network`, `/profiling`, `/employer/*` |
| Home group | `AuthGuard` + `V2Layout` | `/home`, `/home/me`, `/home/messages` |
| Reader | `AuthGuard` only (full screen, own bar) | `/reader/:id` |
| Admin | `AdminShell` (own sidebar) | `/admin/*`, login at `/admin/login` |

- `/` shows the marketing landing page to signed-out visitors and redirects signed-in users to `/home` (`RootRoute`).
- `AuthGuard` (`src/components/AuthGuard.jsx`) redirects to `/login`, and sends users who have not completed profiling to `/profiling` unless the route has `skipProfilingCheck`.
- Old `/v2`, `/v2/me`, `/v2/messages` redirect to `/home...`; `/v2/learning/*` redirects to `/learning-center`.
- `/dashboard` and `/home/me` render the same `Dashboard` page.

## The header and `/home`

- `src/v2/V2Layout.jsx` is the only header: logo (left), four links (Learning, Jobs, Finance, Legal) with icons, messages icon and avatar menu (right). Employers get Dashboard and Find Candidates instead.
- The four links come from `src/v2/sections.js`. Change them there.
- `src/components/ui/AccountMenu.jsx` is the avatar menu (profile, network, rewards, theme, support, logout).
- `/home` is `src/v2/UniversalLanding.jsx`: four section tiles, the "What is VeerNXT?" write-up and stats (shared translation keys, so language follows the landing page) and an Antogattva Foundation card. **The foundation text is placeholder wording**: replace it with approved copy.

## Learning Center

`/learning-center` (`src/pages/LearningCenter.jsx`) is the single Learning Center. Exam pages: `/exam/:examId`; materials: `/study-materials`; quizzes and previous-year papers have their own centers. The v2 Learning pages that used to exist were removed.

## Jobs

`/jobs` renders `src/components/JobBoard.jsx` with three tabs: v2 jobs, legacy jobs and **Private Sector**. The Private Sector tab embeds `PrivateSectorHome`, `PrivateSectorOpportunities` and `PrivateSectorProfile`, which also work stand-alone at `/private-sector/*`.

## Theming and look

- Light mode is the default. Dark mode is `data-theme="dark"` / `.dark` on `<html>`, set by `src/context/ThemeContext.jsx` and remembered in `localStorage`.
- Tailwind v4 is configured in `src/index.css`; its `dark:` variant follows the same attribute. The landing page uses `dark:` pairs: white in light mode, near-black in dark mode.
- The look is deliberately square and corporate: the shared radius tokens (`--radius-sm/md/lg/pill`) are 2px and hard-coded radii were flattened, except circles (50%) and the reader and book-cover files.

## Banner CMS (Admin > Banners)

- All CMS-managed banners and landing media are listed in one array, `BANNER_SLOTS` in `src/lib/bannerStore.js`: page, size, editable text fields and the built-in default.
- The `site_banners` table (migrations `sql/site_banners.sql`, `sql/site_banners_video.sql`) only stores overrides. An empty field falls back to the default in code, so with no rows the site looks as designed.
- Defaults for the landing page are files on R2 (`site/landing/`, base address in `SITE_MEDIA_BASE`). Replace one from Admin > Banners, or change the constant if the bucket's public address changes.
- Admin > Banners is split into tabs (Marketing page, Home page, Learning Center, Jobs, Finance, Legal). Finance and Legal have no slots yet; to add one, append an entry to `BANNER_SLOTS` and put the tab's page name in `BANNER_TABS` (`src/pages/admin/BannersPage.jsx`).
- **Videos are separate.** The six "What is VeerNXT?" YouTube videos are rows in the `site_videos` table (`sql/site_videos.sql`), edited in Admin > Videos (`src/pages/admin/VideosPage.jsx`) and read by `src/lib/videoStore.js` (`useLandingVideoId`). A language with no row uses the default id in `videoStore.js`. Admin writes go through `api/admin/misc.js`, which lists `site_videos` in `WRITABLE_TABLES`.
- Hooks: `useBanner(key)` returns the resolved banner for a slot; `bannerImageStyle()` turns it into a CSS variable.

## Where data comes from

- Most reads go straight from the browser to Supabase with the anon key (RLS applies).
- Anything privileged goes through `api/` (see `VERCEL_FUNCTIONS.md`): OTP, registration, payments, points, the profiling engine, the chapter gate, jobs, and every admin write.
- Book chapters are fetched through `api/exams.js?fn=chapter` so locked content can be gated.

## Conventions worth knowing

- JavaScript only, no TypeScript, no tests. Click through the flows after any refactor.
- Page-level CSS lives beside the page (`LearningCenter.css`, `FinancialGuidance.css`); `src/v2/v2.css` styles the header and `/home`.
- Many components embed a `<style>` block in the JSX. Look there before hunting for a stylesheet.
- Repo files use CRLF line endings; keep them when scripting edits.
