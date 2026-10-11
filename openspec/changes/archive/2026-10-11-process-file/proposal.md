## Why

After an upload is queued, a worker must read the file, validate every row, store the valid rows
in batches, keep the progress visible and end in `COMPLETED` or `FAILED`. This is the heart of
the system. Its rules (what is retried, what is final, what happens when another worker took
over) are business decisions, so they are written and tested here with in-memory fakes, before
PostgreSQL, `csv-parse` or the polling loop exist.

## What Changes

- Add the `ProcessFile` command and its handler.
- Add the ports it needs: `IProcessingRepository` (fenced writes), `IUploadReader`,
  `ICsvRecordReader`, extend `IFileStorage` with `open(key)`.
- Define `JobClaim` (job id, upload id, claim token) and `StaleClaimError`.
- `Upload.complete` gains an optional summary so rejected rows can be described in `errorMessage`.
- `Upload.fail` accepts optional validated final counters so wholly rejected files retain their known totals.
- Nothing here touches the database, the file system or the process loop.

## Capabilities

### New Capabilities
- `process-file`: the use case that turns a stored CSV into activity rows
- `processing-ports`: the contracts for fenced writes, reading and record tokenizing

### Modified Capabilities
- `upload-lifecycle`: `complete` accepts an optional summary; `fail` accepts optional consistent final counters

## Impact

- New code under `backend/src/document-processing/application/process-file` and `ports`.
- Small changes to completion and failure metadata in the `Upload` aggregate.
- `queue-and-worker` implements the ports and runs the handler.
