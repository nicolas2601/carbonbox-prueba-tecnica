## ADDED Requirements

### Requirement: Upload guidance and recent activity
The upload page SHALL present a compact file chooser alongside clear requirements and the three most recent uploads on desktop, and stack these sections on narrow screens.

#### Scenario: Desktop upload guidance
- **WHEN** the upload page is shown at a desktop viewport
- **THEN** the chooser is compact and the adjacent guidance lists required columns, value rules, configured size limit and downloadable sample CSV

#### Scenario: Recent uploads
- **WHEN** recent uploads are available
- **THEN** the page shows at most three files with current status and a detail link for each

### Requirement: Selected file and transfer state
The upload page SHALL show a compact selected-file row, real transfer progress, and the existing cancel action while bytes are being uploaded, without changing validation or cancellation semantics.

#### Scenario: File selected
- **WHEN** a valid CSV is selected
- **THEN** its name and human-readable size appear in a compact row and the chooser does not retain its empty-state height

#### Scenario: Transfer is active
- **WHEN** file bytes are being transferred
- **THEN** actual upload progress and Cancel upload action are shown; after transfer succeeds the user is taken to the existing processing detail page

### Requirement: Sidebar upload statistics
The sidebar SHALL display a 96px completion ring and four labelled values using only upload statistics returned by the API, while preserving API readiness status.

#### Scenario: Base statistics
- **WHEN** total, completed, in-progress, and failed counts are available
- **THEN** the sidebar shows the completion share and all four counts without deriving them from paginated upload rows

#### Scenario: Aggregate row counts are optional
- **WHEN** the API provides processedRows and/or rejectedRows
- **THEN** the sidebar shows each available global row total as a compact value and omits unavailable totals
