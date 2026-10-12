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
- [ ] 2.4 Finished panel: counts and paginated results table
- [ ] 2.5 Rejected rows notice
- [ ] 2.6 Failed panel

## 3. End to end

- [ ] 3.1 Playwright setup and stack script (fresh database, three processes, teardown)
- [ ] 3.2 Journeys: valid, invalid rows, wrong header
- [ ] 3.3 Validation, size limit, cancel
- [ ] 3.4 Dashboard, pagination, unknown id
- [ ] 3.5 Axe checks
- [ ] 3.6 Screenshots command and the README images

## 4. Verification

- [ ] 4.1 `bun run lint`, `bunx tsc --noEmit`, `bun run test`, `bun run build`, `bun run e2e` pass
- [ ] 4.2 Visual review at 360 and 1280 px, reduced motion, keyboard only walkthrough
