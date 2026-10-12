import { DomainError } from "../../../shared/domain/DomainError";

export class UploadNotFoundError extends DomainError {
  constructor() { super("UPLOAD_NOT_FOUND", "Upload not found"); }
}
