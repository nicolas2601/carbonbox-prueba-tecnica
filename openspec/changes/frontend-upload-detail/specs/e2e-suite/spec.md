## ADDED Requirements

### Requirement: The suite owns a fresh stack
The system SHALL provide `bun run e2e` that creates a new database, applies the migrations, starts API, worker and frontend on test ports,
runs the browser tests and stops everything, removing the database and the temporary storage, whether the tests pass or fail.

#### Scenario: Clean start and end
- **WHEN** the suite runs
- **THEN** no development database or storage is touched and no suite-owned process keeps running afterwards

### Requirement: The main journey passes in a real browser
The system SHALL verify that a user can upload `sample-data.csv`, be taken to the detail page, see it complete and read its rows.

#### Scenario: Happy path
- **WHEN** `sample-data.csv` is uploaded through the page
- **THEN** the browser lands on the detail page, the status becomes COMPLETED without a manual reload, and the table shows 25 rows of 60

#### Scenario: Rows with problems
- **WHEN** `sample-invalid.csv` is uploaded
- **THEN** the upload completes with 15 processed and 10 rejected rows and the notice lists the lines

#### Scenario: Wrong header
- **WHEN** a file without the `unit` column is uploaded
- **THEN** the page shows the failed panel naming the missing column

### Requirement: Validation and errors are visible
The system SHALL verify early validation and server limits in the browser.

#### Scenario: Wrong extension
- **WHEN** a `.txt` file is chosen
- **THEN** the message appears and no request reaches the API

#### Scenario: File over the limit
- **WHEN** a file larger than the limit is uploaded
- **THEN** the size message is shown and no upload is created

#### Scenario: Cancel
- **WHEN** a throttled upload is cancelled before its byte transfer is complete
- **THEN** no accepted upload or orphan partial file exists afterwards

### Requirement: Lists and totals follow the data
The system SHALL verify the dashboard totals and the list pagination with several uploads.

#### Scenario: Dashboard
- **WHEN** uploads in different states exist
- **THEN** the four totals match the data and update when a pending upload finishes

#### Scenario: Pagination
- **WHEN** twelve uploads exist
- **THEN** the list shows ten and page two shows two, and the URL reflects the page

#### Scenario: Unknown upload
- **WHEN** `/uploads/does-not-exist` is opened
- **THEN** the not found message is shown

### Requirement: No serious accessibility violations
The system SHALL run axe on the dashboard, the list, the upload page and the detail page in the states completed and failed, and fail on serious or critical violations.

#### Scenario: Axe
- **WHEN** each page is analysed after its finite entrance animations settle
- **THEN** no serious or critical violation is reported

### Requirement: README screenshots are produced by the suite
The system SHALL save curated screenshots at 1280 and 360 pixels of the main pages in normal and reduced motion into `docs/screenshots` as part of a dedicated command. Production capture SHALL wait for fonts, actual figures, lazy charts and finite animations rather than fixed page sleeps.

#### Scenario: Screenshots
- **WHEN** `bun run e2e:screenshots` runs
- **THEN** the image files exist for dashboard, list, upload, detail completed and detail failed
