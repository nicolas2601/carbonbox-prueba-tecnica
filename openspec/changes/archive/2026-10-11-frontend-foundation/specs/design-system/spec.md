## ADDED Requirements

### Requirement: Tokens and fonts are defined once
The system SHALL define the color, spacing and motion tokens of `DESIGN.md` as CSS variables exposed to Tailwind, and SHALL load
Fraunces, Instrument Sans and JetBrains Mono with `next/font`. No component SHALL use a hard coded color or font family.

#### Scenario: Tokens exist
- **WHEN** the global stylesheet is read
- **THEN** it defines the variables `--paper`, `--surface`, `--ink`, `--ink-muted`, `--line`, `--accent` and the four status pairs

#### Scenario: No stray colors
- **WHEN** the source of the components is searched for hexadecimal colors
- **THEN** none is found outside the global stylesheet

### Requirement: Status is shown with a badge
The system SHALL provide `StatusBadge` that renders the status as text with a dot, using yellow for PENDING, blue for PROCESSING, green for COMPLETED and red for FAILED. Only PROCESSING SHALL animate its dot.

#### Scenario: Each status
- **WHEN** the badge renders each of the four statuses
- **THEN** the text is the status in readable form and the color token is the one assigned

#### Scenario: Never color alone
- **WHEN** the badge is read by a screen reader
- **THEN** the status text is announced

#### Scenario: Reduced motion
- **WHEN** the user prefers reduced motion
- **THEN** the PROCESSING dot does not animate

### Requirement: Motion follows the rules
The system SHALL animate only `transform` and `opacity`, SHALL NOT use `transition: all`, and SHALL disable entrances, stagger,
pulses and sliding when reduced motion is preferred.

#### Scenario: No forbidden transitions
- **WHEN** the stylesheets and components are searched for `transition: all` or `transition-all`
- **THEN** none is found

### Requirement: Every data view has loading, empty and error states
The system SHALL provide skeleton, empty state and error state components. The error state SHALL show the message, the request
id when present and a retry action.

#### Scenario: Error state
- **WHEN** the error state receives an `ApiError` with a request id
- **THEN** the message and the id are shown and activating retry calls the given function

### Requirement: Pagination component
The system SHALL provide `Pagination` showing "Page X of Y", with previous disabled on the first page and next disabled on the last.

#### Scenario: Ends
- **WHEN** the current page is the first and then the last
- **THEN** previous is disabled on the first and next is disabled on the last

### Requirement: The shell is accessible
The system SHALL provide a layout with a skip link, a main landmark, navigation with the current page marked, and a visible focus ring on all interactive elements.

#### Scenario: Landmarks
- **WHEN** the layout renders
- **THEN** it has one main landmark, a navigation landmark and a skip link to the main content
