import { DomainError } from "../../../shared/domain/DomainError";

export class StorageFailureError extends DomainError {
  constructor(reason: string) { super("STORAGE_FAILURE", reason); }
}
