import { DomainError } from "../../../shared/domain/DomainError";

export class UploadPersistenceError extends DomainError {
  constructor(reason: string) { super("UPLOAD_PERSISTENCE_FAILURE", reason); }
}
