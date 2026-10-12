import { DomainError } from "../../../shared/domain/DomainError";

export class InvalidPaginationError extends DomainError {
  constructor(reason: string) { super("INVALID_PAGINATION", reason); }
}
