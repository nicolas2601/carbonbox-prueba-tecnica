## ADDED Requirements

### Requirement: Database tests run apart from the unit suite
The system SHALL run files named `*.integration.test.ts` only with `bun run test:integration`,
and SHALL exclude them from `bun run test`. Each integration test SHALL start from empty tables.

#### Scenario: The unit suite needs no database
- **WHEN** `bun run test` runs with the database stopped
- **THEN** it passes and runs no integration file

#### Scenario: Isolation between tests
- **WHEN** two integration tests insert rows with the same ids, one after the other
- **THEN** both pass because the tables are emptied between them
