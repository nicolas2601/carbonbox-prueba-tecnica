## ADDED Requirements

### Requirement: Live processing is informative without invented progress
The PROCESSING detail panel SHALL show actual handled rows, approximate rows per second computed between client-observed polls and elapsed time since createdAt. It SHALL identify approximation and unknown total, reset the rate on counter regression and omit rate until two valid samples exist. It SHALL NOT display unexposed Reading/Validating/Saving phases or a fabricated percentage.

#### Scenario: Observed rate
- **WHEN** two polls observe 100 and 400 handled rows three seconds apart
- **THEN** the panel can show an approximate observed rate of 100 rows per second

#### Scenario: First sample or replay
- **WHEN** only one sample exists or the counter decreases after a retry
- **THEN** no positive rate is invented and observation starts again

#### Scenario: Unknown total
- **WHEN** the upload is PROCESSING without a known final total
- **THEN** the readout reports handled rows and actual public state without a numeric progress value or decorative filled bar
