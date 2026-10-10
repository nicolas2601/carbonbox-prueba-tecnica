# Expected CSV Validation Results

Run `bun scripts/generate-fixtures.ts` or `npx tsx scripts/generate-fixtures.ts` from the repository root. It rewrites `sample-data.csv` (repository root) and the two files in `samples/`. Generation uses fixed seeds; dates use UTC and cover leap year 2024.

`totalRows` excludes the header. Line numbers below are one-based physical file lines, including the header. No field contains an embedded newline, so physical lines correspond to CSV records. The CRLF record counts once.

| File | totalRows | Valid rows | Invalid rows |
| --- | ---: | ---: | ---: |
| sample-data.csv | 60 | 60 | 0 |
| sample-invalid.csv | 25 | 15 | 10 |
| sample-large.csv | 5000 | 5000 | 0 |

## Invalid Records in sample-invalid.csv

| Line | Field | Value | Reason |
| ---: | --- | --- | --- |
| 3 | amount | -10.50 | Negative; must be greater than zero |
| 5 | amount | 0 | Zero; must be greater than zero |
| 7 | amount | abc | Not a finite number |
| 9 | amount | empty | Required value missing |
| 11 | category | three spaces | Empty after trimming |
| 13 | unit | three spaces | Empty after trimming |
| 15 | date | 2024-02-30 | Calendar date does not exist |
| 17 | date | 15/01/2024 | Does not match YYYY-MM-DD |
| 19 | date | empty | Required value missing |
| 21 | date | absent fourth column | Required column missing; record has three fields |

Line 6 uses CRLF; all other record terminators use LF. Line 16 is a valid record whose category is `"Fuel, Diesel"`: its comma is quoted correctly and must not create a fifth column. The other two fixtures also include this category to exercise CSV quoting.

## Validation Rules

Each record must contain all four columns. `category` and `unit` must be nonempty after trimming. `amount` must be nonempty and convert to a finite number strictly greater than zero. `date` must match YYYY-MM-DD and represent an actual calendar date. Invalid records should be counted or reported without silently losing subsequent valid records.

The large fixture does not guarantee that a three-second poll observes PROCESSING: a fast worker can legitimately complete before the first poll. Do not introduce artificial processing delays solely for the demo.
