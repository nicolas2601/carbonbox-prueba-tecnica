import { describe, expect, it, vi } from "vitest";
import { createRunId, getOwnedBaseURL, isOwnedDatabaseName, runE2eLifecycle, type E2eStack, type StackLifecycle } from "./stack/lifecycle";

function createLifecycle(overrides: Partial<StackLifecycle> = {}): StackLifecycle {
  return {
    prepare: vi.fn(async (stack: E2eStack) => {
      stack.databaseName = `carbonbox_e2e_${stack.runId}`;
      stack.storageDir = "/tmp/carbonbox-e2e-test";
    }),
    runTests: vi.fn(async () => 0),
    teardown: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe("E2E stack lifecycle", () => {
  it("tears down a prepared stack after successful tests", async () => {
    const lifecycle = createLifecycle();

    const result = await runE2eLifecycle(lifecycle, "run-123");

    expect(result.exitCode).toBe(0);
    expect(lifecycle.prepare).toHaveBeenCalledOnce();
    expect(lifecycle.runTests).toHaveBeenCalledOnce();
    expect(lifecycle.teardown).toHaveBeenCalledOnce();
  });

  it("tears down after tests fail and preserves their exit code", async () => {
    const lifecycle = createLifecycle({ runTests: vi.fn(async () => 7) });

    const result = await runE2eLifecycle(lifecycle, "run-123");

    expect(result.exitCode).toBe(7);
    expect(lifecycle.teardown).toHaveBeenCalledOnce();
  });

  it("tears down partially prepared resources when startup fails", async () => {
    const lifecycle = createLifecycle({
      prepare: vi.fn(async (stack: E2eStack) => {
        stack.databaseName = `carbonbox_e2e_${stack.runId}`;
        throw new Error("startup failed");
      }),
    });

    const result = await runE2eLifecycle(lifecycle, "run-123");

    expect(result.exitCode).toBe(1);
    expect(lifecycle.runTests).not.toHaveBeenCalled();
    expect(lifecycle.teardown).toHaveBeenCalledOnce();
  });

  it("returns a nonzero exit code when teardown fails", async () => {
    const lifecycle = createLifecycle({ teardown: vi.fn(async () => { throw new Error("cleanup failed"); }) });

    const result = await runE2eLifecycle(lifecycle, "run-123");

    expect(result.exitCode).toBe(1);
  });

  it("rejects a Playwright config without a database bound to the owned E2E stack", () => {
    expect(() => getOwnedBaseURL({ NODE_ENV: "test", E2E_BASE_URL: "http://127.0.0.1:3000" })).toThrow("owned E2E stack");
  });

  it("accepts only the local base URL bound to the fresh database marker", () => {
    const baseURL = getOwnedBaseURL({
      NODE_ENV: "test",
      E2E_BASE_URL: "http://127.0.0.1:43121",
      E2E_DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/carbonbox_e2e_run123",
      E2E_STACK_OWNED: "carbonbox_e2e_run123",
    });

    expect(baseURL).toBe("http://127.0.0.1:43121");
  });

  it("only recognizes a database name bound to its run identifier", () => {
    expect(isOwnedDatabaseName("carbonbox_e2e_run-123", "run-123")).toBe(true);
    expect(isOwnedDatabaseName("carbonbox_e2e_run-999", "run-123")).toBe(false);
    expect(isOwnedDatabaseName("document_processing", "run-123")).toBe(false);
    expect(isOwnedDatabaseName("carbonbox_e2e_run-123; DROP DATABASE postgres", "run-123")).toBe(false);
  });

  it("creates unique run identifiers suitable for database names", () => {
    const first = createRunId();
    const second = createRunId();

    expect(first).not.toBe(second);
    expect(first).toMatch(/^[a-zA-Z0-9_]+$/);
    expect(`carbonbox_e2e_${first}`.length).toBeLessThanOrEqual(63);
  });
});
