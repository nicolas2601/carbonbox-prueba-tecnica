## Why

The dashboard and the detail page need to read: one upload, a page of uploads, the processed rows of an
upload and four totals. Reading has different needs from writing (pagination, counting, no
state change), so it gets its own use cases and its own port, following the command and query
split of the exercise. It is built before the HTTP layer so the rules can be tested without a server.

## What Changes

- Add four query handlers: `GetUploadById`, `ListUploads`, `GetUploadResults`, `GetUploadStats`, each returning `Either`.
- Add the read port `IUploadQueries` and its Prisma adapter.
- Add two application errors: `UploadNotFoundError` and `InvalidPaginationError`.
- Define the read models (DTOs) the HTTP layer will return.
- No HTTP, no routes, no schema change.

## Capabilities

### New Capabilities
- `upload-queries`: the four query use cases and their rules
- `query-adapters`: the PostgreSQL implementation of the read port

### Modified Capabilities
None.

## Impact

- New code under `application/queries` and `infrastructure/persistence`.
- Integration tests against the real database.
