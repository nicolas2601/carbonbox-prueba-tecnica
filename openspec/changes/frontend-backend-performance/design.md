## Decisions

### Measure first, in the real thing
Frontend figures come from a production build in a real browser using the Performance API (navigation timing, LCP and CLS observers) through the browser
automation tool; API figures come from a load tool against the real API and database with the sample files. Guessing is rejected: each change must move a number.

### Budgets are small and checkable
Dashboard first load JS at most 200 KB gzip, LCP at most 1.8 s and CLS at most 0.05 on a cold load of the production build on localhost, API p95 at most 50 ms at
20 concurrent connections for list, stats and a 25 row results page of a 5000 row upload, and worker throughput recorded (rows per second) without a floor.

### Cheapest wins first
Order: remove what is not needed (unused font weights, unused code), split what is heavy (charts), cache what repeats (query staleTime, HTTP caching, compression),
index what is slow (results ordering). Bigger moves (CDN, edge, SSR changes) are listed but not done.

### Cache with care
All upload-data responses (list, totals, detail and results) use `no-store`; no `max-age` or private data caching is introduced.
Only immutable hashed assets receive long caching. Compression is evaluated separately from freshness.

### Index for the actual query
The results endpoint filters by upload and orders by date then id. Measure its actual plans and timing first. Add an additive composite index only if those
numbers support it; compare first and deep pages on the same dataset. Do not force the planner or add a migration solely to satisfy an assumption.

## Risks

- Performance numbers vary between machines; the document states the machine and the method and compares only runs on the same one.
- Aggressive data caching can hide status transitions; upload data remains uncached and this is tested.
- Browser/CWV measurements belong to worker2. API/worker load runs serially, never concurrently with their browser baseline.
- Every benchmark owns a fresh `carbonbox_perf_*` database and temporary storage; development and shared test databases are refused.
