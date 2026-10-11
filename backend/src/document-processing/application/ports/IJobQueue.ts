import type { Either } from "../../../shared/domain/Either";
import type { StaleClaimError } from "../process-file/StaleClaimError";
import type { JobClaim } from "./JobClaim";

export interface IJobQueue {
  claim(now: Date, visibilityMs: number): Promise<JobClaim | null>;
  fail(claim: JobClaim, reason: string, now: Date, permanent: boolean): Promise<Either<StaleClaimError, "RETRY" | "DEAD">>;
}
