# upload-persistence Specification

## Purpose
TBD - created by archiving change ingestion-adapters. Update Purpose after archive.
## Requirements
### Requirement: The jobs table models a durable queue entry
The system SHALL add a `jobs` table with an id, the upload id (unique, referencing `uploads`
with cascade delete), `status` (`QUEUED`, `DONE`, `DEAD`), `attempts`, `maxAttempts`,
`availableAt`, `lockedUntil`, `claimToken`, `lastError`, `createdAt` and `updatedAt`, plus an index
on `(status, availableAt)`.

#### Scenario: The migration applies to an empty database
- **WHEN** `prisma migrate deploy` runs on a new database
- **THEN** the table `jobs` exists with the index and the foreign key to `uploads`

### Requirement: Saving stores the upload and its job together
The system SHALL provide `PrismaUploadRepository.saveWithJob(upload, job)` implementing
`IUploadRepository`. It SHALL insert the upload row and one job row in a single transaction.
The job row SHALL have status `QUEUED`, attempts 0, `maxAttempts` from configuration and
`availableAt` equal to the upload creation time.

#### Scenario: Saving a pending upload
- **WHEN** a `PENDING` upload with its job is saved
- **THEN** the result is a right, one `uploads` row exists with the same fields and one `jobs`
  row exists with status `QUEUED`, attempts 0 and the upload id

### Requirement: A failure stores neither row
The system SHALL roll back the upload when the job cannot be inserted, and SHALL return a left
`UploadPersistenceError` for a duplicate upload id. Errors that are not known persistence
failures SHALL be rethrown.

#### Scenario: Duplicate upload id
- **WHEN** an upload with an id that already exists is saved
- **THEN** the result is a left `UploadPersistenceError` and the table still has one upload

#### Scenario: The job insert fails
- **WHEN** the job insert is forced to fail after the upload insert
- **THEN** no upload row remains

#### Scenario: Unknown errors are not hidden
- **WHEN** the database client throws an error that is not a known persistence failure
- **THEN** the same error reaches the caller

