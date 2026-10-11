## ADDED Requirements

### Requirement: A valid file is processed into stored rows
The system SHALL provide a `ProcessFile` command with a `JobClaim` and a handler returning
`Either<StaleClaimError, void>`. The handler SHALL load the upload, open its stored file, read the
header and the records, validate each record, store valid rows in batches of the configured size
and end the upload as `COMPLETED` with `totalRows`, `processedRows` and `failedRows`.

#### Scenario: A fully valid file
- **WHEN** a file with 5 valid rows is processed with a batch size of 2
- **THEN** 5 rows are stored in 3 batches and the upload is `COMPLETED` with total 5, processed 5, failed 0

#### Scenario: Progress is recorded per batch
- **WHEN** a file with 5 valid rows is processed with a batch size of 2
- **THEN** after each batch the counters sent to the repository are 2, 4 and 5 processed

### Requirement: Rejected rows do not stop the file
The system SHALL count rejected rows as failed, keep processing, and SHALL store a summary of the
rejected rows in `errorMessage` when the upload completes.

#### Scenario: Some invalid rows
- **WHEN** a file has 3 valid and 2 invalid rows
- **THEN** the upload is `COMPLETED` with processed 3, failed 2, total 5 and an `errorMessage` that lists the lines

### Requirement: Unusable files end as failed
The system SHALL end the upload as `FAILED` with a reason, and mark the job done, when the header
is invalid, the file has no records, or no record is valid.

#### Scenario: Missing header column
- **WHEN** the header lacks the `unit` column
- **THEN** the upload is `FAILED` with an `errorMessage` naming `unit` and no row is stored

#### Scenario: Only invalid rows
- **WHEN** every record is invalid
- **THEN** the upload is `FAILED` with a reason that says no valid row was found

#### Scenario: Header only
- **WHEN** the file has only the header
- **THEN** the upload is `FAILED`

### Requirement: A lost claim stops the work without side effects
The system SHALL stop and return the left `StaleClaimError` as soon as any repository call
reports that the claim is no longer current, and SHALL NOT retry that call.

#### Scenario: Another worker took over
- **WHEN** the second batch write returns `StaleClaimError`
- **THEN** the handler returns that left and no further write is attempted

### Requirement: Redelivered jobs are idempotent
The system SHALL finish the job without reading the file when the upload is already `COMPLETED`
or `FAILED`, and SHALL reprocess from zero when it is `PROCESSING`.

#### Scenario: Already completed
- **WHEN** the job arrives for a completed upload
- **THEN** the file is not opened and the job is marked done

#### Scenario: Retry of an interrupted attempt
- **WHEN** the job arrives for an upload in `PROCESSING` with earlier counters
- **THEN** `begin` is called, the counters restart at zero and the final result matches a first attempt

### Requirement: Unexpected errors are not swallowed
The system SHALL let errors thrown by the storage, the reader or the repository reach the caller.

#### Scenario: The reader throws
- **WHEN** the record reader throws midway
- **THEN** the handler rejects with that error and does not mark the upload as failed

### Requirement: A completed upload may carry a summary
The system SHALL let `Upload.complete(counters, now, summary?)` store the summary as
`errorMessage`, keeping `errorMessage` null when no summary is given.

#### Scenario: Completing with a summary
- **WHEN** `complete` is called with counters 3, 2 and a summary text
- **THEN** the status is `COMPLETED` and `errorMessage` equals the summary
