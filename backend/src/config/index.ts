import "dotenv/config";
import convict from "convict";
import type { IConvictProps } from "./IConvictProps";

const schema = convict<IConvictProps>({
  env: {
    doc: "Runtime environment",
    format: ["development", "test", "production"],
    default: "development",
    env: "NODE_ENV",
  },
  host: {
    doc: "Interface the HTTP server binds to",
    format: String,
    default: "0.0.0.0",
    env: "HOST",
  },
  port: {
    doc: "HTTP port",
    format: "port",
    default: 3001,
    env: "PORT",
  },
  logLevel: {
    doc: "Pino log level",
    format: ["fatal", "error", "warn", "info", "debug", "trace", "silent"],
    default: "info",
    env: "LOG_LEVEL",
  },
  databaseUrl: {
    doc: "PostgreSQL connection string",
    format: String,
    default: "postgresql://postgres:postgres@localhost:5432/document_processing",
    env: "DATABASE_URL",
  },
  storageDir: {
    doc: "Directory shared by the API and the worker for uploaded files",
    format: String,
    default: "./storage",
    env: "STORAGE_DIR",
  },
  maxUploadMb: {
    doc: "Maximum accepted upload size in megabytes",
    format: "nat",
    default: 10,
    env: "MAX_UPLOAD_MB",
  },
  corsOrigin: {
    doc: "Origin allowed to call the API from a browser",
    format: String,
    default: "http://localhost:3000",
    env: "CORS_ORIGIN",
  },
  workerPollIntervalMs: {
    doc: "Delay between queue polls when the queue is empty",
    format: "nat",
    default: 1000,
    env: "WORKER_POLL_INTERVAL_MS",
  },
  workerBatchSize: {
    doc: "Rows persisted per batch, which is also the progress granularity",
    format: "nat",
    default: 500,
    env: "WORKER_BATCH_SIZE",
  },
});

export function loadSettings(): IConvictProps {
  schema.validate({ allowed: "strict" });
  return schema.getProperties();
}

export type { IConvictProps };
