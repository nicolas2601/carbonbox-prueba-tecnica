import { loadSettings } from "../config";
import { createDocumentProcessingModule } from "../document-processing/infrastructure/dependency-injection/DocumentProcessingModule";
import { runRequeue } from "./runRequeue";

async function main(): Promise<void> {
  const module = createDocumentProcessingModule(loadSettings());
  try {
    process.exitCode = await runRequeue(process.argv.slice(2), module.requeueDeadJob,
      line => { process.stdout.write(`${line}\n`); });
  } finally { await module.close(); }
}
void main().catch(() => {
  process.stderr.write('Job requeue failed; check configuration and database availability\n');
  process.exitCode = 1;
});
