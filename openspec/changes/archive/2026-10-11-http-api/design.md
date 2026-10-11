## Decisions

### Thin controllers, one mapping table
A controller calls a handler, gets an `Either`, and a single function turns the left side into a
status and an envelope using a table keyed by error code. Adding an error means adding one row. No
`try/catch` in controllers: expected failures are values, unexpected ones reach the central handler.

### 4xx explain, 5xx hide
Client errors carry the specific message (which field, which limit). Server errors always return
the same generic message and a request id; the real cause goes to the log with that id. The caller
can report the id, and internals never leak.

### The size limit is enforced while streaming
The upload stream is wrapped in an iterator that counts bytes and throws a file too large error past
`MAX_UPLOAD_MB`, setting a flag. The storage wraps stream errors in its own error, so the controller
looks at the flag: if it is set, the answer is 413 instead of 500. The limit stops the read before the
upload and the job are stored. Rejected alternative: rely on the multipart plugin truncating, which
would store a cut file and queue it.

### Validation by schema, translated to the envelope
Query and path parameters are declared as JSON Schema, which also feeds the documentation. Framework
validation errors are converted to the same envelope with code `VALIDATION_ERROR`. The pagination rules
still live in the query handlers; the schema only checks types so that the domain rule has one home.

### Documentation is generated, not written
OpenAPI comes from the same schemas that validate the routes, so the contract and the code cannot
drift. A test fails if one of the five paths is missing from the generated document.

### Single user
There is no authentication in the exercise. Every upload belongs to the fixed user `anonymous`, held
as a documented constant. This is a stated limitation, with the AWS diagram showing where an
identity provider would sit.

### Readiness is separate from liveness
`/health` answers if the process runs. `/health/ready` also asks the database and answers 503 if it
does not, which is what a container orchestrator needs.

## Risks

- Multipart edge cases (no file, wrong field name, two files, wrong content type) must each give a clear
  4xx; all are covered by scenarios.
- No rate limiting: documented as a known limitation and shown on the diagram.
