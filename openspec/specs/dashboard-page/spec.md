# dashboard-page Specification

## Purpose
TBD - created by archiving change frontend-foundation. Update Purpose after archive.
## Requirements
### Requirement: Totals at a glance
The system SHALL render at `/` four stat cards for total, completed, in progress and failed uploads, and a primary link to `/uploads/new`.

#### Scenario: Values
- **WHEN** the API answers total 7, completed 3, inProgress 3, failed 1
- **THEN** the four cards show those figures with their labels

#### Scenario: Create link
- **WHEN** the page renders
- **THEN** there is a link named like "Upload a file" that points to `/uploads/new`

### Requirement: Recent uploads
The system SHALL show the five most recent uploads with name, status badge and date, each linking to its detail page, and a link to the full list.

#### Scenario: Recent
- **WHEN** the API returns uploads
- **THEN** at most five rows are shown, each a link to `/uploads/<id>`

### Requirement: States
The system SHALL show skeletons while loading, an empty state with an action when there are no uploads, and the error state with retry when a request fails.

#### Scenario: Loading
- **WHEN** the requests are pending
- **THEN** skeletons are shown and no figure is shown

#### Scenario: Empty
- **WHEN** the API reports total 0
- **THEN** the page invites the user to upload the first file

#### Scenario: Error
- **WHEN** the stats request fails
- **THEN** the error state shows the message and a retry button, and retry requests again

### Requirement: Totals refresh while work is running
The system SHALL refetch totals every 5000 ms while `inProgress` is above zero and stop when it is zero.

#### Scenario: Refresh
- **WHEN** the first answer has inProgress 2 and the second has 0
- **THEN** a third request is not made

