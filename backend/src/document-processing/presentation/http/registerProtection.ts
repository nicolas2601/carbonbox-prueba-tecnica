import type { FastifyInstance } from "fastify";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import { corsOrigins } from "./corsOrigins";

export async function registerProtection(server: FastifyInstance, configuredOrigins: string): Promise<void> {
  const origins = new Set(corsOrigins(configuredOrigins));
  // Swagger requires its own script policy; JSON API headers do not grant script execution.
  await server.register(helmet, { contentSecurityPolicy: false, frameguard: { action: "deny" } });
  await server.register(cors, { origin: (origin, callback) => callback(null, Boolean(origin && origins.has(origin))),
    methods: ["GET", "POST", "OPTIONS"], allowedHeaders: ["content-type", "x-request-id"],
    exposedHeaders: ["x-request-id", "location"], credentials: false });
}
