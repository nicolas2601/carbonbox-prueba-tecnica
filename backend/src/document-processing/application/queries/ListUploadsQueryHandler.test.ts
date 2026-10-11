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
it.each([{ page: 0 }, { limit: 0 }, { limit: 101 }, { limit: 1.5 },
  { page: null as unknown as number }, { limit: null as unknown as number }])("Out of range before IO: %j", async input => {
  const queries = new MemoryUploadQueries();
  const list = vi.spyOn(queries, "list");
  const result = await new ListUploadsQueryHandler(queries).execute(input);
  expect(result.isLeft()).toBe(true);
  expect(result.value).toBeInstanceOf(InvalidPaginationError);
  expect(list).not.toHaveBeenCalled();
});
