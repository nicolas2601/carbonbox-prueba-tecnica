import { expect, it, vi } from "vitest";
import { ListUploadsQueryHandler } from "./ListUploadsQueryHandler";
import { InvalidPaginationError } from "./InvalidPaginationError";
import { MemoryUploadQueries, view } from "./tests/MemoryUploadQueries";

function seeded(): MemoryUploadQueries {
  const queries = new MemoryUploadQueries();
  for (let index = 0; index < 15; index++) queries.uploads.push({ ...view(`u${String(index).padStart(2, "0")}`),
    createdAt: new Date(Date.UTC(2024, 0, index + 1)).toISOString() });
  return queries;
}
it("Default page is newest first", async () => {
  const result = await new ListUploadsQueryHandler(seeded()).execute();
  expect(result.isRight()).toBe(true);
  if (result.isLeft()) throw result.value;
  expect(result.value).toMatchObject({ total: 15, page: 1, limit: 10 });
  expect(result.value.data).toHaveLength(10);
  expect(result.value.data[0]?.id).toBe("u14");
});
it("Second page does not repeat the first", async () => {
  const handler = new ListUploadsQueryHandler(seeded());
  const first = await handler.execute();
  const second = await handler.execute({ page: 2, limit: 10 });
  if (first.isLeft() || second.isLeft()) throw new Error("Expected pages");
  expect(second.value.data).toHaveLength(5);
  expect(new Set([...first.value.data, ...second.value.data].map(row => row.id)).size).toBe(15);
});
it("Empty list", async () => {
  expect((await new ListUploadsQueryHandler(new MemoryUploadQueries()).execute()).value)
    .toEqual({ data: [], total: 0, page: 1, limit: 10 });
});
it("Equal timestamps keep a stable id tie breaker", async () => {
  const queries = new MemoryUploadQueries();
  queries.uploads.push(view("u2"), view("u1"));
  const result = await new ListUploadsQueryHandler(queries).execute();
  if (result.isLeft()) throw result.value;
  expect(result.value.data.map(row => row.id)).toEqual(["u1", "u2"]);
});
it("Trims search and defaults upload ordering before querying", async () => {
  const queries = seeded();
  const list = vi.spyOn(queries, "list");
  await new ListUploadsQueryHandler(queries).execute({ q: "  report_  ", status: "COMPLETED", sort: "name" });
  expect(list).toHaveBeenCalledWith(expect.objectContaining({ q: "report_", status: "COMPLETED", sort: "name" }));
});
it.each(["\t", "\n spaced \r", "\u0085", "  \t "])("Rejects control characters before trimming can hide them: %j", async q => {
  const queries = seeded(); const list = vi.spyOn(queries, "list");
  const result = await new ListUploadsQueryHandler(queries).execute({ q });
  expect(result.isLeft()).toBe(true);
  expect(list).not.toHaveBeenCalled();
});
it("Applies the search limit after trimming", async () => {
  const queries = seeded();
  const list = vi.spyOn(queries, "list");
  const q = ` ${"x".repeat(200)} `;
  const result = await new ListUploadsQueryHandler(queries).execute({ q });
  expect(result.isRight()).toBe(true);
  expect(list).toHaveBeenCalledWith(expect.objectContaining({ q: "x".repeat(200) }));
});
it.each([
  { q: "x".repeat(201) }, { q: "bad\u0000name" }, { status: "UNKNOWN" }, { sort: "random" },
])("Rejects invalid list filters before IO: %j", async input => {
  const queries = new MemoryUploadQueries();
  const list = vi.spyOn(queries, "list");
  const result = await new ListUploadsQueryHandler(queries).execute(input as never);
  expect(result.isLeft()).toBe(true);
  expect(list).not.toHaveBeenCalled();
});
it.each([{ page: 0 }, { limit: 0 }, { limit: 101 }, { limit: 1.5 }, { page: Number.MAX_SAFE_INTEGER, limit: 100 },
  { page: null as unknown as number }, { limit: null as unknown as number }])("Out of range before IO: %j", async input => {
  const queries = new MemoryUploadQueries();
  const list = vi.spyOn(queries, "list");
  const result = await new ListUploadsQueryHandler(queries).execute(input);
  expect(result.isLeft()).toBe(true);
  expect(result.value).toBeInstanceOf(InvalidPaginationError);
  expect(list).not.toHaveBeenCalled();
});
