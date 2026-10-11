import { expect, it, vi } from "vitest";
import { Worker } from "./Worker";
import { Either } from "../../../shared/domain/Either";
import type { IJobQueue } from "../ports/IJobQueue";
import type { ProcessFileCommand } from "../process-file/ProcessFileCommand";
import { StaleClaimError } from "../process-file/StaleClaimError";
import { MemoryLogger } from "../create-upload/tests/MemoryLogger";
import { MalformedCsvError } from "../csv/MalformedCsvError";

const time = new Date("2024-01-15T00:00:00Z");
const claim = { jobId: "j1", uploadId: "u1", claimToken: "private-token" };
function setup(pollMs = 100, visibilityMs = 1000) {
  const queue = { claim: vi.fn<IJobQueue["claim"]>().mockResolvedValue(claim),
    fail: vi.fn<IJobQueue["fail"]>().mockResolvedValue(Either.right("RETRY")) };
  const handler = { execute: vi.fn<(command: ProcessFileCommand) => Promise<Either<StaleClaimError, void>>>()
    .mockResolvedValue(Either.right(undefined)) };
  const logger = new MemoryLogger();
  const wait = { wait: vi.fn<(ms: number, signal: AbortSignal) => Promise<void>>().mockResolvedValue(undefined) };
  const worker = new Worker(queue, handler, { now: () => time }, logger, visibilityMs, pollMs, wait);
  return { worker, queue, handler, logger, wait };
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

it.each(["RETRY", "DEAD"] as const)("Transient failure follows queue outcome %s", async outcome => {
  const { worker, queue, handler, logger } = setup();
  handler.execute.mockRejectedValue(new Error("Temporary failure"));
  queue.fail.mockResolvedValue(Either.right(outcome));
  expect(await worker.runOnce()).toBe(true);
  expect(queue.fail).toHaveBeenCalledExactlyOnceWith(claim, "Temporary failure", time, false);
  expect(logger.events[0]).toMatchObject({ level: "error", context: { outcome } });
  expect(JSON.stringify(logger.events)).not.toContain("Temporary failure");
  expect(JSON.stringify(logger.events)).not.toContain("private-token");
});
it("Malformed file is permanent with a safe user-facing reason", async () => {
  const { worker, queue, handler } = setup();
  const error = new MalformedCsvError();
  handler.execute.mockRejectedValue(error);
  await worker.runOnce();
  expect(queue.fail).toHaveBeenCalledExactlyOnceWith(claim, error.message, time, true);
});
it("The queue is unreachable while failing", async () => {
  const { worker, queue, handler, logger } = setup();
  handler.execute.mockRejectedValue(new Error("Temporary failure"));
  queue.fail.mockRejectedValue(new Error("postgresql://secret-password"));
  expect(await worker.runOnce()).toBe(true);
  expect(logger.events[0]?.message).toBe("Job failure could not be recorded");
  expect(JSON.stringify(logger.events)).not.toContain("secret-password");
});
it("A claim lookup failure does not terminate an iteration", async () => {
  const { worker, queue, handler, logger } = setup();
  queue.claim.mockRejectedValue(new Error("Database down"));
  expect(await worker.runOnce()).toBe(false);
  expect(handler.execute).not.toHaveBeenCalled();
  expect(logger.events[0]?.message).toBe("Job claim failed");
});
it("Failure recording can itself lose the claim", async () => {
  const { worker, queue, handler, logger } = setup();
  handler.execute.mockRejectedValue("private-content");
  queue.fail.mockResolvedValue(Either.left(new StaleClaimError("Owner changed")));
  expect(await worker.runOnce()).toBe(true);
  expect(queue.fail).toHaveBeenCalledExactlyOnceWith(claim, "File processing failed", time, false);
  expect(logger.events[0]?.level).toBe("warn");
});

it("Idle waiting uses the configured interval", async () => {
  const { worker, queue, wait } = setup();
  const controller = new AbortController();
  queue.claim.mockResolvedValue(null);
  wait.wait.mockImplementation(async () => { controller.abort(); });
  await worker.run(controller.signal);
  expect(wait.wait).toHaveBeenCalledExactlyOnceWith(100, controller.signal);
});
it("Shutdown during a wait", async () => {
  const { worker, queue, wait } = setup();
  const controller = new AbortController();
  queue.claim.mockResolvedValue(null);
  let entered!: () => void;
  const waiting = new Promise<void>(resolve => { entered = resolve; });
  wait.wait.mockImplementation((_ms, signal) => new Promise<void>(resolve => {
    signal.addEventListener("abort", () => { resolve(); }, { once: true });
    entered();
  }));
  const running = worker.run(controller.signal);
  await waiting;
  controller.abort();
  await running;
});
it("Shutdown during a job finishes the current job", async () => {
  const { worker, handler, wait } = setup();
  const controller = new AbortController();
  let entered!: () => void;
  let release!: () => void;
  const started = new Promise<void>(resolve => { entered = resolve; });
  const resume = new Promise<void>(resolve => { release = resolve; });
  let finished = false;
  handler.execute.mockImplementation(async () => { entered(); await resume; finished = true; return Either.right(undefined); });
  const running = worker.run(controller.signal);
  await started;
  controller.abort();
  expect(finished).toBe(false);
  release();
  await running;
  expect(finished).toBe(true);
  expect(wait.wait).not.toHaveBeenCalled();
});
it.each(["claim", "fail"] as const)("An unavailable queue causes a cooldown: %s", async method => {
  const { worker, queue, handler, wait } = setup();
  const controller = new AbortController();
  if (method === "claim") queue.claim.mockRejectedValue(new Error("DB unavailable"));
  else { handler.execute.mockRejectedValue(new Error("IO failure")); queue.fail.mockRejectedValue(new Error("DB unavailable")); }
  wait.wait.mockImplementation(async () => { controller.abort(); });
  await worker.run(controller.signal);
  expect(wait.wait).toHaveBeenCalledExactlyOnceWith(100, controller.signal);
});
it("A processed job asks again immediately before idle waiting", async () => {
  const { worker, queue, wait } = setup();
  const controller = new AbortController();
  queue.claim.mockResolvedValueOnce(claim).mockResolvedValue(null);
  wait.wait.mockImplementation(async () => { controller.abort(); });
  await worker.run(controller.signal);
  expect(queue.claim).toHaveBeenCalledTimes(2);
  expect(wait.wait).toHaveBeenCalledTimes(1);
});

it.each([[0, 1000], [-1, 1000], [1.5, 1000], [100, 0], [100, -1], [100, NaN]])("Worker durations are positive integers: %j", (poll, visibility) => {
  expect(() => setup(poll, visibility)).toThrow("Worker durations");
});
