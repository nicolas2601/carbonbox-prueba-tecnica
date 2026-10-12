## MODIFIED Requirements

### Requirement: The activity chart plots real uploads
The system SHALL plot the latest twelve uploads chronologically as stacked processed/rejected bars, one bar per file for any nonempty sample. X ticks SHALL use short filename/time text, never repeated date-only labels. Y ticks SHALL use compact counts with sufficient reserved width. Tooltip and hidden table SHALL expose full filename, observed rows/rejections and status. No interpolation or decorative landscape SHALL imply unobserved data.

#### Scenario: Sample sizes
- **WHEN** one, two or twelve uploads exist
- **THEN** the chart represents exactly those uploads as bars and the accessible table exposes their actual counters

#### Scenario: Large values
- **WHEN** a file has 100000 processed rows
- **THEN** the Y-axis shows a compact count such as 100k without clipping

#### Scenario: Unknown counters
- **WHEN** counters have not been reported yet
- **THEN** the file remains identifiable with its actual status and no fabricated handled rows
