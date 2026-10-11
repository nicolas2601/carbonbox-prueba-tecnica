import type { PrismaClient, Prisma, Job } from "../../../generated/prisma/client";
import { Either } from "../../../shared/domain/Either";
import type { JobClaim } from "../../application/ports/JobClaim";
import { StaleClaimError } from "../../application/process-file/StaleClaimError";

type LockedJob = Pick<Job, "id" | "uploadId" | "claimToken" | "attempts" | "maxAttempts">;

export async function withClaim<R>(client: PrismaClient, claim: JobClaim,
  write: (tx: Prisma.TransactionClient, job: LockedJob) => Promise<R>): Promise<Either<StaleClaimError, R>> {
  return client.$transaction(async tx => {
    const jobs = await tx.$queryRaw<LockedJob[]>`
      SELECT id, "uploadId", "claimToken", attempts, "maxAttempts" FROM jobs WHERE id = ${claim.jobId} FOR UPDATE`;
    const job = jobs[0];
    if (!job || !job.claimToken || job.claimToken !== claim.claimToken || job.uploadId !== claim.uploadId) {
      return Either.left(new StaleClaimError("Claim is no longer current"));
    }
    return Either.right(await write(tx, job));
  });
}
