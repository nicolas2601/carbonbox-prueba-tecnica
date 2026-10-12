## Why

Speed is part of quality and an interviewer will ask about it. Today nothing is measured: no bundle sizes, no page load figures, no API latency
under load. This change measures first, sets a budget, fixes what the numbers show and records before and after, so every claim about speed is evidence.

## What Changes

- Measure a baseline: frontend load metrics in a real browser (through Playwright MCP), bundle sizes, API latency under concurrent load and worker throughput.
- Set budgets and write them down.
- Improve the frontend: code splitting of charts, font weights and subsets, query caching and prefetch, layout stability, compression.
- Improve the API only where measurements support it: response compression, an evidence-supported results index and connection sizing. Upload data stays no-store; immutable hashed assets may cache.
- Re-measure and publish the before and after table in the README.
- No change in behaviour or in the contract.

## Capabilities

### New Capabilities
- `frontend-performance`: budgets and the changes that meet them
- `api-performance`: latency, throughput and database changes

### Modified Capabilities
None.

## Impact

- Frontend config and components; an optional additive index migration if the experiment supports it, and small Fastify plugin additions (`@fastify/compress`).
- A `docs/performance.md` with method, numbers and conclusions.
