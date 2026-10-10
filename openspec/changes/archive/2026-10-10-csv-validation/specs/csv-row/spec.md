## ADDED Requirements

### Requirement: A valid record becomes an activity row
The system SHALL provide `validateRow(fields, columns, line)` returning
`Either<RowError, ActivityRow>`. A record is valid when every required column has a value,
`category` and `unit` are not empty after trimming, `amount` is a finite number greater than
zero and `date` is a real calendar date written as `YYYY-MM-DD`. The row SHALL contain the
trimmed category and unit, the amount as a number and the date as a UTC midnight `Date`.

#### Scenario: A valid record is accepted
- **WHEN** a record `["Electricity","1378.80","kWh","2024-04-11"]` is validated at line 2
- **THEN** the result is a right with category `Electricity`, amount 1378.8, unit `kWh` and
  date 2024-04-11T00:00:00Z

#### Scenario: Values are trimmed and a quoted comma is kept
- **WHEN** a record `["  Fuel, Diesel ","10"," L ","2024-01-15"]` is validated
- **THEN** the result is a right with category `Fuel, Diesel` and unit `L`

#### Scenario: Columns are read by position from the header mapping
- **WHEN** a record is validated with columns where date is position 0
- **THEN** each field is taken from its mapped position

### Requirement: Amount must be a plain positive decimal
The system SHALL accept an amount only if it is a plain decimal number (digits with an
optional fractional part and an optional leading minus) that is finite and greater than zero.

#### Scenario: Rejected amounts
- **WHEN** the amount is `-10.50`, `0`, `abc`, an empty text, `0x10`, `1e3` or `1,5`
- **THEN** each result is a left `RowError` for the field `amount`

### Requirement: Date must be a real calendar date
The system SHALL accept a date only if it matches `YYYY-MM-DD` and the day exists in that
month, including 29 February only in leap years.

#### Scenario: Accepted leap day
- **WHEN** the date is `2024-02-29`
- **THEN** the result is a right

#### Scenario: Rejected dates
- **WHEN** the date is `2024-02-30`, `2023-02-29`, `15/01/2024`, `2024-13-01` or an empty text
- **THEN** each result is a left `RowError` for the field `date`

### Requirement: Text columns must not be empty
The system SHALL reject a record whose `category` or `unit` is empty after trimming.

#### Scenario: Blank category or unit
- **WHEN** the category is three spaces, or the unit is three spaces
- **THEN** each result is a left `RowError` for the field `category` or `unit`

### Requirement: Missing columns are reported
The system SHALL reject a record that has fewer fields than the header requires and SHALL
report the first missing field.

#### Scenario: A record with three fields
- **WHEN** a record `["Electricity","10","kWh"]` is validated against the canonical columns
- **THEN** the result is a left `RowError` for the field `date`

### Requirement: A row error says where and why
The system SHALL return a `RowError` with the physical `line`, the `field` and a short
`reason` in English. Only the first failing field of a record is reported, checked in the
order category, amount, unit, date.

#### Scenario: Error content
- **WHEN** the record `["Electricity","-10.50","kWh","2024-04-11"]` is validated at line 3
- **THEN** the left has line 3, field `amount` and a reason that says it must be greater than zero
