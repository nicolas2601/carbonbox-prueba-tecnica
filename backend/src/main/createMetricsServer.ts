import Fastify, { type FastifyInstance } from "fastify";
import type { HttpMetrics } from "../document-processing/presentation/metrics/HttpMetrics";

export function createMetricsServer(metrics: HttpMetrics): FastifyInstance {
  const server = Fastify({ logger: false });
  server.get("/metrics", async (_request, reply) => {
    try { return reply.type(metrics.contentType).send(await metrics.render()); }
    catch { return reply.code(503).type("text/plain").send("Metrics unavailable\n"); }
  });
  return server;
}
