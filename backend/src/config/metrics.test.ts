import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
it("Defaults to an operational loopback listener separate from HTTP", async () => {
  vi.stubEnv("METRICS_HOST", undefined); vi.stubEnv("METRICS_PORT", undefined); vi.resetModules();
  expect((await import("./index")).loadSettings()).toMatchObject({ metricsHost: "127.0.0.1", metricsPort: 9090 });
});
it("Allows an ephemeral test port and rejects ports outside TCP range", async () => {
  vi.stubEnv("METRICS_PORT", "0"); vi.resetModules();
  expect((await import("./index")).loadSettings().metricsPort).toBe(0);
  for (const port of ["-1", "65536", "1.5"]) {
    vi.stubEnv("METRICS_PORT", port); vi.resetModules();
    const { loadSettings } = await import("./index");
    expect(() => loadSettings()).toThrow();
  }
});
