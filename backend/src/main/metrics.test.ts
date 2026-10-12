import { afterEach, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { App } from "./App";
import { loadSettings } from "../config";
import { HttpMetrics } from "../document-processing/presentation/metrics/HttpMetrics";
import { createMetricsServer } from "./createMetricsServer";

const servers: FastifyInstance[] = [];
const metrics: HttpMetrics[] = [];
afterEach(async () => { for (const server of servers.splice(0)) await server.close(); for (const metric of metrics.splice(0)) metric.close(); });
function registry() {
  const snapshot = vi.fn().mockResolvedValue({ queued: 3, done: 7, dead: 1, oldestQueuedAgeSeconds: 10 });
  const instance = new HttpMetrics({ snapshot }, () => 100);
  metrics.push(instance);
  return { instance, snapshot };
}
it("Exposes labelled metrics only on its private server with one queue read", async () => {
  const { instance, snapshot } = registry();
  const api = await new App({ ...loadSettings(), env: "test" }, undefined, { metrics: instance }).build();
  servers.push(api);
  await api.inject("/health");
  expect((await api.inject("/metrics")).statusCode).toBe(404);
  const privateServer = createMetricsServer(instance);
  servers.push(privateServer);
  const response = await privateServer.inject("/metrics");
  expect(response.headers["content-type"]).toContain("text/plain");
  expect(response.body).toContain('carbonbox_http_requests_total{method="GET",route="/health",status_class="2xx"} 1');
  expect(response.body).toContain('carbonbox_queue_jobs{status="QUEUED"} 3');
  expect(response.body).toContain("carbonbox_queue_oldest_queued_age_seconds 10");
  expect(response.body).toContain("process_cpu_user_seconds_total");
  expect(snapshot).toHaveBeenCalledTimes(1);
});
it("Keeps missing paths out of high-cardinality labels and exposes queue failure honestly", async () => {
  const { instance, snapshot } = registry();
  const api = await new App({ ...loadSettings(), env: "test" }, undefined, { metrics: instance }).build();
  servers.push(api); await api.inject("/missing-secret-identifier");
  const text = await instance.render();
  expect(text).toContain('route="unmatched"');
  expect(text).not.toContain("missing-secret-identifier");
  snapshot.mockRejectedValue(new Error("private database details"));
  const privateServer = createMetricsServer(instance); servers.push(privateServer);
  const response = await privateServer.inject("/metrics");
  expect(response.statusCode).toBe(503);
  expect(response.body).not.toContain("private database details");
});
it("Binds an operational listener to loopback with an ephemeral test port", async () => {
  const { instance } = registry();
  const privateServer = createMetricsServer(instance); servers.push(privateServer);
  const address = await privateServer.listen({ host: "127.0.0.1", port: 0 });
  const response = await fetch(`${address}/metrics`);
  expect(response.status).toBe(200);
  expect(response.headers.get("access-control-allow-origin")).toBeNull();
});
it("Bounds uncommon HTTP methods rather than creating arbitrary method labels", async () => {
  const { instance } = registry();
  const api = Fastify(); servers.push(api); instance.instrument(api);
  api.route({ method: "TRACE", url: "/trace", handler: async () => ({ ok: true }) });
  expect((await api.inject({ method: "TRACE", url: "/trace" })).statusCode).toBe(200);
  expect(await instance.render()).toContain('carbonbox_http_requests_total{method="OTHER",route="/trace",status_class="2xx"} 1');
});
it("Counts an early rejection without inventing duration when its timer never started", async () => {
  const { instance } = registry();
  const api = Fastify(); servers.push(api);
  api.addHook("onRequest", async () => { throw new Error("Early rejection"); });
  instance.instrument(api);
  api.get("/early", async () => ({ ok: true }));
  expect((await api.inject("/early")).statusCode).toBe(500);
  const text = await instance.render();
  expect(text).toContain('carbonbox_http_requests_total{method="GET",route="/early",status_class="5xx"} 1');
  expect(text).not.toContain('carbonbox_http_request_duration_seconds_count{method="GET",route="/early"');
});
