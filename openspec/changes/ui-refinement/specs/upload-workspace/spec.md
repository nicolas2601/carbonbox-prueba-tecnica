## ADDED Requirements

### Requirement: Intake guidance is usable before transfer
The upload workspace SHALL pair a compact picker with required columns, amount/date rules, the configured size hint, a public sample CSV download and the latest three to five uploads with status/detail links.

#### Scenario: Before upload
- **WHEN** the page is opened without a selected file
- **THEN** selection, preparation guidance, sample download and recent-file context are visible at desktop/mobile widths

#### Scenario: Recent data unavailable
- **WHEN** the recent-list request fails or has no data yet
- **THEN** the page distinguishes error/loading from an actually empty upload history
