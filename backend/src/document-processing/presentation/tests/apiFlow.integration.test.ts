import { readFile } from "node:fs/promises";
import { afterAll, beforeEach, expect, it } from "vitest";
import { apiHarness } from "./apiHarness";
import { multipart } from "./multipart";
import { integrationClient, truncateTables } from "../../infrastructure/tests/database";

const client = integrationClient();
beforeEach(async () => { await truncateTables(client); });
afterAll(async () => { await client.$disconnect(); });
it("Upload, process and read the mixed sample through HTTP", async () => {
  const api = await apiHarness();
  try {
    const data = await readFile(new URL("../../../../../samples/sample-invalid.csv", import.meta.url));
    const created = await api.server.inject({ method: "POST", url: "/api/v1/uploads", ...multipart([{ name: "file", filename: "sample-invalid.csv", data }]) });
    expect(created.statusCode).toBe(201);
    const id = created.json<{ id: string }>().id;
    await api.runtime.worker.runOnce();
    const detail = await api.server.inject(`/api/v1/uploads/${id}`);
    expect(detail.json()).toMatchObject({ status: "COMPLETED", totalRows: 25, processedRows: 15, failedRows: 10 });
    const results = await api.server.inject(`/api/v1/uploads/${id}/results?limit=100`);
    expect(results.json().data).toHaveLength(15);
    expect(results.json().total).toBe(15);
    const stats = await api.server.inject("/api/v1/uploads/stats");
    expect(stats.json()).toEqual({ total: 1, completed: 1, inProgress: 0, failed: 0,
      pending: 0, processing: 0, processedRows: 15, rejectedRows: 10 });
    expect((await api.server.inject("/api/v1/uploads/missing")).statusCode).toBe(404);
  } finally { await api.close(); }
});
