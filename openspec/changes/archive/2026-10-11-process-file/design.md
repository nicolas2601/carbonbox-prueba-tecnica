## Decisions

### Every write is fenced by the claim
A job is leased to one worker with a claim token. If the worker is slow or paused, the lease can
expire and another worker can take the job. The slow worker must then be unable to write.
Every method of `IProcessingRepository` receives the `JobClaim` and checks, inside its own
transaction, that the token is still the current one. If not it returns `Left(StaleClaimError)`
and the handler stops without touching anything. This is the fencing token pattern; without it
two workers could interleave rows of the same file.

### One repository, three transactional steps
`begin` (check fence, delete earlier rows, mark PROCESSING with zero counters), `saveBatch`
(check fence, insert rows, update counters, extend the lease) and `finish` (check fence, store the
final state, mark the job done). Each is one transaction, so the upload state and the job state
cannot disagree. Extending the lease on every batch is the heartbeat: a worker that makes
progress keeps its job, a dead one loses it.

### Deterministic failures are final, infrastructure failures are retried
A wrong header or a file with no valid rows will fail again on every attempt, so the handler ends
the upload as `FAILED` and marks the job done. A thrown error (disk, database) is not decided
here: it reaches the worker loop, which schedules a retry or, after the last attempt, kills the
job and fails the upload.

### Partial success is COMPLETED
A file with some bad rows is `COMPLETED` with `failedRows` greater than zero and a summary in
`errorMessage`. This is a documented decision; the statement does not define it.

### Redelivery is harmless
If the upload is already terminal when a job arrives (the worker died after finishing but before
acknowledging), the handler finishes the job without reprocessing. If it is `PROCESSING`, the
retry starts again from zero: `begin` deletes the earlier rows, so the result is the same.

### Records come from a port
`ICsvRecordReader` yields `{ line, fields }` from a byte stream. The real one uses `csv-parse`
and reports the physical line; the fake yields prepared records.

## Risks

- Progress is rows handled so far; `totalRows` is only known at the end. The UI shows counters,
  not a percentage of an unknown total.
- A batch is the unit of loss: a crash re-does at most the work since the start, not since the
  last batch, because retries restart from zero. Acceptable for the file sizes of the exercise.
