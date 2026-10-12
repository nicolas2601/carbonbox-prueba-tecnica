## ADDED Requirements

### Requirement: Upload information and navigation
The system SHALL render at `/uploads/<id>` the file name, status badge, upload date and id, and a button to go back to the list.

#### Scenario: Header
- **WHEN** an existing upload is opened
- **THEN** its name, badge, formatted date and id are visible and the back button leads to `/uploads`

### Requirement: Live status with polling
The system SHALL poll the upload every 3000 ms while it is PENDING or PROCESSING, update the page on each answer, and stop polling when it
reaches COMPLETED or FAILED.

#### Scenario: Transition
- **WHEN** the upload changes from PROCESSING to COMPLETED between two polls
- **THEN** the page shows the finished state and no further requests are made

#### Scenario: Announcement
- **WHEN** the status changes
- **THEN** a polite live region announces the new state once

### Requirement: Waiting and working panels
The system SHALL show, for PENDING, a message that the file waits for a worker with an indeterminate bar, and for PROCESSING an indeterminate
bar with the number of rows handled so far (processed plus rejected), formatted with thousands separators.

#### Scenario: Counter
- **WHEN** a PROCESSING upload has processed 1500 and rejected 12 rows
- **THEN** the page shows 1,512 rows handled

#### Scenario: No invented percentage
- **WHEN** the upload is PROCESSING
- **THEN** the progress bar has no numeric value

### Requirement: Finished panel with results
The system SHALL show, for COMPLETED, the total, processed and rejected counts and a table of processed rows with the columns category, amount, unit
and date, 25 rows per page, page in `?page=`, amounts right aligned with tabular figures, and the previous page kept visible while the next loads.

#### Scenario: First page
- **WHEN** a completed upload has 60 rows
- **THEN** 25 rows are shown with "Page 1 of 3"

#### Scenario: Change page
- **WHEN** the user goes to the next page
- **THEN** the URL has `?page=2` and rows 26 to 50 appear

#### Scenario: Rejected rows notice
- **WHEN** a completed upload has 10 rejected rows
- **THEN** a notice shows the count, lists the lines from the summary message and says the valid rows were kept

#### Scenario: No rejected rows
- **WHEN** a completed upload has none
- **THEN** no notice is shown

### Requirement: Failed panel
The system SHALL show, for FAILED, a clear panel with the reason from the server and an action to upload another file, and no results table.

#### Scenario: Wrong header
- **WHEN** the upload failed because a column is missing
- **THEN** the panel shows that reason and a link to `/uploads/new`

### Requirement: Not found and errors
The system SHALL show a dedicated message with a link to the list when the upload does not exist, and the error state with retry for other failures.

#### Scenario: Unknown id
- **WHEN** the API answers 404 `UPLOAD_NOT_FOUND`
- **THEN** the not found message is shown and polling does not start

#### Scenario: Server error
- **WHEN** the request fails with a network error
- **THEN** the error state with retry is shown

### Requirement: Accessible and reduced motion
The system SHALL keep focus order logical, expose the table with column headers, mark the working bar as a progress bar without a value, and disable
the crossfade and sliding when reduced motion is preferred.

#### Scenario: Reduced motion
- **WHEN** the user prefers reduced motion
- **THEN** the panel changes without animation
