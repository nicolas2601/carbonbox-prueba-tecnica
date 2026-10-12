## ADDED Requirements

### Requirement: A runbook for operators
The system SHALL provide `docs/operations.md` with how to start and stop, every environment variable, the health and metrics endpoints, the failure modes (database down, worker dead, disk or bucket full, stuck job) with the symptom, the check and the fix, backup and restore of the database, and how to scale workers.

#### Scenario: Failure table
- **WHEN** the runbook is read
- **THEN** each listed failure mode has a symptom, a command to check it and a remedy

### Requirement: Dead jobs can be requeued
The system SHALL provide a command `bun run job:requeue <uploadId>` that moves a dead job back to queued with attempts reset and the upload back to pending, refusing to act on jobs that are not dead.

#### Scenario: Requeue
- **WHEN** a dead job is requeued
- **THEN** the job is queued with zero attempts and the worker processes it to completion

#### Scenario: Not dead
- **WHEN** the command is run for a job that is queued or done
- **THEN** it refuses with a clear message and changes nothing

### Requirement: Queue migration path is documented
The system SHALL document in the README why PostgreSQL is the queue today and the steps to move to SQS (outbox table, relay, consumers, dead letter queue) with the risks.

#### Scenario: Section exists
- **WHEN** the README is read
- **THEN** the section explains the transactional guarantee and the migration path
