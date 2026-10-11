import { loadSettings } from "../config";
import { createApiModule } from "./createApiModule";
import { JsonConsoleLogger } from "../document-processing/infrastructure/logging/JsonConsoleLogger";
import { SystemClock } from "../document-processing/infrastructure/runtime/SystemClock";

async function main(): Promise<void> {
  const settings = loadSettings();
  const { server } = await createApiModule(settings);
  let stopping = false;
  const stop = (): void => {
    if (stopping) return;
    stopping = true;
    void server.close().then(() => { server.log.info("API stopped"); }, () => { process.exitCode = 1; });
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  try { await server.listen({ host: settings.host, port: settings.port }); }
  catch (error) { await server.close(); throw error; }
}

void main().catch(() => {
  new JsonConsoleLogger(new SystemClock(), line => { process.stderr.write(`${line}\n`); }).error("API failed to start");
  process.exitCode = 1;
});
