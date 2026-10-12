# Backend

The API and worker are separate processes sharing PostgreSQL and local file storage.
Install dependencies with `bun install`, configure a local PostgreSQL connection,
and apply the checked-in migrations with `bun run db:deploy` before starting them.
From this directory, run `bun run start` for HTTP and `bun run worker` for processing.
Configuration comes from the environment; see `.env.example` for the variables.

## Verification

```sh
bun run typecheck
bun run test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/carbonbox_test bun run test:integration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/carbonbox_test bun run test:coverage:all
```

Integration tests require a migrated, disposable local `carbonbox_test` database.
They truncate test tables and reject development database URLs. Do not run separate
integration runners concurrently against the same database.

`test:coverage:all` first measures unit coverage, then runs the unit and integration
projects together with sequential test files. Reports are kept separately in
`coverage/unit` and `coverage/all`. Vitest combines instrumentation directly: no
manual averaging of percentages, extra coverage dependencies, custom exclusions,
or lowered thresholds. The existing unit configuration is preserved.

Measured on 2026-10-11, after the final review:

| Scope | Tests | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|---:|
| Unit only | 330 | 85.45% | 86.27% | 82.90% | 86.03% |
| Unit + integration | 436 | 97.87% | 95.71% | 98.86% | 98.90% |

The HTTP layer is primarily exercised against real PostgreSQL and filesystem
adapters. Importing it from `App` broadens the unit-only coverage denominator,
so isolated unit coverage is lower by design; the previous pre-HTTP unit baseline
is not comparable to this combined scope. Both measurements are reported rather
than hiding controllers with exclusions or duplicating endpoint tests with mocks.
Generated code and loaded test helpers remain subject to Vitest's unchanged
default reporting rules. Real child-process smoke tests verify behavior but do
not instrument the child processes for this coverage report.

## HTTP contract

OpenAPI JSON is available at `/docs/json`, with Swagger UI at `/docs`.
`/health` checks liveness; `/health/ready` checks PostgreSQL.
Uploads use `POST /api/v1/uploads`, multipart field `file`, and the fixed user
`anonymous`. The exercise intentionally has no authentication.

Upload-data responses use `Cache-Control: no-store`. Negotiated JSON above 1 KiB
is gzip-compressed at best-speed level; small or unnegotiated bodies stay plain.
Request decompression is disabled. JSON Content-Type and body values are preserved;
compressed Content-Length is valid for the compressed bytes or omitted. Multipart
streaming, the exact file-byte limit and 413 behavior are unchanged and tested.

## Measured performance

Local reference profile: 20 connections for 15 seconds per GET, 10,000 seeded
uploads, three real 5,000-row CSVs, Node 26.2 and PostgreSQL 15.14. Full method,
machine, raw samples and caveats are in [`docs/performance.md`](../docs/performance.md).

| Endpoint | Before p95 ms | After p95 ms | Wire bytes before / after |
|---|---:|---:|---:|
| List | 22.300 | 25.723 | 2,518 / 725 |
| Totals | 7.333 | 7.785 | 282 / 307 |
| Detail | 8.522 | 8.710 | 471 / 496 |
| Results | 28.939 | 32.370 | 2,136 / 729 |

Compression saves 71.21% of list and 65.87% of results wire bytes, at an observed
local CPU/latency cost; it is not claimed to be faster. All required API p95 values
stay below 50 ms on this reference profile. An index candidate was measured and
rejected: 4.79% HTTP gain did not meet the 30% gate and worker writes were worse
in that experiment. No production index migration or pool/poll tuning was made.

## Known limits

- Filesystem storage is local; API and worker must share `STORAGE_DIR`. The queue
  uses PostgreSQL, not an external managed queue.
- `MAX_UPLOAD_MB` limits file bytes, not exact process memory consumption.
- Credentials in URLs are masked in logged error messages and stacks. Native
  Pino redaction masks `req.headers.authorization` and `req.headers.cookie`.
  This is not general-purpose secret or file-content sanitization.
- The security scanner exits 1 on an intentionally fake password in a regression
  test and on `innerHTML` in ignored, generated coverage assets. Those findings
  are reported, not suppressed or presented as a clean scan.
