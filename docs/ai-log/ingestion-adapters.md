# Ingestion adapters AI usage

Date: 2026-10-11

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
