# upload-lifecycle Specification

## Purpose
TBD - created by archiving change domain-foundations. Update Purpose after archive.
## Requirements
### Requirement: UploadStatus is a closed set
The system SHALL provide `UploadStatus.create(value)` returning
`Either<InvalidUploadStatusError, UploadStatus>`, accepting only `PENDING`, `PROCESSING`,
`COMPLETED` and `FAILED`.

#### Scenario: A known status is accepted
- **WHEN** `UploadStatus.create("PROCESSING")` is called
- **THEN** the result is a right whose `value` is `PROCESSING`

#### Scenario: An unknown status is rejected
- **WHEN** `UploadStatus.create("DONE")` is called
- **THEN** the result is a left `InvalidUploadStatusError`

### Requirement: A new upload starts pending
The system SHALL create an `Upload` through `Upload.create` with an id, a `FileName`, a storage
key, a user id and the current time. A new upload SHALL be `PENDING` with no counters and no
error message, and its creation and update times SHALL equal the given time.

#### Scenario: Creating an upload
- **WHEN** `Upload.create` is called with a valid file name and a fixed time
- **THEN** the status is `PENDING`, `totalRows`, `processedRows`, `failedRows` and `errorMessage`
  are null and `createdAt` equals `updatedAt` equals that time

### Requirement: Only valid status transitions are allowed
The system SHALL allow `PENDING` to `PROCESSING` or `FAILED`, `PROCESSING` to `PROCESSING`,
`COMPLETED` or `FAILED`, and nothing from `COMPLETED` or `FAILED`. A rejected transition SHALL
return `InvalidStatusTransitionError` and SHALL leave the upload unchanged.

#### Scenario: Starting a pending upload
- **WHEN** `startProcessing(now)` is called on a pending upload
- **THEN** the result is a right, the status is `PROCESSING` and `updatedAt` is `now`

#### Scenario: Starting again after a retry
- **WHEN** `startProcessing(now)` is called on an upload that is already processing with
  some progress recorded
- **THEN** the status stays `PROCESSING` and the counters are reset to zero

#### Scenario: A terminal upload cannot change
- **WHEN** `startProcessing`, `complete` or `fail` is called on a completed or failed upload
- **THEN** each result is a left `InvalidStatusTransitionError` and the upload is unchanged

#### Scenario: A pending upload cannot complete
- **WHEN** `complete` is called on a pending upload
- **THEN** the result is a left `InvalidStatusTransitionError`

### Requirement: Progress counters are consistent
The system SHALL accept progress only while `PROCESSING`, only as non negative integers, and
SHALL complete an upload only when `processedRows + failedRows` equals `totalRows`. Violations
SHALL return `InvalidProgressError` and leave the upload unchanged.

#### Scenario: Recording progress
- **WHEN** `recordProgress({ processedRows: 500, failedRows: 3 }, now)` is called while processing
- **THEN** the counters are 500 and 3 and `updatedAt` is `now`

#### Scenario: Progress outside processing is rejected
- **WHEN** `recordProgress` is called on a pending upload
- **THEN** the result is a left `InvalidStatusTransitionError`

#### Scenario: Negative or fractional counters are rejected
- **WHEN** `recordProgress` receives `processedRows` of `-1` or `failedRows` of `1.5`
- **THEN** each result is a left `InvalidProgressError`

#### Scenario: Completing with consistent numbers
- **WHEN** `complete` receives totalRows 10, processedRows 8 and failedRows 2 while processing
- **THEN** the status is `COMPLETED` and the three counters are stored

#### Scenario: Completing with inconsistent numbers
- **WHEN** `complete` receives totalRows 10, processedRows 8 and failedRows 3
- **THEN** the result is a left `InvalidProgressError` and the status is still `PROCESSING`

### Requirement: An upload can fail with a reason
The system SHALL allow `fail(reason, now)` from `PENDING` or `PROCESSING`, storing the reason as
the error message.

#### Scenario: Failing a processing upload
- **WHEN** `fail("The header is missing", now)` is called while processing
- **THEN** the status is `FAILED` and `errorMessage` is `The header is missing`

### Requirement: An upload can be rebuilt from stored data
The system SHALL provide `Upload.reconstitute(props)` that rebuilds an upload exactly as stored,
without applying creation rules.

#### Scenario: Rebuilding a completed upload
- **WHEN** `reconstitute` receives the stored fields of a completed upload
- **THEN** the upload exposes the same status, counters and times

