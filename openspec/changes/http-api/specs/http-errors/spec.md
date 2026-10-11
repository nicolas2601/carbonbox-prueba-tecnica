## ADDED Requirements

### Requirement: One error envelope
The system SHALL answer every error with `{ "error": { "code", "message" } }` and a matching status.

#### Scenario: Shape
- **WHEN** any endpoint answers an error
- **THEN** the body has exactly an `error` object with a string `code` and a string `message`

### Requirement: Error codes map to statuses in one table
The system SHALL map `INVALID_FILE_NAME`, `INVALID_PAGINATION`, `MISSING_FILE` and `VALIDATION_ERROR` to 400,
`UPLOAD_NOT_FOUND` and `ROUTE_NOT_FOUND` to 404, `FILE_TOO_LARGE` to 413, and any other code, including
`STORAGE_FAILURE` and `UPLOAD_PERSISTENCE_FAILURE`, to 500.

#### Scenario: Mapping table
- **WHEN** each code is passed to the mapping
- **THEN** it returns the status above

### Requirement: Server errors do not leak internals
The system SHALL answer 5xx with code `INTERNAL_ERROR`, the fixed message `Internal server error` and the
request id, and SHALL log the real cause with that id. Messages of 4xx errors keep their specific text.

#### Scenario: Unexpected exception
- **WHEN** a handler throws an error whose message contains a database host name
- **THEN** the answer is 500 with the fixed message and the host name appears only in the log

#### Scenario: Storage failure
- **WHEN** the use case returns `StorageFailureError`
- **THEN** the answer is 500 with the fixed message, not the storage reason

### Requirement: Framework errors use the envelope
The system SHALL convert schema validation errors to 400 `VALIDATION_ERROR` naming the field, and unknown
routes to 404 `ROUTE_NOT_FOUND`.

#### Scenario: Bad parameter
- **WHEN** `limit=abc` is requested
- **THEN** the answer is 400 with code `VALIDATION_ERROR` or `INVALID_PAGINATION` in the envelope

#### Scenario: Unknown route
- **WHEN** `GET /api/v1/nope` is requested
- **THEN** the answer is 404 with code `ROUTE_NOT_FOUND`

### Requirement: Oversized uploads are detected while streaming
The system SHALL count the bytes of the upload while it is read, stop at the limit, and answer 413 even though the
storage reports its own failure.

#### Scenario: Limit crossed during storage
- **WHEN** the stream passes the limit while being saved
- **THEN** the storage cleans its partial file and the answer is 413, not 500
