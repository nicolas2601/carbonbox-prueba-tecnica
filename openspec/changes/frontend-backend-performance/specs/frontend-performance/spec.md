## ADDED Requirements

### Requirement: A measured baseline exists
The system SHALL record, before any change, the production build route sizes, the cold load metrics of the dashboard, the list and the detail page (time to first byte, first contentful paint, largest contentful paint, cumulative layout shift, transferred bytes) and the number of requests.

#### Scenario: Baseline document
- **WHEN** `docs/performance.md` is read
- **THEN** it lists the machine, the method and the baseline numbers for each page

### Requirement: Budgets are met
The system SHALL keep the first load JS of the dashboard at or under 200 KB gzip, LCP at or under 1.8 s and CLS at or under 0.05 on a cold load of the production build on localhost.

#### Scenario: Within budget
- **WHEN** the dashboard is loaded cold three times
- **THEN** the median LCP is at or under 1.8 s and CLS at or under 0.05

#### Scenario: Bundle
- **WHEN** the production build output is read
- **THEN** the dashboard first load JS is at or under 200 KB gzip

### Requirement: Heavy code is split
The system SHALL load the chart library only on the dashboard, with a dynamic import and a skeleton of the final size so the layout does not shift.

#### Scenario: Charts not in shared code
- **WHEN** the build is analysed
- **THEN** the chart library appears only in the dashboard chunk

#### Scenario: No layout shift
- **WHEN** the chart replaces its skeleton
- **THEN** the page does not shift

### Requirement: Fonts are lean
The system SHALL load only the weights in use, the latin subset, with `display: swap` and preloading for the display and interface fonts.

#### Scenario: Font requests
- **WHEN** the dashboard loads
- **THEN** no more than four font files are requested

### Requirement: Navigation is quick and requests are not wasted
The system SHALL set a query stale time so returning to a page shows cached data at once and revalidates in the background, SHALL prefetch links on hover or when visible now that every route exists, and SHALL NOT poll terminal uploads.

#### Scenario: Back to the list
- **WHEN** the user opens the list, a detail page and goes back within 30 seconds
- **THEN** the list renders immediately from cache and revalidates once

#### Scenario: Prefetch
- **WHEN** a link to the detail page is hovered
- **THEN** its code is requested before the click and no 404 is produced

#### Scenario: Polling stops
- **WHEN** an upload reaches COMPLETED
- **THEN** no further requests for it are made

### Requirement: Static assets are cached and compressed
The system SHALL serve hashed assets with immutable long caching and compressed text responses.

#### Scenario: Headers
- **WHEN** a hashed JavaScript asset is requested
- **THEN** it has a long immutable cache lifetime and a compressed encoding
