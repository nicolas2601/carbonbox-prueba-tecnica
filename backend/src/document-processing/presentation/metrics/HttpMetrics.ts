import { collectDefaultMetrics, Counter, Gauge, Histogram, Registry } from "prom-client";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { IQueueMetrics } from "../../application/ports/IQueueMetrics";

const processRegistry = new Registry();
collectDefaultMetrics({ register: processRegistry });
const METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);
const LABELS = ["method", "route", "status_class"] as const;
const DURATION_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 5];

export class HttpMetrics {
  private readonly registry = new Registry();
  private readonly starts = new WeakMap<FastifyRequest, number>();
  private readonly requests = new Counter({ name: "carbonbox_http_requests_total", help: "HTTP requests by registered route and status class", labelNames: LABELS, registers: [this.registry] });
  private readonly duration = new Histogram({ name: "carbonbox_http_request_duration_seconds", help: "HTTP request duration in seconds", labelNames: LABELS, buckets: DURATION_BUCKETS, registers: [this.registry] });
  private readonly jobs = new Gauge({ name: "carbonbox_queue_jobs", help: "Jobs by durable queue status", labelNames: ["status"], registers: [this.registry] });
  private readonly age = new Gauge({ name: "carbonbox_queue_oldest_queued_age_seconds", help: "Age of the oldest queued job", registers: [this.registry] });
  constructor(private readonly queue: IQueueMetrics, private readonly timer: () => number) {}
  get contentType(): string { return this.registry.contentType; }
  instrument(server: FastifyInstance): void {
    server.addHook("onRequest", async request => { this.starts.set(request, this.timer()); });
    server.addHook("onResponse", async (request, reply) => {
      const labels = { method: METHODS.has(request.method) ? request.method : "OTHER",
        route: request.routeOptions.url ?? "unmatched", status_class: `${Math.floor(reply.statusCode / 100)}xx` };
      this.requests.inc(labels);
      const start = this.starts.get(request);
      if (start !== undefined) this.duration.observe(labels, Math.max(0, this.timer() - start) / 1000);
      this.starts.delete(request);
    });
  }
  async render(): Promise<string> {
    const snapshot = await this.queue.snapshot();
    this.jobs.set({ status: "QUEUED" }, snapshot.queued); this.jobs.set({ status: "DONE" }, snapshot.done); this.jobs.set({ status: "DEAD" }, snapshot.dead);
    this.age.set(snapshot.oldestQueuedAgeSeconds);
    return Registry.merge([processRegistry, this.registry]).metrics();
  }
  close(): void { this.registry.clear(); }
}
