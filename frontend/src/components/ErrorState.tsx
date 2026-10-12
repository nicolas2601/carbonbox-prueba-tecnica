import type { ApiError } from "@/lib/api/ApiError";
import { Button } from "./Button";

export function ErrorState({ error, onRetry, title = "We couldn't load your data" }: { error: ApiError; onRetry(): void | Promise<unknown>; title?: string }) {
  return <div className="state-card" role="alert">
    <h2 className="font-display text-[28px]">{title}</h2>
    <p className="mt-3 text-sm text-ink-muted">{error.message}</p>
    {error.requestId && <p className="mt-3 break-all font-mono text-xs text-ink-muted">Request {error.requestId}</p>}
    <div className="mt-6"><Button onClick={() => { void onRetry(); }}>Try again</Button></div>
  </div>;
}
