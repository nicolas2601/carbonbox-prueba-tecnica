## Why

The reading half of the interface exists. The two pages where the product's main promise happens are missing:
choosing a file and uploading it, and following that file while it is processed until the data is visible. This
change completes the user journey and proves it end to end in a real browser against the real system.

## What Changes

- Add `/uploads/new`: drag and drop or select a CSV, validate it in the browser, upload with visible progress, cancel, and go to the detail page.
- Add `/uploads/[id]`: upload information, live status with polling, indeterminate progress with a live row counter, a clear failure state, the rejected rows notice and a paginated table of processed rows.
- Add an end to end suite with Playwright against the real stack (database, API, worker, frontend), including accessibility checks with axe.
- Capture the screenshots used by the README.
- No backend change.

## Capabilities

### New Capabilities
- `upload-page`: file selection, client validation, upload progress, cancel and redirect
- `upload-detail-page`: status panel by state, polling, results table, failure and not found states
- `e2e-suite`: browser tests of the full journey and accessibility

### Modified Capabilities
None.

## Impact

- New dev dependencies: `@playwright/test`, `@axe-core/playwright`.
- New env var `NEXT_PUBLIC_MAX_UPLOAD_MB` (default 10) used only for the hint and early validation; the server stays authoritative.
- New directory `frontend/e2e` and a script that starts and stops the whole stack for the tests.
