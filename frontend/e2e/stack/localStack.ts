import { createRequire } from "node:module";
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { access, mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isOwnedDatabaseName, type E2eStack, type StackLifecycle } from "./lifecycle";

const FRONTEND_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const BACKEND_DIR = resolve(FRONTEND_DIR, "../backend");
const PLAYWRIGHT_BIN = join(FRONTEND_DIR, "node_modules/.bin/playwright");
const DEFAULT_ADMIN_URL = "postgresql://postgres:postgres@localhost:5432/postgres";
const STARTUP_TIMEOUT_MS = 60_000;
const SHUTDOWN_TIMEOUT_MS = 3_000;
const POLL_INTERVAL_MS = 200;

interface PgClient {
  connect(): Promise<void>;
  end(): Promise<void>;
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values?: readonly unknown[],
  ): Promise<{ rows: Row[] }>;
}
interface PgModule { Client: new (options: { connectionString: string; connectionTimeoutMillis: number }) => PgClient; }

export class LocalE2eStack implements StackLifecycle {
  private readonly children = new Map<number, ChildProcess>();
  private readonly services = new Map<string, ChildProcess>();
  private readonly ownedDatabases = new Set<string>();
  private readonly ownedStorage = new Set<string>();
  private readonly runScreenshots: boolean;
  private readonly adminDatabaseUrl: string;
  private readonly parentEnv: NodeJS.ProcessEnv;
  private readonly production: boolean;

  constructor(runScreenshots: boolean, parentEnv: NodeJS.ProcessEnv = process.env) {
    this.runScreenshots = runScreenshots;
    this.parentEnv = parentEnv;
    this.production = parentEnv.E2E_PRODUCTION === "1";
    this.adminDatabaseUrl = parentEnv.E2E_ADMIN_DATABASE_URL ?? DEFAULT_ADMIN_URL;
    validateLocalDatabaseUrl(this.adminDatabaseUrl);
  }

  async prepare(stack: E2eStack): Promise<void> {
    if (!/^[A-Za-z0-9_]{1,40}$/.test(stack.runId)) throw new Error("Invalid E2E run identifier");
    await this.createDatabase(stack);
    stack.storageDir = await mkdtemp(join(tmpdir(), `carbonbox-e2e-${stack.runId}-`));
    this.ownedStorage.add(stack.storageDir);
    const apiPort = await reservePort();
    const webPort = await reservePort();
    stack.apiUrl = `http://127.0.0.1:${apiPort}`;
    stack.baseURL = `http://127.0.0.1:${webPort}`;
    const env = this.createStackEnv(stack, apiPort);
    await this.migrate(stack, env);
    if (this.production) {
      const build = await this.runToCompletion("bun", ["run", "build"], FRONTEND_DIR, env, stack, false);
      if (build !== 0) throw new Error("E2E production build failed");
    }
    await this.start("bun", ["run", this.production ? "start" : "dev", "--hostname", "127.0.0.1", "--port", String(webPort)], FRONTEND_DIR, env, stack, "frontend");
    await this.start("bun", ["run", "start"], BACKEND_DIR, env, stack, "api");
    await this.start("bun", ["run", "worker"], BACKEND_DIR, env, stack, "worker");
    await waitForHttp(`${stack.apiUrl}/health/ready`, stack, STARTUP_TIMEOUT_MS);
    await waitForHttp(stack.baseURL, stack, STARTUP_TIMEOUT_MS);
    this.assertWorkersRunning(stack);
  }

  async runTests(stack: E2eStack): Promise<number> {
    await access(PLAYWRIGHT_BIN);
    const args = ["test", "--config", join(FRONTEND_DIR, "config/playwright.config.ts"), "--project=chromium"];
    if (this.runScreenshots) args.push("--grep", "@screenshot");
    const env = { ...this.createStackEnv(stack), E2E_BASE_URL: stack.baseURL, E2E_API_URL: stack.apiUrl,
      E2E_DATABASE_URL: stack.databaseUrl, E2E_STORAGE_DIR: stack.storageDir,
      E2E_STACK_OWNED: stack.databaseName, E2E_WORKER_GROUP: String(this.services.get("worker")?.pid ?? "") };
    return this.runToCompletion(PLAYWRIGHT_BIN, args, FRONTEND_DIR, env, stack, true);
  }

  async teardown(stack: E2eStack): Promise<void> {
    let failed = false;
    for (const [pid, child] of [...this.children].reverse()) {
      try { await stopProcessGroup(pid, child); } catch { failed = true; }
    }
    if (stack.databaseOwned && stack.databaseName && this.ownedDatabases.has(stack.databaseName)) {
      try { await this.dropDatabase(stack.databaseName, stack.runId); } catch { failed = true; }
    }
    if (stack.storageDir) {
      try {
        if (!this.ownedStorage.has(stack.storageDir)) throw new Error("Unowned storage");
        await removeOwnedStorage(stack.storageDir, stack.runId); this.ownedStorage.delete(stack.storageDir);
      } catch { failed = true; }
    }
    if (failed) throw new Error("E2E teardown failed");
  }

  private async createDatabase(stack: E2eStack): Promise<void> {
    const databaseName = `carbonbox_e2e_${stack.runId}`;
    if (!isOwnedDatabaseName(databaseName, stack.runId)) throw new Error("Unsafe E2E database name");
    const client = this.createPgClient(this.adminDatabaseUrl);
    try {
      await client.connect();
      const existing = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [databaseName]);
      if (existing.rows.length) throw new Error("E2E database already exists");
      stack.databaseName = databaseName;
      await client.query(`CREATE DATABASE "${databaseName}"`);
      this.ownedDatabases.add(databaseName);
      stack.databaseOwned = true;
      const databaseUrl = new URL(this.adminDatabaseUrl);
      databaseUrl.pathname = `/${databaseName}`;
      stack.databaseUrl = databaseUrl.toString();
    } finally {
      await client.end();
    }
  }

  private async dropDatabase(databaseName: string, runId: string): Promise<void> {
    if (!this.ownedDatabases.has(databaseName) || !isOwnedDatabaseName(databaseName, runId)) {
      throw new Error("Refusing to drop an unowned database");
    }
    const client = this.createPgClient(this.adminDatabaseUrl);
    try {
      await client.connect();
      await client.query("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()", [databaseName]);
      await client.query(`DROP DATABASE "${databaseName}"`);
      this.ownedDatabases.delete(databaseName);
    } finally {
      await client.end();
    }
  }

  private createPgClient(connectionString: string): PgClient {
    const backendPackage = join(BACKEND_DIR, "package.json");
    const pg = createRequire(backendPackage)("pg") as PgModule;
    return new pg.Client({ connectionString, connectionTimeoutMillis: 5_000 });
  }

  private createStackEnv(stack: E2eStack, apiPort?: number): NodeJS.ProcessEnv {
    const env: NodeJS.ProcessEnv = { ...this.parentEnv, NODE_ENV: this.production ? "production" : "development", HOST: "127.0.0.1", STORAGE_DIR: stack.storageDir,
      DATABASE_URL: stack.databaseUrl, PORT: apiPort === undefined ? undefined : String(apiPort),
      CORS_ORIGIN: stack.baseURL, MAX_UPLOAD_MB: this.parentEnv.E2E_API_MAX_UPLOAD_MB ?? "1",
      NEXT_PUBLIC_API_URL: stack.apiUrl ? `${stack.apiUrl}/api/v1` : undefined,
      NEXT_DIST_DIR: this.parentEnv.NEXT_DIST_DIR ?? ".next-e2e", METRICS_PORT: "0",
      RATE_LIMIT_MAX: "1000000", UPLOAD_RATE_LIMIT_MAX: "1000000",
      NEXT_PUBLIC_MAX_UPLOAD_MB: this.parentEnv.E2E_FRONTEND_MAX_UPLOAD_MB ?? "10" };
    for (const key of ["WORKER_BATCH_SIZE", "WORKER_POLL_INTERVAL_MS", "WORKER_MAX_ATTEMPTS",
      "WORKER_VISIBILITY_TIMEOUT_MS", "WORKER_RETRY_BASE_MS"]) delete env[key];
    copyOverride(this.parentEnv, env, "E2E_WORKER_BATCH_SIZE", "WORKER_BATCH_SIZE");
    copyOverride(this.parentEnv, env, "E2E_WORKER_POLL_INTERVAL_MS", "WORKER_POLL_INTERVAL_MS");
    copyOverride(this.parentEnv, env, "E2E_WORKER_MAX_ATTEMPTS", "WORKER_MAX_ATTEMPTS");
    copyOverride(this.parentEnv, env, "E2E_WORKER_VISIBILITY_TIMEOUT_MS", "WORKER_VISIBILITY_TIMEOUT_MS");
    copyOverride(this.parentEnv, env, "E2E_WORKER_RETRY_BASE_MS", "WORKER_RETRY_BASE_MS");
    return env;
  }

  private async migrate(stack: E2eStack, env: NodeJS.ProcessEnv): Promise<void> {
    const code = await this.runToCompletion("bun", ["run", "db:deploy"], BACKEND_DIR, env, stack, false);
    if (code !== 0) throw new Error("E2E database migration failed");
  }

  private async start(
    command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv, stack: E2eStack, name: string,
  ): Promise<void> {
    const child = spawn(command, args, { cwd, env, detached: true, stdio: ["ignore", "ignore", "ignore"] });
    await once(child, "spawn");
    if (!child.pid) throw new Error("Could not start an E2E service");
    this.children.set(child.pid, child);
    this.services.set(name, child);
    stack.processes.add(child.pid);
  }

  private async runToCompletion(
    command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv, stack: E2eStack, inheritOutput: boolean,
  ): Promise<number> {
    const child = spawn(command, args, { cwd, env, detached: true,
      stdio: inheritOutput ? ["ignore", "inherit", "inherit"] : ["ignore", "ignore", "ignore"] });
    await once(child, "spawn");
    if (!child.pid) throw new Error("Could not start an E2E command");
    const pid = child.pid;
    this.children.set(pid, child);
    stack.processes.add(pid);
    const abortRun = (): void => { void stopProcessGroup(pid, child); };
    if (stack.abortSignal?.aborted) abortRun();
    else stack.abortSignal?.addEventListener("abort", abortRun, { once: true });
    try {
      const [code] = await once(child, "close") as [number | null, NodeJS.Signals | null];
      return code ?? 1;
    } finally {
      stack.abortSignal?.removeEventListener("abort", abortRun);
      this.children.delete(pid);
      stack.processes.delete(pid);
    }
  }

  private assertWorkersRunning(stack: E2eStack): void {
    const servicesAreRunning = ["api", "worker", "frontend"].every(name => this.services.get(name)?.exitCode === null);
    if (!servicesAreRunning || stack.abortSignal?.aborted) throw new Error("E2E services failed during startup");
  }
}

function validateLocalDatabaseUrl(value: string): void {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("E2E admin database URL is invalid"); }
  if (!(["postgresql:", "postgres:"].includes(url.protocol)
    && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    && url.pathname === "/postgres")) throw new Error("E2E admin database URL must target the local postgres administrative database");
}

function copyOverride(source: NodeJS.ProcessEnv, target: NodeJS.ProcessEnv, from: string, to: string): void {
  if (source[from]) target[to] = source[from];
}

async function reservePort(): Promise<number> {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not reserve an E2E port");
  await new Promise<void>((resolveClose, reject) => server.close(error => error ? reject(error) : resolveClose()));
  return address.port;
}

async function waitForHttp(url: string, stack: E2eStack, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline && !stack.abortSignal?.aborted) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) return;
    } catch { /* Keep waiting until the bounded readiness deadline. */ }
    await new Promise(resolveDelay => setTimeout(resolveDelay, POLL_INTERVAL_MS));
  }
  throw new Error("E2E service did not become ready");
}

async function stopProcessGroup(pid: number, child: ChildProcess): Promise<void> {
  try { process.kill(-pid, "SIGTERM"); } catch { return; }
  await Promise.race([once(child, "close").then(() => undefined), delay(SHUTDOWN_TIMEOUT_MS)]);
  if (child.exitCode === null) {
    try { process.kill(-pid, "SIGKILL"); } catch { /* The process may have exited during shutdown. */ }
    await Promise.race([once(child, "close").then(() => undefined), delay(SHUTDOWN_TIMEOUT_MS)]);
  }
}

async function removeOwnedStorage(storageDir: string, runId: string): Promise<void> {
  const root = resolve(tmpdir());
  const path = resolve(storageDir);
  const ownedPrefix = `carbonbox-e2e-${runId}-`;
  if (dirname(path) !== root || !basename(path).startsWith(ownedPrefix)) {
    throw new Error("Refusing to remove an unowned storage directory");
  }
  await rm(path, { recursive: true, force: true });
}

function delay(milliseconds: number): Promise<void> {
  return new Promise(resolveDelay => setTimeout(resolveDelay, milliseconds));
}
