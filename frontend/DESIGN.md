# CarbonBox Uploads — Design System

Source of truth for every interface decision in `frontend/`. Read it before touching UI.

## Direction

A ledger for emissions data: calm, precise, editorial. Numbers are the hero, so they get the
serif display face and tabular figures; everything else stays quiet. Warm paper background, deep
green-black ink, one moss accent. Status colors are the only saturated colors on screen, so state is
readable at a glance.

Memorable detail: stat figures set in a soft serif with a thin ruled underline, like a printed
report, and a progress bar that breathes while a file is being processed.

## Tokens

Defined once as CSS variables in `src/app/globals.css` and exposed to Tailwind through `@theme`.

| Token | Value | Use |
|---|---|---|
| `--paper` | `#F6F3EC` | page background |
| `--surface` | `#FCFBF8` | cards, table, inputs |
| `--ink` | `#14201A` | body text (contrast on paper 15.5:1) |
| `--ink-muted` | `#55645B` | secondary text (contrast 5.6:1) |
| `--line` | `#DAD5C7` | borders, rules |
| `--accent` | `#1F5B3A` | primary action, focus ring |
| `--accent-ink` | `#FFFFFF` | text on accent |
| `--pending` / `--pending-bg` | `#8A5A00` / `#FBEFD0` | PENDING badge (yellow) |
| `--processing` / `--processing-bg` | `#1B4FBF` / `#E1EAFB` | PROCESSING badge (blue) |
| `--completed` / `--completed-bg` | `#14633A` / `#DBF1E2` | COMPLETED badge (green) |
| `--failed` / `--failed-bg` | `#A82116` / `#FBE2DF` | FAILED badge (red) |

All text and badge pairs meet WCAG AA (4.5:1). No dark mode in this version; documented limitation.

## Typography

Loaded with `next/font/google`, self hosted, `display: swap`.

- Display: **Fraunces** (variable, optical size). Page titles and stat figures.
- Body: **Instrument Sans**. Interface text.
- Data: **JetBrains Mono**. File names, ids, table numerals; always `font-variant-numeric: tabular-nums`.

Scale: 12 / 14 / 16 / 20 / 28 / 44 px. Line height 1.5 body, 1.15 display. Max line length 70ch.

## Layout

- Container max width 1080 px, side padding 20 px on mobile, 32 px from 768 px.
- 4 px spacing unit; sections separated by 40 px.
- Tables scroll horizontally inside their card on narrow screens; they never break the page.
- Single column below 640 px; stat cards 2 by 2 from 640 px, 4 across from 1024 px.

## Components

- **StatusBadge**: pill, 12 px uppercase label with a leading 6 px dot. The dot pulses slowly only for PROCESSING.
- **StatCard**: label, display figure, thin rule. Figure is a link target only when it filters something.
- **Button**: primary (accent fill), secondary (surface with border). 40 px high, 12 px radius. Pressed state scales to 0.97.
- **Dropzone**: dashed border card, whole area is a `<label>` for the file input so it is keyboard and screen reader operable.
- **ProgressBar**: determinate (upload) fills with `transform: scaleX`; indeterminate (processing) slides a segment. Always paired with a text figure.
- **Pagination**: previous / next with "Page X of Y", disabled state at the ends.
- **States**: every data view has loading (skeleton shaped like the final content), empty (one sentence and an action) and error (message, request id when present, retry button).

## Motion

Rules: purposeful, short, interruptible, and never on the layout itself.

- Easing `cubic-bezier(0.23, 1, 0.32, 1)` (ease out) for entrances; 160 ms for hover and press, 280 ms for entrances.
- Page load: stat cards and table rows fade and rise 8 px with a 40 ms stagger, once.
- Only `transform` and `opacity` are animated. No `transition: all`.
- Status change on the detail page crossfades the badge and the panel (200 ms).
- `prefers-reduced-motion: reduce` removes entrances, stagger, pulses and sliding; progress becomes a static bar with its figure.

## Accessibility

- Visible focus ring on every interactive element: 2 px accent outline with 2 px offset.
- Status and progress changes are announced: `aria-live="polite"` region on the detail page.
- Progress bars use `role="progressbar"` with `aria-valuenow` when known, and no value when indeterminate.
- Badges never rely on color alone; the label is always text.
- Touch targets at least 40 px. Table headers use `<th scope="col">`; links have discernible text.
- Tab order follows visual order; the dropzone and its errors are reachable and announced.

## Copy

English, short, concrete. Errors say what happened and what to do: "Only .csv files are accepted. Choose a file ending in .csv." No exclamation marks, no emoji.

## What this system does not do

No dark mode, no i18n, no authentication screens, no charts. Each is a deliberate omission for the scope of the exercise.
