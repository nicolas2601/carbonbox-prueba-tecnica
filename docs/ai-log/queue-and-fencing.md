# Queue and fencing AI usage

Date: 2026-10-11

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
