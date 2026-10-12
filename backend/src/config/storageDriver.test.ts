import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
it.each([undefined, "fs"])("Keeps the implemented filesystem driver: %s", async driver => {
  vi.stubEnv("STORAGE_DRIVER", driver); vi.resetModules();
  expect((await import("./index")).loadSettings()).toMatchObject({ storageDriver: "fs" });
});
it.each(["s3", "typo"])("Refuses an unsupported driver instead of silently writing locally: %s", async driver => {
  vi.stubEnv("STORAGE_DRIVER", driver); vi.resetModules();
  const { loadSettings } = await import("./index");
  expect(() => loadSettings()).toThrow("storageDriver");
});
