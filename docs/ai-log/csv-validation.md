# CSV validation AI usage

Date: 2026-10-10

- Implemented pure header and row validators, plain-decimal and UTC-calendar parsers,
  CSV error types and a capped rejected-row summary. No dependencies, filesystem access
  in production, HTTP or persistence were added. Tokenization remains a later change.
- Each implementation task ran an observed RED followed by a complete passing suite
  and typecheck. Canonical-header mapping was first a fixed result; the reordered-header
  test failed and forced real mapping. Missing-row tests exposed an undefined `.trim()`;
  guarded access replaced non-null assertions. Invalid dates normalized to March 1 before
  round-trip validation was connected to the row validator.
- The test-only fixture adapter reads LF/CRLF lines and preserves quoted commas. It is
  intentionally not a general CSV parser. The mixed fixture produced 15 valid and 10
  rejected records, at lines 3, 5, 7, 9, 11, 13, 15, 17, 19 and 21, matching EXPECTED.md.
- Two minor specification gaps were raised and approved before implementation: invalid
  summary limits act as zero (the total and omitted count remain visible), and physical
  line numbers are passed through from the future tokenizer, not calculated by validators.
- First coverage check passed tests but branches dropped to 96.15%, below baseline 97.36%.
  A separate verification assertion failed with "Branch coverage dropped below baseline".
  Tests for missing amount and missing unit restored coverage without changing production.
- Baseline: 66 tests; statements 95.37%, branches 97.36%, functions 95.08%, lines 94.79%.
  Final: 142 tests across 14 files; statements 96.73%, branches 98.71%, functions 95.71%,
  lines 96.12%. CSV production functions have 100% statements, branches, functions and lines.
- Decimal grammar deliberately rejects exponent, hex, leading plus, comma decimals,
  `.5` and `1.`; digit sequences with leading zeros remain allowed. The date parser uses
  an explicit UTC string to preserve years below 100 and avoid local-timezone behavior.
  Row values are trimmed; header matching is case-insensitive and ignores BOM via trim.
- No unexpected environment failure, push or OpenSpec archive occurred. Existing lefthook
  configuration warnings remained; checks ran explicitly.
