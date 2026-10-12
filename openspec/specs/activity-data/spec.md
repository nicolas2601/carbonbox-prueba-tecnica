# activity-data Specification

## Purpose
Define what makes one CSV row a valid activity record and how it is built.
## Requirements
### Requirement: ActivityData enforces the rules of one CSV row
The system SHALL provide `ActivityData.create(props)` returning
`Either<InvalidActivityDataError, ActivityData>`. `category` and `unit` SHALL be non-empty after
trimming and are stored trimmed, `amount` SHALL be a finite number greater than zero and `date`
SHALL be a valid `Date`. A rejection SHALL name the offending `field`.

#### Scenario: A valid row is accepted
- **WHEN** `create` receives category `Electricity`, amount `150.5`, unit `kWh` and date 2024-01-15
- **THEN** the result is a right exposing those values

#### Scenario: Text fields are trimmed
- **WHEN** `create` receives category `  Waste  ` and unit ` kg `
- **THEN** the stored values are `Waste` and `kg`

#### Scenario: A blank category is rejected
- **WHEN** `create` receives a category of three spaces
- **THEN** the result is a left whose `field` is `category`

#### Scenario: A blank unit is rejected
- **WHEN** `create` receives a unit of three spaces
- **THEN** the result is a left whose `field` is `unit`

#### Scenario: Non positive or non finite amounts are rejected
- **WHEN** `create` receives an amount of `-10.5`, `0`, `NaN` or `Infinity`
- **THEN** each result is a left whose `field` is `amount`

#### Scenario: An invalid date is rejected
- **WHEN** `create` receives `new Date("not a date")`
- **THEN** the result is a left whose `field` is `date`

