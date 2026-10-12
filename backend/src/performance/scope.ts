import { lstat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname } from "node:path";

export const SAFETY_ERROR = new Error("Performance targets must be local and owned");
const PREFIX = "carbonbox_perf_";
const MAX_NAME_LENGTH = 63;
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]"];

function localUrl(value: string | undefined): URL {
  if (!value) throw SAFETY_ERROR;
  let url: URL;
  try { url = new URL(value); } catch { throw SAFETY_ERROR; }
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !LOCAL_HOSTS.includes(url.hostname) || url.search || url.hash) throw SAFETY_ERROR;
  return url;
}
export function databaseName(runId: string): string {
  if (!new RegExp(`^[a-z0-9_]{1,${MAX_NAME_LENGTH - PREFIX.length}}$`).test(runId)) throw SAFETY_ERROR;
  return `${PREFIX}${runId}`;
}
export function adminUrl(value: string | undefined): string {
  const url = localUrl(value);
  if (url.pathname !== "/postgres") throw SAFETY_ERROR;
  return url.toString();
}
export function ownedUrl(value: string, runId: string): string {
  const url = localUrl(value);
  if (url.pathname !== `/${databaseName(runId)}`) throw SAFETY_ERROR;
  return url.toString();
}
export async function assertStorage(path: string, runId: string): Promise<void> {
  databaseName(runId);
  if (dirname(path) !== tmpdir() || !basename(path).startsWith(`carbonbox-perf-${runId}-`)) throw SAFETY_ERROR;
  const info = await lstat(path);
  if (!info.isDirectory() || info.isSymbolicLink()) throw SAFETY_ERROR;
}
