## Why

The first interface is correct and accessible but flat: a warm paper palette, one type voice and a plain card list. Nico asked for something closer to modern analytics boards, with real visible change. The
product deserves an interface that reads as a modern analytics tool at first glance and organizes its information so the
state of the work is visible in seconds. This change redesigns the visual system and the layout without changing any behaviour.

## What Changes

- Replace the visual system with "Carbon Day": a bright canvas with frosted white cards, an orange-to-red gradient, dark graphite panels, a white sidebar, new typography
  (Sora, Geist, Geist Mono) and updated tokens.
- Add the application shell with a sidebar and a responsive top bar.
- Rebuild the dashboard as a bento grid with an activity area chart, a completion donut, status bars, a latest upload card
  and the recent uploads table, all drawn in SVG from real API data.
- Restyle the uploads list, the upload page and the detail page with the same system and better information structure.
- Add a new brand mark and lockup, a redesigned navigation (sidebar and mobile drawer) and a live API status indicator.
- Build on shadcn/ui and Recharts, with two React Bits components, instead of hand made primitives.
- No change to the API, the hooks, the polling rules or the routes. All existing behaviour tests keep passing.

## Capabilities

### New Capabilities
- `visual-system`: tokens, fonts, motion and accessibility rules of Carbon Day
- `brand-and-navigation`: logo, lockup, favicon, sidebar, mobile drawer and API status
- `dashboard-layout`: shell, bento grid and the SVG charts
- `pages-restyle`: list, upload and detail pages in the new system

### Modified Capabilities
- `design-system`: tokens and typography change; the rules about no stray colors, no transition all and reduced motion remain

## Impact

- Frontend only. New runtime dependencies: `recharts`, `motion`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge` and the Radix packages that shadcn components require. Fonts through `next/font`. Licenses are recorded in the README.
- `frontend/DESIGN.md` is replaced by v2. Screenshots for the README are regenerated.
