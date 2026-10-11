## ADDED Requirements

### Requirement: Claiming gives one worker one job
The system SHALL provide `PgJobQueue.claim(now, visibilityMs)` returning a `JobClaim` or null.
It SHALL pick the oldest `QUEUED` job whose `availableAt` is not after `now` and whose lease is
absent or expired, set a new random `claimToken`, set `lockedUntil` to `now + visibilityMs`,
increase `attempts` by one and return the job id, the upload id and the token.

#### Scenario: Claiming a queued job
- **WHEN** one queued job exists and `claim` is called
- **THEN** the result has that job's upload id, a token, and the row has attempts 1 and a lease ending at `now + visibilityMs`

#### Scenario: Nothing to claim
- **WHEN** no job is queued, or the only job is not yet available
- **THEN** the result is null

#### Scenario: Two workers never take the same job
- **WHEN** two claims run at the same time and one job exists
- **THEN** exactly one receives the job and the other receives null

#### Scenario: Two jobs, two workers
- **WHEN** two claims run at the same time and two jobs exist
- **THEN** each receives a different job

### Requirement: A leased job is hidden until its lease expires
The system SHALL NOT return a job whose lease has not expired, and SHALL return it again, with a
new token and attempts increased, once `now` is past `lockedUntil`.

#### Scenario: Live lease
- **WHEN** a job was claimed and a second claim runs before the lease ends
- **THEN** the second result is null

#### Scenario: Expired lease
- **WHEN** a second claim runs with a `now` after the lease end
- **THEN** it receives the job with a token different from the first and attempts 2

### Requirement: Failing a job retries with a growing delay
The system SHALL provide `fail(claim, reason, now, permanent)` returning
`Either<StaleClaimError, "RETRY" | "DEAD">`. When the claim is current, not permanent and
`attempts` is below `maxAttempts`, it SHALL set the job to `QUEUED`, clear the lease and token,
store `lastError` and set `availableAt` to `now + retryBaseMs * 2^(attempts - 1)`.

#### Scenario: First failure
- **WHEN** a job with attempts 1 fails with base 1000 ms
- **THEN** the result is `RETRY`, the job is `QUEUED`, `availableAt` is `now` plus 1000 ms and `lastError` holds the reason

#### Scenario: Second failure doubles the delay
- **WHEN** the job is claimed again and fails with attempts 2
- **THEN** `availableAt` is `now` plus 2000 ms

#### Scenario: The retry is not claimable early
- **WHEN** a claim runs before `availableAt`
- **THEN** it returns null

### Requirement: Exhausted or permanent failures kill the job and fail the upload
The system SHALL, in one transaction, set the job to `DEAD` and the upload to `FAILED` with the
reason as `errorMessage` when `permanent` is true or `attempts` has reached `maxAttempts`.

#### Scenario: Attempts exhausted
- **WHEN** a job with `maxAttempts` 3 fails on its third attempt
- **THEN** the result is `DEAD`, the job is `DEAD` and the upload is `FAILED` with the reason

#### Scenario: Permanent failure
- **WHEN** a job fails with `permanent` true on its first attempt
- **THEN** the result is `DEAD` and the upload is `FAILED`

### Requirement: A stale claim cannot fail a job
The system SHALL return a left `StaleClaimError` from `fail` when the token is not the current one
and SHALL change nothing.

#### Scenario: Old token
- **WHEN** a job was reclaimed and the first holder calls `fail`
- **THEN** the result is a left and the job still belongs to the second holder
