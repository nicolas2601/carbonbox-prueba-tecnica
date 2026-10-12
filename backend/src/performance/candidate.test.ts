import { expect, it, vi } from "vitest";
import { verifyCandidate } from "./candidate";

it("Checks pre-existing row counts before and after candidate DDL", async () => {
  const events: string[] = [];
  const snapshot = async () => { events.push("snapshot"); return { uploads: 10000, rows: 100000 }; };
  const apply = async () => { events.push("index"); };
  expect(await verifyCandidate({ snapshot, apply })).toEqual({ before: { uploads: 10000, rows: 100000 }, after: { uploads: 10000, rows: 100000 } });
  expect(events).toEqual(["snapshot", "index", "snapshot"]);
});
it("Refuses to treat changing rows as a successful additive experiment", async () => {
  const snapshot = vi.fn().mockResolvedValueOnce({ uploads: 10000, rows: 100000 }).mockResolvedValueOnce({ uploads: 10000, rows: 99999 });
  await expect(verifyCandidate({ snapshot, apply: async () => {} })).rejects.toThrow("Candidate DDL changed row counts");
});
