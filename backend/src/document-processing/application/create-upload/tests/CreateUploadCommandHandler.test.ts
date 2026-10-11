import { expect, it, vi } from "vitest";
import { CreateUploadCommandHandler } from "../CreateUploadCommandHandler";
import { MemoryStorage, MemoryUploadRepository, FixedClock, FixedIdGenerator } from "./fakes";

const now = new Date("2024-01-15T00:00:00Z");
async function* stream(): AsyncIterable<Uint8Array> { yield new Uint8Array([1, 2, 3]); }
function setup(id = "u1") {
  const storage = new MemoryStorage();
  const repository = new MemoryUploadRepository();
  const handler = new CreateUploadCommandHandler(storage, repository, new FixedIdGenerator(id), new FixedClock(now));
  return { storage, repository, handler };
}
function command(fileName = "report.csv") { return { fileName, stream: stream(), userId: "user" }; }

it.each(["u1", "u2"])("Creating an upload: %s", async id => {
  const { storage, repository, handler } = setup(id);
  const result = await handler.execute(command());
  expect(result.isRight()).toBe(true);
  expect(result.value).toEqual({ id, status: "PENDING", fileName: "report.csv", createdAt: now });
  expect(storage.files.get("k1.csv")).toEqual([new Uint8Array([1, 2, 3])]);
  expect(repository.uploads).toHaveLength(1);
  expect(repository.uploads[0]).toMatchObject({ id, status: "PENDING", userId: "user" });
  expect(repository.jobs).toEqual([{ uploadId: id }]);
});
