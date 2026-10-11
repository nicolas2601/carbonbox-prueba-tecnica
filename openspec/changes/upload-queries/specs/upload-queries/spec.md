## ADDED Requirements

### Requirement: Fetch one upload
The system SHALL provide `GetUploadById` returning `Either<UploadNotFoundError, UploadView>` where the
view has id, file name, status, total rows, processed rows, failed rows, error message, created at and
updated at.

#### Scenario: Existing upload
- **WHEN** an upload exists and its id is requested
- **THEN** the result is a right with the stored fields

#### Scenario: Unknown id
- **WHEN** an id that does not exist is requested
- **THEN** the result is a left `UploadNotFoundError`

### Requirement: List uploads with validated pagination
The system SHALL provide `ListUploads` taking `page` and `limit` and returning
`Either<InvalidPaginationError, Page<UploadView>>` with the items, the total count, the page and the
limit. Defaults SHALL be page 1 and limit 10. Items SHALL be ordered by creation time descending, then id.
A page below 1, a limit below 1 or above 100, or a non integer SHALL return a left.

#### Scenario: Default page
- **WHEN** 15 uploads exist and no pagination is given
- **THEN** 10 items are returned with total 15, page 1 and limit 10, newest first

#### Scenario: Second page
- **WHEN** page 2 with limit 10 is requested over 15 uploads
- **THEN** 5 items are returned and none repeats an item of page 1

#### Scenario: Out of range
- **WHEN** limit is 0, 101 or 1.5, or page is 0
- **THEN** each result is a left `InvalidPaginationError`

#### Scenario: Empty
- **WHEN** no uploads exist
- **THEN** the items are empty and the total is 0

### Requirement: Fetch the processed rows of an upload
The system SHALL provide `GetUploadResults` taking an upload id, `page` and `limit` with the same
pagination rules, returning `Either<UploadNotFoundError | InvalidPaginationError, Page<ResultRow>>`
where a row has category, amount, unit and date. Rows SHALL be ordered by date, then id.

#### Scenario: Rows of an upload
- **WHEN** an upload has 3 stored rows and page 1 is requested
- **THEN** the 3 rows are returned ordered by date with total 3

#### Scenario: Only that upload's rows
- **WHEN** two uploads have rows
- **THEN** each result contains only its own rows

#### Scenario: Existing upload without rows
- **WHEN** the upload exists but has no rows yet
- **THEN** the result is a right with empty items and total 0

#### Scenario: Missing upload
- **WHEN** the upload id does not exist
- **THEN** the result is a left `UploadNotFoundError`

### Requirement: Dashboard totals
The system SHALL provide `GetUploadStats` returning `total`, `completed`, `inProgress` (pending plus
processing) and `failed`.

#### Scenario: Mixed states
- **WHEN** there are 2 pending, 1 processing, 3 completed and 1 failed uploads
- **THEN** the result is total 7, completed 3, inProgress 3, failed 1

#### Scenario: Empty database
- **WHEN** no uploads exist
- **THEN** all four values are 0

### Requirement: Application errors have stable codes
The system SHALL define `UploadNotFoundError` with code `UPLOAD_NOT_FOUND` and `InvalidPaginationError`
with code `INVALID_PAGINATION`, both extending `DomainError`.

#### Scenario: Codes
- **WHEN** each error is created
- **THEN** its code is the one above
