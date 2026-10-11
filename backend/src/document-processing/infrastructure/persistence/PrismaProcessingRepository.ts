import type { PrismaClient } from "../../../generated/prisma/client";
import { Either } from "../../../shared/domain/Either";
import type { JobClaim } from "../../application/ports/JobClaim";
import { StaleClaimError } from "../../application/process-file/StaleClaimError";
import type { ActivityData } from "../../domain/entities/ActivityData";
import type { ProcessingProgress } from "../../application/ports/IProcessingRepository";
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
  async saveBatch(claim: JobClaim, rows: ActivityData[], progress: ProcessingProgress, now: Date): Promise<Either<StaleClaimError, void>> {
    if (rows.some(row => row.uploadId !== claim.uploadId)) return Either.left(new StaleClaimError("Batch upload differs from claim"));
    return withClaim(this.client, claim, async (tx, job) => {
      if (rows.length > 0) await tx.activityData.createMany({ data: rows.map(row => ({ id: row.id, uploadId: row.uploadId,
        category: row.category, amount: row.amount, unit: row.unit, date: row.date, createdAt: now })) });
      await tx.upload.update({ where: { id: claim.uploadId }, data: { processedRows: progress.processedRows,
        failedRows: progress.failedRows, updatedAt: now } });
      await tx.job.update({ where: { id: job.id }, data: { lockedUntil: new Date(now.getTime() + this.visibilityMs), updatedAt: now } });
    });
  }
}
