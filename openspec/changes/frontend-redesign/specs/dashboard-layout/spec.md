## ADDED Requirements

### Requirement: Application shell
The system SHALL render a solid tinted sidebar of 248 px with the brand, navigation (Dashboard, Uploads, Upload a file) with the current page marked, and a live completion gauge, and SHALL turn it into a top bar below 1024 px.

#### Scenario: Navigation
- **WHEN** any page renders at 1280 px
- **THEN** the sidebar shows three links and marks the current one

#### Scenario: Narrow screens
- **WHEN** the viewport is 360 px wide
- **THEN** the sidebar is replaced by a top bar with the same links and the page has no horizontal scroll

### Requirement: Bento dashboard with a graphite rail
The system SHALL render the dashboard with the activity chart, the completion donut, the status bars, the latest upload card and the recent uploads table in the content area, and a graphite rail with the single large radial gauge, four compact contextual counts and the API status, and a primary action to upload a file. From 1280 px the rail is a column; between 1024 and 1279 px it is a band under the header; below 1024 px everything is one column.

#### Scenario: Sections
- **WHEN** the dashboard has data
- **THEN** the activity chart, donut, bars, latest upload, table and the rail with gauge and four KPIs are present with their labels

#### Scenario: Single column on mobile
- **WHEN** the viewport is 360 px wide
- **THEN** the areas stack in one column in reading order

### Requirement: The donut and bars match the totals
The system SHALL compute the completed share as completed divided by total (zero when there are no uploads), show it as a rounded percentage in the donut, and show counts for completed, in progress and failed in the bars.

#### Scenario: Values
- **WHEN** the totals are 12 total, 9 completed, 2 in progress and 1 failed
- **THEN** the donut shows 75 percent and the bars show 9, 2 and 1

#### Scenario: Empty
- **WHEN** the total is zero
- **THEN** the donut shows 0 percent without errors and the page invites the user to upload the first file

### Requirement: The activity chart plots real uploads
The system SHALL plot, for the latest 12 uploads in chronological order, the rows handled (processed plus rejected) as a Recharts area chart with date labels, and the card SHALL state "Rows in the last 12 uploads". A visually hidden table SHALL expose the same values.
With exactly one upload, the system SHALL render one bar instead of an area. The plot SHALL NOT include a decorative landscape that can be mistaken for data, and date labels SHALL remain below the plotting area.

#### Scenario: Points
- **WHEN** 7 uploads exist
- **THEN** the chart has 7 points and the hidden table has 7 rows

#### Scenario: Uploads without counters
- **WHEN** an upload has no counters yet
- **THEN** it is plotted as zero rows and labelled as in progress or waiting

#### Scenario: No uploads
- **WHEN** there are no uploads
- **THEN** the chart shows an empty state with a link to upload

### Requirement: Loading and error states
The system SHALL show skeletons shaped like each card while loading, and an error card with retry and request id when a request fails, without hiding the other cards that loaded.

#### Scenario: Partial failure
- **WHEN** the list request fails and the totals request succeeds
- **THEN** the totals cards show data and the chart and table show the error state
