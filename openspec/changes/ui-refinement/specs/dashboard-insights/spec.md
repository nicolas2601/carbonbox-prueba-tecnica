## ADDED Requirements

### Requirement: Diagnostics disclose their sample and limits
The dashboard SHALL show observed row quality for the latest twelve uploads and approximate terminal elapsed time from updatedAt minus createdAt. Labels SHALL identify the cohort and that elapsed time includes queue time. Unknown/invalid data SHALL NOT become invented zero metrics.

#### Scenario: Mixed rows
- **WHEN** the observed cohort contains 15 processed and 10 rejected rows
- **THEN** the rejection share is 40 percent and the underlying counts are exposed accessibly

#### Scenario: No observations
- **WHEN** no row counters or valid terminal duration exists
- **THEN** the respective view shows an explanatory empty state instead of a misleading zero ratio/duration
