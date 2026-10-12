# Operations runbook

## Scope and safety

The default stack uses PostgreSQL and shared filesystem storage. The MinIO
profile is infrastructure preparation, not proof of a working S3 driver.
`STORAGE_DRIVER` accepts only `fs`; unsupported values fail startup validation,
so selecting `s3` cannot silently fall back to the filesystem.
Use an explicit Compose project for every disposable drill. Never kill, migrate,
truncate or remove volumes belonging to another project or development database.
Public example credentials are local-demo defaults, not deployment secrets.

## Health and incidents

- `GET /health/ready` checks database availability. A healthy worker container
  proves its process exists, not that files are progressing.
- Inspect structured API logs by `x-request-id`/`reqId`. Every 5xx has a correlated
  error line; clients receive fixed safe text, not database details.
- Worker logs contain `jobId`, `uploadId`, `attempt` and retry/dead outcome. They
  omit claim tokens, raw file contents and arbitrary failure messages.
- A rising queued age with no successful outcomes needs investigation even if
  every container is healthy. Check database, storage and lease expiry first.
- Do not replay an upload while a worker owns it. Recover only DEAD jobs after
  correcting the failure; queued jobs recover through their visibility lease.

## Private metrics

API metrics listen separately at `127.0.0.1:9090/metrics` by default. There is no
public `/metrics` API route or published Compose port. Inspect inside the API:

```sh
docker compose exec api node -e "fetch('http://127.0.0.1:9090/metrics').then(r => r.text()).then(console.log)"
```

Use a collector sharing the network namespace, or deliberately configure a
private interface protected by network policy/security groups. A collector in a
different Compose container cannot reach this loopback default. Never publish
9090 on the internet. A failed queue scrape returns 503, not invented zeroes.

Monitor `carbonbox_http_request_duration_seconds`, request totals by bounded
route/method/status class, `carbonbox_queue_jobs` (QUEUED/DONE/DEAD),
`carbonbox_queue_oldest_queued_age_seconds` and process metrics. QUEUED includes
leased in-flight jobs; oldest age measures time since creation, not next retry.

## Recover a dead upload

After identifying and correcting the cause:

```sh
# Local tooling: set DATABASE_URL explicitly to the intended database first.
cd backend
bun run job:requeue <uploadId>
# Container runtime, from the repository root and intended Compose project:
docker compose exec worker node dist/requeue.js <uploadId>
```

The command refuses missing/non-DEAD jobs, resets attempts and error/progress
state, invalidates old lease/token and moves Upload to PENDING atomically. Exit
codes: 0 queued, 1 refused/failure, 2 invalid CLI arguments. The next worker claim
restarts parsing and clears prior activity rows under the new fence, preventing
duplicate results. Keep an operator audit record of who requeued and why; this
local command is not a public administrative endpoint or authentication system.

## Deploy and roll back

Build immutable images, back up PostgreSQL and storage, and apply migrations
before starting the matching API/worker. Confirm readiness, an actual completed
CSV and queue progress. Roll back application images only while schema
compatibility is retained; never guess a reverse database migration. Keep volumes
and retained feature branches. Rebuild frontend when its public API URL changes.

Rate limits use connection IP without trusting forwarded headers. Reverse proxy
deployments need an explicitly reviewed trust boundary; blindly trusting
`x-forwarded-for` enables quota bypass. CSP supports static/PPR with inline
scripts/styles explicitly permitted; it is not nonce-strict CSP.

## Verification status

On 2026-10-12 private metrics returned 200 inside the owned API container, public
`/metrics` returned 404, port bindings contained only 3001 and another container
could not connect to 9090. Real PostgreSQL integration covers lease takeover,
fencing, retries, atomic completion and DEAD requeue/replay without duplicates.
Owned worker-kill/database-restart drills are recorded below when completed.
Bucket-unreachable evidence remains pending until the S3 adapter is implemented.
GitHub Actions configuration and local checks are verified; no remote green CI
run is claimed without an authorized push.

### Owned failure drills, 2026-10-12

Project: `carbonbox-smoke-clean-m10-20261012`, API 32001, frontend 32000,
internal PostgreSQL. No original/development container or volume was modified.

| Drill | Observed evidence | Result |
|---|---|---|
| Manual `docker kill` after 500 of 100000 rows | Worker exited 137; restart count remained 0; expired QUEUED lease, attempts 1 | Initial 120 s wait failed. Explicit `docker start` then completed upload `c20befed-54ba-431d-b930-347fdcad522b`, DONE/attempts 2, exactly 100000 stored rows, zero rejected |
| Actual process crash from host after 500 of 50000 rows | Host PID read from the owned non-root container and killed; restart count 0 to 1 | Upload `bf4227b7-e689-41fa-a6b1-bca517a79c0c` COMPLETED, DONE/attempts 2, exactly 50000 stored rows, zero rejected; no manual restart |
| PostgreSQL stopped, then started with the same volume | Readiness 503, safe SERVICE_UNAVAILABLE body and matching `m10-database-drill` request id; private metrics 503 with fixed text | Readiness returned 200; a new upload `56963a6b-320a-4e86-b5eb-e24521e19942` completed; worker remained usable |

`docker kill` is an operator stop, not the same as a process crash for restart
policy purposes. A SIGKILL sent to PID1 from inside its own namespace also did
not prove a crash (restart count stayed 0); that attempt is not counted as recovery
evidence. The host-process drill explicitly verified a restart and database row
count, not just a successful HTTP status. Smoke commands outside the repository
root exposed a relative-fixture bug (`curl: (26) Failed to open/read local data`).
The script now resolves its Compose file and public fixture from its own directory;
the backend-directory rerun passed. No worker/database recovery fix was needed.

The security scanner exited 1 with seven heuristic findings: six `innerHTML`
assignments in generated Istanbul coverage assets and a SQL-interpolation match
at `frontend/e2e/localStack.test.ts:32`. The latter is a test connection URL built
from two fixed database names, not a SQL query; the scanner matches the `sql`
substring in `postgresql` plus template interpolation. These were inspected,
not suppressed; this is not a clean scanner exit or a full penetration test.

### Final local checks

- Backend: 389 unit and 116 integration tests (505 aggregate), types and API,
  worker/operator bundles passed. Aggregate coverage: statements 98.15%,
  branches 96.63%, functions 99.03%, lines 99.42%. Statements and branches exceed
  the previously recorded 97.9%/95.7% baseline.
- Frontend: 289 tests, lint, types and isolated Next production build passed.
  Production Chromium: 13/13 in 47.2 s, five axe pages without serious/critical
  violations; twenty normal/reduced-motion captures are committed.
- All 33 OpenSpec items validate strictly. Compose configuration validates with
  the optional profile; filesystem containers run healthy and process actual CSVs.
- Browser proof of upload/completion in the clean Docker stack is not claimed:
  Playwright MCP returned `Browser is already in use`. Owned production E2E
  journeys and Docker HTTP processing are verified separately, not conflated.
- S3 adapter/multipart runtime and bucket-unreachable drill are deferred. Selecting
  `s3` fails configuration rather than silently falling back. Remote CI remains
  pending; no push, archive or merge was performed by this worker.
