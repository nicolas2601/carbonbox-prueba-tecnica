import type { FastifyInstance } from "fastify";
import type { ApiServices } from "./ApiServices";
import { ReadUploadController } from "./ReadUploadController";
import { PAGINATION_QUERY } from "./requestSchemas";
import type { PaginationRequest } from "../../application/queries/models";

export function registerUploadRoutes(server: FastifyInstance, services: ApiServices): void {
  const read = new ReadUploadController(services);
  server.get("/api/v1/uploads/stats", (request, reply) => read.stats(request, reply));
  server.get<{ Querystring: PaginationRequest }>("/api/v1/uploads", { schema: { querystring: PAGINATION_QUERY } }, (request, reply) => read.list(request, reply));
  server.get<{ Params: { id: string } }>("/api/v1/uploads/:id", (request, reply) => read.byId(request, reply));
}
