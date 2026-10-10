import { DomainError } from "../../../shared/domain/DomainError";

export class InvalidUploadStatusError extends DomainError {
  constructor(status: string) { super("INVALID_UPLOAD_STATUS", `Unknown upload status: ${status}`); }
}
