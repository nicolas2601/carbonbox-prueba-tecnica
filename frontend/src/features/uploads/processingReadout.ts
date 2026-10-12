export interface RowObservation { id: string; handled: number; at: number; rate?: number; }

export function observeHandledRows(previous: RowObservation | null, current: Omit<RowObservation, "rate">): RowObservation {
  if (!previous || previous.id !== current.id || current.handled < previous.handled) return current;
  const elapsedMs = current.at - previous.at;
  const rate = current.handled !== previous.handled && elapsedMs > 0
    ? Math.round((current.handled - previous.handled) / (elapsedMs / 1000))
    : undefined;
  return { ...current, rate };
}

export function elapsedLabel(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds === 0 ? `${minutes}m` : `${minutes}m ${remainingSeconds}s`;
}
