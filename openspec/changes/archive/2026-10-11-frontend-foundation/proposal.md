## Why

The backend is done and documented. The user-facing half starts here: the visual language, the typed
connection to the API and the two read-only pages that need no file interaction, the dashboard and the
list of uploads. Building these first proves the data path from the API to the screen and fixes the
design system that the upload and detail pages will reuse.

## What Changes

- Add `frontend/DESIGN.md` as the single source of design decisions, and implement its tokens, fonts and motion rules.
- Add the application shell: layout, navigation, providers for React Query.
- Add the typed API client over Axios with error normalization and the query hooks.
- Add the shared components: status badge, stat card, button, pagination, skeleton, empty and error states.
- Add the dashboard page `/` and the uploads list page `/uploads`.
- Add the frontend test setup (Vitest, Testing Library, MSW).
- The upload page and the detail page are the next change.

## Capabilities

### New Capabilities
- `design-system`: tokens, typography, motion, accessibility rules and the shared components
- `api-client`: typed Axios client, error normalization, query hooks and polling policy
- `dashboard-page`: totals and the recent uploads
- `uploads-list-page`: paginated table with status badges and links

### Modified Capabilities
None.

## Impact

- New dependencies (dev): `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`, `msw`.
- All code under `frontend/src`. No backend change.
