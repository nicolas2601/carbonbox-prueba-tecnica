# http-routes Specification

## Purpose
Expose the upload, list, detail, results and stats routes.
## Requirements
### Requirement: Upload a file
The system SHALL expose `POST /api/v1/uploads` accepting `multipart/form-data` with one file in the
field `file`, run `CreateUpload` with the fixed user `anonymous`, and answer 201 with
`{ id, status, fileName, createdAt }` where status is `PENDING`.

#### Scenario: A valid CSV
- **WHEN** `sample-data.csv` is posted
- **THEN** the answer is 201 with status `PENDING`, the file name and an id, and one upload row and one job exist

#### Scenario: The created resource has a Location header
- **WHEN** a file is successfully posted
- **THEN** the 201 response includes Location /api/v1/uploads/<id>, declared in OpenAPI

#### Scenario: No file
- **WHEN** the request is multipart without a `file` part
- **THEN** the answer is 400 with code `MISSING_FILE`

#### Scenario: Not multipart
- **WHEN** the request body is JSON
- **THEN** the answer is 415 or 400 with an error envelope and nothing is stored

#### Scenario: Wrong extension
- **WHEN** a file named `report.txt` is posted
- **THEN** the answer is 400 with code `INVALID_FILE_NAME` and nothing is stored

#### Scenario: Path in the name
- **WHEN** a file named `../x.csv` is posted
- **THEN** the answer is 400 with code `INVALID_FILE_NAME`

#### Scenario: Too large
- **WHEN** the file is larger than the configured limit
- **THEN** the answer is 413 with code `FILE_TOO_LARGE`, no upload row, no job and no file in the storage directory

#### Scenario: Exactly at the limit
- **WHEN** the file size equals the limit
- **THEN** the answer is 201

### Requirement: Dashboard totals
The system SHALL expose `GET /api/v1/uploads/stats` answering 200 with `{ total, completed, inProgress, failed }`.

#### Scenario: Totals
- **WHEN** uploads in several states exist
- **THEN** the answer matches the stored states and `stats` is not taken as an upload id

### Requirement: Get one upload
The system SHALL expose `GET /api/v1/uploads/:id` answering 200 with id, file name, status, total rows,
processed rows, failed rows, error message, created at and updated at, or 404 with code `UPLOAD_NOT_FOUND`.

#### Scenario: Existing and unknown
- **WHEN** an existing id and an unknown id are requested
- **THEN** the first answers 200 and the second 404

### Requirement: List uploads
The system SHALL expose `GET /api/v1/uploads?page&limit` answering 200 with `{ data, total, page, limit }`.
Invalid pagination SHALL answer 400 with code `INVALID_PAGINATION`.

#### Scenario: Pages
- **WHEN** 15 uploads exist and page 2 with limit 10 is requested
- **THEN** 5 items are returned with total 15

#### Scenario: Invalid values
- **WHEN** limit is 101, or page is 0, or limit is not a number
- **THEN** the answer is 400 with an error envelope

### Requirement: Get the rows of an upload
The system SHALL expose `GET /api/v1/uploads/:id/results?page&limit` answering 200 with
`{ data: [{ category, amount, unit, date }], total, page, limit }`, or 404 for an unknown upload.

#### Scenario: Rows
- **WHEN** a completed upload with 60 rows is requested with limit 25
- **THEN** page 1 has 25 rows, total is 60 and the amounts are numbers and the dates are `YYYY-MM-DD` text

### Requirement: Readiness and liveness
The system SHALL keep `GET /health` answering 200 and add `GET /health/ready` answering 200 when the
database answers and 503 when it does not.

#### Scenario: Database down
- **WHEN** the database query fails
- **THEN** `/health/ready` answers 503 and `/health` still answers 200

### Requirement: The whole flow works through HTTP
The system SHALL pass this end to end check with the real database and files, and the worker run once.

#### Scenario: Upload, process, read
- **WHEN** `sample-invalid.csv` is posted, the worker runs, and the upload, its rows and the stats are requested
- **THEN** the upload is `COMPLETED` with processed 15 and failed 10, the rows endpoint returns 15 rows and the stats count it

### Requirement: The server process starts and stops cleanly
The system SHALL start the API from `bun run start` and, on SIGINT or SIGTERM, stop accepting
connections, finish requests in progress, close the database client and exit with code 0.

#### Scenario: Start and stop
- **WHEN** the process is started and sent SIGTERM
- **THEN** it exits with code 0

