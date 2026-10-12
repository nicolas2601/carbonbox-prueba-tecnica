## 0. Safe working setup

- [x] 0.1 `next.config.ts` reads an optional `NEXT_DIST_DIR` so builds for this work go to a separate ignored directory and never overwrite a build another session is serving

## 1. Visual system

- [x] 1.1 Tokens, fonts (Sora, Geist, Geist Mono) and global styles; stray color and font tests
- [ ] 1.2 Contrast test for every text and badge pair
- [x] 1.3 Base components: Card, Button, StatusBadge, Table, focus ring, reduced motion

## 1b. Brand and navigation

- [x] 1b.1 shadcn/ui init with Tailwind 4, tokens mapped, base components themed (Button, Card, Badge, Table, Skeleton, Sheet, Tooltip, Separator, Chart)
- [x] 1b.2 `LogoMark`, `Lockup`, favicon and Apple icon from the single SVG source in `assets/logo-mark.svg`
- [x] 1b.3 Sidebar with active pill, completion mini gauge and API status dot
- [x] 1b.4 Mobile top bar and drawer
- [x] 1b.5 React Bits CountUp and SpotlightCard adapted, licenses checked and recorded

## 2. Shell and dashboard

- [ ] 2.1 Shell: sidebar, responsive top bar, live completion gauge
- [ ] 2.2 Donut and status bars from the totals (Recharts), with the empty case
- [ ] 2.3 Activity chart (Recharts) with real uploads, hidden table and empty state, dynamic import
- [ ] 2.4 Dashboard grid, stat cards, latest upload, skeletons and partial error states

## 3. Pages

- [ ] 3.1 Uploads list restyle with stacked rows on mobile
- [ ] 3.2 Upload page restyle: dropzone, progress, errors
- [ ] 3.3 Detail page restyle: header, state panels, summary, notice, table

## 4. Verification

- [ ] 4.1 `bun run lint`, `bunx tsc --noEmit`, `bun run test` pass; existing behaviour tests unchanged
- [ ] 4.2 `bun run build` passes
- [ ] 4.3 Fresh visual review at 360 and 1280 px and reduced motion by worker2, findings fixed
- [ ] 4.4 `bun run e2e` and `bun run e2e:screenshots` pass (authorized exception) with new README images
