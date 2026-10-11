import type { Upload } from "@/lib/api/models";
import { numberFormatter } from "@/lib/format";
import { ProgressBar } from "@/components/ProgressBar";

export function ActivePanel({ upload }: { upload: Upload }) {
  if (upload.status === "PENDING") return <section className="state-card space-y-6">
    <h2 className="font-display text-[28px]">Waiting for a worker</h2>
    <p className="text-sm text-ink-muted">Your file is safely queued. Processing starts when a worker is ready.</p>
    <ProgressBar label="Waiting for worker" detail="Queued" />
  </section>;
  if (upload.status !== "PROCESSING") return null;
  const handled = (upload.processedRows ?? 0) + (upload.failedRows ?? 0);
  return <section className="state-card space-y-6">
    <h2 className="font-display text-[28px]">Checking your activity data</h2>
    <p className="text-sm text-ink-muted">Each row is checked before it is kept. The total is known when processing finishes.</p>
    <ProgressBar label="Processing file" detail={`${numberFormatter.format(handled)} rows handled`} />
  </section>;
}
