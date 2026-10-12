// @vitest-environment node

import { EventEmitter } from "node:events";
import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it, vi } from "vitest";
import { LocalE2eStack } from "./stack/localStack";
import type { E2eStack } from "./stack/lifecycle";

const { spawn } = vi.hoisted(() => ({ spawn: vi.fn() }));
vi.mock("node:child_process", () => ({ spawn }));

it("Passes the isolated database and ownership environment into the test process", async () => {
  const child = Object.assign(new EventEmitter(), { pid: 999999, exitCode: null });
  spawn.mockImplementation(() => {
    queueMicrotask(() => { child.emit("spawn"); setImmediate(() => child.emit("close", 0, null)); });
    return child;
  });
  const stack: E2eStack = { runId: "test123", processes: new Set(), databaseOwned: true,
    databaseName: "carbonbox_e2e_test123", databaseUrl: "postgresql://postgres:postgres@localhost:5432/carbonbox_e2e_test123",
    apiUrl: "http://127.0.0.1:3211", baseURL: "http://127.0.0.1:3210", storageDir: "/tmp/carbonbox-e2e-test123-owned" };
  expect(await new LocalE2eStack(false, { NODE_ENV: "test" }).runTests(stack)).toBe(0);
  expect(spawn.mock.calls[0][2].env).toMatchObject({
    DATABASE_URL: stack.databaseUrl, E2E_DATABASE_URL: stack.databaseUrl, E2E_STACK_OWNED: stack.databaseName,
    E2E_API_URL: stack.apiUrl, E2E_BASE_URL: stack.baseURL, E2E_STORAGE_DIR: stack.storageDir,
  });
});
it.each(["document_processing", "carbonbox_test"])("Refuses admin connections to the %s database", database => {
  expect(() => new LocalE2eStack(false, { NODE_ENV: "test", E2E_ADMIN_DATABASE_URL: `postgresql://postgres:postgres@localhost:5432/${database}` })).toThrow("postgres administrative database");
});
it("Refuses removal of a similarly named directory it did not create", async () => {
  const directory = await mkdtemp(join(tmpdir(), "carbonbox-e2e-test123-"));
  try {
    const stack: E2eStack = { runId: "test123", processes: new Set(), databaseOwned: false, storageDir: directory };
    await expect(new LocalE2eStack(false).teardown(stack)).rejects.toThrow("teardown failed");
    await access(directory);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
