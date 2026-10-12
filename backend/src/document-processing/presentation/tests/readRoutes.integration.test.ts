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

it("Readiness checks the database independently of liveness", async () => {
  const api = await apiHarness();
  try {
    expect((await api.server.inject("/health/ready")).statusCode).toBe(200);
    api.services.ready = async () => { throw new Error("Database host db.private.example is down"); };
    const response = await api.server.inject("/health/ready");
    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ error: { code: "SERVICE_UNAVAILABLE", message: "Database unavailable", requestId: expect.any(String) } });
    expect(response.body).not.toContain("db.private.example");
    expect((await api.server.inject("/health")).statusCode).toBe(200);
  } finally { await api.close(); }
});

it("Results return one upload page with numeric amounts and calendar dates", async () => {
  await seedJob(client);
  await client.upload.update({ where: { id: "u1" }, data: { status: "COMPLETED", totalRows: 60, processedRows: 60, failedRows: 0 } });
  await client.activityData.createMany({ data: Array.from({ length: 60 }, (_, index) => ({ id: `r${String(index).padStart(2, "0")}`,
    uploadId: "u1", category: "Water", amount: index + 1, unit: "m3", date: new Date("2024-04-11T00:00:00Z") })) });
  const api = await apiHarness();
  try {
    const response = await api.server.inject("/api/v1/uploads/u1/results?limit=25");
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ total: 60, page: 1, limit: 25 });
    expect(response.json().data).toHaveLength(25);
    expect(response.json().data[0]).toEqual({ category: "Water", amount: 1, unit: "m3", date: "2024-04-11" });
    const missing = await api.server.inject("/api/v1/uploads/missing/results");
    expect(missing.json().error.code).toBe("UPLOAD_NOT_FOUND");
    expect(missing.statusCode).toBe(404);
  } finally { await api.close(); }
});

it("List pages return typed numeric pagination", async () => {
  for (let index = 0; index < 15; index++) await seedJob(client, `u${index}`);
  const api = await apiHarness();
  try {
    const response = await api.server.inject("/api/v1/uploads?page=2&limit=10");
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ total: 15, page: 2, limit: 10 });
    expect(response.json().data).toHaveLength(5);
  } finally { await api.close(); }
});
it("List filters search the full dataset and apply status, sorting and trimmed query values", async () => {
  for (let index = 0; index < 12; index++) {
    const id = `filter-${index}`;
    await seedJob(client, id);
    await client.upload.update({ where: { id }, data: {
      fileName: index === 1 || index === 11 ? `Target-${index}.csv` : `other-${index}.csv`,
      status: index === 1 || index === 11 ? "COMPLETED" : "PENDING",
      createdAt: new Date(Date.UTC(2024, 0, 1 + index)),
    } });
  }
  const api = await apiHarness();
  try {
    const response = await api.server.inject("/api/v1/uploads?q=%20TARGET%20&status=COMPLETED&sort=oldest&limit=1");
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ total: 2, page: 1, limit: 1 });
    expect(response.json().data[0]).toMatchObject({ id: "filter-1", fileName: "Target-1.csv", status: "COMPLETED" });
  } finally { await api.close(); }
});
it.each(["limit=101", "page=0", "limit=abc", "limit=1.5"])("Invalid list values return a client error: %s", async query => {
  const api = await apiHarness();
  try {
    const response = await api.server.inject(`/api/v1/uploads?${query}`);
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toMatch(/INVALID_PAGINATION|VALIDATION_ERROR/);
  } finally { await api.close(); }
});
it.each(["q=" + "x".repeat(201), "q=bad%00name", "status=UNKNOWN", "sort=random"])(
  "Invalid upload filters return the standard client error envelope: %s", async query => {
    const api = await apiHarness();
    try {
      const response = await api.server.inject(`/api/v1/uploads?${query}`);
      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({ error: { code: expect.any(String), message: expect.any(String) } });
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
