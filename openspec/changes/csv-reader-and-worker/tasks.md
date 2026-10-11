## 1. Debt first

- [ ] 1.1 `FsFileStorage.open` streams a saved file, rejects traversal keys, throws when the file is missing (replaces the stub)

## 2. Logging and bounded errors

- [ ] 2.1 `ILogger` and the JSON console adapter
- [ ] 2.2 `CreateUpload` logs a failed cleanup (left and throw)
- [ ] 2.3 `summarizeRowErrors` accepts the real total
- [ ] 2.4 `ProcessFile` keeps only the first details and the real count

## 3. CSV reader

- [ ] 3.1 Add `csv-parse`; records with physical lines for a plain file
- [ ] 3.2 Quoted comma, escaped quote, quoted line break with correct following line
- [ ] 3.3 Byte order mark, CRLF, empty lines, short rows
- [ ] 3.4 `MalformedCsvError` for unclosed quote and oversized record
- [ ] 3.5 `sample-invalid.csv` rejected lines match `EXPECTED.md`

## 4. Worker

- [ ] 4.1 `Worker.runOnce`: idle, processed, stale claim
- [ ] 4.2 Transient failure, exhausted attempts, permanent malformed file, queue failure while failing
- [ ] 4.3 `Worker.run`: idle wait, early stop on abort, finish the current job
- [ ] 4.4 Composition root and entry `FileProcessingWorker.ts`, clean exit on SIGTERM

## 5. End to end

- [ ] 5.1 `sample-data.csv`, `sample-invalid.csv`, wrong header
- [ ] 5.2 `sample-large.csv` with monotonic progress
- [ ] 5.3 Worker dies mid file and a later worker recovers; two workers, two uploads

## 6. Verification

- [ ] 6.1 `bun run typecheck`, `bun run test` and `bun run test:integration` pass
- [ ] 6.2 No `any`, files under 300 lines, functions under 40 lines
