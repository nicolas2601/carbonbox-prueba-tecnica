## ADDED Requirements

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

### Requirement: The results query has an index that fits it
The system SHALL inspect the real results-query plan and timing on the reference dataset before changing indexes. It SHALL add an additive composite index on upload, date and id only when those measurements justify it, and SHALL compare the plans and timing afterward.

#### Scenario: Plan
- **WHEN** the baseline plan and timings identify a consequential results sort
- **THEN** the before and after plans document whether the composite index removes it and improves the measured query

#### Scenario: Migration is additive
- **WHEN** an evidence-supported index migration is applied on a database with existing data
- **THEN** no data is changed and the index exists

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
