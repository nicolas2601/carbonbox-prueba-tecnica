## 1. Errors and ports

- [x] 1.1 `StorageFailureError` and `UploadPersistenceError` with unique codes
- [x] 1.2 Ports `IFileStorage`, `IUploadRepository`, `IIdGenerator`, `IClock` and `ProcessFileJob`, plus in-memory fakes under the test folder

## 2. CreateUpload handler

- [x] 2.1 Valid file: stores, creates a `PENDING` upload and saves it with its job
- [x] 2.2 File name trimmed and key kept as `fileUrl`
- [x] 2.3 Invalid file name: left, nothing stored or saved
- [ ] 2.4 Storage failure: left, nothing saved
- [ ] 2.5 Persistence failure: left and stored file deleted
- [ ] 2.6 Cleanup failure does not hide the persistence error

## 3. Verification

- [ ] 3.1 `bun run typecheck` and `bun run test` pass, coverage not below the baseline
- [ ] 3.2 No `any`, files under 300 lines, functions under 40 lines, ports import no framework
