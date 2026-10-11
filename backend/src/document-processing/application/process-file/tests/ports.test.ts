import { expect, it } from "vitest";
import { StaleClaimError } from "../StaleClaimError";
import { claim, createUpload, MemoryProcessingRepository, MemoryUploadReader, PreparedRecords } from "./fakes";
import { MemoryStorage } from "../../create-upload/tests/fakes";

it("A stale claim has a stable code", () => {
  expect(new StaleClaimError("Claim expired")).toMatchObject({ code: "STALE_CLAIM", message: "Claim expired" });
});
it("Fakes can implement every port without IO", async () => {
  const repository = new MemoryProcessingRepository(createUpload());
  const reader = new MemoryUploadReader(repository);
  const storage = new MemoryStorage();
  storage.files.set("file.csv", [new Uint8Array([1, 2])]);
  const records = new PreparedRecords([{ line: 1, fields: ["category", "amount", "unit", "date"] }]);
  expect((await reader.findById("u1"))?.status).toBe("PENDING");
  expect(await reader.findById("missing")).toBeNull();
  const output = [];
  for await (const record of records.read(storage.open("file.csv"))) output.push(record);
  expect(output).toEqual(records.records);
  expect((await repository.begin(claim, new Date("2024-01-15"))).isRight()).toBe(true);
});
it("Fake fenced writes reject a changed claim", async () => {
  const upload = createUpload();
  const repository = new MemoryProcessingRepository(upload);
  repository.claimToken = "new-owner";
  expect((await repository.begin(claim, upload.createdAt)).isLeft()).toBe(true);
  expect((await repository.saveBatch(claim, [], { processedRows: 0, failedRows: 0 }, upload.createdAt)).isLeft()).toBe(true);
  expect((await repository.finish(claim, upload)).isLeft()).toBe(true);
  expect(repository.uploads.get("u1")?.status).toBe("PENDING");
});
