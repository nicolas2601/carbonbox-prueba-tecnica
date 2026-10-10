import { DomainError } from "../../../shared/domain/DomainError";

export class InvalidCsvHeaderError extends DomainError {
  constructor(reason: string) { super("INVALID_CSV_HEADER", reason); }
}
