## ADDED Requirements

### Requirement: Diagnostics disclose their sample and limits
The dashboard SHALL show global observed row quality from stats and approximate median terminal elapsed time from the latest twelve uploads' updatedAt minus createdAt. Labels SHALL identify those scopes and that elapsed time includes queue time. Unknown/invalid data SHALL NOT become invented zero metrics.

#### Scenario: Mixed rows
- **WHEN** the global observed counters contain 15 processed and 10 rejected rows
- **THEN** the rejection share is 40 percent and the underlying counts are exposed accessibly

#### Scenario: No observations
- **WHEN** no row counters or valid terminal duration exists
- **THEN** the respective view shows an explanatory empty state instead of a misleading zero ratio/duration

### Requirement: Global row counts come from the complete dataset
The stats endpoint SHALL expose observed processedRows/rejectedRows sums and pending/processing counts across all uploads, preserving existing status totals. The client SHALL tolerate absent new fields without manufacturing global row values from a partial page.

#### Scenario: Beyond the recent page
- **WHEN** older uploads outside the latest twelve contain handled rows
- **THEN** their counters remain included in the stats sums

### Requirement: Dashboard stage follows the reference without fake decoration
The dashboard SHALL use graphite panels over a deeper graphite canvas, AA text/graphic contrast, positive chart padding and readable axis ticks. It SHALL provide the stacked activity chart, completion arc, a largest-upload horizontal bar view and scoped numeric tiles, with orange/teal top actions. It SHALL NOT draw a decorative landscape or change other pages to dark mode.

#### Scenario: Scoped appearance
- **WHEN** the dashboard and uploads page are opened
- **THEN** the dashboard stage is graphite, navigation remains light and the ledger remains light
