# processing-ports Specification

## Purpose
Describe the fenced writes and the reading collaborators the processor depends on.
## Requirements
### Requirement: Fenced processing writes
The system SHALL define `IProcessingRepository` with `begin(claim, now)`,
`saveBatch(claim, rows, progress, now)` and `finish(claim, upload)`, each returning
`Either<StaleClaimError, void>`. `begin` SHALL delete the rows stored earlier for the upload.
`saveBatch` SHALL store the rows and the counters and extend the lease. `finish` SHALL store the
final upload state and mark the job done. Each SHALL be atomic and SHALL check the claim.

#### Scenario: Contract only
- **WHEN** the port files are inspected
- **THEN** they import only domain and application types

### Requirement: Reading collaborators
The system SHALL define `IUploadReader.findById(id)` returning the upload or null,
`IFileStorage.open(key)` returning an `AsyncIterable<Uint8Array>`, and
`ICsvRecordReader.read(stream)` returning an `AsyncIterable` of `{ line, fields }`.

#### Scenario: Fakes can implement every port
- **WHEN** in-memory fakes implement the ports
- **THEN** the handler runs with no database, file system or library

