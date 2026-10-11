import type { FastifyInstance } from "fastify";

const TEXT = { type: "string" };
const INSTANT = { type: "string", format: "date-time" };
const COUNTER = { type: ["integer", "null"] };
const CREATED_PROPERTIES = { id: TEXT, status: TEXT, fileName: TEXT, createdAt: INSTANT };

export function registerApiSchemas(server: FastifyInstance): void {
  server.addSchema({ $id: "ErrorEnvelope", type: "object", additionalProperties: false, required: ["error"], properties: {
    error: { type: "object", additionalProperties: false, required: ["code", "message"],
      properties: { code: TEXT, message: TEXT, requestId: TEXT } },
  } });
  server.addSchema({ $id: "UploadCreated", type: "object", additionalProperties: false,
    required: Object.keys(CREATED_PROPERTIES), properties: CREATED_PROPERTIES });
  const upload = { ...CREATED_PROPERTIES, updatedAt: INSTANT, totalRows: COUNTER, processedRows: COUNTER,
    failedRows: COUNTER, errorMessage: { type: ["string", "null"] } };
  server.addSchema({ $id: "UploadView", type: "object", additionalProperties: false, required: Object.keys(upload), properties: upload });
  const row = { category: TEXT, amount: { type: "number" }, unit: TEXT, date: { type: "string", format: "date" } };
  server.addSchema({ $id: "ResultRow", type: "object", additionalProperties: false, required: Object.keys(row), properties: row });
  const stats = { total: { type: "integer" }, completed: { type: "integer" }, inProgress: { type: "integer" }, failed: { type: "integer" } };
  server.addSchema({ $id: "UploadStats", type: "object", additionalProperties: false, required: Object.keys(stats), properties: stats });
}
export function pageSchema(item: string): object {
  return { type: "object", additionalProperties: false, required: ["data", "total", "page", "limit"],
    properties: { data: { type: "array", items: { $ref: `${item}#` } }, total: { type: "integer" },
      page: { type: "integer" }, limit: { type: "integer" } } };
}
export const ERROR_SCHEMA = { $ref: "ErrorEnvelope#" };
export const HEALTH_SCHEMA = { type: "object", required: ["status"], properties: { status: TEXT } };
