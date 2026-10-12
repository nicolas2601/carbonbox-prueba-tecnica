import { afterAll, beforeEach, expect, it } from "vitest";
import { integrationClient, truncateTables } from "../tests/database";
import { NOW, seedJob } from "../tests/queueFixtures";
import { PgDeadJobRequeue } from "./PgDeadJobRequeue";
import { PrismaProcessingRepository } from "./PrismaProcessingRepository";
import { workerHarness } from "../tests/workerHarness";
import { createReadStream } from "node:fs";

const client = integrationClient();
const repository = new PgDeadJobRequeue(client);
beforeEach(async () => { await truncateTables(client); });
afterAll(async () => { await client.$disconnect(); });

it("Atomically resets a dead job and its failed upload, invalidating its old fence", async () => {
  const job = await seedJob(client);
  await client.job.update({ where: { id: job.id }, data: { status: "DEAD", attempts: 3,
    claimToken: "old-token", lockedUntil: NOW, lastError: "old error" } });
  await client.upload.update({ where: { id: "u1" }, data: { status: "FAILED", totalRows: 9,
    processedRows: 3, failedRows: 6, errorMessage: "old error" } });
  expect((await repository.requeue("u1", NOW)).isRight()).toBe(true);
  expect(await client.job.findUnique({ where: { id: job.id } })).toMatchObject({ status: "QUEUED",
    attempts: 0, maxAttempts: 3, availableAt: NOW, updatedAt: NOW, claimToken: null, lockedUntil: null, lastError: null });
  expect(await client.upload.findUnique({ where: { id: "u1" } })).toMatchObject({ status: "PENDING",
    totalRows: null, processedRows: null, failedRows: null, errorMessage: null, updatedAt: NOW });
  const oldClaim = { jobId: job.id, uploadId: "u1", claimToken: "old-token" };
  expect((await new PrismaProcessingRepository(client, 1000).begin(oldClaim, NOW)).isLeft()).toBe(true);
});
it.each(["QUEUED", "DONE"] as const)("Refuses %s without changing state", async (status) => {
  const job = await seedJob(client);
  await client.job.update({ where: { id: job.id }, data: { status } });
  const before = await client.job.findUniqueOrThrow({ where: { id: job.id } });
  const result = await repository.requeue("u1", NOW);
  expect(result.isLeft() && result.value.code).toBe("JOB_NOT_DEAD");
  expect(await client.job.findUnique({ where: { id: job.id } })).toEqual(before);
});
it("Refuses missing jobs as a value", async () => {
  const result = await repository.requeue("missing", NOW);
  expect(result.isLeft() && result.value.code).toBe("JOB_NOT_FOUND");
});
it("Preserves state when invalid timestamps abort the transaction", async () => {
  const job = await seedJob(client);
  await client.job.update({ where: { id: job.id }, data: { status: "DEAD", attempts: 3 } });
  const result = await repository.requeue("u1", new Date(Number.NaN));
  expect(result.isLeft() && result.value.code).toBe("REQUEUE_FAILED");
  expect(await client.job.findUnique({ where: { id: job.id } })).toMatchObject({ status: "DEAD", attempts: 3 });
});
it("Serializes duplicate operator requests so only one can reset a dead job", async () => {
  const job = await seedJob(client);
  await client.job.update({ where: { id: job.id }, data: { status: "DEAD" } });
  const results = await Promise.all([repository.requeue("u1", NOW), repository.requeue("u1", NOW)]);
  expect(results.filter(result => result.isRight())).toHaveLength(1);
  expect(results.filter(result => result.isLeft())).toHaveLength(1);
});
it("Replays from the beginning without duplicating previously committed rows", async () => {
  const harness = await workerHarness();
  try {
    const csv = new URL("../../../../../sample-data.csv", import.meta.url);
    const uploaded = await harness.createUpload.execute({ fileName: "sample.csv", userId: "user", stream: createReadStream(csv) });
    if (uploaded.isLeft()) throw uploaded.value;
    const uploadId = uploaded.value.id;
    expect(await harness.worker.runOnce()).toBe(true);
    expect(await client.activityData.count({ where: { uploadId } })).toBe(60);
    await client.job.update({ where: { uploadId }, data: { status: "DEAD", attempts: 3 } });
    await client.upload.update({ where: { id: uploadId }, data: { status: "FAILED" } });
    expect((await harness.requeueDeadJob.execute(uploadId)).isRight()).toBe(true);
    expect(await harness.worker.runOnce()).toBe(true);
    expect(await client.activityData.count({ where: { uploadId } })).toBe(60);
    expect(await client.upload.findUnique({ where: { id: uploadId } })).toMatchObject({ status: "COMPLETED", processedRows: 60 });
  } finally { await harness.close(); }
});
