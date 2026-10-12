## ADDED Requirements

### Requirement: Carbon Day tokens and fonts
The system SHALL define the tokens of `DESIGN.md` v2.2 as CSS variables exposed to Tailwind and SHALL load Sora, Geist and Geist Mono
with `next/font`. No component SHALL use a hard coded color or font family.

#### Scenario: Tokens exist
- **WHEN** the global stylesheet is read
- **THEN** it defines `--bg`, `--surface`, `--surface-solid`, `--line`, `--text`, `--text-muted`, `--accent`, `--accent-2`, `--accent-strong`, `--accent-ink`, `--graphite`, `--graphite-2`, `--on-graphite`, `--on-graphite-muted`, `--teal` and the four status pairs

#### Scenario: No stray colors or fonts
- **WHEN** the component sources are searched for hexadecimal colors or font family names
- **THEN** none is found outside the global stylesheet and the font loader

### Requirement: Contrast is verified
The system SHALL have a test that computes the contrast of every text and badge pair and fails below 4.5:1 for text and 3:1 for large figures.

#### Scenario: Pairs
- **WHEN** the test runs
- **THEN** each pair of text on its surface, accent strong on white, accent ink on accent, on-graphite on graphite and each status color on its tinted background passes

### Requirement: Motion and reduced motion
The system SHALL animate only transform and opacity, SHALL NOT use `transition: all`, SHALL stagger the first load once, and SHALL remove entrances, chart reveals, sweeps and pulses under reduced motion.

#### Scenario: Forbidden transitions
- **WHEN** the sources are searched for `transition-all` or `transition: all`
- **THEN** none is found

#### Scenario: Reduced motion
- **WHEN** the user prefers reduced motion
- **THEN** the cards, charts and status dots have no animation

### Requirement: Focus and touch targets
The system SHALL show a 2 px accent focus ring on every interactive element and keep touch targets at least 44 px.

#### Scenario: Focus ring
- **WHEN** a link or button receives keyboard focus
- **THEN** a visible accent outline is shown

### Requirement: Library components are themed, not default
The system SHALL use shadcn/ui components copied into `src/components/ui` and themed with the Carbon Day tokens, Recharts for every chart, and no more than two React Bits components
(CountUp and SpotlightCard) adapted to the motion rules. The shared navigation mini indicator SHALL use native SVG; Recharts SHALL remain dashboard-only.

#### Scenario: Themed
- **WHEN** the shadcn variables are read
- **THEN** they map to the project tokens and no default shadcn color remains

#### Scenario: Chart loading
- **WHEN** the production build is analysed
- **THEN** Recharts is only part of the dashboard chunk, not of the shared chunk

#### Scenario: React Bits and reduced motion
- **WHEN** reduced motion is preferred
- **THEN** CountUp renders its final value immediately and SpotlightCard shows no moving highlight

#### Scenario: Licenses
- **WHEN** the README is read
- **THEN** it lists shadcn/ui, Recharts, React Bits, motion and Lucide with their licenses
