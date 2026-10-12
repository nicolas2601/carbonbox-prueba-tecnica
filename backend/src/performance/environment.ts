import { ownedUrl } from "./scope";

export interface ChildSettings { runId: string; databaseUrl: string; storageDir: string; port: number; batchSize?: number; }
export function environment(settings: ChildSettings, inherited: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  return { ...inherited, NODE_ENV: "production", HOST: "127.0.0.1", PORT: String(settings.port), LOG_LEVEL: "silent",
    DATABASE_URL: ownedUrl(settings.databaseUrl, settings.runId), STORAGE_DIR: settings.storageDir,
    MAX_UPLOAD_MB: "10", WORKER_BATCH_SIZE: String(settings.batchSize ?? 500), WORKER_POLL_INTERVAL_MS: "1000",
    RATE_LIMIT_MAX: "1000000", UPLOAD_RATE_LIMIT_MAX: "1000000", RATE_LIMIT_WINDOW_MS: "60000",
    WORKER_MAX_ATTEMPTS: "3", WORKER_VISIBILITY_TIMEOUT_MS: "30000", WORKER_RETRY_BASE_MS: "1000",
    PERF_RUN_ID: settings.runId, CORS_ORIGIN: "http://localhost:3300" };
}
