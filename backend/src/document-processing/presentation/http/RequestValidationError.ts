import { DomainError } from "../../../shared/domain/DomainError";

export class RequestValidationError extends DomainError {
  constructor(message: string) { super("VALIDATION_ERROR", message); }
}
export class MissingFileError extends DomainError {
  constructor() { super("MISSING_FILE", "Expected a file part named file"); }
}
