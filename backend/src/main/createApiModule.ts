import type { FastifyInstance } from "fastify";
import type { IConvictProps } from "../config/IConvictProps";
import { createDocumentProcessingModule, type DocumentProcessingModule } from "../document-processing/infrastructure/dependency-injection/DocumentProcessingModule";
import { App } from "./App";
import { performance } from "node:perf_hooks";
import { HttpMetrics } from "../document-processing/presentation/metrics/HttpMetrics";
import { createMetricsServer } from "./createMetricsServer";

export interface ApiModule { server: FastifyInstance; metricsServer: FastifyInstance; runtime: DocumentProcessingModule; }
export async function createApiModule(settings: IConvictProps): Promise<ApiModule> {
  const runtime = createDocumentProcessingModule(settings);
  const metrics = new HttpMetrics(runtime.queueMetrics, () => performance.now());
  const metricsServer = createMetricsServer(metrics);
  try {
    const server = await new App(settings, runtime, { metrics }).build();
    server.addHook("onClose", async () => { await metricsServer.close(); metrics.close(); await runtime.close(); });
    return { server, metricsServer, runtime };
  } catch (error) { await metricsServer.close(); metrics.close(); await runtime.close(); throw error; }
}
