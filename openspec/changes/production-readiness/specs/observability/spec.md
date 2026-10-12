## ADDED Requirements

### Requirement: Prometheus metrics endpoint
The system SHALL expose `/metrics` in Prometheus text format with request duration by route and status class, request counts, and default process metrics, not listed in the public API documentation and not reachable through the public frontend origin.

#### Scenario: Metrics present
- **WHEN** a few requests are made and `/metrics` is read
- **THEN** it contains the duration histogram labelled by route and status class

### Requirement: Queue depth is visible
The system SHALL expose gauges of jobs by status (queued, done, dead) and the age of the oldest queued job, computed at scrape time with one grouped query.

#### Scenario: Backlog
- **WHEN** three jobs are queued and one is dead
- **THEN** the gauges report queued 3, dead 1 and an oldest age greater than zero

### Requirement: Failures leave a trace
The system SHALL log with the request id every 5xx response and every worker job outcome (processed, retried, dead) with job and upload ids and never log file contents or secrets.

#### Scenario: Job outcome
- **WHEN** a job is retried
- **THEN** one log line records the retry with the attempt number and no file content
