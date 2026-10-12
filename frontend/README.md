# CarbonBox frontend

The activity ledger uses Next.js 16.4, React, TanStack Query, Axios and Tailwind CSS 4.
`DESIGN.md` is the visual source of truth: Carbon Day's cool tinted surfaces,
orange graphics, graphite rail, Manrope text and figures, JetBrains Mono data.
`PRODUCT.md` records the analyst workflow and product tone.

## Run

From this directory:

```sh
bun install
bun run dev
```

Configure `NEXT_PUBLIC_API_URL` using `.env.example`; the default is
`http://localhost:3001/api/v1`. The backend API and worker must also be running.
The API's `CORS_ORIGIN` must match the frontend origin. Public environment values
are embedded at build time; changing the API URL requires rebuilding.

```sh
bun run lint
bunx tsc --noEmit
bun run test
bun run build
bun run start
```

Fonts are self-hosted with `next/font/local` from `src/app/fonts/` (Manrope and
JetBrains Mono, latin variable woff2), so the build needs no network access.
Next generates route types at build time, so a fresh checkout should build before
relying on generated types.

## Structure and behavior

- `src/app`: server layout and thin route composition. The uploads route resolves
  asynchronous `searchParams` inside Suspense, as required by Cache Components.
- `src/features/uploads`: client views and hooks. Data is deliberately fetched in
  the browser because it polls and reacts to navigation; there is no server API
  prefetch. The server does not share a browser QueryClient across requests.
- `src/lib/api`: one typed Axios client, normalized `ApiError` and key factory.
  Production explicitly prefers XHR before Fetch for upload progress support.
- `src/components`: accessible shell, states, badges, cards, buttons and pagination.

Upload detail and active list queries poll every 3000 ms for PENDING/PROCESSING;
terminal states stop polling. Dashboard totals poll every 5000 ms only while
`inProgress > 0`. Pagination lives in the URL and keeps previous rows visible.
Client errors are never retried; transient errors have bounded retries.

## Verification and scope

### Browser execution authorization

Nico directly authorized a narrow exception on 2026-10-11: only this frontend's
`bun run e2e` and `bun run e2e:screenshots` scripts may launch headless Chromium.
All other exploration, visual review and screenshot inspection uses Playwright MCP.
This is not permission for another script or an ad-hoc command to launch a browser.

Vitest tests use Testing Library and MSW 3 to intercept actual Axios requests.
DOM tests choose the Fetch adapter only in test setup; production retains XHR
first. Multipart wire tests use native Node Web APIs because mixing jsdom File
objects with native Fetch produced empty blobs and parsing errors. Tests verify
multipart headers, filename and file bytes, not just a mocked call.

Current routes include dashboard `/`, the paginated list `/uploads`, file selection
and transfer `/uploads/new`, and live detail/results `/uploads/[id]`. Cancellation
aborts transfer before Finishing, keeps selection and makes no rollback promise
after all bytes have been sent. No authentication, dark mode or i18n is included.
Dashboard charts show real upload totals and handled rows in the latest 12 uploads.
Recharts is dynamically loaded by the dashboard, not imported by the shared shell.
The sidebar's small completion indicator uses native SVG. API readiness is checked
every 30 seconds separately from upload polling.
Motion is limited to transform/opacity; reduced motion removes entrances, stagger
and pulses. Processing pulses pause when offscreen. Verification also requires
Playwright checks of layout, focus and real API behavior at mobile and desktop widths.

### Reproducible browser suite

```sh
bunx playwright install chromium
bun run e2e
NEXT_DIST_DIR=.next-e2e E2E_PRODUCTION=1 bun run e2e
NEXT_DIST_DIR=.next-e2e E2E_PRODUCTION=1 bun run e2e:screenshots
```

Only Chromium is required (its installer may also download its headless shell and
FFmpeg). The suite connects to local PostgreSQL's `postgres` administrative database,
creates a unique `carbonbox_e2e_*` database and temporary storage, migrates, starts
API/worker/frontend on allocated test ports and cleans owned resources on success
or failure. Configuration refuses the development/test database and an unowned
stack. `E2E_ADMIN_DATABASE_URL` can override local credentials but must still target
the local `postgres` database. Never run independent suites concurrently from the
same frontend build directory.

Cases cover valid/mixed/wrong-header CSVs, early validation, server limits,
mid-transfer cancel/no orphan file, totals, URL pagination, unknown id and axe on
five pages. Serious/critical axe issues fail the suite. Screenshots are generated
into `docs/screenshots` for five pages at 1280 and 360 px in normal and reduced
motion, twenty images in total. Captures wait for fonts, actual figures, lazy
charts and finite animations; no fixed page sleeps are used. Production mode
builds before starting Next, so the development badge is absent.

On 2026-10-12 the complete Chromium suite passed: 13 tests, including five axe
audits, in development (49.2 seconds) and production (latest run: 47.2 seconds). The
dedicated production capture run passed in 15.7 seconds. Independent queries
after capture found no remaining `carbonbox_e2e_*` databases or temporary storage.
Actual browser failures led to an unfocusable decorative pie and removal of row
entrance opacity that temporarily reduced text contrast. Thresholds and journey
assertions were not relaxed. Unit tests: 289; lint, types and production build pass.
This is Chromium evidence, not a cross-browser or complete manual WCAG audit.
Redesign builds use `NEXT_DIST_DIR=.next-redesign bun run build`; the owned E2E
runner defaults to `.next-e2e`. Neither overwrites a concurrent `.next` verifier.
Use the same `NEXT_DIST_DIR` when serving a build.

| Page | Desktop | Mobile | Reduced motion |
|---|---|---|---|
| Dashboard | [1280](../docs/screenshots/dashboard-1280.png) | [360](../docs/screenshots/dashboard-360.png) | [1280](../docs/screenshots/dashboard-1280-reduced.png), [360](../docs/screenshots/dashboard-360-reduced.png) |
| Uploads | [1280](../docs/screenshots/uploads-1280.png) | [360](../docs/screenshots/uploads-360.png) | [1280](../docs/screenshots/uploads-1280-reduced.png), [360](../docs/screenshots/uploads-360-reduced.png) |
| Upload | [1280](../docs/screenshots/upload-1280.png) | [360](../docs/screenshots/upload-360.png) | [1280](../docs/screenshots/upload-1280-reduced.png), [360](../docs/screenshots/upload-360-reduced.png) |
| Completed | [1280](../docs/screenshots/detail-completed-1280.png) | [360](../docs/screenshots/detail-completed-360.png) | [1280](../docs/screenshots/detail-completed-1280-reduced.png), [360](../docs/screenshots/detail-completed-360-reduced.png) |
| Failed | [1280](../docs/screenshots/detail-failed-1280.png) | [360](../docs/screenshots/detail-failed-360.png) | [1280](../docs/screenshots/detail-failed-1280-reduced.png), [360](../docs/screenshots/detail-failed-360-reduced.png) |

## Component licenses

| Library | License | Use |
|---|---|---|
| shadcn/ui | MIT | Copied, token-themed primitives; notice in `src/components/ui/LICENSE` |
| Recharts | MIT | Dashboard-only area, donut, bars and radial gauge |
| React Bits | MIT + Commons Clause v1.0 | Minimal CountUp and SpotlightCard adaptations only |
| motion | MIT | Active navigation pill, counting and pointer-follow light |
| Lucide | ISC, with MIT-derived Feather icons | Consistent interface icons |

React Bits is **not unrestricted MIT**. Its copyright and permission notice are
retained in `src/components/react-bits/LICENSE`. Embedded use in an application,
website or product, including commercial use, is allowed; selling, sublicensing
or redistributing the components themselves (alone, bundled or ported) is not.
Source: https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md.
The adaptations remove its default palettes, ambient effects and broad settings;
reduced motion shows the final figure and no moving spotlight.
