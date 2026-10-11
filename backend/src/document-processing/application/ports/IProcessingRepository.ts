import type { Either } from "../../../shared/domain/Either";
import type { Upload } from "../../domain/entities/Upload";
import type { ActivityData } from "../../domain/entities/ActivityData";
import type { StaleClaimError } from "../process-file/StaleClaimError";
import type { JobClaim } from "./JobClaim";

export interface ProcessingProgress { processedRows: number; failedRows: number; }
export interface IProcessingRepository {
  // Each write checks claim ownership atomically; begin clears earlier rows.
  begin(claim: JobClaim, now: Date): Promise<Either<StaleClaimError, void>>;
  // Empty batches still update counters and extend the lease.
  saveBatch(claim: JobClaim, rows: ActivityData[], progress: ProcessingProgress, now: Date): Promise<Either<StaleClaimError, void>>;
  finish(claim: JobClaim, upload: Upload): Promise<Either<StaleClaimError, void>>;
}
