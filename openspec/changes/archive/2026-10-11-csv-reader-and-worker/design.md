## Decisions

### A library tokenizes, we decide what a row means
`csv-parse` handles quotes, escaped quotes, CRLF, byte order mark and multi line fields. Options:
`bom: true`, `relax_column_count: true` (short rows reach `validateRow` and become row errors
instead of aborting the file), `skip_empty_lines: true`, and `max_record_size` (1 MiB) so a file
with one enormous field cannot exhaust memory. `info: true` provides the line counters.

### Broken quoting is a permanent failure
An unclosed quote cannot be fixed by retrying. The reader throws `MalformedCsvError`; the worker
treats that class as permanent: the job goes straight to `DEAD` and the upload to `FAILED` with a
clear message. Any other error (disk, database) is transient and follows the retry policy.

### The worker never dies from a job
`runOnce` catches whatever a job throws, records it through `queue.fail`, and returns. If even
`queue.fail` throws (database down), the error is logged and the loop waits one poll interval.
The process only stops when asked to.

### Graceful shutdown
SIGINT and SIGTERM abort a signal. The loop finishes the job in progress, then exits. A job cut
short by a hard kill is recovered by lease expiry, which is the property the queue was built for.

### Polling, not busy waiting
When no job is claimed the loop sleeps `WORKER_POLL_INTERVAL_MS`, and the sleep ends early on
shutdown. When a job was processed it asks again immediately.

### Bounded rejected rows
The handler keeps the number of rejected rows and only the first details (the same limit the
summary prints). `summarizeRowErrors` receives the true total so the message stays correct.

### A logger port, one adapter
`ILogger` with `info`, `warn`, `error(message, context)`. The adapter writes one JSON line per
call. `CreateUpload` uses it when the cleanup of an orphan file fails; the worker uses it for each
job outcome. Secrets and file contents are never logged.

### End to end tests are the proof
They use real adapters everywhere: upload through `CreateUpload`, process with the `Worker`, read
the database. The three sample files and a malformed file cover the paths of the exercise.

## Risks

- `csv-parse` line accounting with multi line fields needs its own tests; a wrong line number
  would mislead whoever fixes the file.
- The loop is single threaded per process; throughput scales by starting more workers, which the
  queue already supports.
- `max_record_size` bounds record/field buffers, except that `raw: true` retains skipped empty-line
  prefixes. Those prefixes are bounded by the maximum accepted file size at the HTTP boundary
  (`MAX_UPLOAD_MB`, default 10 MB; enforcement belongs to M5), not by the record limit. Buffer,
  decoded-string and newline-match-array overhead can exceed the encoded file size. No extra
  reader guard was added; internal callers bypassing the HTTP limit must supply bounded files.
