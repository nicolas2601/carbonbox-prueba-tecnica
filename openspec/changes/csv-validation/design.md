## Decisions

### Split tokenizing from validating
Tokenizing (quotes, commas inside quotes, CRLF, BOM, streaming a large file) is solved and
subtle; a mature library does it in `async-processing`. Validating is the business rule and is
ours. The seam is a plain `string[]` per record, so validation never knows where it came from.
Alternative rejected: a hand written tokenizer. It is a classic source of bugs for no gain.

### Functions, not classes
`validateHeader(fields)` and `validateRow(fields, columns, line)` are pure functions returning
`Either`. No state, no dependencies, nothing to inject. The plan listed a `CsvParserService`;
that name is dropped because this change does not parse.

### Strict parsing of amount and date
`Number("")` is 0, `Number("0x10")` is 16 and `new Date("2024-02-30")` is March 1st in some
engines. Amount must match a plain decimal pattern before conversion. Date must match
`YYYY-MM-DD` and survive a round trip through UTC (`2024-02-30` becomes `2024-03-01` and is
rejected).

### Row error carries line and field
`RowError { line, field, reason }`. The line is the physical line in the file (header is
line 1), which is what a person opens in a spreadsheet. The first failing field is reported;
one error per row is enough to fix the file and keeps the summary short.

### Validated row is plain data
`ActivityRow { category, amount, unit, date }` with `date` as a UTC `Date`. The id and the
upload id are assigned later when `ActivityData` is created; `ActivityData.create` stays as the
last guard of the invariants.

## Risks

- A valid but unusual amount such as `1e3` or `1,5` is rejected. Accepted: the contract says
  a number, and a strict rule is easier to explain than a permissive one.
