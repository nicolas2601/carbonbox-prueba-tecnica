## Why
`/uploads/new` is currently a single narrow upload card with unused whitespace and no in-context CSV guidance. The sidebar only summarizes completion, while the stats contract can also provide global processed/rejected row totals. This change creates a practical responsive upload workspace and an API-truthful stats rail.

## What Changes
- Add responsive upload workspace with compact file selection/progress, CSV requirements, downloadable sample, and recent three uploads.
- Replace completion mini-card with SVG completion ring and API-backed upload KPIs; optionally show global row counts when stats endpoint supplies them.

## Capabilities
- upload-workspace

## Impact
- Frontend upload route, selection component, sidebar stats, frontend tests and sample CSV asset. Existing backend contract remains compatible because additional stats fields are optional.
