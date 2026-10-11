## Decisions

### Claim with one statement
`UPDATE jobs SET ... WHERE id = (SELECT id FROM jobs WHERE status = 'QUEUED' AND availableAt <= $now
AND (lockedUntil IS NULL OR lockedUntil <= $now) ORDER BY availableAt FOR UPDATE SKIP LOCKED
LIMIT 1) RETURNING ...`. `SKIP LOCKED` makes two workers pick different rows instead of waiting for
each other. The update sets a new `claimToken` (a random uuid), `lockedUntil = now + visibility`
and `attempts = attempts + 1`. An expired lease is claimable again, which is how a dead worker's
job comes back.

### The fence is the token, not the clock
Every write checks `claimToken = <mine>` on the job row inside its own transaction. The token only
changes when someone reclaims the job, so a slow worker that still holds the current token may
keep going, and one that lost it is rejected on its next write. No clock comparison is needed
for correctness; the lease only decides when a job becomes claimable.

### Time is a parameter
The columns are `timestamp` without time zone. Letting SQL call `now()` mixes the server clock
with application dates. Every method receives `now` and passes it as a parameter. Tests can
therefore expire a lease by passing a later `now`, without sleeping.

### Heartbeat inside the batch write
`saveBatch` also sets `lockedUntil = now + visibility`. A worker that keeps saving batches keeps
its job; one that stops loses it. No separate timer or thread.

### Retry versus dead
`fail(claim, reason, now, permanent)` is fenced too. If `permanent` is true or `attempts` has
reached `maxAttempts`, the job becomes `DEAD` and the upload becomes `FAILED` with the reason, in
one transaction. Otherwise the job returns to `QUEUED` with `availableAt = now + base * 2^(attempts-1)`,
the lease cleared and `lastError` stored.

### Finish closes both states together
`finish` writes the final upload fields and sets the job to `DONE` in one transaction, so the
upload can never say `COMPLETED` while its job is still queued.

## Risks

- Transaction isolation: the fence check and the write run in one transaction with a row lock
  (`SELECT ... FOR UPDATE` on the job) so a reclaim cannot slip between them. Tests prove it with
  two interleaved callers.
- A very large batch holds the transaction longer; the batch size is configurable.
