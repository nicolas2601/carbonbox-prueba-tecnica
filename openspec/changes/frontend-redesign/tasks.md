## 0. Safe working setup

- [x] 0.1 `next.config.ts` reads an optional `NEXT_DIST_DIR` so builds for this work go to a separate ignored directory and never overwrite a build another session is serving

## 1. Visual system

- [x] 1.1 Tokens, fonts (Sora, Geist, Geist Mono) and global styles; stray color and font tests
- [x] 1.2 Contrast test for every text and badge pair
- [x] 1.3 Base components: Card, Button, StatusBadge, Table, focus ring, reduced motion

## 1b. Brand and navigation

- [x] 1b.1 shadcn/ui init with Tailwind 4, tokens mapped, base components themed (Button, Card, Badge, Table, Skeleton, Sheet, Tooltip, Separator, Chart)
- [x] 1b.2 `LogoMark`, `Lockup`, favicon and Apple icon from the single SVG source in `assets/logo-mark.svg`
- [x] 1b.3 Sidebar with active pill, completion mini gauge and API status dot
- [x] 1b.4 Mobile top bar and drawer
- [x] 1b.5 React Bits CountUp and SpotlightCard adapted, licenses checked and recorded

## 2. Shell and dashboard

- [x] 2.1 Shell: sidebar, responsive top bar, live completion gauge
- [x] 2.2 Donut and status bars from the totals (Recharts), with the empty case
- [x] 2.3 Activity chart (Recharts) with real uploads, hidden table and empty state, dynamic import
- [x] 2.4 Dashboard grid, stat cards, latest upload, skeletons and partial error states

## 3. Pages

- [x] 3.1 Uploads list restyle with stacked rows on mobile
- [x] 3.2 Upload page restyle: dropzone, progress, errors
- [x] 3.3 Detail page restyle: header, state panels, summary, notice, table

## 4. Verification

- [x] 4.1 `bun run lint`, `bunx tsc --noEmit`, `bun run test` pass; existing behaviour test intents preserved, fixture/markup adjustments documented in the AI log
- [x] 4.2 `NEXT_DIST_DIR=.next-redesign bun run build` passes without touching the served `.next`
- [x] 4.3 Fresh visual review at 360 and 1280 px and reduced motion by the reassigned coordinator/worker, findings fixed
- [x] 4.4 `bun run e2e` and `bun run e2e:screenshots` pass (authorized exception) with new README images

## Evidence

Twenty normal/reduced-motion production captures exist at 360/1280 px. The
coordinator accepted dashboard, failed-detail and mobile-list review. The latest
production Chromium suite passed 13 tests in 47.2 s; frontend 289 tests, lint,
types and isolated build pass. Existing behavior test intents were preserved.
The design-system delta explicitly supersedes the canonical warm-theme font
requirement so archiving does not leave contradictory typography specifications.

## Deferred

- Cold-load transfer/chunk, LCP and CLS measurements: targets remain unverified
  and are listed in the performance change, not counted as screenshot evidence.
- Optional visual refinement: activity-card whitespace and distinct same-day
  axis labels. The coordinator marked these non-blocking; no new UI is introduced.
- Source-only critique follow-up: state-specific overview heading, mobile details
  affordance and consolidation of the drag glow token. Not a new runtime audit.
- Full manual keyboard-only, cross-browser and WCAG assessment: covered automated
  checks do not establish complete compliance.
