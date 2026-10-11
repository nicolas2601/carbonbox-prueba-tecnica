import { DomainError } from "../../../shared/domain/DomainError";

export class MalformedCsvError extends DomainError {
  constructor() { super("MALFORMED_CSV", "The file is not valid CSV: check quotes and field sizes"); }
}
