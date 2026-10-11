import { expect, it } from "vitest";
import { runHttpSmoke } from "./tests/httpSmoke";

it("Real API and worker processes accept curl multipart and stop cleanly", async () => {
  const result = await runHttpSmoke();
  expect(result.postStatus).toBe(201);
  expect(result.upload).toMatchObject({ status: "COMPLETED", processedRows: 15, failedRows: 10, totalRows: 25 });
  expect(result.results).toEqual({ total: 15, rows: 15 });
  expect(result.stats).toEqual({ total: 1, completed: 1, inProgress: 0, failed: 0 });
  expect(result.paths).toContain("/api/v1/uploads/{id}/results");
  expect(result.apiExit).toEqual({ code: 0, signal: null });
  expect(result.workerExit).toEqual({ code: 0, signal: null });
}, 15000);
