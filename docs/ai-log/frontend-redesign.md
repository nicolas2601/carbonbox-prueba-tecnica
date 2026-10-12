# Frontend redesign AI usage

Date: 2026-10-11

## Scope and visual authority

- Implemented `frontend-redesign` from base `9d44ad2`. No backend changes,
  push, archive, branch switches or production-database operations.
- Nico's reference boards, canonical `assets/logo-mark.svg` and Carbon Day brief
  replace the earlier warm editorial ledger. The coordinator's Impeccable delta
  removes default glass, pure white surfaces and repeated hero-metric cards.
  `PRODUCT.md` records the supplied analyst context; `DESIGN.md` v2.2 records
  the scene, solid tinted surfaces, compact counts and permitted graphics.
- Loaded Emil guidance and Impeccable through UI Skills MCP, then read local
  craft, layout, typography, critique and audit references. Local context loader
  resolved the real PRODUCT/DESIGN files. Existing approved reference boards
  supplied direction; no new generated mock was needed.
- Browser ownership remains with worker2. This session ran no browser, E2E
  runner or screenshot runner during the redesign. Every production build used
  `NEXT_DIST_DIR=.next-redesign`, never the served `.next` directory.

## Implementation and source review

- Installed and adapted shadcn primitives, Recharts, motion and Lucide. Removed
  default palettes and broad transitions. The chart adapter contains only the
  application's used API instead of the generated 373-line implementation.
- Exported the canonical drawing as SVG, 180 px Apple icon and a 32 px PNG-in-ICO
  favicon. The original scaffold ICO failed the canonical-icon test. Removed
  five scaffold SVGs after reading them and confirming no source references.
- Sidebar is 248 px, with active pill, native SVG completion indicator and a
  30-second readiness query. Native SVG avoids putting Recharts in the shell.
  Readiness HTTP response was 200 and returned the matching CORS origin;
  browser readability still needs the verifier's evidence.
- Mobile Sheet preserves Radix trapping/dismissal/restoration. Its initial focus
  landed on API status, opened a tooltip and made Escape dismiss that layer
  instead of the drawer. Explicit heading focus fixed the observed RED.
  Tab/shift-tab wrapping, Escape and restored trigger focus now pass RTL.
- Dashboard uses real totals, contextual completion, compact graphite counts,
  donut, status bars and a latest-file timeline. Activity queries twelve uploads,
  sorts chronologically and adds processed/rejected counters, using zero for
  counters not yet supplied. The period label and hidden table are explicit.
  Recent uploads still show five records with their own recovery behavior.
- Only dashboard dynamically imports Recharts. Inspection of the final isolated
  build found one Recharts runtime chunk, `2sy-bo50ca6g0.js`. Earlier inspection
  verified its dashboard loader was absent from the upload-page bootstrap.
  This is bundle-structure evidence, not a first-load performance measurement.
- Numeric counting and pointer light are minimal React Bits adaptations, not
  its default theme or ambient effects. Reduced motion shows the final number
  and no moving highlight. MIT + Commons Clause is retained and documented:
  embedded app use is allowed, standalone component redistribution is restricted.

| Before | After | Why |
|---|---|---|
| Glass on every card, repeated large KPI tiles | Solid tinted surfaces, one large gauge and compact contextual counts | Hierarchy follows the analyst's task rather than a generic metric template |
| Accent-strong on lower canvas: 4.1001699201908615:1 | Ink canvas links, accent decoration and surface links | Small text needs 4.5:1 without changing the pinned palette |
| Button group opacity 0.85 on hover: primary text measured 3.815055195895125:1 | One-pixel transform feedback, text remains opaque | Hover must preserve the same AA guarantee as the default state |
| Skip link at layer 10 under navigation at layer 30 | Skip link at layer 40, below modal layers | Keyboard focus must not disappear behind the fixed shell |
| Light retry card inherited the graphite rail's light focus outline | Local accent-strong outline on the light error card | Recovery controls need contrast against their own surface, not the ancestor's surface |
| Generated `transition-all` and default neutral classes | Token-only primitives and explicit transform/opacity | Deterministic motion and theme guards remain enforceable |
| Entire chart scaled during entrance | SVG clip rectangle reveals only the area | Data geometry and axes remain stationary; reduced motion disables the reveal |
| Generic table skeleton inside activity | Reserved activity and overview shapes | Loading matches content without fabricated figures |

## Test intent and corrections

- Font guard initially rejected approved `font-family: var(...)` declarations.
  It now allows only the three approved font-variable declarations, retaining
  bans on literal font names, stray hexadecimal colors and broad transitions.
- AppShell tests now provide QueryProvider/MSW because the footer queries data;
  original landmarks, skip link and active-page assertions remain intact.
- Dashboard recent-list tests isolate the new twelve-upload request while
  retaining five-row limit, links, dates, retry and empty-state assertions.
- At the coordinator's request, the existing em-dash missing counter became
  `Not yet`. The test still distinguishes null, zero and a grouped numeric value.
- Next rejected an extracted options object for `next/dynamic`; literal options
  fixed the actual build failure. ESLint originally included generated isolated
  output; `.next-*/**` is excluded alongside `.next/**`, without weakening rules.
- A composed-hover check exposed 31 failing gradient/background samples because
  opacity faded both the button and its text. Replacing it with a reduced-motion-safe
  one-pixel transform made all hover samples pass. A separate source stacking
  test observed skip-link layer 10 below navigation layer 30, then passed at 40.
  The light error card in the graphite rail also receives its own strong focus
  outline instead of inheriting the rail's light-on-dark outline.
- RTL chart geometry uses an explicit 480 by 240 layout fixture because jsdom
  provides zero dimensions. It verifies area registration and zero-total paths,
  not browser layout or visual quality. No invented RED for presentation-only
  integrations; observed RED failures are cited in the relevant commits.

## Verification checkpoint

| Check | Actual result |
|---|---|
| `bun run lint` | Exit 0 |
| `bunx tsc --noEmit` | Exit 0 |
| `bun run test` | Exit 0, 281 tests in 36 files |
| Contrast/usage suite | 99 passing cases: text, badges, graphite, gradient/hover samples and essential strokes |
| `NEXT_DIST_DIR=.next-redesign bun run build` | Exit 0, all routes generated |
| Source AST check | 116 files, 485 functions, zero `any`; maximum 290 file lines and 26 function lines |
| `openspec validate frontend-redesign` | Exit 0 |
| `npx impeccable --json --fast src` | Exit 0, `[]`; CLI reported `--fast` deprecated and ran its full scan |
| Backend diff against base | Empty |

Two independent source assessments were timeboxed and stopped without final
reports. No findings or scores are attributed to them. Main performed the
bounded source audit and local detector directly after stopping them. Visual
critique remains incomplete without the assigned rendered review; no Nielsen,
LCP, CLS or visual-quality score is invented.

## Pending verifier evidence

- Tasks 4.3 and 4.4 remain unchecked: fresh 360/1280 normal/reduced review,
  full E2E/axe, screenshots and README images belong to worker2.
- The isolated build embeds `http://localhost:3001/api/v1`, verified in its JS.
  A verifier targeting API port 3301 must build with that public API URL;
  changing only the start environment cannot change the embedded URL.
- Next reports the unrelated parent pnpm lockfile is ignored. Builds succeed;
  no unrelated root/configuration cleanup was performed.
- Performance budgets are not claimed met. The next performance change requires
  measurements from the verifier's real production stack.
