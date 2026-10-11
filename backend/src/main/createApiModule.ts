import type { FastifyInstance } from "fastify";
import type { IConvictProps } from "../config/IConvictProps";
import { createDocumentProcessingModule, type DocumentProcessingModule } from "../document-processing/infrastructure/dependency-injection/DocumentProcessingModule";
import { App } from "./App";

export interface ApiModule { server: FastifyInstance; runtime: DocumentProcessingModule; }
export async function createApiModule(settings: IConvictProps): Promise<ApiModule> {
  const runtime = createDocumentProcessingModule(settings);
  try {
    const server = await new App(settings, runtime).build();
    server.addHook("onClose", async () => { await runtime.close(); });
    return { server, runtime };
  } catch (error) { await runtime.close(); throw error; }
}
