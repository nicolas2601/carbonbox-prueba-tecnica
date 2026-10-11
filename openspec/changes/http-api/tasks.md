## 1. Error handling

- [x] 1.1 Error code to status table and envelope builder
- [x] 1.2 Central error handler (unexpected, validation) and not found handler
- [x] 1.3 Byte limiting iterator with the exceeded flag

## 2. Routes

- [x] 2.1 `GET /uploads/stats` and `GET /uploads/:id`
- [x] 2.2 `GET /uploads` with pagination
- [x] 2.3 `GET /uploads/:id/results`
- [x] 2.4 `POST /uploads`: valid file, missing file, wrong content type
- [x] 2.5 `POST /uploads`: invalid names and path in the name
- [x] 2.6 `POST /uploads`: size limit, exactly at the limit, nothing stored when exceeded
- [x] 2.7 `/health/ready`

## 3. Documentation

- [x] 3.1 Route schemas for all endpoints and the error envelope
- [x] 3.2 OpenAPI document and page

## 4. Process and end to end

- [x] 4.1 API composition root, entry point, graceful shutdown
- [x] 4.2 End to end through HTTP with the worker (valid, invalid rows, unknown id)
- [x] 4.3 Real smoke: start `bun run start` and `bun run worker`, upload with curl, read results, stop both

## 5. Verification

- [x] 5.1 `bun run typecheck`, `bun run test` and `bun run test:integration` pass
- [x] 5.2 No `any`, files under 300 lines, functions under 40 lines
