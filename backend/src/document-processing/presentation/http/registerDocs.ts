import type { FastifyInstance } from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { StreamRouteSchema } from "./uploadRouteSchema";

export async function registerDocs(server: FastifyInstance): Promise<void> {
  await server.register(swagger, {
    openapi: { openapi: "3.0.3", info: { title: "CarbonBox Document Processing API", version: "0.1.0" } },
    transform: ({ schema, url }) => {
      const { "x-stream-body": body, ...metadata } = schema as StreamRouteSchema;
      // Multipart is validated as a stream, not as a buffered JSON request body.
      return { schema: body ? { ...metadata, body } : metadata, url };
    },
  });
  await server.register(swaggerUi, { routePrefix: "/docs", staticCSP: true });
}
