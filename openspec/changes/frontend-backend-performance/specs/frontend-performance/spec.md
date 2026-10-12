## ADDED Requirements

### Requirement: Heavy code is split
The system SHALL load dashboard chart implementations through a dynamic import with a reserved loading placeholder. The shared application shell SHALL use native SVG for its navigation indicator rather than importing Recharts.

#### Scenario: Charts not in shared code
- **WHEN** dashboard and shared-shell imports are inspected
- **THEN** chart implementations are dynamically imported by the dashboard and Recharts is not imported by the shared shell

#### Scenario: Chart loading
- **WHEN** a chart implementation has not loaded yet
- **THEN** its loading placeholder is present until the real chart renders

### Requirement: Font roles are configured explicitly
The system SHALL configure Sora for display at weights 400, 500 and 600, Geist for interface text and Geist Mono for data, with Latin subsets and `display: swap` through the application font loader.

#### Scenario: Font configuration
- **WHEN** the application font loader is inspected
- **THEN** the roles, Sora weights, Latin subsets and swap setting match the configuration

### Requirement: Terminal uploads do not keep polling
The system SHALL stop upload-detail/result polling for COMPLETED or FAILED uploads and SHALL NOT start polling an unknown upload after its 404 response.

#### Scenario: Polling stops
- **WHEN** an upload reaches COMPLETED or FAILED
- **THEN** automatic polling stops; later explicit navigation or revalidation is not prohibited

#### Scenario: Unknown upload
- **WHEN** an upload lookup answers 404
- **THEN** the not-found state is shown without starting polling
