import type { QueueSnapshot } from "../../application/ports/IQueueMetrics";

export interface QueueGroup { status: string; count: bigint; oldest: Date | null; }
const FIELDS: Readonly<Record<string, "queued" | "done" | "dead">> = { QUEUED: "queued", DONE: "done", DEAD: "dead" };
export function queueSnapshot(groups: QueueGroup[], now: Date): QueueSnapshot {
  const snapshot: QueueSnapshot = { queued: 0, done: 0, dead: 0, oldestQueuedAgeSeconds: 0 };
  for (const group of groups) {
    const count = Number(group.count);
    if (!Number.isSafeInteger(count) || count < 0) throw new Error("Invalid queue metric count");
    if (!Object.hasOwn(FIELDS, group.status)) continue;
    snapshot[FIELDS[group.status]!] = count;
    if (group.status === "QUEUED" && count > 0 && group.oldest) {
      const age = (now.getTime() - group.oldest.getTime()) / 1000;
      if (!Number.isFinite(age)) throw new Error("Invalid queue metric date");
      snapshot.oldestQueuedAgeSeconds = Math.max(0, age);
    }
  }
  return snapshot;
}
