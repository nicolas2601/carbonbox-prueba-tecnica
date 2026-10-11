import type { PrismaClient } from "../../../generated/prisma/client";
import type { Either } from "../../../shared/domain/Either";
import type { JobClaim } from "../../application/ports/JobClaim";
import type { StaleClaimError } from "../../application/process-file/StaleClaimError";
import { withClaim } from "./withClaim";

export class PrismaProcessingRepository {
  constructor(private readonly client: PrismaClient, private readonly visibilityMs: number) {}
  async begin(claim: JobClaim, now: Date): Promise<Either<StaleClaimError, void>> {
    return withClaim(this.client, claim, async tx => {
      await tx.activityData.deleteMany({ where: { uploadId: claim.uploadId } });
      await tx.upload.update({ where: { id: claim.uploadId }, data: { status: "PROCESSING", totalRows: 0,
        processedRows: 0, failedRows: 0, errorMessage: null, updatedAt: now } });
    });
  }
}
