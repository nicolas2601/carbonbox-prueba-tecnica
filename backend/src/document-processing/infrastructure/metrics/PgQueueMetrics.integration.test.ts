import { afterAll, afterEach, beforeEach, expect, it, vi } from "vitest";
import { integrationClient, truncateTables } from "../tests/database";
import { NOW, seedJob } from "../tests/queueFixtures";
import { PgQueueMetrics } from "./PgQueueMetrics";

const client = integrationClient();
beforeEach(async () => { await truncateTables(client); });
afterEach(() => vi.restoreAllMocks());
afterAll(async () => { await client.$disconnect(); });
it("Reads actual durable backlog and age with one grouped query", async () => {
  for (const id of ["queued-1", "queued-2", "queued-3", "dead-1"]) await seedJob(client, id);
  await client.job.update({ where: { uploadId: "dead-1" }, data: { status: "DEAD" } });
  await client.job.updateMany({ data: { createdAt: NOW } });
  const query = vi.spyOn(client, "$queryRaw");
  const metrics = new PgQueueMetrics(client, { now: () => new Date(NOW.getTime() + 2000) });
  expect(await metrics.snapshot()).toEqual({ queued: 3, done: 0, dead: 1, oldestQueuedAgeSeconds: 2 });
  expect(query).toHaveBeenCalledTimes(1);
});
it("Reports zero for an empty queue instead of retaining a previous snapshot", async () => {
  const metrics = new PgQueueMetrics(client, { now: () => NOW });
  await seedJob(client);
  expect((await metrics.snapshot()).queued).toBe(1);
  await truncateTables(client);
  expect(await metrics.snapshot()).toEqual({ queued: 0, done: 0, dead: 0, oldestQueuedAgeSeconds: 0 });
});
