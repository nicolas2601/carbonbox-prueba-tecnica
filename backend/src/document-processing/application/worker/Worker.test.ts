import { expect, it, vi } from "vitest";
import { Worker } from "./Worker";
import { Either } from "../../../shared/domain/Either";
import type { IJobQueue } from "../ports/IJobQueue";
import type { ProcessFileCommand } from "../process-file/ProcessFileCommand";
import { StaleClaimError } from "../process-file/StaleClaimError";
import { MemoryLogger } from "../create-upload/tests/MemoryLogger";

const time = new Date("2024-01-15T00:00:00Z");
const claim = { jobId: "j1", uploadId: "u1", claimToken: "private-token" };
function setup() {
  const queue = { claim: vi.fn<IJobQueue["claim"]>().mockResolvedValue(claim),
    fail: vi.fn<IJobQueue["fail"]>().mockResolvedValue(Either.right("RETRY")) };
  const handler = { execute: vi.fn<(command: ProcessFileCommand) => Promise<Either<StaleClaimError, void>>>()
    .mockResolvedValue(Either.right(undefined)) };
  const logger = new MemoryLogger();
  const worker = new Worker(queue, handler, { now: () => time }, logger, 1000);
  return { worker, queue, handler, logger };
}
it("Nothing to do", async () => {
  const { worker, queue, handler } = setup();
  queue.claim.mockResolvedValue(null);
  expect(await worker.runOnce()).toBe(false);
  expect(handler.execute).not.toHaveBeenCalled();
});
it("A job is processed", async () => {
  const { worker, queue, handler, logger } = setup();
  expect(await worker.runOnce()).toBe(true);
  expect(queue.claim).toHaveBeenCalledExactlyOnceWith(time, 1000);
  expect(handler.execute).toHaveBeenCalledExactlyOnceWith({ claim });
  expect(logger.events).toEqual([{ level: "info", message: "Job processed", context: { jobId: "j1", uploadId: "u1" } }]);
});
it("Stale claim", async () => {
  const { worker, queue, handler, logger } = setup();
  handler.execute.mockResolvedValue(Either.left(new StaleClaimError("Other owner")));
  expect(await worker.runOnce()).toBe(true);
  expect(queue.fail).not.toHaveBeenCalled();
  expect(logger.events).toEqual([{ level: "warn", message: "Job claim is stale", context: { jobId: "j1", uploadId: "u1" } }]);
});
