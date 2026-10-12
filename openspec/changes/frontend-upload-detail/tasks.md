## 0. Polish found in the M6 review

- [x] 0.1 Uploads list on narrow screens: stacked rows (name, status badge, date) so the status is visible without horizontal scrolling at 360 px; the full table stays from 640 px

## 1. Upload page

- [x] 1.1 File validation function (extension, empty, size) with tests
- [x] 1.2 Dropzone component: select, drop, remove, several files, keyboard
- [x] 1.3 Upload action: progress, controls disabled, finishing label, redirect and invalidation
- [x] 1.4 Cancel with abort
- [x] 1.5 Server and network errors, request id

## 2. Detail page

- [x] 2.1 Header, back button, not found and error states
- [x] 2.2 Waiting and working panels with the row counter
- [x] 2.3 Polling transition, live announcement, crossfade and reduced motion
- [x] 2.4 Finished panel: counts and paginated results table
- [x] 2.5 Rejected rows notice
- [x] 2.6 Failed panel

## 3. End to end

- [x] 3.1 Playwright setup and stack script (fresh database, three processes, teardown)
- [x] 3.2 Chromium journeys: valid CSV, rejected rows and missing unit header
- [x] 3.3 Early validation, authoritative server size limit and mid-transfer cancellation without orphan files
- [x] 3.4 Dashboard totals, URL pagination, unknown id and queued-to-completed polling
- [x] 3.5 Five-page axe audit with no serious or critical violations after finite animations settle
- [x] 3.6 Production screenshot command and twenty linked README images at 360/1280 px, normal/reduced motion

## 4. Verification

- [x] 4.1 Lint, types, 289 frontend tests, isolated production build and 13 production Chromium tests pass
- [x] 4.2 Desktop/mobile and reduced-motion captures reviewed; control semantics and focus behavior covered by RTL/axe checks

## Evidence

Production `NEXT_DIST_DIR=.next-e2e E2E_PRODUCTION=1 bun run e2e`: 13/13,
47.2 s on 2026-10-12. The dedicated production screenshot run passed in 15.7 s.
The coordinator reviewed dashboard/detail/list captures; generated images and
commands are linked in `frontend/README.md`. Independent checks found no remaining
suite databases or temporary storage. Build used `.next-redesign`, not a shared
served `.next` directory.

## Deferred

- Original 4.2: a complete manual keyboard-only upload-to-results walkthrough.
  Automated focus/keyboard tests and axe are evidence for their covered controls,
  not a substitute for that full walkthrough. The shared Playwright MCP browser
  was unavailable, and the dedicated journeys primarily use pointer actions.
- Cross-browser and full manual WCAG assessment: the accepted execution scope
  is Chromium plus the five-page automated audit, not universal compliance.
