# create-upload Specification

## Purpose
Turn a valid CSV file into a pending upload with a queued job, and refuse anything else.
## Requirements
### Requirement: A valid file becomes a pending upload with a queued job
The system SHALL provide a `CreateUpload` command with a file name, a byte stream and a user
id, and a handler returning `Either<Error, CreateUploadResult>`. On success the handler SHALL
store the stream, create an `Upload` in state `PENDING` whose `fileUrl` is the stored key, save
the upload and a `ProcessFileJob` carrying its id through `saveWithJob`, and return the id,
status, trimmed file name and creation time.

#### Scenario: Creating an upload
- **WHEN** the handler runs with file name `report.csv`, a user id, a fixed id `u1` and a fixed time
- **THEN** the result is a right with id `u1`, status `PENDING`, file name `report.csv` and that time

#### Scenario: The stream is stored and the key is kept
- **WHEN** the storage returns the key `k1.csv`
- **THEN** the saved upload has `fileUrl` `k1.csv` and exactly one job with `uploadId` `u1` was saved with it

#### Scenario: The file name is trimmed
- **WHEN** the file name is `  report.csv  `
- **THEN** the returned file name is `report.csv`

### Requirement: An invalid file name is rejected before anything is stored
The system SHALL validate the name with `FileName` first and, if it is invalid, return a left
`InvalidFileNameError` without calling the storage or the repository.

#### Scenario: A non CSV name
- **WHEN** the file name is `report.txt`
- **THEN** the result is a left `InvalidFileNameError`, nothing is stored and nothing is saved

### Requirement: A storage failure stops the flow
The system SHALL return the left `StorageFailureError` when the storage fails and SHALL NOT
save an upload or a job.

#### Scenario: Storage fails
- **WHEN** the storage returns a left
- **THEN** the result is a left `StorageFailureError` and nothing is saved

### Requirement: A persistence failure removes the stored file
The system SHALL delete the stored file when `saveWithJob` fails and SHALL return a left
`UploadPersistenceError`.

#### Scenario: Saving fails
- **WHEN** `saveWithJob` returns a left after the file was stored under `k1.csv`
- **THEN** the result is a left `UploadPersistenceError` and the storage was asked to delete `k1.csv`

#### Scenario: The cleanup also fails
- **WHEN** `saveWithJob` returns a left and delete either returns a left or throws
- **THEN** the result is still the left `UploadPersistenceError`

### Requirement: Application errors have stable codes
The system SHALL define `StorageFailureError` with code `STORAGE_FAILURE` and
`UploadPersistenceError` with code `UPLOAD_PERSISTENCE_FAILURE`, both extending `DomainError`.

#### Scenario: Error codes
- **WHEN** each error is created with a reason
- **THEN** its `code` is the one above and its `message` is the reason

