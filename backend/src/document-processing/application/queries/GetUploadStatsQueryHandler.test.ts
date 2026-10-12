import { expect, it } from "vitest";
import { GetUploadStatsQueryHandler } from "./GetUploadStatsQueryHandler";
import { MemoryUploadQueries, view } from "./tests/MemoryUploadQueries";

it("Mixed states", async () => {
  const queries = new MemoryUploadQueries();
  ["PENDING", "PENDING", "PROCESSING", "COMPLETED", "COMPLETED", "COMPLETED", "FAILED"]
    .forEach((status, index) => { queries.uploads.push(view(`u${index}`, status)); });
  const result = await new GetUploadStatsQueryHandler(queries).execute();
  expect(result.isRight()).toBe(true);
  expect(result.value).toEqual({ total: 7, completed: 3, inProgress: 3, failed: 1 });
});
it("Empty database", async () => {
  expect((await new GetUploadStatsQueryHandler(new MemoryUploadQueries()).execute()).value)
    .toEqual({ total: 0, completed: 0, inProgress: 0, failed: 0 });
});
