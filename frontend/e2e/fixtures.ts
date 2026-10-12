import { createRequire } from "node:module";
import { readdir, rm } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { expect, test as base, type APIRequestContext } from "@playwright/test";
import { getOwnedBaseURL } from "./stack/lifecycle";

interface DatabaseClient { connect(): Promise<void>; end(): Promise<void>; query(sql: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>; }
const backendRequire = createRequire(new URL("../../backend/package.json", import.meta.url));

async function resetOwnedStack(request: APIRequestContext): Promise<void> {
  getOwnedBaseURL(process.env);
  const api = process.env.E2E_API_URL!;
  await expect.poll(async () => (await (await request.get(`${api}/api/v1/uploads/stats`)).json()).inProgress).toBe(0);
  const { Client } = backendRequire("pg") as { Client: new (options: { connectionString: string }) => DatabaseClient };
  const client = new Client({ connectionString: process.env.E2E_DATABASE_URL! });
  try {
    await client.connect();
    const actual = await client.query("SELECT current_database() AS name");
    if (actual.rows[0].name !== process.env.E2E_STACK_OWNED) throw new Error("Refusing unsafe E2E reset");
    await client.query('TRUNCATE "jobs", "activity_data", "uploads" CASCADE');
  } finally { await client.end(); }
  const storage = resolve(process.env.E2E_STORAGE_DIR!);
  const runId = process.env.E2E_STACK_OWNED!.slice("carbonbox_e2e_".length);
  if (dirname(storage) !== resolve(tmpdir()) || !basename(storage).startsWith(`carbonbox-e2e-${runId}-`)) throw new Error("Refusing unsafe E2E storage reset");
  for (const entry of await readdir(storage)) await rm(join(storage, entry), { force: true });
}

export const test = base.extend<{ ownedReset: void }>({
  ownedReset: [async ({ request }, use) => { await resetOwnedStack(request); await use(); }, { auto: true }],
});
export { expect };
