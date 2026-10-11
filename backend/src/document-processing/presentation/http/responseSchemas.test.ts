import Fastify from "fastify";
import { expect, it } from "vitest";
import { registerApiSchemas } from "./responseSchemas";

it("Public response and error models have a single registered schema", async () => {
  const server = Fastify();
  registerApiSchemas(server);
  expect(Object.keys(server.getSchemas()).sort()).toEqual(["ErrorEnvelope", "ResultRow", "UploadCreated", "UploadStats", "UploadView"]);
  expect(server.getSchema("ErrorEnvelope")).toMatchObject({ type: "object", required: ["error"], properties: { error: { required: ["code", "message"] } } });
  expect(server.getSchema("UploadView")).toMatchObject({ properties: { createdAt: { type: "string", format: "date-time" } } });
  await server.close();
});
