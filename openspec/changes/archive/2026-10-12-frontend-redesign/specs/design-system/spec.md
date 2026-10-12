## MODIFIED Requirements

### Requirement: Tokens and fonts are defined once
The system SHALL define the color, spacing and motion tokens of `DESIGN.md` as
CSS variables exposed to Tailwind, and SHALL load the Carbon Day font roles
(Sora, Geist and Geist Mono) with `next/font`. No component SHALL use a hard coded
color or font family. Compatibility token aliases SHALL resolve to the current
Carbon Day palette rather than preserve the former warm theme.

#### Scenario: Tokens exist
- **WHEN** the global stylesheet is read
- **THEN** it defines `--bg`, `--surface`, `--text`, `--text-muted`, `--line`, `--accent`, the graphite tokens and the four status pairs

#### Scenario: No stray colors
- **WHEN** component sources are searched for hexadecimal colors
- **THEN** none is found outside the global stylesheet and canonical brand assets

#### Scenario: Font roles
- **WHEN** the application font loader is inspected
- **THEN** display, interface and data use Sora, Geist and Geist Mono instead of the superseded Fraunces, Instrument Sans and JetBrains Mono roles
