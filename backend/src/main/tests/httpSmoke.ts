import { execFile, spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { integrationClient, truncateTables } from "../../document-processing/infrastructure/tests/database";
import { workerHarness } from "../../document-processing/infrastructure/tests/workerHarness";

interface Exit { code: number | null; signal: string | null; }
interface Watched { child: ChildProcessWithoutNullStreams; stdout: string; stderr: string; stopped: Promise<Exit>; wait(pattern: RegExp): Promise<string>; }
export interface HttpSmokeReport { postStatus: number; upload: Record<string, unknown>; results: { total: number; rows: number }; stats: object; paths: string[]; apiExit: Exit; workerExit: Exit; apiLogs: string; workerLogs: string; }
const execute = promisify(execFile);
function start(script: string, env: NodeJS.ProcessEnv): Watched {
  const child = spawn("bun", ["run", script], { cwd: process.cwd(), env });
  const observed: Watched = { child, stdout: "", stderr: "", stopped: new Promise(resolve => {
    child.on("close", (code, signal) => { resolve({ code, signal }); });
  }), wait: pattern => new Promise((resolve, reject) => {
    const check = (): void => { const match = observed.stdout.match(pattern); if (match) { child.stdout.off("data", check); resolve(match[0]); } };
    child.stdout.on("data", check);
    child.on("error", reject);
    child.on("close", code => { reject(new Error(`${script} stopped before readiness (${code}): ${observed.stderr}`)); });
    check();
  }) };
  child.stdout.on("data", chunk => { observed.stdout += String(chunk); });
  child.stderr.on("data", chunk => { observed.stderr += String(chunk); });
  return observed;
}
async function stop(process: Watched): Promise<Exit> {
  if (process.child.exitCode === null && process.child.signalCode === null) process.child.kill("SIGTERM");
  return process.stopped;
}
async function readJson(address: string, path: string): Promise<string> {
  return (await execute("curl", ["-sS", `${address}${path}`])).stdout;
}
export async function runHttpSmoke(): Promise<HttpSmokeReport> {
  const client = integrationClient();
  await truncateTables(client);
  const harness = await workerHarness();
  const env = { ...process.env, STORAGE_DIR: harness.settings.storageDir, WORKER_POLL_INTERVAL_MS: "100", NODE_ENV: "development", LOG_LEVEL: "info", HOST: "127.0.0.1", PORT: "0" };
  const api = start("start", env);
  const worker = start("worker", env);
  try {
    const address = await api.wait(/http:\/\/127\.0\.0\.1:\d+/);
    await worker.wait(/"message":"Worker started"/);
    const file = fileURLToPath(new URL("../../../../samples/sample-invalid.csv", import.meta.url));
    const posted = (await execute("curl", ["-sS", "-F", `file=@${file}`, "-w", "\n%{http_code}", `${address}/api/v1/uploads`])).stdout;
    const postStatus = Number(posted.slice(posted.lastIndexOf("\n") + 1));
    if (postStatus !== 201) throw new Error(`Smoke upload failed (${postStatus})`);
    const created = JSON.parse(posted.slice(0, posted.lastIndexOf("\n"))) as { id: string };
    await worker.wait(/"message":"Job processed"/);
    const upload = JSON.parse(await readJson(address, `/api/v1/uploads/${created.id}`)) as Record<string, unknown>;
    const results = JSON.parse(await readJson(address, `/api/v1/uploads/${created.id}/results?limit=100`)) as { total: number; data: unknown[] };
    const stats = JSON.parse(await readJson(address, "/api/v1/uploads/stats")) as object;
    const docs = JSON.parse(await readJson(address, "/docs/json")) as { paths: Record<string, unknown> };
    const [apiExit, workerExit] = await Promise.all([stop(api), stop(worker)]);
    return { postStatus, upload, results: { total: results.total, rows: results.data.length }, stats,
      paths: Object.keys(docs.paths), apiExit, workerExit, apiLogs: api.stdout, workerLogs: worker.stdout };
  } finally {
    await Promise.all([stop(api), stop(worker)]);
    await client.$disconnect();
    await harness.close();
  }
}
