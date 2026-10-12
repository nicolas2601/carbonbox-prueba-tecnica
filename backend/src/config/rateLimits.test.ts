import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
it("Provides a read budget above normal polling and a tighter upload budget", async () => {
  for (const name of ["RATE_LIMIT_MAX", "UPLOAD_RATE_LIMIT_MAX", "RATE_LIMIT_WINDOW_MS"]) vi.stubEnv(name, undefined);
  vi.resetModules();
  const { loadSettings } = await import("./index");
  expect(loadSettings()).toMatchObject({ rateLimitMax: 600, uploadRateLimitMax: 30, rateLimitWindowMs: 60000 });
});
it("Accepts explicit positive limits and rejects non-positive or fractional values", async () => {
  vi.stubEnv("RATE_LIMIT_MAX", "12"); vi.stubEnv("UPLOAD_RATE_LIMIT_MAX", "3"); vi.stubEnv("RATE_LIMIT_WINDOW_MS", "1000");
  vi.resetModules();
  expect((await import("./index")).loadSettings()).toMatchObject({ rateLimitMax: 12, uploadRateLimitMax: 3, rateLimitWindowMs: 1000 });
  for (const name of ["RATE_LIMIT_MAX", "UPLOAD_RATE_LIMIT_MAX", "RATE_LIMIT_WINDOW_MS"]) {
    for (const value of ["0", "-1", "1.5"]) {
      vi.stubEnv(name, value); vi.resetModules();
      const { loadSettings } = await import("./index");
      expect(() => loadSettings()).toThrow();
      vi.stubEnv(name, "10");
    }
  }
});
