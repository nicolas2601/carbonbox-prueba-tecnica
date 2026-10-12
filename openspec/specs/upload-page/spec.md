# upload-page Specification

## Purpose
TBD - created by archiving change frontend-upload-detail. Update Purpose after archive.
## Requirements
### Requirement: Choose a file by selecting or dropping
The system SHALL render at `/uploads/new` a drop area that is also a labelled file input, usable with keyboard and screen readers,
that accepts one file and shows its name and size once chosen, with a way to remove it.

#### Scenario: Select with the file dialog
- **WHEN** the user chooses `report.csv`
- **THEN** the name and a human readable size are shown and the upload button is enabled

#### Scenario: Drop a file
- **WHEN** a file is dropped on the area
- **THEN** it is selected exactly as if chosen with the dialog, and the area shows a drag state while hovering

#### Scenario: Several files
- **WHEN** more than one file is dropped
- **THEN** an error asks for a single file and nothing is selected

#### Scenario: Remove
- **WHEN** the user removes the selected file
- **THEN** the area returns to its empty state and the upload button is disabled

### Requirement: Early validation
The system SHALL reject, before any request, a file whose extension is not `.csv` (any letter case), an empty file, and a file larger than the
configured limit, each with a specific message announced as an alert.

#### Scenario: Wrong extension
- **WHEN** `notes.txt` is chosen
- **THEN** the message says only .csv files are accepted, the file is not selected and no request is made

#### Scenario: Empty file
- **WHEN** a zero byte `empty.csv` is chosen
- **THEN** the message says the file is empty and no request is made

#### Scenario: Too large
- **WHEN** a file larger than the limit is chosen
- **THEN** the message states the limit in megabytes and no request is made

#### Scenario: Upper case extension
- **WHEN** `DATA.CSV` is chosen
- **THEN** it is accepted

### Requirement: Upload with visible progress
The system SHALL upload the chosen file as multipart form data, disable the controls while sending, and show a progress bar and
percentage from the real byte counter, switching to "Finishing" at 100 percent until the server answers.

#### Scenario: Progress
- **WHEN** the upload is in progress
- **THEN** the progress bar exposes its current value and the controls are disabled

#### Scenario: Redirect
- **WHEN** the server answers 201 with an id
- **THEN** the list and dashboard data are marked stale and the browser goes to `/uploads/<id>`

### Requirement: Cancel an upload in progress
The system SHALL offer a cancel action during incomplete byte transfer that aborts the request and returns to the selected state without an error message. At 100 percent, "Finishing" SHALL disable cancel; no rollback of an already accepted upload is promised.

#### Scenario: Cancel
- **WHEN** the user cancels a throttled upload before all bytes have been sent
- **THEN** the request is aborted, the file stays selected and no upload is created

#### Scenario: Finishing
- **WHEN** the byte counter reaches 100 percent and the server has not answered yet
- **THEN** the label is "Finishing" and cancel is disabled

### Requirement: Server errors keep the user in place
The system SHALL show the server's message for 400, 413, 5xx and network failures, keep the selected file, and allow trying again.

#### Scenario: Server too large
- **WHEN** the server answers 413
- **THEN** a message about the size limit is shown and the file remains selected

#### Scenario: Server unavailable
- **WHEN** the request cannot reach the server
- **THEN** a message says the server could not be reached and retrying is possible

#### Scenario: Unexpected error with request id
- **WHEN** the server answers 500 with a request id
- **THEN** the message includes the request id

