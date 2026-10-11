import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, expect, it } from "vitest";
import { PgJobQueue } from "./PgJobQueue";
import { integrationClient, truncateTables } from "../tests/database";
import { NOW, VISIBILITY_MS, seedJob } from "../tests/queueFixtures";

const client = integrationClient();
const queue = new PgJobQueue(client, { next: randomUUID }, 1000);
beforeEach(async () => { await truncateTables(client); });
afterAll(async () => { await client.$disconnect(); });
it("Claiming a queued job", async () => {
  const job = await seedJob(client);
  const claim = await queue.claim(NOW, VISIBILITY_MS);
  expect(claim).toMatchObject({ jobId: job.id, uploadId: "u1", claimToken: expect.any(String) });
  expect(await client.job.findUnique({ where: { id: job.id } })).toMatchObject({ attempts: 1,
    claimToken: claim?.claimToken, lockedUntil: new Date(NOW.getTime() + VISIBILITY_MS), updatedAt: NOW });
});
it("Nothing to claim", async () => { expect(await queue.claim(NOW, VISIBILITY_MS)).toBeNull(); });
it("Not yet available", async () => {
  const job = await seedJob(client);
  await client.job.update({ where: { id: job.id }, data: { availableAt: new Date(NOW.getTime() + 1) } });
  expect(await queue.claim(NOW, VISIBILITY_MS)).toBeNull();
});
