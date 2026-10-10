import { DomainError } from "../../../shared/domain/DomainError";

export class InvalidActivityDataError extends DomainError {
  constructor(readonly field: string, reason: string) {
    super("INVALID_ACTIVITY_DATA", `${field}: ${reason}`);
  }
}
