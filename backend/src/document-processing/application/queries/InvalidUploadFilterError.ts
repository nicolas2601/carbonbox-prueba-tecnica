import { DomainError } from "../../../shared/domain/DomainError";

export class InvalidUploadFilterError extends DomainError {
  constructor(reason: string) { super("INVALID_UPLOAD_FILTER", reason); }
}
