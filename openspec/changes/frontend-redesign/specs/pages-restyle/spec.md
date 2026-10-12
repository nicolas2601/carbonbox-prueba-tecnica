## ADDED Requirements

### Requirement: Uploads list in the new system
The system SHALL show the list as a solid tinted table card with a sticky header, transform-only hover row feedback, badges, right aligned mono numbers, and stacked rows below 640 px, keeping ten rows per page and the page in the URL. Table text SHALL NOT fade on entrance.

#### Scenario: Desktop and mobile
- **WHEN** the list renders at 1280 px and at 360 px
- **THEN** the first shows the five columns and the second shows stacked rows with name, badge and date

### Requirement: Upload page restyle
The system SHALL present the dropzone as a large card with a dashed accent border that becomes solid with a soft glow on drag, a segmented progress bar, and clear error messages, without changing validation, cancel or redirect behaviour.

#### Scenario: Drag state
- **WHEN** a file is dragged over the area
- **THEN** the border becomes solid and the glow appears using opacity only

#### Scenario: Behaviour unchanged
- **WHEN** the existing upload page tests run
- **THEN** their validation, cancellation, redirect and error intents remain intact; documented markup/locator adjustments do not relax assertions

### Requirement: Detail page restyle
The system SHALL show the detail page with a header card (name, status, date, id), a state panel per status with the processing state drawn as breathing rings and the row counter, summary figures for completed uploads, the rejected rows notice, and the results table in the same table style.

#### Scenario: Processing
- **WHEN** an upload is processing
- **THEN** the panel shows the rings and the live counter, and under reduced motion the rings are static

#### Scenario: Completed
- **WHEN** an upload is completed with rejected rows
- **THEN** the summary shows total, processed and rejected figures and the notice lists the lines

#### Scenario: Failed
- **WHEN** an upload failed
- **THEN** the panel shows the reason and a link to upload another file, with no results table

### Requirement: Visual evidence is produced
The system SHALL regenerate the README screenshots of dashboard, list, upload and detail (completed and failed) at 1280 and 360 px with the new design.

#### Scenario: Screenshots
- **WHEN** the screenshot command runs
- **THEN** the image files exist for each page and width
