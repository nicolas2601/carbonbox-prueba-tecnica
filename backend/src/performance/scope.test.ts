import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { adminUrl, databaseName, ownedUrl, assertStorage } from "./scope";

it("Targets only a local PostgreSQL administrative database", () => {
  expect(adminUrl("postgresql://localhost:5432/postgres")).toBe("postgresql://localhost:5432/postgres");
  for (const value of [undefined, "bad", "postgresql://remote/postgres", "postgresql://localhost/carbonbox_test", "postgresql://localhost/document_processing", "postgresql://localhost/postgres?host=remote", "postgresql://localhost/postgres?database=carbonbox_test"]) {
    expect(() => adminUrl(value)).toThrow("Performance targets must be local and owned");
  }
});
it("Binds names and URLs to the run and rejects identifier injection", () => {
  expect(databaseName("run_1")).toBe("carbonbox_perf_run_1");
  expect(ownedUrl("postgresql://localhost/carbonbox_perf_run_1", "run_1")).toContain("carbonbox_perf_run_1");
  for (const run of ["", "x;DROP DATABASE postgres", "../dev", "a".repeat(49)]) expect(() => databaseName(run)).toThrow();
  expect(() => ownedUrl("postgresql://localhost/carbonbox_perf_other", "run_1")).toThrow();
  expect(() => ownedUrl("postgresql://remote/carbonbox_perf_run_1", "run_1")).toThrow();
});
it("Accepts only this run's real temporary storage", async () => {
  const path = await mkdtemp(join(tmpdir(), "carbonbox-perf-run_1-"));
  try {
    await expect(assertStorage(path, "run_1")).resolves.toBeUndefined();
    await expect(assertStorage(path, "other")).rejects.toThrow();
    await expect(assertStorage("/home/nicolas/storage", "run_1")).rejects.toThrow();
  } finally { await rm(path, { recursive: true }); }
});
