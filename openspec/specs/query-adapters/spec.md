# query-adapters Specification

## Purpose
Implement the read side of the queries on PostgreSQL.
## Requirements
### Requirement: The read port is implemented on PostgreSQL
The system SHALL provide a Prisma adapter of `IUploadQueries` with `findById`, `list`, `results`
and `stats`, using counts and pages computed by the database, never by loading everything.

#### Scenario: Pagination in the database
- **WHEN** 250 uploads exist and page 3 with limit 100 is requested
- **THEN** 50 items and total 250 are returned

#### Scenario: Stable order with equal timestamps
- **WHEN** several uploads share the same creation time
- **THEN** paging through all pages returns each upload exactly once

#### Scenario: Stats in one grouped query
- **WHEN** uploads in all four states exist
- **THEN** the totals match the stored states

#### Scenario: Amounts and dates
- **WHEN** a stored row has amount 1378.8 and date 2024-04-11
- **THEN** it is returned as the number 1378.8 and the text `2024-04-11`

#### Scenario: Large result set
- **WHEN** an upload has 5000 rows and page 50 with limit 100 is requested
- **THEN** 100 rows are returned and the total is 5000

