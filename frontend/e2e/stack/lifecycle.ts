import { randomBytes } from "node:crypto";

export interface E2eStack {
  readonly runId: string;
  readonly processes: Set<number>;
  abortSignal?: AbortSignal;
  apiUrl?: string;
  baseURL?: string;
  databaseName?: string;
  databaseOwned: boolean;
  databaseUrl?: string;
  storageDir?: string;
}

export interface StackLifecycle {
  prepare(stack: E2eStack): Promise<void>;
  runTests(stack: E2eStack): Promise<number>;
  teardown(stack: E2eStack): Promise<void>;
}

export interface LifecycleResult { exitCode: number; failure?: "startup" | "tests" | "teardown"; }

export function createRunId(): string {
  return `${process.pid}_${Date.now().toString(36)}_${randomBytes(8).toString("hex")}`;
}

export function getOwnedBaseURL(environment: NodeJS.ProcessEnv): string {
  const baseURL = environment.E2E_BASE_URL;
  const databaseURL = environment.E2E_DATABASE_URL;
  const ownedDatabase = environment.E2E_STACK_OWNED;
  if (!baseURL || !databaseURL || !ownedDatabase || !/^carbonbox_e2e_[A-Za-z0-9_]{1,40}$/.test(ownedDatabase)) {
    throw new Error("Playwright requires an owned E2E stack");
  }

  try {
    const base = new URL(baseURL);
    const database = new URL(databaseURL);
    const loopbackHosts = ["localhost", "127.0.0.1", "[::1]"];
    if (base.protocol !== "http:" || !loopbackHosts.includes(base.hostname) || !base.port
      || !["postgres:", "postgresql:"].includes(database.protocol)
      || !loopbackHosts.includes(database.hostname) || database.pathname !== `/${ownedDatabase}`) {
      throw new Error("Playwright requires an owned E2E stack");
    }
    return base.toString().replace(/\/$/, "");
  } catch {
    throw new Error("Playwright requires an owned E2E stack");
  }
}

export function isOwnedDatabaseName(name: string, runId: string): boolean {
  return /^[A-Za-z0-9_-]{1,48}$/.test(runId)
    && name.length <= 63
    && name === `carbonbox_e2e_${runId}`;
}

export async function runE2eLifecycle(
  lifecycle: StackLifecycle,
  runId = createRunId(),
  abortSignal?: AbortSignal,
): Promise<LifecycleResult> {
  const stack: E2eStack = { runId, processes: new Set(), databaseOwned: false, abortSignal };
  let exitCode = 1;
  let failure: LifecycleResult["failure"];

  try {
    await lifecycle.prepare(stack);
    if (abortSignal?.aborted) throw new Error("E2E run interrupted");
    exitCode = await lifecycle.runTests(stack);
    if (exitCode !== 0) failure = "tests";
  } catch {
    failure = failure ?? "startup";
  }

  try {
    await lifecycle.teardown(stack);
  } catch {
    failure = "teardown";
    exitCode = 1;
  }

  if (failure && exitCode === 0) exitCode = 1;
  return { exitCode, failure };
}
