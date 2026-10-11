# uploads-list-page Specification

## Purpose
TBD - created by archiving change frontend-foundation. Update Purpose after archive.
## Requirements
### Requirement: Table of uploads
The system SHALL render at `/uploads` a table with the columns file name, status, upload date, processed rows and actions, ten uploads per page,
each row linking to the detail page.

#### Scenario: Columns and rows
- **WHEN** the API returns three uploads
- **THEN** three rows are shown with the five columns and a link to `/uploads/<id>`

#### Scenario: Badges
- **WHEN** uploads in each of the four statuses are returned
- **THEN** each row shows its badge

#### Scenario: Processed rows
- **WHEN** an upload has no counters yet
- **THEN** the cell shows a dash, and otherwise the processed number with thousands separators

### Requirement: The page lives in the URL
The system SHALL read the page from `?page=` (default 1), request that page with limit 10, and change the URL when the user changes page.

#### Scenario: Next page
- **WHEN** the user activates next
- **THEN** the URL becomes `?page=2` and the second page is requested

#### Scenario: Invalid page in the URL
- **WHEN** the URL has `?page=abc`
- **THEN** the page falls back to 1

#### Scenario: Previous data stays visible
- **WHEN** the next page is loading
- **THEN** the current rows stay visible until the new ones arrive

### Requirement: States and navigation
The system SHALL show skeleton rows while loading, an empty state with a link to upload when there are no uploads, the error state with retry on failure, and a primary action to upload a file.

#### Scenario: Empty
- **WHEN** the API returns no uploads
- **THEN** the empty state with a link to `/uploads/new` is shown

#### Scenario: Error
- **WHEN** the request fails
- **THEN** the error state is shown and retry requests again

### Requirement: Readable on small screens
The system SHALL keep the table inside a horizontally scrollable region on narrow screens without breaking the page.

#### Scenario: Narrow viewport
- **WHEN** the viewport is 360 px wide
- **THEN** the document has no horizontal scroll and the table region scrolls

