import { expect, it } from "vitest";
import { GetUploadStatsQueryHandler } from "./GetUploadStatsQueryHandler";
import { MemoryUploadQueries, view } from "./tests/MemoryUploadQueries";

it("Mixed states", async () => {
  const queries = new MemoryUploadQueries();
  const rows = [
    ["PENDING", 10, 2], ["PENDING", 1, 0], ["PROCESSING", 3, 1], ["COMPLETED", 20, 4],
    ["COMPLETED", 5, 0], ["COMPLETED", 4, 0], ["FAILED", 0, 8],
  ] as const;
  rows.forEach(([status, processed, rejected], index) => {
    const upload = view(`u${index}`, status);
    upload.processedRows = processed;
    upload.failedRows = rejected;
    queries.uploads.push(upload);
  });
  const result = await new GetUploadStatsQueryHandler(queries).execute();
  expect(result.isRight()).toBe(true);
  expect(result.value).toEqual({ total: 7, completed: 3, inProgress: 3, failed: 1,
    pending: 2, processing: 1, processedRows: 43, rejectedRows: 15 });
});
it("Empty database", async () => {
  expect((await new GetUploadStatsQueryHandler(new MemoryUploadQueries()).execute()).value)
    .toEqual({ total: 0, completed: 0, inProgress: 0, failed: 0, pending: 0, processing: 0,
      processedRows: 0, rejectedRows: 0 });
});
it("Null row counters contribute zero without losing the upload status", async () => {
  const queries = new MemoryUploadQueries();
  queries.uploads.push(view("pending", "PENDING"), view("processing", "PROCESSING"));
  const result = await new GetUploadStatsQueryHandler(queries).execute();
  expect(result.value).toEqual({ total: 2, completed: 0, inProgress: 2, failed: 0, pending: 1,
    processing: 1, processedRows: 0, rejectedRows: 0 });
});
