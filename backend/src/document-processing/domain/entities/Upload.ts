import type { FileName } from "../value-objects/FileName";
import type { UploadStatusValue } from "../value-objects/UploadStatus";
import { Either } from "../../../shared/domain/Either";
import { InvalidStatusTransitionError } from "../errors/InvalidStatusTransitionError";

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

export class Upload {
  private constructor(private readonly props: UploadProps) {}
  static create({ now, ...props }: CreateUploadProps): Upload {
    return new Upload({ ...props, status: "PENDING", totalRows: null, processedRows: null,
      failedRows: null, errorMessage: null, createdAt: now, updatedAt: now });
  }
  static reconstitute(props: UploadProps): Upload { return new Upload({ ...props }); }
  startProcessing(now: Date): Either<InvalidStatusTransitionError, void> {
    Object.assign(this.props, { status: "PROCESSING", totalRows: 0, processedRows: 0,
      failedRows: 0, errorMessage: null, updatedAt: now });
    return Either.right(undefined);
  }
  get id(): string { return this.props.id; }
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
}
