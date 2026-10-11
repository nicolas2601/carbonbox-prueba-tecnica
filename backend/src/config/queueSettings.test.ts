import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
it("Lease and retry configuration have positive defaults", async () => {
  vi.stubEnv("WORKER_VISIBILITY_TIMEOUT_MS", undefined);
  vi.stubEnv("WORKER_RETRY_BASE_MS", undefined);
  vi.resetModules();
  const { loadSettings } = await import("./index");
  expect(loadSettings()).toMatchObject({ workerVisibilityTimeoutMs: 30000, workerRetryBaseMs: 1000 });
});
it("Lease and retry values can be overridden", async () => {
  vi.stubEnv("WORKER_VISIBILITY_TIMEOUT_MS", "5000");
  vi.stubEnv("WORKER_RETRY_BASE_MS", "200");
  vi.resetModules();
  const { loadSettings } = await import("./index");
  expect(loadSettings()).toMatchObject({ workerVisibilityTimeoutMs: 5000, workerRetryBaseMs: 200 });
});
it.each(["WORKER_VISIBILITY_TIMEOUT_MS", "WORKER_RETRY_BASE_MS"])("Rejects non-positive or fractional %s", async name => {
  for (const value of ["0", "-1", "1.5", "NaN"]) {
    vi.stubEnv(name, value);
    vi.resetModules();
    const { loadSettings } = await import("./index");
    expect(() => loadSettings()).toThrow();
  }
});
