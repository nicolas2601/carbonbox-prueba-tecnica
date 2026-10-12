import { performance } from "node:perf_hooks";
import { loadSettings } from "../src/config";
import { createDocumentProcessingModule } from "../src/document-processing/infrastructure/dependency-injection/DocumentProcessingModule";
import { Worker } from "../src/document-processing/application/worker/Worker";
import type { ProcessFileCommandHandler } from "../src/document-processing/application/process-file/ProcessFileCommandHandler";
import { SystemClock } from "../src/document-processing/infrastructure/runtime/SystemClock";
import { AbortableWait } from "../src/document-processing/infrastructure/runtime/AbortableWait";
import { ownedUrl, assertStorage } from "../src/performance/scope";
import { measure } from "../src/performance/measure";

async function main(): Promise<void> {
  const settings = loadSettings();
  ownedUrl(settings.databaseUrl, process.env.PERF_RUN_ID ?? "");
  await assertStorage(settings.storageDir, process.env.PERF_RUN_ID ?? "");
  const runtime = createDocumentProcessingModule(settings);
  const controller = new AbortController();
  const stop = () => controller.abort();
  process.once("SIGTERM", stop); process.once("SIGINT", stop);
  const handler: Pick<ProcessFileCommandHandler, "execute"> = { execute: async command => {
    const result = await measure(() => runtime.processFile.execute(command), () => performance.now());
    process.stdout.write(`${JSON.stringify({ kind: "worker-performance", uploadId: command.claim.uploadId, elapsedMs: result.elapsedMs })}\n`);
    return result.value;
  } };
  const worker = new Worker(runtime.queue, handler, new SystemClock(), runtime.logger, settings.workerVisibilityTimeoutMs,
    settings.workerPollIntervalMs, new AbortableWait());
  try { await runtime.ready(); await worker.run(controller.signal); }
  finally { process.removeListener("SIGTERM", stop); process.removeListener("SIGINT", stop); await runtime.close(); }
}
void main().catch(() => { process.stderr.write("Measured worker failed\n"); process.exitCode = 1; });
