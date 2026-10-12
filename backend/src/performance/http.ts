import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import type { UploadView } from "../document-processing/application/queries/models";
import type { OwnedProcess } from "./processes";

const POLL_MS = 50;
const DEADLINE_MS = 90000;
export async function waitFor<T>(action: () => Promise<T | undefined>, signal: AbortSignal): Promise<T> {
  const deadline = performance.now() + DEADLINE_MS;
  while (!signal.aborted && performance.now() < deadline) {
    const result = await action();
    if (result !== undefined) return result;
    await new Promise(resolve => setTimeout(resolve, POLL_MS));
  }
  throw new Error("Performance operation timed out or was interrupted");
}
export async function ready(base: string, signal: AbortSignal): Promise<void> {
  await waitFor(async () => {
    try { const response = await fetch(`${base}/health/ready`, { signal }); return response.ok ? true : undefined; }
    catch { return undefined; }
  }, signal);
}
export async function largeUpload(base: string, file: string, worker: OwnedProcess, signal: AbortSignal) {
  const start = performance.now();
  const data = new FormData();
  data.append("file", new File([new Uint8Array(await readFile(file))], "sample-large.csv", { type: "text/csv" }));
  const accepted = await fetch(`${base}/api/v1/uploads`, { method: "POST", body: data, signal });
  if (accepted.status !== 201) throw new Error("Performance upload was not accepted");
  const created = await accepted.json() as { id: string };
  const result = await waitFor(async () => {
    const response = await fetch(`${base}/api/v1/uploads/${encodeURIComponent(created.id)}`, { signal });
    if (!response.ok) throw new Error("Cannot inspect benchmark upload");
    const upload = await response.json() as UploadView;
    if (upload.status === "FAILED") throw new Error("Benchmark CSV processing failed");
    return upload.status === "COMPLETED" ? upload : undefined;
  }, signal);
  const endToEndMs = performance.now() - start;
  if (result.totalRows !== 5000 || result.processedRows !== 5000 || result.failedRows !== 0) throw new Error("Unexpected large-fixture counters");
  const metric = await waitFor(async () => workerMetric(worker.lines, created.id), signal);
  return { id: created.id, rows: result.processedRows, processingMs: metric, rowsPerSecond: result.processedRows / (metric / 1000), endToEndMs };
}
function workerMetric(lines: string[], id: string): number | undefined {
  for (const line of lines) {
    if (!line.startsWith("{")) continue;
    const value = JSON.parse(line) as Record<string, unknown>;
    if (value.kind === "worker-performance" && value.uploadId === id && typeof value.elapsedMs === "number" && value.elapsedMs > 0) return value.elapsedMs;
  }
  return undefined;
}
