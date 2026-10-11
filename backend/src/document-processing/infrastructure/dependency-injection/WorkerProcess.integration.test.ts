import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { afterAll, beforeEach, expect, it } from "vitest";
import { integrationClient, truncateTables } from "../tests/database";
import { workerHarness } from "../tests/workerHarness";

const client = integrationClient();
beforeEach(async () => { await truncateTables(client); });
afterAll(async () => { await client.$disconnect(); });
function outputUntilProcessed(child: ChildProcessWithoutNullStreams) {
  const output = { stdout: "", stderr: "" };
  const processed = new Promise<void>((resolve, reject) => {
    child.stdout.on("data", chunk => { output.stdout += String(chunk); if (output.stdout.includes('"message":"Job processed"')) resolve(); });
    child.stderr.on("data", chunk => { output.stderr += String(chunk); });
    child.on("error", reject);
    child.on("close", code => { reject(new Error(`Worker exited before processing (${code}): ${output.stderr}`)); });
  });
  const stopped = new Promise<{ code: number | null; signal: string | null }>(resolve => {
    child.on("close", (code, signal) => { resolve({ code, signal }); });
  });
  return { output, processed, stopped };
}
it("Real bun run worker processes a queued file and exits zero on SIGTERM", async () => {
  const harness = await workerHarness();
  async function* file(): AsyncIterable<Uint8Array> { yield new TextEncoder().encode("category,amount,unit,date\nWater,10,m3,2024-01-15\n"); }
  const created = await harness.createUpload.execute({ fileName: "smoke.csv", userId: "user", stream: file() });
  if (created.isLeft()) throw created.value;
  const child = spawn("bun", ["run", "worker"], { cwd: process.cwd(), env: { ...process.env,
    NODE_ENV: "test", STORAGE_DIR: harness.settings.storageDir, WORKER_POLL_INTERVAL_MS: "100" } });
  const { output, processed, stopped } = outputUntilProcessed(child);
  try {
    await processed;
    expect(await client.upload.findUnique({ where: { id: created.value.id } })).toMatchObject({ status: "COMPLETED", processedRows: 1 });
    child.kill("SIGTERM");
    expect(await stopped).toEqual({ code: 0, signal: null });
    console.log(`WORKER_SMOKE_STDOUT\n${output.stdout}WORKER_SMOKE_EXIT 0`);
    console.log(`WORKER_SMOKE_STDERR\n${output.stderr}`);
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    await stopped;
    await harness.close();
  }
}, 15000);
