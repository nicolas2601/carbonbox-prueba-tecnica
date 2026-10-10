## Why

The worker must decide, for every line of an uploaded file, whether it is a valid activity row
and, if not, say exactly which field failed. This decision is pure logic. Building it before
any file reading, queue or database keeps it testable in milliseconds and keeps the
"what is a valid row" rule in one place.

## What Changes

- Add a header check: the four required columns must be present, in any order, tolerant of
  case, surrounding spaces and a byte order mark.
- Add a row check: given the fields of one record and its physical line number, return either
  a validated row or a row error that names the line and the field.
- Add a strict amount parser and a strict calendar date parser. Both reject what the native
  `Number()` and `new Date()` silently accept (empty text, hex, `2024-02-30`).
- Add a summary of rejected rows, capped, to fill `Upload.errorMessage` later.
- Tokenizing the file into records (quotes, CRLF, streaming) is NOT part of this change. It is
  an infrastructure concern handled in `async-processing` with a mature library.

## Capabilities

### New Capabilities
- `csv-header`: validates the header record and maps column names to positions
- `csv-row`: validates one record into an activity row or a row error
- `csv-error-summary`: turns many row errors into one short message

### Modified Capabilities
None.

## Impact

- New code under `backend/src/document-processing/application/csv`.
- No new dependencies, no I/O, no database, no HTTP.
- `async-processing` consumes these functions for every record of the file.
