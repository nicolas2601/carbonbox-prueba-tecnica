## ADDED Requirements

### Requirement: Every push runs the full set of checks
The system SHALL provide a GitHub Actions workflow that on push and pull request installs dependencies with a locked install, runs lint, type checks, backend unit tests, backend integration tests against a PostgreSQL service, frontend tests, both production builds and the specification validation.

#### Scenario: Green run
- **WHEN** the workflow runs on the main branch
- **THEN** every job passes

#### Scenario: Failing test blocks
- **WHEN** a test fails
- **THEN** the workflow fails and names the test

### Requirement: Container images build in the pipeline
The system SHALL build the three images in the workflow and run a smoke test that starts the stack and checks readiness.

#### Scenario: Smoke
- **WHEN** the workflow reaches the container job
- **THEN** the stack starts, `/health/ready` answers 200 and a sample upload completes

### Requirement: Caching and clear output
The system SHALL cache dependencies, publish test and coverage summaries and keep the total run under ten minutes.

#### Scenario: Duration
- **WHEN** the workflow runs with a warm cache
- **THEN** it completes in under ten minutes
