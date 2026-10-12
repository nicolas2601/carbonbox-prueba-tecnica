## Decisions

### shadcn/ui and Recharts, not hand drawn charts
Nico asked for proven libraries. shadcn/ui gives accessible primitives (Radix) that we own as source and theme to the system; its
`chart` component wraps Recharts, so charts, tooltips and legends share one API. The cost is bundle weight; it is limited by loading the
chart components with a dynamic import on the dashboard only and by importing only the used Recharts parts. The default shadcn look is
replaced entirely by the Carbon Day tokens.

### React Bits, two components only
CountUp and SpotlightCard add life to the figures and cards. They are copied source, so they are adapted to our rules: reduced motion
renders the final value and no spotlight, and nothing animates outside transform and opacity except the CSS variables that place the
spotlight highlight, which is paint only and runs on pointer devices. More components were rejected to keep the page calm and fast.

### Real data only
The activity chart plots rows handled (processed plus rejected) of the latest uploads from the list endpoint; the donut and
bars use the totals endpoint. The API has no all time row total, so the card says "last 12 uploads" instead of implying one.
Rejected alternative: add a backend field now; the backend is closed and verified, and the honest label costs nothing.

### Bright with graphite panels, one theme
The references Nico chose are bright boards with dark panels for the key numbers. One theme is built and tested well; a second would double the contrast checks and the visual review, so a dark theme is listed as a limitation.

### Graphite rail as the anchor
The dark rail concentrates the figures that answer "is it healthy": the completion gauge, the four totals and the API status. Against the bright canvas it gives hierarchy without borders and matches the reference boards.

### Brand mark as a single SVG source
`LogoMark` is the only definition of the mark; the favicon is the same drawing exported. Lockup, favicon and README header cannot drift.

### Navigation shows real state
The sidebar footer shows whether the API answers, using the existing readiness endpoint. It is real information for an operator and costs one
request every 30 seconds.

### Behaviour is frozen
Hooks, polling, routes, copy used by tests and accessibility names stay the same, so the existing unit, integration and end to end suites
act as the regression net for the redesign.

## Risks

- A large visual change can hide regressions: the end to end suite and a fresh visual review at 360 and 1280 px are mandatory before closing.
- Dark UI contrast is easy to get wrong; a test verifies every text and badge pair.
