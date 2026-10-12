export type NodeEnv = "development" | "test" | "production";

export type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";

export interface IConvictProps {
  env: NodeEnv;
  host: string;
  port: number;
  logLevel: LogLevel;
  databaseUrl: string;
  storageDir: string;
  storageDriver: "fs";
  maxUploadMb: number;
  corsOrigin: string;
  rateLimitMax: number;
  uploadRateLimitMax: number;
  rateLimitWindowMs: number;
  metricsHost: string;
  metricsPort: number;
  workerPollIntervalMs: number;
  workerBatchSize: number;
  workerMaxAttempts: number;
  workerVisibilityTimeoutMs: number;
  workerRetryBaseMs: number;
}
