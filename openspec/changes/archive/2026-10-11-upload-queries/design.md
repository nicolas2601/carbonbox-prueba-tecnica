## Decisions

### A read port apart from the write ports
`IUploadQueries` returns plain read models, not aggregates. A list of uploads does not need the
behaviour of `Upload`, and building thousands of aggregates to show a table is waste. This is the
practical meaning of CQRS here: different models for reading and writing.

### Pagination is validated, not corrected
`page` is an integer of at least 1 (default 1) and `limit` an integer from 1 to 100 (default 10). A
value outside the range is an error (`InvalidPaginationError`, HTTP 400 later) instead of being
silently changed, so a client bug is visible. Skipping uses offset and limit, enough for the size of
the exercise; the alternative, keyset pagination, is noted for scale.

### Stable order
Uploads are sorted by `createdAt` descending, then `id`. Rows of an upload by `date`, then `id`.
Without a unique tie breaker, pages can repeat or skip rows when values are equal.

### Stats: one query, defined buckets
`total`, `completed`, `failed` and `inProgress` (`PENDING` plus `PROCESSING`) come from one grouped
count. The statement does not define "in progress"; this is the decision, documented in the API.

### Results of a missing upload are a 404, not an empty list
`GetUploadResults` first checks the upload exists. An existing upload without rows (still
processing, or failed) returns an empty page. A missing id returns `UploadNotFoundError`.

### Dates and decimals
Dates are returned as `YYYY-MM-DD` text for rows and ISO instants for upload times. `amount` is
returned as a number.

## Risks

- Offset pagination degrades on very deep pages; accepted for this scale and written in the README.
