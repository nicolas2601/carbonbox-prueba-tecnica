import Link from "next/link";
import type { Upload } from "@/lib/api/models";
import { FileWarning } from "lucide-react";

export function FailedPanel({ upload }: { upload: Upload }) {
  return <section className="state-card failed-panel space-y-6">
    <FileWarning aria-hidden="true" size={32} strokeWidth={1.5} />
    <h2 className="font-display text-[28px]">This file could not be processed</h2>
    <p className="text-sm text-ink-muted break-words">{upload.errorMessage ?? "Check the CSV headers and data, then upload a corrected file."}</p>
    <Link className="button" data-tone="primary" href="/uploads/new">Upload another file</Link>
  </section>;
}
