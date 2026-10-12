import { afterAll, beforeEach, expect, it } from "vitest";
import { apiHarness } from "./apiHarness";
import { integrationClient, truncateTables } from "../../infrastructure/tests/database";

interface Operation { tags: string[]; responses: Record<string, { headers?: Record<string, unknown> }>; parameters?: { name: string; schema?: { enum?: string[] } }[]; requestBody?: { content: Record<string, { schema: { properties: { file: { type: string; format: string } } } }> }; }
interface Document { openapi: string; info: { title: string; version: string }; paths: Record<string, { get?: Operation; post?: Operation }>; }
const client = integrationClient();
beforeEach(async () => { await truncateTables(client); });
afterAll(async () => { await client.$disconnect(); });
it("OpenAPI lists all five operations with response envelopes and binary multipart", async () => {
  const api = await apiHarness();
  try {
    const response = await api.server.inject("/docs/json");
    expect(response.statusCode).toBe(200);
    const document = response.json<Document>();
    expect(document.openapi).toMatch(/^3\./);
    expect(response.body).not.toContain("x-stream-body");
    for (const [path, method] of [["/api/v1/uploads", "post"], ["/api/v1/uploads", "get"],
      ["/api/v1/uploads/stats", "get"], ["/api/v1/uploads/{id}", "get"], ["/api/v1/uploads/{id}/results", "get"]] as const) {
      const operation = document.paths[path]?.[method];
      expect(operation).toBeDefined();
      expect(operation?.tags).toContain("Uploads");
      expect(operation?.responses["500"]).toBeDefined();
    }
    const list = document.paths["/api/v1/uploads"]?.get;
    expect(list?.parameters?.map(parameter => parameter.name)).toEqual(expect.arrayContaining(["q", "status", "sort", "page", "limit"]));
    expect(list?.parameters?.find(parameter => parameter.name === "status")?.schema?.enum)
      .toEqual(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]);
    expect(list?.parameters?.find(parameter => parameter.name === "sort")?.schema?.enum).toEqual(["newest", "oldest", "name"]);
    const post = document.paths["/api/v1/uploads"]?.post;
    expect(post?.requestBody?.content["multipart/form-data"]?.schema.properties.file).toEqual({ type: "string", format: "binary" });
    expect(post?.responses["201"]?.headers?.Location).toBeDefined();
  } finally { await api.close(); }
});
it("The documentation page loads as HTML", async () => {
  const api = await apiHarness();
  try {
    const response = await api.server.inject("/docs");
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
  } finally { await api.close(); }
});
