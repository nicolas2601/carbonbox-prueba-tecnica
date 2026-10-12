import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { cpus, totalmem, release, loadavg } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "dotenv";
import { PerformanceStack } from "../src/performance/stack";
import { adminUrl } from "../src/performance/scope";
import { seed, plans, assertDatabase, candidateIndex, SEED_UPLOADS, ROWS_PER_SEED_UPLOAD } from "../src/performance/dataset";
import { largeUpload } from "../src/performance/http";
import { load } from "../src/performance/load";
import { redactSecrets } from "../src/document-processing/presentation/http/redactSecrets";

const backend = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repository = resolve(backend, "..");
const output = resolve(repository, "docs/performance");
const sample = resolve(repository, "samples/sample-large.csv");
const controller = new AbortController();
const interrupt = () => controller.abort();
process.once("SIGINT", interrupt); process.once("SIGTERM", interrupt);

async function connection(): Promise<string> {
  if (process.env.PERF_ADMIN_DATABASE_URL) return adminUrl(process.env.PERF_ADMIN_DATABASE_URL);
  const values = parse(await readFile(resolve(backend, ".env")));
  if (!values.DATABASE_URL) throw new Error("PERF_ADMIN_DATABASE_URL or local database configuration is required");
  const url = new URL(values.DATABASE_URL); url.pathname = "/postgres"; url.search = "";
  return adminUrl(url.toString());
}
async function save(name: string, value: unknown): Promise<void> {
  await mkdir(output, { recursive: true });
  await writeFile(resolve(output, `${name}.json`), `${JSON.stringify(value)}\n`, { flag: "wx" });
}
async function record(stack: PerformanceStack, phase: string): Promise<void> {
  if (!stack.data || !stack.apiUrl || !stack.worker) throw new Error("Owned stack is incomplete");
  await assertDatabase(stack.data, stack.database.name);
  await seed(stack.data, stack.database.name);
  const candidate = phase === "index-candidate" ? await candidateIndex(stack.data, stack.database.name) : undefined;
  const processing = [];
  for (let trial = 0; trial < 3; trial++) processing.push(await largeUpload(stack.apiUrl, sample, stack.worker, controller.signal));
  const uploadId = processing[0]?.id;
  if (!uploadId) throw new Error("No reference upload created");
  await stack.data.query("ANALYZE uploads"); await stack.data.query("ANALYZE activity_data");
  const queryPlans = await plans(stack.data, uploadId);
  const version = await stack.data.query<{ version: string }>("SELECT version() AS version");
  const metadata = { phase, runId: stack.runId, commit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: repository, encoding: "utf8" }).trim(),
    recordedAt: new Date().toISOString(), platform: process.platform, release: release(), cpu: cpus()[0]?.model, logicalCores: cpus().length,
    memoryBytes: totalmem(), loadAverage: loadavg(), node: process.version, postgres: version.rows[0]?.version,
    sampleSha256: createHash("sha256").update(await readFile(sample)).digest("hex"), seedUploads: SEED_UPLOADS, rowsPerSeedUpload: ROWS_PER_SEED_UPLOAD,
    workerBatchSize: 500, workerPollMs: 1000, apiPoolDefault: 10, workerPoolDefault: 10, apiLogging: "silent", measuredSeconds: 15, connections: 20, pipelining: 1,
    requestHeaders: { "accept-encoding": "gzip" }, percentileMethod: "nearest rank of unrounded response-event milliseconds" };
  await save(`${phase}-${stack.runId}-setup`, { metadata, processing, queryPlans, candidate });
  const targets = { list: "/uploads?page=1&limit=10", stats: "/uploads/stats", detail: `/uploads/${uploadId}`, results: `/uploads/${uploadId}/results?page=1&limit=25` };
  for (const [name, path] of Object.entries(targets)) {
    const url = `${stack.apiUrl}/api/v1${path}`;
    const check = await fetch(url); if (!check.ok) throw new Error("Endpoint preflight failed"); await check.arrayBuffer();
    const result = await load(url, controller.signal);
    await save(`${phase}-${stack.runId}-${name}`, { metadata, ...result });
    process.stdout.write(`${JSON.stringify({ endpoint: name, milliseconds: result.milliseconds, requestsPerSecond: result.raw.requests.average, errors: result.raw.errors })}\n`);
  }
}
async function main(): Promise<void> {
  const phase = process.argv[2] ?? "baseline";
  if (!["baseline", "after", "index-candidate"].includes(phase)) throw new Error("Use baseline, after or index-candidate");
  const stack = new PerformanceStack(backend, await connection());
  try { await stack.prepare(controller.signal); await record(stack, phase); }
  finally { await stack.close(); }
  process.stdout.write("Owned performance database, storage and processes cleaned up\n");
}
void main().catch((error: unknown) => {
  process.stderr.write(`${JSON.stringify({ failure: "Performance run failed", type: error instanceof Error ? error.name : "Unknown", message: error instanceof Error ? redactSecrets(error.message) : "Unknown failure" })}\n`);
  process.exitCode = 1;
}).finally(() => { process.removeListener("SIGINT", interrupt); process.removeListener("SIGTERM", interrupt); });
