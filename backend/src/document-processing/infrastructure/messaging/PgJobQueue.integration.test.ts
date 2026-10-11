import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, expect, it } from "vitest";
import { PgJobQueue } from "./PgJobQueue";
import { integrationClient, truncateTables } from "../tests/database";
import { NOW, VISIBILITY_MS, seedJob } from "../tests/queueFixtures";
import { testDatabaseUrl } from "../tests/testDatabaseUrl";

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

it("Live lease", async () => {
  await seedJob(client);
  await queue.claim(NOW, VISIBILITY_MS);
  expect(await queue.claim(new Date(NOW.getTime() + VISIBILITY_MS - 1), VISIBILITY_MS)).toBeNull();
});
it("Expired lease", async () => {
  const job = await seedJob(client);
  const first = await queue.claim(NOW, VISIBILITY_MS);
  const later = new Date(NOW.getTime() + VISIBILITY_MS + 1);
  const second = await queue.claim(later, VISIBILITY_MS);
  expect(second?.jobId).toBe(first?.jobId);
  expect(second?.claimToken).not.toBe(first?.claimToken);
  expect(await client.job.findUnique({ where: { id: job.id } })).toMatchObject({ attempts: 2, updatedAt: later });
});
it("Raw Date parameters preserve UTC milliseconds in a non-UTC session", async () => {
  await seedJob(client);
  const url = new URL(testDatabaseUrl(process.env.DATABASE_URL));
  url.searchParams.set("options", "-c timezone=America/Bogota");
  const bogota = integrationClient(url.toString());
  try {
    expect(await bogota.$queryRaw`SHOW TIME ZONE`).toEqual([{ TimeZone: "America/Bogota" }]);
    const localQueue = new PgJobQueue(bogota, { next: randomUUID }, 1000);
    expect(await localQueue.claim(NOW, VISIBILITY_MS)).not.toBeNull();
    expect((await client.job.findFirstOrThrow()).lockedUntil).toEqual(new Date(NOW.getTime() + VISIBILITY_MS));
  } finally { await bogota.$disconnect(); }
});

it("First failure, second failure doubles the delay, and retry is not claimable early", async () => {
  const job = await seedJob(client);
  const first = await queue.claim(NOW, VISIBILITY_MS);
  if (!first) throw new Error("Expected first claim");
  expect((await queue.fail(first, "Temporary failure", NOW, false)).value).toBe("RETRY");
  expect(await client.job.findUnique({ where: { id: job.id } })).toMatchObject({ status: "QUEUED", attempts: 1,
    lockedUntil: null, claimToken: null, availableAt: new Date(NOW.getTime() + 1000), lastError: "Temporary failure", updatedAt: NOW });
  expect(await queue.claim(new Date(NOW.getTime() + 999), VISIBILITY_MS)).toBeNull();
  const later = new Date(NOW.getTime() + 1000);
  const second = await queue.claim(later, VISIBILITY_MS);
  if (!second) throw new Error("Expected second claim");
  expect((await queue.fail(second, "Second failure", later, false)).value).toBe("RETRY");
  expect((await client.job.findUniqueOrThrow({ where: { id: job.id } })).availableAt).toEqual(new Date(later.getTime() + 2000));
});
