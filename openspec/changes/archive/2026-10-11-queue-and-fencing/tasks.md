## 1. Configuration

- [x] 1.1 `WORKER_VISIBILITY_TIMEOUT_MS` and `WORKER_RETRY_BASE_MS` in Convict and `.env.example`

## 2. Upload reader

- [x] 2.1 `PrismaUploadReader.findById`

## 3. Job queue

- [x] 3.1 `claim`: one job, none, not yet available
- [x] 3.2 `claim`: concurrent callers never share a job
- [x] 3.3 `claim`: live lease hidden, expired lease reclaimed with a new token
- [x] 3.4 `fail`: retry with doubling delay
- [x] 3.5 `fail`: dead on exhausted attempts or permanent, upload failed in one transaction
- [x] 3.6 `fail`: stale token rejected

## 4. Fenced processing

- [x] 4.1 `begin`: clears earlier rows and resets the upload
- [x] 4.2 `saveBatch`: rows, counters and heartbeat, including an empty batch
- [x] 4.3 `finish`: upload and job closed together, rolled back together
- [x] 4.4 Stale token rejected by `begin`, `saveBatch` and `finish`; a slow current holder may continue

## 5. Verification

- [x] 5.1 `bun run typecheck`, `bun run test` and `bun run test:integration` pass
- [x] 5.2 No `any`, files under 300 lines, functions under 40 lines
