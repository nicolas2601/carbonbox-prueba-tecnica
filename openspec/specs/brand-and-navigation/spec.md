# brand-and-navigation Specification

## Purpose
TBD - created by archiving change frontend-redesign. Update Purpose after archive.
## Requirements
### Requirement: One brand mark, many uses
The system SHALL define the logo once as `LogoMark` (inline SVG, 48 by 48 viewBox) and a `Lockup` that adds the wordmark, and SHALL export the same drawing as
`public/favicon.svg` and an Apple touch icon. The mark SHALL be decorative when next to the wordmark and carry the label "CarbonBox" when alone.

#### Scenario: Accessible names
- **WHEN** the lockup renders
- **THEN** the mark is hidden from assistive technology and the wordmark text provides the name

#### Scenario: Alone
- **WHEN** the mark renders by itself
- **THEN** it exposes the accessible name "CarbonBox"

#### Scenario: Favicon
- **WHEN** the page is loaded
- **THEN** the document links the SVG favicon and the Apple touch icon

#### Scenario: Legible when small
- **WHEN** the mark renders at 16 px and at 64 px
- **THEN** both sizes keep the box and the leaf distinguishable (reviewed in the screenshots)

### Requirement: Desktop navigation
The system SHALL render at 1024 px and above a sidebar with the lockup, links to Dashboard, Uploads and Upload a file with icons, one non-duplicated upload action, and the live completion mini gauge. The
current link SHALL have `aria-current="page"` and an active pill that moves between items with a shared layout transition.
The sidebar mini gauge SHALL use native SVG and the shared completion-share calculation, not load Recharts into the shared shell.

#### Scenario: Current page
- **WHEN** the user is on `/uploads`
- **THEN** the Uploads link has `aria-current="page"` and shows the active pill

#### Scenario: Pill moves
- **WHEN** the user navigates to another section
- **THEN** the pill moves to the new item using a transform

#### Scenario: Reduced motion
- **WHEN** the user prefers reduced motion
- **THEN** the pill changes position without animation

### Requirement: Mobile navigation
The system SHALL render below 1024 px a top bar with the lockup and a menu button that opens a drawer with the same links, trapping focus, closing with Escape, on outside tap and after navigating.

#### Scenario: Open and close
- **WHEN** the menu button is activated and then Escape is pressed
- **THEN** the drawer opens with focus inside it and closes returning focus to the button

#### Scenario: Navigate
- **WHEN** a link in the drawer is activated
- **THEN** the page changes and the drawer closes

### Requirement: Live API status
The system SHALL show in the navigation an indicator of whether the API is ready, using the readiness endpoint every 30 seconds, with a tooltip and an accessible text.

#### Scenario: Online
- **WHEN** the readiness answer is 200
- **THEN** the dot is green and the text says the API is online

#### Scenario: Offline
- **WHEN** the readiness request fails or answers 503
- **THEN** the dot is red and the text says the API is not reachable

