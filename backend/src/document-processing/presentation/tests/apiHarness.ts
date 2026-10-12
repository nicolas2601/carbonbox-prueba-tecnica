import { App } from "../../../main/App";
import { workerHarness } from "../../infrastructure/tests/workerHarness";
import { PrismaUploadQueries } from "../../infrastructure/persistence/PrismaUploadQueries";
import { GetUploadByIdQueryHandler } from "../../application/queries/GetUploadByIdQueryHandler";
import { GetUploadStatsQueryHandler } from "../../application/queries/GetUploadStatsQueryHandler";
import { ListUploadsQueryHandler } from "../../application/queries/ListUploadsQueryHandler";
import { GetUploadResultsQueryHandler } from "../../application/queries/GetUploadResultsQueryHandler";
import { integrationClient } from "../../infrastructure/tests/database";

export async function apiHarness(maxUploadMb = 10) {
  const runtime = await workerHarness();
  const client = integrationClient();
  const queries = new PrismaUploadQueries(client);
  const services = { createUpload: runtime.createUpload, getUploadById: new GetUploadByIdQueryHandler(queries),
    getUploadStats: new GetUploadStatsQueryHandler(queries), listUploads: new ListUploadsQueryHandler(queries),
    getUploadResults: new GetUploadResultsQueryHandler(queries), ready: async () => { await client.$queryRaw`SELECT 1`; } };
  const server = await new App({ ...runtime.settings, maxUploadMb }, services).build();
  return { runtime, services, server, client,
    close: async () => { await server.close(); await client.$disconnect(); await runtime.close(); } };
}
