## Decisions

### Validate early, trust late
The browser checks extension (`.csv`, case insensitive), non empty file and the size hint before sending anything,
for instant feedback. The server remains the authority: its answers (400, 413) are shown with the same visual
treatment as the early errors, so the user sees one consistent behaviour.

### Upload progress uses the real byte counter
The progress bar reflects `onUploadProgress` and the XHR transport chosen in the API client. After the bytes are sent
there is a short gap while the server stores the file; the label changes from "Uploading" to "Finishing" at 100 percent
so the interface never looks stuck.

### Cancel is real
The request is aborted with an `AbortController` while transfer is still in progress. The server removes an incomplete
stream's partial file; the throttled browser journey verifies no accepted upload or orphan file. At 100 percent the page
shows "Finishing" and disables cancel. Aborting after all bytes were sent is not a server-side rollback guarantee.

### One panel per state, one source of truth
The detail page renders from a single status value. Each state has its own panel (waiting, working, finished, failed) and
the panel changes with a short crossfade. A polite live region announces the transition once.

### Progress during processing is honest
The backend knows the total only at the end. While working the page shows an indeterminate bar and the number of rows
handled so far (processed plus rejected), updated at each poll. No invented percentage.

### Rejected rows are explained, not hidden
A completed upload with rejected rows shows a notice with the count and the lines from the summary message, with the
reminder that valid rows were kept. The table below contains only valid rows.

### Results table
25 rows per page, `?page=` in the URL, previous data kept while the next page loads, numbers aligned right in tabular
figures, dates as written in the file.

### The end to end suite owns its stack
A script creates a fresh database, applies migrations, starts API, worker and frontend on test ports, runs Playwright and
tears everything down, so the suite never touches development data and anyone can run it with one command.

## Risks

- Browser tests are slower and can be flaky; waits are on visible state, never fixed sleeps.
- Playwright needs browser binaries; the README documents the one time install.

## Verification boundary and deferred work

The production Chromium suite passed 13 tests, including the five-page axe audit.
Twenty normal/reduced-motion desktop/mobile captures were produced and reviewed.
The full manual keyboard-only journey and cross-browser/manual WCAG assessment
remain deferred; no claim that axe or pointer journeys prove those checks is made.
