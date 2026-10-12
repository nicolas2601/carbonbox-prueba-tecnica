## Why

The system works, but it is started by hand with several commands, stores files only on local disk, has no automated pipeline and has not been hardened
for hostile or heavy traffic. A reviewer who runs it from a clean clone should see something close to a production service: one command boots everything,
failures are visible, the same code runs against object storage, and the checks that keep it correct run on every change.

## What Changes

- Container images for the API, the worker and the frontend, and a compose file that starts the whole stack with health checks and restart policies.
- A GitHub Actions pipeline: lint, types, unit and integration tests with a real PostgreSQL, builds, container builds, specification validation.
- HTTP hardening: security headers, rate limiting, strict CORS from configuration, request id on every response.
- Observability: a Prometheus metrics endpoint with request latency and queue depth, and structured logs that already carry a request id.
- An S3 compatible storage adapter selectable by configuration, tested against MinIO, with local disk still the default so the base flow cannot fail.
- An operations runbook and a command to requeue dead jobs.
- SQS is NOT adopted: the PostgreSQL queue stays, with the reasons and the migration path documented.

## Capabilities

### New Capabilities
- `container-stack`: images and the one command stack
- `ci-pipeline`: automated checks
- `http-hardening`: headers, rate limits, CORS, request id
- `observability`: metrics and queue depth
- `s3-storage`: object storage adapter
- `operations`: runbook and dead job requeue

### Modified Capabilities
None.

## Impact

- New runtime dependencies: `@fastify/helmet`, `@fastify/rate-limit`, `@fastify/compress` (if not added by the performance change), `prom-client`, `@aws-sdk/client-s3`, `@aws-sdk/lib-storage`.
- New files: Dockerfiles, `.github/workflows/ci.yml`, `docs/operations.md`.
- The default developer flow (`bun run`) keeps working unchanged.
