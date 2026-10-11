# AI usage log

Working notes kept while building, so `USO-DE-IA.md` reflects what really happened
instead of being reconstructed from memory. Entries are factual: what the AI produced,
what was verified, and what had to be corrected.

## 2026-10-10

### Planning
- Claude Code read the exercise statement and listed inconsistencies. Each one was
  checked against the document before being accepted:
  - the in-memory mock queue cannot connect an API process and a separate worker process
  - the flow publishes the job before the upload record exists
  - polling only covers `PROCESSING`, so a fast first poll can see `PENDING` forever
  - the dashboard needs counts that no endpoint provides
  - the optional bonus items add up to 28 points while the stated cap is 20 (the AI
    first reported 26; recounting gave 28)
- A second Claude session reviewed the same document independently. Its suggestions
  were accepted where it was right (durable queue in PostgreSQL, no artificial delays,
  manual dependency injection) and rejected where it was not (Convict is kept because
  the reference tree names it).

### Setup
- Claude Code scaffolded the repository, the Bun-managed backend and frontend, the Prisma
  schema and the initial migration.
- The request was to use the most recent versions. Each one was checked against npm and
  then against the project instead of assuming:
  - Prisma: the CLI `latest` tag points to a release candidate (8.0.0-rc) while
    `@prisma/client` `latest` is 7.10.0, so there is no stable 8.x pair. Prisma 7.10 is used.
  - TypeScript 7.0.2 works in the backend (typecheck and tests pass) but not in the
    frontend: `typescript-eslint` throws "does not support TS 7.0", so lint crashed. The
    frontend uses TypeScript 6.0.3 with ESLint 10.12 (lint, tsc and build pass).
  - The first diagnosis was wrong: the crash was blamed on ESLint 10 and ESLint was
    downgraded to 9 before reading the error message, which still failed. Reading the
    first lines of the error showed the real cause.
  - `@types/node` stays on 22 to match the declared minimum Node version (20.9).
- Prisma 7 changed its configuration (`prisma.config.ts`, `prisma-client` generator,
  driver adapter). The current docs were read through Context7 instead of relying on
  memory.
- The health endpoint was written test-first: the test failed with
  `Cannot find module './App'` before the class existed.
- The second Claude session generated the CSV fixture generator. Its output was
  regenerated and compared byte for byte, and row counts were checked with `wc -l`.

### Domain foundations
- Claude Code read the proposal, design, five capability specifications and tasks before
  implementing the shared Either, typed domain errors, FileName, UploadStatus, ActivityData
  and Upload lifecycle. No repositories, parser, HTTP or persistence code was added.
- Sixteen task-level test-first cycles were committed independently. Missing-module failures
  introduced new classes; missing-method failures introduced operations. Rejection tests
  first failed because invalid input was accepted, then passed after guards were added.
  Each commit records a representative observed RED. The typecheck and complete suite ran
  successfully after every task. Multiple cases exercise success, failure and boundary inputs.
- Either is represented by a union of Left and Right classes with type predicates. The
  compile-time test checks both the failure branch and the remaining success branch.
  Left transformations retain identity; a type assertion changes only its absent success type.
- Added @vitest/coverage-v8 5.0.3, matching the installed Vitest version. Baseline: two tests,
  statements 80%, branches 50%, functions 83.33%, lines 78.57%. Final: 66 tests across seven
  files, statements 95.37%, branches 97.36%, functions 95.08%, lines 94.79%.
- Clarifications not spelled out in the design: counters must be safe integers; starting an
  attempt resets totalRows, processedRows and failedRows to zero and clears an old error.
  Upload exposes status as the closed string union; UploadStatus validates external strings.
  Persistence reconstitution trusts typed stored fields rather than applying creation rules.
- The first repository check ran from the wrong directory and failed with "not a git repository";
  it was repeated with an explicit working directory. The first git add used an incorrect
  root lockfile path and failed; the backend-local lockfile path was corrected. No unexpected
  test RED occurred. Commit hooks warn that a lefthook configuration is absent; checks ran
  explicitly. No push or OpenSpec archive was performed.

### CSV validation
- Implemented pure header and row validators, plain-decimal and UTC-calendar parsers,
  CSV error types and a capped rejected-row summary. No dependencies, filesystem access
  in production, HTTP or persistence were added. Tokenization remains a later change.
- Each implementation task ran an observed RED followed by a complete passing suite
  and typecheck. Canonical-header mapping was first a fixed result; the reordered-header
  test failed and forced real mapping. Missing-row tests exposed an undefined `.trim()`;
  guarded access replaced non-null assertions. Invalid dates normalized to March 1 before
  round-trip validation was connected to the row validator.
- The test-only fixture adapter reads LF/CRLF lines and preserves quoted commas. It is
  intentionally not a general CSV parser. The mixed fixture produced 15 valid and 10
  rejected records, at lines 3, 5, 7, 9, 11, 13, 15, 17, 19 and 21, matching EXPECTED.md.
- Two minor specification gaps were raised and approved before implementation: invalid
  summary limits act as zero (the total and omitted count remain visible), and physical
  line numbers are passed through from the future tokenizer, not calculated by validators.
- First coverage check passed tests but branches dropped to 96.15%, below baseline 97.36%.
  A separate verification assertion failed with "Branch coverage dropped below baseline".
  Tests for missing amount and missing unit restored coverage without changing production.
- Baseline: 66 tests; statements 95.37%, branches 97.36%, functions 95.08%, lines 94.79%.
  Final: 142 tests across 14 files; statements 96.73%, branches 98.71%, functions 95.71%,
  lines 96.12%. CSV production functions have 100% statements, branches, functions and lines.
- Decimal grammar deliberately rejects exponent, hex, leading plus, comma decimals,
  `.5` and `1.`; digit sequences with leading zeros remain allowed. The date parser uses
  an explicit UTC string to preserve years below 100 and avoid local-timezone behavior.
  Row values are trimmed; header matching is case-insensitive and ignores BOM via trim.
- No unexpected environment failure, push or OpenSpec archive occurred. Existing lefthook
  configuration warnings remained; checks ran explicitly.

## 2026-10-11

### Upload ingestion
- Implemented CreateUpload command/result and handler, stable storage/persistence errors,
  and the four application ports plus the minimal ProcessFileJob. Memory fakes are confined
  to the test directory. No filesystem, framework, database or new dependency was added.
- The handler validates FileName before storing the AsyncIterable byte stream, assigns an
  injected id/time, and submits Upload plus job through one saveWithJob call. Actual database
  atomicity remains an infrastructure obligation to verify in the next module.
- Eight implementation tasks ran observed REDs, then full typecheck and passing tests,
  and were committed separately. Errors first threw instead of returning Left; persistence
  failure initially returned Right; tests forced typed early returns and file compensation.
- Raised the ambiguity between best-effort cleanup and unexpected exceptions bubbling.
  The approved exception catches only storage.delete throws after an expected persistence
  Left. Both Left and thrown cleanup failures preserve the original UploadPersistenceError.
  The cleanup scenario was updated accordingly. Storage.save and saveWithJob unexpected
  exceptions still bubble; verification tests cover both and confirm operation ordering.
- Known limitation: there is no logger port yet, so cleanup failure leaves an orphan file
  without a log entry. A process crash between storage and persistence can also orphan a file.
  An unexpected persistence exception is not compensated because transaction outcome may
  be uncertain; only the expected Left takes the delete path.
- Baseline: 142 tests; statements 96.73%, branches 98.71%, functions 95.71%, lines 96.12%.
  Final: 158 tests across 17 files; statements 97.35%, branches 98.8%, functions 96.29%,
  lines 96.85%. Ingestion production code is fully covered. No unexpected test failures,
  package version changes, push or OpenSpec archive occurred.
- Test-only final verification added no production behavior; those tests passed immediately.
  Existing lefthook configuration warnings remained; checks were explicitly executed.

### Ingestion adapters
- Read the complete change and current Prisma/Vitest docs through Context7. Prisma 7 uses
  PrismaPg and imports KnownRequestError from the generated Prisma namespace; migrate dev
  requires an explicit prisma generate afterwards. No package versions were changed.
- First PostgreSQL connection failed while Docker was inactive. Reported the blocker;
  did not create another server. After the main session started Docker, created carbonbox_test
  and applied migrations only there. Development tables were never truncated or migrated.
- Added a separate integration configuration and script, with serial files to avoid shared
  database truncation races. Unit tests exclude integration files. Test helpers require an
  explicit local carbonbox_test URL and verify current_database() before truncation.
- FsFileStorage integration tests use a fresh temporary directory. Save writes an exclusively
  created .part file, closes it in finally and renames it after completion. Generated ids and
  deletion keys reject traversal. Existing final keys are not overwritten; a competing .part
  is not removed by a caller that did not create it. Delete is idempotent and returns Left on IO failure.
- A failing stream RED exposed both the original stream exception and ERR_INVALID_STATE from
  garbage collection of an unclosed FileHandle. Finally now closes the handle and failed-write
  cleanup removes the owned temporary file. Cleanup remains best effort without a logger.
- Added JobStatus and the jobs model with one unique job per upload, cascade foreign key and
  status/availableAt index. WORKER_MAX_ATTEMPTS defaults to three, rejects zero, and is passed
  into PrismaUploadRepository. Migration add_jobs was generated with migrate dev, client
  regenerated, and migrate deploy applied both migrations to a fresh migration_smoke schema
  inside carbonbox_test. Claiming, retries, dead-state transitions and composition are deferred.
- Real PostgreSQL tests verify matching upload fields and queued job defaults, duplicate id
  handling, rollback after job unique/FK failure and isolation between repeated ids. Only
  Prisma P2002 becomes UploadPersistenceError; unknown errors preserve identity and bubble.
  Rollback/unknown regression tests passed immediately because the transaction already existed.
- A catalog query unexpectedly failed because Prisma cannot deserialize PostgreSQL internal
  char; casting confdeltype to text corrected the test, without changing the schema.
- A guard test RED found that checking the URL alone did not verify the connected client;
  current_database() now blocks truncation if the client is not actually on carbonbox_test.
  Extracted the pure URL guard so unit tests do not load Prisma generated code or DB helpers.
- Baseline: 158 tests, coverage 97.35/98.8/96.29/96.85 (statements/branches/functions/lines).
  Final unit suite: 166 tests, coverage 97.47/98.92/96.34/96.98. Integration: 24 tests on real
  filesystem/PostgreSQL. Adapter-only integration coverage: 95.65/90.47/90/97.36; unusual
  filesystem stat/cleanup failures remain untested. No claim of complete adapter coverage.
- The requested security scan returned zero issues. No push, archive, new runtime dependencies
  or changes to frontend were made; commit hook configuration warnings remain.

### Process file
- Implemented the application handler and fenced processing, upload-reader and CSV-record
  ports with memory fakes. No database, filesystem reading, CSV library or process loop was
  added. Extended IFileStorage with open and Upload.complete with optional summary text.
- Raised four gaps before implementation and obtained approval: missing upload means stale
  claim, batch size counts all handled records, rejected-only batches write empty row arrays
  with accumulated failed counters, and batch size must be a positive safe integer.
  Missing-upload and rejected-only batch scenarios were added to the specification.
- The handler stops immediately on any repository Left, including a final partial batch.
  Terminal redelivery only finishes the job; PROCESSING redelivery begins again, clears old
  rows and resets counters. Fakes return detached Uploads so local mutation cannot change
  stored state before a successful fenced write. Actual SQL fencing remains the next module.
- Invalid headers, empty files and wholly rejected files finish FAILED with job done; partial
  success finishes COMPLETED with a ten-detail summary. Unexpected collaborator exceptions
  propagate to the future worker. ActivityData.create remains the final invariant guard.
- An additional approved RED/GREEN cycle corrected wholly rejected-file totals: Upload.fail
  now accepts optional final counters, sharing completion's integer/sum guards. Failed totals
  initially remained zero despite rejected rows. The handler now supplies known rejected-file
  totals; header/empty failures still use fail without counters. Added upload-lifecycle delta.
- Eight original implementation tasks and the extra counters fix record observed REDs.
  The unexpected-error regression task passed immediately without a production change.
  A separate coverage gate initially failed at 98.05% branches versus baseline 98.92%; missing
  file propagation and the test-factory rejection guard restored coverage.
- Baseline: 166 tests; coverage 97.47/98.92/96.34/96.98. Final: 209 tests across 21 files;
  coverage 98.71/99.38/98.03/98.44 (statements/branches/functions/lines). Typecheck, full
  unit suite and OpenSpec validation passed. No new dependencies or unexpected test REDs.
- Explicit debt: FsFileStorage.open only throws "File reading is not implemented yet (M4b2)"
  so the expanded interface compiles. Replace this stub with tested reading as the first
  M4b2 task; it MUST NOT reach main. No production processing can read files until then.
- Rejected-row details are retained in memory to summarize them; only displayed detail is
  capped at ten. No real lease expiry, token concurrency, parser or filesystem-read integration
  was verified here. No push or archive was performed.
- The first static scan matched the English word "any" in a test title, not a TypeScript type.
  An AST check then failed because the installed TypeScript 7 package did not expose the
  traditional ScriptTarget API. A source scan excluding literals/comments passed; function
  bodies were inspected directly. Neither failed check modified source files.

### Queue and fencing
- Implemented IJobQueue, PgJobQueue, PrismaUploadReader and PrismaProcessingRepository.
  Claim uses a single parameterized UPDATE with a locked SKIP LOCKED subquery. Integration
  tests send real simultaneous claims with Promise.all, for both one and two queued jobs.
- Every fail/begin/batch/finish shares a transaction helper that locks the job row and checks
  its token and upload identity. Lease time is not a fence: an expired current owner may
  continue until another claim actually changes the token. Approved extra guards reject rows
  or Upload payloads belonging to another upload. The specification records both identity cases.
- Claim and lease dates are parameters explicitly cast to timestamp, matching the schema's
  timestamp(3) without time zone. A live America/Bogota session test preserves the UTC
  millisecond value and claim eligibility. Operational timestamps never call SQL now();
  finish uses upload.updatedAt because that port does not receive a separate clock value.
- Backoff uses base times 2^(attempts-1); retry clears token/lease. Exhausted or permanent
  failure marks job DEAD and upload FAILED in one transaction. Deterministic processing
  FAILED remains job DONE through finish. Added positive lease/retry configuration defaults
  of 30000/1000 milliseconds, with validation and .env.example entries.
- Real CHECK constraints force job DONE/DEAD and progress updates to fail, proving rollback
  of upload state, inserted rows and lease updates. Temporary constraints are removed in
  finally. A paused transaction proves the fence lock blocks reclamation during a write.
  Tests use explicit clock values and promise gates, never sleeps or mocked concurrency.
- Old-owner begin/batch/finish/fail write nothing after a real reclaim. A new owner resets
  old rows and completes with exact counts; mismatched upload claims and payloads write
  neither upload. New callbacks are tested only against guarded carbonbox_test, not development.
- Implementation tasks record observed REDs. Concurrent-claim, expiry and stale-owner
  regression tasks passed immediately on the already atomic implementation; no fake RED
  was introduced. Unknown persistence failures propagate from transactions.
- Baseline: 209 unit tests and 24 integration tests. Final: 213 unit and 59 integration tests.
  Unit coverage 98.72/99.39/98.03/98.45, versus 98.71/99.38/98.03/98.44. New-adapter scoped
  integration coverage 96.07/91.66/100/100; corrupt stored filename/status guards were not exercised.
- A parallel coverage invocation failed because both runners used the same reports directory;
  sequential verification passed. Integration suites sharing carbonbox_test must also not be
  run as separate concurrent processes. The source scanner initially matched expect.any, a
  matcher rather than a type; excluding property identifiers corrected that false positive.
- Security scan reported zero issues and generated one harness policy artifact; it was
  inspected and removed without touching other files. No dependency changes, push or archive.
  Filesystem open, CSV tokenizing, worker loop, bounded rejection history and the ignored
  recordProgress result remain explicitly deferred to csv-reader-and-worker.

### CSV reader and worker
- Replaced FsFileStorage.open with guarded createReadStream iteration before any other task;
  saved bytes, multi-megabyte chunking, traversal and missing-file behavior passed real FS tests.
- Added the only approved dependency, csv-parse ^7.0.3, after Context7 and installed-type checks.
  Options include bom, relax_column_count, skip_empty_lines, max_record_size and info.
- Reproduced Info.lines ending-line behavior and quoted-CRLF double counting: physical lines
  [1,2,4] were reported [1,4,5]. The reader now counts CRLF/CR/LF in raw snapshots and uses
  the empty_lines delta for skipped prefixes. Tests cover LF/CRLF multiline, escaped quotes,
  a closing quote on a separate line, absent final newline and leading/inter-record empty lines.
  The real mixed fixture produced 15 valid and 10 rejected at all EXPECTED.md lines, including CRLF line6.
- Syntax/size errors become MalformedCsvError with a safe generic message, never raw CsvError
  text. Upstream IO errors retain identity. Pipeline destruction and awaiting completion close
  resources on normal completion, errors and early consumer exit.
- Added ILogger/JSON adapter; cleanup Left/throw logs fixed text with uploadId/key and preserves
  persistence failure. Worker messages use correlation ids/outcomes, never raw errors or tokens.
- Summary receives the true rejection count and the handler retains only its first ten details;
  recordProgress Either is explicitly discarded after a successful fenced write of local valid counts.
- Worker.runOnce handles idle, success, stale, transient/permanent failure and queue outages.
  The loop uses injected abortable waits, cooldown after queue throws and completes an active job
  on shutdown. Composition uses real adapters, SystemClock and randomUUID; no runtime script change.
- Real-adapter E2E: 60/60 valid, mixed25 with15 valid10 rejected, bad-header FAILED/DONE,
  bad-quote FAILED/DEAD after one attempt, 5000 rows with committed progress500..5000,
  a paused writer reclaimed after an injected-clock advance with no duplicates, and two workers
  processing two uploads once each. No concurrency sleeps or mocked database writes were used.
- Real bun run worker smoke printed started/processed/stopped; SIGTERM returned code0, signalnull.
  Database result was COMPLETED, processedRows1, jobDONE, attempts1. Integration coverage runners
  were kept sequential. Tests that already passed were identified as regression verification, not fake REDs.
- Baseline213 unit/59 integration; final259 unit/72 integration. Unit coverage99/99.49/98.4/98.77
  versus98.72/99.39/98.03/98.45 (statements/branches/functions/lines). Typecheck and OpenSpec passed.
- Found an exception to the proposed raw-memory bound: 2000 blank-prefix newlines gave raw2026
  despite max_record_size64. The approved decision is no extra reader guard; HTTP/M5 must enforce
  MAX_UPLOAD_MB (default10 MB). RAM is proportional to the file cap plus buffers/copies/match arrays,
  not guaranteed to be10 MB. Direct internal callers are not currently size-capped by the reader.
- Security scan reported zero issues; its generated policy artifact was inspected and removed.
  No push or archive. Only csv-parse was added; existing versions and frontend remain unchanged.
