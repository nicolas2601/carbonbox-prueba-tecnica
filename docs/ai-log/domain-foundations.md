# Domain foundations AI usage

Date: 2026-10-10

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
