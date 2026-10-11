## ADDED Requirements

### Requirement: Only the current claim holder can write
The system SHALL provide `PrismaProcessingRepository` implementing `IProcessingRepository`. Each of
`begin`, `saveBatch` and `finish` SHALL run in a transaction that locks the job row and checks the
claim token. If the token is not current, the method SHALL return a left `StaleClaimError` and
write nothing.

#### Scenario: A stale worker is rejected
- **WHEN** a job is claimed, its lease expires, a second worker claims it, and the first calls `saveBatch`
- **THEN** the result is a left `StaleClaimError` and no row is stored

#### Scenario: A slow but current worker may continue
- **WHEN** the lease end has passed but nobody reclaimed the job and the holder calls `saveBatch`
- **THEN** the result is a right

#### Scenario: A claim names a different upload
- **WHEN** the job id and token are current but the claim uploadId differs from the locked job's uploadId
- **THEN** begin, saveBatch, finish and fail return a left StaleClaimError and neither upload is changed

### Requirement: Beginning clears earlier work
The system SHALL, in `begin`, delete the activity rows of the upload and set the upload to
`PROCESSING` with zero counters and no error message.

#### Scenario: Retry after a crash
- **WHEN** an upload has 3 stored rows from an earlier attempt and `begin` runs
- **THEN** it has no activity rows and its counters are zero

### Requirement: Saving a batch stores rows, counters and the heartbeat
The system SHALL, in `saveBatch`, insert the rows, store `processedRows` and `failedRows` on the
upload and set `lockedUntil` to `now + visibility`. An empty batch SHALL still update the counters
and the lease.

#### Scenario: Batch of rows
- **WHEN** a batch of 3 rows with progress 3 and 0 is saved
- **THEN** 3 activity rows exist, the upload shows 3 and 0 and the lease moved forward

#### Scenario: Empty batch
- **WHEN** an empty batch with progress 0 and 4 is saved
- **THEN** no rows are added, the upload shows failed 4 and the lease moved forward

### Requirement: Finishing closes upload and job together
The system SHALL, in `finish`, store the status, counters and error message of the given upload and
set the job to `DONE` with the token cleared, in one transaction.

#### Scenario: Completed upload
- **WHEN** `finish` receives a completed upload with counters 5, 5, 0
- **THEN** the upload row is `COMPLETED` with those counters and the job is `DONE`

#### Scenario: A failure inside the transaction
- **WHEN** the job update fails after the upload update
- **THEN** the upload row keeps its previous state

### Requirement: The upload reader rebuilds the aggregate
The system SHALL provide `PrismaUploadReader.findById(id)` returning the `Upload` with every field
or null when it does not exist.

#### Scenario: Existing and missing
- **WHEN** an upload row exists and another id does not
- **THEN** the first returns an equal `Upload` and the second returns null
