import { DomainError } from "../../../shared/domain/DomainError";

export type RequeueCode = "INVALID_REQUEUE_ID" | "JOB_NOT_FOUND" | "JOB_NOT_DEAD" | "REQUEUE_FAILED";
export class RequeueError extends DomainError {
  constructor(code: RequeueCode, message: string) { super(code, message); }
}
