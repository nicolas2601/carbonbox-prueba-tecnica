# csv-error-summary Specification

## Purpose
Summarize rejected rows in one short message the user can act on.
## Requirements
### Requirement: Rejected rows are summarized in one short message
The system SHALL provide `summarizeRowErrors(errors, limit, total)` where `total` is the real
number of rejected rows and defaults to the length of `errors`. With a total of zero it SHALL return
null. Otherwise it SHALL state the total, list at most `limit` of the given errors as
`line N: field - reason`, and report how many more were omitted, computed from the total.

#### Scenario: No errors
- **WHEN** the list is empty and the total is omitted
- **THEN** the result is null

#### Scenario: Few errors are all listed
- **WHEN** two errors are summarized with a limit of 5
- **THEN** the text says 2 rows were rejected and lists both with their line and field

#### Scenario: Many errors are capped
- **WHEN** 12 errors are summarized with a limit of 5
- **THEN** the text says 12 rows were rejected, lists 5 and says 7 more were omitted

#### Scenario: Only the first details were kept
- **WHEN** 10 errors are given with a limit of 10 and a total of 5000
- **THEN** the text says 5000 rows were rejected, lists 10 and says 4990 more were omitted

