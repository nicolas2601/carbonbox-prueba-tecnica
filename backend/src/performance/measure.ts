export const MEASUREMENT_ERROR = new Error("Invalid performance measurement");
export function percentile(values: readonly number[], rank: number): number {
  if (!values.length || !Number.isFinite(rank) || rank <= 0 || rank > 1 || values.some(value => !Number.isFinite(value) || value < 0)) throw MEASUREMENT_ERROR;
  const sorted = [...values].sort((a, b) => a - b);
  const result = sorted[Math.ceil(sorted.length * rank) - 1];
  if (result === undefined) throw MEASUREMENT_ERROR;
  return result;
}
export async function measure<T>(execute: () => Promise<T>, clock: () => number): Promise<{ value: T; elapsedMs: number }> {
  const start = clock();
  const value = await execute();
  const elapsedMs = clock() - start;
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) throw MEASUREMENT_ERROR;
  return { value, elapsedMs };
}
