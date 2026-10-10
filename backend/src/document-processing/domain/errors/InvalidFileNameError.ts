import { DomainError } from "../../../shared/domain/DomainError";

export class InvalidFileNameError extends DomainError {
  constructor(reason: string) { super("INVALID_FILE_NAME", reason); }
}
