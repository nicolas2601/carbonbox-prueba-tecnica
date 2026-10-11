## ADDED Requirements

### Requirement: Stored files are read as a stream
The system SHALL implement `FsFileStorage.open(key)` returning an `AsyncIterable<Uint8Array>` that
streams the file from the storage directory without loading it whole. It SHALL apply the same key
rules as `delete`: a key with a path separator or `..` is refused. A missing file SHALL make the
iteration throw.

#### Scenario: Reading a saved file
- **WHEN** a file saved through `save` is opened
- **THEN** the concatenated chunks equal the original bytes

#### Scenario: Large file
- **WHEN** a file of several megabytes is opened
- **THEN** it yields more than one chunk

#### Scenario: Traversal key
- **WHEN** `open("../secret.csv")` is iterated
- **THEN** it throws and no file outside the directory is read

#### Scenario: Missing file
- **WHEN** a key that was never saved is opened and iterated
- **THEN** the iteration throws

### Requirement: Bytes become records with their physical line
The system SHALL provide `CsvParseRecordReader` implementing `ICsvRecordReader`. For each record it
SHALL yield the fields and the one based physical line where the record starts, counting the header
as line 1. It SHALL accept a byte order mark, CRLF and LF, quoted fields with commas, escaped
quotes and quoted line breaks, and SHALL skip empty lines without losing the line count.

#### Scenario: Plain file
- **WHEN** a header and two records are read
- **THEN** the records have lines 2 and 3 and the header is the first yielded record

#### Scenario: Quoted comma
- **WHEN** a record contains `"Fuel, Diesel"`
- **THEN** it has four fields and the second field of that value is `Fuel, Diesel`

#### Scenario: Quoted line break
- **WHEN** a record has a quoted field spanning two lines and is followed by another record
- **THEN** the first has its starting line and the next record has the correct physical line

#### Scenario: CRLF and byte order mark
- **WHEN** the file starts with a byte order mark and uses CRLF
- **THEN** the header is `category,amount,unit,date` and the lines are correct

#### Scenario: Empty lines
- **WHEN** an empty line appears between two records
- **THEN** it is skipped and the following record keeps its physical line

#### Scenario: Short rows reach validation
- **WHEN** a record has fewer fields than the header
- **THEN** it is yielded as is

### Requirement: Broken files fail with a permanent error
The system SHALL throw `MalformedCsvError`, code `MALFORMED_CSV`, extending `DomainError`, when the
quoting is broken or a record exceeds the size limit.

#### Scenario: Unclosed quote
- **WHEN** a field opens a quote that is never closed
- **THEN** reading throws `MalformedCsvError`

#### Scenario: Oversized record
- **WHEN** one record is larger than the limit
- **THEN** reading throws `MalformedCsvError`

### Requirement: The sample files read as documented
The system SHALL read `sample-invalid.csv` so that the invalid records are on the lines listed in
`samples/EXPECTED.md`.

#### Scenario: Fixture lines
- **WHEN** the file is read and each record is validated
- **THEN** exactly the lines 3, 5, 7, 9, 11, 13, 15, 17, 19 and 21 are rejected

## Implementation limits

Record/field buffer size is constrained by `max_record_size` except for raw skipped empty-line
prefixes. A probe with 2000 leading newlines and a 64-character record limit produced a raw
prefix/header of length 2026. The maximum file size at the HTTP boundary bounds these prefixes;
`MAX_UPLOAD_MB` defaults to 10 MB, with enforcement in M5, not in this reader. This is a bound
on encoded input, not an exact RAM cap: decoded strings, buffers and newline-match arrays add
overhead. Direct internal callers bypassing HTTP are responsible for bounded input files.
