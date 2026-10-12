## Why

Every later piece (CSV parsing, upload, queue, worker, queries) needs the same small core:
a way to return failures as values, and the rules of what an upload and a row of activity data
are. Building it first, with no database or HTTP, keeps those rules in one place and lets them be
tested in milliseconds.

## What Changes

- Add an `Either` type so use cases can return `Either<Error, Result>` instead of throwing.
- Add domain errors with a stable `code` so the HTTP layer can map them later.
- Add the `FileName` value object (only valid CSV names, never a path).
- Add the `UploadStatus` value object and the `Upload` aggregate root with its state machine.
- Add the `ActivityData` entity, which owns the validity rules of one CSV row.
- The repository interfaces are intentionally not part of this change: they are defined together
  with the first use case that needs them (`upload-ingestion`), because an interface with no
  consumer cannot be tested or justified yet.

## Capabilities

### New Capabilities
- `either-result`: success or failure as a value
- `domain-errors`: base error type with a stable code
- `file-name`: validated CSV file name
- `upload-lifecycle`: upload status and aggregate with valid transitions
- `activity-data`: one validated row of activity data

### Modified Capabilities
None.

## Impact

- New code under `backend/src/shared/domain` and `backend/src/document-processing/domain`.
- No new dependencies, no database access, no HTTP.
- Later changes (`csv-validation`, `upload-ingestion`, `async-processing`) depend on this one.
