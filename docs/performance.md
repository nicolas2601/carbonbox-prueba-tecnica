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

## Index candidate: measured, not adopted

Run `541844_mv4tg7dv_2ba35217aaba`, measurement commit `4a2836f`. A candidate
`(uploadId, date, id)` index was created only in its disposable database after
seeding. The 10,000 existing uploads and 100,000 existing activity rows remained
unchanged in count. Three real large uploads then measured the additional write
work. No production schema or migration was changed.

| Measure | Baseline | Candidate | Observed change |
|---|---:|---:|---|
| Results HTTP p95 ms | 28.939 | 27.553 | 4.79% lower, below the 30% adoption gate |
| Results requests/s | 805.74 | 851.40 | 5.67% higher |
| First results EXPLAIN ms | 13.294 | 0.183 | Sort removed, index scan reads 25 rows |
| Deep results EXPLAIN ms | 27.430 | 27.355 | Planner still chooses bitmap scan and sort |
| Worker median processing ms | 982.709 | 1,093.014 | Higher in this experiment |
| Worker median rows/s | 5,087.975 | 4,574.506 | 10.09% lower in this experiment |

Candidate worker trials were 1,143.047 / 1,093.014 / 1,044.721 ms. All four load
endpoints returned zero errors, non-2xx responses and timeouts. The SQL first-page
plan improved, but that did not produce the required end-to-end improvement.
Single-run changes are not universal causal estimates; the predefined performance
and no-write-regression gates are not met, so the index is **not adopted**.
The separate uploads-list ordering is outside this candidate's scope.
Independent cleanup found zero owned databases, storage directories and listeners
on port 35281. Raw candidate plans and every latency sample remain in `performance/`.

## Final response-policy comparison

Run `552294_mv4u1tax_18f0fbec8b0a`, application commit `ccddc81`. No candidate
index remains. Upload data has `Cache-Control: no-store`; negotiated JSON above
1,024 bytes uses gzip at best-speed level. Incoming request decompression is
disabled, so the multipart streaming/size contract is unchanged.

| Endpoint | Baseline p95 ms | Final p95 ms | Baseline wire bytes/response | Final wire bytes/response | Wire reduction |
|---|---:|---:|---:|---:|---:|
| List | 22.300 | 25.723 | 2,518 | 725 | 71.21% |
| Totals | 7.333 | 7.785 | 282 | 307 | -8.87% |
| Detail | 8.522 | 8.710 | 471 | 496 | -5.31% |
| Results | 28.939 | 32.370 | 2,136 | 729 | 65.87% |

Wire bytes include HTTP headers and are computed from the raw throughput total
divided by completed requests. The list and results exceed the predefined
50 percent byte-reduction gate, so compression is retained. Small totals/detail
bodies stay uncompressed; their additional 25 bytes are the freshness header.
All four runs had zero errors, non-2xx responses and timeouts, and all required
API p95 values remain below 50 ms. **This is a bandwidth improvement, not a
latency improvement.** Observed p95 increased 15.35 percent for list and 11.85
percent for results. That CPU/bandwidth trade-off is reported rather than hidden.

Final worker timings were 1,306.024 / 1,221.188 / 877.172 ms (median 4,094.374
rows/s). Worker implementation, batch 500, pool defaults 10 and queue poll 1,000 ms
are unchanged. These three measurements vary substantially; do not attribute
the difference to a worker optimization or claim a causal write-speed gain.

Verification: 350 unit tests, 106 real integration tests and typecheck passed.
The real App harness separately verifies 1 MiB succeeds and 1 MiB plus one byte
returns 413 without an upload/job/orphan file; new assertions verify JSON
Content-Type, valid Content-Length and no-store. The real API/worker curl smoke
still processes mixed CSV rows. Gzip wire tests decode to identical rows, dates
and decimal values, with correct compressed length or no length header.
Independent final cleanup found zero owned DB/storage/listeners on port 41359.

The mandatory security scanner exited 1: one intentionally fake password in the
existing URL-redaction regression and six `innerHTML` findings in ignored,
generated Istanbul assets. They were inspected and accepted by the coordinator
as false positives. This is not presented as a green scan. Its newly created
policy artifact was inspected and removed without touching existing files.

## Isolation and limitations

- Independent post-run checks found zero matching databases, temporary storage
  directories and listeners on the owned API port 37939. No development or shared
  test database was migrated or truncated.
- Two launch attempts failed before creating/loading resources: missing local
  backend `.env`, then an incorrect direct dotenv subpath in an invocation helper.
  Package resolution and explicit local configuration fixed the invocation.
- Browser route bytes, LCP, FCP, CLS and fonts remain with worker2. No frontend
  performance budget is claimed met by these API measurements.
- Each profile has one reference load run; small differences are not proof of an
  improvement. Pool/batch defaults are documented, not opportunistically tuned.
