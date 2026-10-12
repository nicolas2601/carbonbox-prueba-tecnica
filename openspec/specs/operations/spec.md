# operations Specification

## Purpose
Document how to operate the system and how to recover dead jobs.
## Requirements
### Requirement: A runbook for operators
The system SHALL provide `docs/operations.md` with supported health/private metrics checks, DEAD-job recovery, safe deployment/rollback boundaries, the observed worker/database failure drills and explicit unverified/deferred limitations. Environment examples SHALL be identified as public local-demo defaults, not deployment secrets.

#### Scenario: Failure table
- **WHEN** the runbook is read
- **THEN** worker/database outage observations, recovery actions and exact outcomes are distinguished from deferred bucket, backup/restore and scaling exercises

### Requirement: Dead jobs can be requeued
The system SHALL provide a command `bun run job:requeue <uploadId>` that moves a dead job back to queued with attempts reset and the upload back to pending, refusing to act on jobs that are not dead.

#### Scenario: Requeue
- **WHEN** a dead job with a valid stored CSV is requeued after its underlying failure has been corrected
- **THEN** the job is queued with zero attempts and the worker processes it to completion

#### Scenario: Not dead
- **WHEN** the command is run for a job that is queued or done
- **THEN** it refuses with a clear message and changes nothing

### Requirement: Queue migration path is documented
The system SHALL document in the README why PostgreSQL is the queue today and the steps to move to SQS (outbox table, relay, consumers, dead letter queue) with the risks.

#### Scenario: Section exists
- **WHEN** the README is read
- **THEN** the section explains the transactional guarantee and the migration path

