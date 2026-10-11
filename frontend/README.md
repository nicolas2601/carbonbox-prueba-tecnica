# CarbonBox frontend

The activity ledger uses Next.js 16.4, React, TanStack Query, Axios and Tailwind CSS 4.
`DESIGN.md` is the visual source of truth: warm paper, semantic status colors,
Fraunces display figures, Instrument Sans text and JetBrains Mono data.

## Run

From this directory:

```sh
bun install
bun run dev
```

Configure `NEXT_PUBLIC_API_URL` using `.env.example`; the default is
`http://localhost:3001/api/v1`. The backend API and worker must also be running.
The API's `CORS_ORIGIN` must match the frontend origin. Public environment values
are embedded at build time; changing the API URL requires rebuilding.

```sh
bun run lint
bunx tsc --noEmit
bun run test
bun run build
bun run start
```

`next/font/google` downloads fonts during the first build and self-hosts them
thereafter. That first build requires network access. Next generates route types
at build time, so a fresh checkout should build before relying on generated types.

## Structure and behavior

- `src/app`: server layout and thin route composition. The uploads route resolves
  asynchronous `searchParams` inside Suspense, as required by Cache Components.
- `src/features/uploads`: client views and hooks. Data is deliberately fetched in
  the browser because it polls and reacts to navigation; there is no server API
  prefetch. The server does not share a browser QueryClient across requests.
- `src/lib/api`: one typed Axios client, normalized `ApiError` and key factory.
  Production explicitly prefers XHR before Fetch for upload progress support.
- `src/components`: accessible shell, states, badges, cards, buttons and pagination.

Upload detail and active list queries poll every 3000 ms for PENDING/PROCESSING;
terminal states stop polling. Dashboard totals poll every 5000 ms only while
`inProgress > 0`. Pagination lives in the URL and keeps previous rows visible.
Client errors are never retried; transient errors have bounded retries.

## Verification and scope

Vitest tests use Testing Library and MSW 3 to intercept actual Axios requests.
DOM tests choose the Fetch adapter only in test setup; production retains XHR
first. Multipart wire tests use native Node Web APIs because mixing jsdom File
objects with native Fetch produced empty blobs and parsing errors. Tests verify
multipart headers, filename and file bytes, not just a mocked call.

Current scope includes dashboard `/` and the paginated list `/uploads`. Creation
and detail links intentionally target the next module's routes; those pages are
not implemented yet. No authentication, dark mode, charts or i18n is included.
Motion is limited to transform/opacity; reduced motion removes entrances, stagger
and pulses. Processing pulses pause when offscreen. Verification also requires
Playwright checks of layout, focus and real API behavior at mobile and desktop widths.
