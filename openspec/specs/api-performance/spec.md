# api-performance Specification

## Purpose
Measure API latency under concurrency and set the budget the endpoints must meet.
## Requirements
### Requirement: Latency is measured under concurrency
The system SHALL record latency (p50, p95, p99) and throughput of list, stats, one upload and a results page at 20 concurrent connections against the real database, with and without the improvements.

#### Scenario: Results in the document
- **WHEN** `docs/performance.md` is read
- **THEN** it has a before and after table for each endpoint with the tool, duration and machine

### Requirement: The latency budget is met
The system SHALL keep p95 at or under 50 ms for list, stats and a 25 row results page of a 5000 row upload at 20 concurrent connections on the reference machine.

#### Scenario: Results page of a large upload
- **WHEN** a results page of the 5000 row upload is requested at 20 concurrent connections for 15 seconds
- **THEN** p95 is at or under 50 ms with no errors

### Requirement: Evidence governs results indexes
The system SHALL inspect first/deep results-query plans, HTTP latency and worker throughput on the reference dataset before changing indexes. It SHALL NOT adopt a candidate that fails the agreed 30 percent HTTP p95 improvement gate or shows a write-throughput regression; rejection SHALL be documented without a production migration.

#### Scenario: Plan
- **WHEN** the baseline plan and timings identify a consequential results sort
- **THEN** the before and after plans document whether the composite index removes it and improves the measured query

#### Scenario: Candidate rejected
- **WHEN** the measured candidate improves HTTP p95 only 4.79 percent and observed worker throughput is 10.09 percent lower
- **THEN** the evidence records rejection and no production index migration is added

### Requirement: Responses are compressed
The system SHALL compress JSON responses above a small threshold when the client accepts it.

#### Scenario: Gzip
- **WHEN** the results page is requested with `Accept-Encoding: gzip`
- **THEN** the response is compressed and decodes to the same body

### Requirement: Caching never hides state
The system SHALL send `Cache-Control: no-store` on all upload-data responses, including lists, totals, detail and results. It SHALL NOT introduce max-age or private caching for upload data; immutable hashed assets are the caching exception.

#### Scenario: Status is never cached
- **WHEN** the upload list, detail, totals or results are requested
- **THEN** the response forbids storing

### Requirement: Connections and workload are sized on purpose
The system SHALL document the default database pool sizes for API and worker and the default worker batch size, with the measured throughput of the 5000 row sample in the baseline, candidate and final profiles. Alternate pool/batch matrices are out of scope unless measurements demonstrate a capacity bottleneck.

#### Scenario: Throughput recorded
- **WHEN** the 5000 row sample is processed
- **THEN** elapsed time and rows per second are recorded for the unchanged default batch size 500 and pool defaults 10, including the explicit decision not to tune

