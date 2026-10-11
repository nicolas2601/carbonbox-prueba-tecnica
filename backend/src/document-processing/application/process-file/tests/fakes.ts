import { Either } from "../../../../shared/domain/Either";
import { Upload, type UploadProps } from "../../../domain/entities/Upload";
import type { ActivityData } from "../../../domain/entities/ActivityData";
import { FileName } from "../../../domain/value-objects/FileName";
import type { JobClaim } from "../../ports/JobClaim";
import type { IProcessingRepository, ProcessingProgress } from "../../ports/IProcessingRepository";
import type { IUploadReader } from "../../ports/IUploadReader";
import type { ICsvRecordReader, CsvRecord } from "../../ports/ICsvRecordReader";
import type { IIdGenerator } from "../../ports/IIdGenerator";
import { StaleClaimError } from "../StaleClaimError";

export const claim: JobClaim = { jobId: "job1", uploadId: "u1", claimToken: "owner1" };
export const now = new Date("2024-01-15T00:00:00Z");
export function createUpload(): Upload {
  const name = FileName.create("report.csv");
  if (name.isLeft()) throw name.value;
  return Upload.create({ id: "u1", fileName: name.value, fileUrl: "file.csv", userId: "user", now });
}
export function uploadProps(upload: Upload): UploadProps {
  return { id: upload.id, fileName: upload.fileName, fileUrl: upload.fileUrl, userId: upload.userId,
    status: upload.status, totalRows: upload.totalRows, processedRows: upload.processedRows,
    failedRows: upload.failedRows, errorMessage: upload.errorMessage, createdAt: upload.createdAt, updatedAt: upload.updatedAt };
}
export class MemoryProcessingRepository implements IProcessingRepository {
  readonly uploads = new Map<string, Upload>();
  readonly rows: ActivityData[] = [];
  readonly batches: ProcessingProgress[] = [];
  done = false;
  claimToken = claim.claimToken;
  constructor(upload: Upload) { this.uploads.set(upload.id, upload); }
  private stale(current: JobClaim): boolean {
    return current.claimToken !== this.claimToken || current.jobId !== claim.jobId || !this.uploads.has(current.uploadId);
  }
  async begin(current: JobClaim, time: Date): Promise<Either<StaleClaimError, void>> {
    if (this.stale(current)) return Either.left(new StaleClaimError("Claim expired"));
    this.rows.length = 0;
    this.uploads.get(current.uploadId)!.startProcessing(time);
    return Either.right(undefined);
  }
  async saveBatch(current: JobClaim, rows: ActivityData[], progress: ProcessingProgress, time: Date): Promise<Either<StaleClaimError, void>> {
    if (this.stale(current)) return Either.left(new StaleClaimError("Claim expired"));
    this.rows.push(...rows);
    this.batches.push({ ...progress });
    this.uploads.get(current.uploadId)!.recordProgress(progress, time);
    return Either.right(undefined);
  }
  async finish(current: JobClaim, upload: Upload): Promise<Either<StaleClaimError, void>> {
    if (this.stale(current)) return Either.left(new StaleClaimError("Claim expired"));
    this.uploads.set(upload.id, Upload.reconstitute(uploadProps(upload)));
    this.done = true;
    return Either.right(undefined);
  }
}
export class MemoryUploadReader implements IUploadReader {
  constructor(private readonly repository: MemoryProcessingRepository) {}
  async findById(id: string): Promise<Upload | null> {
    const upload = this.repository.uploads.get(id);
    return upload ? Upload.reconstitute(uploadProps(upload)) : null;
  }
}
export class PreparedRecords implements ICsvRecordReader {
  constructor(readonly records: CsvRecord[]) {}
  async *read(stream: AsyncIterable<Uint8Array>): AsyncIterable<CsvRecord> {
    for await (const _chunk of stream) { /* Consume the fake byte source before yielding prepared records. */ }
    yield* this.records;
  }
}
export class SequenceIds implements IIdGenerator {
  private value = 0;
  next(): string { return `row-${++this.value}`; }
}
