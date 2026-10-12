# observability Specification

## Purpose
Expose metrics and queue depth and make failures traceable.
## Requirements
### Requirement: Prometheus metrics endpoint
The system SHALL expose `/metrics` on a separate private listener in Prometheus text format with request duration by route and status class, request counts and default process metrics. The default bind SHALL be `127.0.0.1:9090`, configurable through `METRICS_HOST` and `METRICS_PORT`. The public API and Swagger SHALL have no metrics route, and Compose SHALL NOT publish the metrics port.

#### Scenario: Metrics present
- **WHEN** a few requests are made and `/metrics` is read
- **THEN** it contains the duration histogram labelled by route and status class

### Requirement: Queue depth is visible
The system SHALL expose gauges of jobs by status (queued, done, dead) and the age of the oldest queued job, computed at scrape time with one grouped query.

#### Scenario: Backlog
- **WHEN** three jobs are queued and one is dead
- **THEN** the gauges report queued 3, dead 1 and an oldest age greater than zero

### Requirement: Failures leave a trace
The public API SHALL log every 5xx response with its request id. Worker job outcomes (processed, retried, dead) SHALL include job id, upload id and attempt number, without claiming that HTTP request ids are stored in jobs. Logs SHALL NOT contain file contents, claim tokens or credentials. The private metrics scrape failure uses fixed 503 text and is not part of public request-id correlation.

#### Scenario: Job outcome
- **WHEN** a job is retried
- **THEN** one log line records the retry with the attempt number and no file content

