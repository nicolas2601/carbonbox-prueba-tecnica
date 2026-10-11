import type { PrismaClient } from "../../../generated/prisma/client";
import type { IIdGenerator } from "../../application/ports/IIdGenerator";
import type { JobClaim } from "../../application/ports/JobClaim";

export class PgJobQueue {
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
      ) RETURNING id AS "jobId", "uploadId", "claimToken"`;
    return claims[0] ?? null;
  }
}
