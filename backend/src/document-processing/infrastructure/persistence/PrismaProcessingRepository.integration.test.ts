import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, expect, it } from "vitest";
import { PrismaProcessingRepository } from "./PrismaProcessingRepository";
import { PgJobQueue } from "../messaging/PgJobQueue";
import { integrationClient, truncateTables } from "../tests/database";
import { NOW, VISIBILITY_MS, activity, seedJob } from "../tests/queueFixtures";
import type { JobClaim } from "../../application/ports/JobClaim";
import { PrismaUploadReader } from "./PrismaUploadReader";
import { withClaim } from "./withClaim";

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

it("Completed upload and DONE job close together", async () => {
  const claim = await claimed();
  await repository.begin(claim, NOW);
  await repository.saveBatch(claim, [1, 2, 3, 4, 5].map(value => activity(`row-${value}`)), { processedRows: 5, failedRows: 0 }, NOW);
  const upload = await new PrismaUploadReader(client).findById("u1");
  if (!upload) throw new Error("Expected upload");
  const time = new Date(NOW.getTime() + 700);
  upload.complete({ totalRows: 5, processedRows: 5, failedRows: 0 }, time);
  expect((await repository.finish(claim, upload)).isRight()).toBe(true);
  expect(await client.upload.findFirstOrThrow()).toMatchObject({ status: "COMPLETED", totalRows: 5, processedRows: 5, failedRows: 0, updatedAt: time });
  expect(await client.job.findFirstOrThrow()).toMatchObject({ status: "DONE", claimToken: null, lockedUntil: null, updatedAt: time });
});
it("A deterministic FAILED upload also acknowledges the job as DONE", async () => {
  const claim = await claimed();
  await repository.begin(claim, NOW);
  const upload = await new PrismaUploadReader(client).findById("u1");
  if (!upload) throw new Error("Expected upload");
  upload.fail("No valid rows", NOW, { totalRows: 3, processedRows: 0, failedRows: 3 });
  await repository.finish(claim, upload);
  expect(await client.upload.findFirstOrThrow()).toMatchObject({ status: "FAILED", totalRows: 3, failedRows: 3, errorMessage: "No valid rows" });
  expect((await client.job.findFirstOrThrow()).status).toBe("DONE");
});
it("A failure inside finish rolls back the final upload state", async () => {
  const claim = await claimed();
  await repository.begin(claim, NOW);
  const before = await client.upload.findFirstOrThrow();
  const upload = await new PrismaUploadReader(client).findById("u1");
  if (!upload) throw new Error("Expected upload");
  upload.complete({ totalRows: 1, processedRows: 1, failedRows: 0 }, NOW);
  await client.$executeRaw`ALTER TABLE jobs ADD CONSTRAINT test_reject_done CHECK (status <> 'DONE')`;
  try {
    await expect(repository.finish(claim, upload)).rejects.toThrow();
    expect(await client.upload.findFirstOrThrow()).toEqual(before);
    expect((await client.job.findFirstOrThrow()).claimToken).toBe(claim.claimToken);
  } finally { await client.$executeRaw`ALTER TABLE jobs DROP CONSTRAINT test_reject_done`; }
});
it("An Upload payload with another id cannot close the claimed job", async () => {
  const claim = await claimed();
  await seedJob(client, "other");
  const other = await new PrismaUploadReader(client).findById("other");
  if (!other) throw new Error("Expected other upload");
  other.startProcessing(NOW);
  other.complete({ totalRows: 1, processedRows: 1, failedRows: 0 }, NOW);
  const before = await client.upload.findMany({ orderBy: { id: "asc" } });
  expect((await repository.finish(claim, other)).isLeft()).toBe(true);
  expect(await client.upload.findMany({ orderBy: { id: "asc" } })).toEqual(before);
  expect((await client.job.findUniqueOrThrow({ where: { id: claim.jobId } })).status).toBe("QUEUED");
});

it.each(["begin", "saveBatch", "finish"] as const)("A stale worker is rejected by %s", async method => {
  const first = await claimed();
  await repository.begin(first, NOW);
  const later = new Date(NOW.getTime() + VISIBILITY_MS + 1);
  const second = await queue.claim(later, VISIBILITY_MS);
  if (!second) throw new Error("Expected reclaim");
  await repository.begin(second, later);
  await repository.saveBatch(second, [activity("owned")], { processedRows: 1, failedRows: 0 }, later);
  const before = await client.upload.findFirstOrThrow();
  const upload = await new PrismaUploadReader(client).findById("u1");
  if (!upload) throw new Error("Expected upload");
  upload.fail("Stale failure", later);
  const result = method === "begin" ? await repository.begin(first, later) : method === "finish"
    ? await repository.finish(first, upload) : await repository.saveBatch(first, [activity("stale")], { processedRows: 2, failedRows: 0 }, later);
  expect(result.isLeft()).toBe(true);
  expect(await client.upload.findFirstOrThrow()).toEqual(before);
  expect((await client.activityData.findMany()).map(row => row.id)).toEqual(["owned"]);
  expect((await client.job.findFirstOrThrow()).claimToken).toBe(second.claimToken);
});
it("A slow but current worker may continue", async () => {
  const claim = await claimed();
  await repository.begin(claim, NOW);
  const later = new Date(NOW.getTime() + VISIBILITY_MS + 1);
  expect((await repository.saveBatch(claim, [activity("slow")], { processedRows: 1, failedRows: 0 }, later)).isRight()).toBe(true);
});
it("New owner completes exact rows after old-owner batch rejection", async () => {
  const first = await claimed();
  await repository.begin(first, NOW);
  await repository.saveBatch(first, [activity("old")], { processedRows: 1, failedRows: 0 }, NOW);
  const later = new Date(NOW.getTime() + VISIBILITY_MS + 1);
  const second = await queue.claim(later, VISIBILITY_MS);
  if (!second) throw new Error("Expected reclaim");
  await repository.begin(second, later);
  expect((await repository.saveBatch(first, [activity("stale")], { processedRows: 2, failedRows: 0 }, later)).isLeft()).toBe(true);
  expect(await client.activityData.count()).toBe(0);
  await repository.saveBatch(second, [1, 2, 3].map(value => activity(`new-${value}`)), { processedRows: 3, failedRows: 0 }, later);
  const upload = await new PrismaUploadReader(client).findById("u1");
  if (!upload) throw new Error("Expected upload");
  upload.complete({ totalRows: 3, processedRows: 3, failedRows: 0 }, later);
  await repository.finish(second, upload);
  expect(await client.activityData.count()).toBe(3);
  expect(await client.upload.findFirstOrThrow()).toMatchObject({ status: "COMPLETED", processedRows: 3 });
});
it.each(["begin", "saveBatch", "finish"] as const)("Mismatched claim upload is rejected by %s", async method => {
  const current = await claimed();
  await seedJob(client, "other");
  const forged = { ...current, uploadId: "other" };
  const other = await new PrismaUploadReader(client).findById("other");
  if (!other) throw new Error("Expected upload");
  other.fail("Forged failure", NOW);
  const before = await client.upload.findMany({ orderBy: { id: "asc" } });
  const result = method === "begin" ? await repository.begin(forged, NOW) : method === "finish"
    ? await repository.finish(forged, other) : await repository.saveBatch(forged, [activity("wrong", "other")], { processedRows: 1, failedRows: 0 }, NOW);
  expect(result.isLeft()).toBe(true);
  expect(await client.upload.findMany({ orderBy: { id: "asc" } })).toEqual(before);
  expect(await client.activityData.count()).toBe(0);
});
it("The fence row lock prevents reclaim during an interleaved write", async () => {
  const claim = await claimed();
  let ready!: () => void;
  let release!: () => void;
  const locked = new Promise<void>(resolve => { ready = resolve; });
  const resume = new Promise<void>(resolve => { release = resolve; });
  const writing = withClaim(client, claim, async tx => {
    await tx.activityData.create({ data: { id: "locked", uploadId: "u1", category: "Water", amount: 10, unit: "m3", date: NOW, createdAt: NOW } });
    ready();
    await resume;
  });
  await locked;
  try {
    expect(await client.activityData.count()).toBe(0);
    expect(await queue.claim(new Date(NOW.getTime() + VISIBILITY_MS + 1), VISIBILITY_MS)).toBeNull();
  } finally { release(); await writing; }
  expect(await client.activityData.count()).toBe(1);
});
