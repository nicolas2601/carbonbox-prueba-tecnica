import { expect, it, vi } from "vitest";
import { ProcessFileCommandHandler } from "../ProcessFileCommandHandler";
import { claim, now, createUpload, MemoryProcessingRepository, MemoryUploadReader, PreparedRecords, SequenceIds } from "./fakes";
import { MemoryStorage, FixedClock } from "../../create-upload/tests/fakes";
import type { CsvRecord } from "../../ports/ICsvRecordReader";

const header = ["category", "amount", "unit", "date"];
const valid = ["Electricity", "150.5", "kWh", "2024-01-15"];
function setup(fields: string[][] = Array.from({ length: 5 }, () => valid), batchSize = 2) {
  const repository = new MemoryProcessingRepository(createUpload());
  const storage = new MemoryStorage();
  storage.files.set("file.csv", [new Uint8Array([1])]);
  const records: CsvRecord[] = [header, ...fields].map((fields, index) => ({ line: index + 1, fields }));
  const reader = new PreparedRecords(records);
  const handler = new ProcessFileCommandHandler(new MemoryUploadReader(repository), storage, reader,
    repository, new SequenceIds(), new FixedClock(now), batchSize);
  return { repository, storage, reader, handler };
}
it.each([5, 3])("A fully valid file of %s rows", async count => {
  const { repository, handler } = setup(Array.from({ length: count }, () => valid));
  expect((await handler.execute({ claim })).isRight()).toBe(true);
  expect(repository.rows).toHaveLength(count);
  expect(new Set(repository.rows.map(row => row.id)).size).toBe(count);
  expect(repository.uploads.get("u1")).toMatchObject({ status: "COMPLETED", totalRows: count,
    processedRows: count, failedRows: 0, errorMessage: null });
  expect(repository.done).toBe(true);
});
it("Progress is recorded per batch", async () => {
  const { repository, handler } = setup();
  await handler.execute({ claim });
  expect(repository.batches).toEqual([2, 4, 5].map(processedRows => ({ processedRows, failedRows: 0 })));
});
it.each([0, -1, 1.5, NaN])("Batch size must be a positive integer: %s", size => {
  expect(() => setup([], size)).toThrow("Batch size");
});

it("Some invalid rows", async () => {
  const bad = ["Water", "-1", "m3", "2024-01-15"];
  const { repository, handler } = setup([valid, bad, valid, bad, valid]);
  await handler.execute({ claim });
  expect(repository.uploads.get("u1")).toMatchObject({ status: "COMPLETED", totalRows: 5, processedRows: 3, failedRows: 2 });
  expect(repository.rows).toHaveLength(3);
  expect(repository.uploads.get("u1")?.errorMessage).toContain("line 3: amount");
  expect(repository.uploads.get("u1")?.errorMessage).toContain("line 5: amount");
});
it("Rejected-only batches still record progress", async () => {
  const bad = ["Water", "0", "m3", "2024-01-15"];
  const { repository, handler } = setup([bad, bad, valid]);
  const save = vi.spyOn(repository, "saveBatch");
  await handler.execute({ claim });
  expect(save.mock.calls[0]?.[1]).toEqual([]);
  expect(repository.batches).toEqual([{ processedRows: 0, failedRows: 2 }, { processedRows: 1, failedRows: 2 }]);
});
it("Rejected-row detail is capped at ten", async () => {
  const bad = ["Water", "0", "m3", "2024-01-15"];
  const { repository, handler } = setup([valid, ...Array.from({ length: 12 }, () => bad)]);
  await handler.execute({ claim });
  const summary = repository.uploads.get("u1")?.errorMessage;
  expect(summary).toContain("12 rows rejected");
  expect(summary?.match(/line \d+:/g)).toHaveLength(10);
  expect(summary).toContain("2 more omitted");
});
