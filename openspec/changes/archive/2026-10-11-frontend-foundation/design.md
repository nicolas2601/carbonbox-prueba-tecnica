## Decisions

### Features folder, thin pages
Pages in `src/app` only compose. Behaviour lives in `src/features/uploads` (hooks and components) and
transport in `src/lib/api`. A component never calls Axios; a hook never renders.

### One Axios instance, one error type
The base URL comes from `NEXT_PUBLIC_API_URL`. A response interceptor converts any failure into `ApiError`
with `code`, `message`, `status` and `requestId` read from the backend envelope, or a network error code when
there is no response. Screens show `message`; they never parse Axios errors.

### Query keys are a factory
`uploadKeys.list(page, limit)`, `uploadKeys.detail(id)`, `uploadKeys.results(id, page, limit)`, `uploadKeys.stats()`.
Invalidation after an upload targets `all`, so the dashboard and list are fresh without manual refetch.

### Polling is a pure function of the data
`refetchInterval` is computed from the latest response: 3000 ms while the status is PENDING or PROCESSING, false
otherwise. The statement says to poll only PROCESSING; a freshly created upload is PENDING for a moment, and
stopping there would freeze the page, so both are polled. The dashboard polls every 5000 ms only while
`inProgress` is greater than zero.

### URL is the state of the list
The page number lives in `?page=`, so reload, back and shared links work. Changing page keeps the previous page's
data visible (`placeholderData: keepPreviousData`) to avoid flicker.

### Client components where needed
The layout is a server component. Pages that fetch are client components, because they poll and react to user
input; this is stated in the README so it is not mistaken for an accident.

### Testing the UI
Hooks and components are tested with MSW intercepting the real Axios calls, so the contract with the API is part of
the test. Timers are faked to prove the polling rule without waiting.

## Risks

- Fonts are loaded from Google at build time; the build needs network once. Documented in the README.
- Without totals during processing, progress is indeterminate with live counters. Honest, but less pretty than a percentage.
