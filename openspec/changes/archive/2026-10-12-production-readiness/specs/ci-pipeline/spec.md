## ADDED Requirements

### Requirement: Push and pull request checks are defined
The system SHALL provide a GitHub Actions workflow definition for push and pull request with locked dependency installation, frontend lint, type checks, backend unit/coverage and PostgreSQL integration tests, frontend tests/build and strict specification validation. This requirement concerns configuration and local equivalents, not an unobserved remote green run.

#### Scenario: Workflow configuration
- **WHEN** the workflow is parsed and its job definitions are inspected
- **THEN** the push/pull-request triggers, locked installs and required local check commands are present

#### Scenario: Failure handling is configured
- **WHEN** the check steps are inspected
- **THEN** test commands are not configured to ignore failure

### Requirement: Container build and smoke steps are defined
The system SHALL define migration/API/worker/frontend image builds and an owned-project container smoke step that checks readiness and CSV completion, with cleanup limited to that project.

#### Scenario: Smoke
- **WHEN** the container job definition and its smoke script are inspected
- **THEN** they build the required images, use explicit project ownership and check readiness plus actual CSV completion

### Requirement: Caching and summaries are configured
The system SHALL define dependency caching, a backend coverage artifact and job summaries that refer to actual step outcomes rather than declaring success unconditionally.

#### Scenario: Output configuration
- **WHEN** workflow output steps are inspected
- **THEN** dependency caches, coverage publication and outcome-oriented summaries are defined
