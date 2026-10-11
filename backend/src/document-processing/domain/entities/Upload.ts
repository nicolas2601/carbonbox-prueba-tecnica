import type { FileName } from "../value-objects/FileName";
import type { UploadStatusValue } from "../value-objects/UploadStatus";
import { Either } from "../../../shared/domain/Either";
import { InvalidStatusTransitionError } from "../errors/InvalidStatusTransitionError";
import { InvalidProgressError } from "../errors/InvalidProgressError";

const COUNTER_MISMATCH = "Processed and failed rows must equal total rows";

export interface UploadProps {
  id: string;
  fileName: FileName;
  fileUrl: string;
  userId: string;
  status: UploadStatusValue;
  totalRows: number | null;
  processedRows: number | null;
  failedRows: number | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type CreateUploadProps = Pick<UploadProps, "id" | "fileName" | "fileUrl" | "userId"> & { now: Date };
export interface UploadCounters { totalRows: number; processedRows: number; failedRows: number; }

export class Upload {
  private constructor(private readonly props: UploadProps) {}
  static create({ now, ...props }: CreateUploadProps): Upload {
    return new Upload({ ...props, status: "PENDING", totalRows: null, processedRows: null,
      failedRows: null, errorMessage: null, createdAt: now, updatedAt: now });
  }
  static reconstitute(props: UploadProps): Upload { return new Upload({ ...props }); }
  startProcessing(now: Date): Either<InvalidStatusTransitionError, void> {
    if (this.terminal()) return Either.left(new InvalidStatusTransitionError(this.status, "PROCESSING"));
    Object.assign(this.props, { status: "PROCESSING", totalRows: 0, processedRows: 0,
      failedRows: 0, errorMessage: null, updatedAt: now });
    return Either.right(undefined);
  }
  recordProgress(progress: { processedRows: number; failedRows: number }, now: Date): Either<InvalidStatusTransitionError | InvalidProgressError, void> {
    if (this.status !== "PROCESSING") return Either.left(new InvalidStatusTransitionError(this.status, "PROCESSING"));
    if (!this.validCounters(Object.values(progress))) return Either.left(new InvalidProgressError("Counters must be non-negative integers"));
    Object.assign(this.props, progress, { updatedAt: now });
    return Either.right(undefined);
  }
  private validCounters(values: number[]): boolean {
    return values.every(value => Number.isSafeInteger(value) && value >= 0);
  }
  complete(counters: UploadCounters, now: Date, summary?: string): Either<InvalidStatusTransitionError | InvalidProgressError, void> {
    if (this.status !== "PROCESSING") return Either.left(new InvalidStatusTransitionError(this.status, "COMPLETED"));
    if (!this.validFinalCounters(counters)) {
      return Either.left(new InvalidProgressError(COUNTER_MISMATCH));
    }
    Object.assign(this.props, counters, { status: "COMPLETED", updatedAt: now, errorMessage: summary ?? null });
    return Either.right(undefined);
  }
  get id(): string { return this.props.id; }
  fail(reason: string, now: Date, counters?: UploadCounters): Either<InvalidStatusTransitionError | InvalidProgressError, void> {
    if (this.terminal()) return Either.left(new InvalidStatusTransitionError(this.status, "FAILED"));
    if (counters && !this.validFinalCounters(counters)) return Either.left(new InvalidProgressError(COUNTER_MISMATCH));
    Object.assign(this.props, counters ?? {}, { status: "FAILED", errorMessage: reason, updatedAt: now });
    return Either.right(undefined);
  }
  get fileName(): FileName { return this.props.fileName; }
  get fileUrl(): string { return this.props.fileUrl; }
  get userId(): string { return this.props.userId; }
  get status(): UploadStatusValue { return this.props.status; }
  get totalRows(): number | null { return this.props.totalRows; }
  get processedRows(): number | null { return this.props.processedRows; }
  get failedRows(): number | null { return this.props.failedRows; }
  get errorMessage(): string | null { return this.props.errorMessage; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  private terminal(): boolean { return this.status === "COMPLETED" || this.status === "FAILED"; }
  private validFinalCounters(counters: UploadCounters): boolean {
    return this.validCounters(Object.values(counters)) && counters.processedRows + counters.failedRows === counters.totalRows;
  }
}
