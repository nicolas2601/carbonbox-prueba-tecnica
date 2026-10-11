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
import type { StaleClaimError } from "./StaleClaimError";

const ERROR_SUMMARY_LIMIT = 10;

interface FileState {
  upload: Upload;
  columns: CsvColumns | null;
  rows: ActivityData[];
  processedRows: number;
  failedRows: number;
  errors: RowError[];
}

export class ProcessFileCommandHandler {
  constructor(private readonly uploads: IUploadReader, private readonly storage: IFileStorage,
    private readonly csv: ICsvRecordReader, private readonly repository: IProcessingRepository,
    private readonly ids: IIdGenerator, private readonly clock: IClock, private readonly batchSize: number) {
    if (!Number.isSafeInteger(batchSize) || batchSize < 1) throw new Error("Batch size must be a positive integer");
  }
  async execute({ claim }: ProcessFileCommand): Promise<Either<StaleClaimError, void>> {
    const upload = await this.uploads.findById(claim.uploadId);
    if (!upload) throw new Error("Upload not found");
    const now = this.clock.now();
    await this.repository.begin(claim, now);
    const started = upload.startProcessing(now);
    if (started.isLeft()) throw started.value;
    const state: FileState = { upload, columns: null, rows: [], processedRows: 0, failedRows: 0, errors: [] };
    await this.read(state, claim);
    upload.complete({ totalRows: state.processedRows + state.failedRows,
      processedRows: state.processedRows, failedRows: state.failedRows }, this.clock.now(), summarizeRowErrors(state.errors, ERROR_SUMMARY_LIMIT) ?? undefined);
    return this.repository.finish(claim, upload);
  }
  private async read(state: FileState, claim: JobClaim): Promise<void> {
    const records = this.csv.read(this.storage.open(state.upload.fileUrl));
    for await (const record of records) {
      if (!state.columns) {
        const header = validateHeader(record.fields);
        if (header.isLeft()) throw header.value;
        state.columns = header.value;
        continue;
      }
      this.addRow(record, state, state.columns);
      if ((state.processedRows + state.failedRows) % this.batchSize === 0) await this.flush(state, claim);
    }
    if ((state.processedRows + state.failedRows) % this.batchSize !== 0) await this.flush(state, claim);
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
  private async flush(state: FileState, claim: JobClaim): Promise<void> {
    const progress = { processedRows: state.processedRows, failedRows: state.failedRows };
    await this.repository.saveBatch(claim, state.rows, progress, this.clock.now());
    state.upload.recordProgress(progress, this.clock.now());
    state.rows = [];
  }
}
