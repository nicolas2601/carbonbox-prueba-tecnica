# Backend

The API and worker are separate processes sharing PostgreSQL and local file storage.
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

Measured on 2026-10-11, before the final review:

| Scope | Tests | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|---:|
| Unit only | 317 | 84.94% | 84.33% | 82.72% | 85.68% |
| Unit + integration | 423 | 97.63% | 94.37% | 98.85% | 98.75% |

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
