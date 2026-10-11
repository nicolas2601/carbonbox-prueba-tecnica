import { DomainError } from "../../../shared/domain/DomainError";

export class StaleClaimError extends DomainError {
  constructor(reason: string) { super("STALE_CLAIM", reason); }
}
