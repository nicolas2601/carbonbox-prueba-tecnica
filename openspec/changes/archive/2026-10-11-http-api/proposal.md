## Why

All the logic exists and is tested without a network. This change opens it to the world: the five
HTTP endpoints of the exercise, one consistent error format, a documented contract (OpenAPI with
a browsable page) and the process that serves it. It is a thin layer on purpose: controllers
translate HTTP to a command or query and the result back to HTTP, nothing more.

## What Changes

- Add the five endpoints under `/api/v1`: upload a file, list uploads, get one upload, get its rows, get the dashboard totals.
- Add one error envelope `{ "error": { "code", "message" } }` and a mapping from error code to HTTP status.
- Add a central error handler for what is unexpected, a not found handler and validation errors for bad input.
- Enforce the upload size limit at the edge, before anything is stored.
- Add OpenAPI documentation generated from the route schemas, served as JSON and as a web page.
- Add a readiness check that reports whether the database answers.
- Add the composition root of the API and start/stop of the server process.
- No business rule is added or changed.

## Capabilities

### New Capabilities
- `http-routes`: the five endpoints, request validation and responses
- `http-errors`: error envelope, status mapping and the central handlers
- `api-docs`: OpenAPI generation and the documentation page

### Modified Capabilities
None.

## Impact

- New runtime dependencies: `@fastify/swagger`, `@fastify/swagger-ui`.
- New code under `backend/src/document-processing/presentation` and `backend/src/main`.
- Tests: Fastify `inject` with the real database, files and worker.
