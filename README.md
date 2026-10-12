# CarbonBox - Asynchronous Document Processing

Work in progress. Upload CSV files with activity data, process them asynchronously
and show the results.

This README is completed at the end of the exercise (architecture, decisions,
known limitations and how to try it).

## Container quick start

```sh
docker compose up --build
```

Open `http://localhost:3000`; API readiness is at `http://localhost:3001/health/ready`.
The migration job waits for PostgreSQL health before API/worker start. Runtime
containers use a non-root user and share a storage volume. The worker health check
is process liveness only; queue metrics/logs are needed to verify actual progress.
The default PostgreSQL port is internal only, so an existing local server on 5432
does not conflict. Inspect it with `docker compose exec postgres psql -U postgres -d document_processing`.

If web ports are occupied, configure `FRONTEND_PORT` and `API_PORT`, for example:

```sh
FRONTEND_PORT=32000 API_PORT=32001 docker compose up --build
```

The public API URL and CORS origin are derived from those ports unless explicitly
overridden. Public frontend settings are embedded during build; rebuild after
changing them. `NEXT_PUBLIC_API_URL` and `CORS_ORIGIN` allow a non-localhost public
hostname.
The default CORS allowlist accepts both `localhost` and `127.0.0.1` at `FRONTEND_PORT`.
An explicit `CORS_ORIGIN` is a comma-separated allowlist and replaces those defaults.
Private metrics are bound to localhost inside the API container, not published;
use an internal scraper/ADOT in a deployed environment.

Optional host database access for local tooling:

```sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

This publishes PostgreSQL only on `127.0.0.1:${POSTGRES_PORT:-5433}`. Point host
tools explicitly to that port; the backend's existing local-development defaults
are not silently changed. Never run test migrations against a development database.
The sample PostgreSQL/MinIO credentials in `.env.example` are public demonstration
defaults, not deployment secrets; replace them before exposing services externally.
Only `STORAGE_DRIVER=fs` is implemented. The optional MinIO profile is an
infrastructure scaffold; `s3` and unknown driver values fail validation rather
than silently storing files locally.

## Layout

| Path | Purpose |
|---|---|
| `backend/` | Fastify + Prisma API and the file processing worker |
| `frontend/` | Next.js (App Router) application |
| `samples/` | CSV fixtures for edge cases, with expected results in `samples/EXPECTED.md` |
| `scripts/` | Fixture generator |
| `docs/` | Architecture notes and the AI usage log |
| `sample-data.csv` | 60 valid rows to try the system quickly |

## Operations and queue evolution

See [the operations runbook](docs/operations.md) for health, private metrics,
dead-job recovery, safe deployment and verified failure drills.

PostgreSQL currently commits Upload and Job together. Replacing that durable
queue with a direct SQS send would break atomicity: a committed upload could lose
its message, or a sent message could refer to a rolled-back upload. An AWS
migration must add a transactional outbox, a retryable relay and idempotent
consumers before switching traffic. Keep claim fencing and replay-from-start
semantics; acknowledge only after durable completion, extend visibility while
working, route exhausted attempts to a DLQ and provide audited redrive tooling.
Roll out behind a driver flag, drain the old queue and retain the PostgreSQL
fallback until reconciliation proves every accepted upload has a terminal
outcome. This increases operational complexity and is not implemented here.
