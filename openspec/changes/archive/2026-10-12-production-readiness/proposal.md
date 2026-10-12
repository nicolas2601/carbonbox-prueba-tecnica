## Why

The system works, but it is started by hand with several commands, stores files only on local disk, has no automated pipeline and has not been hardened
for hostile or heavy traffic. A reviewer who runs it from a clean clone should see something close to a production service: one command boots everything,
failures are visible and repeatable local checks are defined. The delivered scope keeps filesystem storage; object storage and remote pipeline execution are deferred rather than claimed as complete.

## What Changes

- Container images for the API, the worker and the frontend, and a compose file that starts the whole stack with health checks and restart policies.
- A validated GitHub Actions workflow definition: frontend lint, types, unit and integration tests with PostgreSQL, builds, container smoke and specification validation. Remote success and run duration are not claimed.
- HTTP hardening: security headers, rate limiting, strict CORS from configuration, request id on every response.
- Observability: a Prometheus metrics endpoint with request latency and queue depth, and structured logs that already carry a request id.
- Explicit filesystem-only driver validation: unsupported `STORAGE_DRIVER` values fail instead of silently falling back. The MinIO profile is configuration scaffolding, not a delivered S3 adapter.
- An operations runbook and a command to requeue dead jobs.
- SQS is NOT adopted: the PostgreSQL queue stays, with the reasons and the migration path documented.

## Capabilities

### New Capabilities
- `container-stack`: images and the one command stack
- `ci-pipeline`: automated check definitions with verified local equivalents
- `http-hardening`: headers, rate limits, CORS, request id
- `observability`: metrics and queue depth
- `storage-driver`: filesystem default and unsupported-driver refusal
- `operations`: runbook and dead job requeue

### Modified Capabilities
None.

## Impact

- Runtime dependencies: `@fastify/helmet`, `@fastify/rate-limit`, `@fastify/compress` from the performance change and `prom-client`. AWS SDK storage dependencies were not added.
- New files: Dockerfiles, `.github/workflows/ci.yml`, `docs/operations.md`.
- The default developer flow (`bun run`) keeps working unchanged.

## Deferred

- S3 save/open/delete, streaming multipart cleanup, driver integration, MinIO
  processing and bucket-unreachable drills: optional object-storage work was cut
  from this delivery; the runtime explicitly rejects `s3`.
- Remote CI green run and warm-cache duration below ten minutes: no authorized
  push occurred, so only workflow configuration and local checks are evidence.
- Literal clean-clone Docker browser upload/completion: clean-source container
  builds and HTTP smoke passed, and owned production Chromium journeys passed
  separately, but the shared Playwright MCP browser was unavailable.
- Tested backup/restore, volume-exhaustion and worker-scaling procedures: the
  runbook records safe deployment/recovery boundaries, not those unperformed drills.

The archived requirements cover only verified local scope. Deferred promises are
preserved here and in `tasks.md`, not promoted as implemented capabilities.
