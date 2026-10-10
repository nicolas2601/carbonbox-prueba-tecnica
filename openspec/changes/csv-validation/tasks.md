## 1. Errors and types

- [x] 1.1 `InvalidCsvHeaderError` with a unique code; `RowError`, `ActivityRow`, `CsvColumns` types

## 2. Header

- [x] 2.1 `validateHeader`: canonical header and positions
- [x] 2.2 `validateHeader`: order, case, spaces, extra columns, byte order mark
- [x] 2.3 `validateHeader`: missing, duplicated and empty header

## 3. Strict value parsers

- [ ] 3.1 `parseAmount`: accepted decimals, rejected forms
- [ ] 3.2 `parseCalendarDate`: valid dates and leap years
- [ ] 3.3 `parseCalendarDate`: rejected forms

## 4. Row

- [ ] 4.1 `validateRow`: valid record, trimming, quoted comma, mapped positions
- [ ] 4.2 `validateRow`: blank category or unit, missing columns
- [ ] 4.3 `validateRow`: amount and date errors, first failing field, line and reason

## 5. Summary

- [ ] 5.1 `summarizeRowErrors`: none, few, capped

## 6. Verification

- [ ] 6.1 Fixture test: `samples/sample-invalid.csv` gives 15 valid and 10 rejected at the lines in `EXPECTED.md`
- [ ] 6.2 `bun run typecheck` and `bun run test` pass, coverage not below the baseline
- [ ] 6.3 No `any`, files under 300 lines, functions under 40 lines
