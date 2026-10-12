import type { PrismaClient } from "../../../generated/prisma/client";
import type { IQueueMetrics, QueueSnapshot } from "../../application/ports/IQueueMetrics";
import type { IClock } from "../../application/ports/IClock";
import { queueSnapshot, type QueueGroup } from "./queueSnapshot";

export class PgQueueMetrics implements IQueueMetrics {
  constructor(private readonly client: PrismaClient, private readonly clock: IClock) {}
  async snapshot(): Promise<QueueSnapshot> {
    const groups = await this.client.$queryRaw<QueueGroup[]>`SELECT status::text AS status, COUNT(*)::bigint AS count,
      MIN("createdAt") AS oldest FROM jobs GROUP BY status`;
    return queueSnapshot(groups, this.clock.now());
  }
}
