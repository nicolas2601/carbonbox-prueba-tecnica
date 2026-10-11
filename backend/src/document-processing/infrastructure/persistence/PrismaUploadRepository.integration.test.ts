import { afterAll, beforeEach, expect, it, vi } from "vitest";
import { Upload } from "../../domain/entities/Upload";
import { FileName } from "../../domain/value-objects/FileName";
import { PrismaUploadRepository } from "./PrismaUploadRepository";
import { integrationClient, truncateTables } from "../tests/database";

const client = integrationClient();
const repository = new PrismaUploadRepository(client, 7);
const now = new Date("2024-01-15T00:00:00Z");
beforeEach(async () => { vi.restoreAllMocks(); await truncateTables(client); });
afterAll(async () => { await client.$disconnect(); });
function upload(id = "u1"): Upload {
  const name = FileName.create("report.csv");
  if (name.isLeft()) throw name.value;
  return Upload.create({ id, fileName: name.value, fileUrl: "k1.csv", userId: "user", now });
}

it.each(["u1", "u2"])("Saving a pending upload: %s", async id => {
  const result = await repository.saveWithJob(upload(id), { uploadId: id });
  expect(result.isRight()).toBe(true);
  expect(await client.upload.findMany()).toEqual([{
    id, fileName: "report.csv", fileUrl: "k1.csv", userId: "user", status: "PENDING",
    totalRows: null, processedRows: null, failedRows: null, errorMessage: null, createdAt: now, updatedAt: now,
  }]);
  const jobs = await client.job.findMany();
  expect(jobs).toHaveLength(1);
  expect(jobs[0]).toMatchObject({ uploadId: id, status: "QUEUED", attempts: 0, maxAttempts: 7,
    availableAt: now, lockedUntil: null, claimToken: null, lastError: null });
});

it("Duplicate upload id", async () => {
  await repository.saveWithJob(upload(), { uploadId: "u1" });
  const result = await repository.saveWithJob(upload(), { uploadId: "u1" });
  expect(result.isLeft()).toBe(true);
  expect(result.value).toMatchObject({ code: "UPLOAD_PERSISTENCE_FAILURE" });
  expect(await client.upload.count()).toBe(1);
  expect(await client.job.count()).toBe(1);
});

it("Unknown errors are not hidden", async () => {
  const error = Object.assign(new Error("Unexpected client failure"), { code: "P2002" });
  vi.spyOn(client, "$transaction").mockRejectedValueOnce(error);
  await expect(repository.saveWithJob(upload(), { uploadId: "u1" })).rejects.toBe(error);
});
it("A real foreign-key error bubbles and also rolls back", async () => {
  await expect(repository.saveWithJob(upload(), { uploadId: "missing" })).rejects.toMatchObject({ code: "P2003" });
  expect(await client.upload.count()).toBe(0);
  expect(await client.job.count()).toBe(0);
});

it("The job insert fails after the new upload insert and rolls back", async () => {
  await repository.saveWithJob(upload("existing"), { uploadId: "existing" });
  const result = await repository.saveWithJob(upload("rollback"), { uploadId: "existing" });
  expect(result.isLeft()).toBe(true);
  expect(result.value).toMatchObject({ code: "UPLOAD_PERSISTENCE_FAILURE" });
  expect(await client.upload.findUnique({ where: { id: "rollback" } })).toBeNull();
  expect(await client.upload.count()).toBe(1);
  expect(await client.job.count()).toBe(1);
});
