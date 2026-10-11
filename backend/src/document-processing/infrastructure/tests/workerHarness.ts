import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSettings } from "../../../config";
import { createDocumentProcessingModule } from "../dependency-injection/DocumentProcessingModule";
import { MemoryLogger } from "../../application/create-upload/tests/MemoryLogger";
import { testDatabaseUrl } from "./testDatabaseUrl";
import { NOW } from "./queueFixtures";

export async function workerHarness(batchSize = 500) {
  const storageDir = await mkdtemp(join(tmpdir(), "carbonbox-worker-"));
  const time = { value: NOW };
  const settings = { ...loadSettings(), databaseUrl: testDatabaseUrl(process.env.DATABASE_URL), storageDir,
    workerBatchSize: batchSize, workerPollIntervalMs: 100 };
  const logger = new MemoryLogger();
  const module = createDocumentProcessingModule(settings, { clock: { now: () => time.value }, logger });
  return { ...module, time, settings, logger,
    close: async () => { await module.close(); await rm(storageDir, { recursive: true, force: true }); } };
}
