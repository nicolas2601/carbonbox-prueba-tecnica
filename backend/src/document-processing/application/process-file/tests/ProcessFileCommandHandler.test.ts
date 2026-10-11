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
