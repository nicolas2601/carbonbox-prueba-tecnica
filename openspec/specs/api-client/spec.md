# api-client Specification

## Purpose
Give the front end one typed, single place to call the API and report failures.
## Requirements
### Requirement: Typed functions over one Axios instance
The system SHALL provide an Axios instance whose base URL comes from `NEXT_PUBLIC_API_URL`, and typed functions `getStats`,
`listUploads`, `getUpload`, `getUploadResults` and `createUpload`, with response types matching the API contract.

#### Scenario: List request
- **WHEN** `listUploads(2, 10)` is called
- **THEN** it requests `GET /uploads?page=2&limit=10` and returns the typed page

#### Scenario: Upload request
- **WHEN** `createUpload(file, onProgress)` is called
- **THEN** it posts multipart form data with the field `file` and reports progress as a number from 0 to 100

### Requirement: Failures become one error type
The system SHALL convert every failed request into `ApiError` with `code`, `message`, `status` and `requestId`, reading the backend
envelope when present and using `NETWORK_ERROR` when the server did not answer.

#### Scenario: Envelope
- **WHEN** the API answers 404 with `{ error: { code: "UPLOAD_NOT_FOUND", message: "..." } }`
- **THEN** the thrown error has that code, message and status 404

#### Scenario: No response
- **WHEN** the server is unreachable
- **THEN** the thrown error has code `NETWORK_ERROR` and a readable message

### Requirement: Query keys come from a factory
The system SHALL expose `uploadKeys` with `all`, `list`, `detail`, `results` and `stats`, and every hook SHALL use it.

#### Scenario: Keys are stable
- **WHEN** `uploadKeys.list(1, 10)` is built twice
- **THEN** both are deeply equal

### Requirement: Polling follows the status
The system SHALL poll an upload every 3000 ms while its status is PENDING or PROCESSING and SHALL stop when it is COMPLETED or FAILED. The
dashboard totals SHALL poll every 5000 ms only while `inProgress` is greater than zero.

#### Scenario: Interval function
- **WHEN** the interval function receives each of the four statuses
- **THEN** it returns 3000 for PENDING and PROCESSING and false for COMPLETED and FAILED

#### Scenario: Polling stops
- **WHEN** the detail hook receives PROCESSING and then COMPLETED
- **THEN** it requests again after 3000 ms and makes no further request after COMPLETED

### Requirement: Provider
The system SHALL provide a client component that supplies one `QueryClient` per browser session with no retry on 4xx errors.

#### Scenario: No retry on client errors
- **WHEN** a query fails with status 404
- **THEN** it is not retried

