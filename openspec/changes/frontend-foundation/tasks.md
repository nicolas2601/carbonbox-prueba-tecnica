## 1. Foundation

- [x] 1.1 Test setup: Vitest, Testing Library, MSW, jsdom; `test` script
- [x] 1.2 `DESIGN.md` in place; tokens and fonts in the global stylesheet and layout; stray color and transition checks as tests
- [x] 1.3 Shell: layout, navigation, skip link, focus ring

## 2. API client

- [x] 2.1 Axios instance and `ApiError` normalization
- [x] 2.2 Typed functions and query key factory
- [x] 2.3 Query provider with no retry on 4xx
- [x] 2.4 Hooks for stats, list, detail and results with the polling rule

## 3. Shared components

- [x] 3.1 `StatusBadge`
- [x] 3.2 `Pagination`
- [x] 3.3 Skeleton, empty and error states
- [x] 3.4 `StatCard`

## 4. Pages

- [x] 4.1 Dashboard: totals, create link, refresh rule
- [x] 4.2 Dashboard: recent uploads and states
- [ ] 4.3 List: table, badges, processed rows
- [ ] 4.4 List: page in the URL, previous data, states, small screens

## 5. Verification

- [ ] 5.1 `bun run lint`, `bunx tsc --noEmit`, `bun run test`, `bun run build` pass
- [ ] 5.2 Manual check with the real API in a browser: dashboard and list, mobile and desktop widths, reduced motion
