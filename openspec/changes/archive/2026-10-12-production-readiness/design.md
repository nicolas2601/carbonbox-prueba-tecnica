## Decisions

### Keep the PostgreSQL queue; do not swap to SQS
Creating the upload and its job in one transaction is what guarantees there is never a job without an upload or an upload nobody will process. SQS cannot join a
database transaction: using it needs an outbox table and a relay process, more moving parts and more ways to fail, for no functional gain at this scale. The diagram
shows SQS as the target; the README documents the migration path (outbox plus relay, then consumers on SQS with the dead letter queue) and why it is deferred.

### Filesystem is the supported driver; S3 is deferred
`IFileStorage` remains the storage boundary, but this build implements only filesystem storage. `STORAGE_DRIVER` defaults to `fs` and validates that value; `s3` and typos fail before runtime initialization rather than silently writing locally. A MinIO profile is scaffolding only. The planned S3 adapter, multipart cleanup and whole-flow tests were cut from the optional scope and are not delivered.

### One command, real health
The compose file waits for database health, applies migrations once, then starts the API, the worker and the frontend with their own health checks and restart policies.
The API/worker/frontend images are multi stage and run as non-root. The worker health check proves process liveness only; queue metrics and outcome logs establish progress. Clean-source builds and actual Docker HTTP CSV completion were verified. The literal browser journey in that Docker stack remains deferred; a separate owned production E2E stack is not substituted for it.

### The pipeline is the contract
The workflow defines the existing backend type/test/coverage commands, frontend lint/type/test/build, PostgreSQL integration, specification validation and owned container smoke. Configuration and local equivalents are verified. A remote green run and its duration require an authorized push and remain deferred; no green screenshot or sub-ten-minute claim is supplied.

### Hardening that cannot break normal use
Headers and rate limits have sensible defaults; the upload route gets a tighter limit than reads. Limits are configuration, not code, and tests prove normal use passes
and abuse is rejected with the standard error envelope (429).

### Metrics that answer operator questions
Request latency by route, error counts, and queue depth by job status answer "is it slow, is it failing, is it backed up". The worker is observable through the queue depth and its structured logs.
Metrics use a separate private listener, `METRICS_HOST=127.0.0.1` and `METRICS_PORT=9090` by default. Compose does not publish that port.
The public API and Swagger have no metrics route; CORS is not an access-control substitute. On AWS, an internal scraper or ADOT collects it.
Frontend CSP explicitly permits the inline scripts/styles required by static Next.js PPR and hydration; it is not described as a nonce-strict policy.

## Risks

- A larger compose and more images raise first-run risk. Clean-source/no-cache builds and HTTP smoke passed, but a complete clean-clone browser walkthrough is still deferred.
- S3 differs from disk in multipart/error behavior. No adapter or MinIO runtime integration test is claimed; selecting the unsupported driver is rejected.

## Delivered evidence

Backend 389 unit plus 116 integration tests pass, with aggregate statements
98.15% and branches 96.63%. Frontend 289 tests, lint/types/build and 13 production
Chromium journeys pass. Private metrics returned 200 inside the API, 404 on the
public API and were unreachable from another container. Real worker crash/replay
and PostgreSQL stop/start recovery are documented in `docs/operations.md`.

## Deferred

The original S3 adapter/save-open-delete/multipart/bucket-failure scenarios,
remote CI success/timing, Docker UI journey and tested backup/restore, disk-full
and worker-scaling procedures are outside the reconciled completed scope. Reasons
and dependencies are retained in `tasks.md`; none is marked as executed.
