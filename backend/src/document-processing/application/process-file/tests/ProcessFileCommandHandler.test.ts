import { afterEach, expect, it, vi } from "vitest";
import { ProcessFileCommandHandler } from "../ProcessFileCommandHandler";
import { claim, now, createUpload, MemoryProcessingRepository, MemoryUploadReader, PreparedRecords, SequenceIds } from "./fakes";
import { MemoryStorage, FixedClock } from "../../create-upload/tests/fakes";
import type { CsvRecord } from "../../ports/ICsvRecordReader";
import { Either } from "../../../../shared/domain/Either";
import { StaleClaimError } from "../StaleClaimError";
import { Upload } from "../../../domain/entities/Upload";
import { uploadProps } from "./fakes";
import { ActivityData } from "../../../domain/entities/ActivityData";
import { InvalidActivityDataError } from "../../../domain/errors/InvalidActivityDataError";
import { InvalidProgressError } from "../../../domain/errors/InvalidProgressError";
import { InvalidStatusTransitionError } from "../../../domain/errors/InvalidStatusTransitionError";

afterEach(() => { vi.restoreAllMocks(); });

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

it("The reader throws midway", async () => {
  const { repository, reader, handler } = setup();
  const error = new Error("Reader failed midway");
  vi.spyOn(reader, "read").mockImplementation(async function* () {
    yield { line: 1, fields: header };
    yield { line: 2, fields: valid };
    yield { line: 3, fields: valid };
    throw error;
  });
  const finish = vi.spyOn(repository, "finish");
  await expect(handler.execute({ claim })).rejects.toBe(error);
  expect(finish).not.toHaveBeenCalled();
  expect(repository.uploads.get("u1")?.status).toBe("PROCESSING");
  expect(repository.rows).toHaveLength(2);
});
it.each(["open", "begin", "saveBatch", "finish"] as const)("Unexpected collaborator failure propagates: %s", async method => {
  const { repository, storage, handler } = setup();
  const error = new Error("Infrastructure failed");
  if (method === "open") vi.spyOn(storage, "open").mockImplementation(() => { throw error; });
  else vi.spyOn(repository, method).mockRejectedValueOnce(error);
  await expect(handler.execute({ claim })).rejects.toBe(error);
  expect(repository.done).toBe(false);
});
it("ActivityData remains the final invariant guard", async () => {
  const { repository, handler } = setup();
  const error = new InvalidActivityDataError("amount", "Invariant failed");
  vi.spyOn(ActivityData, "create").mockReturnValueOnce(Either.left(error));
  await expect(handler.execute({ claim })).rejects.toBe(error);
  expect(repository.rows).toEqual([]);
  expect(repository.done).toBe(false);
});
it.each(["start", "complete"] as const)("Internal aggregate failure is not silently ignored: %s", async stage => {
  const { handler } = setup();
  const error = stage === "start" ? new InvalidStatusTransitionError("PENDING", "PROCESSING") : new InvalidProgressError("Invariant failed");
  if (stage === "start") vi.spyOn(Upload.prototype, "startProcessing").mockReturnValue(Either.left(error as InvalidStatusTransitionError));
  else vi.spyOn(Upload.prototype, "complete").mockReturnValueOnce(Either.left(error));
  await expect(handler.execute({ claim })).rejects.toBe(error);
});

it("A file that disappeared while opening is not finalized as failed", async () => {
  const { repository, storage, handler } = setup();
  storage.files.clear();
  await expect(handler.execute({ claim })).rejects.toThrow("Stored file is missing");
  expect(repository.done).toBe(false);
  expect(repository.uploads.get("u1")?.status).toBe("PROCESSING");
});

it.each(["COMPLETED", "FAILED"] as const)("Already terminal: %s", async status => {
  const { repository, storage, handler } = setup();
  const stored = Upload.reconstitute({ ...uploadProps(createUpload()), status, totalRows: 10,
    processedRows: 8, failedRows: 2, errorMessage: "original" });
  repository.uploads.set("u1", stored);
  const open = vi.spyOn(storage, "open");
  const begin = vi.spyOn(repository, "begin");
  expect((await handler.execute({ claim })).isRight()).toBe(true);
  expect(open).not.toHaveBeenCalled();
  expect(begin).not.toHaveBeenCalled();
  expect(repository.done).toBe(true);
  expect(uploadProps(repository.uploads.get("u1")!)).toEqual(uploadProps(stored));
});
it("Retry of an interrupted attempt", async () => {
  const { repository, handler } = setup();
  await handler.execute({ claim });
  repository.uploads.set("u1", Upload.reconstitute({ ...uploadProps(repository.uploads.get("u1")!),
    status: "PROCESSING", errorMessage: "old attempt" }));
  repository.done = false;
  const begin = vi.spyOn(repository, "begin");
  await handler.execute({ claim });
  expect(begin).toHaveBeenCalledExactlyOnceWith(claim, now);
  expect(repository.rows).toHaveLength(5);
  expect(repository.batches.slice(-3)).toEqual([2, 4, 5].map(processedRows => ({ processedRows, failedRows: 0 })));
  expect(repository.uploads.get("u1")).toMatchObject({ status: "COMPLETED", processedRows: 5, errorMessage: null });
});

it("Only invalid rows", async () => {
  const { repository, handler } = setup(Array.from({ length: 3 }, () => ["Water", "0", "m3", "2024-01-15"]));
  await handler.execute({ claim });
  expect(repository.uploads.get("u1")?.status).toBe("FAILED");
  expect(repository.uploads.get("u1")?.errorMessage).toContain("No valid row");
  expect(repository.uploads.get("u1")).toMatchObject({ totalRows: 3, processedRows: 0, failedRows: 3 });
  expect(repository.rows).toEqual([]);
  expect(repository.batches).toEqual([{ processedRows: 0, failedRows: 2 }, { processedRows: 0, failedRows: 3 }]);
  expect(repository.done).toBe(true);
});
it.each([true, false])("Header only or an empty file: %s", async hasHeader => {
  const { repository, reader, handler } = setup([]);
  if (!hasHeader) reader.records.length = 0;
  await handler.execute({ claim });
  expect(repository.uploads.get("u1")?.status).toBe("FAILED");
  expect(repository.rows).toEqual([]);
  expect(repository.done).toBe(true);
});
it("Progress is recorded per batch", async () => {
  const { repository, handler } = setup();
  await handler.execute({ claim });
  expect(repository.batches).toEqual([2, 4, 5].map(processedRows => ({ processedRows, failedRows: 0 })));
});

it.each([5, 3])("Another worker took over at the second batch: %s rows", async count => {
  const { repository, handler } = setup(Array.from({ length: count }, () => valid));
  const stale = new StaleClaimError("Another worker took over");
  const original = repository.saveBatch.bind(repository);
  const save = vi.spyOn(repository, "saveBatch").mockImplementationOnce(original).mockResolvedValueOnce(Either.left(stale));
  const finish = vi.spyOn(repository, "finish");
  const result = await handler.execute({ claim });
  expect(result.isLeft()).toBe(true);
  expect(result.value).toBe(stale);
  expect(save).toHaveBeenCalledTimes(2);
  expect(finish).not.toHaveBeenCalled();
  expect(repository.rows).toHaveLength(2);
});
it("A stale claim at begin never opens the file", async () => {
  const { repository, storage, handler } = setup();
  const stale = new StaleClaimError("Expired before begin");
  vi.spyOn(repository, "begin").mockResolvedValue(Either.left(stale));
  const open = vi.spyOn(storage, "open");
  const result = await handler.execute({ claim });
  expect(result.value).toBe(stale);
  expect(open).not.toHaveBeenCalled();
  expect(repository.uploads.get("u1")?.status).toBe("PENDING");
});
it("A stale claim at finish is returned without retry", async () => {
  const { repository, handler } = setup();
  const stale = new StaleClaimError("Expired at finish");
  const finish = vi.spyOn(repository, "finish").mockResolvedValue(Either.left(stale));
  expect((await handler.execute({ claim })).value).toBe(stale);
  expect(finish).toHaveBeenCalledTimes(1);
  expect(repository.done).toBe(false);
});
it("An upload that disappeared invalidates the claim before any write", async () => {
  const { repository, storage, handler } = setup();
  repository.uploads.clear();
  const begin = vi.spyOn(repository, "begin");
  const open = vi.spyOn(storage, "open");
  const result = await handler.execute({ claim });
  expect(result.isLeft()).toBe(true);
  expect(result.value).toBeInstanceOf(StaleClaimError);
  expect(begin).not.toHaveBeenCalled();
  expect(open).not.toHaveBeenCalled();
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

it("Missing header column", async () => {
  const { repository, reader, handler } = setup();
  reader.records[0] = { line: 1, fields: ["category", "amount", "date"] };
  expect((await handler.execute({ claim })).isRight()).toBe(true);
  expect(repository.uploads.get("u1")).toMatchObject({ status: "FAILED" });
  expect(repository.uploads.get("u1")?.errorMessage).toContain("unit");
  expect(repository.rows).toEqual([]);
  expect(repository.batches).toEqual([]);
  expect(repository.done).toBe(true);
});
