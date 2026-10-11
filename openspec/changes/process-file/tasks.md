## 1. Ports and domain

- [x] 1.1 `JobClaim`, `StaleClaimError` and the ports with in-memory fakes
- [ ] 1.2 `Upload.complete` with optional summary

## 2. ProcessFile handler

- [ ] 2.1 Valid file: batches, counters per batch and `COMPLETED`
- [ ] 2.2 Rejected rows counted, summary stored
- [ ] 2.3 Invalid header ends `FAILED`
- [ ] 2.4 No valid row and header only end `FAILED`
- [ ] 2.5 Stale claim stops the work
- [ ] 2.6 Redelivery: terminal upload skipped, processing upload restarted
- [ ] 2.7 Unexpected errors propagate

## 3. Verification

- [ ] 3.1 `bun run typecheck` and `bun run test` pass, coverage not below the baseline
- [ ] 3.2 No `any`, files under 300 lines, functions under 40 lines
