import { expect, it } from "vitest";
import { JsonConsoleLogger } from "./JsonConsoleLogger";

it.each(["info", "warn", "error"] as const)("A JSON line per %s call", level => {
  const lines: string[] = [];
  const time = new Date("2024-01-15T00:00:00Z");
  const logger = new JsonConsoleLogger({ now: () => time }, line => { lines.push(line); });
  logger[level]("cleanup failed", { uploadId: "u1" });
  expect(lines).toHaveLength(1);
  expect(JSON.parse(lines[0]!)).toEqual({ level, message: "cleanup failed", context: { uploadId: "u1" }, time: time.toISOString() });
});
it("Omitted context is an empty object", () => {
  const lines: string[] = [];
  const logger = new JsonConsoleLogger({ now: () => new Date("2024-01-15") }, line => { lines.push(line); });
  logger.info("Worker started");
  expect(JSON.parse(lines[0]!).context).toEqual({});
});
