import type { Upload } from "@/lib/api/models";
import { numberFormatter } from "@/lib/format";
import { elapsedLabel } from "./processingReadout";

export function ActivePanel({ upload, rowsPerSecond, elapsedSeconds }: { upload: Upload; rowsPerSecond?: number; elapsedSeconds?: number }) {
  if (upload.status === "PENDING") return <section className="state-card space-y-6">
    <h2 className="font-display text-[28px]">Waiting for a worker</h2>
    <p className="text-sm text-ink-muted">Your file is safely queued. Processing starts when a worker is ready.</p>
    <p className="text-sm">Waiting for worker · Queued</p>
  </section>;
  if (upload.status !== "PROCESSING") return null;
  const handled = (upload.processedRows ?? 0) + (upload.failedRows ?? 0);
  return <section className="state-card space-y-6">
    <h2 className="font-display text-[28px]">Processing your activity data</h2>
    <dl className="processing-readout">
      <div><dt>Rows handled</dt><dd className="font-mono tabular-nums">{numberFormatter.format(handled)}</dd></div>
      <div><dt>Elapsed</dt><dd>{elapsedLabel(elapsedSeconds ?? 0)}</dd></div>
      {rowsPerSecond !== undefined && <div><dt>Approx. processing rate</dt><dd className="font-mono tabular-nums">{numberFormatter.format(rowsPerSecond)} rows/s</dd></div>}
    </dl>
    <p className="text-sm text-ink-muted">Total unknown until the file ends.</p>
  </section>;
}
