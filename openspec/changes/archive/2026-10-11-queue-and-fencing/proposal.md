## Why

`ProcessFile` runs against fakes. For the system to work, the ports must be backed by PostgreSQL:
a queue where several workers can claim jobs without taking the same one, leases that expire
when a worker dies, retries with growing delays, and writes that a stale worker cannot make. This
is the part of the exercise that replaces SQS, and the part most worth proving against a real
database with concurrent callers.

## What Changes

- Add `IJobQueue` and `PgJobQueue`: claim with `FOR UPDATE SKIP LOCKED`, lease, fail with backoff, dead state.
- Add `PrismaProcessingRepository` implementing `IProcessingRepository`: `begin`, `saveBatch` and `finish`, each in a transaction that checks the claim token.
- Add `PrismaUploadReader` implementing `IUploadReader`.
- Add settings `WORKER_VISIBILITY_TIMEOUT_MS` and `WORKER_RETRY_BASE_MS`.
- All time comes from parameters supplied by the caller (injected clock), never from SQL `now()`.
- Reading the file, tokenizing it and the polling loop are NOT part of this change
  (`csv-reader-and-worker`).

## Capabilities

### New Capabilities
- `job-queue`: claiming, leasing, retrying and killing jobs
- `fenced-processing`: processing writes that only the current claim holder can make

### Modified Capabilities
None.

## Impact

- New code under `backend/src/document-processing/infrastructure/persistence` and `queue`.
- No schema change: the `jobs` columns were created in `ingestion-adapters`.
- Integration tests only; they need the PostgreSQL container.
