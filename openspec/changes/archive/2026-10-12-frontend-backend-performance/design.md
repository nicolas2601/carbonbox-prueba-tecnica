## Decisions

### Measure first, in the real thing
Completed figures come from the real API/worker against owned disposable PostgreSQL databases and storage. Autocannon response-event samples retain unrounded percentiles; raw outputs and the machine/method are recorded. Browser Performance API measurements were planned but not delivered and are deferred, never inferred from screenshots or a successful build.

### Budgets are small and checkable
The verified gate is API p95 at most 50 ms at 20 concurrent connections for list, stats and a 25-row results page of a 5000-row upload on the reference machine. Worker throughput is recorded without a floor. Dashboard 200 KB gzip, LCP 1.8 s and CLS 0.05 remain deferred browser targets, not achieved budgets.

### Cheapest wins first
Existing M7/M8 dynamic charts, Latin font configuration and stopped terminal polling were inspected. No new staleTime, hover-prefetch or asset-cache tuning was applied. The measured API change retains gzip for its 71.21%/65.87% wire reduction, while documenting higher local latency. The candidate index was rejected: 4.79% HTTP improvement was below the 30% gate and observed worker throughput fell 10.09%.

### Cache with care
All upload-data responses (list, totals, detail and results) use `no-store`; no `max-age` or private data caching is introduced.
Immutable hashed assets are the only planned caching exception; a frontend wire-header audit remains deferred. Compression is evaluated separately from freshness.

### Index for the actual query
The results endpoint filters by upload and orders by date then id. Measure its actual plans and timing first. Add an additive composite index only if those
numbers support it; compare first and deep pages on the same dataset. Do not force the planner or add a migration solely to satisfy an assumption.

### Bounded finish decision
The measured default API/worker pg pools are 10 and the worker batch is 500 across baseline, index candidate and final response-policy profiles.
Every required API p95 is below 50 ms. The coordinator explicitly removed the alternate pool/batch matrix from scope because there is no demonstrated
capacity bottleneck requiring that tuning. Keep the 1,000 ms queue poll and record its end-to-end trade-off. This is a documented decision, not a silently skipped experiment.

## Risks

- Performance numbers vary between machines; the document states the machine and the method and compares only runs on the same one.
- Aggressive data caching can hide status transitions; upload data remains uncached and this is tested.
- Browser/CWV measurements were assigned to worker2 but no verified baseline was delivered. API/worker load runs were serial and used their own profiles.
- Every benchmark owns a fresh `carbonbox_perf_*` database and temporary storage; development and shared test databases are refused.

## Deferred

- Cold route/transfer/request measurements and repeated browser LCP/CLS: no actual browser baseline is available.
- Bundle/chunk transfer and font-request/preload budgets: source import/font checks do not quantify downloads.
- Explicit query stale-time/hover prefetch and frontend asset-header/layout-shift tuning: not implemented or measured; existing behavior stays unchanged.
- Alternate pool/batch matrix: deliberately excluded by the coordinator's measured-defaults decision, not performed and not counted as a benchmark.
