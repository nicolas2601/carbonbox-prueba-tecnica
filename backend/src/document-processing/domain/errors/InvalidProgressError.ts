import { DomainError } from "../../../shared/domain/DomainError";

export class InvalidProgressError extends DomainError {
  constructor(reason: string) { super("INVALID_PROGRESS", reason); }
}
