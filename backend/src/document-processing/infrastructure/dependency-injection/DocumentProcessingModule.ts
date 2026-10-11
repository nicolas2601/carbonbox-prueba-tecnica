import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../generated/prisma/client";
import type { IConvictProps } from "../../../config/IConvictProps";
import type { IClock } from "../../application/ports/IClock";
import type { ILogger } from "../../application/ports/ILogger";
import type { IProcessingRepository } from "../../application/ports/IProcessingRepository";
import { CreateUploadCommandHandler } from "../../application/create-upload/CreateUploadCommandHandler";
import { ProcessFileCommandHandler } from "../../application/process-file/ProcessFileCommandHandler";
import { Worker } from "../../application/worker/Worker";
import { PrismaUploadRepository } from "../persistence/PrismaUploadRepository";
import { PrismaUploadReader } from "../persistence/PrismaUploadReader";
import { PrismaProcessingRepository } from "../persistence/PrismaProcessingRepository";
import { PgJobQueue } from "../messaging/PgJobQueue";
import { FsFileStorage } from "../storage/FsFileStorage";
import { CsvParseRecordReader } from "../csv/CsvParseRecordReader";
import { JsonConsoleLogger } from "../logging/JsonConsoleLogger";
import { SystemClock } from "../runtime/SystemClock";
import { AbortableWait } from "../runtime/AbortableWait";

interface RuntimeOverrides { clock?: IClock; logger?: ILogger; processing?: (real: IProcessingRepository) => IProcessingRepository; }
export interface DocumentProcessingModule {
  createUpload: CreateUploadCommandHandler;
  processFile: ProcessFileCommandHandler;
  worker: Worker;
  queue: PgJobQueue;
  processing: IProcessingRepository;
  uploads: PrismaUploadReader;
  storage: FsFileStorage;
  reader: CsvParseRecordReader;
  logger: ILogger;
  close(): Promise<void>;
}

export function createDocumentProcessingModule(settings: IConvictProps, runtime: RuntimeOverrides = {}): DocumentProcessingModule {
  const client = new PrismaClient({ adapter: new PrismaPg({ connectionString: settings.databaseUrl }) });
  const clock = runtime.clock ?? new SystemClock();
  const ids = { next: randomUUID };
  const logger = runtime.logger ?? new JsonConsoleLogger(clock, line => { process.stdout.write(`${line}\n`); });
  const storage = new FsFileStorage(settings.storageDir, ids);
  const uploads = new PrismaUploadReader(client);
  const queue = new PgJobQueue(client, ids, settings.workerRetryBaseMs);
  const realProcessing = new PrismaProcessingRepository(client, settings.workerVisibilityTimeoutMs);
  const processing = runtime.processing?.(realProcessing) ?? realProcessing;
  const reader = new CsvParseRecordReader();
  const createUpload = new CreateUploadCommandHandler(storage, new PrismaUploadRepository(client, settings.workerMaxAttempts), ids, clock, logger);
  const processFile = new ProcessFileCommandHandler(uploads, storage, reader, processing, ids, clock, settings.workerBatchSize);
  const worker = new Worker(queue, processFile, clock, logger, settings.workerVisibilityTimeoutMs,
    settings.workerPollIntervalMs, new AbortableWait());
  return { createUpload, processFile, worker, queue, processing, uploads, storage, reader, logger, close: () => client.$disconnect() };
}
