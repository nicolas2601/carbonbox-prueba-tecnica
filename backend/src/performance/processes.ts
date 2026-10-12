import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { environment, type ChildSettings } from "./environment";
import { assertStorage } from "./scope";

export interface OwnedProcess { child: ChildProcess; lines: string[]; }
export async function port(): Promise<number> {
  const server = createServer();
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No local port allocated");
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return address.port;
}
export async function start(script: string, root: string, settings: ChildSettings): Promise<OwnedProcess> {
  await assertStorage(settings.storageDir, settings.runId);
  const child = spawn("bun", ["run", script], { cwd: root, env: environment(settings, process.env), detached: true, stdio: ["ignore", "pipe", "pipe"] });
  const lines: string[] = [];
  let pending = "";
  child.stdout?.on("data", (chunk: Buffer) => {
    const parts = (pending + chunk.toString()).split("\n");
    pending = parts.pop() ?? "";
    lines.push(...parts);
  });
  child.stderr?.on("data", (chunk: Buffer) => { lines.push(chunk.toString()); });
  await new Promise<void>((resolve, reject) => { child.once("spawn", resolve); child.once("error", reject); });
  return { child, lines };
}
export async function exit(process: OwnedProcess): Promise<void> {
  if (process.child.exitCode !== null) {
    if (process.child.exitCode !== 0) throw new Error("Owned command failed");
    return;
  }
  const code = await new Promise<number | null>(resolve => process.child.once("exit", resolve));
  if (code !== 0) throw new Error("Owned command failed");
}
export async function stop(process: OwnedProcess): Promise<void> {
  if (process.child.exitCode !== null || process.child.signalCode !== null || !process.child.pid) return;
  const closed = new Promise<void>(resolve => process.child.once("exit", () => resolve()));
  globalThis.process.kill(-process.child.pid, "SIGTERM");
  const timer = setTimeout(() => { if (process.child.exitCode === null && process.child.pid) globalThis.process.kill(-process.child.pid, "SIGKILL"); }, 5000);
  await closed;
  clearTimeout(timer);
}
