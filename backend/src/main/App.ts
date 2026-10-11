import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import type { IConvictProps } from "../config/IConvictProps";
import type { ApiServices } from "../document-processing/presentation/http/ApiServices";
import { registerErrorHandlers } from "../document-processing/presentation/http/errorHandlers";
import { registerUploadRoutes } from "../document-processing/presentation/http/registerUploadRoutes";
import { HEALTH_SCHEMA, registerApiSchemas } from "../document-processing/presentation/http/responseSchemas";
import { registerDocs } from "../document-processing/presentation/http/registerDocs";

const BYTES_PER_MB = 1024 * 1024;

export class App {
  constructor(private readonly settings: IConvictProps, private readonly services?: ApiServices) {}

  async build(): Promise<FastifyInstance> {
    const server = Fastify({ logger: this.loggerOptions(), routerOptions: { ignoreTrailingSlash: true } });
    registerErrorHandlers(server);
    registerApiSchemas(server);
    await registerDocs(server);

    await server.register(cors, { origin: this.settings.corsOrigin });
    await server.register(multipart, {
      // Preserve the original metadata so FileName rejects paths instead of accepting a cleaned basename.
      preservePath: true,
      // Leave one byte for our limiter to detect overflow before the plugin truncates it.
      limits: { fileSize: this.settings.maxUploadMb * BYTES_PER_MB + 1, files: 1 },
    });

    server.get("/health", { schema: { tags: ["Health"], response: { 200: HEALTH_SCHEMA } } }, async () => ({ status: "ok" }));
    if (this.services) registerUploadRoutes(server, this.services, this.settings.maxUploadMb * BYTES_PER_MB);

    return server;
  }

  async start(): Promise<FastifyInstance> {
    const server = await this.build();
    await server.listen({ host: this.settings.host, port: this.settings.port });
    return server;
  }

  private loggerOptions(): { level: string } | false {
    return this.settings.env === "test" ? false : { level: this.settings.logLevel };
  }
}
