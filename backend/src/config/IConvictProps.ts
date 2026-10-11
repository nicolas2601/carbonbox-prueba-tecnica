export type NodeEnv = "development" | "test" | "production";

export type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";

export interface IConvictProps {
  env: NodeEnv;
  host: string;
  port: number;
  logLevel: LogLevel;
  databaseUrl: string;
  storageDir: string;
  maxUploadMb: number;
  corsOrigin: string;
  workerPollIntervalMs: number;
  workerBatchSize: number;
  workerMaxAttempts: number;
}
