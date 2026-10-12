## ADDED Requirements

### Requirement: S3 adapter behind the existing port
The system SHALL provide `S3FileStorage` implementing `IFileStorage` (save from a stream, open as a stream, delete) against any S3 compatible endpoint, selected by `STORAGE_DRIVER=s3` with bucket, region and endpoint configuration, and SHALL keep `fs` as the default.

#### Scenario: Save and open
- **WHEN** a stream is saved and the returned key is opened
- **THEN** the bytes read equal the bytes saved

#### Scenario: Large file
- **WHEN** a file of several megabytes is saved
- **THEN** it is uploaded in parts without loading it whole in memory and reads back identical

#### Scenario: Delete is idempotent
- **WHEN** a key is deleted twice
- **THEN** both calls succeed

#### Scenario: Failure is a value
- **WHEN** the bucket does not exist or the endpoint is unreachable
- **THEN** `save` returns a left `StorageFailureError` and no partial object remains

### Requirement: The whole flow works with S3
The system SHALL pass the end to end processing check with the S3 driver against MinIO.

#### Scenario: Upload to completed
- **WHEN** `sample-invalid.csv` is uploaded with the S3 driver and the worker runs
- **THEN** the upload is COMPLETED with 15 processed and 10 rejected rows

### Requirement: Configuration is validated
The system SHALL fail at start with a clear message when the S3 driver is selected without bucket or endpoint, and SHALL never log credentials.

#### Scenario: Missing bucket
- **WHEN** the driver is s3 and the bucket is empty
- **THEN** the process exits naming the variable
