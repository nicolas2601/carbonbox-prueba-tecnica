## ADDED Requirements

### Requirement: Domain errors carry a stable code and a readable message
The system SHALL define a `DomainError` base class that extends `Error` and exposes a string `code`
and a human readable `message`. Every specific domain error SHALL extend it with a fixed code, so
the HTTP layer can map errors without inspecting messages.

#### Scenario: A specific error exposes its code
- **WHEN** an `InvalidFileNameError` is created with a reason
- **THEN** its `code` is `INVALID_FILE_NAME`, its message contains the reason and it is an
  instance of `DomainError` and of `Error`

#### Scenario: Codes are unique per error type
- **WHEN** `InvalidFileNameError`, `InvalidUploadStatusError`, `InvalidStatusTransitionError`,
  `InvalidProgressError` and `InvalidActivityDataError` are created
- **THEN** each one has a different `code`
