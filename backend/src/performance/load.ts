import autocannon from "autocannon";
import { percentile } from "./measure";

const CONNECTIONS = 20;
const DURATION_SECONDS = 15;
export async function load(url: string, signal: AbortSignal) {
  const target = new URL(url);
  if (target.protocol !== "http:" || target.hostname !== "127.0.0.1" || !target.port) throw new Error("Only the owned local API may be benchmarked");
  const samples: number[] = [];
  const raw = await new Promise<autocannon.Result>((resolve, reject) => {
    const instance = autocannon({ url, connections: CONNECTIONS, duration: DURATION_SECONDS, pipelining: 1,
      headers: { "accept-encoding": "gzip" } }, (error, result) => { if (error) reject(error); else resolve(result); });
    const stop = () => instance.stop();
    signal.addEventListener("abort", stop, { once: true });
    instance.on("response", (_client, _status, _bytes, milliseconds) => { samples.push(milliseconds); });
    instance.on("done", () => signal.removeEventListener("abort", stop));
    if (signal.aborted) stop();
  });
  if (signal.aborted || raw.errors || raw.non2xx || raw.timeouts) throw new Error("Load run interrupted or returned errors");
  return { raw, samples, milliseconds: { p50: percentile(samples, 0.5), p95: percentile(samples, 0.95), p99: percentile(samples, 0.99) } };
}
