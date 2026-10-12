# storage-driver Specification

## Purpose
Select the storage driver and refuse unsupported values.
## Requirements
### Requirement: Filesystem is the supported default
The system SHALL default `STORAGE_DRIVER` to `fs` and retain the existing filesystem storage port implementation for API and worker processes. This change SHALL NOT advertise an unimplemented S3 runtime as supported.

#### Scenario: Default driver
- **WHEN** `STORAGE_DRIVER` is absent or is `fs`
- **THEN** settings select the implemented filesystem driver

### Requirement: Unsupported drivers are refused
The system SHALL reject an unsupported driver during settings validation before creating the runtime, rather than silently saving files locally.

#### Scenario: Unsupported S3 selection
- **WHEN** `STORAGE_DRIVER=s3` is selected in this filesystem-only build
- **THEN** validation refuses the configuration instead of starting a filesystem fallback

#### Scenario: Misspelled driver
- **WHEN** an unknown driver name is supplied
- **THEN** validation refuses the configuration

