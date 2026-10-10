# CarbonBox - Asynchronous Document Processing

Work in progress. Upload CSV files with activity data, process them asynchronously
and show the results.

This README is completed at the end of the exercise (architecture, decisions,
known limitations and how to try it).

## Layout

| Path | Purpose |
|---|---|
| `backend/` | Fastify + Prisma API and the file processing worker |
| `frontend/` | Next.js (App Router) application |
| `samples/` | CSV fixtures for edge cases, with expected results in `samples/EXPECTED.md` |
| `scripts/` | Fixture generator |
| `docs/` | Architecture notes and the AI usage log |
| `sample-data.csv` | 60 valid rows to try the system quickly |
