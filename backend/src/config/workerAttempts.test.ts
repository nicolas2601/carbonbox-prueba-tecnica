import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
it.each([undefined, "7"])("Worker attempts come from configuration: %s", async value => {
  vi.stubEnv("WORKER_MAX_ATTEMPTS", value);
  vi.resetModules();
  const { loadSettings } = await import("./index");
  expect(loadSettings()).toMatchObject({ workerMaxAttempts: value ? 7 : 3 });
});
it("Zero worker attempts is rejected", async () => {
  vi.stubEnv("WORKER_MAX_ATTEMPTS", "0");
  vi.resetModules();
  const { loadSettings } = await import("./index");
  expect(() => loadSettings()).toThrow();
});
