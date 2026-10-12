## ADDED Requirements

### Requirement: Images are small, non root and self checking
The system SHALL provide multi stage Dockerfiles for the API, the worker and the frontend that run as a non root user, contain only runtime files and define a health check.

#### Scenario: Non root
- **WHEN** a container of each image is started
- **THEN** the process runs with a non root user id

#### Scenario: Health check
- **WHEN** the API and frontend containers have started
- **THEN** their health checks report healthy

### Requirement: One command starts everything
The system SHALL provide `docker compose up --build` that starts PostgreSQL, applies the migrations once, and starts the API, the worker and the frontend, each with a restart policy, waiting for the database to be healthy.

#### Scenario: Cold start
- **WHEN** the command runs on a clone without any local setup
- **THEN** the frontend answers on its port, the API reports ready and uploading `sample-data.csv` through the interface ends in COMPLETED

#### Scenario: Worker restart
- **WHEN** the worker container is killed during processing
- **THEN** it restarts and the upload still completes without duplicate rows

#### Scenario: Database down
- **WHEN** PostgreSQL is stopped and started again
- **THEN** the API readiness returns 503 and then 200 without restarting the API

### Requirement: Optional object storage profile
The system SHALL provide a compose profile `s3` that adds MinIO with a bucket created at start, and the stack SHALL run with it by setting the storage driver.

#### Scenario: S3 profile
- **WHEN** the stack runs with the `s3` profile and `STORAGE_DRIVER=s3`
- **THEN** an uploaded CSV is stored as an object in the bucket and processed to COMPLETED

### Requirement: Configuration is documented and validated
The system SHALL read all container configuration from environment variables listed in `.env.example`, failing at start with a clear message when a required value is missing or invalid.

#### Scenario: Missing value
- **WHEN** a required variable is absent
- **THEN** the process exits with a message naming the variable
