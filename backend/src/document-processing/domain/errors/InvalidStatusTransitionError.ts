import { DomainError } from "../../../shared/domain/DomainError";

export class InvalidStatusTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super("INVALID_STATUS_TRANSITION", `Cannot transition from ${from} to ${to}`);
  }
}
