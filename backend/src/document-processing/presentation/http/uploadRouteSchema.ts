import type { FastifySchema } from "fastify";
import { ERROR_SCHEMA } from "./responseSchemas";

export const FILE_PART_NAME = "file";
export interface StreamRouteSchema extends FastifySchema { "x-stream-body"?: object; }
export const UPLOAD_ROUTE_SCHEMA: StreamRouteSchema = {
  tags: ["Uploads"], consumes: ["multipart/form-data"],
  "x-stream-body": { type: "object", required: [FILE_PART_NAME], properties: { [FILE_PART_NAME]: { type: "string", format: "binary" } } },
  response: { 201: { $ref: "UploadCreated#", headers: { Location: { type: "string", description: "Created upload resource" } } },
    400: ERROR_SCHEMA, 413: ERROR_SCHEMA, 500: ERROR_SCHEMA },
};
