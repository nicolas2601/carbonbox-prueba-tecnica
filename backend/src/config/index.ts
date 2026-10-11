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
  workerMaxAttempts: {
    doc: "Maximum processing attempts before a job is dead",
    format: "nat",
    default: 3,
    env: "WORKER_MAX_ATTEMPTS",
  },
  workerVisibilityTimeoutMs: {
    doc: "Lease duration extended by each saved batch",
    format: Number,
    default: 30000,
    env: "WORKER_VISIBILITY_TIMEOUT_MS",
  },
  workerRetryBaseMs: {
    doc: "Base delay for exponential job retry backoff",
    format: Number,
    default: 1000,
    env: "WORKER_RETRY_BASE_MS",
  },
});

export function loadSettings(): IConvictProps {
  schema.validate({ allowed: "strict" });
  const settings = schema.getProperties();
  const positiveIntegers = { WORKER_MAX_ATTEMPTS: settings.workerMaxAttempts,
    WORKER_VISIBILITY_TIMEOUT_MS: settings.workerVisibilityTimeoutMs, WORKER_RETRY_BASE_MS: settings.workerRetryBaseMs };
  for (const [name, value] of Object.entries(positiveIntegers)) {
    if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${name} must be a positive integer`);
  }
  return settings;
}

export type { IConvictProps };
