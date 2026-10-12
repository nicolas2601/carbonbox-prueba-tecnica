# Frontend/backend performance AI usage

Date: 2026-10-12

## Scope and method

- Prepared the coordinator's five drafts unchanged and validated OpenSpec before
  implementation. Then explicitly constrained upload-data caching to no-store and
  index adoption to measured evidence. Browser/CWV belongs to worker2; this session
  launched no browser or screenshot runner.
- API/worker measurement uses fresh owned `carbonbox_perf_*` databases, temporary
  storage and separate real API/worker processes. Development/shared data is never
  benchmarked or migrated. Load windows were serial with browser measurements.
- TDD covers local-only URLs, identifier limits, URL-query overrides, storage
  ownership, explicit child environment, successful-creation-only database cleanup,
  monotonic timing, nearest-rank percentiles and candidate data preservation.
- Autocannon's default summary has p97.5, not p95. A fetched documentation example
  mislabeled it; the installed source/result keys and response-event durations were
  verified. Raw samples produce genuine p50/p95/p99 rather than a renamed percentile.
- Two startup attempts failed before workloads: missing backend `.env`, then an
  incorrect direct dotenv subpath in an invocation helper. An explicit documented
  local configuration and package resolution corrected the invocation without
  creating an environment file.

## What the numbers justified

| Decision | Evidence | Outcome |
|---|---|---|
| Establish baseline first | 20 connections, 15 seconds per GET; all API p95 below 50 ms, no errors | No speculative pool/poll tuning |
| Test results index only in disposable DB | First SQL sort removed, but HTTP p95 only 4.79% lower; worker median throughput 10.09% lower in that profile | No production index or schema migration |
| Keep response gzip | List wire bytes 2,518 to 725 (71.21% lower); results 2,136 to 729 (65.87% lower) | Meets explicit 50% adoption gate |
| Preserve truthful latency claims | List p95 22.300 to 25.723 ms; results 28.939 to 32.370 ms | Report CPU/bandwidth trade-off, not a faster-API claim |
| Keep fresh upload states | No-store on list, totals, detail, results and upload errors | No max-age/private caching of upload data |

Full method, machine, raw JSON/latency samples, plans and comparisons are in
`docs/performance.md` and `docs/performance/`. Worker batch 500, pg pools 10 and
queue poll 1,000 ms remain unchanged. The roughly two-second end-to-end baseline
combines roughly one second of processing and queue polling; no artificial demo
delay or opportunistic poll change was introduced.

The coordinator explicitly excluded the alternate pool/batch matrix after all
required latency budgets passed. The design/spec/tasks record that decision;
it is not represented as an experiment that ran.

## Verification and corrections

- Response-policy RED: four upload-data routes lacked no-store and negotiated
  large JSON lacked gzip. GREEN: eight wire tests verify decoded rows, original
  dates/decimals, JSON Content-Type, valid compressed length or omitted length,
  uncompressed small/plain bodies, error freshness and no request decompression.
- A failed error-case assertion initially used page zero with a fake query handler
  that bypasses application pagination validation. The test now exercises a
  structurally invalid query, preserving the actual schema/domain boundary.
- Real App multipart tests revalidate exact 1 MiB success, one byte overflow 413,
  zero rejected upload/job/orphan files and response metadata. Real Node/curl/API
  and worker smoke still handles mixed CSVs and shuts down cleanly.
- 350 unit tests, 106 real integration tests and backend typecheck pass. A scoped
  ten-test HTTP integration rerun passes after additional metadata assertions.
  Frontend and Prisma schema/migrations have no differences from redesign base.
- Independent checks after all three measurement profiles found zero matching
  databases, temporary storage and listeners (ports 37939, 35281, 41359).
- Security scan exits 1 on an intentional fake-password redaction fixture and six
  ignored/generated Istanbul innerHTML assets. These were inspected and accepted
  as false positives by the coordinator, not reported as a green scan. Only the
  newly created scanner policy artifact was removed after inspection.
- Backend TypeScript 7 does not expose the classic compiler API used by the AST
  checker; the installed frontend compiler API was used for that source check,
  while the actual backend TypeScript compiler independently passes.

## Remaining ownership

Backend M9 is handed off without push/archive. Browser/CWV, frontend optimization
and full browser suites remain assigned to worker2/coordinator. This record does
not claim frontend performance budgets or E2E passed. M10 production-readiness is
the next authorized package; it does not wait for CWV closure.
