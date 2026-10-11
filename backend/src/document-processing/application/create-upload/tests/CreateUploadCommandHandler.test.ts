import { expect, it, vi } from "vitest";
import { CreateUploadCommandHandler } from "../CreateUploadCommandHandler";
import { MemoryStorage, MemoryUploadRepository, FixedClock, FixedIdGenerator } from "./fakes";
import { InvalidFileNameError } from "../../../domain/errors/InvalidFileNameError";
import { Either } from "../../../../shared/domain/Either";
import { StorageFailureError } from "../StorageFailureError";

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

it("The file name is trimmed and the stream key is kept", async () => {
  const { repository, handler } = setup();
  const result = await handler.execute(command("  report.csv  "));
  expect(result.value).toMatchObject({ fileName: "report.csv" });
  expect(repository.uploads[0]?.fileUrl).toBe("k1.csv");
  expect(repository.jobs).toEqual([{ uploadId: "u1" }]);
});

it.each(["report.txt", "../secret.csv"])("A non CSV or unsafe name: %s", async name => {
  const { storage, repository, handler } = setup();
  const save = vi.spyOn(storage, "save");
  const persist = vi.spyOn(repository, "saveWithJob");
  const result = await handler.execute(command(name));
  expect(result.isLeft()).toBe(true);
  expect(result.value).toBeInstanceOf(InvalidFileNameError);
  expect(save).not.toHaveBeenCalled();
  expect(persist).not.toHaveBeenCalled();
});

it("Storage fails", async () => {
  const { storage, repository, handler } = setup();
  const error = new StorageFailureError("Storage full");
  vi.spyOn(storage, "save").mockResolvedValue(Either.left(error));
  const persist = vi.spyOn(repository, "saveWithJob");
  const result = await handler.execute(command());
  expect(result.isLeft()).toBe(true);
  expect(result.value).toBe(error);
  expect(persist).not.toHaveBeenCalled();
  expect(repository.uploads).toEqual([]);
  expect(repository.jobs).toEqual([]);
});
