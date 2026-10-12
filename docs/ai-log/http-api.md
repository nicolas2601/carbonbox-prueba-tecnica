# HTTP API AI usage

Date: 2026-10-11

- Generated five versioned upload endpoints, thin controllers, typed boundary
  adapters, public response schemas, liveness/readiness, centralized error handling,
  Swagger documentation, shared API composition and graceful shutdown.
  No frontend, persistence schema or processing-domain changes were made.
- Implementation followed the 17 OpenSpec tasks with observed REDs and task-level
  commits. The final verification and review tasks also record their checks;
  already-green regression tests are not retrospectively claimed as RED cycles.
- The error table initially inherited object prototype keys such as `constructor`;
  a regression exposed it and `Object.hasOwn` now makes unknown codes map to 500.
  Server errors have fixed public messages and a correlated requestId; readiness
  keeps SERVICE_UNAVAILABLE/503 without exposing the database cause.
- Multipart filenames were initially normalized to a basename by the plugin.
  Real requests named `../x.csv` and with backslashes incorrectly returned 201.
  `preservePath` retains the original metadata for the FileName domain guard.
- The plugin's initial byte limit returned 413 before the application's exceeded
  flag was set. An observation-only spy exposed that behavior. The plugin ceiling
  is now MAX+1 so the streaming byte counter detects the first excess byte itself.
  Exactly MAX is accepted; excess, missing/wrong file parts and extra files leave
  no upload, job or stored file. Extra parts are checked before persistence.
- A conventional multipart body schema caused runtime AJV to reject streamed
  uploads with `body must be object`. The approved `x-stream-body` metadata is
  transformed only for OpenAPI. It does not buffer uploads or disable validation
  of query parameters and path parameters, and the extension is absent from JSON.
  POST documents the binary file field and the Location response header.
- Real-database HTTP tests verify stats/detail/list/results, numeric amounts, UTC
  dates, invalid pagination, DTO privacy, readiness failure, docs JSON/HTML, and
  sample-invalid upload -> worker -> COMPLETED 25/15/10 -> 15 results.
- The final review reproduced credentials leaking through Pino's raw error
  serialization: the new regression failed because `example-password` appeared
  in both the error message and stack. A small URL-userinfo masker now runs before
  logging those fields. Native Pino redaction masks authorization and cookie
  headers; real logger tests preserve the database host and requestId while hiding
  the dummy password and sensitive header values. Arbitrary error properties are
  not copied. This verifies URL credentials and those headers, not general secret
  or file-content sanitization.
- Final typecheck passes, with 330 unit tests and 106 integration tests. Unit-only
  coverage is 85.45/86.27/82.90/86.03; combined coverage is
  97.87/95.71/98.86/98.90 (statements/branches/functions/lines), with 436 tests in
  53 files. The HTTP layer is primarily exercised against real PostgreSQL and
  filesystem adapters, so loading it from App lowers isolated unit coverage by
  broadening that denominator. No coverage exclusions or thresholds were changed.
- Added `test:coverage:all`: unit measurement first, then native Vitest unit and
  integration projects with sequential files. Reports stay in coverage/unit and
  coverage/all. The first manual Istanbul merge failed because its package was
  not directly resolvable; native projects avoid adding a dependency or averaging
  percentages. One early combined run lacked DATABASE_URL and correctly failed
  the test database guard; all final runs used the disposable local database.
- AST checks cover authored TypeScript only, not Prisma-generated files: no
  explicit `any` in 148 files/731 functions; maximum file size is 231 lines and
  maximum function length is 31 lines. Generated
  Prisma code retains the vendor's types. Diff checks pass.
- Security scan ran and exited 1: one HIGH at errorHandlers.test.ts:66 is the
  intentionally fake regression password; six MEDIUM findings concern ignored
  coverage/all, coverage/unit and coverage/integration prettify/sorter assets.
  No clean security scan is claimed. Inspected scanner-created policy artifacts
  were removed without touching project configuration or unrelated files.
- Real final smoke started `bun run start` and `bun run worker` as separate
  processes, posted sample-invalid.csv using curl -F, fetched upload/results/stats
  and /docs/json, then sent SIGTERM. POST returned 201, the upload completed with
  25 total/15 processed/10 rejected, results contained 15 rows, stats showed one
  completion, and both processes exited 0. Child behavior is verified but is not
  included in parent-process coverage instrumentation.
- Remaining scope belongs to the coordinator: review/archive/merge and frontend
  delivery. This session did not push, archive or change branches.
