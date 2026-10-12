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
The system SHALL add an additive migration with a composite index on the upload, date and id columns of the activity rows, and the query plan for the results page SHALL use it without a separate sort.

#### Scenario: Plan
- **WHEN** the plan of the results query is inspected
- **THEN** it uses the composite index and has no sort node

#### Scenario: Migration is additive
- **WHEN** the migrations are applied on a database with existing data
- **THEN** no data is changed and the index exists

### Requirement: Responses are compressed
The system SHALL compress JSON responses above a small threshold when the client accepts it.

#### Scenario: Gzip
- **WHEN** the results page is requested with `Accept-Encoding: gzip`
- **THEN** the response is compressed and decodes to the same body

### Requirement: Caching never hides state
The system SHALL send `Cache-Control: no-store` on status and upload detail responses, and allow short private revalidated caching only on responses where staleness is harmless.

#### Scenario: Status is never cached
- **WHEN** an upload detail or the totals are requested
- **THEN** the response forbids storing

### Requirement: Connections and workload are sized on purpose
The system SHALL document and test the database pool size for the API and the worker, and the worker batch size, with the measured throughput of the 5000 row sample.

#### Scenario: Throughput recorded
- **WHEN** the 5000 row sample is processed
- **THEN** the elapsed time and rows per second are recorded for the chosen batch size and for two alternatives
