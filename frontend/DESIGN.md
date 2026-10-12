# CarbonBox Uploads: Design System v2.2 "Carbon Day"

Source of truth for every interface decision in `frontend/`. Read it before touching UI. It replaces v1 (warm paper and serif),
which tested as correct but flat. References chosen by Nico live in `docs/design-references/` (light bento boards with white
glass cards, orange to red mountain charts, dark graphite panels and big radial gauges).

## Direction

A bright analytics workspace with dark graphite panels for the numbers that matter. Solid, cool tinted cards float on a cool light
canvas; one warm orange-to-red gradient draws the gauge sweep and the primary
action; graphite panels carry the key figures like the dark rail of the reference boards. Numbers are the hero: large, geometric,
tabular. No fixed landscape or interpolated curve is drawn inside the data plot. One stacked bar is one upload, for every sample size.

Memorable details: the warm real-data activity chart, the big radial gauge on the graphite rail, the animated active pill in the
navigation and status dots that breathe only while a file is processed.

Scene: an emissions analyst on a 27 inch monitor in a bright office, checking between meetings whether yesterday's uploads finished and
what was rejected. Daylight and long glances force a light canvas; the graphite rail is the one place for numbers that must stand out.

Impeccable alignment: solid tinted surfaces, asymmetric bento spans, compact contextual counts and one large completion gauge.
No generic four-card metric grid, glass everywhere, pure white or black, gradient text, side stripes, em dashes or bouncing motion.
Backdrop blur is reserved for the drawer overlay and sticky mobile top bar.

## Tokens

CSS variables in `src/app/globals.css`, exposed to Tailwind through `@theme`; shadcn variables map onto them. No hex colors anywhere else.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#EBEEF1` | canvas (a soft vertical gradient to `#DDE2E8` at the bottom) |
| `--surface` | `#FAFBFC` | solid, cool tinted cards with a subtle inner highlight |
| `--surface-solid` | `#F5F7F8` | sidebar and inputs |
| `--table-surface` | `#FBFCFD` | table body |
| `--line` | `rgba(18,24,27,0.08)` | borders and rules |
| `--text` | `#12181B` | primary text (about 17:1 on white) |
| `--text-muted` | `#57656D` | secondary text (about 6:1 on white) |
| `--accent` | `#F26B2A` | gradient start, fills, chart line, gauge; never small text |
| `--accent-2` | `#E5483B` | gradient end |
| `--accent-strong` | `#BF3F0B` | links and small accent text (about 5.6:1 on white) |
| `--accent-ink` | `#1A0E07` | text on accent fills (about 6.5:1) |
| `--graphite` | `#171D21` | dark panels and the rail |
| `--graphite-2` | `#222B31` | raised areas inside dark panels |
| `--on-graphite` | `#EEF2F0` | text on graphite (about 15:1) |
| `--on-graphite-muted` | `#9FB0B7` | secondary text on graphite (about 7:1) |
| `--pending` / `--pending-bg` | `#8A5A00` / `#FBEFD0` | PENDING |
| `--processing` / `--processing-bg` | `#1B4FBF` / `#E3ECFD` | PROCESSING |
| `--completed` / `--completed-bg` | `#0F6B3F` / `#DDF3E6` | COMPLETED |
| `--failed` / `--failed-bg` | `#A82116` / `#FBE4E1` | FAILED |
| `--teal` | `#0E9F8E` | secondary series and "healthy" accents (graphics only) |

All text and badge pairs meet WCAG AA (4.5:1); essential graphics need 3:1 against their background. A test verifies the pairs.
On light surfaces, the activity line and progress outline use `--accent-strong`; orange gradient fills are decorative.
Canvas links use `--text`, with accent underlines: accent-strong on canvas-bottom measured 4.10:1, below the small-text threshold.

Depth: soft, cool, wide shadows (`0 18px 40px -22px rgba(18,24,27,0.25)`), no black drop shadows. The orange card glow uses the accent at 18 percent.

## Typography

`next/font/google`, self hosted, `display: swap`, latin subset only.

- Display and figures: **Sora** 400 to 600. Titles, stat figures, gauge numbers.
- Interface: **Geist**. Navigation, labels, body.
- Data: **Geist Mono**. File names, ids, table values; always `font-variant-numeric: tabular-nums`.

Scale 12 / 14 / 16 / 20 / 28 / 56. Figures 56 px weight 600, tight tracking. Max line length 70ch.

## Brand

The mark is an isometric box in two teals with an orange leaf growing out of its open top: data goes in, something living grows
out. It is a single inline SVG (`LogoMark`, 48 by 48 viewBox, source in `assets/logo-mark.svg`) that stays legible from 16 px (favicon)
to 64 px, works on white, graphite and the canvas, and is exported as `public/favicon.svg`. The wordmark sets "Carbon" in Sora 600 and
"Box" in Sora 400. Next to the wordmark the mark is decorative (`aria-hidden`); alone it carries `aria-label="CarbonBox"`.

## Navigation

- Desktop (from 1024 px): a solid tinted sidebar of 248 px with the lockup, three links with icons (Lucide, stroke 1.75) and an animated
  active pill that glides between items (shared layout transition, transform only), and a footer
  with an API status dot (green online, red offline, from the readiness endpoint every 30 s) with a tooltip. Its completion mini indicator
  uses native SVG so the shared shell never loads Recharts.
- Below 1024 px: a slim top bar with the lockup and a menu button that opens a drawer (shadcn Sheet) with the same links; focus trapped,
  Escape and outside tap close it.
- The current page carries `aria-current="page"`.

## Layout

- Three zones from 1280 px: sidebar (248), content (flexible, max 1000), graphite rail (320). Between 1024 and 1279 px the rail
  becomes a graphite band under the page header; below 1024 px everything is one column.
- Dashboard content: header (title, subtitle, the primary Upload button); the **Activity** card with per-file stacked bars; three cards in a row
  (Completion donut, Status bars, Latest upload); the Recent uploads table. The rail holds the big radial gauge of completion, four
  compact counts (total, completed, in progress, failed) and the API status. The gauge is the only large figure; contextual facts explain the counts.
- 16 px gaps, 24 px card padding, 20 px card radius. Tables scroll inside their card on narrow screens; the list becomes stacked rows below 640 px.

## Libraries

- **shadcn/ui** as the component base (Button, Card, Badge, Table, Skeleton, Sheet, Tooltip, Separator, Chart), copied into `src/components/ui`
  and fully themed with the tokens above; the generic default look is not acceptable.
- **Recharts** through shadcn `chart` for every chart, loaded only on the dashboard with a dynamic import.
- **React Bits** components copied and adapted, limited to two: CountUp for the figures and SpotlightCard for the card hover light. Both
  respect reduced motion and the animation rules; their license is checked and recorded in the README.
- **motion** for the sidebar pill and entrances. **Lucide** for icons.

## Components

- **Card**: solid `--surface`, 20 px radius, hairline and subtle inner highlight. No backdrop blur.
- **GraphiteCard**: `--graphite`, same radius, `--on-graphite` text, used for the rail and any key figure.
- **StatCard**: compact label and inline CountUp figure with caption. No standalone hero-metric grid.
- **ActivityChart**: Recharts stacked processed/rejected bars for the latest 12 uploads, one bar per file at any sample size.
  Filename/time ticks (UTC), compact numeric Y ticks and reserved axis width; full metadata tooltip and matching hidden table.
  No interpolation, decorative peaks or geometry animation; empty state when no uploads and unreported counters labelled honestly.
- **Gauge**: Recharts radial bar of the completed share with the percentage in the center, gradient sweep, soft inner track.
- **StatusBars**: Recharts horizontal bars for completed, in progress and failed, with counts.
- **StatusBadge**: pill with dot; the dot pulses only for PROCESSING.
- **Button**: primary (accent gradient fill, accent-ink text), secondary (white with hairline). 44 px high, 14 px radius. Press scale 0.97, release 100 ms.
- **Dropzone**: large card with a dashed accent border; on drag the border turns solid and an accent glow appears with opacity only.
- **ProgressBar**: determinate segmented; indeterminate slides a segment.
- **Table**: sticky header, 56 px rows, hover raises the row, numbers right aligned in mono.
- **States**: skeleton shaped like the content, empty with one action, error with retry and request id.

## Motion

- Easing `cubic-bezier(0.23, 1, 0.32, 1)`; 160 ms hover and press, 280 ms entrances, 700 ms chart reveal.
- First load: cards rise 8 px and fade, 40 ms stagger, once. Activity bar geometry remains static; the gauge sweeps with a rotation transform.
- Only `transform` and `opacity` animate. No `transition: all`.
- Table text does not fade on entrance: transient opacity lowers contrast. Hover keeps the transform-only feedback.
- `prefers-reduced-motion: reduce` removes entrances, reveals, sweeps, pulses, sliding and the CountUp (final value shown at once).

## Accessibility

- Visible focus ring: 2 px `--accent-strong` outline with 2 px offset on every interactive element (on graphite, `--on-graphite`).
- Charts have a text alternative: a visually hidden table with the same numbers and `role="img"` with a label.
- Status and progress changes are announced in a polite live region; gauge and bars never rely on color alone.
- Touch targets at least 44 px; skip link and landmarks kept; contrast pairs verified by a test.

## Performance budget

Part of the design: first load JS of the dashboard at most 200 KB gzip, only the used font weights, LCP at most 1.8 s and CLS at most 0.05 on a cold
load of the production build on localhost; charts are code split. The budget and the measurements live in the performance change.
These are deferred measurement targets, not verified cold-load results. The
completed performance scope records API/worker numbers and structural frontend
safeguards; no screenshot or successful build proves the browser budgets.

## Copy

English, short, concrete. Labels say what is measured: "Rows in the last 12 uploads", never an invented total.

## What this system does not do

No dark theme, no i18n, no authentication screens, no stock photography. Charts use only real API data; where the API does not provide a figure, the
label states the period it covers.
