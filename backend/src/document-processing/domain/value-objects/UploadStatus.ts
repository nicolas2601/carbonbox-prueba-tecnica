import { Either } from "../../../shared/domain/Either";
import { InvalidUploadStatusError } from "../errors/InvalidUploadStatusError";

const STATUSES = ["PENDING", "PROCESSING", "COMPLETED", "FAILED"] as const;
export type UploadStatusValue = typeof STATUSES[number];

export class UploadStatus {
  private constructor(readonly value: UploadStatusValue) {}
  static create(raw: string): Either<InvalidUploadStatusError, UploadStatus> {
    const value = STATUSES.find(status => status === raw);
    if (!value) return Either.left(new InvalidUploadStatusError(raw));
    return Either.right(new UploadStatus(value));
  }
}
