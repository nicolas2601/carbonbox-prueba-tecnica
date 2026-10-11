## 1. Errors, models and port

- [x] 1.1 `UploadNotFoundError`, `InvalidPaginationError`, read models and `IUploadQueries`; shared pagination validation with defaults and range rules

## 2. Handlers with fakes

- [x] 2.1 `GetUploadById`: found and not found
- [x] 2.2 `ListUploads`: defaults, second page, empty, out of range
- [x] 2.3 `GetUploadResults`: rows, isolation, empty upload, missing upload, pagination rules
- [x] 2.4 `GetUploadStats`: mixed states and empty

## 3. PostgreSQL adapter

- [x] 3.1 `findById` and `list` with order and tie breaker against the real database
- [ ] 3.2 `results`: only own rows, ordering, number and date formats, large set
- [ ] 3.3 `stats` in one grouped query

## 4. Verification

- [ ] 4.1 `bun run typecheck`, `bun run test` and `bun run test:integration` pass
- [ ] 4.2 No `any`, files under 300 lines, functions under 40 lines
