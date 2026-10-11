# logging Specification

## Purpose
TBD - created by archiving change csv-reader-and-worker. Update Purpose after archive.
## Requirements
### Requirement: A logger port with a JSON adapter
The system SHALL define `ILogger` with `info`, `warn` and `error`, each taking a message and an
optional context object, and SHALL provide an adapter that writes one JSON line per call with the
level, message, context and time.

#### Scenario: A line per call
- **WHEN** `warn("cleanup failed", { uploadId: "u1" })` is called
- **THEN** one line is written whose JSON has level `warn`, that message and that context

### Requirement: A failed cleanup leaves a trace
The system SHALL log, through `ILogger`, a failure of `storage.delete` during the compensation of
`CreateUpload`, with the upload id and the storage key, and SHALL still return the persistence error.

#### Scenario: Delete returns a left
- **WHEN** `saveWithJob` fails and `delete` returns a left
- **THEN** the persistence error is returned and one warning is logged with the key

#### Scenario: Delete throws
- **WHEN** `saveWithJob` fails and `delete` throws
- **THEN** the persistence error is returned and one warning is logged

