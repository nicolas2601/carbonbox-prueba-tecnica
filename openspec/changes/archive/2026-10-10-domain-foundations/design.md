## Context

Bounded context `document-processing`, Clean Architecture. The domain layer imports nothing
from Prisma, Fastify or the filesystem. See `docs/plan.md` for the whole system.

## Decisions

### D1. Own `Either` class instead of a library
A small class with `Either.left`, `Either.right`, `isLeft`, `isRight`, `value`, `fold`, `map`
and `flatMap`. The exercise statement shows exactly this shape.
- Alternative: `fp-ts` or `neverthrow`. More powerful, but a large API to learn and defend for
  a feature that needs about 40 lines. No extra dependency either.

### D2. Row validity lives in the `ActivityData` entity
The CSV parser (next change) will build rows through `ActivityData.create` and collect the
`Left` values as row errors. The rules exist in one place instead of being repeated in the parser
and the entity.
- Alternative: validate in the parser and let the entity trust its input. Rejected: the entity
  could then be built in an invalid state by any other caller.

### D3. `Upload` is a mutable aggregate whose methods return `Either`
Each method (`startProcessing`, `recordProgress`, `complete`, `fail`) either changes the state and
returns `Right`, or leaves the state untouched and returns `Left`.
- Alternative: immutable objects returning a new `Upload`. Cleaner in theory, but every step of
  the worker would allocate a new object and the persistence mapping becomes less direct.

### D4. State machine

| From | To | Why it exists |
|---|---|---|
| PENDING | PROCESSING | a worker claimed the job |
| PENDING | FAILED | the job could not even start |
| PROCESSING | PROCESSING | the job was claimed again after a retry or an expired lease; counters restart |
| PROCESSING | COMPLETED | the file was fully handled |
| PROCESSING | FAILED | the file is unreadable or attempts ran out |

`COMPLETED` and `FAILED` are terminal. Re-entering `PROCESSING` is allowed on purpose: without it a
retried job could never run again.

### D5. Counter semantics
`processedRows` counts rows stored, `failedRows` counts rows rejected, and at completion
`processedRows + failedRows` must equal `totalRows`. The invariant is checked by the aggregate so
no caller can complete an upload with inconsistent numbers.

### D6. Time is passed in
Methods receive `now: Date`. Nothing in the domain calls `new Date()`, so tests are deterministic.

### D7. `FileName` rejects instead of sanitizing
A name containing a path separator or a NUL character is refused, not cleaned. Silent cleanup hides
bad input; refusing it keeps path-traversal attempts visible. The original name is only metadata,
the stored file gets a generated name in a later change.

## Risks / Trade-offs

- A mutable aggregate can be left half-updated by a bug. Mitigation: every method validates first
  and mutates last, and tests assert the state is unchanged after each rejected transition.
- `PROCESSING -> PROCESSING` widens the state machine. Mitigation: it is the only self-transition
  and it has its own scenario and test.
