export interface LogContext {
  uploadId?: string;
  jobId?: string;
  key?: string;
  outcome?: string;
  errorCode?: string;
}
export interface ILogger {
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
}
