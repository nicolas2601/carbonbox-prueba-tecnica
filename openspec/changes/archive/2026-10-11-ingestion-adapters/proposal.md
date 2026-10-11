## Why

`CreateUpload` is tested against fakes. To run for real it needs two adapters: one that writes
the file to disk and one that stores the upload and its job in PostgreSQL in a single
transaction. These are the first pieces that touch the outside world, so they are tested against
the real file system and a real database, not mocks.

## What Changes

- Add the `jobs` table (the durable queue) and its Prisma model, with a migration.
- Add `FsFileStorage`, the filesystem implementation of `IFileStorage`.
- Add `PrismaUploadRepository.saveWithJob`, one transaction that inserts the upload and a queued job.
- Add a separate integration test suite that needs the database, so the unit suite stays fast.
- Claiming, retrying and finishing jobs are NOT part of this change; they belong to
  `async-processing`, which owns the queue behaviour.

## Capabilities

### New Capabilities
- `file-storage`: stores and deletes uploaded files safely on disk
- `upload-persistence`: stores an upload and its queued job atomically
- `integration-testing`: a database backed test suite kept apart from the unit suite

### Modified Capabilities
None.

## Impact

- New code under `backend/src/document-processing/infrastructure`.
- New migration and Prisma model `Job`. New script `test:integration`.
- Needs the Docker PostgreSQL running. No new runtime dependencies.
