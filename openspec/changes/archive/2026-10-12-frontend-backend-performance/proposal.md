## Why

Speed is part of quality and an interviewer will ask about it. Today nothing is measured: no bundle sizes, no page load figures, no API latency
under load. This change measures first, sets a budget, fixes what the numbers show and records before and after, so every claim about speed is evidence.

## What Changes

- Measure API latency under 20 concurrent connections and worker throughput using owned disposable databases, retaining raw before/candidate/after evidence.
- Record the reference-machine API budget and response wire bytes; retain gzip only when list/results bandwidth reduction meets the agreed gate.
- Verify existing frontend structural safeguards from M7/M8: dashboard-only lazy charts, font roles/subsets and terminal polling stop. No new frontend performance tuning or cold-load result is claimed.
- Improve the API only where measurements support it: response compression, an evidence-supported results index and connection sizing. Upload data stays no-store; immutable hashed assets may cache.
- Re-measure the API/worker profiles and publish their before/after tables and tradeoffs in the performance document and backend README.
- No change in behaviour or in the contract.

## Capabilities

### New Capabilities
- `frontend-performance`: verified lazy-chart, font configuration and terminal-polling safeguards, without unmeasured browser budgets
- `api-performance`: latency, throughput and database changes

### Modified Capabilities
None.

## Impact

- No frontend tuning or production index migration was adopted. The measured candidate failed the HTTP/write gate; the retained Fastify change is negotiated gzip plus no-store upload data.
- A `docs/performance.md` with method, numbers and conclusions.

## Deferred

Browser route/transfer measurements, three-cold-load LCP/CLS medians, the 200 KB
dashboard budget, font request/preload budgets, explicit query stale-time/prefetch
tuning and frontend asset/cache/layout-shift audits remain unverified. The
assigned browser baseline was not delivered; screenshots and successful builds
are not substituted for it. The alternate pool/batch matrix was explicitly
excluded because the measured defaults already meet the API budget. These limits
are recorded in `tasks.md` and do not become normative archived requirements.
