import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import type { IConvictProps } from "../config/IConvictProps";

const BYTES_PER_MB = 1024 * 1024;

export class App {
  constructor(private readonly settings: IConvictProps) {}

  async build(): Promise<FastifyInstance> {
    const server = Fastify({ logger: this.loggerOptions() });

    await server.register(cors, { origin: this.settings.corsOrigin });
    await server.register(multipart, {
      limits: { fileSize: this.settings.maxUploadMb * BYTES_PER_MB, files: 1 },
    });

    server.get("/health", async () => ({ status: "ok" }));

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
