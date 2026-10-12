import { expect, it, vi } from "vitest";
import { Either } from "../shared/domain/Either";
import { RequeueError } from "../document-processing/application/operations/RequeueError";
import { runRequeue } from "./runRequeue";

it("Requires exactly one upload id and avoids execution otherwise", async () => {
  const handler = { execute: vi.fn() };
  for (const args of [[], ["a", "b"]]) expect(await runRequeue(args, handler, vi.fn())).toBe(2);
  expect(handler.execute).not.toHaveBeenCalled();
});
it("Emits only the safe refusal code, never arbitrary error text", async () => {
  const write = vi.fn();
  const handler = { execute: vi.fn().mockResolvedValue(Either.left(new RequeueError("REQUEUE_FAILED", "private connection secret"))) };
  expect(await runRequeue(["u1"], handler, write)).toBe(1);
  expect(write).toHaveBeenCalledWith('{"status":"refused","code":"REQUEUE_FAILED"}');
});
it("Reports the requeued identifiers and returns success", async () => {
  const write = vi.fn();
  const handler = { execute: vi.fn().mockResolvedValue(Either.right({ jobId: "j1", uploadId: "u1" })) };
  expect(await runRequeue(["u1"], handler, write)).toBe(0);
  expect(write).toHaveBeenCalledWith('{"status":"queued","jobId":"j1","uploadId":"u1"}');
});
