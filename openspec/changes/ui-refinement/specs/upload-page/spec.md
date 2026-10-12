## MODIFIED Requirements

### Requirement: Upload with visible progress
The system SHALL upload the chosen file as multipart data and show a compact file row with filename, size and actual transfer progress. Controls SHALL prevent conflicting edits during sending; cancel SHALL remain available only before Finishing. On acceptance, list/dashboard queries SHALL be invalidated and the page SHALL show the accepted upload's actual server-backed status with a detail link, without requiring automatic redirect.

#### Scenario: Transfer row
- **WHEN** byte transfer is in progress
- **THEN** the file row exposes its name, size and progress value and cancel can abort incomplete transfer

#### Scenario: Accepted upload
- **WHEN** the API returns 201
- **THEN** an accepted-file panel remains available, follows real status and links to /uploads/<id>
