## Decisions

### Keep the PostgreSQL queue; do not swap to SQS
Creating the upload and its job in one transaction is what guarantees there is never a job without an upload or an upload nobody will process. SQS cannot join a
database transaction: using it needs an outbox table and a relay process, more moving parts and more ways to fail, for no functional gain at this scale. The diagram
shows SQS as the target; the README documents the migration path (outbox plus relay, then consumers on SQS with the dead letter queue) and why it is deferred.

### S3 is a configuration switch behind an existing port
`IFileStorage` already hides where bytes live. An S3 adapter implements the same contract, selected by `STORAGE_DRIVER=s3`. MinIO in a compose profile makes it testable
without AWS credentials. Local disk stays the default because it has no external dependency and cannot fail the first run.

### One command, real health
The compose file waits for database health, applies migrations once, then starts the API, the worker and the frontend with their own health checks and restart policies.
The images are multi stage, run as a non root user and contain only what runs.

### The pipeline is the contract
CI runs exactly the commands a reviewer would run, with a PostgreSQL service for integration tests. A green pipeline is evidence; screenshots of a green run go in the README.

### Hardening that cannot break normal use
Headers and rate limits have sensible defaults; the upload route gets a tighter limit than reads. Limits are configuration, not code, and tests prove normal use passes
and abuse is rejected with the standard error envelope (429).

### Metrics that answer operator questions
Request latency by route, error counts, and queue depth by job status answer "is it slow, is it failing, is it backed up". The worker is observable through the queue depth and its structured logs.

## Risks

- A larger compose and more images raise the chance of a first run failure; the clean clone dry run on a machine without our caches is mandatory before delivery.
- S3 behaviour differs from disk in details (eventual errors, multipart); the adapter has its own integration tests against MinIO.
