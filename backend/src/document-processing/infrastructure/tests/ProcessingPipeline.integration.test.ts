import { createReadStream } from "node:fs";
import { afterAll, beforeEach, expect, it } from "vitest";
import { integrationClient, truncateTables } from "./database";
import { workerHarness } from "./workerHarness";

type Harness = Awaited<ReturnType<typeof workerHarness>>;
const client = integrationClient();
beforeEach(async () => { await truncateTables(client); });
afterAll(async () => { await client.$disconnect(); });
async function uploadCsv(harness: Harness, name: string, stream: AsyncIterable<Uint8Array>): Promise<string> {
  const result = await harness.createUpload.execute({ fileName: name, userId: "user", stream });
  if (result.isLeft()) throw result.value;
  return result.value.id;
}
async function* text(text: string): AsyncIterable<Uint8Array> { yield new TextEncoder().encode(text); }

it.each([
  { file: "sample-data.csv", total: 60, processed: 60, failed: 0 },
  { file: "samples/sample-invalid.csv", total: 25, processed: 15, failed: 10 },
])("Full real-adapter pipeline: $file", async expected => {
  const harness = await workerHarness();
  try {
    const path = new URL(`../../../../../${expected.file}`, import.meta.url);
    const id = await uploadCsv(harness, "sample.csv", createReadStream(path));
    expect(await harness.worker.runOnce()).toBe(true);
    const upload = await client.upload.findUniqueOrThrow({ where: { id } });
    expect(upload).toMatchObject({ status: "COMPLETED", totalRows: expected.total,
      processedRows: expected.processed, failedRows: expected.failed });
    expect(await client.activityData.count({ where: { uploadId: id } })).toBe(expected.processed);
    expect(await client.job.findUnique({ where: { uploadId: id } })).toMatchObject({ status: "DONE", attempts: 1 });
    if (expected.failed) {
      for (const line of [3, 5, 7, 9, 11, 13, 15, 17, 19, 21]) expect(upload.errorMessage).toContain(`line ${line}:`);
    }
  } finally { await harness.close(); }
});

it("Large sample stores 5000 rows with monotonic committed batch progress", async () => {
  const progress: number[] = [];
  const harness = await workerHarness(500, real => ({
    begin: (claim, now) => real.begin(claim, now),
    finish: (claim, upload) => real.finish(claim, upload),
    saveBatch: async (claim, rows, counters, now) => {
      const result = await real.saveBatch(claim, rows, counters, now);
      if (result.isRight()) progress.push((await client.upload.findUniqueOrThrow({ where: { id: claim.uploadId } })).processedRows ?? 0);
      return result;
    },
  }));
  try {
    const file = new URL("../../../../../samples/sample-large.csv", import.meta.url);
    const id = await uploadCsv(harness, "large.csv", createReadStream(file));
    await harness.worker.runOnce();
    expect(await client.upload.findUnique({ where: { id } })).toMatchObject({ status: "COMPLETED", totalRows: 5000, processedRows: 5000, failedRows: 0 });
    expect(await client.activityData.count({ where: { uploadId: id } })).toBe(5000);
    expect(progress).toEqual(Array.from({ length: 10 }, (_, index) => (index + 1) * 500));
  } finally { await harness.close(); }
});
it("Wrong header fails the upload but acknowledges the job without retry", async () => {
  const harness = await workerHarness();
  try {
    const id = await uploadCsv(harness, "wrong.csv", text("category,amount,date\nWater,10,2024-01-15\n"));
    await harness.worker.runOnce();
    expect(await client.upload.findUnique({ where: { id } })).toMatchObject({ status: "FAILED", errorMessage: expect.stringContaining("unit") });
    expect(await client.job.findUnique({ where: { uploadId: id } })).toMatchObject({ status: "DONE", attempts: 1 });
    expect(await client.activityData.count()).toBe(0);
  } finally { await harness.close(); }
});
it("Unclosed quote fails permanently after one attempt with no leaked file text", async () => {
  const harness = await workerHarness();
  try {
    const id = await uploadCsv(harness, "broken.csv", text('category,amount,unit,date\n"private-content,10,L,2024-01-15'));
    await harness.worker.runOnce();
    expect(await client.upload.findUnique({ where: { id } })).toMatchObject({ status: "FAILED",
      errorMessage: "The file is not valid CSV: check quotes and field sizes" });
    expect(await client.job.findUnique({ where: { uploadId: id } })).toMatchObject({ status: "DEAD", attempts: 1 });
    expect(harness.logs.join("\n")).not.toContain("private-content");
  } finally { await harness.close(); }
});
