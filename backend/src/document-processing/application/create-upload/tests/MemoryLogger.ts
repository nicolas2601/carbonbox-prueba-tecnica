import type { ILogger, LogContext } from "../../ports/ILogger";

export class MemoryLogger implements ILogger {
  readonly events: { level: string; message: string; context: LogContext }[] = [];
  info(message: string, context: LogContext = {}): void { this.events.push({ level: "info", message, context }); }
  warn(message: string, context: LogContext = {}): void { this.events.push({ level: "warn", message, context }); }
  error(message: string, context: LogContext = {}): void { this.events.push({ level: "error", message, context }); }
}
