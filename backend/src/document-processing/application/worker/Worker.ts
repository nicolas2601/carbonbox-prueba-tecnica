import type { IJobQueue } from "../ports/IJobQueue";
import type { IClock } from "../ports/IClock";
import type { ILogger } from "../ports/ILogger";
import type { ProcessFileCommandHandler } from "../process-file/ProcessFileCommandHandler";

export class Worker {
  constructor(private readonly queue: IJobQueue, private readonly handler: Pick<ProcessFileCommandHandler, "execute">,
    private readonly clock: IClock, private readonly logger: ILogger, private readonly visibilityMs: number) {}
  async runOnce(): Promise<boolean> {
    const claim = await this.queue.claim(this.clock.now(), this.visibilityMs);
    if (!claim) return false;
    const result = await this.handler.execute({ claim });
    const context = { jobId: claim.jobId, uploadId: claim.uploadId };
    if (result.isLeft()) this.logger.warn("Job claim is stale", context);
    else this.logger.info("Job processed", context);
    return true;
  }
}
