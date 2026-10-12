import { expect, it, vi } from "vitest";

it("Uses the explicitly isolated build directory without changing the default", async () => {
  vi.stubEnv("NEXT_DIST_DIR", ".next-redesign");
  vi.resetModules();
  const { default: config } = await import("../../next.config");
  expect(config.distDir).toBe(".next-redesign");
});
it("Creates a standalone server only for the explicit container build", async () => {
  vi.stubEnv("NEXT_STANDALONE", "1");
  vi.resetModules();
  const { default: config } = await import("../../next.config");
  expect(config.output).toBe("standalone");
});
it("Keeps the usual build mode when the container flag is not enabled", async () => {
  vi.stubEnv("NEXT_STANDALONE", "0");
  vi.resetModules();
  const { default: config } = await import("../../next.config");
  expect(config.output).toBeUndefined();
});
