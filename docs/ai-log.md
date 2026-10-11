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
