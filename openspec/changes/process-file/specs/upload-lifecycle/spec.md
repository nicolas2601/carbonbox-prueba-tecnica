## MODIFIED Requirements

### Requirement: An upload can fail with a reason
The system SHALL allow `fail(reason, now, counters?)` from `PENDING` or `PROCESSING`, storing
the reason as the error message. When final counters are supplied, they SHALL be non-negative
safe integers and processedRows plus failedRows SHALL equal totalRows. Invalid counters SHALL
return InvalidProgressError and leave the upload unchanged. Without counters, existing counter
values SHALL remain unchanged.

#### Scenario: Failing a processing upload
- **WHEN** `fail("The header is missing", now)` is called while processing
- **THEN** the status is `FAILED` and `errorMessage` is `The header is missing`

#### Scenario: Failing with known rejected-row totals
- **WHEN** `fail` receives totalRows 10, processedRows 0 and failedRows 10
- **THEN** the upload is FAILED with those counters and the supplied reason

#### Scenario: Invalid failure counters leave the aggregate untouched
- **WHEN** `fail` receives negative, fractional, non-finite or inconsistent final counters
- **THEN** it returns InvalidProgressError and status, counters, message and timestamps are unchanged

## ADDED Requirements

### Requirement: A completed upload may carry a summary
The system SHALL let `Upload.complete(counters, now, summary?)` store the summary as
`errorMessage`, keeping `errorMessage` null when no summary is given.

#### Scenario: Completing with a summary
- **WHEN** complete is called with consistent counters and a summary text
- **THEN** the status is COMPLETED and errorMessage equals the summary
