import type { IJobQueue } from "../ports/IJobQueue";
import type { IClock } from "../ports/IClock";
import type { ILogger } from "../ports/ILogger";
import type { ProcessFileCommandHandler } from "../process-file/ProcessFileCommandHandler";
import type { JobClaim } from "../ports/JobClaim";
import { MalformedCsvError } from "../csv/MalformedCsvError";
import type { IWait } from "../ports/IWait";

export class Worker {
  private cooldown = false;
  constructor(private readonly queue: IJobQueue, private readonly handler: Pick<ProcessFileCommandHandler, "execute">,
    private readonly clock: IClock, private readonly logger: ILogger, private readonly visibilityMs: number,
    private readonly pollIntervalMs: number, private readonly wait: IWait) {
    if (![visibilityMs, pollIntervalMs].every(value => Number.isSafeInteger(value) && value > 0)) {
      throw new Error("Worker durations must be positive integers");
    }
  }
  async run(signal: AbortSignal): Promise<void> {
    while (!signal.aborted) {
      const processed = await this.runOnce();
      if (signal.aborted) return;
      if (!processed || this.cooldown) await this.wait.wait(this.pollIntervalMs, signal);
    }
  }
  async runOnce(): Promise<boolean> {
    this.cooldown = false;
    let claim: JobClaim | null;
    try { claim = await this.queue.claim(this.clock.now(), this.visibilityMs); }
    catch { this.cooldown = true; this.logger.error("Job claim failed"); return false; }
    if (!claim) return false;
    try {
      const result = await this.handler.execute({ claim });
      const context = { jobId: claim.jobId, uploadId: claim.uploadId };
      if (result.isLeft()) this.logger.warn("Job claim is stale", context);
      else this.logger.info("Job processed", context);
    } catch (error) { await this.recordFailure(claim, error); }
    return true;
  }
  private async recordFailure(claim: JobClaim, error: unknown): Promise<void> {
    const context = { jobId: claim.jobId, uploadId: claim.uploadId };
    const reason = error instanceof Error ? error.message : "File processing failed";
    try {
      const result = await this.queue.fail(claim, reason, this.clock.now(), error instanceof MalformedCsvError);
      if (result.isLeft()) this.logger.warn("Job failure claim is stale", context);
      else this.logger.error("Job processing failed", { ...context, outcome: result.value });
    } catch {
      this.cooldown = true;
      this.logger.error("Job failure could not be recorded", context);
    }
  }
}
