import { expect, it } from "vitest";
import { ByteLimiter } from "./ByteLimiter";

async function* source(): AsyncIterable<Uint8Array> { yield new Uint8Array([1, 2]); yield new Uint8Array([3, 4]); }
it("Exactly at the byte limit is accepted", async () => {
  const limited = new ByteLimiter(source(), 4);
  const chunks = [];
  for await (const chunk of limited.read()) chunks.push(...chunk);
  expect(chunks).toEqual([1, 2, 3, 4]);
  expect(limited.exceeded).toBe(false);
});
it("Crossing the limit sets the flag and stops the input", async () => {
  let closed = false;
  async function* guarded(): AsyncIterable<Uint8Array> {
    try { yield* source(); yield new Uint8Array([5]); }
    finally { closed = true; }
  }
  const limited = new ByteLimiter(guarded(), 3);
  const read = async () => { for await (const _chunk of limited.read()) { /* Consume. */ } };
  await expect(read()).rejects.toMatchObject({ code: "FILE_TOO_LARGE" });
  expect(limited.exceeded).toBe(true);
  expect(closed).toBe(true);
});
