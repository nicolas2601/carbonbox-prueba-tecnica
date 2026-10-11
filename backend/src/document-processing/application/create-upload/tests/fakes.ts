import { Either } from "../../../../shared/domain/Either";
import type { Upload } from "../../../domain/entities/Upload";
import type { IFileStorage } from "../../ports/IFileStorage";
import type { IUploadRepository } from "../../ports/IUploadRepository";
import type { IClock } from "../../ports/IClock";
import type { IIdGenerator } from "../../ports/IIdGenerator";
import type { ProcessFileJob } from "../../ports/ProcessFileJob";
import type { StorageFailureError } from "../StorageFailureError";
import type { UploadPersistenceError } from "../UploadPersistenceError";

export class MemoryStorage implements IFileStorage {
  readonly files = new Map<string, Uint8Array[]>();
  async *open(key: string): AsyncIterable<Uint8Array> {
    const chunks = this.files.get(key);
    if (!chunks) throw new Error("Stored file is missing");
    yield* chunks;
  }
  async save(stream: AsyncIterable<Uint8Array>): Promise<Either<StorageFailureError, string>> {
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) chunks.push(chunk.slice());
    this.files.set("k1.csv", chunks);
    return Either.right("k1.csv");
  }
  async delete(key: string): Promise<Either<StorageFailureError, void>> {
    this.files.delete(key);
    return Either.right(undefined);
  }
}

export class MemoryUploadRepository implements IUploadRepository {
  readonly uploads: Upload[] = [];
  readonly jobs: ProcessFileJob[] = [];
  async saveWithJob(upload: Upload, job: ProcessFileJob): Promise<Either<UploadPersistenceError, void>> {
    this.uploads.push(upload);
    this.jobs.push(job);
    return Either.right(undefined);
  }
}

export class FixedClock implements IClock {
  constructor(private readonly value: Date) {}
  now(): Date { return this.value; }
}

export class FixedIdGenerator implements IIdGenerator {
  constructor(private readonly value: string) {}
  next(): string { return this.value; }
}
