import { expect, it, vi } from "vitest";
import { Either } from "../../../shared/domain/Either";
import { RequeueDeadJob } from "./RequeueDeadJob";

it("Rejects invalid identifiers before touching state", async () => {
  const repository = { requeue: vi.fn() };
  const handler = new RequeueDeadJob(repository, { now: () => new Date(0) });
  for (const id of ["", " space ", "a".repeat(201)]) {
    expect((await handler.execute(id)).isLeft()).toBe(true);
  }
  expect(repository.requeue).not.toHaveBeenCalled();
});
it("Uses the injected clock and preserves repository refusal as a value", async () => {
  const now = new Date("2026-10-12T00:00:00Z");
  const refusal = Either.left(new Error("not dead"));
  const repository = { requeue: vi.fn().mockResolvedValue(refusal) };
  const handler = new RequeueDeadJob(repository, { now: () => now });
  expect(await handler.execute("upload-1")).toBe(refusal);
  expect(repository.requeue).toHaveBeenCalledWith("upload-1", now);
});
