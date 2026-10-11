## ADDED Requirements

### Requirement: The ports describe what the use case needs, not how it is done
The system SHALL define these contracts in the application layer, free of any framework or
driver import: `IFileStorage` with `save(stream)` returning `Either<StorageFailureError, string>`
(the stored key) and `delete(key)` returning `Either<StorageFailureError, void>`;
`IUploadRepository` with `saveWithJob(upload, job)` returning
`Either<UploadPersistenceError, void>` and meaning "both stored or neither";
`IIdGenerator` with `next()`; `IClock` with `now()`.

#### Scenario: Ports are pure contracts
- **WHEN** the port files are inspected
- **THEN** they import only domain and application types, never Fastify, Prisma, `fs` or `pg`

### Requirement: The job payload is minimal
The system SHALL define `ProcessFileJob` with only the `uploadId`.

#### Scenario: Job shape
- **WHEN** a job is created for upload `u1`
- **THEN** it has exactly the field `uploadId` equal to `u1`
