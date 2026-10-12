import { expect, it, vi } from "vitest";

it("Uses the explicitly isolated build directory without changing the default", async () => {
  vi.stubEnv("NEXT_DIST_DIR", ".next-redesign");
  vi.resetModules();
  const { default: config } = await import("../../next.config");
  expect(config.distDir).toBe(".next-redesign");
});
