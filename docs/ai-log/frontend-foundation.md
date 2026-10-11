# Frontend foundation AI usage

Date: 2026-10-11

- Implemented the 17 OpenSpec tasks with task-level commits and observed REDs:
  test setup, design tokens/fonts, accessible shell, typed API transport and keys,
  query provider/hooks, shared components, dashboard and URL-paginated list.
  No backend code or persistence schema changed; upload/detail pages remain M7.
- Read DESIGN.md and installed Next 16.4 documentation before coding. Cache
  Components is enabled: the thin uploads route resolves asynchronous searchParams
  inside Suspense. Features fetch in client components for polling/navigation;
  layout remains server-rendered. README states these choices and font build-network
  requirements rather than implying server API prefetch.
- Applied Emil design engineering plus UI Skills baseline/accessibility. The local
  review-animations invocation was unavailable; loaded the registry equivalent
  and its standards for the motion review. No gesture/material behavior required
  an Apple-specific implementation or another dependency.
- Dev dependencies use caret ranges. Current versions include Vitest 5.0.3,
  Testing Library React 16.3.3, user-event 14.6.7, jest-dom 7.0.1, jsdom 30.1.2 and
  MSW 3.0.3. Context7 plus installed code exposed MSW 3 changes: designated
  msw/http imports and onUnhandledFrame, not the older onUnhandledRequest option.
- The first Axios/XHR test failed with Network Error in jsdom. DOM tests select
  native Fetch only in setup. A multipart test then exposed mixed jsdom/native
  File/FormData behavior: an empty blob filename and native parser assertion.
  Transport tests use Node Web APIs and assert real multipart boundary, filename
  and CSV bytes. These are not mocked Axios return values.
- Production explicitly uses adapter [xhr, fetch]. Its ordering regression failed
  first; browser resource entries later confirmed xmlhttprequest transport. Upload
  progress conversion is bounded and tested, but upload-page progress UI is M7 and
  is not claimed as visually verified here.
- Error normalization reads the backend envelope, preserves requestId, handles
  malformed responses and unreachable servers without exposing transport details.
  Provider identity survives rerenders; a real 404 response is requested once.
  Query keys share the upload invalidation root and distinguish ids/pages/limits.
- Pure polling functions and fake timers verify 3000 ms for PENDING/PROCESSING,
  terminal stop, and 5000 ms stats polling only with active work. Deferred MSW
  responses prove previous list rows remain while the next page loads. URL parsing
  rejects non-integers, duplicate values and unsafe offsets rather than clamping.
- Shared tests cover badges and color pairs, offscreen pulse cleanup, pagination
  boundaries, retry/request id, empty action, skeleton semantics, grouped figures
  and zero/null counters. Source guards fail on hex colors outside globals.css or
  transition-all. Fraunces explicitly includes its opsz axis.

## Real browser verification

- Created the new local carbonbox_m6_visual_20261011 database and migrated it;
  did not use carbonbox_test or the development database. API, worker and production
  frontend ran as three real processes. Curl uploaded sample-data, sample-invalid,
  sample-large and nine additional files for pagination.
- First production inspection found a real 404 caused by automatic Next prefetch
  of the not-yet-implemented creation route. Disabled prefetch for future creation
  and detail links, without expanding scope into those pages. A props regression
  failed first; normal browser navigation then reported zero console errors.
- Screenshot matrix: dashboard/list at 360/1280 px, both normal and reduced motion.
  At 360, document width is 345 px (vertical scrollbar), table region 303 px and
  internal table widths 600/760 px. At 1280, document width is 1265 px. No document
  horizontal overflow. Reduced-motion animation names were all none; fonts loaded
  from self-hosted assets and both pages had one main landmark.
- Read screenshots rather than trusting successful capture. Desktop ledger and
  mobile single-column cards preserve the specified hierarchy. Narrow tables retain
  all columns in their scroll region rather than spilling across the document.
- Real navigation verifies invalid page -> 1, Next -> ?page=2, reload/back and two
  records on page 2 (mixed CSV processed 15, valid CSV 60). The list shows 5,000
  with grouping. Keyboard arrows scroll the table 200 px; minimum visible target
  height is 40 px. Skip link focuses main with a 2 px ring and 2 px offset.
- Held the worker, uploaded a valid file and a missing-header CSV, then restarted
  it. Browser totals updated 14/12/2/0 -> 14/13/0/1 and badges changed from Pending
  to Completed/Failed without reload. Observed zero stats/list requests for 6200 ms
  after terminal data. This verifies real polling stop, not only fake timers.
- Stopped only the isolated API: UI showed a readable network error and retry.
  Restoring it and clicking retry recovered the real list. Three network console
  errors during the deliberate outage were expected; subsequent navigation was clean.
- Screenshot storage initially rejected /tmp as outside Playwright's allowed
  roots. Captures were saved under its allowed output directory instead.

## Motion review

| Before | After | Why |
|---|---|---|
| Symmetric 160 ms pointer press/release | 160 ms press/hover, 100 ms transform release | Snappier response; CSS transitions stay interruptible |

Verdict: Approve. Entrances use transform/opacity, 280 ms ease-out and 40 ms
stagger; keyboard focus suppresses entrances, press feedback excludes keyboard,
processing pulses pause offscreen, and reduced motion removes movement/pulses.

## Evidence and limits

- Final lint, TypeScript, 93 tests and production build pass. AST scan covers
  48 authored source/config files and 189 functions: no explicit any, maximum
  file 127 lines and function 20 lines. Diff and strict OpenSpec checks pass.
- One final command incorrectly used bunx --cwd frontend: Bun interpreted
  frontend as a package, installed it in a new /tmp cache and failed its legacy
  node-sass build. Repository dependencies were unchanged. Re-ran the requested
  commands from the frontend directory, all green, and removed only that inspected
  newly-created temporary cache. This was an execution mistake, not a project failure.
- Computed text contrast: ink/paper 15.14, muted/paper 5.64, accent pair 8.03;
  status pairs 5.18/5.95/6.15/5.89, all above 4.5. Corrected DESIGN's estimated
  ink ratio without changing its colors. This is not a full WCAG certification.
- Screenshot directory: /home/nicolas/.playwright-mcp/carbonbox-m6-0i7ykA.
  Matrix files are dashboard/uploads-{360,1280}-{motion,reduced}.png; additional
  empty, pending, terminal, offline and keyboard-scroll captures document checks.
- No push, archive or branch switch. Coordinator reviews and closes M6.
- Isolated processes were stopped. The new visual database and its temporary
  storage remain available as review evidence; no test/development data was deleted.
