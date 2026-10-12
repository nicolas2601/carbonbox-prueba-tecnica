## 1. Baseline

- [x] 1.1 Publish the actual backend machine/method/raw baseline and explicitly identify missing browser measurements
- [x] 1.2 Measure API latency and throughput under 20 concurrent connections for the four endpoints; worker throughput on the 5000 row sample

## 2. Frontend

- [x] 2.1 Verify the existing M8 dashboard-only dynamic chart boundary and loading placeholder in source/production journeys
- [x] 2.2 Verify Sora 400/500/600, Geist/Geist Mono, Latin subsets and display swap in the existing font configuration
- [x] 2.3 Verify terminal/unknown-upload polling stop through existing RTL and Chromium journeys, without changing stale time or prefetch

## 3. API and database

- [x] 3.1 Candidate index experiment and before/after plan evidence; measured and rejected (4.79% HTTP improvement, 10.09% lower worker throughput), no production migration
- [x] 3.2 Response compression and cache headers; 71.21% / 65.87% list/results wire reduction, fresh upload data, no request decompression
- [x] 3.3 Defaults 10/500 measured in three profiles; no tuning justified, alternate pool/batch matrix explicitly out of scope by coordinator decision

## 4. Verification

- [x] 4.1 Backend before/candidate/after tables, p95 budget, bandwidth gate and rejected-index tradeoffs documented
- [x] 4.2 Final local suites pass: backend 505 aggregate tests, frontend 289 tests, production Chromium 13/13, types/build/lint as applicable

## Deferred

- Original 1.1: production route sizes and cold browser metrics for dashboard,
  list and detail. The assigned browser baseline was not delivered; no numbers
  are invented from screenshots or build success.
- Browser portion of 4.1: three-run cold LCP/CLS medians and the 200 KB gzip
  first-load budget. These remain targets, not passed acceptance gates.
- Original 2.2 quantitative font request/preload audit: current font source was
  checked, but network requests were not counted or benchmarked.
- Original 2.3 explicit stale-time and hover/visible-prefetch tuning: not applied
  or validated in a measured navigation profile; terminal polling checks are done.
- Original 2.4: frontend asset compression/cache wire audit and layout-shift
  measurements. Backend gzip/no-store evidence does not establish these results.
- Alternate pool/batch matrix: explicitly excluded by the coordinator after
  defaults 10/500 met the API budget; no alternative-profile claim is made.
