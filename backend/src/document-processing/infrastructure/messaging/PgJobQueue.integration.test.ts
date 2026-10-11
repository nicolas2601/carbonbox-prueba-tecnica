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

it("Two workers never take the same job", async () => {
  await seedJob(client);
  const claims = await Promise.all([queue.claim(NOW, VISIBILITY_MS), queue.claim(NOW, VISIBILITY_MS)]);
  expect(claims.filter(Boolean)).toHaveLength(1);
  expect(claims.filter(value => value === null)).toHaveLength(1);
  expect((await client.job.findFirstOrThrow()).attempts).toBe(1);
});
it("Two jobs, two workers", async () => {
  await seedJob(client, "u1");
  await seedJob(client, "u2");
  const claims = await Promise.all([queue.claim(NOW, VISIBILITY_MS), queue.claim(NOW, VISIBILITY_MS)]);
  expect(claims.every(Boolean)).toBe(true);
  expect(new Set(claims.map(value => value?.jobId)).size).toBe(2);
});
it("A row locked by another transaction is skipped", async () => {
  const first = await seedJob(client, "u1");
  const second = await seedJob(client, "u2");
  let ready!: () => void;
  let release!: () => void;
  const locked = new Promise<void>(resolve => { ready = resolve; });
  const resume = new Promise<void>(resolve => { release = resolve; });
  const holding = client.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM jobs WHERE id = ${first.id} FOR UPDATE`;
    ready();
    await resume;
  });
  await locked;
  try { expect((await queue.claim(NOW, VISIBILITY_MS))?.jobId).toBe(second.id); }
  finally { release(); await holding; }
});
