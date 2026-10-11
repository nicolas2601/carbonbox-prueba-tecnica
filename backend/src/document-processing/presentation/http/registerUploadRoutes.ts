import type { FastifyInstance } from "fastify";
import type { ApiServices } from "./ApiServices";
import { ReadUploadController } from "./ReadUploadController";
import { PAGINATION_QUERY } from "./requestSchemas";
import type { PaginationRequest } from "../../application/queries/models";
import { CreateUploadController } from "./CreateUploadController";
import { UploadEndpoint } from "./UploadEndpoint";
import { sendError } from "./errorHandlers";

export function registerUploadRoutes(server: FastifyInstance, services: ApiServices, maxBytes: number): void {
  const read = new ReadUploadController(services);
  const create = new CreateUploadController(new UploadEndpoint(services.createUpload, maxBytes));
  server.get("/health/ready", (request, reply) => services.ready().then(
    () => reply.send({ status: "ready" }), cause => sendError(request, reply, cause, "SERVICE_UNAVAILABLE")));
  server.post("/api/v1/uploads", (request, reply) => create.create(request, reply));
  server.get("/api/v1/uploads/stats", (request, reply) => read.stats(request, reply));
  server.get<{ Querystring: PaginationRequest }>("/api/v1/uploads", { schema: { querystring: PAGINATION_QUERY } }, (request, reply) => read.list(request, reply));
  server.get<{ Params: { id: string } }>("/api/v1/uploads/:id", (request, reply) => read.byId(request, reply));
  server.get<{ Params: { id: string }; Querystring: PaginationRequest }>("/api/v1/uploads/:id/results",
    { schema: { querystring: PAGINATION_QUERY } }, (request, reply) => read.results(request, reply));
}
