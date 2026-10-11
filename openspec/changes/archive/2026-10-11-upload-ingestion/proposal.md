## Why

The first thing the system does is accept a file: check the name, keep the bytes, record an
upload in state `PENDING` and leave a job for the worker. This use case is the entry point of the
whole flow. It also defines the ports (interfaces) that the infrastructure must implement later,
so the order of the steps and their failure handling can be tested now with in-memory fakes,
before any database, file system or HTTP exists.

## What Changes

- Add the `CreateUpload` command and its handler, returning `Either<Error, CreateUploadResult>`.
- Add the ports the handler needs: `IUploadRepository`, `IFileStorage`, `IIdGenerator`, `IClock`.
- Add two application errors with stable codes: `StorageFailureError`, `UploadPersistenceError`.
- Define the job payload `ProcessFileJob` carried to the worker.
- The handler never touches Prisma, the file system or HTTP. Fakes live in the test folder.
- Ports for reading results, claiming jobs and storing rows are NOT defined here. They are
  defined together with the first use case that consumes them (`async-processing`, queries).

## Capabilities

### New Capabilities
- `create-upload`: the use case that accepts a file and queues its processing
- `ingestion-ports`: the contracts the use case depends on

### Modified Capabilities
None.

## Impact

- New code under `backend/src/document-processing/application/create-upload` and
  `backend/src/document-processing/application/ports`.
- No new dependencies, no I/O, no HTTP, no database.
- `async-processing` implements the ports and consumes `ProcessFileJob`.
