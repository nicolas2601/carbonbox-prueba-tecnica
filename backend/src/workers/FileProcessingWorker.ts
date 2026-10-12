import { loadSettings } from "../config";
import { createDocumentProcessingModule } from "../document-processing/infrastructure/dependency-injection/DocumentProcessingModule";
import { SystemClock } from "../document-processing/infrastructure/runtime/SystemClock";
import { JsonConsoleLogger } from "../document-processing/infrastructure/logging/JsonConsoleLogger";

async function main(): Promise<void> {
  const module = createDocumentProcessingModule(loadSettings());
  const controller = new AbortController();
  const stop = (): void => { controller.abort(); };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  try {
    module.logger.info("Worker started");
    await module.worker.run(controller.signal);
    module.logger.info("Worker stopped");
  } finally {
    process.removeListener("SIGINT", stop);
    process.removeListener("SIGTERM", stop);
    await module.close();
  }
}

void main().catch(() => {
  new JsonConsoleLogger(new SystemClock(), line => { process.stderr.write(`${line}\n`); }).error("Worker stopped unexpectedly");
  process.exitCode = 1;
});
