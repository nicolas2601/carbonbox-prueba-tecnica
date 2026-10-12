## ADDED Requirements

### Requirement: Search and filter the whole upload dataset
The system SHALL accept optional q/status/sort on the upload-list endpoint. q SHALL be trimmed, at most 200 characters and reject control characters; status SHALL be one of the four upload states; sort SHALL be newest, oldest or name. Defaults SHALL preserve existing unfiltered behavior.

#### Scenario: Dataset search
- **WHEN** a matching filename exists beyond the original first page
- **THEN** case-insensitive search returns it with a total counting all matches, not only the current page

#### Scenario: Literal and safe search
- **WHEN** q contains percent, underscore, backslash or SQL-looking text
- **THEN** it is searched as literal text through parameterized values without broadening the match or altering data

#### Scenario: Invalid filter
- **WHEN** q exceeds its limit/contains controls or status/sort is unsupported
- **THEN** the API returns its standard 400 validation envelope

### Requirement: Filters are reproducible URL state
The ledger SHALL reflect q/status/sort/page in its URL, debounce name changes by 300 ms, reset page on filter/order changes and expose labelled keyboard-usable controls.

#### Scenario: Debounce and pagination
- **WHEN** the user changes a name filter while on page two
- **THEN** after the debounce the URL/search request use the new q and page one

#### Scenario: Empty matching set
- **WHEN** no uploads match the current filters
- **THEN** a specific no-results message identifies the search and a clear-filters action restores the unfiltered list
