# Security notes for the incoming team

Findings from the handover review (2026-11-01). Nothing here has been fixed in the code: fixing them is yours to schedule. Secret values are **not** written in this repo; they are in the team password manager.

## 1. The admin API secret is public (high)

- The browser reads `VITE_ADMIN_API_SECRET` (`src/lib/adminDb.js`, `src/lib/r2Uploader.js`, `src/lib/resourceDuplicates.js` and others) and sends it as the `x-admin-api-secret` header.
- Anything named `VITE_` is compiled into the public JavaScript bundle. A build check on 2026-11-01 found the secret's value inside `dist/assets/*.js`.
- The admin endpoints (`api/admin/save-resource.js`, `misc.js`, `legal-aid.js`) accept that header as proof of admin rights. A comment in `api/admin/misc.js` already says it is "not real auth".
- **Effect:** anyone who reads the site's JavaScript can call admin endpoints: edit or publish content, write banners, upload to R2.
- **Fix direction:** authenticate admin calls with the signed-in admin's Supabase session (verify the JWT and role in `api/_lib/adminAuth.js`), stop sending the secret from the browser, then **rotate `ADMIN_API_SECRET`** (it is in the old bundle forever).

## 2. `vite.config.js` exposes every `SUPABASE_*` variable to the build

`envPrefix: ['VITE_', 'SUPABASE_']` means any `SUPABASE_*` variable the client code touches could be inlined. The 2026-11-01 check found no service-role key, JWT secret or access token in the bundle, but one place reads the whole `import.meta.env` object. Change `envPrefix` to `['VITE_']` and read the one needed value through a `VITE_` name.

## 3. `DEVTEST` skips the payment amount check

`api/payments/actions.js` skips the Razorpay amount comparison when `DEVTEST === 'true'`. It must be unset in production. Check the Vercel environment variables.

## 4. OTP simulation mode

If `MSG91_AUTH_KEY` or `MSG91_TEMPLATE_ID` is missing, `api/auth/otp.js` pretends to send an OTP and accepts the fixed code `123456`. Production must have both set. A missing variable would silently turn on a known OTP.

## 5. Dev and test routes are public

`/dev-reader`, `/dev-quiz-preview`, `/profiling-tester`, `/admin/profiling-tester` and `/demo-cards` are routed without a login check (`src/App.jsx`). Remove or guard them.

## 6. Old keys

The previous repository (`VeerNXT-ESM/veernxt-web`) and some local archives still contain live keys: Supabase service-role key and access token, Razorpay secret, R2 secret, MSG91, admin secret, plus unused OpenAI, GCP and AI-proxy keys. This repository was started with no history, but those keys are still valid until rotated. Rotate them, then make the old repository private or archive it.

## 7. Row-level security

Test RLS with the anon key, not only the service-role key. The database has 47 tables and views; check each user-facing table has an RLS policy before relying on it.
