# api-docs Specification

## Purpose
TBD - created by archiving change http-api. Update Purpose after archive.
## Requirements
### Requirement: The contract is generated from the routes
The system SHALL serve the OpenAPI 3 document at `GET /docs/json` and a browsable page at `/docs`,
generated from the route schemas, with a title, a version and a tag for the uploads endpoints.

#### Scenario: All paths documented
- **WHEN** the document is fetched
- **THEN** it lists the five paths under `/api/v1` with their methods

#### Scenario: Responses are described
- **WHEN** the document is read
- **THEN** each operation describes its success response and the error envelope for its error statuses

#### Scenario: Upload body described
- **WHEN** the operation `POST /api/v1/uploads` is read
- **THEN** it declares a `multipart/form-data` body with a binary `file` field

#### Scenario: The page loads
- **WHEN** `/docs` is requested
- **THEN** the answer is 200 with HTML

