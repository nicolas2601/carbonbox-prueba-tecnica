import type { ILogger, LogContext } from "../../application/ports/ILogger";
import type { IClock } from "../../application/ports/IClock";

export class JsonConsoleLogger implements ILogger {
  constructor(private readonly clock: IClock, private readonly write: (line: string) => void) {}
  info(message: string, context?: LogContext): void { this.log("info", message, context); }
  warn(message: string, context?: LogContext): void { this.log("warn", message, context); }
  error(message: string, context?: LogContext): void { this.log("error", message, context); }
  private log(level: string, message: string, context: LogContext = {}): void {
    this.write(JSON.stringify({ level, message, context, time: this.clock.now().toISOString() }));
  }
}
