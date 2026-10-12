# Frontend upload and detail AI usage

Date: 2026-10-11

## Scope and authorization

- Nico directly authorized a narrow exception in this session on 2026-10-11:
  only `bun run e2e` and `bun run e2e:screenshots` defined in frontend/package.json
  may launch headless Chromium from a script. Exploration, visual review and image
  inspection remain on Playwright MCP; no ad-hoc browser launch is authorized.
- Peer-relayed authorization was not treated as consent. UI and unit work continued
  while direct consent was pending; no runner was launched during that period.
- Cancellation claims apply only to aborting during transfer. After all bytes have
  been sent, the server may already have committed an upload; no rollback is promised.
  The UI disables cancel when it reaches Finishing.

## Implementation notes

- M6 review found mobile status badges clipped by the scrollable table. Upload
  records now stack name/status/date below 640 px, while desktop keeps the full
  table and result tables keep their own scroll region. Explicit table roles
  preserve semantics when CSS changes display layout.
- Added early extension/empty/size validation, including exact-limit acceptance,
  a labelled native file input/dropzone, nested drag handling, single-file errors
  and selection removal. NEXT_PUBLIC_MAX_UPLOAD_MB is a hint; backend stays authoritative.
- The scaffold's frontend .env* ignore overrode the root example exception. Added
  a narrow !.env.example rule and verified real .env/.env.local remain ignored.
- Upload transport counter drives the bar; 100 percent says Finishing. Successful
  requests invalidate the upload query root before navigation. AbortController
  cancels active requests and unmounts; late progress/responses are ignored and
  selection remains available. Server/network errors show a request id when present
  and offer retry. Cancellation remains distinct from network errors.
- React compiler lint initially considered an object containing a ref ref-tainted;
  destructuring the dropzone hook's ref/data/actions solved it without rule suppression.
- The detail route reads promise params/searchParams under Suspense. Waiting/working
  panels use an indeterminate bar and processed+rejected row counter, never a fabricated
  percentage. Visibility observation is shared with badges to pause offscreen loops.
- Main session owns integration and verification. A bounded independent agent authors
  E2E infrastructure only; another reads all Taste guidance and Impeccable references.
  Neither agent launches a browser or publishes changes.

## Verification checkpoint

- All UI tasks through 2.6 are implemented. Current lint, TypeScript and 164 unit/RTL
  tests pass, including ten token-pair contrast checks. Status crossfade has inert
  outgoing paint, one live-region mutation per transition and reduced-motion rules.
  Results preserve precision, original dates, 25-row paging and previous data.
- Infrastructure agent hit its timebox and left an unverified snapshot. Main session
  stopped it and integrated directly. A real regression exposed missing child env,
  which could have made migration use an unintended URL; fixed before the first
  runner execution. Added admin-database and actual-owned-storage guards. Original
  test/development targets are refused. No development migration ran.
- `bun run e2e` first exited 1 with No tests found. After adding the bootstrap it
  passed one real Chromium test. Independently checked zero remaining E2E databases,
  temporary storage and service listeners after both paths. This is bootstrap
  evidence, not a claim that the full suite passed.
- Authored typed suites for journeys, validation/413/throttled cancellation,
  dashboard/URL pagination/404, five-page axe and ten curated README screenshots.
  User/coordinator then reassigned all browser execution and visual inspection to
  worker2. Main stopped browser runs; tasks 3.2–3.6 and 4.x remain pending runtime
  evidence. No results are fabricated from merely typechecking the suite.
- Browser close through MCP failed with the shared-profile already-in-use error;
  reported to the coordinator for ownership coordination, without killing an
  unrelated process or changing browser settings.
- A later build hit Another next build process is already running. Worker2's
  production server now uses the shared .next output, so no rebuild/lock deletion
  is attempted until that stack is released. Last source build before the handoff
  was green; final build is explicitly pending.
- Security scan on e2e exited 1: the sole SQL Injection finding is a test URL
  interpolation at localStack.test.ts:30, not SQL execution. The real reset uses
  current_database ownership checking and fixed TRUNCATE statements. The scan
  warning is retained, not represented as clean.

## Design methods

- Emil plus baseline/accessibility rules apply throughout. Impeccable's installed
  context loader ran once, read DESIGN.md and did not migrate files. PRODUCT.md is
  absent; existing confirmed OpenSpec/design context was used without inventing a
  new document or redesigning the pinned visual world.
- Taste was read 100% sequentially (1228 lines/89351 characters). Its own scope
  excludes dashboards/data tables/multi-step product UI. Its useful audit/preservation
  principles are applied, not landing-page recipes that would replace the approved
  typography/palette or add unnecessary packages. Impeccable product/audit/harden,
  interaction/responsive and color/contrast guidance was read by the bounded reader.
- Verified token contrasts: ink/paper15.14, muted/paper5.64, muted/surface6.04,
  accent pair8.03, status pairs5.18/5.95/6.15/5.89. Border line/surface1.42 is only
  decorative; the dropzone's essential dashed boundary uses the higher-contrast
  muted token. Browser-computed states/visual quality remain worker2's evidence.

Final screenshots, browser findings and closure evidence will be appended after verification.
