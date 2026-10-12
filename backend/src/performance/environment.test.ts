import { expect, it } from "vitest";
import { environment } from "./environment";

it("Overrides development credentials and paths with explicit owned child settings", () => {
  const result = environment({ runId: "run_1", databaseUrl: "postgresql://localhost/carbonbox_perf_run_1", storageDir: "/tmp/carbonbox-perf-run_1-owned", port: 34001 }, { NODE_ENV: "development", DATABASE_URL: "postgresql://localhost/document_processing", STORAGE_DIR: "/home/storage" });
  expect(result.DATABASE_URL).toBe("postgresql://localhost/carbonbox_perf_run_1");
  expect(result.STORAGE_DIR).toBe("/tmp/carbonbox-perf-run_1-owned");
  expect(result.NODE_ENV).toBe("production");
  expect(result.WORKER_BATCH_SIZE).toBe("500");
  expect(result.PORT).toBe("34001");
  expect(result.RATE_LIMIT_MAX).toBe("1000000");
});
it("Refuses an unowned URL before spawning a process", () => {
  expect(() => environment({ runId: "run_1", databaseUrl: "postgresql://localhost/carbonbox_test", storageDir: "/tmp/storage", port: 34001 }, { NODE_ENV: "test" })).toThrow();
});
