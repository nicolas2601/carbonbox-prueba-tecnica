import { readdir } from "node:fs/promises";
import { afterAll, beforeEach, expect, it } from "vitest";
import { apiHarness } from "./apiHarness";
import { multipart } from "./multipart";
import { integrationClient, truncateTables } from "../../infrastructure/tests/database";

const client = integrationClient();
const csv = "category,amount,unit,date\nWater,10,m3,2024-01-15\n";
beforeEach(async () => { await truncateTables(client); });
afterAll(async () => { await client.$disconnect(); });
it("A valid CSV creates one pending upload and job with Location", async () => {
  const api = await apiHarness();
  try {
    const response = await api.server.inject({ method: "POST", url: "/api/v1/uploads",
      ...multipart([{ name: "file", filename: "report.csv", data: csv }]) });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ status: "PENDING", fileName: "report.csv", id: expect.any(String) });
    expect(response.headers.location).toBe(`/api/v1/uploads/${response.json().id}`);
    expect(await client.upload.findFirstOrThrow()).toMatchObject({ userId: "anonymous" });
    expect(await client.job.count()).toBe(1);
  } finally { await api.close(); }
});

it.each(["report.txt", "../x.csv", "a\\x.csv"])("Invalid original filename is rejected: %s", async filename => {
  const api = await apiHarness();
  try {
    const response = await api.server.inject({ method: "POST", url: "/api/v1/uploads", ...multipart([{ name: "file", filename, data: csv }]) });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("INVALID_FILE_NAME");
    expect(await client.upload.count()).toBe(0);
    expect(await client.job.count()).toBe(0);
    expect(await readdir(api.runtime.settings.storageDir)).toEqual([]);
  } finally { await api.close(); }
});
it.each(["missing", "json", "two", "wrong-field"])("Invalid multipart structure: %s", async type => {
  const api = await apiHarness();
  try {
    const request = type === "json" ? { payload: JSON.stringify({ file: csv }), headers: { "content-type": "application/json" } }
      : multipart(type === "missing" ? [{ name: "note", data: "No file" }] : type === "wrong-field"
        ? [{ name: "other", filename: "report.csv", data: csv }]
        : [{ name: "file", filename: "one.csv", data: csv }, { name: "file", filename: "two.csv", data: csv }]);
    const response = await api.server.inject({ method: "POST", url: "/api/v1/uploads", ...request });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toMatch(/MISSING_FILE|VALIDATION_ERROR/);
    expect(await client.upload.count()).toBe(0);
    expect(await client.job.count()).toBe(0);
    expect(await readdir(api.runtime.settings.storageDir)).toEqual([]);
  } finally { await api.close(); }
});
