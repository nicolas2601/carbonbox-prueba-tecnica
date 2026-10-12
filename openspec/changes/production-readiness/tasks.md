## 1. HTTP hardening

- [x] 1.1 Request id header and log correlation
- [x] 1.2 Security headers, strict CORS from configuration
- [x] 1.3 Rate limiting with the standard error and a tighter upload limit

## 2. Observability

- [x] 2.1 Metrics endpoint with request duration and process metrics
- [x] 2.2 Queue depth gauges and oldest queued age
- [x] 2.3 Structured logs for 5xx and worker job outcomes

## 3. Object storage

- [ ] 3.1 `S3FileStorage` save, open, delete against MinIO (integration tests)
- [ ] 3.2 Multipart upload for large files and failure as a value
- [ ] 3.3 Driver selection, configuration validation, end to end with S3

## 4. Containers and pipeline

- [x] 4.1 Dockerfiles for API, worker, frontend (multi stage, non root, health checks)
- [ ] 4.2 Compose stack with migration step, restart policies and the `s3` profile
- [x] 4.3 GitHub Actions workflow with PostgreSQL service and container smoke test (configuration validated; remote run pending authorized push)
- [ ] 4.4 Clean clone dry run: one command, upload through the interface, completed

## 5. Operations

- [x] 5.1 `job:requeue` command with tests
- [x] 5.2 `docs/operations.md` runbook and the queue migration section in the README

## 6. Verification

- [ ] 6.1 All unit, integration and end to end suites pass; CI green
- [ ] 6.2 Failure drills documented with evidence: worker killed, database restarted, bucket unreachable

## Handoff limits

Ten tasks are complete. Object storage 3.1–3.3 is deferred; 4.2 has a verified
filesystem stack and configured profile, not a verified S3 runtime. For 4.4,
clean-source Docker builds/HTTP smoke and owned production browser journeys passed
separately; the actual Docker UI journey remains unverified because Playwright
MCP's shared browser is in use. For 6.1 all local suites pass, but remote CI needs
an authorized push. For 6.2 real worker crash/replay and database outage/recovery
passed; the bucket drill is not implemented. These tasks stay unchecked rather
than presenting partial evidence as completion. See `docs/operations.md`.
