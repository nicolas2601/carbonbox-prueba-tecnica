# container-stack Specification

## Purpose
Run the whole system from containers with one command and documented configuration.
## Requirements
### Requirement: Images are multi stage, non root and self checking
The system SHALL provide multi stage Dockerfiles for the API, the worker and the frontend that run as a non root user, include runtime bundles/dependencies and define a health check. The worker check SHALL establish process liveness only; actual progress is observed through queue metrics and outcome logs.

#### Scenario: Non root
- **WHEN** a container of each image is started
- **THEN** the process runs with a non root user id

#### Scenario: Health check
- **WHEN** the API and frontend containers have started
- **THEN** their health checks report healthy

### Requirement: One command starts everything
The system SHALL provide `docker compose up --build` that starts PostgreSQL, applies the migrations once, and starts the API, the worker and the frontend, each with a restart policy, waiting for the database to be healthy.

#### Scenario: Clean source startup and HTTP smoke
- **WHEN** the command builds and starts an owned project from clean source without local dependencies or environment files
- **THEN** the frontend answers on its port, the API reports ready and an HTTP multipart upload of `sample-data.csv` completes

#### Scenario: Worker restart
- **WHEN** the owned worker process crashes during processing without an operator stopping its container
- **THEN** it restarts and the upload still completes without duplicate rows

#### Scenario: Database down
- **WHEN** PostgreSQL is stopped and started again
- **THEN** the API readiness returns 503 and then 200 without restarting the API

### Requirement: Configuration is documented and validated
The system SHALL document supported container/process configuration in the environment examples, keep PostgreSQL internal by default and avoid publishing the private metrics port. Unsupported storage drivers, invalid rate quotas and invalid metrics ports SHALL fail configuration validation.

#### Scenario: Invalid supported setting
- **WHEN** a rate quota is nonpositive or a metrics port is outside the TCP range
- **THEN** validation refuses the configuration before the service starts

#### Scenario: Private ports
- **WHEN** default Compose port bindings are inspected
- **THEN** PostgreSQL and metrics are not published, and optional database tooling uses a separate loopback-only overlay

