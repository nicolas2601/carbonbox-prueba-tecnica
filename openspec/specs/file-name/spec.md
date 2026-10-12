# file-name Specification

## Purpose
Accept only valid CSV file names and compare them by value.
## Requirements
### Requirement: FileName accepts only valid CSV file names
The system SHALL provide `FileName.create(raw)` returning `Either<InvalidFileNameError, FileName>`.
A valid name SHALL be non-empty after trimming, at most 255 characters, end with `.csv` ignoring
case, and contain no `/`, `\` or NUL character.

#### Scenario: A plain CSV name is accepted
- **WHEN** `FileName.create("report.csv")` is called
- **THEN** the result is a right whose `value` is `report.csv`

#### Scenario: Surrounding whitespace is trimmed
- **WHEN** `FileName.create("  report.csv  ")` is called
- **THEN** the result is a right whose `value` is `report.csv`

#### Scenario: The extension is case insensitive
- **WHEN** `FileName.create("DATA.CSV")` is called
- **THEN** the result is a right whose `value` is `DATA.CSV`

#### Scenario: An empty name is rejected
- **WHEN** `FileName.create("   ")` is called
- **THEN** the result is a left `InvalidFileNameError`

#### Scenario: Another extension is rejected
- **WHEN** `FileName.create("report.xlsx")` is called
- **THEN** the result is a left `InvalidFileNameError`

#### Scenario: A path is rejected instead of cleaned
- **WHEN** `FileName.create("../secrets.csv")` or `FileName.create("a\\b.csv")` is called
- **THEN** each result is a left `InvalidFileNameError`

#### Scenario: A name over 255 characters is rejected
- **WHEN** `FileName.create` receives 252 characters followed by `.csv`
- **THEN** the result is a left `InvalidFileNameError`

### Requirement: FileName compares by value
The system SHALL consider two `FileName` instances equal when their values are equal.

#### Scenario: Equal values are equal
- **WHEN** two names are created from `a.csv`
- **THEN** `equals` returns true, and false against a name created from `b.csv`

