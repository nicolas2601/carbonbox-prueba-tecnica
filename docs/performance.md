# Performance evidence

## Reference method

Date: 2026-10-12. Baseline application/measurement commit: `e70f7b2`.
Machine: AMD Ryzen 5 5500U, 12 logical CPUs, 10,255,523,840 reported memory
bytes, Linux 7.0.10-arch1-1. Node 26.2.0, PostgreSQL 15.14. Initial load averages:
0.27 / 0.27 / 0.34. These are local reference-profile results, not a hardware-independent guarantee.

The API and worker run as separate real processes against a fresh owned
`carbonbox_perf_*` database and temporary filesystem storage. Existing migrations
are applied only there. Dataset: 10,000 synthetic completed upload records with
10 activity rows each, plus three actual `sample-large.csv` uploads whose 5,000
processed rows and zero rejected rows are checked through the API.

API profile: production mode, request logging silent, default pg pools of 10
for API and worker, worker batch 500, idle queue poll 1,000 ms. Admin and diagnostic
pools each have one connection. Reference settings stay identical between comparisons.
Autocannon 8.0.0 runs each GET serially for 15 seconds with 20 connections,
pipelining 1 and `Accept-Encoding: gzip`. One successful preflight precedes each
endpoint. Every response duration is retained, without rounding; p50/p95/p99 use
nearest rank. The library's default summary contains p97.5, not p95: it is not
renamed or treated as p95.

Raw measurements, individual latency samples, metadata, fixture SHA-256 and
full `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` plans are in
[`performance/`](performance/). Baseline run: `533207_mv4sx7vy_2f3a5981f549`.
The fixture SHA-256 is `b17984cabade0386f7f3ee1457ecd38a272df5a4e7caa27b3d8c293aa488b7c6`.

Run from `backend/` with an explicitly configured local PostgreSQL administrative
URL targeting `postgres`:

```sh
bun run performance baseline
```

Provide `PERF_ADMIN_DATABASE_URL` in the environment, or a local backend `.env`
database configuration. Credentials are never printed or saved in reports.
Only the new owned database is migrated, loaded and removed. This execution used
the documented local `.env.example` settings as an explicit environment override;
it did not create or modify a real `.env`.

## API baseline

| GET endpoint | p50 ms | p95 ms | p99 ms | Requests/s | Responses sampled | Errors / non-2xx / timeouts |
|---|---:|---:|---:|---:|---:|---|
| Uploads, page 1 / limit 10 | 17.051 | 22.300 | 28.819 | 1,142.00 | 17,130 | 0 / 0 / 0 |
| Upload totals | 5.750 | 7.333 | 8.393 | 3,429.27 | 51,432 | 0 / 0 / 0 |
| One upload detail | 5.834 | 8.522 | 9.427 | 3,188.34 | 47,817 | 0 / 0 / 0 |
| Results, page 1 / limit 25 | 24.675 | 28.939 | 31.370 | 805.74 | 12,086 | 0 / 0 / 0 |

The list, totals and results already meet the 50 ms p95 reference budget.
No before/after improvement is claimed yet. Pool changes require evidence;
passing a budget is not an invitation to tune every setting.

## Worker baseline

| Trial | Verified rows | Handler processing ms | Rows/s | Upload-to-observed-completion ms |
|---|---:|---:|---:|---:|
| 1 | 5,000 | 1,109.409 | 4,506.904 | 2,038.723 |
| 2 | 5,000 | 982.709 | 5,087.975 | 1,994.044 |
| 3 | 5,000 | 968.961 | 5,160.169 | 1,983.948 |

Median handler throughput: **5,087.975 rows/s**. Handler timing wraps the actual
processing command with a monotonic clock, including reading, validation, persistence
and final status commit, but excluding queue claim/wait. End-to-end timing also
includes file transfer, idle queue wait and 50 ms observation polling.
The approximately two-second end-to-end result combines roughly one second of
processing with the 1,000 ms queue poll delay. That poll is an explicit latency/load
trade-off, not an artificial demo delay; it is not changed for this optimization.

## Query-plan baseline

| Query | Single EXPLAIN execution ms | Observed access path |
|---|---:|---|
| First list page | 0.153 | createdAt index scan, incremental sort, limit 10 |
| Deep list page, offset 9,990 | 50.941 | sequential scan and quicksort of 10,003 uploads |
| Totals | 24.513 | status index-only scan and aggregation |
| First results page | 13.294 | uploadId bitmap scan, 5,000 matches, top-N sort |
| Deep results page, offset 4,975 | 27.430 | uploadId bitmap scan and quicksort of 5,000 matches |

These are individual instrumented plans collected before the load loops, not
HTTP percentiles. Cache state and instrumentation differ; they must not be
presented as equivalent to p95. A candidate `(uploadId, date, id)` index may remove
the results sort. It cannot optimize the separate uploads-list ordering.
Adoption requires at least 30 percent measured results improvement without
regressing the worker's writes. Until that comparison, no production migration
is justified.

## Isolation and limitations

- Independent post-run checks found zero matching databases, temporary storage
  directories and listeners on the owned API port 37939. No development or shared
  test database was migrated or truncated.
- Two launch attempts failed before creating/loading resources: missing local
  backend `.env`, then an incorrect direct dotenv subpath in an invocation helper.
  Package resolution and explicit local configuration fixed the invocation.
- Browser route bytes, LCP, FCP, CLS and fonts remain with worker2. No frontend
  performance budget is claimed met by these API measurements.
- All numbers are from one reference run; small differences are not proof of an
  improvement. Candidate evaluation and final measurements remain pending.
