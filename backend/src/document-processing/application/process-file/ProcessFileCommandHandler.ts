import { Either } from "../../../shared/domain/Either";
import type { Upload } from "../../domain/entities/Upload";
import { ActivityData } from "../../domain/entities/ActivityData";
import type { IUploadReader } from "../ports/IUploadReader";
import type { IFileStorage } from "../ports/IFileStorage";
import type { ICsvRecordReader, CsvRecord } from "../ports/ICsvRecordReader";
import type { IProcessingRepository } from "../ports/IProcessingRepository";
import type { IIdGenerator } from "../ports/IIdGenerator";
import type { IClock } from "../ports/IClock";
import type { JobClaim } from "../ports/JobClaim";
import { validateHeader } from "../csv/validateHeader";
import { validateRow } from "../csv/validateRow";
import type { CsvColumns, RowError } from "../csv/types";
import { summarizeRowErrors } from "../csv/summarizeRowErrors";
import type { ProcessFileCommand } from "./ProcessFileCommand";
import { StaleClaimError } from "./StaleClaimError";

const ERROR_SUMMARY_LIMIT = 10;

interface FileState {
  upload: Upload;
  columns: CsvColumns | null;
  rows: ActivityData[];
  processedRows: number;
  failedRows: number;
  errors: RowError[];
  failure: string | null;
}

export class ProcessFileCommandHandler {
  constructor(private readonly uploads: IUploadReader, private readonly storage: IFileStorage,
    private readonly csv: ICsvRecordReader, private readonly repository: IProcessingRepository,
    private readonly ids: IIdGenerator, private readonly clock: IClock, private readonly batchSize: number) {
    if (!Number.isSafeInteger(batchSize) || batchSize < 1) throw new Error("Batch size must be a positive integer");
  }
  async execute({ claim }: ProcessFileCommand): Promise<Either<StaleClaimError, void>> {
    const upload = await this.uploads.findById(claim.uploadId);
    if (!upload) return Either.left(new StaleClaimError("Claim upload no longer exists"));
    if (upload.status === "COMPLETED" || upload.status === "FAILED") return this.repository.finish(claim, upload);
    const now = this.clock.now();
    const begun = await this.repository.begin(claim, now);
    if (begun.isLeft()) return begun;
    const started = upload.startProcessing(now);
    if (started.isLeft()) throw started.value;
    const state: FileState = { upload, columns: null, rows: [], processedRows: 0, failedRows: 0, errors: [], failure: null };
    const read = await this.read(state, claim);
    if (read.isLeft()) return read;
    if (!state.failure && state.processedRows === 0) {
      state.failure = state.columns ? "No valid row was found" : "CSV has no records";
    }
    const finished = state.failure ? upload.fail(state.failure, this.clock.now()) :
      upload.complete({ totalRows: state.processedRows + state.failedRows,
        processedRows: state.processedRows, failedRows: state.failedRows }, this.clock.now(), summarizeRowErrors(state.errors, ERROR_SUMMARY_LIMIT) ?? undefined);
    if (finished.isLeft()) throw finished.value;
    return this.repository.finish(claim, upload);
  }
  private async read(state: FileState, claim: JobClaim): Promise<Either<StaleClaimError, void>> {
    const records = this.csv.read(this.storage.open(state.upload.fileUrl));
    for await (const record of records) {
      if (!state.columns) {
        const header = validateHeader(record.fields);
        if (header.isLeft()) { state.failure = header.value.message; return Either.right(undefined); }
        state.columns = header.value;
        continue;
      }
      this.addRow(record, state, state.columns);
      if ((state.processedRows + state.failedRows) % this.batchSize === 0) {
        const saved = await this.flush(state, claim);
        if (saved.isLeft()) return saved;
      }
    }
    if ((state.processedRows + state.failedRows) % this.batchSize !== 0) return this.flush(state, claim);
    return Either.right(undefined);
  }
  private addRow(record: CsvRecord, state: FileState, columns: CsvColumns): void {
    const validated = validateRow(record.fields, columns, record.line);
    if (validated.isLeft()) {
      state.failedRows++;
      state.errors.push(validated.value);
      return;
    }
    const row = ActivityData.create({ ...validated.value, id: this.ids.next(), uploadId: state.upload.id });
    if (row.isLeft()) throw row.value;
    state.rows.push(row.value);
    state.processedRows++;
  }
  private async flush(state: FileState, claim: JobClaim): Promise<Either<StaleClaimError, void>> {
    const progress = { processedRows: state.processedRows, failedRows: state.failedRows };
    const saved = await this.repository.saveBatch(claim, state.rows, progress, this.clock.now());
    if (saved.isLeft()) return saved;
    state.upload.recordProgress(progress, this.clock.now());
    state.rows = [];
    return Either.right(undefined);
  }
}
