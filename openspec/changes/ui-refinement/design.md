## Decisions

### Preserve Carbon Day

Keep Sora/Geist roles and solid surfaces. The updated reference brief explicitly
replaces only the dashboard canvas with a deeper graphite stage and graphite
bento panels; navigation stays white and other pages stay light. Use orange for
processed rows/primary actions and teal for rejected rows/secondary actions.
Reference-style numeric tiles and a completion arc are intentional, not a generic
light KPI grid. No default glass, side stripes or gradient text. Chart
geometry does not animate; any state motion uses transform/opacity and reduced
motion removes it. Native labelled inputs/selects keep filter controls accessible.

### Show each file, not interpolated terrain

One stacked bar equals one upload; processed and rejected counters remain distinct.
Sort the latest twelve chronologically, use unique upload ids as categories,
short filename/time tick text and full metadata in tooltip/hidden table. Reserve
axis width and use compact k/m suffixes rather than negative left margins.

### Filter the dataset on the server

GET `/api/v1/uploads` accepts `q` (trimmed, at most 200 characters, no control
characters), `status` (PENDING/PROCESSING/COMPLETED/FAILED) and `sort`
(newest/oldest/name), alongside existing page/limit. Defaults preserve newest
ordering and the existing envelope. Search is case-insensitive literal substring;
SQL wildcards and backslashes are escaped and values stay parameterized. Count
and page use identical predicates and deterministic tie-breakers. No indexes are
added without evidence. URL keys are q/status/sort/page; changes reset page to one.

### Intake remains visible through acceptance

Keep existing validation/abort/error behavior and the authoritative server limit.
Compact dropzone selection becomes a file row while transferring; cancel is
disabled at Finishing. On 201 invalidate lists/stats, retain the accepted file and
query its actual status, with a detail link. Queued/processing/completed/failed
copy follows that status, not a fabricated Processing state. A sample download
uses a public CSV fixture. Guidance and recent files share reusable components.

### Scope derived diagnostics honestly

Global observed row totals/rejection share use the extended stats endpoint, never
a partial list. Missing fields or no observed rows mean no invented ratio.
Largest-file bars and terminal elapsed time explicitly use the latest twelve
uploads. Terminal elapsed
time is updatedAt minus createdAt, explicitly approximate and inclusive of queue
time; invalid/negative durations are omitted, not invented. No new endpoint is
needed beyond the small stats extension. Recent intake/sidebar views share a
small cached list query. Stats retain old fields and add processedRows,
rejectedRows, pending and processing as compatible optional client fields.

## Risks and rollback

The processing readout is prioritized after chart/search/intake and before extra
dashboard/sidebar context. It estimates rate only after two observed poll samples,
resets when counters regress/retry and labels elapsed time since receipt (including
queue time). Public states do not expose Reading/Validating/Saving phases, so none
is shown as a measured live step. Unknown total rows never produce a percentage.

- Query wildcards, duplicate sort keys and out-of-range pages can hide matches:
  real PostgreSQL tests cover literal search, stable ordering and matching totals.
- Debounce/back navigation can desynchronize URL/input: fake-clock RTL and browser
  journeys cover them; previous data is marked busy while updating.
- Upload redirect expectations change: update assertions to follow the explicit
  detail link without weakening CSV/outcome checks.
- Axis/tooltip/accessibility regressions require 1/2/12 and large-counter cases,
  mobile/desktop captures and five-page axe checks.
- Timebox prioritizes chart, search, intake, extra insights, sidebar; any unverified
  item moves to Deferred before handoff. Changes stay in a retained feature branch;
  no migration or irreversible operation is required for rollback.
