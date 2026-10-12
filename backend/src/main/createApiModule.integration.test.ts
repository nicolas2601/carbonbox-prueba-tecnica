import { spawn } from "node:child_process";
import { afterAll, beforeEach, expect, it } from "vitest";
import { createApiModule } from "./createApiModule";
import { workerHarness } from "../document-processing/infrastructure/tests/workerHarness";
import { integrationClient, truncateTables } from "../document-processing/infrastructure/tests/database";

const client = integrationClient();
beforeEach(async () => { await truncateTables(client); });
afterAll(async () => { await client.$disconnect(); });
it("API composition exposes shared read and write adapters", async () => {
  const harness = await workerHarness();
  const api = await createApiModule(harness.settings);
  try {
    expect((await api.server.inject("/api/v1/uploads/stats")).json()).toEqual({ total: 0, completed: 0, inProgress: 0, failed: 0 });
    expect((await api.server.inject("/health/ready")).statusCode).toBe(200);
    expect((await api.server.inject("/metrics")).statusCode).toBe(404);
    const metrics = await api.metricsServer.inject("/metrics");
    expect(metrics.statusCode).toBe(200);
    expect(metrics.body).toContain('carbonbox_queue_jobs{status="QUEUED"} 0');
    expect(metrics.body).toContain("carbonbox_http_request_duration_seconds");
  } finally { await api.server.close(); await harness.close(); }
});
it("Real bun run start closes cleanly after SIGTERM", async () => {
  const child = spawn("bun", ["run", "start"], { cwd: process.cwd(), env: { ...process.env, NODE_ENV: "development", LOG_LEVEL: "info", HOST: "127.0.0.1", PORT: "0", METRICS_PORT: "0" } });
  let output = "";
  const listening = new Promise<string>((resolve, reject) => {
    child.stdout.on("data", chunk => { output += String(chunk); const address = output.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0]; if (address) resolve(address); });
    child.on("error", reject);
    child.on("close", code => { reject(new Error(`API exited before listening (${code})`)); });
  });
  const stopped = new Promise<{ code: number | null; signal: string | null }>(resolve => { child.on("close", (code, signal) => { resolve({ code, signal }); }); });
  try {
    const address = await listening;
    expect((await fetch(`${address}/health/ready`)).status).toBe(200);
    child.kill("SIGTERM");
    expect(await stopped).toEqual({ code: 0, signal: null });
  } finally { if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL"); await stopped; }
}, 15000);
