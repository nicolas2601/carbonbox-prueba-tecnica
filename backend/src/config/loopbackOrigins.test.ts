import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
it("Defaults to both common loopback browser origins", async () => {
  vi.stubEnv("CORS_ORIGIN", undefined); vi.resetModules();
  const { loadSettings } = await import("./index");
  expect(loadSettings().corsOrigin).toBe("http://localhost:3000,http://127.0.0.1:3000");
});
