import { expect, it, vi } from "vitest";
import { GetUploadResultsQueryHandler } from "./GetUploadResultsQueryHandler";
import { UploadNotFoundError } from "./UploadNotFoundError";
import { InvalidPaginationError } from "./InvalidPaginationError";
import { MemoryUploadQueries, view } from "./tests/MemoryUploadQueries";

it("Rows are ordered and isolated by upload", async () => {
  const queries = new MemoryUploadQueries();
  queries.uploads.push(view("u1"), view("u2"));
  queries.rows.set("u1", [
    { category: "Water", amount: 10, unit: "m3", date: "2024-01-15" },
    { category: "Waste", amount: 20, unit: "kg", date: "2024-01-11" },
    { category: "Travel", amount: 30, unit: "km", date: "2024-01-16" },
  ]);
  queries.rows.set("u2", [{ category: "Other", amount: 100, unit: "m3", date: "2024-01-10" }]);
  const result = await new GetUploadResultsQueryHandler(queries).execute({ uploadId: "u1" });
  if (result.isLeft()) throw result.value;
  expect(result.value).toMatchObject({ total: 3, page: 1, limit: 10 });
  expect(result.value.data.map(row => row.category)).toEqual(["Waste", "Water", "Travel"]);
});
it("Existing upload without rows", async () => {
  const queries = new MemoryUploadQueries();
  queries.uploads.push(view("u1"));
  expect((await new GetUploadResultsQueryHandler(queries).execute({ uploadId: "u1" })).value)
    .toEqual({ data: [], total: 0, page: 1, limit: 10 });
});
it("Missing upload is not an empty collection", async () => {
  const queries = new MemoryUploadQueries();
  const results = vi.spyOn(queries, "results");
  const result = await new GetUploadResultsQueryHandler(queries).execute({ uploadId: "missing" });
  expect(result.isLeft()).toBe(true);
  expect(result.value).toBeInstanceOf(UploadNotFoundError);
  expect(results).not.toHaveBeenCalled();
});
it.each([{ page: 0 }, { limit: 101 }, { limit: 1.5 }, { page: Number.MAX_SAFE_INTEGER, limit: 100 }])("Results share pagination validation: %j", async input => {
  const queries = new MemoryUploadQueries();
  queries.uploads.push(view("u1"));
  const result = await new GetUploadResultsQueryHandler(queries).execute({ uploadId: "u1", ...input });
  expect(result.isLeft()).toBe(true);
  expect(result.value).toBeInstanceOf(InvalidPaginationError);
});
