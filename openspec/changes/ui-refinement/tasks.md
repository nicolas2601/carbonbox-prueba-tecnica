## 1. Activity chart

- [x] 1.1 RED/GREEN pure point/label/compact-number models for 1/2/12 uploads and large counters
- [x] 1.2 Stacked bars, filename/time axes, full tooltip, legend and accessible table; update DESIGN.md

## 2. Server-backed ledger

- [x] 2.1 RED/GREEN backend validation, literal case-insensitive search, status/sort and matching count/page integration
- [x] 2.2 OpenAPI/query schema and regression checks for invalid/injection/wildcard inputs
- [x] 2.3 URL-driven frontend filters/sort, 300 ms debounce, page reset and clearable filtered empty state

## 3. Intake workspace

- [ ] 3.1 Worker2: compact selection, guidance/sample download (main integrates and verifies)
- [ ] 3.2 Worker2: transfer file row and accepted status/detail link (main integrates and verifies)
- [ ] 3.3 Worker2: recent files/white sidebar gauge and real KPIs (main integrates and verifies)

## 4. Additional context

- [ ] 4.0 Tested PROCESSING readout with observed poll rate, elapsed time and no fabricated stages/percentage
- [ ] 4.1 Tested global row-quality and scoped approximate median elapsed/largest-upload models
- [ ] 4.2 Dashboard-only graphite stage, completion arc, largest-upload bars and four honest tiles
- [ ] 4.3 Global stats sums/counts and tested hydration-mismatch fix

## 5. Verification

- [ ] 5.1 Backend/frontend tests, types, lint where configured, builds and strict OpenSpec validation
- [ ] 5.2 Production Chromium journeys for filters/intake, axe without serious/critical findings, 360/1280 normal/reduced captures
- [ ] 5.3 Bounded visual review, final evidence/limits and atomic commits before 12:30
