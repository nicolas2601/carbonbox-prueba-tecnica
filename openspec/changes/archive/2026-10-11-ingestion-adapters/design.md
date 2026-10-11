## Decisions

### The queue is a table, created now
`saveWithJob` inserts the job row, so the table must exist. The columns are chosen for the
behaviour `async-processing` needs: `status` (QUEUED, DONE, DEAD), `attempts`, `maxAttempts`,
`availableAt` (for backoff), `lockedUntil` (visibility timeout), `claimToken` (fencing),
`lastError`. Only the insert is implemented here; the other columns stay at their defaults.
Alternative rejected: adding the table later. It would split one atomic write across two changes.

### One transaction, plain Prisma
`prisma.$transaction` with two `create` calls. If the job insert fails, the upload insert is
rolled back. Known failures (a duplicate id) become `Left(UploadPersistenceError)`; unknown
errors, such as a lost connection, are rethrown so the central handler reports them.

### Keys are generated, never derived
`FsFileStorage` names the file `<generated id>.csv` inside `STORAGE_DIR`. The user supplied file
name is only metadata. `delete` also refuses keys with path separators or `..`, so a corrupted
key cannot reach outside the directory.

### Write to a temporary name, then rename
The stream is written to `<key>.part` and renamed on success. A reader (the worker) can never
see a half written file, and a failed write leaves nothing under the final key.

### Integration tests are a separate suite
`bun run test` stays database free and fast. `bun run test:integration` runs files named
`*.integration.test.ts` against the real database, truncating the tables between tests.

## Risks

- A crash between writing the file and the database transaction leaves an orphan file.
  Already accepted and documented in `upload-ingestion`.
- Integration tests depend on Docker. They are excluded from the default run on purpose.
