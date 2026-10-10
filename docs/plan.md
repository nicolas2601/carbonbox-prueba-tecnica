# Plan and technical decisions

Working contract for the exercise. It is kept up to date while building and feeds the
"Technical decisions" section of the README.

## Priorities

1. The system works end to end: upload, queue, worker, status, results.
2. Business logic never lives in controllers; layers are separated.
3. Honest documentation: limitations and AI usage (`docs/ai-log.md` becomes `USO-DE-IA.md`).
4. Everything else (extra bonus items) only if the previous three are done.

## Architecture

Bounded context `document-processing`, Clean Architecture, dependencies point inwards:

```
presentation -> application -> domain <- infrastructure
```

| Layer | Contains | May import |
|---|---|---|
| domain | `Upload` aggregate, `ActivityData`, value objects (`UploadStatus`, `FileName`), repository interfaces | nothing external |
| application | commands, queries and their handlers, `CsvParserService`, ports | domain |
| infrastructure | Prisma repositories and mappers, queue, file storage, composition root | application, domain |
| presentation | Fastify controllers and routes | application |

- CQRS: `CreateUpload`, `ProcessFile` (commands); `GetUploadById`, `ListUploads`,
  `GetUploadResults`, `GetUploadStats` (queries).
- Every handler returns `Either<Error, Result>`. Expected failures are values, not exceptions.
  Controllers have no `try/catch`: a base controller maps `Left` to an HTTP response and a
  central Fastify error handler covers the unexpected.
- Dependency injection by hand: constructors receive their dependencies and a single
  composition root (`DocumentProcessingModule.ts`) wires them. No Prisma in controllers.
- Clock and id generation are injected so handlers are deterministic in tests.

## API

Prefix `/api/v1`. Errors use `{ "error": { "code": "...", "message": "..." } }`.

| Method | Path | Notes |
|---|---|---|
| POST | `/uploads` | multipart field `file`, `.csv` only, size capped by `MAX_UPLOAD_MB`; `201 { id, status, fileName, createdAt }` |
| GET | `/uploads/stats` | `{ total, completed, inProgress, failed }`; `inProgress` = PENDING + PROCESSING |
| GET | `/uploads/:id` | state with `totalRows`, `processedRows`, `failedRows`, `errorMessage` |
| GET | `/uploads` | `?page=1&limit=10`, limit capped at 100; `{ data, total, page, limit }` |
| GET | `/uploads/:id/results` | `{ data: [{ category, amount, unit, date }] }`, paginated with `page` and `limit` |

The statement does not define the stats endpoint nor the meaning of "in progress"; both are
decisions made here because the dashboard needs them.

## Queue

The statement allows a mock queue, but an in-memory array cannot connect the API process
with the separate `npm run worker` process. The queue is therefore **durable and backed by
PostgreSQL** behind the ports `IMessagePublisher` and `IMessageConsumer`. It is not SQS and
is not described as SQS; the AWS diagram shows where SQS and its dead letter queue would go.

- The `Upload` row and its job are created in **one transaction**, so there is never a job
  without an upload nor an upload that is never queued.
- Claiming uses `FOR UPDATE SKIP LOCKED`, so two workers never take the same job.
- A job locked for longer than a visibility timeout becomes claimable again (worker crash).
- Failures retry with increasing delay (`availableAt`). After `maxAttempts` the job is dead
  and the upload is marked `FAILED` with the reason.

## Storage

`IFileStorage` with a local filesystem implementation. API and worker read the same
`STORAGE_DIR`. The stored name is a generated id plus `.csv`; the original name is only
metadata and is never used to build a path.

## Processing rules

- Header must contain `category,amount,unit,date`.
- A row is valid when every column is present, `category` and `unit` are not empty after
  trimming, `amount` is a finite number greater than zero and `date` is a real
  `YYYY-MM-DD` calendar date.
- Rows are persisted in batches of `WORKER_BATCH_SIZE`; `processedRows` and `failedRows`
  are updated per batch, which is what drives the progress bar.
- `COMPLETED` when the file was readable, even if some rows were rejected
  (`failedRows > 0`, summary in `errorMessage`). `FAILED` when the file cannot be read, the
  header is wrong or no row is valid.
- Processing is idempotent: a retried job first removes rows already stored for that upload.
- No artificial delays. `samples/sample-large.csv` is the larger file for the demo.

## Frontend

Next.js App Router, TanStack Query and Axios. Pages: dashboard `/`, list `/uploads`,
upload `/uploads/new`, detail `/uploads/[id]`.

- The detail page polls every 3 seconds while the status is `PENDING` or `PROCESSING`
  (`refetchInterval` returns `false` once it is terminal).
- Status badges: PENDING yellow, PROCESSING blue, COMPLETED green, FAILED red.
- The upload form accepts only `.csv` and shows upload progress.

## Testing

Vitest. Unit tests for the CSV parser and validation, `Either`, and handlers with fake
dependencies. One integration test of upload, worker, status and results against a real
PostgreSQL if time allows.

## Work packages

| # | Package | Owner |
|---|---|---|
| 0 | Repository, tooling, schema, config, health endpoint, fixtures | done in `feature/project-setup` |
| 1 | Backend core: domain, application, infrastructure, presentation, worker, unit tests | worker session, reviewed by the main session |
| 2 | Frontend: pages, API client, polling, dashboard | pending |
| 3 | Docs: AWS diagram, flow diagram, README, `USO-DE-IA.md`, video | pending |

## Working agreements

- Branches: `main`, `develop`, `feature/*`; branches are never deleted.
- Atomic conventional commits, no AI attribution trailers. Nothing is pushed yet.
- Test first for logic: red, green, refactor.
- A change is done when typecheck, tests and lint (where it exists) pass, with the output seen.
- Versions: latest stable. Two deliberate exceptions, both documented in `docs/ai-log.md`.
