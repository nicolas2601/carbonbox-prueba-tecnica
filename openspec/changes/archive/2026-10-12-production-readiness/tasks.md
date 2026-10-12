## 1. HTTP hardening

- [x] 1.1 Request id header and log correlation
- [x] 1.2 Security headers, strict CORS from configuration
- [x] 1.3 Rate limiting with the standard error and a tighter upload limit

## 2. Observability

- [x] 2.1 Metrics endpoint with request duration and process metrics
- [x] 2.2 Queue depth gauges and oldest queued age
- [x] 2.3 Structured logs for 5xx and worker job outcomes

## 3. Supported storage configuration

- [x] 3.1 Typed filesystem default and fail-fast refusal of `s3`/unknown drivers, with four regression tests

## 4. Containers and pipeline

- [x] 4.1 Dockerfiles for API, worker, frontend (multi stage, non root, health checks)
- [x] 4.2 Filesystem Compose stack with migration/restart/health gates and private default PostgreSQL; optional profile configuration parses
- [x] 4.3 GitHub Actions definitions for PostgreSQL checks and owned container smoke validated against local equivalents
- [x] 4.4 Clean-source/no-cache Docker builds and actual HTTP CSV completion; separate production browser journeys verified without claiming a Docker UI walkthrough

## 5. Operations

- [x] 5.1 `job:requeue` command with tests
- [x] 5.2 `docs/operations.md` runbook and the queue migration section in the README

## 6. Verification

- [x] 6.1 Local suites, types/build/lint as applicable and strict specifications pass: backend 505 aggregate, frontend 289, Chromium 13/13
- [x] 6.2 Actual worker crash/restart/replay and PostgreSQL outage/recovery documented with exact row counts and safe failure responses

## Scope reconciliation

The original handoff completed 10 of 17 unsplit tasks. This contract now lists
15 completed local tasks after separating their verified portions from deferred
promises. The extra checkmarks do not claim new implementation or remote/browser
evidence; the original omissions below remain unperformed. Full evidence is in
`docs/operations.md`, and the normative specs cover only delivered scope.

## Deferred

- Original 3.1: S3 save/open/delete against MinIO. Optional object storage was cut;
  no S3 adapter or SDK dependency was added, and `s3` is refused at startup.
- Original 3.2: streaming multipart uploads, failed-upload cleanup and no partial
  S3 objects. Requires the unimplemented adapter; filesystem tests do not prove it.
- Original 3.3 and runtime portion of 4.2: S3 configuration/selection and a MinIO
  CSV processing journey. The optional profile is scaffolding, statically parsed
  only; no bucket-init/runtime success is claimed.
- Literal original 4.4: browser upload-to-completed from a clean Docker clone.
  The shared Playwright MCP browser was in use. Docker HTTP smoke and the separate
  owned production Chromium stack remain distinct evidence.
- Remote portion of 4.3/6.1: green GitHub Actions run, remote container smoke and
  warm-cache duration under ten minutes. No authorized push was performed.
- Bucket portion of 6.2: unreachable bucket/storage outage drill. Depends on S3;
  only real worker and PostgreSQL drills were executed.
- Expanded original runbook promise: tested backup/restore, disk-full and scaling
  exercises, plus a complete configuration matrix. The delivered runbook covers
  supported recovery/deployment checks and explicitly states these limits.
