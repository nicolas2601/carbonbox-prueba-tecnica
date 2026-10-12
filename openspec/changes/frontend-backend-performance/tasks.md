## 1. Baseline

- [ ] 1.1 Measure route sizes and cold load metrics of the three pages in a real browser; write `docs/performance.md` baseline
- [x] 1.2 Measure API latency and throughput under 20 concurrent connections for the four endpoints; worker throughput on the 5000 row sample

## 2. Frontend

- [ ] 2.1 Dynamic import of the chart library with a same size skeleton
- [ ] 2.2 Font weights and subsets, preload
- [ ] 2.3 Query stale time, prefetch on hover, polling stop check
- [ ] 2.4 Compression and cache headers for assets; layout shift review

## 3. API and database

- [ ] 3.1 Candidate index experiment and before/after plan evidence; production migration only for a measured >=30% improvement without worker-write regression
- [ ] 3.2 Response compression and cache headers
- [ ] 3.3 Pool and batch size experiments

## 4. Verification

- [ ] 4.1 Re-measure; before and after tables; budgets met or reasons documented
- [ ] 4.2 Full unit, integration and end to end suites still pass
