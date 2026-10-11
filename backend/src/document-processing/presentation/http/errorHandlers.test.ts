import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, expect, it } from "vitest";
import { registerErrorHandlers } from "./errorHandlers";

let server: FastifyInstance;
afterEach(async () => { await server.close(); });
it("Unexpected exception exposes only fixed text and correlates the real log cause", async () => {
  const logs: string[] = [];
  server = Fastify({ logger: { level: "error", stream: { write: line => { logs.push(line); } } } });
  registerErrorHandlers(server);
  server.get("/boom", async () => { throw new Error("Database host db.private.example is down"); });
  const response = await server.inject("/boom");
  expect(response.statusCode).toBe(500);
  expect(response.json()).toEqual({ error: { code: "INTERNAL_ERROR", message: "Internal server error", requestId: expect.any(String) } });
  expect(response.body).not.toContain("db.private.example");
  expect(logs.join("\n")).toContain("db.private.example");
  expect(logs.join("\n")).toContain(response.json().error.requestId);
});
it("Bad parameter uses the envelope and names its field", async () => {
  server = Fastify();
  registerErrorHandlers(server);
  server.get("/validate", { schema: { querystring: { type: "object", properties: { limit: { type: "number" } } } } }, async () => ({}));
  const response = await server.inject("/validate?limit=abc");
  expect(response.statusCode).toBe(400);
  expect(response.json()).toMatchObject({ error: { code: "VALIDATION_ERROR", message: expect.stringContaining("limit") } });
});
it("Unknown route is consistent JSON", async () => {
  server = Fastify();
  registerErrorHandlers(server);
  const response = await server.inject("/api/v1/nope");
  expect(response.statusCode).toBe(404);
  expect(response.json()).toEqual({ error: { code: "ROUTE_NOT_FOUND", message: "Route not found" } });
});
it("URL credentials are masked in the logged error message and stack", async () => {
  const logs: string[] = [];
  server = Fastify({ logger: { level: "error", stream: { write: line => { logs.push(line); } } } });
  registerErrorHandlers(server);
  server.get("/credentials", async () => {
    throw new Error("Connection failed: postgresql://demo:example-password@db.private.example/carbonbox");
  });
  const response = await server.inject("/credentials");
  expect(response.statusCode).toBe(500);
  expect(response.body).not.toContain("db.private.example");
  const output = logs.join("\n");
  expect(output).not.toContain("example-password");
  expect(output).not.toContain("demo:");
  expect(output).toContain("postgresql://***@db.private.example/carbonbox");
  expect(output).toContain(response.json().error.requestId);
  const error = JSON.parse(logs[0]!).err;
  expect(error.message).toContain("postgresql://***@db.private.example");
  expect(error.stack).toContain("postgresql://***@db.private.example");
});
it.each([
  { statusCode: 413, code: "FILE_TOO_LARGE", status: 413 },
  { statusCode: 415, code: "VALIDATION_ERROR", status: 400 },
])("Framework status $statusCode uses the envelope", async ({ statusCode, code, status }) => {
  server = Fastify();
  registerErrorHandlers(server);
  server.get("/framework", async () => { throw Object.assign(new Error("Internal framework detail"), { statusCode }); });
  const response = await server.inject("/framework");
  expect(response.statusCode).toBe(status);
  expect(response.json()).toMatchObject({ error: { code } });
  expect(response.body).not.toContain("Internal framework detail");
  expect(response.json().error).not.toHaveProperty("requestId");
});
it.each(["postgresql://demo:example-password@host/db", { password: "example-password" }, (() => {
  const error = new Error("Connection refused"); error.stack = undefined; return error;
})()])("Unexpected throw values cannot bypass URL redaction: %j", async cause => {
  const logs: string[] = [];
  server = Fastify({ logger: { level: "error", stream: { write: line => { logs.push(line); } } } });
  registerErrorHandlers(server);
  server.get("/unexpected", async () => { throw cause; });
  const response = await server.inject("/unexpected");
  expect(response.statusCode).toBe(500);
  expect(response.json().error.code).toBe("INTERNAL_ERROR");
  expect(logs.join("\n")).not.toContain("example-password");
  expect(logs.join("\n")).toContain(response.json().error.requestId);
});
