import { expect, it } from "vitest";
import { Upload } from "../../../domain/entities/Upload";
import { FileName } from "../../../domain/value-objects/FileName";
import { MemoryStorage, MemoryUploadRepository, FixedClock, FixedIdGenerator } from "./fakes";
import type { ProcessFileJob } from "../../ports/ProcessFileJob";

export async function* bytes(): AsyncIterable<Uint8Array> {
  yield new Uint8Array([1, 2]);
  yield new Uint8Array([3]);
}
it("Storage preserves byte chunks and deletes the stored key", async () => {
  const storage = new MemoryStorage();
  const result = await storage.save(bytes());
  expect(result.value).toBe("k1.csv");
  expect(storage.files.get("k1.csv")).toEqual([new Uint8Array([1, 2]), new Uint8Array([3])]);
  expect((await storage.delete("k1.csv")).isRight()).toBe(true);
  expect(storage.files.size).toBe(0);
});
it("Job shape and atomic fake preserve one pair", async () => {
  const name = FileName.create("report.csv");
  if (name.isLeft()) throw name.value;
  const clock = new FixedClock(new Date("2024-01-15T00:00:00Z"));
  const upload = Upload.create({ id: new FixedIdGenerator("u1").next(), fileName: name.value,
    fileUrl: "k1.csv", userId: "user", now: clock.now() });
  const repository = new MemoryUploadRepository();
  const job: ProcessFileJob = { uploadId: upload.id };
  expect((await repository.saveWithJob(upload, job)).isRight()).toBe(true);
  expect(repository.uploads).toEqual([upload]);
  expect(repository.jobs).toEqual([{ uploadId: "u1" }]);
  expect(Object.keys(job)).toEqual(["uploadId"]);
});
