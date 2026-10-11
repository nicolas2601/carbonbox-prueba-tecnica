## Why

Every piece of the pipeline exists except the two that touch the outside: reading the real file
and the process that polls the queue. This change adds them and then proves the whole path
end to end, from an uploaded file to rows in the database, using the sample files of the
exercise. It also closes three debts: the temporary `open` stub, unbounded memory for rejected
rows, and a cleanup failure that leaves no trace.

## What Changes

- Replace the `FsFileStorage.open` stub with a real streaming read.
- Add `CsvParseRecordReader` (library `csv-parse`) implementing `ICsvRecordReader`, reporting the
  physical line of each record and failing with `MalformedCsvError` on broken quoting.
- Add the `ILogger` port and a JSON console adapter.
- `CreateUpload` logs a failed cleanup instead of hiding it.
- Add the `Worker` loop: claim, process, retry or kill, poll when idle, stop gracefully.
- Add the composition root for the worker and the entry point `src/workers/FileProcessingWorker.ts`.
- Bound the memory of rejected rows: keep the total count and only the first details.
- Add end to end integration tests with the real database, real files and the three sample files.

## Capabilities

### New Capabilities
- `file-reading`: streaming file read and CSV record reading
- `worker-loop`: the polling process with its failure policy
- `logging`: the logger port

### Modified Capabilities
- `csv-error-summary`: the summary accepts the real total when only some details are kept

## Impact

- One new runtime dependency: `csv-parse`.
- New code under `infrastructure/csv`, `infrastructure/logging`, `application/worker` and `src/workers`.
- `ProcessFileCommandHandler` and `CreateUploadCommandHandler` change slightly.
- Tests need the PostgreSQL container.
