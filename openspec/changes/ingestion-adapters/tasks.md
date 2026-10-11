## 1. Test infrastructure

- [x] 1.1 `test:integration` script and separate Vitest project; unit suite excludes `*.integration.test.ts`; helper that truncates tables

## 2. File storage

- [x] 2.1 `FsFileStorage.save`: writes the stream under a generated key and creates the directory
- [x] 2.2 `FsFileStorage.save`: unique keys, temporary name then rename
- [x] 2.3 `FsFileStorage.save`: a failing stream leaves no file and returns a left
- [x] 2.4 `FsFileStorage.delete`: removes the file, idempotent
- [x] 2.5 `FsFileStorage.delete`: refuses traversal keys

## 3. Upload persistence

- [x] 3.1 `Job` model and migration `add_jobs`, applied to a real database
- [x] 3.2 `saveWithJob`: stores upload and queued job in one transaction
- [x] 3.3 `saveWithJob`: duplicate id returns a left and stores nothing
- [x] 3.4 `saveWithJob`: rollback when the job insert fails
- [x] 3.5 `saveWithJob`: unknown errors are rethrown

## 4. Verification

- [x] 4.1 `bun run typecheck`, `bun run test` and `bun run test:integration` pass
- [ ] 4.2 No `any`, files under 300 lines, functions under 40 lines
