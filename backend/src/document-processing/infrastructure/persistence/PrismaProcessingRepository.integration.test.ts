import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, expect, it } from "vitest";
import { PrismaProcessingRepository } from "./PrismaProcessingRepository";
import { PgJobQueue } from "../messaging/PgJobQueue";
import { integrationClient, truncateTables } from "../tests/database";
import { NOW, VISIBILITY_MS, activity, seedJob } from "../tests/queueFixtures";
import type { JobClaim } from "../../application/ports/JobClaim";

const client = integrationClient();
const queue = new PgJobQueue(client, { next: randomUUID }, 1000);
const repository = new PrismaProcessingRepository(client, VISIBILITY_MS);
beforeEach(async () => { await truncateTables(client); });
afterAll(async () => { await client.$disconnect(); });
async function claimed(): Promise<JobClaim> {
  await seedJob(client);
  const result = await queue.claim(NOW, VISIBILITY_MS);
  if (!result) throw new Error("Expected claim");
  return result;
}
it("Retry after a crash clears previous rows and resets counters", async () => {
  const claim = await claimed();
  await client.activityData.createMany({ data: [1, 2, 3].map(value => ({ id: `old-${value}`, uploadId: "u1",
    category: "Water", amount: 10, unit: "m3", date: NOW })) });
  await client.upload.update({ where: { id: "u1" }, data: { status: "PROCESSING", totalRows: 3,
    processedRows: 3, failedRows: 0, errorMessage: "Old attempt" } });
  const time = new Date(NOW.getTime() + 500);
  expect((await repository.begin(claim, time)).isRight()).toBe(true);
  expect(await client.activityData.count()).toBe(0);
  expect(await client.upload.findUnique({ where: { id: "u1" } })).toMatchObject({ status: "PROCESSING",
    totalRows: 0, processedRows: 0, failedRows: 0, errorMessage: null, updatedAt: time });
});

it("Batch of rows stores counters and extends the lease", async () => {
  const claim = await claimed();
  await repository.begin(claim, NOW);
  const time = new Date(NOW.getTime() + 600);
  const rows = [1, 2, 3].map(value => activity(`row-${value}`));
  expect((await repository.saveBatch(claim, rows, { processedRows: 3, failedRows: 0 }, time)).isRight()).toBe(true);
  expect(await client.activityData.count()).toBe(3);
  expect(await client.upload.findFirstOrThrow()).toMatchObject({ processedRows: 3, failedRows: 0, updatedAt: time });
  expect(await client.job.findFirstOrThrow()).toMatchObject({ lockedUntil: new Date(time.getTime() + VISIBILITY_MS), updatedAt: time });
});
it("Empty batch still stores failed counters and heartbeat", async () => {
  const claim = await claimed();
  await repository.begin(claim, NOW);
  const time = new Date(NOW.getTime() + 600);
  expect((await repository.saveBatch(claim, [], { processedRows: 0, failedRows: 4 }, time)).isRight()).toBe(true);
  expect(await client.activityData.count()).toBe(0);
  expect((await client.upload.findFirstOrThrow()).failedRows).toBe(4);
  expect((await client.job.findFirstOrThrow()).lockedUntil).toEqual(new Date(time.getTime() + VISIBILITY_MS));
});
it("A row payload for another upload is rejected without writing", async () => {
  const claim = await claimed();
  await seedJob(client, "other");
  await repository.begin(claim, NOW);
  const before = await client.upload.findMany({ orderBy: { id: "asc" } });
  const result = await repository.saveBatch(claim, [activity("wrong", "other")], { processedRows: 1, failedRows: 0 }, NOW);
  expect(result.isLeft()).toBe(true);
  expect(await client.activityData.count()).toBe(0);
  expect(await client.upload.findMany({ orderBy: { id: "asc" } })).toEqual(before);
});
it("A failed progress update rolls back the inserted rows and heartbeat", async () => {
  const claim = await claimed();
  await repository.begin(claim, NOW);
  const before = await client.job.findFirstOrThrow();
  await client.$executeRaw`ALTER TABLE uploads ADD CONSTRAINT test_reject_progress CHECK ("failedRows" <> 99)`;
  try {
    await expect(repository.saveBatch(claim, [activity("rollback")], { processedRows: 1, failedRows: 99 }, NOW)).rejects.toThrow();
    expect(await client.activityData.count()).toBe(0);
    expect((await client.upload.findFirstOrThrow()).processedRows).toBe(0);
    expect(await client.job.findFirstOrThrow()).toEqual(before);
  } finally { await client.$executeRaw`ALTER TABLE uploads DROP CONSTRAINT test_reject_progress`; }
});
