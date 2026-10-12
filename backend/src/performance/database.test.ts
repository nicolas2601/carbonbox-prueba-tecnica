import { expect, it, vi } from "vitest";
import { OwnedDatabase } from "./database";

it("Drops only a database successfully created by this lifecycle", async () => {
  const admin = { query: vi.fn().mockResolvedValue({}) };
  const database = new OwnedDatabase("run_1", admin);
  await database.drop();
  expect(admin.query).not.toHaveBeenCalled();
  await database.create();
  await database.drop();
  expect(admin.query.mock.calls.map(call => call[0])).toEqual(['CREATE DATABASE "carbonbox_perf_run_1"', 'DROP DATABASE "carbonbox_perf_run_1" WITH (FORCE)']);
  await database.drop();
  expect(admin.query).toHaveBeenCalledTimes(2);
});
it("Never claims ownership or drops an existing database after creation fails", async () => {
  const admin = { query: vi.fn().mockRejectedValue(new Error("already exists")) };
  const database = new OwnedDatabase("run_1", admin);
  await expect(database.create()).rejects.toThrow("already exists");
  await database.drop();
  expect(admin.query).toHaveBeenCalledTimes(1);
});
