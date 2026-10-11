import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSettings } from "../../../config";
import { createDocumentProcessingModule } from "../dependency-injection/DocumentProcessingModule";
import { JsonConsoleLogger } from "../logging/JsonConsoleLogger";
import { testDatabaseUrl } from "./testDatabaseUrl";
import { NOW } from "./queueFixtures";
import type { IProcessingRepository } from "../../application/ports/IProcessingRepository";

export async function workerHarness(batchSize = 500, decorate?: (real: IProcessingRepository) => IProcessingRepository) {
  const storageDir = await mkdtemp(join(tmpdir(), "carbonbox-worker-"));
  const time = { value: NOW };
  const settings = { ...loadSettings(), databaseUrl: testDatabaseUrl(process.env.DATABASE_URL), storageDir,
    workerBatchSize: batchSize, workerPollIntervalMs: 100 };
  const logs: string[] = [];
  const clock = { now: () => time.value };
  const logger = new JsonConsoleLogger(clock, line => { logs.push(line); });
  const module = createDocumentProcessingModule(settings, { clock: { now: () => time.value }, logger, processing: decorate });
  return { ...module, time, settings, logger, logs,
    close: async () => { await module.close(); await rm(storageDir, { recursive: true, force: true }); } };
}
