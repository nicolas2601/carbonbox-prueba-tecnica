import type { FastifyInstance } from "fastify";
import type { ApiServices } from "./ApiServices";
import { ReadUploadController } from "./ReadUploadController";
import { ID_PARAMS, PAGINATION_QUERY } from "./requestSchemas";
import type { PaginationRequest } from "../../application/queries/models";
import { CreateUploadController } from "./CreateUploadController";
import { UploadEndpoint } from "./UploadEndpoint";
import { sendError } from "./errorHandlers";
import { ERROR_SCHEMA, HEALTH_SCHEMA, pageSchema } from "./responseSchemas";

export function registerUploadRoutes(server: FastifyInstance, services: ApiServices, maxBytes: number): void {
  const read = new ReadUploadController(services);
  const create = new CreateUploadController(new UploadEndpoint(services.createUpload, maxBytes));
  server.get("/health/ready", { schema: { response: { 200: HEALTH_SCHEMA, 503: ERROR_SCHEMA } } }, (request, reply) => services.ready().then(
    () => reply.send({ status: "ready" }), cause => sendError(request, reply, cause, "SERVICE_UNAVAILABLE")));
  server.post("/api/v1/uploads", { schema: { response: { 201: { $ref: "UploadCreated#" }, 400: ERROR_SCHEMA, 413: ERROR_SCHEMA, 500: ERROR_SCHEMA } } }, (request, reply) => create.create(request, reply));
  server.get("/api/v1/uploads/stats", { schema: { response: { 200: { $ref: "UploadStats#" }, 500: ERROR_SCHEMA } } }, (request, reply) => read.stats(request, reply));
  server.get<{ Querystring: PaginationRequest }>("/api/v1/uploads", { schema: { querystring: PAGINATION_QUERY,
    response: { 200: pageSchema("UploadView"), 400: ERROR_SCHEMA, 500: ERROR_SCHEMA } } }, (request, reply) => read.list(request, reply));
  server.get<{ Params: { id: string } }>("/api/v1/uploads/:id", { schema: { params: ID_PARAMS,
    response: { 200: { $ref: "UploadView#" }, 400: ERROR_SCHEMA, 404: ERROR_SCHEMA, 500: ERROR_SCHEMA } } }, (request, reply) => read.byId(request, reply));
  server.get<{ Params: { id: string }; Querystring: PaginationRequest }>("/api/v1/uploads/:id/results",
    { schema: { params: ID_PARAMS, querystring: PAGINATION_QUERY,
      response: { 200: pageSchema("ResultRow"), 400: ERROR_SCHEMA, 404: ERROR_SCHEMA, 500: ERROR_SCHEMA } } }, (request, reply) => read.results(request, reply));
}
