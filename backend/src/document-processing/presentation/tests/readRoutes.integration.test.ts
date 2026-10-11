import { afterAll, beforeEach, expect, it } from "vitest";
import { integrationClient, truncateTables } from "../../infrastructure/tests/database";
import { seedJob } from "../../infrastructure/tests/queueFixtures";
import { apiHarness } from "./apiHarness";

const client = integrationClient();
beforeEach(async () => { await truncateTables(client); });
afterAll(async () => { await client.$disconnect(); });
it("Stats is static, not an upload id", async () => {
  await seedJob(client);
  const api = await apiHarness();
  try {
    const response = await api.server.inject("/api/v1/uploads/stats");
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ total: 1, completed: 0, inProgress: 1, failed: 0 });
  } finally { await api.close(); }
});
it("Existing and unknown uploads", async () => {
  await seedJob(client);
  const api = await apiHarness();
  try {
    const found = await api.server.inject("/api/v1/uploads/u1");
    expect(found.statusCode).toBe(200);
    expect(found.json()).toMatchObject({ id: "u1", fileName: "report.csv", status: "PENDING" });
    const missing = await api.server.inject("/api/v1/uploads/missing");
    expect(missing.statusCode).toBe(404);
    expect(missing.json()).toEqual({ error: { code: "UPLOAD_NOT_FOUND", message: "Upload not found" } });
  } finally { await api.close(); }
});
