import type { PrismaClient, Job } from "../../../generated/prisma/client";
import { Either } from "../../../shared/domain/Either";
import { RequeueError } from "../../application/operations/RequeueError";
import type { IDeadJobRequeue, RequeuedJob } from "../../application/ports/IDeadJobRequeue";

type LockedJob = Pick<Job, "id" | "uploadId" | "status">;
export class PgDeadJobRequeue implements IDeadJobRequeue {
  constructor(private readonly client: PrismaClient) {}
  async requeue(uploadId: string, now: Date): Promise<Either<RequeueError, RequeuedJob>> {
    try {
      return await this.client.$transaction(async (tx) => {
        const jobs = await tx.$queryRaw<LockedJob[]>`
          SELECT id, "uploadId", status FROM jobs WHERE "uploadId" = ${uploadId} FOR UPDATE`;
        const job = jobs[0];
        if (!job) return Either.left(new RequeueError("JOB_NOT_FOUND", "No job exists for this upload"));
        if (job.status !== "DEAD") return Either.left(new RequeueError("JOB_NOT_DEAD", "Only dead jobs can be requeued"));
        await tx.job.update({ where: { id: job.id }, data: { status: "QUEUED", attempts: 0,
          availableAt: now, lockedUntil: null, claimToken: null, lastError: null, updatedAt: now } });
        await tx.upload.update({ where: { id: uploadId }, data: { status: "PENDING", totalRows: null,
          processedRows: null, failedRows: null, errorMessage: null, updatedAt: now } });
        return Either.right({ jobId: job.id, uploadId });
      });
    } catch {
      return Either.left(new RequeueError("REQUEUE_FAILED", "Could not requeue the job"));
    }
  }
}
