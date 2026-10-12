import type { PrismaClient } from "../../../generated/prisma/client";
import type { IIdGenerator } from "../../application/ports/IIdGenerator";
import type { JobClaim } from "../../application/ports/JobClaim";
import type { IJobQueue } from "../../application/ports/IJobQueue";
import type { Either } from "../../../shared/domain/Either";
import type { StaleClaimError } from "../../application/process-file/StaleClaimError";
import { withClaim } from "../persistence/withClaim";

export class PgJobQueue implements IJobQueue {
  constructor(private readonly client: PrismaClient, private readonly ids: IIdGenerator, private readonly retryBaseMs: number) {}
  async claim(now: Date, visibilityMs: number): Promise<JobClaim | null> {
    const token = this.ids.next();
    const lease = new Date(now.getTime() + visibilityMs);
    const claims = await this.client.$queryRaw<JobClaim[]>`
      UPDATE jobs SET "claimToken" = ${token}, "lockedUntil" = ${lease}::timestamp,
        attempts = attempts + 1, "updatedAt" = ${now}::timestamp
      WHERE id = (
        SELECT id FROM jobs WHERE status = 'QUEUED' AND "availableAt" <= ${now}::timestamp
          AND ("lockedUntil" IS NULL OR "lockedUntil" <= ${now}::timestamp)
        ORDER BY "availableAt", id FOR UPDATE SKIP LOCKED LIMIT 1
      ) RETURNING id AS "jobId", "uploadId", "claimToken", attempts AS attempt`;
    return claims[0] ?? null;
  }
  async fail(claim: JobClaim, reason: string, now: Date, permanent: boolean): Promise<Either<StaleClaimError, "RETRY" | "DEAD">> {
    return withClaim<"RETRY" | "DEAD">(this.client, claim, async (tx, job) => {
      if (permanent || job.attempts >= job.maxAttempts) {
        await tx.upload.update({ where: { id: job.uploadId }, data: { status: "FAILED", errorMessage: reason, updatedAt: now } });
        await tx.job.update({ where: { id: job.id }, data: { status: "DEAD", lockedUntil: null, claimToken: null,
          lastError: reason, updatedAt: now } });
        return "DEAD";
      }
      const delay = this.retryBaseMs * 2 ** (job.attempts - 1);
      await tx.job.update({ where: { id: job.id }, data: { status: "QUEUED", lockedUntil: null, claimToken: null,
        lastError: reason, availableAt: new Date(now.getTime() + delay), updatedAt: now } });
      return "RETRY";
    });
  }
}
