# csv-error-summary Specification

## Purpose
TBD - created by archiving change csv-validation. Update Purpose after archive.
## Requirements
### Requirement: Rejected rows are summarized in one short message
The system SHALL provide `summarizeRowErrors(errors, limit)` returning a single text. With no
errors it SHALL return null. Otherwise it SHALL state the total count and list at most `limit`
errors as `line N: field - reason`, followed by how many more were omitted.

#### Scenario: No errors
- **WHEN** the list is empty
- **THEN** the result is null

#### Scenario: Few errors are all listed
- **WHEN** two errors are summarized with a limit of 5
- **THEN** the text says 2 rows were rejected and lists both with their line and field

#### Scenario: Many errors are capped
- **WHEN** 12 errors are summarized with a limit of 5
- **THEN** the text says 12 rows were rejected, lists 5 and says 7 more were omitted

