# csv-header Specification

## Purpose
Require the four mandatory columns in the CSV header.
## Requirements
### Requirement: The header must contain the four required columns
The system SHALL provide `validateHeader(fields)` returning
`Either<InvalidCsvHeaderError, CsvColumns>`. The required columns are `category`, `amount`,
`unit` and `date`. Matching SHALL ignore case and surrounding spaces, SHALL ignore a leading
byte order mark, and SHALL accept the columns in any order and extra columns.

#### Scenario: A canonical header is accepted
- **WHEN** `validateHeader(["category","amount","unit","date"])` is called
- **THEN** the result is a right whose positions are category 0, amount 1, unit 2, date 3

#### Scenario: Order, case, spaces and extra columns are tolerated
- **WHEN** `validateHeader([" Date ","UNIT","note","Amount","category"])` is called
- **THEN** the result is a right whose positions are date 0, unit 1, amount 3, category 4

#### Scenario: A byte order mark on the first column is ignored
- **WHEN** `validateHeader(["﻿category","amount","unit","date"])` is called
- **THEN** the result is a right whose category position is 0

#### Scenario: A missing column is rejected and named
- **WHEN** `validateHeader(["category","amount","date"])` is called
- **THEN** the result is a left `InvalidCsvHeaderError` whose message names `unit`

#### Scenario: A duplicated required column is rejected
- **WHEN** `validateHeader(["category","amount","amount","unit","date"])` is called
- **THEN** the result is a left `InvalidCsvHeaderError` whose message names `amount`

#### Scenario: An empty header is rejected
- **WHEN** `validateHeader([])` is called
- **THEN** the result is a left `InvalidCsvHeaderError`

