import { runE2eLifecycle, createRunId } from "../e2e/stack/lifecycle";
import { LocalE2eStack } from "../e2e/stack/localStack";

async function main(): Promise<void> {
  const runScreenshots = process.argv.includes("--screenshots");
  const controller = new AbortController();
  const handleInterrupt = (): void => controller.abort();
  process.once("SIGINT", handleInterrupt);
  process.once("SIGTERM", handleInterrupt);

  try {
    const result = await runE2eLifecycle(new LocalE2eStack(runScreenshots), createRunId(), controller.signal);
    if (result.failure) console.error(`E2E ${result.failure} failed; sensitive process output was suppressed.`);
    process.exitCode = result.exitCode;
  } catch {
    console.error("E2E stack could not be initialized; verify local PostgreSQL and frontend dependencies.");
    process.exitCode = 1;
  } finally {
    process.removeListener("SIGINT", handleInterrupt);
    process.removeListener("SIGTERM", handleInterrupt);
  }
}

void main();
