import { randomBytes } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Pool } from "pg";
import { OwnedDatabase } from "./database";
import { adminUrl, assertStorage, ownedUrl } from "./scope";
import { port, start, stop, exit, type OwnedProcess } from "./processes";
import { ready } from "./http";
import type { ChildSettings } from "./environment";

export class PerformanceStack {
  readonly runId = `${process.pid}_${Date.now().toString(36)}_${randomBytes(6).toString("hex")}`;
  readonly database: OwnedDatabase;
  readonly admin: Pool;
  readonly databaseUrl: string;
  readonly processes: OwnedProcess[] = [];
  storageDir?: string;
  apiUrl?: string;
  worker?: OwnedProcess;
  data?: Pool;
  private apiPort = 0;
  constructor(private readonly root: string, url: string, private readonly batchSize = 500) {
    const target = new URL(adminUrl(url));
    this.admin = new Pool({ connectionString: target.toString(), max: 1 });
    this.database = new OwnedDatabase(this.runId, this.admin);
    target.pathname = `/${this.database.name}`;
    this.databaseUrl = ownedUrl(target.toString(), this.runId);
  }
  async prepare(signal: AbortSignal): Promise<void> {
    await this.database.create();
    this.storageDir = await mkdtemp(join(tmpdir(), `carbonbox-perf-${this.runId}-`));
    this.apiPort = await port();
    const migration = await this.launch("db:deploy");
    await exit(migration);
    this.data = new Pool({ connectionString: this.databaseUrl, max: 1 });
    await this.launch("start");
    this.apiUrl = `http://127.0.0.1:${this.apiPort}`;
    await ready(this.apiUrl, signal);
    this.worker = await this.launch("measure:worker");
  }
  private settings(): ChildSettings {
    if (!this.storageDir) throw new Error("Performance storage not ready");
    return { runId: this.runId, databaseUrl: this.databaseUrl, storageDir: this.storageDir, port: this.apiPort, batchSize: this.batchSize };
  }
  private async launch(script: string): Promise<OwnedProcess> {
    const process = await start(script, this.root, this.settings());
    this.processes.push(process);
    return process;
  }
  async close(): Promise<void> {
    const errors: unknown[] = [];
    for (const process of this.processes) { try { await stop(process); } catch (error) { errors.push(error); } }
    try { await this.data?.end(); } catch (error) { errors.push(error); }
    try { await this.database.drop(); } catch (error) { errors.push(error); }
    if (this.storageDir) {
      try { await assertStorage(this.storageDir, this.runId); await rm(this.storageDir, { recursive: true }); } catch (error) { errors.push(error); }
    }
    try { await this.admin.end(); } catch (error) { errors.push(error); }
    if (errors.length) throw new AggregateError(errors, "Owned performance resources could not be cleaned up");
  }
}
