# AI usage log

Working notes kept while building, so `USO-DE-IA.md` reflects what really happened
instead of being reconstructed from memory. Entries are factual: what the AI produced,
what was verified, and what had to be corrected.

## 2026-10-10

### Planning
- Claude Code read the exercise statement and listed inconsistencies. Each one was
  checked against the document before being accepted:
  - the in-memory mock queue cannot connect an API process and a separate worker process
  - the flow publishes the job before the upload record exists
  - polling only covers `PROCESSING`, so a fast first poll can see `PENDING` forever
  - the dashboard needs counts that no endpoint provides
  - the optional bonus items add up to 28 points while the stated cap is 20 (the AI
    first reported 26; recounting gave 28)
- A second Claude session reviewed the same document independently. Its suggestions
  were accepted where it was right (durable queue in PostgreSQL, no artificial delays,
  manual dependency injection) and rejected where it was not (Convict is kept because
  the reference tree names it).

### Setup
- Claude Code scaffolded the repository, the Bun-managed backend and frontend, the Prisma
  schema and the initial migration.
- The request was to use the most recent versions. Each one was checked against npm and
  then against the project instead of assuming:
  - Prisma: the CLI `latest` tag points to a release candidate (8.0.0-rc) while
    `@prisma/client` `latest` is 7.10.0, so there is no stable 8.x pair. Prisma 7.10 is used.
  - TypeScript 7.0.2 works in the backend (typecheck and tests pass) but not in the
    frontend: `typescript-eslint` throws "does not support TS 7.0", so lint crashed. The
    frontend uses TypeScript 6.0.3 with ESLint 10.12 (lint, tsc and build pass).
  - The first diagnosis was wrong: the crash was blamed on ESLint 10 and ESLint was
    downgraded to 9 before reading the error message, which still failed. Reading the
    first lines of the error showed the real cause.
  - `@types/node` stays on 22 to match the declared minimum Node version (20.9).
- Prisma 7 changed its configuration (`prisma.config.ts`, `prisma-client` generator,
  driver adapter). The current docs were read through Context7 instead of relying on
  memory.
- The health endpoint was written test-first: the test failed with
  `Cannot find module './App'` before the class existed.
- The second Claude session generated the CSV fixture generator. Its output was
  regenerated and compared byte for byte, and row counts were checked with `wc -l`.
