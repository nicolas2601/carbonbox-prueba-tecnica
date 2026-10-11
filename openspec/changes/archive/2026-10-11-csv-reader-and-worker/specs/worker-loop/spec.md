## ADDED Requirements

### Requirement: One iteration processes at most one job
The system SHALL provide `Worker.runOnce()` that claims a job with the configured lease, runs the
`ProcessFile` handler and returns whether a job was claimed. A stale result from the handler SHALL be
logged as a warning and SHALL NOT be retried or failed.

#### Scenario: Nothing to do
- **WHEN** the queue has no claimable job
- **THEN** `runOnce` returns false and the handler is not called

#### Scenario: A job is processed
- **WHEN** a queued job exists
- **THEN** `runOnce` returns true and the upload ends in its final state

#### Scenario: Stale claim
- **WHEN** the handler returns a left `StaleClaimError`
- **THEN** one warning is logged and the job is not failed by this worker

### Requirement: Failures follow the retry policy
The system SHALL call `queue.fail` when the handler throws. The call SHALL be permanent when the
error is a `MalformedCsvError`, with the error message as the reason. Other errors SHALL be
transient. A failure of `queue.fail` itself SHALL be logged and SHALL NOT stop the worker.

#### Scenario: Transient failure
- **WHEN** the handler throws an unexpected error on the first attempt
- **THEN** the job returns to the queue with a delay and the upload is not marked failed

#### Scenario: Attempts exhausted
- **WHEN** the job fails on its last attempt
- **THEN** the upload is `FAILED` with the reason and the job is `DEAD`

#### Scenario: Malformed file
- **WHEN** the file has an unclosed quote
- **THEN** the job is `DEAD` after one attempt and the upload is `FAILED` with a message about the format

#### Scenario: The queue is unreachable while failing
- **WHEN** `queue.fail` throws
- **THEN** the error is logged and `runOnce` returns normally

### Requirement: The loop polls and stops gracefully
The system SHALL provide `Worker.run(signal)` that repeats `runOnce`, asks again at once after a
processed job, waits the poll interval after an idle iteration, and returns after finishing the job
in progress once the signal is aborted. The wait SHALL end early on abort.

#### Scenario: Idle waiting
- **WHEN** the queue is empty
- **THEN** the loop waits the poll interval between iterations

#### Scenario: Shutdown during a wait
- **WHEN** the signal is aborted while waiting
- **THEN** `run` returns promptly

#### Scenario: Shutdown during a job
- **WHEN** the signal is aborted while a job is processed
- **THEN** the job finishes and `run` returns afterwards

### Requirement: The process is wired and started from one entry point
The system SHALL provide a composition root that builds the real adapters from the settings and
an entry point `src/workers/FileProcessingWorker.ts` started by `bun run worker`. It SHALL abort
the signal on SIGINT and SIGTERM and exit with code 0 after a clean stop.

#### Scenario: Start and stop
- **WHEN** the worker process is started and then sent SIGTERM
- **THEN** it exits with code 0

### Requirement: The whole path works with the real adapters
The system SHALL pass these end to end checks using the database, real files and the sample files.

#### Scenario: Valid sample
- **WHEN** `sample-data.csv` is uploaded and the worker runs
- **THEN** the upload is `COMPLETED` with total 60, processed 60, failed 0 and 60 stored rows

#### Scenario: Sample with invalid rows
- **WHEN** `sample-invalid.csv` is uploaded and the worker runs
- **THEN** the upload is `COMPLETED` with total 25, processed 15, failed 10 and a message listing the lines

#### Scenario: Large sample
- **WHEN** `sample-large.csv` is uploaded with a batch size of 500
- **THEN** the upload is `COMPLETED` with 5000 rows stored and the progress counters only ever increase

#### Scenario: Wrong header
- **WHEN** a file without the `unit` column is uploaded
- **THEN** the upload is `FAILED` naming `unit` and the job is `DONE` with no retries

#### Scenario: Worker dies mid file
- **WHEN** a worker claims a job, stores some batches and stops, and a later worker runs after the lease expired
- **THEN** the second worker completes the upload with the correct rows, none duplicated, and the first worker's later write is rejected

#### Scenario: Two workers, two uploads
- **WHEN** two uploads are queued and two workers run at the same time
- **THEN** both uploads complete and each was processed by exactly one worker

### Requirement: Rejected rows use bounded memory
The system SHALL keep the number of rejected rows and only the first details while processing.

#### Scenario: Many rejected rows
- **WHEN** a file with more rejected rows than the limit is processed
- **THEN** the upload's failed count is the real total and the message lists only the first details
