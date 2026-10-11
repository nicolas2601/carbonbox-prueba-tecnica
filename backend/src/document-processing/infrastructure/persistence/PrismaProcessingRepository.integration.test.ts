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
